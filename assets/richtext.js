(() => {
  'use strict';
  let selection=null,currentKey=null;
  const properties=['fontFamily','fontWeight','color'];
  const fields=()=>window.PORTFOLIO.layout.fields;
  const byKey=key=>[...document.querySelectorAll('[data-edit]')].find(el=>el.dataset.layoutKey===key);
  const plain=el=>el.dataset.edit.split('.').reduce((v,k)=>v?.[k],window.PORTFOLIO);
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function read(root) {
    let text='';const runs=[];
    function append(value,format) {
      if(!value)return;const start=text.length;text+=value;
      if(!format.fontSize&&!Object.keys(format.appearance||{}).length)return;
      const last=runs.at(-1),style={};
      if(format.fontSize)style.fontSize=format.fontSize;
      if(Object.keys(format.appearance||{}).length)style.appearance={...format.appearance};
      if(last&&last.end===start&&same({fontSize:last.fontSize,appearance:last.appearance},{fontSize:style.fontSize,appearance:style.appearance}))last.end=text.length;
      else runs.push({start,end:text.length,...style});
    }
    function walk(node,format={}) {
      if(node.nodeType===Node.TEXT_NODE){append(node.nodeValue,format);return;}
      if(node.nodeType!==Node.ELEMENT_NODE&&node.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
      if(node.nodeName==='BR'){append('\n',format);return;}
      const next={...format,appearance:{...format.appearance}};
      if(node!==root&&node.style){
        properties.forEach(name=>{if(node.style[name])next.appearance[name]=node.style[name];});
        if(node.style.fontSize)next.fontSize=parseFloat(node.style.fontSize);
      }
      const block=node!==root&&['DIV','P','LI'].includes(node.nodeName);
      if(block&&text&&!text.endsWith('\n'))append('\n',format);
      [...node.childNodes].forEach(child=>walk(child,next));
      if(block&&node.nextSibling&&!text.endsWith('\n'))append('\n',format);
    }
    walk(root);
    if(root.childNodes.length===1&&root.firstChild.nodeName==='BR')text='';
    return {text,runs:runs.filter(run=>run.end<=text.length)};
  }
  function normalize(text,runs) {
    const result=[];
    [...runs].sort((a,b)=>a.start-b.start).forEach(run=>{
      const start=Math.max(0,run.start,result.at(-1)?.end||0),end=Math.min(text.length,run.end);
      if(end<=start)return;
      const value={start,end};
      if(run.fontSize)value.fontSize=run.fontSize;
      if(Object.keys(run.appearance||{}).length)value.appearance={...run.appearance};
      if(!value.fontSize&&!value.appearance)return;
      const last=result.at(-1);
      if(last&&last.end===start&&same({fontSize:last.fontSize,appearance:last.appearance},{fontSize:value.fontSize,appearance:value.appearance}))last.end=end;
      else result.push(value);
    });return result;
  }
  function store(el,model) {
    const key=el.dataset.layoutKey;if(!key)return;
    const spec=fields()[key]||={};
    const runs=normalize(model.text,model.runs);
    if(runs.length)spec.richText={text:model.text,runs};else delete spec.richText;
  }
  function paint(el,model) {
    el.replaceChildren();let offset=0;
    model.runs.forEach(run=>{
      if(run.start>offset)el.append(document.createTextNode(model.text.slice(offset,run.start)));
      const span=document.createElement('span');span.dataset.richRun='';span.textContent=model.text.slice(run.start,run.end);
      properties.forEach(name=>{if(run.appearance?.[name])span.style[name]=run.appearance[name];});
      if(run.fontSize)span.style.fontSize=run.fontSize+'px';
      el.append(span);offset=run.end;
    });
    if(offset<model.text.length||!el.childNodes.length)el.append(document.createTextNode(model.text.slice(offset)));
  }
  function rebase(model,text) {
    let start=0;while(start<model.text.length&&start<text.length&&model.text[start]===text[start])start++;
    let oldEnd=model.text.length,newEnd=text.length;
    while(oldEnd>start&&newEnd>start&&model.text[oldEnd-1]===text[newEnd-1]){oldEnd--;newEnd--;}
    const delta=newEnd-oldEnd;
    const runs=model.runs.filter(run=>!(run.start>=start&&run.end<=oldEnd&&oldEnd>start)).map(run=>({
      ...run,start:run.start<=start?run.start:run.start>=oldEnd?run.start+delta:start,
      end:run.end<=start?run.end:run.end>=oldEnd?run.end+delta:newEnd
    }));return {text,runs:normalize(text,runs)};
  }
  function render(el) {
    if(el.dataset.decoration)return;
    const spec=fields()[el.dataset.layoutKey],text=plain(el);
    if(typeof text!=='string'||!spec?.richText)return;
    const model=spec.richText.text===text?spec.richText:rebase(spec.richText,text);
    store(el,model);paint(el,model);
  }
  function active(el) {return !!selection&&selection.key===el?.dataset.layoutKey&&selection.end>selection.start;}
  function select(el) {
    const key=el?.dataset.layoutKey;
    if(currentKey!==key){selection=null;currentKey=key;}updateNote();
  }
  function resetSelection(clearNative=false) {
    selection=null;if(clearNative)window.getSelection()?.removeAllRanges();updateNote();
  }
  function updateNote() {
    const panel=document.querySelector('.box-inspector');if(!panel)return;
    const el=byKey(currentKey),local=active(el),note=panel.querySelector('.rich-selection-note');
    if(note)note.textContent=local?'已选中 '+(selection.end-selection.start)+' 个字，仅修改所选文字':'整框编辑：拖选文字可局部修改';
    const button=panel.querySelector('[data-rich-whole]');if(button)button.hidden=!local;
    const reset=panel.querySelector('[data-box-format-reset]');if(reset)reset.textContent=local?'清除所选样式':'默认字体颜色';
  }
  function endpoint(root,node,offset) {
    const range=document.createRange();range.selectNodeContents(root);range.setEnd(node,offset);return read(range.cloneContents()).text.length;
  }
  function capture() {
    if(!document.body.classList.contains('text-editing')||document.body.classList.contains('section-boundary-editing'))return;
    const range=window.getSelection();if(!range?.rangeCount)return;
    const anchor=range.anchorNode?.nodeType===Node.ELEMENT_NODE?range.anchorNode:range.anchorNode?.parentElement;
    const focus=range.focusNode?.nodeType===Node.ELEMENT_NODE?range.focusNode:range.focusNode?.parentElement;
    const el=anchor?.closest?.('[data-edit]');
    if(!el||el.dataset.decoration||focus?.closest?.('[data-edit]')!==el)return;
    currentKey=el.dataset.layoutKey;
    if(range.isCollapsed)selection=null;
    else {
      const a=endpoint(el,range.anchorNode,range.anchorOffset),b=endpoint(el,range.focusNode,range.focusOffset);
      selection={key:currentKey,start:Math.min(a,b),end:Math.max(a,b)};
    }
    updateNote();window.PortfolioLayout?.syncSelection(el);
  }
  function restore(el) {
    if(!active(el))return;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    function at(offset) {
      for(const node of nodes){if(offset<=node.length)return [node,offset];offset-=node.length;}
      return nodes.length?[nodes.at(-1),nodes.at(-1).length]:[el,0];
    }
    const range=document.createRange();range.setStart(...at(selection.start));range.setEnd(...at(selection.end));
    const native=window.getSelection();native.removeAllRanges();native.addRange(range);
  }
  function apply(el,name,value) {
    if(!active(el))return false;
    const model=read(el),marks=new Set([0,model.text.length,selection.start,selection.end]);
    model.runs.forEach(run=>{marks.add(run.start);marks.add(run.end);});
    const edges=[...marks].sort((a,b)=>a-b),runs=[];
    for(let i=0;i<edges.length-1;i++){
      const start=edges[i],end=edges[i+1],before=model.runs.find(run=>run.start<=start&&run.end>=end);
      const run={start,end,...(before?.fontSize?{fontSize:before.fontSize}:{}),appearance:{...before?.appearance}};
      if(start>=selection.start&&end<=selection.end){
        if(name==='clear'){delete run.fontSize;run.appearance={};}
        else if(name==='fontSize'){if(value==='')delete run.fontSize;else run.fontSize=Number(value);}
        else if(value==='')delete run.appearance[name];else run.appearance[name]=value;
      }
      runs.push(run);
    }
    const next={text:model.text,runs:normalize(model.text,runs)};
    if(next.runs.length>1000){window.PortfolioEditor?.notify('这段文字的样式较多，请先清除部分样式。');return true;}
    store(el,next);paint(el,next);restore(el);updateNote();
    window.PortfolioEditor?.changed('所选文字的样式已修改，请保存。');return true;
  }
  function style(el) {
    if(!active(el))return null;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let offset=0;
    while(walker.nextNode()){
      if(offset+walker.currentNode.length>selection.start)return getComputedStyle(walker.currentNode.parentElement);
      offset+=walker.currentNode.length;
    }return getComputedStyle(el);
  }
  function input(el) {const model=read(el);store(el,model);return model.text;}
  function snapshot(el) {const model=read(el);return model.runs.length?model:null;}
  function init() {document.addEventListener('selectionchange',capture);}
  window.PortfolioText={init,render,select,resetSelection,active,apply,style,input,snapshot,updateNote};
})();
