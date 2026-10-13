// ===== The tour's details card. The published page and the Studio's preview both include this file, so the preview shows the card exactly as a visitor sees it. =====
const G360Card = (() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const COL = { wa: '#25a85a', tel: '#1f8a70', mail: '#3b6fd8', link: '#4a5560' }, IC = { tel: 'phone', mail: 'mail', link: 'star' };   // the contact button's colour and icon for each kind
  const WA = '<path d="M4 20l1.2-4A8.5 8.5 0 1 1 8 18.9z"/><path d="M9.2 8.6c.2 2.4 2.6 4.8 5 5l1.3-1.3-1.7-1.1-.9.7c-.8-.3-1.7-1.2-2-2l.7-.9-1.1-1.7z" fill="currentColor" stroke="none"/>';
  const TX = { he: { wa: 'שלחו הודעה', tel: 'התקשרו אלינו', mail: 'שלחו מייל', link: 'צרו קשר', info: 'פרטים', photos: 'תמונות' }, en: { wa: 'Send a message', tel: 'Call us', mail: 'Send an email', link: 'Contact us', info: 'Details', photos: 'Photos' } };
  // the contact link: WhatsApp, phone, email or a web address ('' when the value does not fit its kind)
  function href(c) { const v = String(c && c.value || '').trim(), dg = v.replace(/[^0-9]/g, ''); if (!v) return ''; if (c.type === 'wa' && dg) return 'https://wa.me/' + (dg[0] === '0' ? '972' + dg.slice(1) : dg) + (c.msg ? '?text=' + encodeURIComponent(c.msg) : ''); if (c.type === 'tel' && dg) return 'tel:' + (v[0] === '+' ? '+' : '') + dg; if (c.type === 'mail' && v.indexOf('@') > 0) return 'mailto:' + v; if (c.type === 'link' && /^https?:\/\//i.test(v)) return v; return ''; }
  const label = (c, lang) => c.label || TX[lang][c.type] || TX[lang].link;   // the contact button's text: its own, or the default of its kind
  // the contact button at the bottom of the card; icon(name) gives the svg paths of one of the page's icons
  function cta(c, link, lang, icon) { if (!link) return ''; return '<a class="ovCta" style="background:' + (COL[c.type] || COL.link) + '" href="' + esc(link) + '" rel="noopener"' + (c.type === 'wa' || c.type === 'link' ? ' target="_blank"' : '') + '><svg viewBox="0 0 24 24">' + (c.type === 'wa' ? WA : icon(IC[c.type] || 'star')) + '</svg><span>' + esc(label(c, lang)) + '</span></a>'; }
  // o: { info, title (the tour's), img (url or ''), cta (from cta()), photos (true: a Photos tab), photosHtml, lang ('he'/'en'), icon }
  const LAYOUTS = ['rows', 'chips', 'side'];
  const hasDetails = o => { const i = o.info || {}; return !!(i.title || i.text || i.phone || i.mail || i.link || i.address || o.img || o.cta); };
  function html(o) {
    const i = o.info || {}, tx = TX[o.lang] || TX.he, ph = String(i.phone || '').replace(/[^0-9+]/g, ''), ln = /^https?:\/\//i.test(i.link || '') ? i.link : '', det = hasDetails(o);
    // the contact details: one row each, with its icon (phone and email open in place, the map and the web site in a new tab)
    const row = (href, ic, txt, ltr, blank) => '<a href="' + esc(href) + '"' + (blank ? ' target="_blank" rel="noopener"' : '') + '><span class="ic"><svg viewBox="0 0 24 24">' + o.icon(ic) + '</svg></span><span class="tx" dir="' + (ltr ? 'ltr' : 'auto') + '">' + esc(txt) + '</span></a>';
    const rows = (ph ? row('tel:' + ph, 'phone', i.phone, true) : '') + (i.mail ? row('mailto:' + i.mail, 'mail', i.mail, true) : '') + (i.address ? row('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(i.address), 'pin', i.address, false, true) : '') + (ln ? row(ln, 'globe', i.linkTxt || ln.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''), !i.linkTxt, true) : '');
    const lay = LAYOUTS.includes(i.layout) ? i.layout : 'rows', side = lay === 'side' && !!o.img;   // the layout chosen in the Studio: rows, chips, or the picture on the side
    const img = o.img ? '<img class="ovImg" alt="" src="' + esc(o.img) + '">' : '', main = (i.text ? '<p class="ovTxt" dir="auto">' + esc(i.text) + '</p>' : '') + (rows ? '<div class="ovLinks">' + rows + '</div>' : '') + (o.cta || '');
    const body = '<div class="ovLay lay-' + lay + '">' + (side ? '<div class="ovSide">' + img + '<div class="ovMain">' + main + '</div></div>' : img + main) + '</div>';
    return '<h3 dir="auto">' + esc(i.title || o.title || '') + '</h3>' + (o.photos && det ? '<div class="cardTabs"><button type="button" data-p="d">' + tx.info + '</button><button type="button" data-p="p">' + tx.photos + '</button></div>' : '') + (det ? '<div data-pane="d">' + body + '</div>' : '') + (o.photos ? '<div data-pane="p" hidden>' + (o.photosHtml || '') + '</div>' : '');
  }
  // shows one part of the card (d: details, p: photos) and marks its tab
  function show(box, k) { box.querySelectorAll('[data-pane]').forEach(e => { e.hidden = e.dataset.pane !== k; }); box.querySelectorAll('.cardTabs button').forEach(b => b.classList.toggle('on', b.dataset.p === k)); }
  return { COL, IC, WA, LAYOUTS, href, label, cta, hasDetails, html, show };
})();
