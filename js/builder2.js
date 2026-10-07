
/* ---------- more components (appended to SiteForge) ---------- */
(function (SF) {
'use strict';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* A–Z archive with Best-of-the-Best pinned on top. entries: [{t,d}] */
function compArchive(entries, bestIdx, readAloud) {
  entries = entries || [];
  var best = entries[bestIdx || 0] || entries[0];
  var out = '';
  if (best) {
    out += '<details class="best" open><summary>\u2605 Best of the Best: ' + esc(best.t) + '</summary>' +
      '<div id="bestbody"><p>' + esc(best.d) + '</p>' +
      '<div class="stats"><span class="stat">\uD83C\uDFC6 Top pick</span>' +
      '<span class="stat">\uD83D\uDCC4 ' + entries.length + ' entries</span></div>' +
      (readAloud ? '<button class="btn ghost" onclick="readEl(\'bestbody\')">\uD83D\uDD0A Read aloud</button>' : '') +
      '</div></details>';
  }
  var letters = {}, i, L;
  for (i = 0; i < entries.length; i++) {
    L = (entries[i].t.charAt(0) || '#').toUpperCase();
    if (!/[A-Z]/.test(L)) L = '#';
    (letters[L] = letters[L] || []).push(i);
  }
  var keys = Object.keys(letters).sort();
  out += '<h3>Browse A\u2013Z (' + entries.length + ')</h3>';
  for (i = 0; i < keys.length; i++) {
    L = keys[i];
    out += '<details class="az"><summary>' + esc(L) + ' (' + letters[L].length + ')</summary><div class="azlist">';
    for (var j = 0; j < letters[L].length; j++) {
      var idx = letters[L][j];
      out += '<a href="#entryview" onclick="showEntry(' + idx + ');return false"><b>' + esc(entries[idx].t) + '</b><br><span class="dim">' +
        esc(entries[idx].d) + '</span></a>';
    }
    out += '</div></details>';
  }
  /* Each archive entry gets its own working detail view: what-it-does,
     implications, stats, copy/download/audio. copyText/downloadFile/readEl/
     stopReading come from the page shell's shared helpers. */
  var adata = JSON.stringify(entries.map(function (e) { return { t: e.t, d: e.d }; })).replace(/</g, '\\u003c');
  out += '<div class="sec" id="entryview" hidden><div id="evbody">' +
    '<h2 id="evtitle"></h2><p id="evdesc"></p>' +
    '<h3>What it does</h3><p id="evwhat"></p>' +
    '<h3>Implications</h3><p id="evimp"></p>' +
    '<p class="dim" id="evstat"></p></div>' +
    '<div class="row">' +
    '<button class="btn ghost" id="evcopy">\\uD83D\\uDCCB Copy</button>' +
    '<button class="btn ghost" id="evdl">\\u2B07\\uFE0F Download</button>' +
    (readAloud ? '<button class="btn ghost" onclick="readEl(\'evbody\')">\\uD83D\\uDD0A Read aloud</button>' : '') +
    '<button class="btn ghost" onclick="document.getElementById(\'entryview\').hidden=true;try{stopReading()}catch(e){}">Close</button>' +
    '</div></div>';
  out += '<script>\\nvar ARCH_ENTRIES=' + adata + ';\\nvar ARCH_I=0;\\n' +
    'function showEntry(i){ARCH_I=i;var e=ARCH_ENTRIES[i];if(!e)return;\\n' +
    'var v=document.getElementById("entryview");v.hidden=false;\\n' +
    'document.getElementById("evtitle").textContent=e.t;\\n' +
    'document.getElementById("evdesc").textContent=e.d;\\n' +
    'document.getElementById("evwhat").textContent=e.d;\\n' +
    'document.getElementById("evimp").textContent="Part of this site\\u2019s archive \\u2014 one of "+ARCH_ENTRIES.length+" entries. Replace it with your real content to make it yours.";\\n' +
    'document.getElementById("evstat").textContent="Entry "+(i+1)+" of "+ARCH_ENTRIES.length+\\n' +
    '  "; filed under \\u201C"+(String(e.t).charAt(0)||"#").toUpperCase()+"\\u201D.";\\n' +
    'try{v.scrollIntoView()}catch(err){}}\\n' +
    'document.getElementById("evcopy").onclick=function(){var e=ARCH_ENTRIES[ARCH_I];copyText(e.t+"\\n\\n"+e.d,this);};\\n' +
    'document.getElementById("evdl").onclick=function(){var e=ARCH_ENTRIES[ARCH_I];\\n' +
    '  downloadFile(String(e.t).replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".txt",e.t+"\\n\\n"+e.d,"text/plain")};\\n' +
    '</scr' + 'ipt>';
  return out;
}

/* Client-side search over the archive entries. */
function compSearch(entries) {
  var data = JSON.stringify(entries || []).replace(/</g, '\\u003c');
  return '<div class="sec"><h2>\uD83D\uDD0D Search</h2>' +
    '<input class="txt" id="sq" placeholder="Type to search\u2026" oninput="doSearch()">' +
    '<div id="sres" class="azlist" style="margin-top:8px"></div></div>' +
    '<script>\nvar SEARCH_DATA=' + data + ';\n' +
    'function doSearch(){var q=document.getElementById("sq").value.toLowerCase();' +
    'var box=document.getElementById("sres");box.innerHTML="";if(q.length<2)return;' +
    'var n=0;for(var i=0;i<SEARCH_DATA.length&&n<20;i++){var e=SEARCH_DATA[i];' +
    'if((e.t+" "+e.d).toLowerCase().indexOf(q)>=0){n++;' +
    'box.innerHTML+="<b>"+e.t.replace(/</g,"&lt;")+"</b><br><span class=\\"dim\\">"+e.d.replace(/</g,"&lt;")+"</span><br><br>";}}' +
    'if(!n)box.innerHTML="<span class=\\"dim\\">No matches.</span>";}\n</script>';
}

/* AI chat — the mode changes the generated code. Honest in every mode. */
function compAiChat(mode, siteName) {
  var inner = '<div class="chatbox"><div id="chatlog" aria-live="polite"></div>' +
    '<div class="chatrow"><input id="qin" placeholder="Ask about ' + esc(siteName) +
    '\u2026" aria-label="Ask a question"><button class="btn" id="qgo">Ask</button></div>' +
    '<p class="dim" id="engineNote"></p></div>';
  var logic;
  if (mode === 'online') {
    logic = [
      '<script src="https://justinahiggins614-cmyk.github.io/signature-llama/llama-api.js"></scr' + 'ipt>',
      '<script>',
      'document.getElementById("engineNote").textContent =',
      '  "Powered by the free Signature Llama engine (no key needed). Answers are labeled with their engine.";',
      'function escH(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;"}[c];});}',
      'function say(q,a){var l=document.getElementById("chatlog");',
      '  l.innerHTML+=\'<div class="q">You: \'+escH(q)+\'</div><div class="a">\'+escH(a)+\'</div>\';l.scrollTop=l.scrollHeight;}',
      'document.getElementById("qgo").onclick=function(){',
      '  var q=document.getElementById("qin").value.trim(); if(!q) return;',
      '  document.getElementById("qin").value=""; say(q,"Thinking\u2026");',
      '  var log=document.getElementById("chatlog");',
      '  function finish(a){ log.lastChild.previousSibling.nextSibling; log.innerHTML=log.innerHTML.replace(/Thinking\u2026<\\/div>$/,""); say(q,a); }',
      '  if(window.SignatureLlama && SignatureLlama.ask){',
      '    SignatureLlama.ask(q).then(function(a){',
      '      log.innerHTML=log.innerHTML.replace("Thinking\u2026",""); say(q,a);',
      '    },function(){ log.innerHTML=log.innerHTML.replace("Thinking\u2026","");',
      '      say(q,"The Llama engine could not be reached. Check your connection and try again."); });',
      '  } else { log.innerHTML=log.innerHTML.replace("Thinking\u2026","");',
      '    say(q,"The Llama engine script did not load. Check your connection and try again."); }',
      '};',
      '</scr' + 'ipt>'
    ].join('\n');
  } else if (mode === 'offline') {
    logic = [
      '<script src="./sigllama/sigllama.js"></scr' + 'ipt>',
      '<script>',
      'document.getElementById("engineNote").innerHTML =',
      '  "Offline mode: this page tries to load the Signature Llama engine from a <b>sigllama/</b> folder next to this file. " +',
      '  "Download the free engine files (sigllama.js + model files) from " +',
      '  "<a href=\\"https://justinahiggins614-cmyk.github.io/signature-llama/\\">the Signature Llama site</a> and place them in <b>sigllama/</b>. " +',
      '  "Until then, answers come from the built-in guide below.";',
      'function escH(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;"}[c];});}',
      'function say(q,a){var l=document.getElementById("chatlog");',
      '  l.innerHTML+=\'<div class="q">You: \'+escH(q)+\'</div><div class="a">\'+escH(a)+\'</div>\';l.scrollTop=l.scrollHeight;}',
      'var GUIDE=[["hour","We are open every day. See the archive for details."],["where","You are on our website \u2014 browse the tabs above."],["cost","Everything here is free."]];',
      'document.getElementById("qgo").onclick=function(){',
      '  var q=document.getElementById("qin").value.trim(); if(!q) return;',
      '  document.getElementById("qin").value="";',
      '  function answer(a){ say(q,a); }',
      '  if(window.SignatureLlama && SignatureLlama.ask){',
      '    say(q,"Thinking\u2026");',
      '    SignatureLlama.ask(q).then(function(a){',
      '      var l=document.getElementById("chatlog");',
      '      l.innerHTML=l.innerHTML.replace("Thinking\u2026",""); say(q,a);',
      '    },function(){ var l=document.getElementById("chatlog");',
      '      l.innerHTML=l.innerHTML.replace("Thinking\u2026",""); guideAnswer(q,answer); });',
      '  } else guideAnswer(q,answer);',
      '};',
      'function guideAnswer(q,answer){ q=q.toLowerCase();',
      '  for(var i=0;i<GUIDE.length;i++) if(q.indexOf(GUIDE[i][0])>=0) return answer("Guide: "+GUIDE[i][1]);',
      '  answer("Guide: thanks for asking! The engine files are not installed yet \u2014 see the note above. Meanwhile, browse the archive tab."); }',
      '</scr' + 'ipt>'
    ].join('\n');
  } else {
    logic = [
      '<script>',
      'document.getElementById("engineNote").textContent =',
      '  "This is a fast static site: questions are answered from the built-in guide below. No AI engine needed.";',
      'function escH(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;"}[c];});}',
      'function say(q,a){var l=document.getElementById("chatlog");',
      '  l.innerHTML+=\'<div class="q">You: \'+escH(q)+\'</div><div class="a">\'+escH(a)+\'</div>\';l.scrollTop=l.scrollHeight;}',
      'var GUIDE=[["hour","We are open every day. See the archive for details."],["where","You are on our website \u2014 browse the tabs above."],["cost","Everything here is free."],["contact","Use the contact form on this page to reach us."]];',
      'document.getElementById("qgo").onclick=function(){',
      '  var q=document.getElementById("qin").value.trim().toLowerCase(); if(!q) return;',
      '  document.getElementById("qin").value="";',
      '  for(var i=0;i<GUIDE.length;i++) if(q.indexOf(GUIDE[i][0])>=0) return say(q,"Guide: "+GUIDE[i][1]);',
      '  say(q,"Guide: good question! Try asking about hours, cost, or contact \u2014 or browse the archive tab.");',
      '};',
      '</scr' + 'ipt>'
  ].join('\n');
  }
  return '<div class="sec"><h2>\uD83D\uDCAC Ask</h2>' + inner + logic + '</div>';
}

/* Contact form via mailto — honest, no fake backend.
   email: the owner's own address from the builder. If none was given, the
   button says so plainly instead of mailing a placeholder. */
function compContact(siteName, email) {
  var em = String(email || '').trim();
  var ok = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(em);
  var emJs = ok ? em.replace(/['"\\]/g, '') : '';
  var btn, script;
  if (ok) {
    btn = '<button class="btn" onclick="sendMail()">Send via email</button>';
    script = '<script>\nfunction jahToast(m){var t=document.getElementById("jah-toast");if(!t){t=document.createElement("div");t.id="jah-toast";t.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1c2940;color:#fff;padding:12px 20px;border-radius:10px;z-index:99999;max-width:90vw;display:none";document.body.appendChild(t)}t.textContent=String(m);t.style.display="block";clearTimeout(t._x);t._x=setTimeout(function(){t.style.display="none"},2800)}\nfunction sendMail(){var n=document.getElementById("cname").value;' +
      'var m=document.getElementById("cmsg").value;' +
      'if(!m.trim()){jahToast("Please write a message first.");return;}' +
      'location.href="mailto:' + emJs + '?subject="+encodeURIComponent("Message for ' +
      esc(siteName).replace(/"/g, '') + ' from "+n)+' +
      '"&body="+encodeURIComponent(m);}\n</script>';
  } else {
    btn = '<button class="btn" onclick="noMail()">Send via email</button>' +
      '<p class="dim">\u26A0\uFE0F No contact email was set for this site yet \u2014 add your email in the builder and rebuild.</p>';
    script = '<script>\nfunction jahToast(m){var t=document.getElementById("jah-toast");if(!t){t=document.createElement("div");t.id="jah-toast";t.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1c2940;color:#fff;padding:12px 20px;border-radius:10px;z-index:99999;max-width:90vw;display:none";document.body.appendChild(t)}t.textContent=String(m);t.style.display="block";clearTimeout(t._x);t._x=setTimeout(function(){t.style.display="none"},2800)}\nfunction noMail(){jahToast("This site has no contact email set yet. ' +
      'The owner can add one in the Builder (Step 1) and rebuild.");}\n</script>';
  }
  return '<div class="sec"><h2>\u2709\uFE0F Contact</h2>' +
    '<p class="dim">This form opens your email app \u2014 nothing is sent until you press Send there.</p>' +
    '<input class="txt" id="cname" placeholder="Your name" aria-label="Your name"><br><br>' +
    '<textarea class="txt" id="cmsg" rows="4" placeholder="Your message\u2026" aria-label="Your message"></textarea><br><br>' +
    btn + script + '</div>';
}

/* Gallery with labeled placeholder slots the owner fills in. */
function compGallery() {
  var cells = '';
  for (var i = 1; i <= 6; i++) {
    cells += '<figure><svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Photo slot ' + i + '">' +
      '<rect width="200" height="140" fill="#141d33"/>' +
      '<text x="100" y="75" text-anchor="middle" fill="#9aa4b2" font-size="15">Photo ' + i + '</text></svg>' +
      '<figcaption>Replace with your photo ' + i + '</figcaption></figure>';
  }
  return '<div class="sec"><h2>\uD83D\uDCF7 Gallery</h2><p class="dim">Swap these slots with your own photos.</p>' +
    '<div class="gal">' + cells + '</div></div>';
}

SF.compArchive = compArchive;
SF.compSearch = compSearch;
SF.compAiChat = compAiChat;
SF.compContact = compContact;
SF.compGallery = compGallery;

})(window.SiteForge = window.SiteForge || {});
