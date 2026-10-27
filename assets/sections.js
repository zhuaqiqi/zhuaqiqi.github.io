(() => {
  'use strict';
  const definitions={hero:['首页','main>.editorial-hero'],about:['关于我','#about'],resume:['学习与经历','#resume'],education:['教育经历','.resume-education'],awards:['获奖经历','.resume-awards'],works:['作品','#works'],contact:['联系我','#contact']};
  const limits={paddingTop:[0,600],paddingBottom:[0,600],paddingLeft:[0,30],paddingRight:[0,30],sectionHeight:[0,10000]};
  const properties={paddingTop:'padding-top',paddingBottom:'padding-bottom',paddingLeft:'padding-left',paddingRight:'padding-right',sectionHeight:'min-height'};
  let editing=false,enabled=false,selected=null,panel,drag=null;
  const data=()=>window.PORTFOLIO.layout.fields;
  const key=id=>'section:'+id;
  const node=id=>document.querySelector(definitions[id]?.[1]||':not(*)');
  const clamp=(value,name)=>Math.max(limits[name][0],Math.min(limits[name][1],Number(value)));
  const changed=()=>window.PortfolioEditor?.changed('栏目边界已调整，请保存。');
  function values(id) {
    const el=node(id),s=getComputedStyle(el),r=el.getBoundingClientRect(),spec=data()[key(id)]||{};
    return {paddingTop:Math.round(parseFloat(s.paddingTop)),paddingBottom:Math.round(parseFloat(s.paddingBottom)),paddingLeft:Math.round(parseFloat(s.paddingLeft)/r.width*1000)/10,paddingRight:Math.round(parseFloat(s.paddingRight)/r.width*1000)/10,sectionHeight:spec.sectionHeight??0};
  }
  function apply(id) {
    const el=node(id);if(!el)return;
    const spec=data()[key(id)]||{};
    Object.entries(properties).forEach(([name,css])=>{
      el.style.removeProperty(css);
      if(spec[name]!==undefined)el.style.setProperty(css,spec[name]+(name==='paddingLeft'||name==='paddingRight'?'%':'px'));
    });
    const v=values(id);
    el.style.setProperty('--boundary-top',v.paddingTop+'px');
    el.style.setProperty('--boundary-left',v.paddingLeft+'%');
    el.style.setProperty('--boundary-right',v.paddingRight+'%');
    el.classList.toggle('section-boundary-selected',enabled&&selected===id);
  }
  function sync() {
    if(!panel||!selected)return;
    panel.querySelector('select').value=selected;
    const v=values(selected);panel.querySelectorAll('[data-section-value]').forEach(input=>input.value=v[input.name]);
  }
  function positionPanel() {
    if(!panel)return;
    const toolbar=document.querySelector('.editor-toolbar');
    if(innerWidth<=800&&toolbar&&!toolbar.hidden){
      const bottom=innerHeight-toolbar.getBoundingClientRect().top+12;
      panel.style.bottom=bottom+'px';panel.style.maxHeight=Math.max(140,innerHeight-bottom-16)+'px';
    }else{panel.style.removeProperty('bottom');panel.style.removeProperty('max-height');}
  }
  function choose(id) {
    if(!node(id))return;selected=id;
    window.PortfolioLayout?.select(null);
    Object.keys(definitions).forEach(apply);sync();positionPanel();
  }
  function setValue(name,value,notify=true) {
    if(!selected)return;
    const spec=data()[key(selected)]||={};
    if(value==='')delete spec[name];else spec[name]=Math.round(clamp(value,name)*10)/10;
    apply(selected);sync();if(notify)changed();
  }
  function endDrag(cancel=false) {
    const state=drag;if(!state)return;drag=null;
    document.body.classList.remove('section-boundary-dragging');
    if(state.handle.hasPointerCapture(state.pointerId))state.handle.releasePointerCapture(state.pointerId);
    if(cancel){if(state.original)data()[key(state.id)]=state.original;else delete data()[key(state.id)];apply(state.id);sync();}
    else if(state.changed)changed();
  }
  function edgeChange(edge,dx,dy,base,width) {
    if(edge==='bottom'){
      setValue('paddingBottom',base.paddingBottom+dy,false);
      if(base.sectionHeight>0)setValue('sectionHeight',base.actualHeight+dy,false);
    }else if(edge==='top')setValue('paddingTop',base.paddingTop+dy,false);
    else if(edge==='left')setValue('paddingLeft',base.paddingLeft+dx/width*100,false);
    else setValue('paddingRight',base.paddingRight-dx/width*100,false);
  }
  function addTools(id) {
    const el=node(id);if(!el||el.querySelector(':scope>[data-boundary-tools]'))return;
    el.classList.add('section-boundary-target');
    const tools=document.createElement('div');tools.dataset.boundaryTools=id;tools.className='section-boundary-tools';
    tools.innerHTML='<button type="button" class="section-boundary-label">'+definitions[id][0]+' · 边界</button>'+[['top','上留白'],['bottom','下边界'],['left','左边界'],['right','右边界']].map(([edge,label])=>'<button type="button" class="section-edge section-edge-'+edge+'" data-edge="'+edge+'" aria-label="调整'+definitions[id][0]+label+'">'+(edge==='left'||edge==='right'?'↔':'↕ '+label)+'</button>').join('');
    el.append(tools);
    tools.querySelector('.section-boundary-label').addEventListener('click',()=>choose(id));
    tools.querySelectorAll('[data-edge]').forEach(handle=>{
      handle.addEventListener('pointerdown',event=>{
        if(!enabled||event.button!==0)return;event.preventDefault();event.stopPropagation();choose(id);handle.focus();
        const original=data()[key(id)];
        drag={id,handle,pointerId:event.pointerId,x:event.clientX,y:event.clientY,width:el.getBoundingClientRect().width,base:{...values(id),actualHeight:el.getBoundingClientRect().height},original:original?JSON.parse(JSON.stringify(original)):null,edge:handle.dataset.edge,changed:false};
        handle.setPointerCapture(event.pointerId);document.body.classList.add('section-boundary-dragging');
      });
      handle.addEventListener('pointermove',event=>{
        if(!drag||drag.pointerId!==event.pointerId||drag.handle!==handle)return;
        const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.changed&&Math.abs(dx)+Math.abs(dy)<3)return;
        drag.changed=true;edgeChange(drag.edge,dx,dy,drag.base,drag.width);
      });
      handle.addEventListener('pointerup',()=>endDrag());
      handle.addEventListener('pointercancel',()=>endDrag(true));
      handle.addEventListener('lostpointercapture',()=>endDrag());
      handle.addEventListener('keydown',event=>{
        if(event.key==='Escape'&&drag){event.preventDefault();endDrag(true);return;}
        const vertical=['top','bottom'].includes(handle.dataset.edge);
        if(!(vertical?['ArrowUp','ArrowDown']:['ArrowLeft','ArrowRight']).includes(event.key))return;
        event.preventDefault();choose(id);const step=event.shiftKey?20:4;
        const dx=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0;
        const dy=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;
        edgeChange(handle.dataset.edge,dx,dy,{...values(id),actualHeight:el.getBoundingClientRect().height},el.getBoundingClientRect().width);changed();
      });
    });
  }
  function refresh() {Object.keys(definitions).forEach(id=>{apply(id);if(panel)addTools(id);});sync();}
  function setEditing(value) {editing=value;if(!editing)exit();}
  function exit() {
    endDrag();enabled=false;document.body.classList.remove('section-boundary-editing');
    if(panel)panel.hidden=true;
    document.querySelector('[data-action=sections]')?.setAttribute('aria-pressed','false');
    Object.keys(definitions).forEach(apply);
  }
  function toggle() {
    if(!editing)return;window.PortfolioDividers?.exit();if(enabled){exit();window.PortfolioEditor?.notify('已返回文字编辑。');return;}
    const current=document.querySelector('.box-selected');
    const inView=Object.keys(definitions).filter(id=>{const r=node(id)?.getBoundingClientRect();return r&&r.top<innerHeight*.5&&r.bottom>100;});
    const containing=current?Object.keys(definitions).filter(id=>node(id)?.contains(current)):[];
    document.querySelector('#project-dialog[open]')?.close();
    enabled=true;panel.hidden=false;document.body.classList.add('section-boundary-editing');
    document.querySelector('[data-action=sections]')?.setAttribute('aria-pressed','true');
    choose(containing.at(-1)||inView.at(-1)||'resume');
    window.PortfolioEditor?.notify('拖动栏目边界，或在“栏目边界”面板中调整留白。');
  }
  function init() {
    refresh();
    if(!['127.0.0.1','localhost','[::1]'].includes(location.hostname)&&location.protocol!=='file:'&&!new URLSearchParams(location.search).has('edit'))return;
    panel=document.createElement('aside');panel.className='section-settings';panel.hidden=true;panel.setAttribute('aria-label','栏目边界设置');
    panel.innerHTML='<div class="box-panel-heading"><strong>栏目边界</strong><button type="button" data-section-close aria-label="关闭栏目边界">×</button></div><label class="section-choice">选择栏目<select aria-label="选择栏目">'+Object.entries(definitions).map(([id,[name]])=>'<option value="'+id+'">'+name+'</option>').join('')+'</select></label><div class="section-dimensions">'+[['paddingTop','上留白（px）',600,1],['paddingBottom','下留白（px）',600,1],['paddingLeft','左边距（%）',30,.1],['paddingRight','右边距（%）',30,.1],['sectionHeight','最小栏目高度（px）',10000,1]].map(([name,label,max,step])=>'<label>'+label+'<input data-section-value name="'+name+'" type="number" min="0" max="'+max+'" step="'+step+'" placeholder="自动"></label>').join('')+'</div><p class="section-boundary-tip">内容较多时，栏目会自动撑开。边界手柄也可用方向键微调。</p><div class="box-panel-actions"><button type="button" data-section-reset>恢复本栏默认边界</button><button type="button" data-section-done>返回文字编辑</button></div>';
    document.body.append(panel);refresh();
    panel.querySelector('select').addEventListener('change',event=>{choose(event.target.value);node(selected).scrollIntoView({block:'start',behavior:'smooth'});});
    panel.querySelectorAll('[data-section-value]').forEach(input=>input.addEventListener('input',()=>{if(input.value===''||input.validity.valid)setValue(input.name,input.value);}));
    panel.querySelector('[data-section-reset]').addEventListener('click',()=>{delete data()[key(selected)];apply(selected);sync();changed();});
    panel.querySelector('[data-section-close]').addEventListener('click',exit);
    panel.querySelector('[data-section-done]').addEventListener('click',exit);
    document.addEventListener('click',event=>{
      if(!enabled||event.target.closest('.section-settings,.editor-toolbar,[data-boundary-tools],dialog'))return;
      const ids=Object.keys(definitions).filter(id=>node(id)?.contains(event.target));
      if(ids.length){event.preventDefault();event.stopPropagation();choose(ids.at(-1));}
    },true);
    window.addEventListener('resize',()=>{refresh();positionPanel();});
    window.addEventListener('blur',()=>endDrag());
  }
  window.PortfolioSections={init,refresh,setEditing,toggle,exit};
})();
