(() => {
  'use strict';
  const detail = document.getElementById('project-dialog');
  if (!detail) return;
  const imageFile = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i;
  const preview = document.createElement('dialog');
  preview.id = 'image-preview';
  preview.setAttribute('aria-label', '图片预览');
  preview.innerHTML = '<div class="image-preview-toolbar"><button type="button" autofocus>关闭预览</button></div><figure><img alt="" draggable="false"><figcaption></figcaption></figure>';
  document.body.append(preview);
  const image = preview.querySelector('img');
  const caption = preview.querySelector('figcaption');
  let returnFocus;

  function prepare() {
    detail.querySelectorAll('a[href]').forEach(link => {
      if (!imageFile.test(link.getAttribute('href'))) return;
      link.removeAttribute('target');
      link.setAttribute('aria-haspopup', 'dialog');
      link.dataset.imagePreview = 'true';
      const photo = link.querySelector('img');
      link.setAttribute('aria-label', '预览' + (photo?.alt || link.textContent.trim() || '图片'));
    });
    detail.querySelectorAll('img').forEach(photo => {
      photo.draggable = false;
      if (photo.closest('a')) return;
      photo.tabIndex = 0;
      photo.setAttribute('role', 'button');
      photo.setAttribute('aria-haspopup', 'dialog');
      photo.setAttribute('aria-label', '预览' + (photo.alt || '图片'));
    });
  }

  function open(target) {
    const link = target.closest('a[data-image-preview]');
    const photo = link?.querySelector('img') || target.closest('img');
    const src = photo?.dataset.previewSrc || window.PortfolioMedia?.source(link?.getAttribute('href')) || link?.getAttribute('href') || photo?.currentSrc || photo?.src;
    if (!src || !detail.open) return;
    returnFocus = link || photo;
    image.src = src;
    image.alt = photo?.alt || link?.textContent.trim() || '作品图片';
    caption.textContent = returnFocus.closest('figure')?.querySelector('figcaption')?.textContent.trim() || image.alt;
    preview.showModal();
  }

  detail.addEventListener('click', event => {
    if (event.defaultPrevented || event.target.closest('[contenteditable="true"]')) return;
    const target = event.target.closest('a[data-image-preview], img');
    if (!target) return;
    event.preventDefault();
    open(target);
  });
  detail.addEventListener('keydown', event => {
    if (!event.target.matches('img[role="button"]') || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    open(event.target);
  });
  preview.querySelector('button').addEventListener('click', () => preview.close());
  preview.addEventListener('click', event => {
    if (event.target !== preview) return;
    const rect = preview.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) preview.close();
  });
  preview.addEventListener('close', () => {
    image.removeAttribute('src');
    if (detail.open && returnFocus?.isConnected) returnFocus.focus({preventScroll: true});
  });
  detail.addEventListener('close', () => { if (preview.open) preview.close(); });
  document.addEventListener('portfolio:dialog-open', prepare);
  new MutationObserver(prepare).observe(detail, {childList: true, subtree: true});
  prepare();
})();
