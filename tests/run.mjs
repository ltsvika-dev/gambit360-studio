// Checks the Studio in a real browser (Chromium through Playwright), the way it was checked by hand so far:
//  1. a tour made by an older Studio opens, every section of its editor opens, and nothing throws;
//  2. a new tour has every field from the start (the same as a tour that was loaded again);
//  3. publishing uploads it to a local PHP site, and the published page's details card is the card the preview shows;
//  4. a second computer with the same key gets the tour from the server (cloud sync);
//  5. point cloud: tag types (infrastructure set), quick mode, layers, and the PDF tag report;
//  6. point-cloud projects in the cloud: computer A's tags reach the server, computer B opens the project from the cloud, and B's change comes back to A.
// Needs node, php and the built "Gambit360 Studio.html". Run:  npm install  then  npm test   (in this folder)
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const HTML = process.argv[2] || path.join(REPO, 'Gambit360 Studio.html');
const KEY = 'test-upload-key-0123456789', STUDIO_PORT = 8091, SITE_PORT = 8092;
const SITE = `http://127.0.0.1:${SITE_PORT}/`, STUDIO = `http://127.0.0.1:${STUDIO_PORT}/studio.html`;
const OLD_TOUR = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'old-tour.json'), 'utf8')); delete OLD_TOUR._note;

let failed = 0;
const ok = (cond, what, detail) => { console.log((cond ? 'ok    ' : 'FAIL  ') + what); if (!cond) { failed++; if (detail) console.log('      ' + String(detail).replace(/\n/g, '\n      ')); } };

// ---- the two local "servers": the Studio's folder and the live tours site (with the rewrite .htaccess does on the real site) ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g360test-')), studioDir = path.join(tmp, 'studio'), siteDir = path.join(tmp, 'site');
fs.mkdirSync(studioDir); fs.mkdirSync(siteDir);
fs.copyFileSync(HTML, path.join(studioDir, 'studio.html'));
libs(path.join(studioDir, 'lib'));
const html = fs.readFileSync(HTML, 'utf8'), tpl = id => html.match(new RegExp('<script type="text/plain" id="' + id + '">([\\s\\S]*?)</script>'))[1];
fs.writeFileSync(path.join(siteDir, 'upload.php'), tpl('g360UploadTpl').replace('@@KEYHASH@@', crypto.createHash('sha256').update(KEY).digest('hex')).replace('@@LOGO@@', ''));
fs.writeFileSync(path.join(tmp, 'router.php'), `<?php
$p = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($p !== '/' && (is_file(__DIR__ . '/site' . $p) || is_dir(__DIR__ . '/site' . $p))) return false;   // as RewriteCond !-f and !-d
if (preg_match('#^/([A-Za-z0-9][A-Za-z0-9_-]*)/?$#', $p, $m)) { $_GET['t'] = $m[1]; chdir(__DIR__ . '/site'); require __DIR__ . '/site/index.php'; return true; }
return false;
`);
const servers = [spawn('php', ['-S', '127.0.0.1:' + STUDIO_PORT, '-t', studioDir], { stdio: 'ignore' }), spawn('php', ['-S', '127.0.0.1:' + SITE_PORT, '-t', siteDir, path.join(tmp, 'router.php')], { stdio: 'ignore' })];

// three.js and its loaders: from lib/ next to the built HTML when it is there (as on the PC), otherwise from npm
function libs(dest) {
  const own = path.join(path.dirname(HTML), 'lib');
  if (fs.existsSync(path.join(own, 'three.min.js'))) { fs.cpSync(own, dest, { recursive: true }); return; }
  const cache = path.join(HERE, '.cache', 'three');
  if (!fs.existsSync(path.join(cache, 'package'))) {
    fs.mkdirSync(cache, { recursive: true });
    const tgz = execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['pack', 'three@0.128.0', '--silent'], { cwd: cache, shell: process.platform === 'win32' }).toString().trim().split('\n').pop();
    execFileSync('tar', ['-xzf', tgz], { cwd: cache });
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.copyFileSync(path.join(cache, 'package/build/three.min.js'), path.join(dest, 'three.min.js'));
  for (const f of ['OBJLoader.js', 'MTLLoader.js']) fs.copyFileSync(path.join(cache, 'package/examples/js/loaders', f), path.join(dest, f));
}

const wait = ms => new Promise(r => setTimeout(r, ms));
async function up(url) { for (let i = 0; i < 50; i++) { try { await fetch(url); return; } catch (e) { await wait(100); } } throw new Error('server did not start: ' + url); }

// one "computer": its own browser storage, with the upload key and the site address already in the live tours settings
async function computer(browser, name) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.dismiss());
  await page.goto(STUDIO);
  await page.evaluate(async ([key, site]) => {
    const d = await new Promise((res, rej) => { const r = indexedDB.open('gambit360live', 1); r.onupgradeneeded = () => { const x = r.result; x.createObjectStore('tours', { keyPath: 'id' }); x.createObjectStore('files'); x.createObjectStore('kv'); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    await new Promise(res => { const q = d.transaction('kv', 'readwrite').objectStore('kv').put({ upKey: key, upOn: true, base: site, sdk: '', folders: [], foldOpen: {}, locked: {} }, 'settings'); q.onsuccess = res; });
    d.close();
  }, [KEY, SITE]);
  await page.reload();
  return { ctx, page, errors, name };
}
const putTour = (page, t) => page.evaluate(async t => {
  const d = await new Promise(res => { const r = indexedDB.open('gambit360live', 1); r.onsuccess = () => res(r.result); });
  await new Promise(res => { const q = d.transaction('tours', 'readwrite').objectStore('tours').put(t); q.onsuccess = res; }); d.close();
}, t);
const getTours = page => page.evaluate(async () => {
  const d = await new Promise(res => { const r = indexedDB.open('gambit360live', 1); r.onsuccess = () => res(r.result); });
  const all = await new Promise(res => { const q = d.transaction('tours', 'readonly').objectStore('tours').getAll(); q.onsuccess = () => res(q.result); }); d.close(); return all;
});
const openLive = async page => { await page.evaluate(() => window.G360_openLive()); await page.waitForSelector('#live:not([hidden])'); await page.waitForTimeout(500); };
const clean = s => s.replace(/\s+/g, ' ').trim();

let browser;
try {
  await up(STUDIO); await up(SITE + 'upload.php');
  browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});

  // ---- 1. a tour from an older Studio ----
  const a = await computer(browser, 'computer A');
  const startErrors = a.errors.length;
  ok(startErrors === 0, 'the Studio opens without errors', a.errors.join('\n'));
  await putTour(a.page, OLD_TOUR);
  await openLive(a.page);
  await a.page.locator('#lvList').getByText(OLD_TOUR.name).first().click();
  await a.page.waitForTimeout(300);
  const heads = a.page.locator('#lvEdit .sec h4');
  const n = await heads.count();
  for (let i = 0; i < n; i++) { await heads.nth(i).click({ position: { x: 30, y: 8 } }); await a.page.waitForTimeout(80); }
  ok(n >= 8 && a.errors.length === 0, `the older tour opens and all ${n} editor sections open without errors`, a.errors.join('\n'));

  // ---- 2. a new tour has every field from the start ----
  const before = (await getTours(a.page)).map(t => t.id);
  await a.page.locator('#lvBar [data-n]').click();
  await a.page.waitForTimeout(600);
  const fresh = (await getTours(a.page)).find(t => !before.includes(t.id));
  const want = { vidMode: 'player', btnLbl: 'both', uiLang: 'auto' };
  ok(!!fresh && Object.keys(want).every(k => fresh[k] === want[k]) && fresh.btnSty.info.w === 0 && fresh.btnSty.info.r === 20 && fresh.btnPos.title === 'l' && Array.isArray(fresh.spots.list),
    'a new tour is stored with every field (as after loading it again)', JSON.stringify(fresh));
  ok(a.errors.length === 0, 'the new tour opens in the editor without errors', a.errors.join('\n'));

  // ---- 3. publish to the local site; the published details card is the preview's card ----
  await a.page.locator('#lvList').getByText(OLD_TOUR.name).first().click();
  await a.page.waitForTimeout(300);
  if (!(await a.page.evaluate(() => getComputedStyle(document.getElementById('lvPOv')).display === 'flex' && document.getElementById('lvPOv').dataset.k === 'info'))) await a.page.locator('#lvPInfo').click();   // the card may already be open (the details section opens it)
  await a.page.waitForSelector('#lvPOv .c h3');
  await a.page.waitForTimeout(300);
  const preview = clean(await a.page.locator('#lvPOv .c').innerHTML());
  await a.page.evaluate(() => document.querySelector('#lvPOv .x').click());
  await a.page.locator('#lvEdit button', { hasText: /^(פרסום|Publish)/ }).first().click();
  await a.page.waitForFunction(() => /הועל|upload/i.test(document.getElementById('lvMsg').textContent || '') && !/\d+\s*\/\s*\d+/.test(document.getElementById('lvMsg').textContent || ''), null, { timeout: 30000 }).catch(() => {});
  const cfgPath = path.join(siteDir, 'tours', OLD_TOUR.slug, 'config.json');
  ok(fs.existsSync(cfgPath) && fs.existsSync(path.join(siteDir, 'index.html')), 'publishing uploads index.html and the tour to the site', await a.page.locator('#lvMsg').textContent());
  const v = await computer(browser, 'visitor');
  await v.page.goto(SITE + OLD_TOUR.slug);
  await v.page.waitForSelector('#infoBtn:not([hidden])', { timeout: 10000 }).catch(() => {});
  await v.page.locator('#infoBtn').click();
  const published = clean(await v.page.locator('#ovBody').innerHTML());
  ok(published === preview, 'the published details card is exactly the card the preview shows', 'preview:   ' + preview + '\npublished: ' + published);
  ok(v.errors.length === 0, 'the published page runs without errors', v.errors.join('\n'));

  // ---- 4. another computer with the same key gets the tour from the server ----
  await openLive(a.page);   // syncs again, now with the published tour
  await a.page.waitForTimeout(2500);
  ok(fs.readdirSync(siteDir).some(f => f.startsWith('_bk_')), 'computer A keeps its tours on the server (cloud)');
  const b = await computer(browser, 'computer B');
  await openLive(b.page);
  await b.page.waitForFunction(name => (document.getElementById('lvList').textContent || '').includes(name), OLD_TOUR.name, { timeout: 15000 }).catch(() => {});
  ok((await b.page.locator('#lvList').textContent()).includes(OLD_TOUR.name), 'computer B gets the tour from the server');

  // my logo through the cloud: a logo removed on one computer stays removed on both (it used to come back from the server)
  const splashOn = pg => pg.evaluate(async () => { const d = await new Promise(res => { const r = indexedDB.open('gambit360live', 1); r.onsuccess = () => res(r.result); }); const v = await new Promise(res => { const q = d.transaction('files', 'readonly').objectStore('files').get('splash'); q.onsuccess = () => res(q.result); }); d.close(); return !!(v && v.blob); });
  const resync = async pg => { await pg.evaluate(() => { document.getElementById('lvClose').click(); }); await openLive(pg); await pg.waitForTimeout(2500); };
  await a.page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 120; c.height = 40; const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const d = await new Promise(res => { const r = indexedDB.open('gambit360live', 1); r.onsuccess = () => res(r.result); }); await new Promise(res => { const q = d.transaction('files', 'readwrite').objectStore('files').put({ blob, name: 'mine.png', type: 'image/png', ts: Date.now() }, 'splash'); q.onsuccess = res; }); d.close(); });
  await resync(a.page); await resync(b.page);
  ok(await splashOn(b.page), 'my logo from computer A reaches computer B through the cloud');
  await b.page.click('#lvSetBtn'); await b.page.waitForSelector('#lvSplRm:not([hidden])'); await b.page.click('#lvSplRm'); await b.page.waitForTimeout(300); await b.page.click('#lvSetOk');
  await resync(b.page); await resync(a.page); await resync(b.page);
  ok(!(await splashOn(a.page)) && !(await splashOn(b.page)), 'removing my logo on computer B removes it on A too, and it does not come back');
  // the same from the point-cloud side: computer A opens the Options screen without the tours screen, picks a new logo, then removes it
  const splashName = pg => pg.evaluate(async () => { const d = await new Promise(res => { const r = indexedDB.open('gambit360live', 1); r.onsuccess = () => res(r.result); }); const v = await new Promise(res => { const q = d.transaction('files', 'readonly').objectStore('files').get('splash'); q.onsuccess = () => res(q.result); }); d.close(); return v && v.blob ? v.name : ''; });
  await a.page.evaluate(() => document.getElementById('lvClose').click());
  await a.page.evaluate(() => window.G360_openSet()); await a.page.waitForSelector('#lvSet:not([hidden])');
  const pngA = Buffer.from(await a.page.evaluate(() => { const c = document.createElement('canvas'); c.width = 90; c.height = 30; c.getContext('2d').fillRect(0, 0, 90, 30); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
  const [fcA] = await Promise.all([a.page.waitForEvent('filechooser'), a.page.click('#lvSplPick')]);
  await fcA.setFiles({ name: 'from-cloud-module.png', mimeType: 'image/png', buffer: pngA });
  await a.page.waitForSelector('#lvSplRm:not([hidden])'); await a.page.click('#lvSetOk'); await a.page.waitForTimeout(6000);   // the change goes up by itself a few seconds later
  await resync(b.page);
  ok(await splashName(b.page) === 'from-cloud-module.png', 'a logo picked from the point-cloud module reaches the other computer', await splashName(b.page));
  await a.page.evaluate(() => window.G360_openSet()); await a.page.waitForSelector('#lvSplRm:not([hidden])'); await a.page.click('#lvSplRm'); await a.page.waitForTimeout(300); await a.page.click('#lvSetOk'); await a.page.waitForTimeout(6000);
  await resync(b.page); await resync(a.page); await resync(b.page);
  ok(!(await splashOn(a.page)) && !(await splashOn(b.page)), 'a logo removed from the point-cloud module stays removed on both computers');
  ok(b.errors.length === 0 && a.errors.length === 0, 'no errors on either computer', a.errors.concat(b.errors).join('\n'));

  // ---- 5. point cloud: tag types, quick mode, layers and the PDF report (fixtures/room.e57: a small box room) ----
  const s = await computer(browser, 'point cloud');
  await s.page.setInputFiles('#pickerE57', path.join(HERE, 'fixtures', 'room.e57'));
  await s.page.waitForSelector('#mbtn', { state: 'visible', timeout: 60000 });
  await s.page.waitForTimeout(800); await s.page.click('#b3d'); await s.page.waitForTimeout(800); await s.page.mouse.click(700, 600); await s.page.waitForTimeout(1500);
  await s.page.click('#viewsBtn'); await s.page.click('#tabTags'); await s.page.waitForTimeout(200);
  await s.page.click('#tagTyEdBtn'); await s.page.locator('#tagTyEd button', { hasText: /תשתיות|infrastructure/ }).click(); await s.page.click('#tagTyEd .tyOk');
  ok(await s.page.locator('#tagTyRow .tyChip').count() === 7, 'the infrastructure set adds 7 tag types, each with its layer switch');
  await s.page.selectOption('#tagQuickTy', 'i0'); await s.page.click('#tagQuick');
  for (const [x, y] of [[500, 400], [700, 450], [900, 380]]) { await s.page.mouse.click(x, y); await s.page.waitForTimeout(250); }
  await s.page.selectOption('#tagQuickTy', 'i1'); await s.page.mouse.click(600, 600); await s.page.waitForTimeout(250);
  await s.page.keyboard.press('Escape'); await s.page.waitForTimeout(200);
  const rows = () => s.page.locator('#viewsList .vrow').count();
  const made = await rows();
  const listed = await s.page.locator('#viewsList').textContent();
  ok(made >= 3 && listed.includes('חשמל 2') && listed.includes('אינסטלציה 1'), 'quick mode adds one numbered tag of the chosen type per click', 'tags listed: ' + made + ' ' + listed);
  await s.page.locator('#tagTyRow .tyChip input').first().uncheck(); await s.page.waitForTimeout(200);
  const elec = (listed.match(/חשמל \d/g) || []).length;
  ok(await rows() === made - elec, 'switching a layer off hides its tags');
  await s.page.click('#tagRepBtn');
  await s.page.waitForFunction(() => !!window.G360_lastReport, null, { timeout: 30000 }).catch(() => {});
  const rep = await s.page.evaluate(async () => { const b = window.G360_lastReport; if (!b) return null; const u = new Uint8Array(await b.arrayBuffer()); const txt = new TextDecoder('latin1').decode(u); return { head: txt.slice(0, 5), pages: (txt.match(/\/Type \/Page\b/g) || []).length }; });
  ok(!!rep && rep.head === '%PDF-' && rep.pages === 1 + Math.ceil((made - elec) / 2), 'the PDF report has a cover and the shown tags, two to a page', JSON.stringify(rep));
  ok(s.errors.length === 0, 'no errors in the point cloud tags', s.errors.join('\n'));

  // ---- 6. point-cloud projects in the cloud (only the project, the E57 stays on each computer) ----
  const tagCount = pg => pg.evaluate(() => (window.G360_extrasData().tags || []).length);
  const sTags = await tagCount(s.page);
  await s.page.evaluate(() => window.G360_cpTick()); await s.page.waitForTimeout(500);
  const pcDir = fs.readdirSync(siteDir).filter(f => f.startsWith('_bk_')).map(f => path.join(siteDir, f, 'pc'))[0];
  const pcFiles = pcDir && fs.existsSync(pcDir) ? fs.readdirSync(pcDir).filter(f => f.endsWith('.json')) : [];
  const onSrv = pcFiles.length === 1 ? JSON.parse(fs.readFileSync(path.join(pcDir, pcFiles[0]), 'utf8')) : null;
  ok(!!onSrv && onSrv.extras.tags.length === sTags && sTags >= 3, 'computer A keeps the project and its tags in the cloud by itself', pcFiles.join(', ') + ' tags here ' + sTags);
  ok(!fs.readdirSync(pcDir || siteDir).some(f => /\.e57/i.test(f)), 'the E57 itself is not uploaded');
  const c = await computer(browser, 'computer C');
  await c.page.waitForSelector('#cpOpenBtn:not([hidden])', { timeout: 10000 }).catch(() => {});
  ok(await c.page.locator('#cpOpenBtn').isVisible(), 'a computer connected to the cloud has "Open a project from the cloud" on the start screen');
  await c.page.click('#cpOpenBtn');
  await c.page.waitForSelector('#cpDlg .it', { timeout: 10000 }).catch(() => {});
  ok(await c.page.locator('#cpDlg .it').count() === 1, 'the cloud list shows the project');
  await c.page.click('#cpDlg .it .go');
  await c.page.waitForSelector('#resumeBox:not([hidden])', { timeout: 10000 }).catch(() => {});
  ok(await c.page.locator('#resumeBox').isVisible(), 'a computer without the scan file is asked to pick it once');
  await c.page.setInputFiles('#pickerE57', path.join(HERE, 'fixtures', 'room.e57'));
  await c.page.waitForSelector('#mbtn', { state: 'visible', timeout: 60000 });
  await c.page.waitForTimeout(2500);
  ok(await tagCount(c.page) === sTags, 'computer C gets the project from the cloud: the same tags', 'C has ' + await tagCount(c.page));
  await c.page.evaluate(() => { document.getElementById('pkgName').value = 'From computer C'; });
  await c.page.evaluate(() => window.G360_cpTick()); await c.page.waitForTimeout(500);
  await s.page.evaluate(() => { localStorage.setItem('g360pcAt:room', '1'); });   // A's own last change was long ago
  await s.page.reload(); await s.page.setInputFiles('#pickerE57', path.join(HERE, 'fixtures', 'room.e57'));
  await s.page.waitForSelector('#mbtn', { state: 'visible', timeout: 60000 });
  await s.page.waitForFunction(() => document.getElementById('pkgName').value === 'From computer C', null, { timeout: 15000 }).catch(() => {});
  ok(await s.page.evaluate(() => document.getElementById('pkgName').value) === 'From computer C' && await tagCount(s.page) === sTags, 'the newer copy from computer C comes back to computer A when the scan opens', JSON.stringify({ sTags, title: await s.page.evaluate(() => document.getElementById('pkgName').value), a: await s.page.evaluate(() => window.G360_extrasData().tags.map(x => x.n)), srv: JSON.parse(fs.readFileSync(path.join(pcDir, pcFiles[0]), 'utf8')).extras.tags.map(x => x.n) }));
  // a client package published on the site: the Studio asks, uploads the files, and gives the client's link
  const pub = c.page.evaluate(async () => {
    const root = await navigator.storage.getDirectory(), d = await root.getDirectoryHandle('pkg', { create: true }), entries = [];
    const put = async (dir, name, text, rel) => { const fh = await dir.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(text); await w.close(); entries.push({ path: 'Room/' + rel, fh }); };
    await put(d, 'Room.html', '<!doctype html><title>client</title>', 'Room.html');
    await put(await d.getDirectoryHandle('lib', { create: true }), 'three.min.js', '//three', 'lib/three.min.js');
    await put(await d.getDirectoryHandle('model', { create: true }), 'manifest.js', 'window.G360PKG={}', 'model/manifest.js');
    await window.G360_pkgPublish(entries, 'Room', 'Room.html');
    return document.getElementById('pkgPath').textContent;
  });
  await c.page.waitForFunction(() => { const a = document.getElementById('g360Ask'); return a && !a.hidden; }, null, { timeout: 15000 });
  const asked = await c.page.evaluate(() => document.querySelector('#g360Ask p').textContent); await c.page.evaluate(() => document.querySelector('#g360Ask .ok').click());
  const link = (await pub.catch(e => String(e))).split('\n')[0];
  const got = /\/p\/p[a-z0-9]{10}\/index\.html$/.test(link) ? await (await fetch(link)).text() : '';
  ok(got.includes('<title>client</title>') && (await (await fetch(link.replace('index.html', 'model/manifest.js'))).text()).includes('G360PKG'), 'after asking, a client package is published on the site and the client\'s link opens it', asked + ' ' + link);
  // the client downloads it as a ZIP with the code the Studio gave: the server builds the ZIP from the published files
  const code = ((await c.page.locator('#pkgPath').textContent()).match(/[A-Z2-9]{4}-[A-Z2-9]{4}/) || [])[0] || '', tok = (link.match(/\/p\/(p[a-z0-9]{10})\//) || [])[1] || '';
  const ask = async f => { const fd = new FormData(); fd.append('token', tok); Object.entries(f).forEach(([k, v]) => fd.append(k, v)); return (await fetch(SITE + 'upload.php', { method: 'POST', body: fd })).json(); };
  const info = await ask({ action: 'pkginfo' }), bad = await ask({ action: 'pkgdl', code: 'WRONG-CODE' }), good = await ask({ action: 'pkgdl', code: code.toLowerCase() });
  let zipOk = false, zipNote = '';
  if (good.ok) {
    const zb = Buffer.from(await (await fetch(SITE + good.url)).arrayBuffer()), zp = path.join(tmp, 'pkg.zip'); fs.writeFileSync(zp, zb);
    try { zipNote = execFileSync('python3', ['-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); bad=z.testzip(); print(sorted(z.namelist()), bad, [(i.filename,i.CRC,i.file_size) for i in z.infolist()]); assert bad is None; print(z.read("Room/Room.html").decode())', zp]).toString(); zipOk = zipNote.includes("'Room/lib/three.min.js'") && zipNote.includes("'Room/model/manifest.js'") && zipNote.includes('<title>client</title>'); } catch (e) { zipNote = String(e.stderr || e); }
  }
  ok(info.dl === true && bad.error === 'code' && zipOk, 'the client downloads the package as a ZIP only with the right code', JSON.stringify({ code, info, bad, good }) + ' ' + zipNote);
  const lists = await Promise.all(['p/', 'p/' + tok + '/lib/', 'p/' + tok + '/model/'].map(async u => (await (await fetch(SITE + u)).text()).length));
  ok(lists.every(n => n === 0), 'the package folders show an empty page, never a list of the files', JSON.stringify(lists));
  const expired = await (await fetch(SITE + 'upload.php?pkgget=' + tok + '&e=1&s=x')).status;
  ok(expired === 403, 'a download link without a valid signature is refused');
  // publishing again (the button in the package panel, or after updating the settings) keeps the link and sends only the files that changed
  ok(await c.page.locator('#pkgPubBtn').count() === 1, 'the package panel has a "publish the package on the server" button');
  const link2 = await c.page.evaluate(async () => {
    const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('pkg'), md = await d.getDirectoryHandle('model'), entries = [];
    const w = await (await md.getFileHandle('manifest.js')).createWritable(); await w.write('window.G360PKG={v:2}'); await w.close();
    entries.push({ path: 'Room/Room.html', fh: await d.getFileHandle('Room.html') }, { path: 'Room/lib/three.min.js', fh: await (await d.getDirectoryHandle('lib')).getFileHandle('three.min.js') }, { path: 'Room/model/manifest.js', fh: await md.getFileHandle('manifest.js') });
    const puts = []; const f0 = window.fetch; window.fetch = function (u, o) { if (/upload\.php/.test(String(u)) && o && o.method === 'POST') puts.push(o.body.get('action') + ':' + (o.body.get('path') || '')); return f0.apply(this, arguments); };   // pkglist, one pkgput, pkgdone and pkgcode
    try { await window.G360_pkgPublish(entries, 'Room', 'Room.html', { noAsk: true }); } finally { window.fetch = f0; }
    return { link: document.getElementById('pkgPath').textContent.split('\n')[0], puts };
  });
  const puts = link2.puts.filter(a => /^pkg/.test(a)).length;
  ok(link2.link === link && puts === 4 && (await (await fetch(link.replace('index.html', 'model/manifest.js'))).text()).includes('v:2'), 'publishing again keeps the same link and uploads only the changed file', JSON.stringify({ link2, puts }));
  ok(c.errors.length === 0 && s.errors.length === 0, 'no errors with projects in the cloud', c.errors.concat(s.errors).join('\n'));

  // ---- 7. the Options screen opens from the point-cloud module; my logo there becomes the Studio's logo; its width is for outputs only ----
  const logoBox = () => s.page.evaluate(() => { const r = document.querySelector('#logo').getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); });
  const lgBefore = await logoBox(), origSrc = await s.page.getAttribute('#logo img', 'src');
  await s.page.click('#optBtn'); await s.page.click('#liveSetMenuBtn');
  await s.page.waitForSelector('#lvSet:not([hidden])');
  ok(await s.page.evaluate(() => document.getElementById('live').hidden && document.getElementById('optMenu').hidden), 'the Options screen opens from the point-cloud Options menu, without the tours screen');
  const png = Buffer.from(await s.page.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 300; const g = c.getContext('2d'); g.fillStyle = '#d33'; g.fillRect(0, 0, 300, 300); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
  const [fc] = await Promise.all([s.page.waitForEvent('filechooser'), s.page.click('#lvSplPick')]);
  await fc.setFiles({ name: 'mine.png', mimeType: 'image/png', buffer: png });
  await s.page.waitForFunction(o => { const i = document.querySelector('#logo img'); return i.src !== o && i.src.startsWith('data:image/png'); }, origSrc, { timeout: 10000 }).catch(() => {});
  const lg = await s.page.evaluate(() => ({ src: document.querySelector('#logo img').src, boot: document.getElementById('bootLogo').src, brand: document.getElementById('logo').classList.contains('brand') }));
  ok(lg.src !== origSrc && lg.brand && lg.boot === lg.src, 'the logo picked there replaces the Studio logo (top corner and start screen)');
  const shown = await logoBox();
  await s.page.evaluate(() => { const r = document.getElementById('lvSplW'); r.value = 520; r.dispatchEvent(new Event('input')); });
  await s.page.waitForFunction(() => { try { return JSON.parse(localStorage.getItem('g360Brand')).w === 520; } catch (e) { return false; } }, null, { timeout: 5000 }).catch(() => {});
  const handed = await s.page.evaluate(() => { try { return JSON.parse(localStorage.getItem('g360Brand')).w; } catch (e) { return 0; } });
  ok(handed === 520 && await logoBox() === shown, 'the width goes to the outputs and the Studio logo keeps its size', lgBefore + ' / ' + shown + ' / ' + (await logoBox()) + ' w=' + handed);
  ok(await s.page.evaluate(() => document.getElementById('lvSplLiveBox').hidden), 'the separate live-tours logo stays closed until its box is ticked');
  await s.page.check('#lvSplLiveOn');
  const png2 = Buffer.from(await s.page.evaluate(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 100; const g = c.getContext('2d'); g.fillStyle = '#33d'; g.fillRect(0, 0, 200, 100); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
  const [fc2] = await Promise.all([s.page.waitForEvent('filechooser'), s.page.click('#lvSplLivePick')]);
  await fc2.setFiles({ name: 'live.png', mimeType: 'image/png', buffer: png2 });
  await s.page.waitForSelector('#lvSplLiveImg:not([hidden])', { timeout: 5000 }).catch(() => {});
  ok(await s.page.evaluate(() => !document.getElementById('lvSplLiveImg').hidden) && await s.page.evaluate(o => document.querySelector('#logo img').src === o, lg.src), 'ticking it opens a second logo for live tours, and the Studio keeps my logo');
  await s.page.keyboard.press('Escape');
  ok(await s.page.evaluate(() => document.getElementById('lvSet').hidden), 'Esc closes the Options screen over the point cloud');
  await s.page.reload(); await s.page.waitForTimeout(500);
  ok(await s.page.evaluate(() => document.getElementById('logo').classList.contains('brand')), 'the Studio opens with my logo next time');
  ok(s.errors.length === 0, 'no errors with my logo', s.errors.join('\n'));
} catch (e) { ok(false, 'the test itself ran to the end', e.stack || e); }
finally {
  if (browser) await browser.close();
  servers.forEach(s => s.kill());
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
}
console.log(failed ? failed + ' check(s) failed' : 'all browser checks passed');
process.exit(failed ? 1 : 0);
