(() => {
  'use strict';
  const manifest = window.PORTFOLIO_MEDIA || {};
  const previews = window.PORTFOLIO_PREVIEWS || {};
  function entry(src) {
    if (!src) return null;
    let url;
    try { url = new URL(src, document.baseURI); } catch { return null; }
    if (url.origin !== location.origin) return null;
    const marker = '/assets/';
    const index = url.pathname.lastIndexOf(marker);
    if (index < 0) return null;
    const item = manifest[decodeURIComponent(url.pathname.slice(index + marker.length))];
    if (!item) return null;
    const base = url.pathname.slice(0, index + marker.length);
    return {item, base};
  }
  function source(src, width = 1600) {
    const found = entry(src);
    if (!found) return src;
    const variant = found.item.variants.find(v => v.width >= width) || found.item.variants.at(-1);
    return found.base + variant.path;
  }
  function enhance(html) {
    // Template contents stay inert until srcset and image dimensions are ready.
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('img[src]').forEach(img => {
      const found = entry(img.getAttribute('src'));
      img.setAttribute('decoding', 'async');
      if (!found) return;
      const {item, base} = found;
      const portrait = img.closest('.editorial-portrait');
      const card = img.closest('.project');
      const thumbnail = img.closest('.series-posters,.case-archive-gallery,.feature-certificate');
      const original = decodeURIComponent(new URL(img.getAttribute('src'),document.baseURI).pathname.split('/assets/').at(-1));
      const choices = portrait||card ? item.variants.filter(v=>v.width<=960) : item.variants;
      const variants = choices.length?choices:[item.variants[0]];
      const sizes = portrait ? '(max-width: 760px) 28vw, 240px' : card ? '(max-width: 700px) 90vw, (max-width: 1440px) 40vw, 550px' : thumbnail ? '(max-width: 700px) 43vw, 260px' : '(max-width: 700px) 90vw, 850px';
      const full = base + (variants.find(v=>v.width>=960)||variants.at(-1)).path;
      const srcset = variants.map(v=>base+v.path+' '+v.width+'w').join(', ');
      if(previews[original]){
        img.setAttribute('src',previews[original]);
        img.dataset.mediaSrc=full;img.dataset.mediaSrcset=srcset;img.dataset.mediaSizes=sizes;
        img.dataset.mediaFallback=base+variants[0].path;
        img.dataset.mediaEager=String(!!(portrait||card));
        img.dataset.mediaPriority=portrait?'high':'auto';
      }else{
        img.setAttribute('src',full);img.setAttribute('srcset',srcset);img.setAttribute('sizes',sizes);
      }
      img.setAttribute('width', item.width);
      img.setAttribute('height', item.height);
      img.dataset.previewSrc = base + item.variants.at(-1).path;
      img.setAttribute('loading', portrait||card ? 'eager' : 'lazy');
      img.setAttribute('fetchpriority', portrait ? 'high' : 'auto');
    });
    template.content.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (entry(href)) link.setAttribute('href', source(href));
    });
    template.content.querySelectorAll('video').forEach(video => {
      video.setAttribute('preload', 'none');
      if(video.hasAttribute('poster')){
        const original=video.getAttribute('poster');
        const key=decodeURIComponent(new URL(original,document.baseURI).pathname.split('/assets/').at(-1));
        const full=source(original,960);
        video.setAttribute('poster',previews[key]||full);
        if(previews[key])video.dataset.mediaPoster=full;
      }
    });
    template.content.querySelectorAll('[style*="--video-art"]').forEach(frame => {
      const match = frame.style.getPropertyValue('--video-art').match(/url\(['"]?(.*?)['"]?\)/);
      if (match) frame.style.setProperty('--video-art', 'url("' + source(match[1], 960) + '")');
    });
    return template.innerHTML;
  }
  function activate(root){window.PortfolioImageLoader?.load(root);}
  function warmCovers(){
    if(window.__PORTFOLIO_PRERENDER__||navigator.connection?.saveData||['slow-2g','2g'].includes(navigator.connection?.effectiveType))return;
    const base=document.body.dataset.standalone?'assets/':'../assets/';
    const urls=[...new Set((window.PORTFOLIO?.projects||[]).map(p=>p.coverImage).filter(Boolean).map(path=>source(base+path,480)))];
    const warming=new Set();
    let cursor=0;
    const worker=()=>{
      if(cursor>=urls.length)return;
      const img=new Image();warming.add(img);img.fetchPriority='low';img.onload=img.onerror=()=>{warming.delete(img);worker();};img.src=urls[cursor++];
    };
    worker();worker();
  }
  if(!window.__PORTFOLIO_PRERENDER__)window.addEventListener('load',()=>setTimeout(warmCovers,800),{once:true});
  window.PortfolioMedia = {enhance, source, activate};
})();
