(() => {
  'use strict';
  function render(p,{edit,projectField,asset,external,esc,arrow}) {
    const v=p.presentation,prefix='projects.'+window.PORTFOLIO.projects.indexOf(p);
    const text=path=>edit(prefix+'.presentation.'+path,path.split('.').reduce((value,key)=>value?.[key],v));
    const photo=(index,kind='')=>{const item=p.images[index];return item&&asset(item.src)?`<figure class="case-image ${kind}"><a href="${esc(asset(item.src))}" target="_blank" rel="noopener" aria-label="查看${esc(item.alt)}原图"><img src="${esc(asset(item.src))}" alt="${esc(item.alt)}" loading="lazy"></a>${item.caption?`<figcaption>${edit(prefix+'.images.'+index+'.caption',item.caption)}</figcaption>`:''}</figure>`:'';};
    const video=(index,position)=>{const item=v.videos[index];return item&&asset(item.src)?`<section id="${esc(p.id)}-${position}-video" class="case-section series-video-section"><h3>${text('videos.'+index+'.title')}</h3><figure class="film-video"><div class="series-video-frame${item.posterLayout==='portrait'?' portrait-poster':''}" style="--video-art:url('${esc(asset(item.poster))}')"><video controls controlslist="nodownload" playsinline preload="none" poster="${esc(asset(item.poster))}" aria-label="戏妖${esc(item.title)}"><source src="${esc(asset(item.src))}" type="video/mp4">当前浏览器暂不支持播放此视频。</video></div><figcaption>${text('videos.'+index+'.caption')}</figcaption></figure></section>`:'';};
    return `<div data-case-project="${esc(p.id)}" class="dialog-copy project-case series-case">
      <header class="series-intro"><p class="dialog-category">${esc(p.category)}</p><div class="series-title-row"><div><h2 id="dialog-title">${text('displayTitle')}</h2><p class="series-form">${text('form')}</p></div><a class="case-small-link" href="${esc(external(p.url))}" target="_blank" rel="noopener noreferrer">${text('watchLabel')} ${arrow}</a></div><dl class="case-facts"><div><dt>${text('roleLabel')}</dt><dd>${projectField(p,'role')}</dd></div><div><dt>${text('statusLabel')}</dt><dd>${projectField(p,'releaseStatus')}</dd></div></dl></header>
      ${video(0,'opening')}
      <section id="${esc(p.id)}-introduction" class="case-section"><h3>${text('introductionTitle')}</h3><p>${text('introduction')}</p><div class="series-world-image">${photo(v.worldImage)}</div><p>${text('concept')}</p><div class="case-stage-gallery series-stills series-character-gallery" aria-label="戏曲角色画面">${v.characterImages.map(i=>photo(i)).join('')}</div></section>
      <section id="${esc(p.id)}-visuals" class="case-section"><h3>${text('visualTitle')}</h3><p>${text('visualIntro')}</p><div class="case-stage-gallery series-stills">${v.visualImages.map(i=>photo(i)).join('')}</div><p class="series-visual-description">${text('visualDescription')}</p></section>
      <section id="${esc(p.id)}-release" class="case-section"><h3>${text('releaseTitle')}</h3><div class="case-stage-gallery series-evidence">${v.releaseImages.map(i=>photo(i)).join('')}</div></section>
      <section id="${esc(p.id)}-posters" class="case-section"><h3>${text('posterTitle')}</h3><div class="series-posters">${v.posterImages.map(i=>photo(i)).join('')}</div></section>
      <section id="${esc(p.id)}-records" class="case-section"><h3>${text('recordsTitle')}</h3><ul class="simple-records series-records">${v.records.map((item,i)=>`<li><span class="series-record-status">${text('records.'+i+'.status')}</span><h4>${text('records.'+i+'.title')}</h4></li>`).join('')}</ul><details class="series-details"><summary>${text('participationsTitle')}</summary><ul class="series-participations">${v.participations.map((item,i)=>`<li>${text('participations.'+i)}</li>`).join('')}</ul></details></section>
      <section id="${esc(p.id)}-story" class="case-section"><h3>${text('storyTitle')}</h3><p>${text('story')}</p></section>
      <section id="${esc(p.id)}-accounts" class="case-section"><h3>${text('accountsTitle')}</h3><div class="series-accounts">${v.accountImages.map(i=>photo(i)).join('')}</div></section>
      <section id="${esc(p.id)}-resources" class="case-section"><h3>${text('resourcesTitle')}</h3><div class="case-resources">${p.attachments.filter(item=>asset(item.path)).map((item,i)=>`<div><a href="${esc(asset(item.path))}" target="_blank" rel="noopener">${edit(prefix+'.attachments.'+i+'.title',item.title)} ${arrow}</a></div>`).join('')}${v.reports.map((item,i)=>`<div><a href="${esc(external(item.url))}" target="_blank" rel="noopener noreferrer">${text('reports.'+i+'.title')} ${arrow}</a></div>`).join('')}</div></section>
      ${video(1,'closing')}
    </div>`;
  }
  window.PortfolioSeries={render};
})();
