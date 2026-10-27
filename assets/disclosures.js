(() => {
  'use strict';
  let editing=false, enabled=false, entries=[], panel;
  const fields=()=>window.PORTFOLIO.layout.fields;
  const hidden=entry=>fields()[entry.key]?.hidden===true;
  const current=()=>entries.filter(e=>document.querySelector('#project-dialog[open]')?e.scope==='project':e.scope==='page');
  function apply(entry){entry.node.classList.toggle('disclosure-marker-hidden',hidden(entry));}
  function refresh(){
    entries=[];
    document.querySelectorAll('main details>summary,#dialog-content details>summary').forEach(node=>{
      const dialog=node.closest('#project-dialog'), section=node.closest('section');
      const scope=dialog?'project':'page';
      const context=dialog?'project:'+dialog.dataset.projectId:'page';
      const area=section?.id||'general';
      const siblings=[...(section||node.parentElement.parentElement).querySelectorAll('details>summary')];
      const key='disclosure:'+context+':'+area+':'+siblings.indexOf(node);
      const entry={key,node,scope,name:node.textContent.trim().slice(0,60)||'展开标题'};
      entries.push(entry);apply(entry);
    });
    render();
  }
  function position(){
    if(!panel||!enabled)return;
    const dialog=document.querySelector('#project-dialog[open]'),host=dialog||document.body;
    if(panel.parentElement!==host)host.append(panel);
    const toolbar=document.querySelector('.editor-toolbar');
    if(innerWidth<=800&&toolbar&&!toolbar.hidden){
      const bottom=Math.max(12,innerHeight-toolbar.getBoundingClientRect().top+12);
      panel.style.bottom=bottom+'px';panel.style.maxHeight=Math.max(140,innerHeight-bottom-16)+'px';
    }else{panel.style.removeProperty('bottom');panel.style.removeProperty('max-height');}
  }
  function change(entry,remove){
    const spec=fields()[entry.key]||={};
    if(remove)spec.hidden=true;else delete spec.hidden;
    apply(entry);render();
    window.PortfolioEditor?.changed((remove?'已删除':'已恢复')+'小三角，请保存修改。');
    [...panel.querySelectorAll('[data-disclosure-key]')].find(b=>b.dataset.disclosureKey===entry.key)?.focus({preventScroll:true});
  }
  function render(){
    if(!panel||!enabled)return;
    position();panel.hidden=false;
    const list=panel.querySelector('.disclosure-list');list.replaceChildren();
    current().forEach(entry=>{
      const row=document.createElement('div');row.className='disclosure-row';
      const name=document.createElement('span');name.textContent=entry.name;
      const button=document.createElement('button');button.type='button';button.dataset.disclosureKey=entry.key;
      button.textContent=hidden(entry)?'恢复小三角':'删除小三角';
      button.setAttribute('aria-label',button.textContent+'：'+entry.name);
      button.addEventListener('click',()=>change(entry,!hidden(entry)));
      row.append(name,button);list.append(row);
    });
    if(!current().length){const message=document.createElement('p');message.textContent='当前板块没有下拉小三角。可关闭作品详情，或打开其他作品继续选择。';list.append(message);}
    panel.querySelector('[data-disclosure-remove-all]').disabled=!current().some(e=>!hidden(e));
    panel.querySelector('[data-disclosure-restore-all]').disabled=!current().some(hidden);
  }
  function exit(){
    enabled=false;document.body.classList.remove('disclosure-editing');
    if(panel)panel.hidden=true;
    document.querySelector('[data-action=disclosures]')?.setAttribute('aria-pressed','false');
  }
  function setEditing(value){editing=value;if(!value)exit();}
  function toggle(){
    if(!editing)return;if(enabled){exit();return;}
    window.PortfolioSections?.exit();window.PortfolioDividers?.exit();window.PortfolioLayout?.select(null);
    enabled=true;document.body.classList.add('disclosure-editing');
    document.querySelector('[data-action=disclosures]')?.setAttribute('aria-pressed','true');
    refresh();window.PortfolioEditor?.notify('点击板块中的展开标题，或在面板中删除小三角。完成后保存修改。');
  }
  function all(remove){
    current().forEach(entry=>{const spec=fields()[entry.key]||={};if(remove)spec.hidden=true;else delete spec.hidden;apply(entry);});
    render();window.PortfolioEditor?.changed((remove?'已删除':'已恢复')+'当前板块的小三角，请保存修改。');
  }
  function init(){
    refresh();document.addEventListener('portfolio:dialog-open',refresh);document.addEventListener('portfolio:dialog-close',refresh);
    const local=['127.0.0.1','localhost','[::1]'].includes(location.hostname)||location.protocol==='file:';
    if(!local)return;
    panel=document.createElement('aside');panel.className='disclosure-settings';panel.hidden=true;panel.setAttribute('aria-label','小三角设置');
    panel.innerHTML='<div class="box-panel-heading"><strong>下拉小三角</strong><button type="button" data-disclosure-close aria-label="关闭小三角设置">×</button></div><p>可以单独删除或恢复。隐藏小三角后，标题仍可点按展开内容。</p><div class="disclosure-list"></div><div class="disclosure-actions"><button type="button" data-disclosure-remove-all>删除当前全部</button><button type="button" data-disclosure-restore-all>恢复当前全部</button></div><button type="button" data-disclosure-done>返回文字编辑</button>';
    document.body.append(panel);
    panel.querySelector('[data-disclosure-close]').addEventListener('click',exit);panel.querySelector('[data-disclosure-done]').addEventListener('click',exit);
    panel.querySelector('[data-disclosure-remove-all]').addEventListener('click',()=>all(true));panel.querySelector('[data-disclosure-restore-all]').addEventListener('click',()=>all(false));
    document.addEventListener('click',event=>{
      if(!enabled)return;const summary=event.target.closest('summary'),entry=entries.find(e=>e.node===summary);if(!entry)return;
      event.preventDefault();event.stopImmediatePropagation();change(entry,!hidden(entry));
    },true);
    document.addEventListener('keydown',event=>{
      if(!enabled)return;
      if(event.key==='Escape'){event.preventDefault();exit();return;}
      if(!['Enter',' '].includes(event.key))return;
      const entry=entries.find(e=>e.node===event.target.closest('summary'));if(entry){event.preventDefault();event.stopImmediatePropagation();change(entry,!hidden(entry));}
    },true);
    window.addEventListener('resize',position);
  }
  window.PortfolioDisclosures={init,refresh,setEditing,toggle,exit};
})();
