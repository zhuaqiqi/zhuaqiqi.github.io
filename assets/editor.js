(() => {
  'use strict';
  const local = ['127.0.0.1','localhost','[::1]'].includes(location.hostname) || location.protocol === 'file:';
  const requested = new URLSearchParams(location.search).has('edit');
  if (!local) return;
  const key = 'jiaqi-editorial-draft-v1';
  const data = window.PORTFOLIO;
  let source = JSON.stringify(data), active = false, dirty = false, snapshot, revision, toolbar, entry;
  let draftMessage = '';
  const copy = obj => JSON.parse(JSON.stringify(obj));
  const replace = obj => { Object.keys(data).forEach(k => delete data[k]); Object.assign(data, copy(obj)); };
  // Merge text-only draft changes by stable work ID when the catalog is reorganized.
  let originalDraft = null;
  function mergeDraft(base, draft, current, path = '') {
    if (JSON.stringify(base) === JSON.stringify(draft)) return current;
    if (path === 'layout' && JSON.stringify(base) === JSON.stringify(current)) return copy(draft);
    if (typeof base === 'string' && typeof draft === 'string') {
      return current === base || current === draft ? draft : current;
    }
    if (Array.isArray(base) && Array.isArray(draft) && Array.isArray(current)) {
      if (path === 'projects') return current.map(item => {
        const before = base.find(p => p.id === item.id);
        const after = draft.find(p => p.id === item.id);
        return before && after ? mergeDraft(before,after,item,'project') : item;
      });
      return current.map((item,i) => i < base.length && i < draft.length ? mergeDraft(base[i],draft[i],item,path + '.' + i) : item);
    }
    if (base && draft && current && typeof base === 'object' && typeof draft === 'object' && typeof current === 'object') {
      return Object.fromEntries(Object.entries(current).map(([k,value]) => [k,
        Object.hasOwn(base,k) && Object.hasOwn(draft,k) ? mergeDraft(base[k],draft[k],value,path ? path + '.' + k : k) : value
      ]));
    }
    return current;
  }
  try {
    const draft = JSON.parse(localStorage.getItem(key));
    if (draft?.data && typeof draft.data === 'object') {
      if (draft.base === source) {
        replace(draft.data); dirty = true; draftMessage = '已恢复未保存的浏览器草稿';
      } else if (typeof draft.base === 'string') {
        originalDraft = draft.data;
        localStorage.setItem(key + '-previous-catalog',JSON.stringify(draft));
        const merged = mergeDraft(JSON.parse(draft.base),draft.data,copy(data));
        replace(merged); dirty = JSON.stringify(data) !== source;
        if (dirty) {
          localStorage.setItem(key,JSON.stringify({base:source,data}));
          draftMessage = '已保留原有文字草稿，并同步新的作品目录。';
        } else {
          localStorage.removeItem(key);
          draftMessage = '作品目录已更新，之前的文字已保留。';
        }
      }
    }
  } catch {}
  const config = local && location.protocol !== 'file:' ? fetch('/__editor/config', {cache:'no-store'})
    .then(r => r.ok ? r.json() : null).then(c => { revision = c?.revision; return c; }).catch(() => null) : Promise.resolve(null);
  const resolve = path => path.split('.').reduce((v,k) => v?.[k], data);
  function set(path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const parent = parts.reduce((v,k) => v?.[k], data);
    if (parent && typeof parent[last] === 'string') parent[last] = value;
  }
  function status(message) { if (toolbar) toolbar.querySelector('[role=status]').textContent = message; }
  function storeDraft() {
    try { localStorage.setItem(key, JSON.stringify({base:source,data})); return true; }
    catch { return false; }
  }
  function refresh() {
    window.PortfolioText?.resetSelection();
    window.PortfolioLayout?.refresh();
    window.PortfolioLayout?.setEditing(active);
    window.PortfolioSections?.refresh();
    window.PortfolioSections?.setEditing(active);
    window.PortfolioDividers?.refresh();
    window.PortfolioDividers?.setEditing(active);
    window.PortfolioDisclosures?.refresh();
    window.PortfolioDisclosures?.setEditing(active);
    document.querySelectorAll('[data-edit]').forEach(el => {
      if (active) {
        el.setAttribute('contenteditable', el.dataset.decoration ? 'false' : 'plaintext-only');
        el.setAttribute('role', el.dataset.decoration ? 'button' : 'textbox');
        el.setAttribute('aria-label', (el.dataset.decoration ? '选择装饰：' : '修改文字：') + (el.textContent || el.dataset.placeholder || '空白文字').slice(0,45));
        el.setAttribute('spellcheck', 'false');
        el.tabIndex = 0;
      } else {
        ['contenteditable','role','aria-label','spellcheck','tabindex'].forEach(attr => el.removeAttribute(attr));
      }
    });
  }
  function sync(path, origin) {
    document.querySelectorAll('[data-edit]').forEach(el => {
      if (el.dataset.edit === path && el !== origin) el.textContent = resolve(path);
      if (el.dataset.edit === path && el !== origin) window.PortfolioText?.render(el);
    });
    if (path === 'email') document.querySelectorAll('[data-email-link]').forEach(a => a.href = 'mailto:' + data.email);
  }
  function start() {
    snapshot = copy(data); active = true;
    document.body.classList.add('text-editing');
    entry.hidden = true; toolbar.hidden = false;
    refresh();
    status(draftMessage || '选中后可拖动移动、调整大小，也可添加文字和装饰。');
    draftMessage = '';
  }
  function finish() {
    active = false; document.body.classList.remove('text-editing');
    toolbar.hidden = true; entry.hidden = false; refresh();
  }
  async function save() {
    if (!storeDraft()) { status('浏览器存储不可用，请导出文字备份。'); return false; }
    const c = await config;
    if (!c?.token) {
      status('已存为本浏览器草稿。要更新网站文件，请导出文字并替换 assets/content.js。');
      return true;
    }
    const button = toolbar.querySelector('[data-action=save]');
    button.disabled = true; status('正在保存到网站文件…');
    try {
      const response = await fetch('/__editor/save', {
        method:'POST', headers:{'Content-Type':'application/json','X-Portfolio-Token':c.token},
        body:JSON.stringify({revision,content:data})
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '保存失败');
      revision = result.revision; source = JSON.stringify(data); dirty = false; snapshot = copy(data);
      try { localStorage.removeItem(key); } catch {}
      status(result.packaged ? '已保存到网站文件，发布包也已更新。' : '文字已保存，发布包生成失败，可稍后重试。');
      return true;
    } catch (error) {
      status(error.message + '；修改仍保留在浏览器草稿中。'); return false;
    } finally { button.disabled = false; }
  }
  function download(value = data) {
    const content = '/* 网页编辑导出的个人网站文字 */\nwindow.PORTFOLIO = ' + JSON.stringify(value,null,2) + ';\n';
    const url = URL.createObjectURL(new Blob([content],{type:'text/javascript;charset=utf-8'}));
    const a = document.createElement('a'); a.href=url; a.download='content.js'; a.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    status('文字备份已导出。');
  }
  function init() {
    entry = document.createElement('button'); entry.className='editor-entry'; entry.type='button'; entry.textContent='编辑文字';
    entry.addEventListener('click',start); document.body.append(entry);
    toolbar=document.createElement('aside'); toolbar.className='editor-toolbar'; toolbar.hidden=true; toolbar.setAttribute('aria-label','文字编辑工具');
    toolbar.innerHTML='<div class="editor-hint"><strong>页面编辑</strong><p role="status" aria-live="polite"></p></div><div class="editor-actions"><button type="button" data-action="sections" aria-pressed="false">栏目边界</button><button type="button" data-action="dividers" aria-pressed="false">分隔线</button><button type="button" data-action="disclosures" aria-pressed="false">小三角</button><button type="button" data-action="add">添加文本框</button><button type="button" data-action="decorate">添加装饰</button><button type="button" data-action="restore">恢复删除</button><button type="button" data-action="undo">撤销本次</button><button type="button" data-action="export">导出文字</button><button type="button" data-action="original" hidden>原草稿备份</button><button type="button" data-action="save" class="editor-save">保存修改</button><button type="button" data-action="finish">完成</button></div>';
    document.body.append(toolbar);
    toolbar.querySelector('[data-action=save]').addEventListener('click',save);
    toolbar.querySelector('[data-action=sections]').addEventListener('click',()=>window.PortfolioSections?.toggle());
    toolbar.querySelector('[data-action=dividers]').addEventListener('click',()=>window.PortfolioDividers?.toggle());
    toolbar.querySelector('[data-action=disclosures]').addEventListener('click',()=>window.PortfolioDisclosures?.toggle());
    toolbar.querySelector('[data-action=add]').addEventListener('click',()=>{window.PortfolioSections?.exit();window.PortfolioDividers?.exit();window.PortfolioDisclosures?.exit();window.PortfolioLayout?.showAdd();});
    toolbar.querySelector('[data-action=decorate]').addEventListener('click',()=>{window.PortfolioSections?.exit();window.PortfolioDividers?.exit();window.PortfolioDisclosures?.exit();window.PortfolioLayout?.showAdd('decoration');});
    toolbar.querySelector('[data-action=restore]').addEventListener('click',()=>{window.PortfolioLayout?.restore();refresh();});
    toolbar.querySelector('[data-action=export]').addEventListener('click',()=>download());
    const originalButton=toolbar.querySelector('[data-action=original]');
    originalButton.hidden=!originalDraft;
    originalButton.addEventListener('click',()=>download(originalDraft));
    toolbar.querySelector('[data-action=finish]').addEventListener('click',async()=>{ if(!dirty || await save()) finish(); });
    toolbar.querySelector('[data-action=undo]').addEventListener('click',()=>{
      replace(snapshot);
      window.PortfolioLayout?.refresh();
      document.querySelectorAll('[data-edit]').forEach(el => { const value=resolve(el.dataset.edit); if(typeof value==='string')el.textContent=value; });
      document.querySelectorAll('[data-email-link]').forEach(a => a.href='mailto:' + data.email);
      dirty = JSON.stringify(data) !== source;
      if(dirty) storeDraft(); else try { localStorage.removeItem(key); } catch {}
      refresh(); status('已撤销本次编辑；已保存的文字保留。');
    });
    document.addEventListener('click',event=>{
      if(active && event.target.closest('[data-edit]')) { event.preventDefault(); event.stopPropagation(); }
    },true);
    document.addEventListener('input',event=>{
      const field=event.target.closest('[data-edit]'); if(!active || !field) return;
      const value=(window.PortfolioText?.input(field)??field.innerText).replace(/\r\n/g,'\n').replace(/\u00a0/g,' ');
      set(field.dataset.edit,value); sync(field.dataset.edit,field); dirty=true;
      status(storeDraft() ? '有未保存修改，已暂存浏览器草稿。' : '草稿暂存失败，请保存或导出。');
    });
    document.addEventListener('paste',event=>{
      const field=event.target.closest('[data-edit]'); if(!active || !field) return;
      event.preventDefault();
      const selection=window.getSelection(); if(!selection.rangeCount) return;
      const range=selection.getRangeAt(0); range.deleteContents();
      const text=document.createTextNode(event.clipboardData.getData('text/plain'));
      range.insertNode(text); range.setStartAfter(text); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
      field.dispatchEvent(new Event('input',{bubbles:true}));
    });
    document.addEventListener('keydown',event=>{
      if(active && (event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='s') {event.preventDefault(); save();}
      if(active && event.target.closest('[data-edit]')) event.stopPropagation();
    },true);
    window.addEventListener('beforeunload',event=>{if(dirty){storeDraft();event.preventDefault();event.returnValue='';}});
    if(requested) start();
  }
  function changed(message) { dirty=true;status(storeDraft() ? message : '暂存失败，请保存或导出备份。'); }
  window.PortfolioEditor={init,refresh,changed,notify:status};
})();
