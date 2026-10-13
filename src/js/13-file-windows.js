// ===== File windows open in the folder used last time for the same kind of file (scans, projects, Studio folder, live tours) =====
// The browser's own memory of this does not work for a page opened from the computer (file://), so the last file or folder picked
// is kept here (only a pointer, in this browser) and the next window starts there.
const g360Pick = (() => {
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('g360pickers', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const get = async k => { try { const d = await db(); return await new Promise(res => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } };
  const put = async (k, v) => { try { const d = await db(); d.transaction('kv', 'readwrite').objectStore('kv').put(v, k); } catch (e) {} };
  async function pick(fn, opts) {
    const k = opts.id || 'any', last = await get(k), o = Object.assign({}, opts);
    if (last) { o.startIn = last; delete o.id; }
    let r;
    try { r = await window[fn](o); }
    catch (e) {
      if (!last || (e && e.name === 'AbortError')) throw e;
      r = await window[fn](opts);   // the remembered folder is gone (moved or deleted): open the window as before
    }
    put(k, Array.isArray(r) ? r[0] : r);
    return r;
  }
  return { open: o => pick('showOpenFilePicker', o), dir: o => pick('showDirectoryPicker', o), save: o => pick('showSaveFilePicker', o) };
})();
