/* ============================================================
 * SiteForge v1 — deterministic website assembler.
 * Signature Website Creator (site 31). Everything runs client-side.
 * Each component is a pure function: options in, HTML string out.
 * buildSite() assembles a complete working website from them and
 * reports exactly which components were picked and why (no magic).
 * ============================================================ */
(function (global) {
'use strict';

/* ---------- utils ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 40) || 'my-site';
}
function hashStr(s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

var STOP = { a:1, an:1, the:1, and:1, or:1, of:1, for:1, to:1, with:1, my:1,
  site:1, website:1, page:1, app:1, about:1, on:1, in:1, is:1, it:1, that:1,
  this:1, we:1, our:1, your:1, all:1, any:1, are:1, be:1, by:1, from:1 };

function keywords(desc) {
  var words = String(desc || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  var out = [], seen = {};
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (w.length > 2 && !STOP[w] && !seen[w]) { seen[w] = 1; out.push(w); }
    if (out.length >= 6) break;
  }
  return out;
}

/* ---------- shared CSS for GENERATED sites ---------- */
var BASE_CSS = [
  ':root{--bg:#0a0f1e;--panel:#111a2e;--panel2:#0d1425;--gold:#d4a017;--gold2:#f0c64a;',
  '--cyan:#59d6ff;--txt:#e8ecf4;--dim:#9aa4b2;--line:#24304d;--grn:#5fd97a}',
  '*{box-sizing:border-box}',
  'body{margin:0;background:var(--bg);color:var(--txt);font-family:Arial,Helvetica,sans-serif;line-height:1.55}',
  '.wrap{max-width:960px;margin:0 auto;padding:0 16px}',
  '.hero{text-align:center;padding:26px 12px 18px;border-bottom:3px double var(--gold)}',
  '.hero h1{margin:.3em 0 .1em;font-size:2em;letter-spacing:.06em;color:var(--gold2)}',
  '.hero .tag{color:var(--dim);max-width:640px;margin:.3em auto}',
  '.jah-tabs{display:flex;gap:6px;overflow-x:auto;padding:10px 12px;background:var(--panel2);',
  'border-bottom:2px solid var(--gold);position:sticky;top:0;z-index:50}',
  '.jah-tabs a.tablink{flex:0 0 auto;background:var(--panel);color:var(--txt);border:1px solid var(--line);',
  'border-radius:6px;padding:9px 14px;font-size:.92em;text-decoration:none;white-space:nowrap}',
  '.jah-tabs a.tablink.on{background:var(--gold);color:#241a02;font-weight:700;border-color:var(--gold)}',
  '.sec{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px;margin:16px 0}',
  '.sec h2{margin-top:0;color:var(--gold2)}',
  '.btn{display:inline-block;background:var(--gold);color:#241a02;font-weight:700;border:0;border-radius:8px;',
  'padding:10px 18px;font-size:1em;cursor:pointer;margin:4px 6px 4px 0;text-decoration:none}',
  '.btn.ghost{background:var(--panel2);color:var(--txt);border:1px solid var(--line)}',
  '.btn:active{transform:scale(.97)}',
  '.dim{color:var(--dim);font-size:.9em}',
  'details.best{border:2px solid var(--gold);border-radius:10px;padding:14px;margin:14px 0;background:#141021}',
  'details.best summary{cursor:pointer;font-size:1.15em;font-weight:700;color:var(--gold2)}',
  '.stats{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}',
  '.stat{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-size:.88em}',
  'details.az{border:1px solid var(--line);border-radius:8px;margin:6px 0;background:var(--panel2)}',
  'details.az summary{cursor:pointer;padding:10px 12px;font-weight:700}',
  '.azlist{padding:0 12px 12px}',
  '.azlist a{color:#9fc2ff;text-decoration:none;display:block;padding:4px 0}',
  '.chatbox{border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--panel2)}',
  '#chatlog{max-height:260px;overflow-y:auto;margin-bottom:10px}',
  '#chatlog .q{color:var(--gold2);margin:8px 0 2px}',
  '#chatlog .a{margin:0 0 10px}',
  '.chatrow{display:flex;gap:8px}',
  '.chatrow input{flex:1;padding:10px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--txt)}',
  'input.txt,textarea.txt{width:100%;padding:10px;border-radius:8px;border:1px solid var(--line);',
  'background:var(--bg);color:var(--txt);font-size:1em}',
  '.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}',
  '.gal figure{margin:0;background:var(--panel2);border:1px solid var(--line);border-radius:8px;overflow:hidden}',
  '.gal figcaption{padding:6px 8px;font-size:.85em;color:var(--dim)}',
  '.jahnet{background:#070b16;color:#9aa4b2;font-size:.78em;padding:14px 10px;text-align:center;line-height:2.1}',
  '.jahnet .t{color:var(--gold);font-weight:700;letter-spacing:.25em;margin-right:10px}',
  '.jahnet a{color:#9fc2ff;text-decoration:none;margin:0 7px;white-space:nowrap}',
  '.jahnet .here{color:var(--gold);font-weight:700;margin:0 7px}',
  'footer{padding:18px;text-align:center;color:var(--dim);font-size:.85em}'
].join('\n');

/* ---------- components ---------- */

var PALETTES = [
  ['#16264a', '#59d6ff'], ['#3a1b4a', '#f0a6ff'], ['#0f3a2e', '#5ff2b8'],
  ['#4a2a10', '#ffc46b'], ['#33122b', '#ff8fb2'], ['#122a4a', '#8fd0ff']
];

/* Deterministic SVG hero — no external image needed, always works. */
function compHero(name, tagline) {
  var h = hashStr(name), p = PALETTES[h % PALETTES.length];
  var circles = '';
  for (var i = 0; i < 5; i++) {
    var cx = 40 + ((h >> (i * 5)) % 720), cy = 30 + ((h >> (i * 5 + 3)) % 160);
    var r = 18 + ((h >> (i * 7)) % 46);
    circles += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r +
      '" fill="none" stroke="' + p[1] + '" stroke-opacity=".35" stroke-width="2"/>';
  }
  return '<div class="hero"><svg viewBox="0 0 800 220" width="100%" role="img" aria-label="' +
    esc(name) + ' banner" style="display:block;border-radius:10px">' +
    '<defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="#0a0f1e"/></linearGradient></defs>' +
    '<rect width="800" height="220" fill="url(#hg)"/>' + circles +
    '<text x="400" y="105" text-anchor="middle" fill="' + p[1] +
    '" font-size="44" font-family="Arial" font-weight="bold">' + esc(name) + '</text>' +
    '<text x="400" y="150" text-anchor="middle" fill="#c9d4e8" font-size="18" font-family="Arial">' +
    esc(tagline || 'Welcome!') + '</text></svg></div>';
}

function compTabBar(tabs, activeHref) {
  var out = '<nav class="jah-tabs" aria-label="Site pages">';
  for (var i = 0; i < tabs.length; i++) {
    var on = tabs[i].href === activeHref ? ' on' : '';
    var cur = on ? ' aria-current="page"' : '';
    out += '<a class="tablink' + on + '" href="' + esc(tabs[i].href) + '"' + cur + '>' +
      esc(tabs[i].label) + '</a>';
  }
  return out + '</nav>';
}

/* 33-site network nav. currentLabel = "31 ..." text shown as YOU ARE HERE. */
function compNetworkNav(currentLabel) {
  var S = 'https://justinahiggins614-cmyk.github.io/';
  var sites = [
    ['signature-math/', '1 Signature Math'],
    ['jah-calculator/', '2 Signature Universal Paradox Immune Calculator'],
    ['jah-dictionary/', '3 The Signature Dictionary'],
    ['jah-wiki/', '4 JAH Wiki'],
    ['jah-n-wiki-leaks/', '5 JAH-N Wiki Leaks'],
    ['signature-llama/', '6 Signature Llama'],
    ['jah-ai-models/', '7 The Signature AI Phone Book'],
    ['cyber-patent-catalog/', '8 Globally Rejustered Patent Catalog'],
    ['signature-one-archive/specs.html', '9 Signature Spec Catalog Pending Patents'],
    ['jah-computer-systems/', '10 The Signature PC System Depository'],
    ['signature-books/', '11 The Signature Book Depository'],
    ['signature-comics/', '12 The Signature Comic Store'],
    ['signature-newspapers/', '13 The Signature Global Newspaper Archive'],
    ['signature-backend/', '14 The Signature AI Mix and Match Generator'],
    ['signature-boundless-generators/', '15 The Signature Boundless Generator Archive'],
    ['signature-ai-mixlab/', '16 The Signature AI Mix Lab'],
    ['signature-ai-olypics/', '17 AI Olympics'],
    ['signature-chip-maker/', '18 The Signature Computer Chip Maker and Archive'],
    ['signature-app-archive/', '19 The Signature App Archive'],
    ['signature-ai-robot-matcher/', '20 The Signature AI Robot Matcher'],
    ['signature-experiment-solver/', '21 The Signature Experiment Solver'],
    ['signature-ai-image-video-maker/', '22 Signature AI Pixel'],
    ['signature-ai-song-maker/', '23 Signature Music Studio'],
    ['signature-fixit/', '24 The Signature Mr Fix-It'],
    ['signature-university/', '25 The Signature University'],
    ['signature-cyber-mega-mall/', '26 The Signature Cyber Mega-Mall'],
    ['signature-3d-print/', '27 The Signature 3D Print Mega Mall'],
    ['signature-earth/', '28 Signature Earth'],
    ['signature-flight-school/', '29 The Signature Flight School'],
    ['signature-game-store/', '30 The Signature Game Store'],
    ['signature-website-creator/', '31 Signature Website Creator'],
    ['signature-antivirus/', '32 The Signature Antivirus'],
    ['signature-os-updater/', '33 The Signature OS Updater']
  ];
  var out = '<div class="jahnet"><span class="t">THE JAH NETWORK</span>';
  for (var i = 0; i < sites.length; i++) {
    out += '<a href="' + S + sites[i][0] + '">' + esc(sites[i][1]) + '</a>';
  }
  out += '<span class="here">' + esc(currentLabel) + ' — YOU ARE HERE</span></div>';
  return out;
}

/* Read-aloud: one global controller, cancel-first, graceful fallback. */
var READ_ALOUD_JS = [
  'var __reader=null;',
  'function readAloud(text){',
  '  try{ speechSynthesis.cancel(); }catch(e){}',
  '  if(!("speechSynthesis" in window)){ alert("Read-aloud is not supported in this browser."); return; }',
  '  var u=new SpeechSynthesisUtterance(String(text).slice(0,4000));',
  '  u.rate=1; u.pitch=1;',
  '  try{ speechSynthesis.speak(u); }catch(e){ alert("Could not start reading."); }',
  '}',
  'function stopReading(){ try{ speechSynthesis.cancel(); }catch(e){} }',
  'function readEl(id){ var el=document.getElementById(id); if(el) readAloud(el.innerText||el.textContent); }'
].join('\n');

function compReadAloudButton(targetId, label) {
  return '<button class="btn ghost" onclick="readEl(\'' + esc(targetId) + '\')">\uD83D\uDD0A ' +
    esc(label || 'Read aloud') + '</button> ' +
    '<button class="btn ghost" onclick="stopReading()">\u23F9 Stop</button>';
}

/* Copy + download helpers. */
var COPY_DL_JS = [
  'function copyText(t, btn){',
  '  function done(){ if(btn){ var o=btn.textContent; btn.textContent="Copied!";',
  '    setTimeout(function(){ btn.textContent=o; },1200); } }',
  '  if(navigator.clipboard && navigator.clipboard.writeText){',
  '    navigator.clipboard.writeText(t).then(done, function(){ fallback(); });',
  '  } else fallback();',
  '  function fallback(){ var ta=document.createElement("textarea"); ta.value=t;',
  '    document.body.appendChild(ta); ta.select();',
  '    try{ document.execCommand("copy"); }catch(e){} document.body.removeChild(ta); done(); }',
  '}',
  'function downloadFile(name, text, type){',
  '  var b=new Blob([text],{type:type||"text/html"});',
  '  var a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=name;',
  '  document.body.appendChild(a); a.click();',
  '  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },800);',
  '}'
].join('\n');

/* ---------- namespace export ---------- */
global.SiteForge = global.SiteForge || {};
var SF = global.SiteForge;
SF.esc = esc; SF.slugify = slugify; SF.cap = cap; SF.keywords = keywords;
SF.compHero = compHero; SF.compTabBar = compTabBar; SF.compNetworkNav = compNetworkNav;
SF.compReadAloudButton = compReadAloudButton;
SF.READ_ALOUD_JS = READ_ALOUD_JS; SF.COPY_DL_JS = COPY_DL_JS; SF.BASE_CSS = BASE_CSS;
})(window);
