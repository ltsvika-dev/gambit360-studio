const $ = id => document.getElementById(id) || (($.m = $.m || {})[id] = $.m[id] || document.createElement('div'));   // an element cut out of the client's copy answers as a detached one, so the code that mentions it still runs
const msg = (t, err) => { $('msg').textContent = t; $('msg').className = err ? 'err' : ''; $('bootMsg').textContent = err ? '' : t; };
const hideBoot = () => { $('boot').hidden = true; };
// While the "tour expired" cover is up, nothing underneath can be operated (keyboard, mouse, wheel, touch).
['keydown', 'keyup', 'keypress', 'wheel', 'contextmenu', 'pointerdown', 'mousedown', 'touchstart', 'dblclick'].forEach(ev => window.addEventListener(ev, e => {
  const b = document.getElementById('expiredBox'); if (!b || b.hidden || e.target.closest('#expiredBox')) return;
  if (e.type === 'keydown' && e.key === 'Escape') { b.hidden = true; }
  e.stopImmediatePropagation(); e.preventDefault();
}, { capture:true, passive:false }));
// The pill at the top: project name, then the manager, then the remaining storage time (each line only when there is something to show).
function renderTitle() {
  const pt = $('projTitle'), title = window.PROJ_TITLE || '', mgr = window.PROJ_MANAGER || '';
  let exp = '', cls = '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(window.G360_EXPIRES || '');
  if (m) {
    const ms = new Date(+m[1], +m[2] - 1, +m[3] + 1) - new Date(), n = Math.floor(ms / 864e5);   // until the end of the last day
    exp = ms <= 0 ? t('expEnded') : t('expLeft', n); cls = ms <= 0 ? ' end' : (n <= 30 ? ' warn' : '');
  }
  pt.textContent = title;
  const line = (txt, c) => { const d = document.createElement('div'); d.className = 'pm' + (c || ''); d.textContent = txt; pt.appendChild(d); };
  if (title && mgr) line(mgr);
  for (const id of ['mpExp', 'tourExp']) { const me = $(id); if (me) { me.textContent = exp; me.className = cls.trim(); me.hidden = !exp; } }   // the remaining storage time sits in the tour window, not in the title
  const lines = (title ? 1 : 0) + (title && mgr ? 1 : 0);
  pt.hidden = lines === 0;
  document.body.classList.toggle('hasTitle', lines > 0);
  document.body.classList.toggle('hasMgr', lines > 1);
  document.body.classList.toggle('hasTl3', lines > 2);
}
function setExpiry(end) { window.G360_EXPIRES = end || ''; renderTitle(); }
function setProjectTitle(name, manager) {
  window.PROJ_TITLE = name || ''; window.PROJ_MANAGER = manager || '';
  renderTitle();
  $('bootTitle').textContent = window.PROJ_TITLE; $('bootMgr').textContent = window.PROJ_TITLE ? window.PROJ_MANAGER : '';
  document.title = (window.PROJ_TITLE ? window.PROJ_TITLE + ' | ' : '') + t('title');
}
{ const li = document.querySelector('#logo img'); if (li && li.src) { $('bootLogo').src = li.src; $('bootLogo').hidden = false; } }

if (typeof THREE === 'undefined' || !THREE.OBJLoader || !THREE.MTLLoader) {
  msg(t('libMissing'), true); hideBoot();
  $('picker').disabled = true; $('pickerE57').disabled = true;
} else {
  let renderer, scene, camera, model, walkable = false, overview = false, twoSided = true;
  let yaw = 0, pitch = 0, locked = false, scale = 1, EYE = 1.6, span = 20, saved = null, tween = null;
  let acc = 0, blockCache = false, floorY = null;
  let dollhouse = false, orb = { az:0.8, el:0.8, dist:10, r:10, target:null }, orbGoal = { az:0.8, el:0.8, dist:10 };
  let basePR = 2, resTimer = 0;
  // While the model is being orbited/zoomed render at 1x so the motion stays smooth; restore the sharp resolution when it settles.
  function lowRes() {
    if (!renderer) return;
    clearTimeout(resTimer);
    if (renderer.getPixelRatio() !== 1) { renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight); }
    if (ptsLow && ptsMain) { ptsMain.visible = false; ptsLow.visible = true; }   // a lighter copy of the cloud while it is being turned or zoomed
    resTimer = setTimeout(() => { if (renderer.getPixelRatio() !== basePR) { renderer.setPixelRatio(basePR); renderer.setSize(innerWidth, innerHeight); } if (ptsLow && ptsMain) { ptsMain.visible = true; ptsLow.visible = false; } }, 220);
  }
  let floors = [], floorCeil = [], curFloor = -1, clipY = Infinity, clipPlane;
  let measuring = false, pending = null, measures = [], measMat;
  let areaMode = false, draft = null, areas = [], fillMat;
  let pickDot, rubber = null, modelBox, lastWheel = 0, wheelDist = 10;
  let drag = null, lastMove = 0, dragMoved = 0, marker, markAcc = 0, markKey = '', mouseNDC = new THREE.Vector2(), mouseIn = false;
  const keys = {}, clock = new THREE.Clock(), ray = new THREE.Raycaster();
  let mouseDown = false, started = false, current = null, maxAniso = 1;
  let hoverV = null, hoverMat, accentLin = new THREE.Color(0x5ec4b6);
  const whiteCol = new THREE.Color(0xffffff);
  let baseSize = 0.02;
  let pointMode = false, pcGrid = null, pcMat = null, stationsPC = [], sizeMul = 1;
  let lastPromo = null;   // { blob, ext, name } the video that goes into the next client package
  let panoSrc = null, panoOn = false, panoCur = -1, panoA = null, panoB = null, panoMove = null, panoF0 = 0, panoRetry = 0, panoSavedClip = null, panoCache = new Map(), lastE57 = null;
  let ptsMain = null, ptsLow = null; const look = { on:false, y:0, p:0 };
  // Real view (panoramas) is the normal way to look. The client keeps his own choice apart from the owner's, so letting him see the point cloud never makes it the starting view.
  const PANO_KEY = window.G360_CLIENT ? 'tourViewerPanoClient' : 'tourViewerPano';
  let panoPref = (() => { try { return localStorage.getItem(PANO_KEY) !== '0'; } catch (err) { return true; } })();

