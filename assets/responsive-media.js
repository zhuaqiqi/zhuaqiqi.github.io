(() => {
  'use strict';
  const manifest = window.PORTFOLIO_MEDIA || {};
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
      img.setAttribute('src', source(img.getAttribute('src'), 960));
      img.setAttribute('srcset', item.variants.map(v => base + v.path + ' ' + v.width + 'w').join(', '));
      img.setAttribute('sizes', portrait ? '(max-width: 760px) 28vw, 240px' : card ? '(max-width: 700px) 90vw, (max-width: 1440px) 40vw, 550px' : thumbnail ? '(max-width: 700px) 43vw, 260px' : '(max-width: 700px) 90vw, 850px');
      img.setAttribute('width', item.width);
      img.setAttribute('height', item.height);
      img.dataset.previewSrc = base + item.variants.at(-1).path;
      img.setAttribute('loading', portrait ? 'eager' : 'lazy');
      img.setAttribute('fetchpriority', portrait ? 'high' : 'auto');
    });
    template.content.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (entry(href)) link.setAttribute('href', source(href));
    });
    template.content.querySelectorAll('video').forEach(video => {
      video.setAttribute('preload', 'none');
      if (video.hasAttribute('poster')) video.setAttribute('poster', source(video.getAttribute('poster'), 960));
    });
    template.content.querySelectorAll('[style*="--video-art"]').forEach(frame => {
      const match = frame.style.getPropertyValue('--video-art').match(/url\(['"]?(.*?)['"]?\)/);
      if (match) frame.style.setProperty('--video-art', 'url("' + source(match[1], 960) + '")');
    });
    return template.innerHTML;
  }
  window.PortfolioMedia = {enhance, source};
})();
