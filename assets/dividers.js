(() => {
  'use strict';
  const edges={top:'上方',bottom:'下方',left:'左侧',right:'右侧'};
  const definitions=[
    ['page','首页','main>.editorial-hero'],['page','栏目','main>.section'],
    ['page','导航','.nav'],['page','页脚','footer'],
    ['page','栏目标题','.resume-part>.subheading'],['page','教育经历','.education-card'],
    ['page','奖项','.awards article'],['page','作品说明','main .source-note'],['page','横线','main hr'],
    ['project','作品信息','.case-facts'],['project','作品导航','.case-nav'],
    ['project','故事内容','.case-synopsis'],['project','创作主题','.case-themes article'],
    ['project','演出时间线','.case-timeline'],['project','演出记录','.simple-records'],
    ['project','演出记录条目','.simple-records li'],['project','作品数据','.simple-highlights'],
    ['project','作品资料','.case-resources'],['project','资料条目','.case-resources>div'],
    ['project','作品资料','.work-resources'],['project','资料条目','.work-resources>div'],
    ['project','作品列表','.collection-list'],['project','作品条目','.collection-item'],
    ['project','横线','hr']
  ];
  let editing=false,enabled=false,entries=[],panel,layer,frame=0,observer;
  const fields=()=>window.PORTFOLIO.layout.fields;
  const hidden=entry=>fields()[entry.key]?.hidden===true;
  function refresh() {
    entries.forEach(e=>e.node.classList.remove('divider-hidden-'+e.edge));
    entries=[];observer?.disconnect();
    const dialog=document.getElementById('project-dialog');
    definitions.forEach(([scope,label,selector])=>{
      const root=scope==='project'?dialog?.querySelector('#dialog-content'):document;
      if(!root)return;
      const context=scope==='project'?'project:'+dialog.dataset.projectId:'page';
      root.querySelectorAll(selector).forEach((node,index)=>{
        const style=getComputedStyle(node);
        const heading=node.matches('main>.section')?node.querySelector('h2')?.textContent:node.matches('.resume-part>.subheading')?node.textContent:null;
        const name=(heading||label+(root.querySelectorAll(selector).length>1?' '+(index+1):'')).trim().slice(0,35);
        Object.entries(edges).forEach(([edge,position])=>{
          const kind=selector.replace(/[^a-zA-Z0-9]+/g,'-');
          const key='divider:'+context+':'+kind+':'+(node.id||index)+':'+edge;
          const borderStyle=style.getPropertyValue('border-'+edge+'-style');
          const width=parseFloat(style.getPropertyValue('border-'+edge+'-width'));
          const color=style.getPropertyValue('border-'+edge+'-color');
          if(!(width>0)||borderStyle==='none'||borderStyle==='hidden'||((color==='transparent'||color==='rgba(0, 0, 0, 0)')&&!fields()[key]?.hidden))return;
          const entry={key,node,edge,name:name+position+'分隔线',scope};
          entries.push(entry);node.classList.toggle('divider-hidden-'+edge,hidden(entry));
        });
        observer?.observe(node);
      });
    });
    schedule();
  }
  function schedule() {if(!frame)frame=requestAnimationFrame(()=>{frame=0;paint();});}
  function restoreAll() {
    let count=0;Object.entries(fields()).forEach(([key,spec])=>{if(key.startsWith('divider:')&&spec.hidden){delete spec.hidden;count++;}});
    refresh();if(count)window.PortfolioEditor?.changed('已恢复 '+count+' 条分隔线，请保存。');
  }
  function exit() {
    enabled=false;document.body.classList.remove('divider-editing');
    if(layer)layer.hidden=true;if(panel)panel.hidden=true;
    document.querySelector('[data-action=dividers]')?.setAttribute('aria-pressed','false');
  }
  function setEditing(value) {editing=value;if(!value)exit();}
  function toggle() {
    if(!editing)return;if(enabled){exit();return;}
    window.PortfolioDisclosures?.exit();
    window.PortfolioSections?.exit();window.PortfolioLayout?.select(null);
    enabled=true;document.body.classList.add('divider-editing');
    document.querySelector('[data-action=dividers]')?.setAttribute('aria-pressed','true');
    refresh();window.PortfolioEditor?.notify('点击分隔线上的删除或恢复按钮，完成后保存修改。');
  }
  function paint() {
    if(!layer||!enabled)return;
    const dialog=document.querySelector('#project-dialog[open]'),host=dialog||document.body;
    if(layer.parentElement!==host)host.append(layer);
    if(panel.parentElement!==host)host.append(panel);
    layer.hidden=false;panel.hidden=false;layer.replaceChildren();
    const base=dialog?.getBoundingClientRect();
    const ox=dialog?-base.left-dialog.clientLeft:scrollX;
    const oy=dialog?-base.top-dialog.clientTop+dialog.scrollTop:scrollY;
    const groups=[];
    entries.filter(e=>dialog?e.scope==='project':e.scope==='page').forEach(e=>{
      const r=e.node.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)return;
      const horizontal=e.edge==='top'||e.edge==='bottom';
      const x=horizontal?r.left:e.edge==='left'?r.left:r.right;
      const y=horizontal?(e.edge==='top'?r.top:r.bottom):r.top;
      const length=horizontal?r.width:r.height;
      const group=groups.find(g=>g.horizontal===horizontal&&Math.abs(g.x-x)<3&&Math.abs(g.y-y)<3&&Math.abs(g.length-length)<3);
      if(group)group.entries.push(e);else groups.push({x,y,length,horizontal,entries:[e]});
    });
    groups.forEach(group=>{
      const deleted=group.entries.every(hidden),first=group.entries[0];
      const button=document.createElement('button');button.type='button';
      button.className='divider-handle'+(group.horizontal?'':' divider-vertical')+(deleted?' divider-deleted':'');
      button.dataset.dividerKey=first.key;button.setAttribute('aria-label',(deleted?'恢复':'删除')+'“'+first.name+'”');
      button.style.left=(group.x+ox-(group.horizontal?0:8))+'px';
      button.style.top=(group.y+oy-(group.horizontal?8:0))+'px';
      button.style[group.horizontal?'width':'height']=group.length+'px';
      const label=document.createElement('span');label.textContent=deleted?'↶ 恢复':'× 删除分隔线';button.append(label);
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        group.entries.forEach(e=>{const spec=fields()[e.key]||={};if(deleted)delete spec.hidden;else spec.hidden=true;e.node.classList.toggle('divider-hidden-'+e.edge,!deleted);});
        window.PortfolioEditor?.changed((deleted?'已恢复':'已删除')+'分隔线，请保存。');schedule();
      });
      layer.append(button);
    });
    panel.querySelector('[data-divider-restore]').disabled=!Object.entries(fields()).some(([key,s])=>key.startsWith('divider:')&&s.hidden);
  }
  function init() {
    refresh();
    document.addEventListener('portfolio:dialog-open',refresh);document.addEventListener('portfolio:dialog-close',refresh);
    if(!['127.0.0.1','localhost','[::1]'].includes(location.hostname)&&location.protocol!=='file:'&&!new URLSearchParams(location.search).has('edit'))return;
    layer=document.createElement('div');layer.className='divider-layer';layer.hidden=true;document.body.append(layer);
    panel=document.createElement('aside');panel.className='divider-settings';panel.hidden=true;panel.setAttribute('aria-label','分隔线设置');
    panel.innerHTML='<div class="box-panel-heading"><strong>分隔线</strong><button type="button" data-divider-close aria-label="关闭分隔线设置">×</button></div><p>点击线上的按钮删除或恢复。虚线标记只在此模式下显示。</p><button type="button" data-divider-restore>恢复全部分隔线</button><button type="button" data-divider-done>返回文字编辑</button>';
    document.body.append(panel);panel.querySelector('[data-divider-close]').addEventListener('click',exit);panel.querySelector('[data-divider-done]').addEventListener('click',exit);panel.querySelector('[data-divider-restore]').addEventListener('click',restoreAll);
    observer=new ResizeObserver(schedule);refresh();
    document.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
    document.addEventListener('keydown',event=>{if(enabled&&event.key==='Escape')exit();});
  }
  window.PortfolioDividers={init,refresh,setEditing,toggle,exit,restoreAll};
})();
