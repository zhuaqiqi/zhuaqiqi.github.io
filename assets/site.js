(() => {
'use strict';
const d = window.PORTFOLIO;
const mode = document.body.className;
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const base = document.body.dataset.standalone ? 'assets/' : '../assets/';
const pdf = base + 'documents/resume-reader.html';
const button = (href,text,cls='') => `<a class="button ${cls}" href="${esc(href)}">${text}</a>`;
const cover = p => `<div class="poster ${p.cover}" aria-hidden="true"><span class="poster-index">${esc(p.category)} / ${esc(p.year)}</span><div class="poster-title">${esc(p.title)}</div><span class="poster-en">${esc(p.en)}</span><span class="poster-credit">A STORY BY JIAQI ZHAO</span></div>`;
const card = p => `<button class="project" data-project="${p.id}" aria-haspopup="dialog">${cover(p)}<div class="project-info"><div><span class="eyebrow">${esc(p.category)} · ${esc(p.role)}</span><h3>${esc(p.title)}</h3></div>${arrow}</div><p>${esc(p.summary)}</p><span class="project-tags">${p.tags.map(esc).join(' / ')}</span></button>`;
const nav = `<header class="nav"><a class="brand" href="#"><span class="monogram">JZ<span>。</span></span><span>赵佳琦<small>JIAQI ZHAO</small></span></a><nav aria-label="主导航"><a href="#about">关于</a><a href="#works">作品</a><a href="#resume">履历</a><a href="#contact">联系 ${arrow}</a></nav>${document.body.dataset.standalone ? '' : '<a class="template-link" href="../index.html">模板选择 <span aria-hidden="true">↗</span></a>'}</header>`;
const stats = `<div class="stats"><div><strong>35<span>万+</span></strong><span>剧本创作字数</span></div><div><strong>15<span>部</span></strong><span>原创短片剧本</span></div><div><strong>9<span>部</span></strong><span>短片已拍摄成片</span></div></div>`;
const about = `<section id="about" class="about section"><div class="section-heading"><span class="eyebrow">01 / ABOUT</span><h2>在生活里观察，<br>在故事里追问。</h2></div><div class="about-copy"><p class="lead">${esc(d.bio)}</p><p>${esc(d.education)}，${esc(d.degree)}。创作横跨长片电影、短片、舞台戏剧、微短剧与 VR 电影，关注不同媒介中的人物塑造与叙事可能。</p><div class="pills">${['家庭与代际','女性经验','荒诞喜剧','社会现实','互动叙事'].map(x=>`<span>${x}</span>`).join('')}</div></div></section>`;
let hero;
if(mode==='academic') hero=`<section class="hero academic-hero"><div class="hero-copy"><div class="eyebrow"><span class="dot"></span> SCREENWRITING · CINEMA · THEATRE</div><h1>赵佳琦<span>Jiaqi Zhao</span></h1><p class="hero-degree">${d.education}<br>${d.degree}</p><p class="hero-desc">以文字构建人物，以影像理解世界。<br>在电影与剧场之间，持续探索叙事的可能。</p><div class="actions">${button('#works','阅读我的作品 '+arrow)}${button(pdf,'在线阅读简历','secondary')}</div></div><figure class="portrait"><img src="${base}portrait.jpg" alt="赵佳琦的个人肖像" fetchpriority="high"><figcaption>SHANGHAI, CHINA <span>编剧 / 创作者</span></figcaption></figure><div class="hero-foot"><span>创作 · 观察 · 表达</span><span>SCROLL TO EXPLORE ↓</span></div></section>${stats}`;
if(mode==='cinematic') hero=`<section class="hero cinema-hero"><div class="hero-top"><span class="eyebrow"><span class="dot"></span> THE SELECTED WORKS OF JIAQI ZHAO</span><span class="eyebrow">BASED IN SHANGHAI</span></div><h1>故事，在此<span class="outline">发生。</span><span class="hero-english">STORIES IN THE MAKING.</span></h1><div class="hero-bottom"><p>我是赵佳琦，一名编剧与创作者。<br>在日常里捕捉荒诞，在沉默中听见人物。</p><a class="round-link" href="#works" aria-label="浏览精选作品">↓</a><span>FILM / THEATRE<br>SHORT SERIES / VR</span></div></section><div class="film-strip" aria-hidden="true"><span>人 物</span><i>✳</i><span>冲 突</span><i>✳</i><span>生 活</span><i>✳</i><span>想 象</span><i>✳</i><span>故 事</span></div>`;
if(mode==='editorial') hero=`<section class="hero editorial-hero"><div class="editorial-side"><span class="eyebrow">THE PERSONAL JOURNAL</span><span class="vertical">观察生活 · 创造故事</span><span>VOL. 01<br>JIAQI ZHAO</span></div><div class="editorial-main"><span class="eyebrow"><span class="dot"></span> 编剧 · 创作者 · 生活的观察者</span><h1>把生活，<br>写进<span class="italic">故事。</span></h1><div class="editorial-intro"><p>我是赵佳琦。<br>我相信，那些未被说出的日常，<br>值得成为一个故事的开头。</p>${button('#works','翻开作品集 '+arrow)}</div></div><figure class="editorial-portrait"><img src="${base}portrait.jpg" alt="赵佳琦的个人肖像" fetchpriority="high"><figcaption>赵佳琦 / JIAQI ZHAO<br><span>上海大学 · 上海电影学院</span></figcaption></figure></section><div class="editorial-caption"><span>电影 × 戏剧 × 文字</span><span>以好奇心为起点，以故事回应世界。</span></div>`;
const works = `<section id="works" class="works section"><div class="section-heading"><div><span class="eyebrow">02 / SELECTED WORKS</span><h2>${mode==='cinematic'?'每个故事，<br>一种看世界的方式。':'作品，亦是思考的切片。'}</h2></div><p>从纸上的第一行字，到银幕与舞台。<br><small>以下封面为网页排版设计，非作品原版海报。</small></p></div><div class="filters" role="group" aria-label="按作品类型筛选">${['全部', ...(d.projectCategories || [...new Set(d.projects.map(p => p.category))])].map((x,i)=>`<button type="button" data-filter="${x}" aria-pressed="${i===0}">${x}${i===0?' <sup>' + d.projects.length + '</sup>':''}</button>`).join('')}</div><p class="sr-only" id="filter-status" role="status"></p><div class="projects">${d.projects.map(card).join('')}</div><div class="works-note"><span>作品摘要与成果依据所提供的简历整理。</span><a href="${pdf}" target="_blank" rel="noopener">查看完整作品目录 ${arrow}</a></div></section>`;
const resume = `<section id="resume" class="resume section"><div class="section-heading"><div><span class="eyebrow">03 / BACKGROUND</span><h2>持续学习，<br>也持续创作。</h2></div>${button(pdf,'在线阅读简历','secondary')}</div><div class="resume-grid"><div><h3 class="subheading">教育背景 <span>EDUCATION</span></h3><div class="education-card"><span class="eyebrow">${d.dates}</span><h4>上海大学</h4><p>上海电影学院<br>戏剧与影视 · 编剧方向 · 硕士在读</p><span class="gpa">GPA ${d.gpa}</span></div><p class="muted">主要课程</p><div class="pills">${d.courses.map(x=>`<span>${esc(x)}</span>`).join('')}</div><h3 class="subheading skills-heading">创作能力 <span>PRACTICE</span></h3><div class="skill-list">${d.skills.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div><div><h3 class="subheading">获奖与入围选录 <span>RECOGNITION</span></h3><div class="awards">${d.awards.map(([year,name,note])=>`<article><time>${esc(year)}</time><div><h4>${esc(name)}</h4><p>${esc(note)}</p></div></article>`).join('')}</div></div></div></section>`;
const contact = `<section id="contact" class="contact section"><span class="eyebrow">04 / GET IN TOUCH</span><h2>${mode==='cinematic'?'下一个故事，<br>一起写。':'期待下一次，<br>关于故事的对话。'}</h2><p>关于深造交流、编剧合作、影视与戏剧项目，欢迎联系。</p><p class="contact-phone"><span data-copy-contact="phone">电话：18340859919（微信同号）</span><button id="copy-phone" class="copy-button" type="button">复制手机号</button></p><div class="contact-line"><a class="email" href="mailto:${esc(d.email)}"><span data-copy-contact="email">${esc(d.email)}</span> ${arrow}</a><button id="copy-email" class="copy-button" type="button">复制邮箱</button><span id="copy-status" role="status"></span></div><div class="contact-links"><a href="${esc(d.github)}" target="_blank" rel="noopener noreferrer">GitHub ${arrow}</a><a href="${pdf}" target="_blank" rel="noopener">阅读简历 ${arrow}</a></div></section>`;
const footer = `<footer><span>© ${new Date().getFullYear()} 赵佳琦 · Jiaqi Zhao</span><span>让故事，继续发生。</span><a href="#">回到顶部 ↑</a></footer>`;
const dialog = `<dialog id="project-dialog" aria-labelledby="dialog-title"><button class="dialog-close" aria-label="关闭作品详情">×</button><div id="dialog-content"></div></dialog>`;
document.getElementById('site').innerHTML=nav+`<main id="main">${hero}${about}${works}${resume}${contact}</main>`+footer+dialog;

const grid=document.querySelector('.projects');
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 const ps=d.projects.filter(p=>b.dataset.filter==='全部'||p.category===b.dataset.filter);
 grid.innerHTML=ps.map(card).join('');
 document.querySelector('#filter-status').textContent=`显示${b.dataset.filter}作品，共 ${ps.length} 项`;
}));
const modal=document.getElementById('project-dialog');
let trigger;
grid.addEventListener('click',e=>{
 const btn=e.target.closest('[data-project]'); if(!btn)return;
 trigger=btn;
 const p=d.projects.find(x=>x.id===btn.dataset.project);
 document.getElementById('dialog-content').innerHTML=`${cover(p)}<div class="dialog-copy"><span class="eyebrow">${esc(p.category)} · ${esc(p.year)}</span><h2 id="dialog-title">${esc(p.title)}</h2><p class="dialog-meta">${esc(p.role)} / ${esc(p.length)}</p><div class="pills">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><h3>故事梗概</h3><p>${esc(p.summary)}</p><h3>创作与成果</h3><p>${esc(p.note)}</p>${p.url?`<a class="button" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">查看成片（百度网盘） ↗</a><p class="muted">提取码：${esc(p.password)}</p>`:`<a class="button secondary" href="${pdf}" target="_blank" rel="noopener">阅读简历中的作品介绍 ↗</a><p class="muted">完整剧本或影像资料，可邮件联系作者获取。</p>`}<small class="muted">封面为网页排版设计；英文作品名为展示译名。成果与项目状态依据原简历。</small></div>`;
 modal.showModal();document.body.style.overflow='hidden';
});
function close(){modal.close();}
modal.querySelector('.dialog-close').addEventListener('click',close);
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
modal.addEventListener('close',()=>{document.body.style.overflow='';trigger?.focus();});
document.getElementById('copy-email').addEventListener('click',async()=>{
 const status=document.getElementById('copy-status');
 try{await navigator.clipboard.writeText(d.email);status.textContent='邮箱已复制';}
 catch{status.textContent='可选中邮箱复制，或点击邮箱发送邮件。';}
});
})();
