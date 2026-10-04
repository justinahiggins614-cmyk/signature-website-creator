
/* ============================================================
 * SiteForge v1 — refinements: store/checkout (opt-in), manager
 * mode (master password), and the deterministic 1-Million
 * Website Options template generator.
 * LEGAL RULE: the builder never touches money. Generated sites
 * connect the OWNER'S OWN provider (payment links the owner
 * pastes themselves, stored only in the visitor's own browser).
 * No card numbers or secrets are ever stored by the Creator.
 * ============================================================ */
(function (SF) {
'use strict';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Deterministic PRNG (mulberry32). */
function rng32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

var OPT_CATS = [
  'Bakery & Food', 'Portfolio', 'Blog & Writing', 'Local Business', 'Online Store',
  'Restaurant', 'Photography', 'Music & Band', 'Fitness & Health', 'Real Estate',
  'Salon & Beauty', 'Auto & Repair', 'Pet Care', 'Kids & Family', 'Education',
  'Nonprofit', 'Church & Faith', 'Events & Parties', 'Travel & Tours', 'Tech & Apps'
];
var OPT_STYLES = ['Cozy Classic', 'Bold Modern', 'Soft Pastel', 'Dark Neon', 'Sunny Bright', 'Earthy Calm', 'Ocean Fresh', 'Royal Gold'];
var ADJ = ['Sunny', 'Golden', 'Happy', 'Bright', 'Cozy', 'Swift', 'Clever', 'Kind',
  'Lucky', 'Merry', 'Noble', 'Prime', 'Rapid', 'Shiny', 'True', 'Vivid', 'Warm', 'Zesty'];
var NOUN = ['Corner', 'House', 'Studio', 'Works', 'Place', 'Hub', 'Spot', 'Nest',
  'Garden', 'Harbor', 'Lane', 'Market', 'Point', 'Post', 'Shop', 'Station'];
var OPT_PALETTES = [
  ['#16264a', '#59d6ff'], ['#3a1b4a', '#f0a6ff'], ['#0f3a2e', '#5ff2b8'],
  ['#4a2a10', '#ffc46b'], ['#33122b', '#ff8fb2'], ['#122a4a', '#8fd0ff'],
  ['#2a1a08', '#ffd166'], ['#0e2a3a', '#7ef0d4']
];

var OPT_TOTAL = 1000000;

/* Deterministic template entry by index. Never changes. */
function optEntry(i) {
  var r = rng32(i * 2654435761 % 4294967296);
  var cat = OPT_CATS[i % OPT_CATS.length];
  var style = OPT_STYLES[Math.floor(r() * OPT_STYLES.length)];
  var pal = OPT_PALETTES[Math.floor(r() * OPT_PALETTES.length)];
  var name = ADJ[Math.floor(r() * ADJ.length)] + ' ' +
    cat.split(' ')[0].replace('&', '').trim() + ' ' +
    NOUN[Math.floor(r() * NOUN.length)];
  name = name.replace(/\s+/g, ' ').trim();
  return {
    id: i,
    code: 'JAH-TPL-' + String(i + 1).padStart(7, '0'),
    name: name,
    cat: cat,
    style: style,
    pal: pal,
    desc: 'A ' + style.toLowerCase() + ' ' + cat.toLowerCase() +
      ' website template. Hero, intro, tab bar, archive and contact page included \u2014 ready to build.'
  };
}

/* Mini deterministic preview SVG for a template. */
function optPreviewSVG(e, w) {
  w = w || 300;
  var h = Math.round(w * 0.55);
  var p = e.pal, id = 'g' + e.id;
  return '<svg viewBox="0 0 300 165" width="100%" role="img" aria-label="' + esc(e.name) + ' preview">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="#0a0f1e"/></linearGradient></defs>' +
    '<rect width="300" height="165" fill="url(#' + id + ')"/>' +
    '<rect x="18" y="16" width="264" height="34" rx="8" fill="' + p[1] + '" opacity=".85"/>' +
    '<rect x="18" y="60" width="120" height="70" rx="6" fill="#ffffff" opacity=".12"/>' +
    '<rect x="148" y="60" width="134" height="18" rx="4" fill="#ffffff" opacity=".25"/>' +
    '<rect x="148" y="84" width="100" height="12" rx="4" fill="#ffffff" opacity=".15"/>' +
    '<rect x="148" y="102" width="70" height="14" rx="7" fill="' + p[1] + '" opacity=".7"/>' +
    '<rect x="18" y="140" width="264" height="10" rx="5" fill="#ffffff" opacity=".1"/>' +
    '</svg>';
}

/* ---------- Store / checkout (STRICTLY OPT-IN) ---------- */
function compStore(products, slug) {
  var cards = '';
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    cards += '<div class="product" data-pi="' + i + '">' +
      '<h3>' + esc(p.t) + '</h3><p class="dim">' + esc(p.d) + '</p>' +
      '<p class="price" data-price>\u2014 set your price \u2014</p>' +
      '<button class="btn" data-buy="' + i + '">Buy</button></div>';
  }
  var pdata = JSON.stringify(products.map(function (p) { return { t: p.t, d: p.d }; })).replace(/</g, '\\u003c');
  return '<div class="sec" id="store"><h2>\uD83D\uDED2 Store</h2>' +
    '<p class="dim">This store is <b>off by default</b>. The site owner turns it on in Manager settings and ' +
    'connects their <b>own</b> payment provider (for example, their own Stripe payment links). ' +
    'Money goes straight from buyer to the owner\u2019s provider \u2014 the Signature Website Creator ' +
    'never holds, routes, or processes funds and never stores card details.</p>' +
    '<div class="storegrid">' + cards + '</div>' +
    '<p class="dim" id="storeNote"></p></div>' +
    '<script>\n' +
    'var STORE_PRODUCTS=' + pdata + ';\n' +
    'var STORE_KEY="swc-store-' + slug.replace(/"/g, '') + '";\n' +
    'function storeCfg(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY))||{}; }catch(e){ return {}; } }\n' +
    'function paintStore(){ var c=storeCfg(); var note=document.getElementById("storeNote");' +
    '  var cards=document.querySelectorAll("#store .product");' +
    '  for(var i=0;i<cards.length;i++){ var pr=cards[i].querySelector("[data-price]");' +
    '    pr.textContent=(c.prices&&c.prices[i])?c.prices[i]:"\\u2014 set your price \\u2014"; }' +
    '  note.textContent=c.enabled?"Checkout is ON. Buy buttons open the owner\\u2019s own payment links.":"Checkout is OFF. The owner enables it in Manager settings."; }\n' +
    'document.addEventListener("click",function(e){ var b=e.target.closest?e.target.closest("[data-buy]"):null; if(!b)return;' +
    '  var i=+b.getAttribute("data-buy"); var c=storeCfg();' +
    '  if(c.enabled&&c.links&&c.links[i]){ window.open(c.links[i],"_blank","noopener"); }' +
    '  else{ alert("Checkout is not set up yet. The site owner connects their own payment provider in Manager settings."); } });\n' +
    'paintStore();\n</script>' +
    '<style>.storegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}' +
    '.product{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:14px}' +
    '.product h3{margin:.2em 0;color:var(--gold2)}.product .price{font-size:1.2em;font-weight:700;color:var(--cyan)}</style>';
}

/* ---------- Manager mode (master password) ---------- */
function compManager(passwordHash, slug, hasStore) {
  var hashLine = passwordHash
    ? 'var MANAGER_HASH="' + String(passwordHash).replace(/"/g, '') + '";'
    : 'var MANAGER_HASH="";';
  var storePanel = hasStore ?
    '<h3>Store settings</h3>' +
    '<label><input type="checkbox" id="mEnable"> Checkout ON (off by default)</label>' +
    '<div id="mLinks"></div>' +
    '<p class="dim">Paste YOUR OWN payment links (e.g. Stripe payment links you made in your own Stripe dashboard). ' +
    'They are stored only in this browser. The Creator never sees them and never touches your money.</p>' : '';
  return '<div style="text-align:center;margin:10px 0"><button class="btn ghost" id="mgrBtn">\uD83D\uDD27 Manager</button></div>' +
    '<div id="mgrPanel" style="display:none" class="sec"><h2>Manager settings</h2>' +
    '<p class="dim">You are the boss of this site. Your password\u2019s fingerprint is baked into your site files \u2014 ' +
    'it keeps casual visitors out of these settings.</p>' +
    '<button class="btn ghost" id="mEdit">\u270F\uFE0F Edit text on this page</button> ' +
    '<button class="btn ghost" id="mDone" style="display:none">Done editing</button>' +
    storePanel +
    '<p><button class="btn" id="mSave">Save settings</button> ' +
    '<button class="btn ghost" id="mLock">Lock</button></p>' +
    '<p class="dim">Plain talk: payments are between you and YOUR payment provider. ' +
    'The Signature Website Creator keeps no financial data and processes no payments.</p></div>' +
    '<script>\n' + hashLine + '\n' +
    'var MSTORE_KEY="swc-store-' + slug.replace(/"/g, '') + '";\n' +
    'async function sha256hex(s){ var b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));' +
    ' return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,"0");}).join(""); }\n' +
    'function mCfg(){ try{ return JSON.parse(localStorage.getItem(MSTORE_KEY))||{}; }catch(e){ return {}; } }\n' +
    'document.getElementById("mgrBtn").onclick=async function(){' +
    '  if(!MANAGER_HASH){ alert("No manager password was set for this site."); return; }' +
    '  var pw=prompt("Manager password:"); if(pw==null) return;' +
    '  var h=await sha256hex(pw);' +
    '  if(h!==MANAGER_HASH){ alert("Wrong password."); return; }' +
    '  var p=document.getElementById("mgrPanel"); p.style.display="block";' +
    '  var c=mCfg(); var en=document.getElementById("mEnable"); if(en) en.checked=!!c.enabled;' +
    '  var box=document.getElementById("mLinks");' +
    '  if(box&&window.STORE_PRODUCTS){ box.innerHTML="";' +
    '    for(var i=0;i<STORE_PRODUCTS.length;i++){ var d=document.createElement("div");' +
    '      d.innerHTML="<label>"+STORE_PRODUCTS[i].t.replace(/</g,"&lt;")+" payment link:<br>"+' +
    '      "<input class=\\"txt\\" data-link=\\""+i+"\\" value=\\""+((c.links&&c.links[i])||"").replace(/\\"/g,"&quot;")+"\\" placeholder=\\"https://...\\"></label><br><br>";' +
    '      box.appendChild(d); } }' +
    '  p.scrollIntoView(); };\n' +
    'var _editing=false;' +
    'document.getElementById("mEdit").onclick=function(){ _editing=true;' +
    '  document.querySelectorAll("#intro,.sec").forEach(function(s){ s.setAttribute("contenteditable","true"); s.style.outline="2px dashed var(--gold)"; });' +
    '  document.getElementById("mDone").style.display="inline-block"; this.style.display="none";' +
    '  alert("Editing ON: click any text and type. Press Done editing when finished."); };\n' +
    'document.getElementById("mDone").onclick=function(){ _editing=false;' +
    '  document.querySelectorAll("[contenteditable]").forEach(function(s){ s.removeAttribute("contenteditable"); s.style.outline=""; });' +
    '  this.style.display="none"; document.getElementById("mEdit").style.display="inline-block";' +
    '  try{ localStorage.setItem("swc-edits-' + slug.replace(/"/g, '') + '",document.getElementById("intro").innerHTML); }catch(e){}' +
    '  alert("Edits saved in this browser."); };\n' +
    'document.getElementById("mSave").onclick=function(){ var c=mCfg();' +
    '  var en=document.getElementById("mEnable"); if(en) c.enabled=en.checked;' +
    '  c.links=c.links||{};' +
    '  document.querySelectorAll("[data-link]").forEach(function(inp){ c.links[inp.getAttribute("data-link")]=inp.value.trim(); });' +
    '  try{ localStorage.setItem(MSTORE_KEY,JSON.stringify(c)); }catch(e){}' +
    '  if(window.paintStore) paintStore(); alert("Settings saved."); };\n' +
    'document.getElementById("mLock").onclick=function(){ document.getElementById("mgrPanel").style.display="none"; };\n' +
    '</script>';
}

SF.optEntry = optEntry;
SF.optPreviewSVG = optPreviewSVG;
SF.OPT_TOTAL = OPT_TOTAL;
SF.OPT_CATS = OPT_CATS;
SF.OPT_STYLES = OPT_STYLES;
SF.compStore = compStore;
SF.compManager = compManager;

})(window.SiteForge = window.SiteForge || {});
