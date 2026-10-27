(() => {
  'use strict';
  const rawFile=/\.(?:pdf|docx?|zip)(?:[?#]|$)/i;
  const element=node=>node?.nodeType===1?node:node?.parentElement;
  const contact=node=>element(node)?.closest('#contact [data-copy-contact]');
  function selectedContact() {
    const selection=window.getSelection();
    if(!selection?.rangeCount||selection.isCollapsed)return false;
    const allowed=contact(selection.anchorNode);
    return !!allowed&&allowed===contact(selection.focusNode)&&Array.from({length:selection.rangeCount},(_,i)=>selection.getRangeAt(i)).every(r=>allowed.contains(r.startContainer)&&allowed.contains(r.endContainer));
  }
  function refresh() {
    document.querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href')||'';
      if(rawFile.test(href)||a.hasAttribute('download'))a.remove();
    });
    document.querySelectorAll('.actions button[onclick*="print"]').forEach(b=>b.remove());
    document.querySelectorAll('video').forEach(v=>v.setAttribute('controlslist','nodownload'));
  }
  ['copy','cut'].forEach(name=>document.addEventListener(name,event=>{if(!selectedContact())event.preventDefault();},true));
  document.addEventListener('contextmenu',event=>{if(!contact(event.target))event.preventDefault();},true);
  document.addEventListener('dragstart',event=>{if(!contact(event.target))event.preventDefault();},true);
  document.addEventListener('selectstart',event=>{
    if(contact(event.target))return;
    if(document.body.classList.contains('text-editing')&&element(event.target)?.closest('[contenteditable]'))return;
    event.preventDefault();
  },true);
  document.addEventListener('keydown',event=>{
    if(!(event.ctrlKey||event.metaKey))return;
    const key=event.key.toLowerCase();
    if(key==='s'||key==='p'){event.preventDefault();return;}
    if(key==='a'){
      const allowed=contact(event.target);
      if(allowed){event.preventDefault();const range=document.createRange();range.selectNodeContents(allowed);const s=window.getSelection();s.removeAllRanges();s.addRange(range);return;}
      if(document.body.classList.contains('text-editing')&&element(event.target)?.closest('[contenteditable]'))return;
      event.preventDefault();
    }
  },true);
  document.addEventListener('click',async event=>{
    if(!element(event.target)?.closest('#copy-phone'))return;
    const value=document.querySelector('#contact [data-copy-contact="phone"]')?.textContent||'';
    const phone=value.match(/(?:\+?86[- ]?)?1[3-9]\d{9}/)?.[0];
    if(!phone)return;
    try{await navigator.clipboard.writeText(phone);document.getElementById('copy-status').textContent='手机号已复制';}
    catch{document.getElementById('copy-status').textContent='可选中手机号复制。';}
  });
  window.PortfolioReading={refresh};
  const init=()=>{refresh();new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
