(() => {
  'use strict';
  if(window.PortfolioImageLoader)return;
  const started=new WeakSet(), keepAlive=new Map();
  function upgrade(img,attempt=0){
    if(!img.isConnected||!img.dataset.mediaSrc)return;
    if(attempt===0&&started.has(img))return;
    started.add(img);
    const next=new Image();keepAlive.set(img,next);
    next.decoding='async';next.fetchPriority=img.dataset.mediaPriority||'auto';
    next.onload=()=>{
      if(!img.isConnected){keepAlive.delete(img);return;}
      img.src=next.currentSrc||next.src;
      img.dataset.mediaReady='true';keepAlive.delete(img);
    };
    next.onerror=()=>{
      keepAlive.delete(img);
      if(attempt===0)setTimeout(()=>upgrade(img,1),1200);
    };
    if(attempt===0&&img.dataset.mediaSrcset){next.sizes=img.dataset.mediaSizes;next.srcset=img.dataset.mediaSrcset;}
    next.src=attempt?img.dataset.mediaFallback:img.dataset.mediaSrc;
  }
  function load(root=document){
    if(window.__PORTFOLIO_PRERENDER__)return;
    const dialog=root.closest?.('dialog');
    let observer;
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{if(entry.isIntersecting){upgrade(entry.target);observer.unobserve(entry.target);}});
      },{root:dialog||null,rootMargin:'600px 0px'});
    }
    root.querySelectorAll('img[data-media-src]').forEach(img=>{
      if(img.dataset.mediaEager==='true'||!observer)upgrade(img);else observer.observe(img);
    });
    root.querySelectorAll('video[data-media-poster]').forEach(video=>{
      if(started.has(video))return;started.add(video);
      const poster=new Image();keepAlive.set(video,poster);
      poster.onload=()=>{if(video.isConnected)video.poster=poster.currentSrc||poster.src;keepAlive.delete(video);};
      poster.onerror=()=>keepAlive.delete(video);poster.src=video.dataset.mediaPoster;
    });
  }
  window.PortfolioImageLoader={load};
})();
