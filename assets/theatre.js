(() => {
  'use strict';
  function render(p,{edit,projectField,asset,external,esc,arrow}) {
    const v=p.presentation,prefix='projects.'+window.PORTFOLIO.projects.indexOf(p);
    const text=(path)=>edit(prefix+'.presentation.'+path,path.split('.').reduce((value,key)=>value?.[key],v));
    const image=(index,className='')=>{
      const item=p.images[index];if(!item||!asset(item.src))return '';
      return `<figure class="case-image ${className}"><a href="${esc(asset(item.src))}" target="_blank" rel="noopener" aria-label="查看${esc(item.alt)}原图"><img src="${esc(asset(item.src))}" alt="${esc(item.alt)}" loading="lazy"></a><figcaption>${edit(prefix+'.images.'+index+'.caption',item.caption)}</figcaption></figure>`;
    };
    const hero=p.images[v.heroImage];
    return `<figure class="case-hero"><img src="${esc(asset(hero.src))}" alt="${esc(hero.alt)}"><div class="case-hero-title"><p>${esc(p.category)} · ${projectField(p,'year')}</p><h2 id="dialog-title">${projectField(p,'title')}</h2><p class="case-form">${text('form')}</p></div><a class="case-original-image" href="${esc(asset(hero.src))}" target="_blank" rel="noopener">查看剧照原图 ${arrow}</a></figure>
      <div class="dialog-copy project-case carnivore-case">
        <div class="case-introduction"><dl class="case-facts"><div><dt>${text('roleLabel')}</dt><dd>${projectField(p,'role')}</dd></div><div><dt>${text('lengthLabel')}</dt><dd>${projectField(p,'length')}</dd></div><div><dt>${text('sizeLabel')}</dt><dd>${text('scriptSize')}</dd></div></dl><p class="case-lede">${projectField(p,'summary')}</p><p class="case-award-label">${text('awardLabel')}</p></div>
        <nav class="case-nav" aria-label="肉食动物详情导航">${[['story','navStory'],['timeline','navTimeline'],['gallery','navGallery'],['archive','navArchive'],['resources','navResources']].map(([id,label])=>`<a href="#carnivore-${id}" data-case-anchor="carnivore-${id}">${text(label)}</a>`).join('')}</nav>
        <section id="carnivore-story" class="case-section"><h3>${text('storyTitle')}</h3><p>${text('storyIntro')}</p><p>${text('storyFocus')}</p><details class="case-synopsis"><summary>${text('synopsisLabel')}</summary><div>${v.synopsis.map((_,i)=>`<p>${text('synopsis.'+i)}</p>`).join('')}</div></details><div class="case-themes">${v.themes.map((_,i)=>`<article><h4>${text('themes.'+i+'.title')}</h4><p>${text('themes.'+i+'.text')}</p></article>`).join('')}</div><blockquote><p>“${text('quote')}”</p><cite>${text('quoteCredit')}</cite></blockquote></section>
        <section id="carnivore-timeline" class="case-section"><h3>${text('timelineTitle')}</h3><div class="case-records"><ol class="case-timeline">${v.timeline.map((_,i)=>`<li><time>${text('timeline.'+i+'.date')}</time><h4>${text('timeline.'+i+'.title')}</h4><p>${text('timeline.'+i+'.text')}</p></li>`).join('')}</ol><aside class="case-certificate">${image(v.certificateImage)}<a class="case-small-link" href="${esc(asset(p.images[v.certificateImage].src))}" target="_blank" rel="noopener">${text('certificateLabel')} ${arrow}</a></aside></div></section>
        <section id="carnivore-gallery" class="case-section"><h3>${text('galleryTitle')}</h3><div class="case-stage-gallery">${v.stageImages.map(i=>image(i)).join('')}</div></section>
        <section id="carnivore-archive" class="case-section"><h3>${text('archiveTitle')}</h3><p>${text('archiveIntro')}</p><div class="case-archive-gallery">${v.archiveImages.map(i=>image(i)).join('')}</div>${image(v.teamImage,'case-team')}</section>
        <section id="carnivore-resources" class="case-section"><h3>${text('resourcesTitle')}</h3><div class="case-resources">${p.attachments.filter(file=>asset(file.path)).map((file,i)=>`<div><a href="${esc(asset(file.path))}" target="_blank" rel="noopener">${edit(prefix+'.attachments.'+i+'.title',file.title)} ${arrow}</a></div>`).join('')}${p.videoLinks.filter(link=>external(link.url)).map((link,i)=>`<div><a href="${esc(external(link.url))}" target="_blank" rel="noopener noreferrer">${edit(prefix+'.videoLinks.'+i+'.title',link.title)} ${arrow}</a>${link.password?`<span class="case-password">提取码：${edit(prefix+'.videoLinks.'+i+'.password',link.password)}</span>`:''}</div>`).join('')}</div></section>
        <a class="text-link case-contact" href="mailto:${esc(window.PORTFOLIO.email)}?subject=${encodeURIComponent('关于《'+p.title+'》的交流')}">${edit('page.contactAuthor',window.PORTFOLIO.page.contactAuthor)} ${arrow}</a>
      </div>`;
  }
  window.PortfolioTheatre={render};
})();
