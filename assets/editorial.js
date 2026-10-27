(() => {
  'use strict';
  const d = window.PORTFOLIO;
  // Apply the new section labels after the editor has restored the user's draft.
  if(!d.page.educationTitle.trim()) {
    d.page.educationTitle='教育经历';
    const heading=d.layout?.fields['resume:page.educationTitle'];
    if(heading)delete heading.hidden;
  }
  if(d.page.awardsTitle==='获奖与入围')d.page.awardsTitle='获奖经历';
  const base = document.body.dataset.standalone ? 'assets/' : '../assets/';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const edit = (path, value, placeholder='') => `<span data-edit="${esc(path)}"${placeholder?` data-placeholder="${esc(placeholder)}"`:''}>${esc(value)}</span>`;
  const page = key => edit('page.' + key, d.page[key]);
  const projectField = (p, key) => edit('projects.' + d.projects.indexOf(p) + '.' + key, p[key]);
  const refreshEditable = () => { if(window.PortfolioEditor)window.PortfolioEditor.refresh(); else window.PortfolioLayout?.refresh(); };
  const arrow = '';
  const asset = path => {
    if (!path) return '';
    if(path==='resume.pdf')path='documents/resume-reader.html';
    if(/\.(?:pdf|docx?|zip)(?:[?#]|$)/i.test(path))return '';
    if (/^https?:\/\//i.test(path)) return path;
    if (/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(path) || path.split('/').includes('..')) return '';
    return base + path;
  };
  const external = url => /^https?:\/\//i.test(url || '') ? url : '';
  const pdf = asset('documents/resume-reader.html');
  const cover = (p, detail = false) => {
    const image = asset(p.coverImage);
    return image
      ? `<div class="work-image"><img src="${esc(image)}" alt="${detail ? esc(p.coverAlt || p.title) : ''}" loading="lazy">${p.coverTitle?`<div class="work-cover-title">${projectField(p,'coverTitle')}</div>`:''}</div>`
      : `<div class="poster ${esc(p.cover)}" aria-hidden="true"><div class="poster-title">${projectField(p, 'title')}</div></div>`;
  };
  const card = p => `<button type="button" class="project" data-project="${esc(p.id)}" aria-haspopup="dialog">${cover(p)}<div class="project-info"><h3>${projectField(p, 'title')}</h3>${arrow}</div><p class="work-meta">${esc(p.category)}${p.role ? ' · ' : ''}${projectField(p, 'role')}</p>${p.releaseStatus?`<p class="work-release">${projectField(p, 'releaseStatus')}</p>`:''}<p class="work-summary">${projectField(p, 'summary')}</p></button>`;
  const categories = d.projectCategories || [...new Set(d.projects.map(p => p.category))];
  const initialCategory = categories[0];
  const renderProjects = category => d.projects.filter(p => p.category === category).map(card).join('');
  document.getElementById('site').innerHTML = `
    <header class="nav"><a class="brand" href="#" aria-label="赵佳琦，返回首页">${edit('name', d.name)}<span class="name-dot" aria-hidden="true">。</span></a><nav aria-label="主导航"><a href="#about">${page('navAbout')}</a><a href="#resume">${page('navResume')}</a><a href="#works">${page('navWorks')}</a><a href="#contact">${page('navContact')}</a></nav></header>
    <main id="main">
      <section class="hero editorial-hero">
        <div class="editorial-main"><p class="hero-role">${page('role')}</p><h1>${page('headline')}</h1><div class="editorial-intro"><p>${page('intro')}<br>${edit('education', d.education)}<br>${edit('shortDegree', d.shortDegree || d.degree)}</p><div class="hero-actions"><a class="button" href="#works">${page('viewWorks')} ${arrow}</a><a class="text-link" href="${esc(pdf)}" target="_blank" rel="noopener">${page('readResume')} ${arrow}</a></div></div></div>
        <figure class="editorial-portrait"><img src="${esc(asset('portrait.jpg'))}" alt="${esc(d.name)}的个人肖像" fetchpriority="high"></figure>
      </section>
      <section id="about" class="about section"><div class="section-heading"><h2>${page('aboutTitle')}</h2></div><div class="about-copy"><p class="lead">${edit('bio', d.bio)}</p><p>${page('practice')}</p></div></section>
      <section id="resume" class="resume section">
        <div class="section-heading"><h2>${page('resumeTitle')}</h2></div>
        <div class="resume-grid">
          <div class="resume-part resume-education" role="group" aria-labelledby="education-heading">
            <h3 id="education-heading" class="subheading">${page('educationTitle')}</h3>
            <div class="education-card">
              <p class="study-date">${edit('dates', d.dates)}</p>
              <div class="education-main"><h4>${edit('education', d.education)}</h4><p class="study-degree">${edit('degree', d.degree)}</p>
                <div class="education-highlights"><span class="gpa">GPA ${edit('gpa', d.gpa)}</span><span class="language">${edit('language', d.language)}</span></div>
                <p class="education-courses"><strong>${page('coursesTitle')}：</strong>${d.courses.map((c,i) => `<span class="course-item${i===d.courses.length-1?' last-course':''}">${edit('courses.' + i,c)}</span>`).join('')}</p>
              </div>
            </div>
            ${d.undergraduate?`<div class="education-card undergraduate-card"><p class="study-date">${edit('undergraduate.dates',d.undergraduate.dates)}</p><div class="education-main"><h4>${edit('undergraduate.education',d.undergraduate.education)}</h4><p class="study-degree">${edit('undergraduate.degree',d.undergraduate.degree)}</p><div class="education-highlights"><span class="gpa">GPA ${edit('undergraduate.gpa',d.undergraduate.gpa)}</span></div></div></div>`:''}
          </div>
          <div class="resume-part resume-awards" role="group" aria-labelledby="awards-heading">
            <h3 id="awards-heading" class="subheading">${page('awardsTitle')}</h3>
            <div class="awards">${d.awards.map(([date,title,note],i) => `<article class="award-entry"><time>${edit('awards.' + i + '.0', date,'填写获奖时间')}</time><div class="award-copy"><h4>${edit('awards.' + i + '.1', title,'填写奖项名称')}</h4><p>${edit('awards.' + i + '.2', note,'填写作品、奖项等级或获奖说明')}</p></div></article>`).join('')}</div>
          </div>
        </div>
      </section>
      <section id="works" class="works section"><div class="section-heading"><h2>${page('worksTitle')}</h2></div><div class="filters" role="group" aria-label="按作品类型筛选">${categories.map((c,i) => `<button type="button" data-filter="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join('')}</div><p class="sr-only" id="filter-status" role="status"></p><div class="projects">${renderProjects(initialCategory)}</div><details class="source-note"><summary>${page('sourceTitle')}</summary><p>${page('sourceNote')}</p></details></section>
      <section id="contact" class="contact section"><h2>${page('contactTitle')}</h2><p class="contact-phone"><span data-copy-contact="phone">${page('contactIntro')}</span><button id="copy-phone" class="copy-button" type="button">复制手机号</button></p><div class="contact-line"><a class="email" data-email-link href="mailto:${esc(d.email)}"><span data-copy-contact="email">${edit('email', d.email)}</span> ${arrow}</a><button id="copy-email" class="copy-button" type="button">复制邮箱</button><span id="copy-status" role="status"></span></div><div class="contact-links"><a href="${esc(external(d.github))}" target="_blank" rel="noopener noreferrer">GitHub ${arrow}</a></div></section>
    </main><footer><span>© ${new Date().getFullYear()} ${esc(d.name)}</span><a href="#">回到顶部</a></footer><dialog id="project-dialog" aria-labelledby="dialog-title"><button class="dialog-close" type="button" aria-label="关闭作品详情">×</button><div id="dialog-content"></div></dialog>`;

  window.PortfolioLayout?.init();
  window.PortfolioSections?.init();
  window.PortfolioDividers?.init();
  window.PortfolioText?.init();
  window.PortfolioEditor?.init();
  const grid = document.querySelector('.projects');
  document.getElementById('filter-status').textContent = `显示${initialCategory}作品，共 ${d.projects.filter(p => p.category === initialCategory).length} 项`;
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const projects = d.projects.filter(p => p.category === button.dataset.filter);
    grid.innerHTML = projects.map(card).join('');
    refreshEditable();
    document.getElementById('filter-status').textContent = `显示${button.dataset.filter}作品，共 ${projects.length} 项`;
  }));

  function media(p) {
    const images = (p.images || []).filter(i => asset(i.src));
    const videos = (p.videoLinks || []).filter(v => external(v.url));
    if (external(p.url)) videos.unshift({url:p.url, title:'观看成片（百度网盘）', password:p.password});
    const files = (p.attachments || []).filter(f => asset(f.path));
    const video = asset(p.video);
    const children = (p.children || []).map((child,i) => {
      const prefix = 'projects.' + d.projects.indexOf(p) + '.children.' + i;
      return `<article class="collection-item"><h3>${edit(prefix + '.title', child.title)}</h3><p>${edit(prefix + '.summary', child.summary)}</p><a class="text-link" href="${esc(asset(child.path))}" target="_blank" rel="noopener">阅读作品材料 ${arrow}</a></article>`;
    }).join('');
    return `${children ? `<div class="collection-list">${children}</div>` : ''}${(p.body || []).map((paragraph,i) => `<p class="body-paragraph">${edit('projects.' + d.projects.indexOf(p) + '.body.' + i, paragraph)}</p>`).join('')}
      ${images.map(i => `<figure class="detail-image"><img src="${esc(asset(i.src))}" alt="${esc(i.alt || i.caption || p.title)}" loading="lazy">${i.caption ? `<figcaption>${esc(i.caption)}</figcaption>` : ''}</figure>`).join('')}
      ${video ? `<video controls controlslist="nodownload" playsinline preload="metadata" ${p.coverImage ? `poster="${esc(asset(p.coverImage))}"` : ''}><source src="${esc(video)}">当前浏览器暂不支持播放此视频。</video>` : ''}
      ${videos.length || files.length ? `<div class="work-resources"><h3>${page('resourcesTitle')}</h3>${videos.map(v => `<div><a href="${esc(external(v.url))}" target="_blank" rel="noopener noreferrer">${esc(v.title || '观看视频')} ${arrow}</a>${v.password ? `<span>提取码：${esc(v.password)}</span>` : ''}</div>`).join('')}${files.map(f => `<div><a href="${esc(asset(f.path))}" target="_blank" rel="noopener">${esc(f.title || '阅读作品文件')} ${arrow}</a></div>`).join('')}</div>` : ''}`;
  }
  const dialog = document.getElementById('project-dialog');
  let trigger;
  function openProject(p,button) {
    trigger = button;
    dialog.dataset.projectId=p.id;
    const theatre=p.presentation?.type==='theatre'&&window.PortfolioTheatre;
    const shortdrama=['microdrama','stage-simple'].includes(p.presentation?.type)&&window.PortfolioShortdrama;
    const shortfilm=p.presentation?.type==='shortfilm'&&window.PortfolioShortfilm;
    const series=p.presentation?.type==='series'&&window.PortfolioSeries;
    const feature=p.presentation?.type==='feature'&&window.PortfolioFeature;
    dialog.classList.toggle('carnivore-dialog',!!theatre);
    dialog.classList.toggle('case-dialog',!!(theatre||shortdrama||shortfilm||series||feature));
    document.getElementById('dialog-content').innerHTML = theatre ? window.PortfolioTheatre.render(p,{edit,projectField,asset,external,esc,arrow}) : shortdrama ? window.PortfolioShortdrama.render(p,{edit,projectField,asset,external,esc,arrow}) : shortfilm ? window.PortfolioShortfilm.render(p,{edit,projectField,asset,external,esc,arrow}) : series ? window.PortfolioSeries.render(p,{edit,projectField,asset,external,esc,arrow}) : feature ? window.PortfolioFeature.render(p,{edit,projectField,asset,external,esc,arrow}) : `<div class="dialog-cover">${cover(p, true)}</div><div class="dialog-copy"><p class="dialog-category">${esc(p.category)}${p.year && p.year !== '—' ? ` · ${projectField(p, 'year')}` : ''}</p><h2 id="dialog-title">${projectField(p, 'title')}</h2><p class="dialog-meta">${projectField(p, 'role')}${p.role && p.length ? ' · ' : ''}${projectField(p, 'length')}</p><div class="optional-detail"><h3>${page('storyTitle')}</h3><p>${projectField(p, 'summary')}</p></div><div class="optional-detail"><h3>${page('recognitionTitle')}</h3><p>${projectField(p, 'note')}</p></div>${media(p)}<a class="text-link" href="mailto:${esc(d.email)}?subject=${encodeURIComponent('关于《' + p.title + '》的交流')}">${page('contactAuthor')} ${arrow}</a></div>`;
    refreshEditable();
    dialog.showModal();
    dialog.scrollTop=0;
    document.dispatchEvent(new CustomEvent('portfolio:dialog-open'));
    document.body.style.overflow = 'hidden';
  }
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-project]');
    if (!button) return;
    const p=d.projects.find(p=>p.id===button.dataset.project);if(p)openProject(p,button);
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const anchor=event.target.closest('[data-case-anchor]');
    if(anchor&&!event.defaultPrevented){event.preventDefault();dialog.querySelector('#'+anchor.dataset.caseAnchor)?.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('play', event => {if(event.target.tagName==='VIDEO')dialog.querySelectorAll('video').forEach(video=>{if(video!==event.target)video.pause();});},true);
  dialog.addEventListener('close', () => { dialog.querySelectorAll('video').forEach(video=>video.pause()); document.body.style.overflow = ''; document.dispatchEvent(new CustomEvent('portfolio:dialog-close')); trigger?.focus(); });
  const requestedProject=new URLSearchParams(location.search).get('project');
  if(requestedProject){const p=d.projects.find(p=>p.id===requestedProject);if(p)queueMicrotask(()=>openProject(p,[...grid.querySelectorAll('[data-project]')].find(button=>button.dataset.project===p.id)));}
  document.getElementById('copy-email').addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try { await navigator.clipboard.writeText(d.email); status.textContent = '邮箱已复制'; }
    catch { status.textContent = '可选中邮箱复制，或点击邮箱发送邮件。'; }
  });
})();
