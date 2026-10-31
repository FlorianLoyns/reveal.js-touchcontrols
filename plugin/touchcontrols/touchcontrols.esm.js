/*!
 * reveal.js-touchcontrols 1.7.9
 * Touch display / smartboard plugin for reveal.js.
 * Copyright Florian Loyns · MIT License
 */
  'use strict';

  /* Print-view detection must work both in Reveal's ?print-pdf view and in the browser print dialog. Apply all print rules to both cases. */
  function isPrintView(deck){
    if (/(?:\?|&)print-pdf\b/i.test(window.location.search)) return true;
    var c = deck && deck.getConfig ? deck.getConfig() : null;
    return !!(c && c.view === 'print');
  }
  /* Ink colors may be hex codes, color names or rgb()/rgba()/hsl()/hsla().
     Only plain color characters are allowed; the browser confirms validity. */
  function isInkColor(c){
    if (typeof c !== 'string' || !c || c.length > 64 || !/^[#a-z0-9\s(),.%\/+-]+$/i.test(c)) return false;
    if (window.CSS && CSS.supports) return CSS.supports('color', c);
    return /^(#[0-9a-f]{3,8}|[a-z]+|(?:rgb|hsl)a?\([^()]*\))$/i.test(c);
  }
  function printCSS(css){
    var pdf = css.replace(/(^|\})([^{}]+)\{/g, function (m, vor, sel) {
      return vor + sel.split(',').map(function (s) { return 'html.print-pdf ' + s.trim(); }).join(',') + '{';
    });
    return '@media print{' + css + '}' + pdf;
  }

  function svg(p){ return '<svg viewBox="0 0 24 24">' + p + '</svg>'; }
  var ICON = {
    pen:  svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    eraser: svg('<g transform="rotate(-40 12 12)"><rect x="3.5" y="8" width="17" height="8.5" rx="2"/><path d="M10 8v8.5"/></g><path d="M5 21h14"/>'),
    undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v4"/>'),
    redo: svg('<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0-6 6v4"/>'),
    save: svg('<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M4 17v4h16v-4"/>'),
    board: svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 10.5c1.7-2 3.3-2 5 0s3.3 2 5 0"/><path d="M8 21l2-4"/><path d="M16 21l-2-4"/>'),
    zoom: svg('<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4-4"/><circle cx="11" cy="11" r="2.3" fill="currentColor" stroke="none"/>'),
    timer: svg('<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5v3.5l2.6 1.6"/><path d="M9.5 2.5h5"/><path d="M12 2.5v3"/>'),
    pause: svg('<path d="M9 5v14"/><path d="M15 5v14"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    full: svg('<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/>'),
    print: svg('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/><path d="M17.5 12h.01"/>'),
    more: svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>')
  };

  function penCursor(color){
    return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='"
      + encodeURIComponent(color) + "' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'/%3E%3C/svg%3E\") 4 24, crosshair";
  }

  function injectCSS(o){
    if (document.getElementById('touchcontrols-css')) return;
    var pos = (o.side === 'right') ? 'right:18px' : 'left:18px';
    var css =
      ".reveal .touchcontrols{position:fixed;visibility:visible;" + pos + ";bottom:" + o.bottom + "px;z-index:60;display:flex;align-items:flex-start;flex-direction:column;gap:5px;max-width:calc(100vw - 24px);transition:opacity .3s ease}"
    + ".reveal .touchcontrols.tc-right{align-items:flex-end}"
    + ".reveal .touchcontrols .tc-group{display:flex;align-items:center;gap:6px;flex-wrap:nowrap;padding:4px;border-radius:12px;background:rgba(255,255,255,.96);box-shadow:0 2px 12px rgba(0,0,0,.12);max-width:100%;box-sizing:border-box}"
    + ".reveal .touchcontrols .tc-group[hidden]{display:none!important}"
    // Print is an endpoint action, so separate it visually from the More tools button.
    // Keep the gap even when Print is hidden on intermediate slides, to reserve its slot.
    + ".reveal .touchcontrols:not(.tc-flat) .tc-main > [data-tc-control=print]{margin-inline-start:12px}"
    + ".reveal .touchcontrols .tc-panel{flex-wrap:wrap;max-width:min(440px,calc(100vw - 36px));gap:5px}"
    + ".reveal .touchcontrols .tc-panel button.tc-text{width:auto;min-width:44px;flex:0 0 auto;padding:0 10px;font-size:13px;font-weight:600;white-space:nowrap}"
    + ".reveal .touchcontrols .tc-panel button.tc-swatch{width:36px;height:36px;flex:0 0 36px;border-radius:50%;background:var(--tc-swatch)!important;border:2px solid currentColor}"
    + ".reveal .touchcontrols .tc-panel button.tc-swatch.active{border-style:solid;border-width:2px;outline:1px solid currentColor;outline-offset:2px}"
    + ".reveal .touchcontrols .tc-panel .tc-panel-label{width:100%;font:600 13px/1.4 system-ui,sans-serif;color:inherit;opacity:.9;padding:1px 3px}"
    + ".reveal .touchcontrols.tc-flat{flex-direction:row;flex-wrap:wrap}"
    + ".reveal .touchcontrols.tc-flat .tc-panel{flex-basis:100%}"
    + ".reveal .touchcontrols.tc-flat .tc-group{flex-wrap:wrap}"
    + ".reveal.has-dark-background .touchcontrols .tc-group{background:transparent;box-shadow:none}"
    + ".reveal.has-dark-background .touchcontrols .tc-group::before{display:none}"
    + ".reveal.has-dark-background .touchcontrols.wb-on .tc-group{background:transparent;box-shadow:none}"
    + ".reveal .touchcontrols.idle{opacity:0;pointer-events:none}"
    + ".reveal .touchcontrols button{width:44px;height:44px;flex:0 0 44px;padding:0;cursor:pointer;border-radius:9px;background:transparent;border:1px solid " + o.accent + ";border-color:color-mix(in srgb," + o.accent + " 35%,transparent);color:" + o.accent + ";display:flex;align-items:center;justify-content:center;transition:.14s}"
    + ".reveal .touchcontrols button[hidden]{display:none!important}"
    + ".reveal .touchcontrols button:hover{background:" + o.hover + "}"
    + ".reveal .touchcontrols button:active{transform:translateY(1px)}"
    /* No secondary keyboard/browser focus ring on icons. The selected tool is
       already identified by its solid (or fading-pen dotted) border. */
    + ".reveal .touchcontrols button:focus,.reveal .touchcontrols button:focus-visible{outline:none!important;outline-offset:0!important;box-shadow:none!important}"
    + ".reveal .touchcontrols button:disabled{opacity:.35;cursor:not-allowed}"
    + ".reveal .touchcontrols button.active{background:transparent;border-style:solid;border-width:2px;border-color:" + o.accent + ";color:" + o.accent + "}"
    + ".reveal.has-dark-background .touchcontrols button{border-color:rgba(255,255,255,.4);color:#fff}"
    + ".reveal.has-dark-background .touchcontrols button:hover{background:transparent}"
    + ".reveal.has-dark-background .touchcontrols button.active{background:transparent;border-color:#fff;color:#fff}"
    /* The whiteboard uses the configured accent color, including over a dark slide. */
    + ".reveal.has-dark-background .touchcontrols.wb-on button{border-color:" + o.accent + ";border-color:color-mix(in srgb," + o.accent + " 35%,transparent);color:" + o.accent + "}"
    + ".reveal.has-dark-background .touchcontrols.wb-on button:hover{background:transparent}"
    + ".reveal.has-dark-background .touchcontrols.wb-on button.active{background:transparent;border-color:" + o.accent + ";color:" + o.accent + "}"
    + ".reveal .touchcontrols button svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"
    + ".reveal .slides section > .touchcontrols-print-ink{position:absolute;top:0;left:0;width:100%;height:100%;z-index:500;overflow:hidden;pointer-events:none}"
    + ".reveal .touchcontrols-annot{position:fixed;inset:0;z-index:45;pointer-events:none;touch-action:none}"
    + ".reveal .touchcontrols-fade{position:fixed;inset:0;z-index:47;pointer-events:none;touch-action:none}"
    + ".reveal .touchcontrols-annot.on{cursor:" + penCursor(o.inks[0]) + "}"
    + ".reveal .touchcontrols-board{position:fixed;inset:0;z-index:44;background:#fff;display:none}"
    + ".reveal .touchcontrols-board.on{display:block}"
    /* Spotlight: a circular focus region with a dimmed, soft-edged surrounding area. */
    + ".reveal .touchcontrols-spot{position:fixed;z-index:46;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);box-shadow:0 0 40px 9999px rgba(0,0,0," + o.spotDim + ");opacity:0;visibility:hidden;transition:opacity .22s ease,visibility .22s ease,box-shadow .4s ease}"
    + ".reveal .touchcontrols-spot.on{opacity:1;visibility:visible}"
    + ".reveal .touchcontrols-spot.zoomed{box-shadow:0 0 40px 9999px rgba(0,0,0," + o.spotDimZoom + ")}"
    /* The new default is an actual magnifying glass: a clipped copy of the slide
       and its vector ink, not a transformation of the original presentation. */
    /* Dual-contrast, hairline lens rim: legible over both dark and light slides,
       including slides with pictures instead of a uniform background. */
    + ".reveal .touchcontrols-magnifier{position:fixed;z-index:48;box-sizing:border-box;overflow:hidden;border:1px solid rgba(24,32,42,.72);border-radius:50%;pointer-events:none;background:#fff;box-shadow:0 2px 9px rgba(0,0,0,.16),0 0 0 1px rgba(255,255,255,.65)}"
    + ".reveal.has-dark-background .touchcontrols-magnifier{border-color:rgba(255,255,255,.85);box-shadow:0 2px 9px rgba(0,0,0,.22),0 0 0 1px rgba(18,25,36,.48)}"
    + ".reveal .touchcontrols-lens-scene{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none}"
    + ".reveal .touchcontrols-lens-slides{position:absolute!important;left:0!important;top:0!important;margin:0!important;transform:none!important;overflow:visible!important;pointer-events:none!important}"
    + ".reveal .touchcontrols-lens-slide{opacity:1!important;visibility:visible!important;pointer-events:none!important;transition:none!important}"
    + ".reveal .touchcontrols-lens-ink{position:absolute;left:0;top:0;pointer-events:none}"
    /* In focus mode, disable native touch scrolling and zooming to avoid pointer cancellation. */
    + ".reveal.tc-focus,.reveal.tc-focus .slides{touch-action:none !important}"
    + ".reveal .touchcontrols-timer{position:fixed;" + pos + ";bottom:" + (o.bottom + 116) + "px;z-index:60;display:none;padding:6px 16px;border-radius:12px;background:" + o.accent + ";color:#fff;font-family:Inter,system-ui,-apple-system,sans-serif;font-size:24px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.5px}"
    + ".reveal .touchcontrols-timer.on{display:block;cursor:pointer}"
    + ".reveal .touchcontrols-timer.paused{background:#666}"
    + ".reveal .touchcontrols-timer:focus-visible{outline:2px solid currentColor;outline-offset:3px}"
    + ".reveal .touchcontrols-timer.done{background:#D14A4A;animation:tc-pulse 1s ease-in-out infinite}"
    + "@keyframes tc-pulse{0%,100%{opacity:1}50%{opacity:.35}}"
    + "@media(max-width:600px){.reveal .touchcontrols{gap:4px;max-width:calc(100vw - 24px)}.reveal .touchcontrols .tc-group{gap:4px;padding:4px}.reveal .touchcontrols button{width:42px;height:42px;flex-basis:42px}.reveal .touchcontrols:not(.tc-flat) .tc-main > [data-tc-control=print]{margin-inline-start:8px}.reveal .touchcontrols-timer{bottom:" + (o.bottom + 70) + "px}}"
    + ".reveal .controls{z-index:50}"
    + printCSS(".reveal .touchcontrols,.reveal .touchcontrols-annot,.reveal .touchcontrols-fade,.reveal .touchcontrols-board,.reveal .touchcontrols-timer,.reveal .touchcontrols-spot,.reveal .touchcontrols-magnifier{display:none !important}");
    var s = document.createElement('style');
    s.id = 'touchcontrols-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  function toggleFullscreen(){
    var d = document, el = d.documentElement;
    if (!d.fullscreenElement){ (el.requestFullscreen || el.webkitRequestFullscreen || function(){}).call(el); }
    else { (d.exitFullscreen || d.webkitExitFullscreen || function(){}).call(d); }
  }

  /* Export all presentation slides with their persistent vector ink. A separate
     print tab clones sessionStorage from its opener; opener property is a backup
     for browsers that disallow or delay storage. Print data is never sent away. */
  function openPrint(snapshot){
    // First slide: normal PDF without annotations, preserving the 1.6 behaviour.
    // Last slide: PDF with the retained strokes attached to their respective slides.
    var u = new URL(window.location.href);
    u.hash = '';
    u.searchParams.set('print-pdf', '');
    u.searchParams.set('autoprint', '1');
    u.searchParams.delete('tc-print');
    if (snapshot) {
      var id = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
      var payload = { id:id, version:1, slides:snapshot };
      window.__touchcontrolsPrintSnapshot = payload;
      try { window.sessionStorage.setItem('touchcontrols-print-payload',JSON.stringify(payload)); }
      catch(_) { /* private browsing / file URLs: opener fallback */ }
      u.searchParams.set('tc-print',id);
    }
    var tab = window.open(u.toString(), '_blank');
    if(!tab) window.alert('The print tab was blocked. Please allow pop-ups for this presentation.');
  }

  function installPrintInk(deck){
    var id = new URLSearchParams(window.location.search).get('tc-print');
    if(!id) return;
    var style=document.createElement('style');
    style.textContent='.reveal .slides section > .touchcontrols-print-ink{position:absolute!important;top:0!important;left:0!important;display:block!important;z-index:500;pointer-events:none;overflow:hidden}';
    document.head.appendChild(style);
    var data=null;
    try { data=JSON.parse(window.sessionStorage.getItem('touchcontrols-print-payload')||'null'); }
    catch(_){}
    if(!data || data.id !== id){
      try { data=window.opener && window.opener.__touchcontrolsPrintSnapshot; }
      catch(_){}
    }
    if(!data || data.id !== id || data.version !== 1 || !Array.isArray(data.slides)) return;
    function install(){
      var slides=document.querySelectorAll('.reveal .slides section');
      var svgNS='http://www.w3.org/2000/svg';
      data.slides.slice(0,500).forEach(function(item){
        if(!Array.isArray(item) || !Number.isInteger(item[0]) || !Array.isArray(item[1])) return;
        var slide=slides[item[0]];
        if(!slide || slide.querySelector(':scope > .touchcontrols-print-ink')) return;
        var svg=document.createElementNS(svgNS,'svg');
        svg.setAttribute('class','touchcontrols-print-ink');
        svg.setAttribute('viewBox','0 0 1000 1000');
        svg.setAttribute('preserveAspectRatio','none');
        svg.setAttribute('aria-hidden','true');
        var config=deck.getConfig && deck.getConfig() || {};
        svg.style.width=(Number(config.width)||960)+'px';
        svg.style.height=(Number(config.height)||700)+'px';
        var valid=0;
        item[1].slice(0,10000).forEach(function(st){
          if(!st || !Array.isArray(st.points) || !st.points.length || st.points.length>50000 ||
             !isInkColor(st.color) ||
             !Number.isFinite(st.width) || st.width<=0 || st.width>=0.2) return;
          var r=st.rect;
          if(!Array.isArray(r)||r.length!==4||!r.every(Number.isFinite)||r[2]<=0||r[3]<=0) return;
          var path=[], ok=true;
          st.points.forEach(function(pt,i){
            if(!Array.isArray(pt)||pt.length!==2||!pt.every(Number.isFinite)){ok=false;return;}
            var x=((pt[0]-r[0])/r[2]*1000), y=((pt[1]-r[1])/r[3]*1000);
            if(Math.abs(x)>1e6||Math.abs(y)>1e6){ok=false;return;}
            path.push((i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2));
          });
          if(!ok || !path.length) return;
          if(path.length===1)path.push('l 0.01 0');
          var p=document.createElementNS(svgNS,'path');
          p.setAttribute('d',path.join(' '));
          p.setAttribute('fill','none');p.setAttribute('stroke',st.color);
          p.setAttribute('stroke-width',String(Math.max(.5,st.width * Math.min(window.innerWidth,window.innerHeight) / (r[3]*window.innerHeight) * 1000)));
          p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');
          svg.appendChild(p); valid++;
        });
        if(valid)slide.appendChild(svg);
      });
    }
    if(deck.on){deck.on('ready',install);deck.on('pdf-ready',install);}
    if(deck.isReady && deck.isReady())install();
  }
  function autoPrint(deck){
    if (!/(?:\?|&)autoprint=1\b/.test(window.location.search)) return;
    var done = false;
    function go(){
      if (done) return; done = true;
      var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
      fonts.then(function(){ setTimeout(function(){ window.print(); }, 800); });
    }
    if (deck.on) deck.on('pdf-ready', go);
    setTimeout(go, 8000);   // Fallback when the event is unavailable
  }

  var Plugin = {
    id: 'touchcontrols',
    init: function (deck) {
      var d = document;
      if (isPrintView(deck)) { installPrintInk(deck); autoPrint(deck); return; }
      if (d.querySelector('.touchcontrols')) return;
      var host = deck.getRevealElement ? deck.getRevealElement() : d.body;

      var c = deck.getConfig().touchcontrols || {};
      var o = {
        side: c.side || 'left',
        bottom: (c.bottom != null) ? c.bottom : 32,
        accent: c.accent || '#2C4A6E',
        hover: c.hover || 'rgba(44,74,110,.10)',
        inks: (c.inks && c.inks.length) ? c.inks : ['#D14A4A', '#2B6CB0'],
        penWidth: c.penWidth || 4,
        buttons: Array.isArray(c.buttons) ? c.buttons : ['pen','eraser','undo','redo','save','whiteboard','zoom','timer','pause','overview','fullscreen','print'],
        /* Existing explicit buttons[] configuration keeps the old flat arrangement.
           Set toolbarMode:'contextual' to opt in with a custom button list. */
        toolbarMode: c.toolbarMode === 'flat' || (!c.toolbarMode && Array.isArray(c.buttons)) ? 'flat' : 'contextual',
        timerMinutes: (c.timerMinutes && c.timerMinutes.length) ? c.timerMinutes : [5, 10, 15],
        autohide: (c.autohide != null) ? c.autohide : true,
        autohideDelay: c.autohideDelay || 3500,
        /* Default: a drag-and-pinch circular magnifier. The old spotlight and
           multi-step focus behaviours remain opt-in for existing decks. */
        lupeMode: c.lupeMode || 'magnifier',
        spotRadius: (c.spotRadius != null) ? c.spotRadius : 120,
        spotDim: (c.spotDim != null) ? c.spotDim : 0.55,
        zoomScale: c.zoomScale || 2,
        /* Preserve annotations when navigating between slides. */
        keepAnnotations: (c.keepAnnotations != null) ? c.keepAnnotations : true,
        /* Fading ink is an additional pen mode whose strokes disappear automatically. */
        fadePen: (c.fadePen != null) ? c.fadePen : true,
        fadeInk: c.fadeInk || '#E5484D',
        fadeMs: c.fadeMs || 1800,
        /* Wake the hidden toolbar only near its corner. wakeZone is [width, height] in CSS pixels; false wakes it anywhere. wakeOnKey also wakes it on keyboard events. */
        wakeZone: (c.wakeZone === false) ? false : ((c.wakeZone && c.wakeZone.length === 2) ? c.wakeZone : [340, 150]),
        wakeOnKey: (c.wakeOnKey != null) ? c.wakeOnKey : false,
        historyLimit: Math.max(1, Math.min(200, Number(c.historyLimit) || 50)),
        persistAnnotations: c.persistAnnotations === true,
        keepWhiteboard: (c.keepWhiteboard != null) ? c.keepWhiteboard : true,
        eraserRadius: Math.max(5, Number(c.eraserRadius) || 18)
      };
      /* The zoom stage dims the surroundings less than the initial spotlight stage. */
      o.spotDimZoom = (c.spotDimZoom != null) ? c.spotDimZoom : +(o.spotDim * 0.64).toFixed(2);
      var preexistingCSS = d.getElementById('touchcontrols-css');
      injectCSS(o);
      var ownedCSS = preexistingCSS ? null : d.getElementById('touchcontrols-css');

      var cleanups = [];
      function listen(target, type, cb, opts){
        target.addEventListener(type, cb, opts);
        cleanups.push(function(){ target.removeEventListener(type, cb, opts); });
      }
      function deckListen(name, cb){
        if (!deck.on) return;
        deck.on(name, cb);
        if (deck.off) cleanups.push(function(){ deck.off(name, cb); });
      }
      var bar = d.createElement('div');
      bar.className = 'touchcontrols' + (o.side==='right'?' tc-right':'') + (o.toolbarMode==='flat'?' tc-flat':'');
      bar.setAttribute('aria-label', 'Presentation controls');
      bar.addEventListener('contextmenu', function(ev){ ev.preventDefault(); });   // Prevent the native context menu on long press

      /* Automatically hide the toolbar after inactivity. */
      var idleTimer = null;
      function activity(){
        bar.classList.remove('idle');
        bar.removeAttribute('aria-hidden');
        bar.querySelectorAll('button').forEach(function(btn){ btn.tabIndex = btn.hidden || btn.closest('[hidden]') || btn.style.display === 'none' ? -1 : 0; });
        if (!o.autohide) return;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(function(){
          if (pen.on || eraser.on || zoom.on || zoom.armed || wb.on || menuOpen || panelMode) return;   // Keep visible while a tool or menu is active
          bar.classList.add('idle');
          bar.setAttribute('aria-hidden', 'true');
          bar.querySelectorAll('button').forEach(function(btn){ btn.tabIndex = -1; });
        }, o.autohideDelay);
      }

      /* Pen annotations. Long press opens a settings panel; clearing is a separate, undoable action. */
      var pen = { on:false, canvas:null, ctx:null, drawing:false }, eraser = { on:false }, penBtn = null, eraserBtn = null, undoBtn = null, redoBtn = null, longPressed = false;
      var currentInk = o.inks[0], penState = -1, selectedPenState = 0; // -1=off; 0..n-1=ink colors; n=fading ink
      /* Fading strokes use a separate canvas. Persistent marks must never fade with them. Repaint stroke opacity from its age on each frame to avoid 8-bit alpha rounding artifacts. */
      var fade = { canvas:null, ctx:null, raf:null, strokes:[], currentStroke:null };
      function isFadingInk(){ return o.fadePen && penState === o.inks.length; }
      function timestampMs(){
        return (window.performance && performance.now) ? performance.now() : Date.now();
      }
      function ensureFade(){
        if (fade.canvas) return;
        var cv = d.createElement('canvas');
        cv.className = 'touchcontrols-fade';
        fade.ctx = cv.getContext('2d');
        fade.canvas = cv;
        sizeFade();
        listen(window, 'resize', sizeFade);
        host.appendChild(cv);
      }
      function sizeFade(){
        if (!fade.canvas) return;
        var dpr = window.devicePixelRatio || 1;
        fade.canvas.width  = Math.round(window.innerWidth  * dpr);
        fade.canvas.height = Math.round(window.innerHeight * dpr);
        fade.canvas.style.width  = window.innerWidth  + 'px';
        fade.canvas.style.height = window.innerHeight + 'px';
        fade.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      function clearFadeCanvas(){
        if (!fade.ctx) return;
        var x = fade.ctx;
        x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
        x.clearRect(0, 0, fade.canvas.width, fade.canvas.height);
        x.restore();
      }
      function clearFade(){
        fade.strokes = []; fade.currentStroke = null;
        clearFadeCanvas();
        if (fade.raf){ cancelAnimationFrame(fade.raf); fade.raf = null; }
      }
      /* Hold each completed fading stroke at full opacity briefly, then ease its opacity to zero. Keep the in-progress stroke fully opaque. */
      function fadeOpacity(st, ts){
        if (st.ende == null) return 1;
        var halt = o.fadeMs * 0.4, alt = ts - st.ende;
        if (alt <= halt) return 1;
        var p = (alt - halt) / (o.fadeMs - halt);
        if (p >= 1) return 0;
        return (1 - p) * (1 - p);            // Ease out instead of fading linearly
      }
      function fadeStep(ts){
        if (!fade.ctx){ fade.raf = null; return; }
        var x = fade.ctx, lebt = 0;
        clearFadeCanvas();
        x.save();
        x.lineWidth = o.penWidth; x.lineCap = 'round'; x.lineJoin = 'round';
        x.strokeStyle = o.fadeInk;
        for (var i = 0; i < fade.strokes.length; i++){
          var st = fade.strokes[i], a = fadeOpacity(st, ts);
          if (a <= 0.01) continue;
          lebt++;
          x.globalAlpha = a;
          x.beginPath();
          x.moveTo(st.p[0], st.p[1]);
          if (st.p.length === 2) x.lineTo(st.p[0] + 0.01, st.p[1]);   // A single tap draws a dot
          for (var k = 2; k < st.p.length; k += 2) x.lineTo(st.p[k], st.p[k + 1]);
          x.stroke();
        }
        x.restore();
        if (!lebt){ clearFade(); return; }
        if (fade.strokes.length > 40) fade.strokes = fade.strokes.slice(-20);
        fade.raf = requestAnimationFrame(fadeStep);
      }
      function fadeStart(px, py){
        ensureFade();
        fade.currentStroke = { p:[px, py], ende:null };
        fade.strokes.push(fade.currentStroke);
        if (!fade.raf) fade.raf = requestAnimationFrame(fadeStep);
      }
      function appendFadePoint(px, py){ if (fade.currentStroke) fade.currentStroke.p.push(px, py); }
      function endFadeStroke(){
        if (fade.currentStroke){ fade.currentStroke.ende = timestampMs(); fade.currentStroke = null; }
        if (!fade.raf && fade.ctx) fade.raf = requestAnimationFrame(fadeStep);
      }
      var lastX = 0, lastY = 0, activePtr = null;  // Only the primary pointer draws; ignore additional touches

      /* Vector annotation model: each slide and the independent whiteboard own their strokes. Points and widths are viewport-relative so strokes scale on resize. Undo/Redo stores snapshots with immutable completed-stroke references. */
      var annots = new Map();
      var boardLayer = newLayer();
      var wb = { on:false, el:null, before:-1, beforeEraser:false }, wbBtn = null;
      var activeStroke = null, erasing = false;
      var storageKey = 'reveal-touchcontrols-v1:' + window.location.pathname;
      function newLayer(){ return { strokes:[], undo:[], redo:[] }; }
      function currentSlide(){ return deck.getCurrentSlide ? deck.getCurrentSlide() : null; }
      function layerFor(slide){
        if (!slide) return newLayer();
        if (!annots.has(slide)) annots.set(slide, newLayer());
        return annots.get(slide);
      }
      function activeLayer(){ return wb.on ? boardLayer : layerFor(currentSlide()); }
      function slideNumber(slide){
        return Array.prototype.indexOf.call(d.querySelectorAll('.reveal .slides section'), slide);
      }
      function validStroke(st){
        return st && isInkColor(st.color) &&
          Number.isFinite(st.width) && st.width > 0 && st.width < 0.2 &&
          Array.isArray(st.points) && st.points.length <= 50000 && st.points.every(function(pt){
            return Array.isArray(pt) && pt.length === 2 && pt.every(function(v){ return Number.isFinite(v) && v > -2 && v < 3; });
          });
      }
      function restoreStorage(){
        if (!o.persistAnnotations) return;
        try {
          var saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
          if (!saved || saved.version !== 1) return;
          var sections = d.querySelectorAll('.reveal .slides section');
          (saved.slides || []).forEach(function(pair){
            if (!Array.isArray(pair) || !sections[pair[0]] || !Array.isArray(pair[1])) return;
            layerFor(sections[pair[0]]).strokes = pair[1].filter(validStroke).slice(0, 10000);
          });
          if (o.keepWhiteboard && Array.isArray(saved.board)) boardLayer.strokes = saved.board.filter(validStroke).slice(0, 10000);
        } catch (_) { /* privacy settings can block localStorage */ }
      }
      function saveStorage(){
        if (!o.persistAnnotations) return;
        try {
          var slides = [];
          annots.forEach(function(layer, slide){
            var n = slideNumber(slide);
            if (n >= 0 && layer.strokes.length) slides.push([n, layer.strokes]);
          });
          localStorage.setItem(storageKey, JSON.stringify({version:1, slides:slides, board:o.keepWhiteboard ? boardLayer.strokes : []}));
        } catch (_) { /* quota exceeded: drawing remains available in memory */ }
      }
      restoreStorage();
      function checkpoint(layer){
        layer.undo.push(layer.strokes.slice());
        if (layer.undo.length > o.historyLimit) layer.undo.shift();
        layer.redo = [];
        updateHistory();
      }
      function updateHistory(){
        if (undoBtn) undoBtn.disabled = !activeLayer().undo.length;
        if (redoBtn) redoBtn.disabled = !activeLayer().redo.length;
        refreshControls();
      }
      function undo(){
        var layer = activeLayer(); if (!layer.undo.length) return;
        layer.redo.push(layer.strokes.slice());
        layer.strokes = layer.undo.pop();
        renderAnnotations(); saveStorage(); updateHistory();
      }
      function redo(){
        var layer = activeLayer(); if (!layer.redo.length) return;
        layer.undo.push(layer.strokes.slice());
        layer.strokes = layer.redo.pop();
        renderAnnotations(); saveStorage(); updateHistory();
      }
      function relPoint(x, y){ return [x / window.innerWidth, y / window.innerHeight]; }
      function slideRect(){
        var el=deck.getSlidesElement ? deck.getSlidesElement() : currentSlide(), r=el && el.getBoundingClientRect();
        if(!r || !r.width || !r.height) return [0,0,1,1];
        return [r.left/window.innerWidth,r.top/window.innerHeight,r.width/window.innerWidth,r.height/window.innerHeight];
      }
      function printSnapshot(){
        var result=[];
        annots.forEach(function(layer,slide){
          var index=slideNumber(slide);
          if(index>=0 && layer.strokes.length){
            var fallback=slideRect();
            result.push([index,layer.strokes.map(function(st){
              return {color:st.color,width:st.width,points:st.points,rect:st.rect||fallback};
            })]);
          }
        });
        return result;
      }
      function paintStroke(ctx, st, w, h){
        if (!st.points.length) return;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = st.color;
        ctx.lineWidth = Math.max(1, st.width * Math.min(w, h));
        ctx.beginPath();
        ctx.moveTo(st.points[0][0] * w, st.points[0][1] * h);
        if (st.points.length === 1){
          ctx.lineTo(st.points[0][0] * w + 0.01, st.points[0][1] * h);
        } else {
          for (var i=1; i<st.points.length; i++) ctx.lineTo(st.points[i][0] * w, st.points[i][1] * h);
        }
        ctx.stroke();
      }
      function paintLayer(ctx, layer, w, h){
        layer.strokes.forEach(function(st){ paintStroke(ctx, st, w, h); });
      }
      function renderAnnotations(){
        if (!pen.ctx) return;
        var x = pen.ctx, w = window.innerWidth, h = window.innerHeight;
        x.save(); x.setTransform(1,0,0,1,0,0);
        x.clearRect(0,0,pen.canvas.width,pen.canvas.height);
        x.restore();
        paintLayer(x, activeLayer(), w, h);
      }
      function sizeCanvas(){
        if (!pen.canvas) return;
        var dpr = window.devicePixelRatio || 1, cv = pen.canvas;
        cv.width = Math.round(window.innerWidth * dpr);
        cv.height = Math.round(window.innerHeight * dpr);
        cv.style.width = window.innerWidth + 'px';
        cv.style.height = window.innerHeight + 'px';
        pen.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderAnnotations();
      }
      function distanceSq(px,py,x1,y1,x2,y2){
        var dx=x2-x1, dy=y2-y1, t=(dx*dx+dy*dy) ? Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy))) : 0;
        return Math.pow(px-(x1+t*dx),2)+Math.pow(py-(y1+t*dy),2);
      }
      function strokeHit(st, px, py){
        var w=window.innerWidth, h=window.innerHeight, pts=st.points;
        if (!pts.length) return false;
        var r = o.eraserRadius + st.width * Math.min(w,h) * .5;
        if (pts.length===1) return distanceSq(px,py,pts[0][0]*w,pts[0][1]*h,pts[0][0]*w,pts[0][1]*h)<r*r;
        for(var i=1;i<pts.length;i++){
          if(distanceSq(px,py,pts[i-1][0]*w,pts[i-1][1]*h,pts[i][0]*w,pts[i][1]*h)<r*r)return true;
        }
        return false;
      }
      function eraseAt(px,py){
        var layer=activeLayer();
        var remaining=layer.strokes.filter(function(st){ return !strokeHit(st,px,py); });
        if (remaining.length === layer.strokes.length) return;
        if (!erasing){ checkpoint(layer); erasing=true; }
        layer.strokes=remaining;
        renderAnnotations(); updateHistory();
      }
      function ensureCanvas(){
        if (pen.canvas) return;
        var cv=d.createElement('canvas');
        cv.className='touchcontrols-annot';
        pen.ctx=cv.getContext('2d'); pen.canvas=cv;
        sizeCanvas();
        listen(cv, 'pointerdown', function(e){
          if ((!pen.on && !eraser.on) || !e.isPrimary || activePtr !== null) return;
          activePtr=e.pointerId;
          if(cv.setPointerCapture){ try{cv.setPointerCapture(e.pointerId);}catch(_){} }
          pen.drawing=true; lastX=e.clientX; lastY=e.clientY;
          if(eraser.on) eraseAt(lastX,lastY);
          else if(isFadingInk()) fadeStart(lastX,lastY);
          else {
            var layer=activeLayer(); checkpoint(layer);
            activeStroke={color:currentInk,width:o.penWidth/Math.min(window.innerWidth,window.innerHeight),rect:slideRect(),points:[relPoint(lastX,lastY)]};
            layer.strokes.push(activeStroke);
            paintStroke(pen.ctx,activeStroke,window.innerWidth,window.innerHeight);
          }
          e.preventDefault(); e.stopPropagation();
        });
        listen(cv, 'pointermove', function(e){
          if(!pen.drawing || e.pointerId !== activePtr) return;
          var evs=(e.getCoalescedEvents && e.getCoalescedEvents()) || [];
          if(!evs.length) evs=[e];
          if(eraser.on){
            evs.forEach(function(ev){ eraseAt(ev.clientX,ev.clientY); });
          } else if(isFadingInk()){
            evs.forEach(function(ev){ appendFadePoint(ev.clientX,ev.clientY); });
          } else if(activeStroke){
            var x=pen.ctx;
            x.lineWidth=activeStroke.width*Math.min(window.innerWidth,window.innerHeight);
            x.strokeStyle=activeStroke.color; x.lineCap='round'; x.lineJoin='round';
            x.beginPath(); x.moveTo(lastX,lastY);
            evs.forEach(function(ev){
              x.lineTo(ev.clientX,ev.clientY);
              activeStroke.points.push(relPoint(ev.clientX,ev.clientY));
              lastX=ev.clientX; lastY=ev.clientY;
            });
            x.stroke();
          }
          e.preventDefault(); e.stopPropagation();
        });
        function endStroke(e){
          if(e.pointerId !== activePtr) return;
          pen.drawing=false; activePtr=null;
          if(isFadingInk()) endFadeStroke();
          else { activeStroke=null; erasing=false; saveStorage(); updateHistory(); }
        }
        listen(cv,'pointerup',endStroke);
        listen(cv,'pointercancel',endStroke);
        listen(cv,'lostpointercapture',endStroke);
        listen(cv,'contextmenu',function(e){ e.preventDefault(); });
        listen(window,'resize',sizeCanvas);
        host.appendChild(cv);
      }
      function clearAnnot(){
        var layer=activeLayer();
        if(layer.strokes.length){ checkpoint(layer); layer.strokes=[]; }
        clearFade(); renderAnnotations(); saveStorage(); updateHistory();
      }
      function applyPen(){
        ensureCanvas();
        pen.on=penState>=0 && !eraser.on;
        if(penState>=0) currentInk=isFadingInk() ? o.fadeInk : o.inks[penState];
        if(isFadingInk() && !eraser.on) ensureFade();
        if(penBtn){
          penBtn.classList.toggle('active',pen.on);
          penBtn.setAttribute('aria-pressed',String(pen.on));
          penBtn.style.borderColor=pen.on?currentInk:'';
          penBtn.style.color=pen.on?currentInk:'';
          penBtn.style.borderStyle=pen.on && isFadingInk()?'dotted':'';
          var inkLabel = penState<0?'off':isFadingInk()?'fading ink':penState===0?'red ink':penState===1?'blue ink':'ink '+(penState+1);
          penBtn.title='Pen: '+inkLabel+' (tap to cycle colors, fading ink and off; hold for settings)';
        }
        if(eraserBtn){eraserBtn.classList.toggle('active',eraser.on);eraserBtn.setAttribute('aria-pressed',String(eraser.on));}
        pen.canvas.style.pointerEvents=(pen.on || eraser.on)?'auto':'none';
        pen.canvas.classList.toggle('on',pen.on || eraser.on);
        pen.canvas.style.cursor=eraser.on?'crosshair':pen.on?penCursor(currentInk):'';
        refreshControls();
        activity();
      }
      function penTap(){
        closePanels();
        if(zoom.on || zoom.armed) resetZoom();
        // Restore the classic one-button cycle: red -> blue -> fading -> off.
        // Custom ink arrays are supported, with fading ink as the last mode.
        if(eraser.on){ eraser.on=false;penState=selectedPenState; }
        else penState++;
        var last=o.fadePen?o.inks.length:o.inks.length-1;
        if(penState>last) penState=-1;
        if(penState>=0) selectedPenState=penState;
        if(!isFadingInk()) clearFade();
        applyPen();
      }
      function selectPen(state){
        selectedPenState=state;
        eraser.on=false;penState=state;
        if(zoom.on || zoom.armed)resetZoom();
        clearFade();closePanels();applyPen();
      }
      function eraserTap(){
        closePanels();
        if(zoom.on || zoom.armed) resetZoom();
        eraser.on=!eraser.on;
        if(eraser.on){ penState=-1; clearFade(); }
        applyPen();
      }
      function ensureBoard(){
        if(wb.el) return;
        wb.el=d.createElement('div'); wb.el.className='touchcontrols-board'; host.appendChild(wb.el);
      }
      function setBoard(on){
        ensureBoard(); if(wb.on===on) return;
        if(on){
          wb.before=penState; wb.beforeEraser=eraser.on;
          wb.on=true; eraser.on=false; penState=0;
        } else {
          wb.on=false; eraser.on=wb.beforeEraser; penState=wb.before;
          if(!o.keepWhiteboard){ boardLayer=newLayer(); }
        }
        wb.el.classList.toggle('on',on);
        bar.classList.toggle('wb-on',on);
        if(wbBtn){ wbBtn.classList.toggle('active',on); wbBtn.setAttribute('aria-pressed',String(on)); }
        clearFade(); renderAnnotations(); applyPen(); updateHistory();
      }
      function board(){
        closePanels();
        if(zoom.on || zoom.armed) resetZoom();
        setBoard(!wb.on);
      }
      function exportPNG(){
        ensureCanvas();
        var w=window.innerWidth,h=window.innerHeight,dpr=window.devicePixelRatio||1;
        var cv=d.createElement('canvas'); cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
        var ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
        if(wb.on){ ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h); }
        paintLayer(ctx,activeLayer(),w,h);
        var slide=slideNumber(currentSlide());
        var filename=wb.on?'touchcontrols-whiteboard.png':'touchcontrols-slide-'+(slide+1)+'.png';
        function download(blob){
          if(!blob) return;
          var url=URL.createObjectURL(blob),a=d.createElement('a');
          a.href=url; a.download=filename; d.body.appendChild(a); a.click(); a.remove();
          setTimeout(function(){ URL.revokeObjectURL(url); },1000);
        }
        if(cv.toBlob) cv.toBlob(download,'image/png');
        else { var a=d.createElement('a');a.download=filename;a.href=cv.toDataURL('image/png');d.body.appendChild(a);a.click();a.remove(); }
      }
      function onUndoKey(ev){
        if(!(ev.ctrlKey || ev.metaKey) || ev.altKey || ev.key.toLowerCase()!=='z') return;
        if(!(pen.on || eraser.on || wb.on)) return;
        var el=ev.target;
        if(el && el.closest && el.closest('input,textarea,[contenteditable="true"]')) return;
        ev.preventDefault(); ev.stopPropagation();
        if(ev.shiftKey) redo(); else undo();
      }
      listen(d,'keydown',onUndoKey,true);

      /* Countdown is based on wall-clock time, not on setInterval ticks. */
      var timer = {idx:-1,left:0,iv:null,chip:null,done:false,paused:false,endsAt:0,currentMinutes:0}, timerBtn = null;
      function two(n){return (n<10?'0':'')+n;}
      function ensureChip(){
        if(timer.chip)return;
        var el=d.createElement('div');
        el.className='touchcontrols-timer';
        el.setAttribute('role','button'); el.tabIndex=0;
        el.title='Pause or resume timer';
        listen(el,'click',toggleTimerPause);
        listen(el,'keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();toggleTimerPause();}});
        host.appendChild(el); timer.chip=el;
      }
      function paintTimer(){
        ensureChip();
        if(timer.idx<0){timer.chip.classList.remove('on','done','paused');if(timerBtn){timerBtn.classList.remove('active');timerBtn.setAttribute('aria-pressed','false');}return;}
        timer.chip.textContent=Math.floor(timer.left/60)+':'+two(timer.left%60)+(timer.paused?' ‖':'');
        timer.chip.setAttribute('aria-label','Countdown '+Math.floor(timer.left/60)+' minutes '+(timer.left%60)+' seconds'+(timer.paused?' paused':''));
        timer.chip.classList.add('on');
        timer.chip.classList.toggle('done',timer.done);
        timer.chip.classList.toggle('paused',timer.paused);
        placeTimer();
        if(timerBtn){timerBtn.classList.add('active');timerBtn.setAttribute('aria-pressed','true');}
      }
      function tickTimer(){
        if(timer.idx<0 || timer.paused || timer.done)return;
        timer.left=Math.max(0,Math.ceil((timer.endsAt-Date.now())/1000));
        if(timer.left===0){timer.done=true;clearInterval(timer.iv);timer.iv=null;}
        paintTimer();
      }
      function stopTimer(){
        if(timer.iv)clearInterval(timer.iv);
        timer.iv=null; timer.idx=-1;timer.left=0;timer.done=false;timer.paused=false;timer.currentMinutes=0;
        paintTimer();
      }
      function startTimer(minutes,idx){
        if(timer.iv)clearInterval(timer.iv);
        timer.idx=idx;timer.currentMinutes=minutes;timer.left=Math.max(1,Math.round(minutes*60));timer.done=false;timer.paused=false;
        timer.endsAt=Date.now()+timer.left*1000;
        timer.iv=setInterval(tickTimer,250);
        paintTimer();
      }
      function toggleTimerPause(){
        if(timer.idx<0||timer.done)return;
        tickTimer();
        if(timer.done)return;
        timer.paused=!timer.paused;
        if(!timer.paused)timer.endsAt=Date.now()+timer.left*1000;
        paintTimer();
      }
      function timerTap(){
        closePanels();activity();
        // Classic compact timer: tap to cycle preset durations, then stop.
        if(timer.done){stopTimer();return;}
        var next=timer.idx+1;
        if(next>=o.timerMinutes.length){stopTimer();return;}
        startTimer(o.timerMinutes[next],next);
      }
      function customTimer(){
        var raw=window.prompt('Timer duration in minutes (e.g. 2.5):','5');
        if(raw===null)return;
        var min=Number(raw.replace(',','.'));
        if(!Number.isFinite(min)||min<=0||min>1440)return;
        startTimer(min,o.timerMinutes.length);
        closePanels();
      }

      /* Focus tool: the default magnifies a circular, movable copy of the actual
         slide and saved annotations. 'spot', 'both', and 'zoom' remain available. */
      var zoom = { armed:false, on:false, el:null, stage:0, spot:null, lens:null, scene:null, x:0, y:0,
        originalStyle:null, mirrorObserver:null, mirrorFrame:0, animationFrame:0,
        canvasTimer:0, mirrorPairs:null, sourceCanvasPairs:[] }, focusBtn = null;
      var drag = { active:false, moved:false, x:0, y:0, id:null };
      var pts = {}, pinch = { active:false, live:false, d0:0, r0:0 };   // Two fingers resize the spotlight
      var radius = o.spotRadius;
      var SKIP = '.touchcontrols, .controls';   // Keep toolbar and Reveal navigation interactive

      function setRadius(r){
        radius = Math.max(40, Math.min(420, r));
        if (zoom.spot) zoom.spot.style.width = zoom.spot.style.height = (radius * 2) + 'px';
        if (zoom.lens && o.lupeMode === 'magnifier') moveSpot(zoom.x, zoom.y);
      }
      function pinchDist(){
        var k = Object.keys(pts);
        if (k.length < 2) return 0;
        var a = pts[k[0]], b = pts[k[1]];
        return Math.sqrt((b.x-a.x)*(b.x-a.x) + (b.y-a.y)*(b.y-a.y));
      }

      function targetEl(){ var s = deck.getCurrentSlide(); return s ? (s.querySelector('.cardslide') || s) : null; }

      function ensureSpot(){
        if (zoom.spot) return;
        var el = d.createElement('div');
        el.className = 'touchcontrols-spot';
        host.appendChild(el);
        zoom.spot = el;
      }
      /* The lens may move independently of its sampled slide point. At an edge
         it stays entirely onscreen while still magnifying the touched content. */
      function lensRadius(){
        var pad=6;
        return Math.min(radius,Math.max(1,(window.innerWidth-2*pad)/2),
          Math.max(1,(window.innerHeight-2*pad)/2));
      }
      function stopMirrorUpdates(){
        if(zoom.mirrorObserver){zoom.mirrorObserver.disconnect();zoom.mirrorObserver=null;}
        if(zoom.mirrorFrame){cancelAnimationFrame(zoom.mirrorFrame);zoom.mirrorFrame=0;}
        if(zoom.animationFrame){cancelAnimationFrame(zoom.animationFrame);zoom.animationFrame=0;}
        if(zoom.canvasTimer){clearInterval(zoom.canvasTimer);zoom.canvasTimer=0;}
        zoom.mirrorPairs=null;zoom.sourceCanvasPairs=[];
      }
      function scheduleMirrorUpdate(){
        if(!zoom.lens || o.lupeMode!=='magnifier' || zoom.mirrorFrame)return;
        zoom.mirrorFrame=requestAnimationFrame(function(){
          zoom.mirrorFrame=0;
          if(!zoom.lens || !zoom.el)return;
          buildMagnifier();
          moveSpot(zoom.x,zoom.y);
        });
      }
      /* Keep CSS animations and transitions aligned with their live originals.
         Avoid repeatedly cloning during animation: doing so would restart it. */
      function syncLiveAnimations(){
        zoom.animationFrame=0;
        if(!zoom.lens || !zoom.el || !zoom.mirrorPairs)return;
        var original=zoom.el.closest('section')||zoom.el;
        if(!original.getAnimations)return;
        var animations=original.getAnimations({subtree:true});
        var running=false;
        animations.forEach(function(animation){
          if(animation.playState!=='running' || !animation.effect)return;
          var source=animation.effect.target;
          var target=zoom.mirrorPairs.get(source);
          if(!target || source===original || !target.isConnected)return;
          var css=getComputedStyle(source);
          ['transform','opacity','filter'].forEach(function(prop){target.style.setProperty(prop,css[prop],'important');});
          running=true;
        });
        if(running)zoom.animationFrame=requestAnimationFrame(syncLiveAnimations);
      }
      function startLiveAnimations(){
        if(zoom.lens && !zoom.animationFrame)
          zoom.animationFrame=requestAnimationFrame(syncLiveAnimations);
      }
      function refreshLiveCanvases(){
        if(!zoom.lens)return;
        zoom.sourceCanvasPairs.forEach(function(pair){
          var source=pair[0],target=pair[1];
          if(!source.isConnected || !target.isConnected)return;
          try{
            if(source.width!==target.width)target.width=source.width;
            if(source.height!==target.height)target.height=source.height;
            var ctx=target.getContext('2d');if(ctx){ctx.clearRect(0,0,target.width,target.height);ctx.drawImage(source,0,0);}
          }catch(_){}
        });
      }
      function watchMagnifier(){
        if(!zoom.lens || !zoom.el)return;
        var original=zoom.el.closest('section')||zoom.el;
        if(window.MutationObserver){
          zoom.mirrorObserver=new MutationObserver(scheduleMirrorUpdate);
          zoom.mirrorObserver.observe(original,{subtree:true,childList:true,characterData:true,attributes:true});
          var bg=host.querySelector('.backgrounds .slide-background.present');
          if(bg)zoom.mirrorObserver.observe(bg,{subtree:true,childList:true,characterData:true,attributes:true});
        }
      }
      /* A Reveal slide can be transparent even when the presentation looks
         opaque because its white/colored background belongs to body or an
         ancestor. The lens must paint a fully opaque foundation before drawing
         the mirrored background/slide/ink; otherwise the original, small text
         shows through the enlarged copy. Blend ancestor background colors over
         the browser's white page canvas and keep the result fully opaque. */
      function magnifierBackdrop(){
        var rgb=[255,255,255];
        [d.documentElement,d.body,host].forEach(function(el){
          if(!el)return;
          var value=getComputedStyle(el).backgroundColor;
          var match=value&&value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
          if(!match)return;
          var alpha=match[4]===undefined?1:Math.max(0,Math.min(1,Number(match[4])));
          for(var i=0;i<3;i++)rgb[i]=Math.round(Number(match[i+1])*alpha+rgb[i]*(1-alpha));
        });
        return 'rgb('+rgb.join(', ')+')';
      }
      function magnifierInk(scene){
        var canvas=d.createElement('canvas'), w=window.innerWidth, h=window.innerHeight;
        var dpr=window.devicePixelRatio || 1;
        canvas.className='touchcontrols-lens-ink';
        canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
        canvas.style.width=w+'px';canvas.style.height=h+'px';
        var ctx=canvas.getContext('2d');
        if (ctx){ctx.setTransform(dpr,0,0,dpr,0,0);paintLayer(ctx,activeLayer(),w,h);}
        scene.appendChild(canvas);
      }
      function buildMagnifier(){
        if(!zoom.el)return;
        if(!zoom.lens){
          zoom.lens=d.createElement('div');
          zoom.lens.className='touchcontrols-magnifier';
          zoom.lens.setAttribute('aria-hidden','true');
          host.appendChild(zoom.lens);
        }
        zoom.lens.replaceChildren();
        var scene=d.createElement('div');scene.className='touchcontrols-lens-scene';
        /* Both layers need an opaque fill: scene covers the mirrored viewport,
           lens covers any edges where the zoom samples outside that viewport. */
        var backdrop=magnifierBackdrop();
        zoom.lens.style.backgroundColor=backdrop;
        scene.style.backgroundColor=backdrop;
        scene.style.width=window.innerWidth+'px';scene.style.height=window.innerHeight+'px';
        zoom.scene=scene;
        // Reveal renders slide backgrounds separately from the section markup.
        // Mirror the visible background, then the section, then annotations.
        var sourceBG=host.querySelector('.backgrounds .slide-background.present');
        var bg=d.createElement('div');
        bg.style.cssText='position:absolute;inset:0;pointer-events:none';
        bg.style.width=window.innerWidth+'px';bg.style.height=window.innerHeight+'px';
        if(sourceBG){
          var style=getComputedStyle(sourceBG);
          ['backgroundColor','backgroundImage','backgroundPosition','backgroundSize','backgroundRepeat'].forEach(function(k){bg.style[k]=style[k];});
          var inner=sourceBG.querySelector('.slide-background-content');
          if(inner){
            var st=getComputedStyle(inner);
            ['backgroundColor','backgroundImage','backgroundPosition','backgroundSize','backgroundRepeat'].forEach(function(k){if(st[k] && st[k]!=='none' && st[k]!=='rgba(0, 0, 0, 0)')bg.style[k]=st[k];});
          }
        }else{
          bg.style.backgroundColor=getComputedStyle(host).backgroundColor;
        }
        scene.appendChild(bg);
        var slides=d.createElement('div');slides.className='slides touchcontrols-lens-slides';
        slides.style.width=window.innerWidth+'px';slides.style.height=window.innerHeight+'px';
        var original=zoom.el.closest('section') || zoom.el;
        var rect=original.getBoundingClientRect();
        var copy=original.cloneNode(true);
        /* Keep an element-to-element mapping before removing embedded media.
           Running CSS animations can then reuse the original computed values. */
        var sourceNodes=[original].concat(Array.from(original.querySelectorAll('*')));
        var mirrorNodes=[copy].concat(Array.from(copy.querySelectorAll('*')));
        zoom.mirrorPairs=new Map();
        sourceNodes.forEach(function(source,i){zoom.mirrorPairs.set(source,mirrorNodes[i]);});
        copy.classList.add('touchcontrols-lens-slide','present');
        copy.classList.remove('past','future');
        // Cloned interactive media must not replay, navigate or duplicate iframe
        // downloads. Static images, text, formulae, tables and SVG are mirrored.
        copy.querySelectorAll('script, iframe, audio, video').forEach(function(el){el.remove();});
        copy.style.setProperty('position','absolute','important');
        copy.style.setProperty('display','block','important');
        copy.style.setProperty('visibility','visible','important');
        copy.style.setProperty('opacity','1','important');
        copy.style.left=rect.left+'px';copy.style.top=rect.top+'px';
        copy.style.width=original.offsetWidth+'px';copy.style.height=original.offsetHeight+'px';
        copy.style.margin='0';copy.style.transformOrigin='0 0';
        copy.style.transform='scale('+rect.width/Math.max(original.offsetWidth,1)+','+rect.height/Math.max(original.offsetHeight,1)+')';
        slides.appendChild(copy);scene.appendChild(slides);
        // Canvas pixel buffers are not copied by cloneNode(). Mirror embedded
        // static canvases too, so charts and drawings remain visible.
        var oldCanvases=original.querySelectorAll('canvas');
        var newCanvases=copy.querySelectorAll('canvas');
        zoom.sourceCanvasPairs=[];
        oldCanvases.forEach(function(old,i){
          var target=newCanvases[i];if(!target)return;
          zoom.sourceCanvasPairs.push([old,target]);
        });
        magnifierInk(scene);
        zoom.lens.appendChild(scene);
        refreshLiveCanvases();
        // Only poll if the slide contains actual canvas-based live content.
        if(zoom.canvasTimer){clearInterval(zoom.canvasTimer);zoom.canvasTimer=0;}
        if(zoom.sourceCanvasPairs.length)zoom.canvasTimer=setInterval(refreshLiveCanvases,120);
        startLiveAnimations();
      }
      function moveSpot(x, y){
        if(o.lupeMode==='magnifier'){
          // Store the sampled coordinates separately from the lens position:
          // moving near an edge must not change which content is magnified.
          zoom.x=Math.max(0,Math.min(window.innerWidth,x));
          zoom.y=Math.max(0,Math.min(window.innerHeight,y));
          if(!zoom.lens)return;
          var r=lensRadius(), diameter=r*2, scale=Math.max(1.1,Math.min(5,Number(o.zoomScale)||2));
          var cx=Math.max(r,Math.min(window.innerWidth-r,zoom.x));
          var cy=Math.max(r,Math.min(window.innerHeight-r,zoom.y));
          zoom.lens.style.left=(cx-r)+'px';zoom.lens.style.top=(cy-r)+'px';
          zoom.lens.style.width=diameter+'px';zoom.lens.style.height=diameter+'px';
          if(zoom.scene)zoom.scene.style.transform='translate('+(r-scale*zoom.x)+'px,'+(r-scale*zoom.y)+'px) scale('+scale+')';
          return;
        }
        zoom.x=x;zoom.y=y;
        ensureSpot();
        zoom.spot.style.left=x+'px';zoom.spot.style.top=y+'px';
        zoom.spot.style.width=zoom.spot.style.height=(radius*2)+'px';
      }
      /* Zoom around a screen point by placing transformOrigin exactly there; the highlighted point stays in place. */
      function applyZoom(x, y){
        var r = zoom.el.getBoundingClientRect();
        var px = Math.max(0, Math.min(100, ((x - r.left)/r.width)*100));
        var py = Math.max(0, Math.min(100, ((y - r.top)/r.height)*100));
        if(!zoom.originalStyle){zoom.originalStyle={transform:zoom.el.style.transform,transformOrigin:zoom.el.style.transformOrigin,transition:zoom.el.style.transition,willChange:zoom.el.style.willChange};}
        zoom.el.style.willChange = 'transform';
        zoom.el.style.transition = 'transform .42s cubic-bezier(.22,.61,.36,1)';
        zoom.el.style.transformOrigin = px + '% ' + py + '%';
        zoom.el.style.transform = 'scale(' + o.zoomScale + ')';
      }
      function resetZoom(){
        stopMirrorUpdates();
        if(zoom.el && zoom.originalStyle){
          Object.keys(zoom.originalStyle).forEach(function(k){zoom.el.style[k]=zoom.originalStyle[k];});
        }
        zoom.originalStyle=null;
        if(zoom.lens){zoom.lens.remove();zoom.lens=null;zoom.scene=null;}
        if (zoom.spot) zoom.spot.classList.remove('on', 'zoomed');
        zoom.on = false; zoom.armed = false; zoom.el = null; zoom.stage = 0;
        drag.active = false; drag.moved = false;
        pts = {}; pinch.active = false;
        radius = o.spotRadius;                          // Reset the radius for the next focus interaction
        host.classList.remove('tc-focus');
        if (focusBtn){focusBtn.classList.remove('active');focusBtn.setAttribute('aria-pressed','false');}
        d.removeEventListener('pointerdown', onDown, true);
        d.removeEventListener('pointermove', onMove, true);
        d.removeEventListener('pointerup', onUp, true);
        d.removeEventListener('pointercancel', onCancel, true);
        d.removeEventListener('click', swallow, true);
        d.removeEventListener('keydown', onKey, true);
        d.removeEventListener('wheel', onWheel, { capture:true });
        refreshControls();
      }
      /* Advance to the next focus stage. */
      function advance(x, y){
        if(o.lupeMode==='magnifier'){moveSpot(x,y);return;}
        if (o.lupeMode === 'zoom'){                       // Zoom-only legacy behavior
          if (zoom.stage === 0){ applyZoom(x, y); zoom.stage = 1; zoom.on = true; zoom.armed = false; }
          else resetZoom();
          return;
        }
        if (zoom.stage === 0){                            // Stage 1: spotlight
          moveSpot(x, y);
          ensureSpot(); zoom.spot.classList.add('on');
          zoom.stage = 1; zoom.on = true; zoom.armed = false;
          return;
        }
        if (zoom.stage === 1 && o.lupeMode === 'both'){   // Stage 2: zoom into the selected point
          applyZoom(zoom.x, zoom.y);
          zoom.spot.classList.add('zoomed');              // Reduce dimming, since the zoom provides focus
          zoom.stage = 2;
          return;
        }
        resetZoom();
      }
      /* Tap to advance; drag to move the spotlight in its first stage. */
      function onDown(ev){
        if (ev.target.closest && ev.target.closest(SKIP)) return;
        if (!zoom.el){ resetZoom(); return; }
        pts[ev.pointerId] = { x:ev.clientX, y:ev.clientY };
        if (Object.keys(pts).length === 2){              // Second finger switches from moving to resizing
          pinch.active = true; pinch.live = false;       // Do not activate until the fingers move apart
          pinch.d0 = pinchDist(); pinch.r0 = radius;
          drag.active = false;
        } else {
          drag.active = true; drag.moved = false;
          drag.x = ev.clientX; drag.y = ev.clientY; drag.id = ev.pointerId;
        }
        ev.preventDefault(); ev.stopPropagation();
      }
      function onMove(ev){
        if (pts[ev.pointerId]){ pts[ev.pointerId].x = ev.clientX; pts[ev.pointerId].y = ev.clientY; }
        if (pinch.active){
          var dNow = pinchDist();
          /* Require 24 px of pinch movement before resizing so a resting palm cannot move the spotlight. */
          if (!pinch.live && Math.abs(dNow - pinch.d0) > 24) pinch.live = true;
          if (pinch.live && pinch.d0 > 0 && dNow > 0) setRadius(pinch.r0 * (dNow / pinch.d0));
          ev.preventDefault(); ev.stopPropagation();
          return;
        }
        if (!drag.active || ev.pointerId !== drag.id) return;
        if (!drag.moved){
          var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
          if (dx*dx + dy*dy < 100) return;                // Treat movement as a drag only after a 10 px threshold
          drag.moved = true;
        }
        if (zoom.stage === 1 && o.lupeMode !== 'zoom') moveSpot(ev.clientX, ev.clientY);
        ev.preventDefault(); ev.stopPropagation();
      }
      function onUp(ev){
        delete pts[ev.pointerId];
        if (pinch.active){                                // End pinch without advancing the focus stage
          if (Object.keys(pts).length < 2){ pinch.active = false; pinch.live = false; drag.active = false; }
          ev.preventDefault(); ev.stopPropagation();
          return;
        }
        if (!drag.active || ev.pointerId !== drag.id) return;
        drag.active = false;
        if (!drag.moved) advance(ev.clientX, ev.clientY);
        ev.preventDefault(); ev.stopPropagation();
      }
      /* Cancelled system gestures only clean up interaction state; they do not advance focus stages. */
      function onCancel(ev){
        delete pts[ev.pointerId];
        if (Object.keys(pts).length < 2){ pinch.active = false; pinch.live = false; }
        if (drag.id === ev.pointerId){ drag.active = false; drag.moved = false; }
      }
      // A resize changes Reveal's scale and the viewport-relative ink coordinates.
      // Rebuild the mirror, without changing the active tool or lens position.
      listen(window,'resize',function(){
        if(zoom.on && o.lupeMode==='magnifier'){
          scheduleMirrorUpdate();
          moveSpot(zoom.x,zoom.y);
        }
      });
      /* Reveal fragments and runtime edits should be reflected without toggling
         focus. MutationObserver also catches asynchronously inserted content. */
      ['fragmentshown','fragmenthidden'].forEach(function(event){
        deckListen(event,scheduleMirrorUpdate);
      });
      listen(d,'animationstart',function(ev){
        if(zoom.on && zoom.el && zoom.el.contains(ev.target)){
          scheduleMirrorUpdate();startLiveAnimations();
        }
      },true);
      listen(d,'transitionrun',function(ev){
        if(zoom.on && zoom.el && zoom.el.contains(ev.target)){
          scheduleMirrorUpdate();startLiveAnimations();
        }
      },true);
      ['animationend','animationcancel','transitionend','transitioncancel'].forEach(function(type){
        listen(d,type,function(ev){
          if(zoom.on && zoom.el && zoom.el.contains(ev.target))scheduleMirrorUpdate();
        },true);
      });
      /* Escape exits focus mode before Reveal can interpret it as the overview shortcut. */
      function onKey(ev){
        if (ev.key !== 'Escape' && ev.key !== 'Esc') return;
        if (!zoom.on && !zoom.armed) return;
        ev.preventDefault(); ev.stopPropagation();
        resetZoom();
      }
      /* Mouse wheel adjusts the circle radius, equivalent to a two-finger pinch. */
      function onWheel(ev){
        if (!zoom.on && !zoom.armed) return;
        if (ev.target.closest && ev.target.closest(SKIP)) return;
        ev.preventDefault(); ev.stopPropagation();
        setRadius(radius - (ev.deltaY > 0 ? 14 : -14));
      }
      function swallow(ev){                               // Prevent Reveal navigation during focus
        if (ev.target.closest && ev.target.closest(SKIP)) return;
        ev.preventDefault(); ev.stopPropagation();
      }
      function activateFocus(){
        closePanels();
        activity();
        if (zoom.on || zoom.armed){ resetZoom(); return; }
        if (wb.on) setBoard(false);                       // No need for spotlight on a whiteboard
        zoom.el = targetEl();
        if (!zoom.el) return;
        if (penState >= 0 || eraser.on){ penState = -1; eraser.on=false; applyPen(); }  // Pen and focus modes are mutually exclusive
        zoom.armed = true; zoom.stage = 0; radius = o.spotRadius;
        if(o.lupeMode==='magnifier'){
          buildMagnifier();
          zoom.stage=1;zoom.on=true;zoom.armed=false;
          moveSpot(window.innerWidth/2,window.innerHeight/2);
          watchMagnifier();
        }
        host.classList.add('tc-focus');   // Capture touch input for focus mode
        if(focusBtn){focusBtn.classList.add('active');focusBtn.setAttribute('aria-pressed','true');}
        d.addEventListener('pointerdown', onDown, true);
        d.addEventListener('pointermove', onMove, true);
        d.addEventListener('pointerup', onUp, true);
        d.addEventListener('pointercancel', onCancel, true);
        d.addEventListener('click', swallow, true);
        d.addEventListener('keydown', onKey, true);
        d.addEventListener('wheel', onWheel, { capture:true, passive:false });
        refreshControls();
      }

      /* Preserve slide layers, switch to their own strokes, never erase slide content
         when leaving the whiteboard. */
      deckListen('slidechanged', function(ev){
        var previous=(ev && ev.previousSlide)||null;
        if(wb.on)setBoard(false);
        if(!o.keepAnnotations && previous)annots.delete(previous);
        resetZoom(); clearFade(); renderAnnotations(); updateHistory(); saveStorage();
        if(menuOpen||panelMode)closePanels();
      });
      deckListen('overviewshown',function(){if(zoom.on||zoom.armed)resetZoom();});
      deckListen('paused',function(){if(zoom.on||zoom.armed)resetZoom();});

      function penTitle(){
        return 'Pen – tap to cycle colors, fading ink and off; hold for settings';
      }
      function focusTitle(){
        if(o.lupeMode==='magnifier')return 'Focus – magnifier: drag to move, pinch or scroll to resize, tap again to close';
        if(o.lupeMode==='zoom')return 'Magnifier – tap a point to zoom';
        if(o.lupeMode==='spot')return 'Spotlight – tap to focus, drag to move';
        return 'Focus – tap to highlight, tap again to zoom, drag to move';
      }

      var printWithInk=false;
      var ALL={
        pen:        {ic:ICON.pen, t:penTitle(),pen:true},
        eraser:     {ic:ICON.eraser,t:'Eraser – remove touched strokes',erase:true,fn:eraserTap},
        undo:       {ic:ICON.undo,t:'Undo (Ctrl+Z)',undo:true,fn:undo},
        redo:       {ic:ICON.redo,t:'Redo (Ctrl+Shift+Z)',redo:true,fn:redo},
        save:       {ic:ICON.save,t:'Export current annotations as PNG',fn:exportPNG},
        whiteboard: {ic:ICON.board,t:'Whiteboard – independent drawing surface',wb:true,fn:board},
        zoom:       {ic:ICON.zoom,t:focusTitle(),activateFocus:true,fn:activateFocus},
        timer:      {ic:ICON.timer,t:'Timer – tap to cycle preset durations and off; hold for a custom duration',tm:true,fn:timerTap},
        pause:      {ic:ICON.pause,t:'Blank screen',fn:function(){deck.togglePause();}},
        overview:   {ic:ICON.grid,t:'Slide overview',fn:function(){deck.toggleOverview();}},
        fullscreen: {ic:ICON.full,t:'Toggle fullscreen',fn:toggleFullscreen},
        print:      {ic:ICON.print,t:'Print slides',pr:true,fn:function(){openPrint(printWithInk?printSnapshot():null);}}
      };
      /* Contextual toolbar: primary controls stay available; drawing tools appear
         only when drawing/annotations are relevant; presentation actions live in
         the More menu. The flat layout stays available for existing configurations. */
      var printBtn = null, menuOpen = false, moreBtn = null, panelMode = null;
      var presentationStateBtns = Object.create(null);
      var mainGroup=d.createElement('div'); mainGroup.className='tc-group tc-main';
      var drawGroup=d.createElement('div'); drawGroup.className='tc-group tc-draw';
      var moreGroup=d.createElement('div'); moreGroup.className='tc-group tc-extra';
      var panelGroup=d.createElement('div'); panelGroup.className='tc-group tc-panel';
      mainGroup.setAttribute('role','group'); mainGroup.setAttribute('aria-label','Main tools');
      drawGroup.setAttribute('role','group'); drawGroup.setAttribute('aria-label','Drawing tools');
      moreGroup.setAttribute('role','group'); moreGroup.setAttribute('aria-label','More presentation controls');
      panelGroup.setAttribute('role','group'); panelGroup.setAttribute('aria-label','Tool options');
      var contextual = o.toolbarMode === 'contextual';
      var drawingKeys=['eraser','undo','redo','save'];
      var extraKeys=['overview','fullscreen'];
      var controlItems = o.buttons.filter(function(k){ return !!ALL[k]; });
      var hasDrawTrigger = controlItems.indexOf('pen')>=0 || controlItems.indexOf('whiteboard')>=0 || controlItems.indexOf('eraser')>=0;

      /* A hidden group is removed from the keyboard focus order as well as view. */
      function groupVisible(group, show){
        group.hidden = !show;
        group.setAttribute('aria-hidden',String(!show));
        group.querySelectorAll('button').forEach(function(b){ b.tabIndex = show && !bar.classList.contains('idle') ? 0 : -1; });
      }
      function placeTimer(){
        if(timer && timer.chip && bar.isConnected){
          timer.chip.style.bottom = Math.max(8,Math.ceil(window.innerHeight-bar.getBoundingClientRect().top+8))+'px';
        }
      }
      function refreshControls(){
        if(!bar.isConnected)return;
        if(!contextual){groupVisible(panelGroup,!!panelMode);placeTimer();return;}
        var history=activeLayer();
        var relevant=!zoom.on && !zoom.armed && (pen.on || eraser.on || wb.on || !!(history.strokes.length || history.undo.length || history.redo.length));
        groupVisible(drawGroup,hasDrawTrigger && relevant && !menuOpen && !panelMode && drawGroup.childElementCount>0);
        groupVisible(moreGroup,menuOpen && !panelMode && moreGroup.childElementCount>0);
        groupVisible(panelGroup,!!panelMode);
        if(moreBtn){
          moreBtn.classList.toggle('active',menuOpen);
          moreBtn.setAttribute('aria-expanded',String(menuOpen));
        }
        placeTimer();
      }
      function closePanels(){
        menuOpen=false;panelMode=null;
        refreshControls();
      }
      function createOption(label, action, options){
        var b=d.createElement('button');b.type='button';b.textContent=label;
        b.className='tc-text'+(options&&options.className?' '+options.className:'');
        b.setAttribute('aria-label',label);
        if(options&&options.action)b.setAttribute('data-tc-action',options.action);
        b.addEventListener('pointerdown',function(ev){ev.stopPropagation();});
        b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();action();});
        panelGroup.appendChild(b);return b;
      }
      function buildPanel(){
        panelGroup.replaceChildren();
        var label=d.createElement('span');label.className='tc-panel-label';
        label.textContent='Pen settings';
        panelGroup.appendChild(label);
        if(panelMode==='pen'){
          o.inks.forEach(function(color,i){
            var b=createOption('Color '+(i+1),function(){selectPen(i);},{action:'pen-color-'+i});
            b.classList.add('tc-swatch');b.style.setProperty('--tc-swatch',color);
            b.setAttribute('title','Pen color '+(i+1));
            b.textContent='';b.classList.toggle('active',selectedPenState===i);
          });
          if(o.fadePen)createOption('Fading ink',function(){selectPen(o.inks.length);},{action:'pen-fading'});
          createOption('Clear drawing…',function(){
            if(window.confirm('Clear the current '+(wb.on?'whiteboard':'slide')+' annotations? You can undo this action.')){
              clearAnnot();closePanels();
            }
          },{action:'clear-drawing'});
        }
        createOption('Close',closePanels,{action:'close-panel'});
      }
      function openPanel(which){
        menuOpen=false;panelMode=panelMode===which?null:which;
        if(panelMode)buildPanel();
        refreshControls();activity();
      }
      function toggleMore(){
        panelMode=null;menuOpen=!menuOpen;
        refreshControls();activity();
      }
      if (contextual){
        bar.appendChild(panelGroup);
        bar.appendChild(drawGroup);
        bar.appendChild(moreGroup);
        bar.appendChild(mainGroup);
      } else {
        bar.appendChild(panelGroup);
        bar.appendChild(mainGroup);
      }
      controlItems.forEach(function (key) {
        var item=ALL[key];
        var b=d.createElement('button');
        b.type='button'; b.title=item.t; b.setAttribute('aria-label',item.t);
        b.setAttribute('data-tc-control',key);
        if (key==='pause' || key==='overview' || key==='fullscreen') {
          b.setAttribute('aria-pressed','false');
          presentationStateBtns[key]=b;
        }
        if (key==='timer') b.setAttribute('aria-pressed','false');
        b.innerHTML=item.ic;

        if(item.pen){
          penBtn=b;
          var lp=null;
          b.addEventListener('pointerdown',function(ev){
            ev.stopPropagation();
            longPressed=false;
            if(ev.button===2)return;
            lp=setTimeout(function(){longPressed=true;openPanel('pen');},550);
          });
          var cancelLP=function(){ if(lp){clearTimeout(lp);lp=null;} };
          b.addEventListener('pointerup',cancelLP);
          b.addEventListener('pointerleave',cancelLP);
          b.addEventListener('pointercancel',cancelLP);
          b.addEventListener('contextmenu',function(ev){ev.preventDefault();ev.stopPropagation();cancelLP();longPressed=true;openPanel('pen');});
          b.addEventListener('click',function(ev){
            ev.stopPropagation(); ev.preventDefault();
            if(longPressed){longPressed=false;return;}
            if(ev.shiftKey){openPanel('pen');return;}
            penTap();
          });
        } else {
          if(item.activateFocus) focusBtn=b;
          if(item.erase) eraserBtn=b;
          if(item.undo) undoBtn=b;
          if(item.redo) redoBtn=b;
          if(item.wb) wbBtn=b;
          if(item.tm) timerBtn=b;
          if(item.pr) printBtn=b;
          if(item.tm){
            var timerLong=null, timerLongFired=false;
            b.addEventListener('pointerdown',function(ev){
              ev.stopPropagation();timerLongFired=false;
              if(ev.button===2)return;
              timerLong=setTimeout(function(){timerLongFired=true;customTimer();},600);
            });
            ['pointerup','pointercancel','pointerleave'].forEach(function(t){
              b.addEventListener(t,function(){clearTimeout(timerLong);timerLong=null;});
            });
            b.addEventListener('contextmenu',function(ev){ev.preventDefault();ev.stopPropagation();clearTimeout(timerLong);timerLongFired=true;customTimer();});
            b.addEventListener('click',function(ev){ev.stopPropagation();ev.preventDefault();if(timerLongFired){timerLongFired=false;return;}if(ev.shiftKey)customTimer();else item.fn();});
          } else {
            b.addEventListener('pointerdown',function(ev){ev.stopPropagation();});
            b.addEventListener('click',function(ev){
              ev.stopPropagation();ev.preventDefault();item.fn();
              if(contextual && b.parentElement===moreGroup){closePanels();}
            });
          }
        }
        var group=mainGroup;
        if(contextual){
          if(drawingKeys.indexOf(key)>=0)group=hasDrawTrigger ? drawGroup : moreGroup;
          else if(extraKeys.indexOf(key)>=0)group=moreGroup;
        }
        group.appendChild(b);
      });
      /* Unsupported extra layouts still expose all specified controls via More. */
      if(contextual){
        moreBtn=d.createElement('button');moreBtn.type='button';
        moreBtn.title='More tools';moreBtn.setAttribute('aria-label','More tools');
        moreBtn.setAttribute('aria-controls','tc-extra-controls');
        moreBtn.setAttribute('aria-haspopup','true'); moreBtn.setAttribute('aria-expanded','false');
        moreBtn.setAttribute('data-tc-control','more');moreBtn.innerHTML=ICON.more;
        moreGroup.id='tc-extra-controls';
        moreBtn.addEventListener('pointerdown',function(e){e.stopPropagation();});
        moreBtn.addEventListener('click',function(e){e.stopPropagation();e.preventDefault();toggleMore();});
        mainGroup.appendChild(moreBtn);
      }
      listen(d,'pointerdown',function(ev){
        if((menuOpen||panelMode) && !bar.contains(ev.target)){closePanels();activity();}
      },true);
      listen(d,'keydown',function(ev){
        if(ev.key==='Escape' && (menuOpen||panelMode)){
          closePanels();(moreBtn||penBtn||timerBtn||bar).focus();activity();
        }
      },true);
      // Keep More anchored. Print is always to its right, regardless of slide.
      if(contextual && printBtn && moreBtn)mainGroup.appendChild(printBtn);
      host.appendChild(bar);
      groupVisible(panelGroup,false);
      groupVisible(drawGroup,false);
      groupVisible(moreGroup,false);
      updateHistory();
      listen(window,'resize',function(){fitMainControls();placeTimer();});

      /* The first slide prints the presentation without annotations; the last slide prints with annotations. No print button appears on intermediate slides. Recompute on every slide change. */
      function fitMainControls(){
        if(!contextual || !bar.isConnected)return;
        // Restore the preferred order when enough width is available.
        ['whiteboard','zoom','timer','pause'].forEach(function(key){
          var b=bar.querySelector('[data-tc-control="'+key+'"]');
          if(b && b.parentElement===moreGroup)mainGroup.insertBefore(b,moreBtn||printBtn);
        });
        var cs=getComputedStyle(mainGroup), gap=parseFloat(cs.columnGap)||0;
        var available=window.innerWidth-30;
        function used(){
          var b=Array.from(mainGroup.children).filter(function(el){return el.tagName==='BUTTON'&&!el.hidden&&el.style.display!=='none';});
          var width=b.reduce(function(sum,el){return sum+parseFloat(getComputedStyle(el).width);},0);
          // Reserve the same slot for a first-/last-slide printer on intermediate slides.
          // More therefore never jumps horizontally between slides.
          if(printBtn && printBtn.style.display==='none'){
            // display:none removes the computed width, so use an ordinary tool's
            // measured width for the reserved print slot between slides.
            width+=parseFloat(getComputedStyle(moreBtn || mainGroup.firstElementChild).width) || 44;
            b.push(printBtn);
          }
          // The print slot has its own margin in addition to the flex gap.
          var printGap=printBtn ? (parseFloat(getComputedStyle(printBtn).marginInlineStart)||0) : 0;
          return width+Math.max(0,b.length-1)*gap+printGap+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
        }
        ['pause','timer','zoom','whiteboard'].forEach(function(key){
          if(used()<=available)return;
          var b=mainGroup.querySelector('[data-tc-control="'+key+'"]');
          if(b){moreGroup.insertBefore(b,moreGroup.firstChild);}
        });
        if(moreBtn)moreBtn.hidden=!moreGroup.childElementCount;
        if(!moreGroup.childElementCount)menuOpen=false;
        refreshControls();
      }
      function showPrint(){
        if (!printBtn) return;
        var current = deck.getCurrentSlide && deck.getCurrentSlide();
        var slides = deck.getSlides && deck.getSlides();
        var indices = deck.getIndices && deck.getIndices();
        var first = !!(slides && slides.length && current === slides[0]);
        var last = !!(slides && slides.length && current === slides[slides.length-1]);
        if (!slides || !slides.length) {
          first = !!indices && indices.h === 0 && !indices.v;
          last = !!(deck.isLastSlide && deck.isLastSlide());
        }
        var visible = first || last;
        // On a one-slide deck, prefer the annotated export, since both endpoints match.
        printWithInk = !!last;
        var title = printWithInk
          ? 'Print all slides with annotations (last slide)'
          : 'Print all slides without annotations (first slide)';
        printBtn.title = title;
        printBtn.setAttribute('aria-label',title);
        printBtn.style.display = visible ? '' : 'none';
        printBtn.tabIndex = visible && !bar.classList.contains('idle') ? 0 : -1;
        fitMainControls();
      }
      showPrint();
      deckListen('ready',showPrint); deckListen('slidechanged',showPrint);

      /* The solid active outline represents persistent state, not an action that just
         happened. Keep Reveal-controlled modes and the browser fullscreen mode
         synchronized even when users activate them via keyboard shortcuts. */
      function syncPresentationStates(){
        var modes={
          pause: !!(deck.isPaused && deck.isPaused()),
          overview: !!(deck.isOverview && deck.isOverview()),
          fullscreen: !!(d.fullscreenElement || d.webkitFullscreenElement)
        };
        Object.keys(modes).forEach(function(key){
          var b=presentationStateBtns[key];
          if(!b)return;
          b.classList.toggle('active',modes[key]);
          b.setAttribute('aria-pressed',String(modes[key]));
        });
      }
      ['paused','resumed','overviewshown','overviewhidden','ready'].forEach(function(event){
        deckListen(event,syncPresentationStates);
      });
      listen(d,'fullscreenchange',syncPresentationStates);
      listen(d,'webkitfullscreenchange',syncPresentationStates);
      syncPresentationStates();

      /* The toolbar is designed for touch use. Presenter keys, Reveal navigation arrows and ink drawn elsewhere should not wake a hidden toolbar unnecessarily. */
      function inWakeZone(ev){
        if (!o.wakeZone) return true;
        if (ev.target && ev.target.closest && ev.target.closest('.touchcontrols')) return true;
        if (ev.clientX == null || ev.clientY == null) return true;
        var r = bar.getBoundingClientRect();
        var x=(o.side==='right')?(window.innerWidth-ev.clientX):ev.clientX;
        var w=Math.max(o.wakeZone[0], (o.side==='right'?(window.innerWidth-r.left):r.right)+24);
        var extra=Math.max(0,(o.wakeZone[1]-r.height-48)/2);
        return x<=w && ev.clientY>=r.top-24-extra && ev.clientY<=r.bottom+24+extra;
      }
      function wake(ev){ if (inWakeZone(ev)) activity(); }

      if (o.autohide){
        ['pointermove','pointerdown'].forEach(function(ev){ listen(document, ev, wake, true); });
        if (o.wakeOnKey) listen(document,'keydown',activity,true);
      }
      if(o.persistAnnotations)ensureCanvas(); // saved ink must be visible before activating the pen
      activity();
      Plugin.exportAnnotations = exportPNG;
      Plugin.undo = undo;
      Plugin.redo = redo;
      Plugin.destroy = function(){
        clearTimeout(idleTimer); stopTimer(); clearFade(); resetZoom();
        cleanups.forEach(function(off){off();}); cleanups=[];
        [bar,pen.canvas,fade.canvas,wb.el,zoom.spot,zoom.lens,timer.chip,ownedCSS].forEach(function(el){if(el&&el.parentNode)el.parentNode.removeChild(el);});
        Plugin.destroy=function(){};
      };
    }
  };

export default Plugin;
