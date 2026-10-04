
/* ============================================================
 * SiteForge v1 — buildSite(): the honest assembler.
 * Reads the user's plain-words description + choices, picks real
 * components, and emits complete working files. Every pick is
 * reported with its reason in `picks`.
 * ============================================================ */
(function (SF) {
'use strict';

var SMART_LABEL = {
  static: 'Static site (pure HTML \u2014 fastest, works everywhere)',
  online: 'AI Llama Online (live answers via the free Signature Llama engine)',
  offline: 'AI Llama Offline (bundles the downloadable Llama engine)'
};

function seedEntries(desc, name) {
  var kw = SF.keywords(desc);
  var entries = [{ t: 'Welcome to ' + name, d: 'Start here \u2014 what this site is and how to use it.' }];
  var made = {};
  for (var i = 0; i < kw.length && entries.length < 9; i++) {
    var k = kw[i];
    if (made[k]) continue; made[k] = 1;
    entries.push({ t: cap1(k) + ' Corner', d: 'Everything about ' + k + ' in one place.' });
  }
  var fillers = [
    ['Photo Gallery', 'Pictures and highlights.'],
    ['About Us', 'Who we are and what we do.'],
    ['Contact', 'How to reach us.'],
    ['News & Updates', 'The latest from us.']
  ];
  for (var j = 0; j < fillers.length && entries.length < 9; j++) {
    entries.push({ t: fillers[j][0], d: fillers[j][1] });
  }
  return entries;
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
}

function pageShell(o) {
  /* o: {title, tagline, bodyHTML, tabs, activeHref, hereLabel, extraHead} */
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<title>' + SF.esc(o.title) + '</title>\n' +
    '<meta name="description" content="' + SF.esc(o.tagline || o.title) + '">\n' +
    '<style>\n' + SF.BASE_CSS + '\n</style>\n' + (o.extraHead || '') +
    '</head>\n<body>\n' +
    SF.compHero(o.title, o.tagline) + '\n' +
    SF.compTabBar(o.tabs, o.activeHref) + '\n' +
    '<div class="wrap">\n' + o.bodyHTML + '\n</div>\n' +
    SF.compNetworkNav(o.hereLabel || o.title) + '\n' +
    '<footer>Made with the Signature Website Creator \u00B7 ' + SF.esc(o.title) + '</footer>\n' +
    '<script>\n' + SF.READ_ALOUD_JS + '\n' + SF.COPY_DL_JS + '\n</script>\n' +
    '</body>\n</html>\n';
}

function buildSite(opts) {
  var name = String(opts.name || 'My Website').slice(0, 60);
  var desc = String(opts.description || '');
  var smart = opts.smartness === 'online' ? 'online' : (opts.smartness === 'offline' ? 'offline' : 'static');
  var auto = opts.auto || {};
  var slug = SF.slugify(name);
  var ownerName = String(opts.ownerName || '').slice(0, 80);
  var ownerInfo = String(opts.ownerInfo || '').slice(0, 300);
  var passwordHash = String(opts.passwordHash || '');
  var tagline = desc.length > 140 ? desc.slice(0, 137) + '\u2026' : desc;
  var entries = seedEntries(desc, name);
  var picks = [];
  var tabs = [
    { label: '\uD83C\uDFE0 Main', href: 'index.html' },
    { label: '\uD83D\uDCC2 Archive', href: 'archive.html' }
  ];

  function pick(component, why) { picks.push({ component: component, why: why }); }

  /* ---- Main page body ---- */
  var main = '<div class="sec" id="intro"><h2>Welcome</h2><p>' + SF.esc(desc) + '</p>' +
    (ownerName ? '<p class="dim">Run by ' + SF.esc(ownerName) +
      (ownerInfo ? ' \u2014 ' + SF.esc(ownerInfo) : '') + '</p>' : '') +
    SF.compReadAloudButton('intro', 'Read this page') + '</div>';

  main += '<div class="sec"><h2>What you get on this site</h2><ul>';
  var feats = [];
  if (auto.search) feats.push('Search everything on the site');
  if (auto.archive) feats.push('A full A\u2013Z archive with a Best-of-the-Best pick');
  if (smart !== 'static') feats.push('An AI helper that answers questions');
  else feats.push('A built-in question guide (no internet needed)');
  if (auto.readaloud) feats.push('Read-aloud on every page');
  if (auto.copydl) feats.push('Copy and download buttons');
  if (auto.gallery) feats.push('A photo gallery');
  if (auto.contact) feats.push('A contact form');
  if (auto.store) feats.push('A store with checkout (opt-in \u2014 off until you enable it)');
  feats.push('The full JAH Network nav bar');
  for (var f = 0; f < feats.length; f++) main += '<li>' + SF.esc(feats[f]) + '</li>';
  main += '</ul></div>';

  if (auto.search) { main += SF.compSearch(entries); pick('Search box', 'You turned on "Automate" for search \u2014 visitors can find anything instantly.'); }
  main += SF.compAiChat(smart, name);
  pick(smart === 'static' ? 'Built-in question guide' : 'AI chat (' + smart + ')',
    smart === 'static'
      ? 'You chose Static: no network calls at all. Questions are answered from a built-in guide so the page is lightning-fast and works offline.'
      : smart === 'online'
      ? 'You chose AI Llama Online: the page loads the free Signature Llama engine script and answers live. Needs internet.'
      : 'You chose AI Llama Offline: the page looks for the engine in a local sigllama/ folder first (works with no connection) and falls back to the guide until you install the engine files.');
  if (auto.gallery) { main += SF.compGallery(); pick('Photo gallery', 'You turned on "Automate" for the gallery \u2014 six labeled slots you swap with your own photos.'); }
  if (auto.contact) { main += SF.compContact(name); pick('Contact form (mailto)', 'You turned on "Automate" for contact \u2014 an honest mailto form; it opens the visitor\u2019s email app instead of pretending to send.'); }
  if (auto.store) {
    var products = entries.slice(0, 4).map(function (e) { return { t: e.t, d: e.d }; });
    main += SF.compStore(products, slug);
    pick('Store + checkout (OPT-IN, off by default)', 'You chose to offer selling: products with prices you set, Buy buttons that open YOUR OWN payment links. The Creator never touches money \u2014 checkout stays OFF until you enable it in Manager settings with your own provider.');
  }
  if (passwordHash) {
    main += SF.compManager(passwordHash, slug, !!auto.store);
    pick('Manager mode (master password)', 'You set a manager password: a \uD83D\uDD27 Manager button on your site unlocks text editing and store settings. Only the password fingerprint is baked into your files.');
  }

  /* ---- Archive page ---- */
  var arch = '<div class="sec"><h2>\uD83D\uDCC2 Archive</h2>' +
    '<p class="dim">Sample entries made from your description \u2014 replace them with your real content.</p></div>';
  if (auto.archive) {
    arch += SF.compArchive(entries, 0, !!auto.readaloud);
    pick('A\u2013Z archive', 'You turned on "Automate" for the archive \u2014 ' + entries.length + ' sample entries filed A\u2013Z from your description.');
    if (auto.best) pick('Best of the Best', 'You turned on "Automate" for best-of-the-best \u2014 our top pick "' + entries[0].t + '" is pinned open above the A\u2013Z list.');
    else arch = arch.replace('<details class="best" open>', '<details class="best">');
  } else {
    arch += '<div class="sec"><p>You chose not to auto-generate the archive. Add your own pages and link them here.</p></div>';
    pick('Archive page (manual)', 'You left the archive toggle off \u2014 the page exists with the tab in place, ready for your own entries.');
  }

  var hereLabel = name;

  var files = {
    'index.html': pageShell({ title: name, tagline: tagline, bodyHTML: main, tabs: tabs, activeHref: 'index.html', hereLabel: hereLabel }),
    'archive.html': pageShell({ title: name + ' \u2014 Archive', tagline: 'The full A\u2013Z archive of ' + name + '.', bodyHTML: arch, tabs: tabs, activeHref: 'archive.html', hereLabel: hereLabel })
  };

  var base = 'https://example.com/' + slug + '/';
  files['sitemap.xml'] =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url><loc>' + base + 'index.html</loc></url>\n' +
    '  <url><loc>' + base + 'archive.html</loc></url>\n</urlset>\n';
  files['robots.txt'] = 'User-agent: *\nAllow: /\nSitemap: ' + base + 'sitemap.xml\n';
  pick('sitemap.xml + robots.txt', 'Every generated site ships sitemap + robots so search engines can find it. Replace example.com with your real address.');

  pick('JAH network nav', 'Our formula: every site carries the full 31-site network bar at the bottom.');
  pick('Tab bar (catalog last)', 'Our formula: pill tab bar, Archive tab always last.');
  if (auto.readaloud) pick('Read-aloud', 'You turned on "Automate" for read-aloud \u2014 every page gets \uD83D\uDD0A buttons with cancel-first audio.');
  if (auto.copydl) pick('Copy/download helpers', 'You turned on "Automate" for copy/download \u2014 the built-in helpers power every button.');

  return { name: name, slug: slug, smartness: smart, smartLabel: SMART_LABEL[smart], files: files, picks: picks, entries: entries, ownerName: ownerName, hasStore: !!auto.store, hasManager: !!passwordHash };
}

SF.SMART_LABEL = SMART_LABEL;
SF.buildSite = buildSite;
SF.seedEntries = seedEntries;

})(window.SiteForge = window.SiteForge || {});
