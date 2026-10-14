// ===== The tour's details card. The published page and the Studio's preview both include this file, so the preview shows the card exactly as a visitor sees it. =====
const G360Card = (() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const COL = { wa: '#25a85a', tel: '#1f8a70', mail: '#3b6fd8', link: '#4a5560' }, IC = { tel: 'phone', mail: 'mail', link: 'star' };   // the contact button's colour and icon for each kind
  const WA = '<path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z" fill="currentColor" stroke="none"/>';   // the WhatsApp mark (filled, as in its own logo)
  const TX = { he: { wa: 'שלחו הודעה', tel: 'התקשרו אלינו', mail: 'שלחו מייל', link: 'צרו קשר', info: 'פרטים', photos: 'תמונות' }, en: { wa: 'Send a message', tel: 'Call us', mail: 'Send an email', link: 'Contact us', info: 'Details', photos: 'Photos' } };
  // the contact link: WhatsApp, phone, email or a web address ('' when the value does not fit its kind)
  function href(c) { const v = String(c && c.value || '').trim(), dg = v.replace(/[^0-9]/g, ''); if (!v) return ''; if (c.type === 'wa' && dg) return 'https://wa.me/' + (dg[0] === '0' ? '972' + dg.slice(1) : dg) + (c.msg ? '?text=' + encodeURIComponent(c.msg) : ''); if (c.type === 'tel' && dg) return 'tel:' + (v[0] === '+' ? '+' : '') + dg; if (c.type === 'mail' && v.indexOf('@') > 0) return 'mailto:' + v; if (c.type === 'link' && /^https?:\/\//i.test(v)) return v; return ''; }
  const label = (c, lang) => c.label || TX[lang][c.type] || TX[lang].link;   // the contact button's text: its own, or the default of its kind
  // the contact button at the bottom of the card; icon(name) gives the svg paths of one of the page's icons
  function cta(c, link, lang, icon) { if (!link) return ''; const h = colOf(c); return '<a class="ovCta" style="background:' + h + ';color:' + fgOf(h) + '" href="' + esc(link) + '" rel="noopener"' + (c.type === 'wa' || c.type === 'link' ? ' target="_blank"' : '') + '><svg viewBox="0 0 24 24">' + (c.type === 'wa' ? WA : icon(IC[c.type] || 'star')) + '</svg><span>' + esc(label(c, lang)) + '</span></a>'; }
  // the contact button's colour: the one chosen in the Studio (c.col), or the colour of its kind; and a readable text colour on it
  const colOf = c => /^#[0-9a-f]{6}$/i.test(c && c.col || '') ? c.col : (COL[c && c.type] || COL.link);
  const fgOf = h => (.299 * parseInt(h.slice(1, 3), 16) + .587 * parseInt(h.slice(3, 5), 16) + .114 * parseInt(h.slice(5, 7), 16)) / 255 > .62 ? '#14181b' : '#fff';
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
  return { COL, IC, WA, LAYOUTS, href, label, colOf, fgOf, cta, hasDetails, html, show };
})();
