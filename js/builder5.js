
/* ============================================================
 * SiteForge v1 — Mirror a Website.
 * Reads a page's LAYOUT STRUCTURE ONLY (section order, arrangement,
 * color mood) and rebuilds it as a fresh ORIGINAL page with the
 * USER'S OWN brand, products, images, and words.
 *
 * TRADEMARK HARD RULE: never copies the source site's brand name,
 * logos, trademarks, product names, marketing copy, or images.
 * Only structure is read. All content comes from the user.
 * ============================================================ */
(function (SF) {
'use strict';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* ---------- preset layout blueprints (fallback when a URL can't be read) ---------- */
var PRESETS = [
  { id: 'storefront', name: 'Storefront', like: 'Like a big sneaker/apparel store front page',
    sections: ['nav', 'hero', 'grid', 'banner2', 'quotes', 'form', 'footer'] },
  { id: 'showcase', name: 'Showcase', like: 'Like a gallery / portfolio front page',
    sections: ['nav', 'hero', 'grid', 'grid', 'quotes', 'footer'] },
  { id: 'menu', name: 'Menu board', like: 'Like a restaurant or food menu page',
    sections: ['nav', 'hero', 'list', 'list', 'form', 'footer'] },
  { id: 'studio', name: 'Studio', like: 'Like a creative studio / agency page',
    sections: ['nav', 'hero', 'cols', 'grid', 'quotes', 'form', 'footer'] }
];

var SECTION_LABEL = {
  nav: 'Top navigation bar', hero: 'Big banner', grid: 'Product grid',
  list: 'Item list', cols: 'Feature columns', quotes: 'Highlight quotes',
  form: 'Contact / signup form', banner2: 'Wide promo banner', footer: 'Footer bar'
};

/* ---------- analyze fetched HTML → blueprint (structure only) ---------- */
function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch (e) { return url; }
}

/* Classify a DOM element into a section kind using STRUCTURE ONLY.
 * Never reads text content, alt text, brand names, or image URLs. */
function classifyEl(elm) {
  var tag = (elm.tagName || '').toLowerCase();
  if (tag === 'header' || tag === 'nav') return 'nav';
  if (tag === 'footer') return 'footer';
  if (tag === 'form') return 'form';
  var kids = elm.children ? elm.children.length : 0;
  var imgs = elm.getElementsByTagName ? elm.getElementsByTagName('img').length : 0;
  var links = elm.getElementsByTagName ? elm.getElementsByTagName('a').length : 0;
  var h1 = elm.getElementsByTagName ? elm.getElementsByTagName('h1').length : 0;
  /* hero first: an h1 is a strong banner signal (structure only, text never read) */
  if (h1 > 0 && (elm.offsetHeight > 200 || kids <= 6)) return 'hero';
  /* product-card grid: many similar children with images */
  if (kids >= 4 && imgs >= 3) return 'grid';
  if (kids >= 3 && links >= 3 && imgs === 0) return 'list';
  if (kids >= 2 && kids <= 4 && imgs <= 1) return 'cols';
  return null;
  return null;
}

function analyzeDocument(doc, url) {
  var sections = [];
  var body = doc.body;
  if (!body) return null;
  var heroSeen = false;
  var kids = body.children;
  for (var i = 0; i < kids.length && sections.length < 10; i++) {
    var k = classifyEl(kids[i]);
    if (!k) continue;
    if (k === 'hero' && heroSeen) k = 'banner2';
    if (k === 'hero') heroSeen = true;
    if (sections[sections.length - 1] !== k) sections.push(k);
  }
  if (sections.indexOf('nav') < 0) sections.unshift('nav');
  if (sections.indexOf('footer') < 0) sections.push('footer');
  if (sections.indexOf('hero') < 0) sections.splice(1, 0, 'hero');
  return { kind: 'analyzed', source: hostOf(url), sections: sections, mood: null };
}

/* Read color mood by rendering the fetched HTML in a sandboxed,
 * script-free iframe and sampling computed styles. Structure + colors only. */
function sampleMood(html) {
  return new Promise(function (resolve) {
    var done = false;
    function fin(mood) { if (!done) { done = true; resolve(mood); } }
    try {
      var f = document.createElement('iframe');
      f.setAttribute('sandbox', '');
      f.style.cssText = 'position:absolute;left:-9999px;width:800px;height:600px;visibility:hidden';
      document.body.appendChild(f);
      var to = setTimeout(function () { try { f.remove(); } catch (e) {} fin(null); }, 6000);
      f.onload = function () {
        try {
          var d = f.contentDocument, mood = null;
          if (d && d.body) {
            var cs = f.contentWindow.getComputedStyle(d.body);
            var head = d.querySelector('header');
            var hcs = head ? f.contentWindow.getComputedStyle(head) : null;
            var a = d.querySelector('a');
            var acs = a ? f.contentWindow.getComputedStyle(a) : null;
            mood = {
              bg: cs.backgroundColor || '#ffffff',
              accent: (acs && acs.color) || (hcs && hcs.backgroundColor) || '#d4a017'
            };
          }
          clearTimeout(to);
          try { f.remove(); } catch (e) {}
          fin(mood);
        } catch (e) { try { f.remove(); } catch (x) {} fin(null); }
      };
      f.srcdoc = html;
    } catch (e) { fin(null); }
  });
}

/* Try to fetch a page's HTML. Throws on CORS/network failure (expected for most sites). */
async function fetchPageHTML(url) {
  var u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  var res = await fetch(u, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  var ct = res.headers.get('content-type') || '';
  if (ct.indexOf('html') < 0 && ct.indexOf('text') < 0) throw new Error('Not a web page');
  var html = await res.text();
  if (html.length < 500) throw new Error('Page too small to read');
  return { html: html.slice(0, 600000), url: u };
}

/* Full pipeline: fetch → analyze structure → sample mood. */
async function readLayout(url) {
  var got = await fetchPageHTML(url);
  var doc = new DOMParser().parseFromString(got.html, 'text/html');
  var bp = analyzeDocument(doc, got.url);
  if (!bp) throw new Error('Could not read the page structure');
  bp.mood = await sampleMood(got.html);
  return bp;
}

/* ---------- blueprint wireframe preview (structure boxes only) ---------- */
function blueprintSVG(bp, w) {
  w = w || 320;
  var secs = bp.sections || [];
  var rowH = 34, h = secs.length * (rowH + 6) + 14;
  var out = '<svg viewBox="0 0 320 ' + h + '" width="100%" role="img" aria-label="Layout skeleton preview">';
  var y = 8;
  for (var i = 0; i < secs.length; i++) {
    var k = secs[i];
    var bw = (k === 'grid' || k === 'cols' || k === 'list') ? 320 - 16 : 320 - 16;
    var bh = (k === 'grid') ? rowH + 26 : rowH;
    out += '<rect x="8" y="' + y + '" width="' + bw + '" height="' + bh +
      '" rx="6" fill="#141d33" stroke="#59d6ff" stroke-opacity=".5"/>';
    if (k === 'grid') {
      for (var c = 0; c < 4; c++)
        out += '<rect x="' + (20 + c * 76) + '" y="' + (y + 8) + '" width="64" height="40" rx="4" fill="#59d6ff" opacity=".25"/>';
    }
    out += '<text x="16" y="' + (y + (k === 'grid' ? bh + 16 : 22)) + '" fill="#9aa4b2" font-size="12">' +
      esc(SECTION_LABEL[k] || k) + '</text>';
    y += bh + 6 + (k === 'grid' ? 18 : 0);
  }
  return out + '</svg>';
}

/* ---------- build the mirror site (all content is the USER'S) ---------- */
function buildMirrorSite(opts) {
  var brand = String(opts.brand || 'My Brand').slice(0, 60);
  var tagline = String(opts.tagline || '').slice(0, 160);
  var bp = opts.blueprint || PRESETS[0];
  var products = (opts.products || []).slice(0, 24);
  var heroImg = opts.heroImg || '';
  var slug = SF.slugify(brand);
  var picks = [];
  function pick(c, w) { picks.push({ component: c, why: w }); }

  var mood = bp.mood || {};
  var accent = /#[0-9a-f]{6}/i.test(String(mood.accent)) ? mood.accent : '#d4a017';

  var tabs = [
    { label: '\uD83C\uDFE0 Main', href: 'index.html' },
    { label: '\uD83D\uDCC2 Archive', href: 'archive.html' }
  ];

  /* hero uses the USER'S image (or a brand-color gradient if none) */
  var heroInner = heroImg
    ? '<img src="' + heroImg + '" alt="' + esc(brand) + '" style="width:100%;max-height:340px;object-fit:cover;display:block">'
    : '';
  var hero = '<div class="hero">' + heroInner +
    '<h1 style="color:' + esc(accent) + '">' + esc(brand) + '</h1>' +
    (tagline ? '<p class="tag">' + esc(tagline) + '</p>' : '') + '</div>';
  pick('Brand hero', 'Your brand name' + (heroImg ? ' and your own uploaded image' : '') + ' up top, in the mirrored layout\u2019s banner spot.');

  var body = hero;
  var seenGrid = false;

  (bp.sections || []).forEach(function (kind) {
    if (kind === 'nav' || kind === 'footer' || kind === 'hero') return;
    if (kind === 'grid' && !seenGrid) {
      seenGrid = true;
      body += mirrorGrid(products, accent);
      pick('Your product grid', 'The mirrored layout puts a product grid here \u2014 filled with YOUR products, YOUR images, YOUR words.');
    } else if (kind === 'grid') {
      body += mirrorGrid(products.slice().reverse(), accent);
    } else if (kind === 'list') {
      body += '<div class="sec"><h2>Our lineup</h2><ul>' + products.map(function (p) {
        return '<li><b>' + esc(p.name) + '</b> \u2014 ' + esc(p.blurb || '') + '</li>';
      }).join('') + '</ul></div>';
    } else if (kind === 'cols') {
      var cols = products.slice(0, 3);
      body += '<div class="sec"><h2>Why ' + esc(brand) + '</h2><div class="storegrid">' + cols.map(function (p) {
        return '<div class="product"><h3>' + esc(p.name) + '</h3><p class="dim">' + esc(p.blurb || '') + '</p></div>';
      }).join('') + '</div></div>';
    } else if (kind === 'quotes') {
      body += '<div class="sec"><h2>What we stand for</h2><p><i>\u201C' + esc(tagline || brand + ' \u2014 made with care.') + '\u201D</i></p>' +
        SF.compReadAloudButton('intro', 'Read aloud') + '</div>';
    } else if (kind === 'banner2') {
      body += '<div class="sec" style="text-align:center;border:2px solid ' + esc(accent) + '"><h2>' + esc(brand) + '</h2>' +
        '<p class="dim">' + esc(tagline || 'Welcome!') + '</p></div>';
    } else if (kind === 'form') {
      body += SF.compContact(brand);
      pick('Contact form', 'The mirrored layout has a form here \u2014 an honest mailto form under your brand.');
    }
  });

  if (!seenGrid && products.length) {
    body = body.replace('</div>', '</div>') ; /* noop guard */
    body += mirrorGrid(products, accent);
    pick('Your product grid', 'Your products, your images, your words \u2014 in a clean grid.');
  }

  body += '<div class="sec legalbox"><h2>\u2696\uFE0F Original work</h2>' +
    '<p class="dim">Layout style inspired by <b>' + esc(bp.source || 'a reference page') +
    '</b>. Every name, product, image, and word on this page belongs to <b>' + esc(brand) +
    '</b> \u2014 nothing was copied from the original site. No brand names, logos, trademarks, product names, or copyrighted images were reused.</p></div>';
  pick('Originality notice', 'A plain-words note stating the layout is inspired-by only, and everything on the page is yours.');

  var entries = products.map(function (p) { return { t: p.name, d: p.blurb || '' }; });
  var arch = '<div class="sec"><h2>\uD83D\uDCC2 ' + esc(brand) + ' collection</h2>' +
    '<p class="dim">Everything we make, A\u2013Z.</p></div>' +
    SF.compArchive(entries.length ? entries : [{ t: brand, d: tagline }], 0, true);
  pick('A\u2013Z archive', 'Your products filed A\u2013Z with a Best-of-the-Best pick on top, per our formula.');

  function shell(title, tag, main, active) {
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      '<title>' + esc(title) + '</title>\n<meta name="description" content="' + esc(tag) + '">\n' +
      '<style>\n' + SF.BASE_CSS + '\n.storegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}' +
      '.product{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:14px}' +
      '.product h3{margin:.2em 0;color:var(--gold2)}.product img{width:100%;border-radius:8px}' +
      '.legalbox{border-color:var(--grn)}</style>\n</head>\n<body>\n' +
      SF.compTabBar(tabs, active) + '\n<div class="wrap">\n<div id="intro">' + main + '\n</div></div>\n' +
      SF.compNetworkNav(title) + '\n<footer>Made with The Signature Website Creator \u00B7 Layout inspired by ' +
      esc(bp.source || 'a reference page') + ' \u00B7 all content original to ' + esc(brand) + '</footer>\n' +
      '<script>\n' + SF.READ_ALOUD_JS + '\n' + SF.COPY_DL_JS + '\n</script>\n</body>\n</html>\n';
  }

  var files = {
    'index.html': shell(brand, tagline || brand, body, 'index.html'),
    'archive.html': shell(brand + ' \u2014 Archive', 'The full collection of ' + brand + '.', arch, 'archive.html')
  };
  var base = 'https://example.com/' + slug + '/';
  files['sitemap.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url><loc>' + base + 'index.html</loc></url>\n  <url><loc>' + base + 'archive.html</loc></url>\n</urlset>\n';
  files['robots.txt'] = 'User-agent: *\nAllow: /\nSitemap: ' + base + 'sitemap.xml\n';
  pick('sitemap.xml + robots.txt', 'So search engines can find your mirrored-layout site. Replace example.com with your real address.');
  pick('JAH network nav', 'Our formula: the full 31-site network bar at the bottom.');

  return { name: brand + ' (mirror)', slug: slug, smartness: 'static', files: files, picks: picks, mirror: true, source: bp.source || '' };
}

function mirrorGrid(products, accent) {
  if (!products.length) return '';
  var cards = products.map(function (p) {
    return '<div class="product">' +
      (p.img ? '<img src="' + p.img + '" alt="' + esc(p.name) + '">' : '') +
      '<h3>' + esc(p.name) + '</h3><p class="dim">' + esc(p.blurb || '') + '</p></div>';
  }).join('');
  return '<div class="sec"><h2>Our products</h2><div class="storegrid">' + cards + '</div></div>';
}

SF.PRESETS = PRESETS;
SF.SECTION_LABEL = SECTION_LABEL;
SF.readLayout = readLayout;
SF.analyzeDocument = analyzeDocument;
SF.blueprintSVG = blueprintSVG;
SF.buildMirrorSite = buildMirrorSite;
SF.hostOf = hostOf;

})(window.SiteForge = window.SiteForge || {});
