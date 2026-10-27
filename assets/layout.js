(() => {
  'use strict';
  const d = window.PORTFOLIO;
  d.layout ||= {fields:{},blocks:[]};
  let active=false, selected=null, inspector, addDialog, moveHandle, moving=null, dragging=null, observer, dragChanged=false;
  const decorations={line:['横线','━━━━━━'],dots:['圆点','● ● ●'],diamond:['菱形','◇'],star:['星形','✦'],wave:['波浪线','〰〰〰']};
  const fonts={serif:'"Songti SC", STSong, SimSun, serif',sans:'"PingFang SC", "Microsoft YaHei", Arial, sans-serif',kai:'"Kaiti SC", STKaiti, KaiTi, serif',fangsong:'STFangsong, FangSong, serif',mono:'"SFMono-Regular", Consolas, monospace'};
  const colors=[['深绿色','#244b3a'],['墨黑色','#242824'],['灰色','#74786e'],['棕色','#8b684d'],['蓝色','#375d82'],['酒红色','#8b3f4b']];
  const targets={hero:'首页',about:'关于我',resume:'学习与经历',education:'教育背景',works:'作品',contact:'联系我'};
  const styleProperties=['width','height','min-height','font-size','overflow-wrap','max-width','position','left','top','font-family','font-weight','font-style','line-height','letter-spacing','color','text-align','text-transform','--decoration-color'];
  const layout=()=>d.layout;
  const appearanceProperties=['fontFamily','fontWeight','fontStyle','lineHeight','letterSpacing','color','textAlign','textTransform'];
  const allFields=()=>[...document.querySelectorAll('[data-edit]')];
  const byKey=key=>allFields().find(el=>el.dataset.layoutKey===key);
  const changed=message=>window.PortfolioEditor?.changed(message);
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)));
  function fieldKey(el) {
    if(el.dataset.customText) return 'custom:'+el.dataset.customText;
    let path=el.dataset.edit;
    const match=/^projects\.(\d+)\.(.+)$/.exec(path);
    if(match) path='project:'+d.projects[Number(match[1])].id+':'+match[2];
    let context=el.closest('section')?.id || 'hero';
    if(el.closest('.nav'))context='navigation';
    if(el.closest('#project-dialog'))context='detail';
    if(el.closest('.poster'))context+=':cover';
    else if(el.closest('.project-info'))context+=':card';
    return context+':'+path;
  }
  function getTarget(el) {
    if(el?.closest('#project-dialog'))return 'project:'+document.querySelector('#project-dialog').dataset.projectId;
    if(el?.closest('.education-card'))return 'education';
    return el?.closest('section')?.id || 'hero';
  }
  function zone(target) {
    let parent,before;
    if(target.startsWith('project:')) {
      const dialog=document.getElementById('project-dialog');
      if(dialog?.dataset.projectId!==target.slice(8))return null;
      parent=dialog.querySelector('.dialog-copy');before=parent?.querySelector(':scope > .text-link');
    } else if(target==='hero')parent=document.querySelector('.editorial-main');
    else if(target==='about')parent=document.querySelector('.about-copy');
    else if(target==='education')parent=document.querySelector('.education-main')||document.querySelector('.education-card');
    else if(target==='resume'){parent=document.getElementById('resume');before=parent?.querySelector('.resume-grid');}
    else if(target==='works'){parent=document.getElementById('works');before=parent?.querySelector('.projects');}
    else if(target==='contact'){parent=document.getElementById('contact');before=parent?.querySelector('.contact-line');}
    if(!parent)return null;
    let node=[...parent.querySelectorAll(':scope > [data-text-zone]')].find(n=>n.dataset.textZone===target);
    if(!node){node=document.createElement('div');node.dataset.textZone=target;node.className='custom-text-zone';parent.insertBefore(node,before||null);}
    return node;
  }
  function cleanup() {
    document.querySelectorAll('[data-layout-empty]').forEach(el=>el.removeAttribute('data-layout-empty'));
    allFields().forEach(el=>{
      const wrapper=el.closest('a,p,h1,h2,h3,h4,li,time,.gpa,.language,.custom-text-block');
      if(!wrapper || wrapper===el)return;
      const fields=[...wrapper.querySelectorAll('[data-edit]')];
      if(!fields.length || !fields.every(f=>f.dataset.layoutHidden==='true'))return;
      const walker=document.createTreeWalker(wrapper,NodeFilter.SHOW_TEXT);
      let rest='';while(walker.nextNode()){if(!walker.currentNode.parentElement.closest('[data-edit]'))rest+=walker.currentNode.textContent;}
      if(!rest.replace(/GPA|[\s。、，：:·/↗↓↑—-]/g,''))wrapper.dataset.layoutEmpty='true';
    });
    document.querySelectorAll('.education-courses').forEach(p=>{
      const items=[...p.querySelectorAll('.course-item')];
      const visible=items.filter(item=>item.querySelector('[data-edit]')?.dataset.layoutHidden!=='true');
      items.forEach(item=>{item.hidden=!visible.includes(item);item.classList.toggle('last-course',item===visible.at(-1));});
    });
  }
  function apply(el) {
    const key=el.dataset.layoutKey=fieldKey(el), spec=layout().fields[key]||{};
    styleProperties.forEach(property=>el.style.removeProperty(property));
    el.removeAttribute('data-layout-hidden');el.classList.remove('box-selected');
    if(spec.hidden){el.dataset.layoutHidden='true';return;}
    const base=el.dataset.customText?layout().blocks.find(b=>b.id===el.dataset.customText)?.appearance:{};
    const appearance={...base,...spec.appearance};
    appearanceProperties.forEach(name=>{if(appearance[name]!==undefined)el.style[name]=appearance[name];});
    if(appearance.color)el.style.setProperty('--decoration-color',appearance.color);
    if(spec.width!==undefined){el.style.width=spec.width+'%';el.style.maxWidth='100%';el.style.overflowWrap='anywhere';}
    if(spec.height!==undefined)el.style.minHeight=spec.height+'px';
    if(spec.fontSize!==undefined)el.style.fontSize=spec.fontSize+'px';
    if(spec.x!==undefined || spec.y!==undefined){el.style.position='relative';el.style.left=(spec.x||0)+'%';el.style.top=(spec.y||0)+'px';}
    if(key===selected && active)el.classList.add('box-selected');
  }
  function refresh() {
    document.querySelectorAll('[data-custom-block]').forEach(el=>el.remove());
    layout().blocks.forEach((block,i)=>{
      const container=zone(block.target);if(!container)return;
      const wrapper=document.createElement('div');wrapper.className='custom-text-block';wrapper.dataset.customBlock=block.id;
      const el=document.createElement('span');el.dataset.edit='layout.blocks.'+i+'.text';el.dataset.customText=block.id;el.textContent=block.text;
      if(block.decoration){el.dataset.decoration=block.decoration;wrapper.classList.add('decoration-block');}
      wrapper.append(el);container.append(wrapper);
    });
    allFields().forEach(el=>{apply(el);window.PortfolioText?.render(el);});cleanup();
    if(selected && !byKey(selected))select(null);
    if(active && selected)select(byKey(selected));
  }
  function mountTools() {
    const modal=document.querySelector('#project-dialog[open]');
    const host=modal||document.body;
    if(inspector && inspector.parentElement!==host)host.append(inspector);
    if(moveHandle && moveHandle.parentElement!==host)host.append(moveHandle);
    const toolbar=document.querySelector('.editor-toolbar');
    if(toolbar && toolbar.parentElement!==host)host.append(toolbar);
  }
  function select(el) {
    document.querySelectorAll('.box-selected').forEach(node=>node.classList.remove('box-selected'));
    selected=el?.dataset.layoutKey || (el ? fieldKey(el) : null);
    window.PortfolioText?.select(el);
    if(!inspector)return;
    inspector.hidden=!active || !selected;
    if(moveHandle)moveHandle.hidden=inspector.hidden;
    if(!el || !active)return;
    el.classList.add('box-selected');
    const spec=layout().fields[selected]||{};
    inspector.querySelector('.box-name').textContent=(el.textContent||'空白文本框').slice(0,28);
    inspector.querySelector('[name=width]').value=spec.width??'';
    inspector.querySelector('[name=height]').value=spec.height??'';
    inspector.querySelector('[name=fontSize]').value=spec.fontSize??Math.round(parseFloat(getComputedStyle(el).fontSize));
    inspector.querySelector('[name=x]').value=spec.x??0;
    inspector.querySelector('[name=y]').value=spec.y??0;
    syncAppearance(el);
    const rect=el.getBoundingClientRect();
    inspector.classList.toggle('inspector-left',rect.left+rect.width/2>innerWidth/2);
    observer?.disconnect();observer?.observe(el);
    mountTools();
    positionInspector();
    positionHandle();
  }
  function positionHandle() {
    const el=byKey(selected);if(!moveHandle)return;
    if(!active||!el||el.dataset.layoutHidden==='true'){moveHandle.hidden=true;return;}
    const r=el.getBoundingClientRect();
    moveHandle.hidden=r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth;
    moveHandle.style.left=Math.max(8,Math.min(r.left,innerWidth-126))+'px';
    moveHandle.style.top=Math.max(8,Math.min(r.top-38,innerHeight-44))+'px';
  }
  function positionInspector() {
    if(!inspector)return;
    const toolbar=document.querySelector('.editor-toolbar');
    if(innerWidth<=800 && toolbar && !toolbar.hidden) {
      inspector.style.bottom=Math.ceil(innerHeight-toolbar.getBoundingClientRect().top+12)+'px';
      inspector.style.maxHeight=Math.max(150,innerHeight-parseFloat(inspector.style.bottom)-20)+'px';
    } else {inspector.style.removeProperty('bottom');inspector.style.removeProperty('max-height');}
  }
  function setEditing(value) {
    active=value;document.body.classList.toggle('box-editing',active);
    if(!active)select(null);
    else if(selected)select(byKey(selected));
  }
  function updateStyle(name,value) {
    const el=byKey(selected);if(!el)return;
    if(name==='fontSize'&&window.PortfolioText?.apply(el,name,value===''?'':clamp(value,8,160))){syncAppearance(el);return;}
    const spec=layout().fields[selected]||={};
    if(value==='')delete spec[name];
    else spec[name]=clamp(value,...({width:[10,100],height:[0,1500],fontSize:[8,160],x:[-100,100],y:[-3000,3000]}[name]));
    apply(el);cleanup();positionHandle();changed('排版已修改，请保存。');
  }
  function colorHex(el) {
    const color=window.PortfolioText?.style(el)?.color||(el.dataset.decoration==='line'?getComputedStyle(el).getPropertyValue('--decoration-color').trim()||getComputedStyle(el.parentElement).color:getComputedStyle(el).color);
    if(/^#[\da-f]{6}$/i.test(color))return color.toLowerCase();
    const rgb=color.match(/[\d.]+/g);
    return rgb?.length>=3?'#'+rgb.slice(0,3).map(n=>clamp(Math.round(Number(n)),0,255).toString(16).padStart(2,'0')).join(''):'#244b3a';
  }
  function syncAppearance(el) {
    const local=window.PortfolioText?.style(el),appearance=local||layout().fields[el.dataset.layoutKey]?.appearance||{},hex=colorHex(el);
    inspector.querySelector('[name=fontFamily]').value=Object.keys(fonts).find(key=>fonts[key]===appearance.fontFamily)||'';
    inspector.querySelector('[name=fontWeight]').value=appearance.fontWeight||'';
    inspector.querySelector('[name=textColor]').value=hex;
    inspector.querySelector('[name=colorHex]').value=hex;
    inspector.querySelector('[name=fontSize]').value=local?Math.round(parseFloat(local.fontSize)):layout().fields[el.dataset.layoutKey]?.fontSize??Math.round(parseFloat(getComputedStyle(el).fontSize));
    inspector.querySelectorAll('[data-color]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.color===hex)));
  }
  function updateAppearance(name,value) {
    const el=byKey(selected);if(!el)return;
    if(window.PortfolioText?.apply(el,name,value)){syncAppearance(el);return;}
    const spec=layout().fields[selected]||={},appearance=spec.appearance||={};
    if(value==='')delete appearance[name];else appearance[name]=value;
    if(!Object.keys(appearance).length)delete spec.appearance;
    apply(el);syncAppearance(el);positionHandle();changed('字体或颜色已修改，请保存。');
  }
  function moveTo(el,x,y) {
    const spec=layout().fields[el.dataset.layoutKey]||={};
    spec.x=Math.round(clamp(x,-100,100)*100)/100;spec.y=Math.round(clamp(y,-3000,3000));
    apply(el);positionHandle();
    inspector.querySelector('[name=x]').value=spec.x;inspector.querySelector('[name=y]').value=spec.y;
  }
  function finishMove(cancel=false) {
    const state=moving;if(!state)return;moving=null;
    document.body.classList.remove('box-moving');
    if(moveHandle.hasPointerCapture(state.pointerId))moveHandle.releasePointerCapture(state.pointerId);
    if(cancel){
      const spec=layout().fields[state.el.dataset.layoutKey]||{};
      for(const name of ['x','y']){if(state.original[name]===undefined)delete spec[name];else spec[name]=state.original[name];}
      apply(state.el);select(state.el);
    } else if(state.changed)changed('位置已修改，请保存。');
  }
  function remove() {
    const el=byKey(selected);if(!el)return;
    (layout().fields[selected]||={}).hidden=true;
    apply(el);cleanup();select(null);changed('文本框已删除，可用“恢复删除”找回。');
  }
  function duplicate() {
    const el=byKey(selected);if(!active||!el)return;
    if(layout().blocks.length>=200){window.PortfolioEditor?.notify('已达到 200 个新增框的上限。');return;}
    const target=getTarget(el),container=zone(target);if(!container)return;
    const source=layout().fields[selected]||{},style=getComputedStyle(el),rect=el.getBoundingClientRect();
    const value=el.dataset.edit.split('.').reduce((obj,key)=>obj?.[key],d);
    const id='text-'+crypto.randomUUID(),block={id,target,text:typeof value==='string'?value:el.textContent,appearance:{}};
    appearanceProperties.forEach(name=>block.appearance[name]=style[name]);
    if(el.dataset.decoration==='line')block.appearance.color=colorHex(el);
    // Store a font-relative line height so later font-size adjustments retain the rhythm.
    const fontSize=parseFloat(style.fontSize);
    block.appearance.lineHeight=Number.isFinite(parseFloat(style.lineHeight))?String(parseFloat(style.lineHeight)/fontSize):'normal';
    if(el.dataset.decoration)block.decoration=el.dataset.decoration;
    const index=el.dataset.customText?layout().blocks.findIndex(b=>b.id===el.dataset.customText):-1;
    layout().blocks.splice(index<0?layout().blocks.length:index+1,0,block);
    const parentWidth=container.getBoundingClientRect().width||container.parentElement.getBoundingClientRect().width||rect.width||1;
    layout().fields['custom:'+id]={
      width:Math.round(clamp(rect.width/parentWidth*100,10,100)*100)/100,
      height:clamp(source.height??Math.round(rect.height),0,1500),
      fontSize:clamp(fontSize,8,160)
    };
    const richText=window.PortfolioText?.snapshot(el);if(richText)layout().fields['custom:'+id].richText=richText;
    window.PortfolioEditor?.refresh();const copy=byKey('custom:'+id);select(copy);copy?.focus();
    changed('已复制到当前栏目，可修改文字或拖动移动。');
  }
  function restore() {
    let count=0;Object.values(layout().fields).forEach(spec=>{if(spec.hidden){delete spec.hidden;count++;}});
    refresh();if(count)changed(`已恢复 ${count} 个已删除项目。`);else window.PortfolioEditor?.notify('当前没有已删除的项目。');
  }
  function showAdd(mode='text') {
    const decorative=mode==='decoration';
    addDialog.dataset.mode=mode;
    addDialog.querySelector('h2').textContent=decorative?'添加装饰':'添加文本框';
    addDialog.querySelector('.decoration-picker').hidden=!decorative;
    addDialog.querySelector('.add-text-content').hidden=decorative;
    addDialog.querySelector('textarea').required=!decorative;
    const selector=addDialog.querySelector('select');selector.replaceChildren();
    Object.entries(targets).forEach(([value,label])=>selector.add(new Option(label,value)));
    const dialog=document.querySelector('#project-dialog[open]');
    if(dialog){const id=dialog.dataset.projectId;const p=d.projects.find(p=>p.id===id);selector.add(new Option('作品详情：'+p.title,'project:'+id));}
    let target=getTarget(byKey(selected));
    if(!selected){
      const section=[...document.querySelectorAll('main > section')].filter(s=>s.getBoundingClientRect().top<innerHeight*.55).at(-1);
      target=section?.id||'hero';
    }
    selector.value=[...selector.options].some(o=>o.value===target)?target:'about';
    addDialog.querySelector('textarea').value='';addDialog.showModal();
    if(decorative)addDialog.querySelector('[name=decoration]').focus();else addDialog.querySelector('textarea').focus();
  }
  function init() {
    refresh();
    const local=['127.0.0.1','localhost','[::1]'].includes(location.hostname)||location.protocol==='file:';
    if(!local&&!new URLSearchParams(location.search).has('edit'))return;
    inspector=document.createElement('aside');inspector.className='box-inspector';inspector.hidden=true;inspector.setAttribute('aria-label','文本框设置');
    inspector.innerHTML='<div class="box-panel-heading"><strong>排版设置</strong><button type="button" data-box-close aria-label="关闭文本框设置">×</button></div><p class="box-name"></p><div class="box-dimensions"><label>宽度（%）<input name="width" type="number" min="10" max="100" step="0.1" placeholder="自动"></label><label>最小高度（px）<input name="height" type="number" min="0" max="1500" step="1" placeholder="自动"></label><label>字号（px）<input name="fontSize" type="number" min="8" max="160" step="1"></label></div><div class="box-position"><label>左右（%）<input name="x" type="number" min="-100" max="100" step="0.01"></label><label>上下（px）<input name="y" type="number" min="-3000" max="3000" step="1"></label></div><p class="box-tip">拖动上方手柄移动，右下角缩放。选中手柄后也可用方向键微调。</p><div class="box-panel-actions"><button type="button" data-box-copy>复制文本框</button><button type="button" data-box-home>恢复原位</button><button type="button" data-box-reset>默认大小</button><button type="button" data-box-delete>删除</button></div>';
    inspector.querySelector('.box-dimensions').insertAdjacentHTML('beforebegin','<div class="box-appearance"><label>字体<select name="fontFamily"><option value="">默认字体</option><option value="serif">宋体</option><option value="sans">黑体</option><option value="kai">楷体</option><option value="fangsong">仿宋</option><option value="mono">等宽字体</option></select></label><label>字重<select name="fontWeight"><option value="">默认粗细</option><option value="400">常规</option><option value="500">中等</option><option value="700">加粗</option></select></label><div class="box-color-group"><label for="box-color-picker">文字颜色</label><div class="box-color-inputs"><input id="box-color-picker" name="textColor" type="color" value="#244b3a" aria-label="选择文字颜色"><input name="colorHex" type="text" value="#244b3a" maxlength="7" pattern="#[0-9a-fA-F]{6}" aria-label="颜色色号" spellcheck="false"></div><div class="box-color-presets">'+colors.map(([name,hex])=>'<button type="button" data-color="'+hex+'" style="--swatch:'+hex+'" aria-label="'+name+'" title="'+name+'" aria-pressed="false"></button>').join('')+'</div></div></div>');
    inspector.querySelector('[data-box-reset]').insertAdjacentHTML('afterend','<button type="button" data-box-format-reset>默认字体颜色</button>');
    inspector.querySelector('.box-appearance').insertAdjacentHTML('beforebegin','<div class="rich-scope"><p class="rich-selection-note">整框编辑：拖选文字可局部修改</p><button type="button" data-rich-whole hidden>切换为整框修改</button></div>');
    document.body.append(inspector);
    moveHandle=document.createElement('button');moveHandle.type='button';moveHandle.className='box-move-handle';moveHandle.hidden=true;moveHandle.textContent='✥ 拖动移动';moveHandle.setAttribute('aria-label','拖动移动选中框');
    document.body.append(moveHandle);
    moveHandle.addEventListener('pointerdown',event=>{
      const el=byKey(selected);if(!active||!el||event.button!==0)return;
      event.preventDefault();moveHandle.focus();
      const spec=layout().fields[selected]||{};
      moving={el,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:spec.x||0,y:spec.y||0,original:{x:spec.x,y:spec.y},parentWidth:el.parentElement.getBoundingClientRect().width||1,changed:false};
      moveHandle.setPointerCapture(event.pointerId);document.body.classList.add('box-moving');
    });
    moveHandle.addEventListener('pointermove',event=>{
      if(!moving||moving.pointerId!==event.pointerId)return;
      const dx=event.clientX-moving.startX,dy=event.clientY-moving.startY;
      if(!moving.changed&&Math.abs(dx)+Math.abs(dy)<3)return;
      moving.changed=true;moveTo(moving.el,moving.x+dx/moving.parentWidth*100,moving.y+dy);
    });
    moveHandle.addEventListener('pointerup',()=>finishMove());
    moveHandle.addEventListener('pointercancel',()=>finishMove(true));
    moveHandle.addEventListener('lostpointercapture',()=>finishMove());
    moveHandle.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&moving){event.preventDefault();finishMove(true);return;}
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();const el=byKey(selected);if(!el)return;
      const spec=layout().fields[selected]||{},step=event.shiftKey?10:1;
      const dx=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0;
      const dy=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;
      moveTo(el,(spec.x||0)+dx/(el.parentElement.getBoundingClientRect().width||1)*100,(spec.y||0)+dy);changed('位置已微调，请保存。');
    });
    inspector.querySelector('[data-box-close]').addEventListener('click',()=>select(null));
    inspector.querySelector('[data-box-delete]').addEventListener('click',remove);
    inspector.querySelector('[data-box-copy]').addEventListener('click',duplicate);
    inspector.querySelector('[name=fontFamily]').addEventListener('change',event=>updateAppearance('fontFamily',fonts[event.target.value]||''));
    inspector.querySelector('[name=fontWeight]').addEventListener('change',event=>updateAppearance('fontWeight',event.target.value));
    inspector.querySelector('[name=textColor]').addEventListener('input',event=>updateAppearance('color',event.target.value));
    const hexInput=inspector.querySelector('[name=colorHex]');
    hexInput.addEventListener('input',()=>{if(/^#[\da-f]{6}$/i.test(hexInput.value))updateAppearance('color',hexInput.value.toLowerCase());});
    hexInput.addEventListener('change',()=>{const el=byKey(selected);if(el)syncAppearance(el);});
    inspector.querySelectorAll('[data-color]').forEach(button=>button.addEventListener('click',()=>updateAppearance('color',button.dataset.color)));
    inspector.querySelector('[data-box-format-reset]').addEventListener('click',()=>{
      const el=byKey(selected);if(!el)return;
      if(window.PortfolioText?.apply(el,'clear','')){syncAppearance(el);return;}
      const spec=layout().fields[selected]||{};delete spec.appearance;apply(el);syncAppearance(el);positionHandle();changed('已恢复原有字体和颜色。');
    });
    inspector.querySelector('[data-rich-whole]').addEventListener('click',()=>{window.PortfolioText?.resetSelection(true);const el=byKey(selected);if(el)syncAppearance(el);});
    inspector.querySelector('[data-box-reset]').addEventListener('click',()=>{
      const el=byKey(selected);if(!el)return;const spec=layout().fields[selected]||{};['width','height','fontSize'].forEach(name=>delete spec[name]);apply(el);cleanup();select(el);changed('已恢复默认大小。');
    });
    inspector.querySelector('[data-box-home]').addEventListener('click',()=>{
      const el=byKey(selected);if(!el)return;const spec=layout().fields[selected]||{};delete spec.x;delete spec.y;apply(el);select(el);changed('已恢复原位。');
    });
    inspector.querySelectorAll('.box-dimensions input,.box-position input').forEach(input=>input.addEventListener('input',()=>{if(input.value===''||input.validity.valid)updateStyle(input.name,input.value);}));
    addDialog=document.createElement('dialog');addDialog.className='add-text-dialog';addDialog.setAttribute('aria-labelledby','add-text-title');
    addDialog.innerHTML='<form><h2 id="add-text-title">添加文本框</h2><label>放置位置<select name="target" aria-label="放置位置"></select></label><fieldset class="decoration-picker" hidden><legend>选择装饰</legend>'+Object.entries(decorations).map(([id,[name,symbol]],i)=>'<label><input type="radio" name="decoration" value="'+id+'" '+(i===0?'checked':'')+'><span aria-hidden="true">'+symbol+'</span>'+name+'</label>').join('')+'</fieldset><label class="add-text-content">文字内容<textarea aria-label="文字内容" rows="5" placeholder="输入你想添加的文字" maxlength="50000" required></textarea></label><div class="add-text-actions"><button type="button" data-add-cancel>取消</button><button class="editor-save" type="submit">添加</button></div></form>';
    document.body.append(addDialog);
    addDialog.querySelector('[data-add-cancel]').addEventListener('click',()=>addDialog.close());
    addDialog.querySelector('form').addEventListener('submit',event=>{
      if(layout().blocks.length>=200){event.preventDefault();addDialog.close();window.PortfolioEditor?.notify('已达到 200 个新增框的上限。');return;}
      event.preventDefault();const decoration=addDialog.dataset.mode==='decoration'?addDialog.querySelector('[name=decoration]:checked').value:null;
      const text=decoration?decorations[decoration][1]:addDialog.querySelector('textarea').value.trim();if(!text)return;
      const id='text-'+crypto.randomUUID(),block={id,target:addDialog.querySelector('select').value,text};if(decoration)block.decoration=decoration;layout().blocks.push(block);
      addDialog.close();window.PortfolioEditor?.refresh();select(byKey('custom:'+id));
      byKey('custom:'+id)?.focus();changed('已添加，可拖动移动或调整大小。');
    });
    document.addEventListener('focusin',event=>{if(active && event.target.matches('[data-edit]'))select(event.target);});
    document.addEventListener('click',event=>{const el=event.target.closest('[data-edit]');if(active&&el)select(el);},true);
    document.addEventListener('pointerdown',event=>{
      const el=event.target.closest('.box-selected');if(!active||!el)return;
      const r=el.getBoundingClientRect();
      if(event.clientX>r.right-22&&event.clientY>r.bottom-22){dragging=el;dragChanged=false;}
    },true);
    observer=new ResizeObserver(entries=>{
      if(!dragging||!active)return;
      const el=dragging;if(!entries.some(e=>e.target===el))return;
      const parent=el.parentElement.getBoundingClientRect();const r=el.getBoundingClientRect();
      const spec=layout().fields[el.dataset.layoutKey]||={};
      spec.width=Math.round(clamp(r.width/parent.width*100,10,100)*10)/10;spec.height=Math.round(clamp(r.height,0,1500));
      inspector.querySelector('[name=width]').value=spec.width;inspector.querySelector('[name=height]').value=spec.height;
      dragChanged=true;
      positionHandle();
    });
    function finishResize(){const el=dragging;dragging=null;if(el){apply(el);if(dragChanged)changed('文本框大小已修改，请保存。');}dragChanged=false;}
    document.addEventListener('pointerup',finishResize);
    document.addEventListener('pointercancel',finishResize);
    window.addEventListener('blur',finishResize);
    window.addEventListener('blur',()=>finishMove());
    window.addEventListener('resize',()=>{positionInspector();positionHandle();});
    document.addEventListener('scroll',positionHandle,true);
    document.addEventListener('portfolio:dialog-open',mountTools);
    document.addEventListener('portfolio:dialog-close',()=>{select(null);mountTools();});
  }
  function syncSelection(el){if(inspector&&!inspector.hidden&&selected===el.dataset.layoutKey)syncAppearance(el);}
  window.PortfolioLayout={init,refresh,setEditing,showAdd,restore,select,syncSelection};
})();
