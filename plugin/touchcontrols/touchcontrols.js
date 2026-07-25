/*!
 * reveal.js-touchcontrols 1.1.0
 * On-screen controls for touch displays / smartboards.
 * Bildschirm-Bedienung für Touch-Displays / Smartboards.
 * Buttons: pen · whiteboard · zoom · timer · pause · overview · fullscreen
 * @author  Florian Loyns
 * @license MIT
 * Companion to Smallcontrol by Martijn De Jongh (Martino).
 * Docs & options: see README.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.RevealTouchControls = factory());
}(this, (function () {
  'use strict';

  function svg(p){ return '<svg viewBox="0 0 24 24">' + p + '</svg>'; }
  var ICON = {
    pen:  svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    board: svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 10.5c1.7-2 3.3-2 5 0s3.3 2 5 0"/><path d="M8 21l2-4"/><path d="M16 21l-2-4"/>'),
    zoom: svg('<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4-4"/><path d="M11 8.3v5.4"/><path d="M8.3 11h5.4"/>'),
    timer: svg('<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5v3.5l2.6 1.6"/><path d="M9.5 2.5h5"/><path d="M12 2.5v3"/>'),
    pause: svg('<path d="M9 5v14"/><path d="M15 5v14"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    full: svg('<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/>')
  };

  function penCursor(color){
    return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='"
      + encodeURIComponent(color) + "' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'/%3E%3C/svg%3E\") 4 24, crosshair";
  }

  function injectCSS(o){
    if (document.getElementById('touchcontrols-css')) return;
    var pos = (o.side === 'right') ? 'right:18px' : 'left:18px';
    var css =
      ".reveal .touchcontrols{position:fixed;" + pos + ";bottom:" + o.bottom + "px;z-index:60;display:flex;align-items:center;gap:8px;transition:opacity .3s ease}"
    + ".reveal .touchcontrols.idle{opacity:0;pointer-events:none}"
    + ".reveal .touchcontrols button{width:36px;height:36px;padding:0;cursor:pointer;border-radius:9px;background:transparent;border:1.5px solid " + o.accent + ";color:" + o.accent + ";display:flex;align-items:center;justify-content:center;transition:.14s}"
    + ".reveal .touchcontrols button:hover{background:" + o.hover + "}"
    + ".reveal .touchcontrols button:active{transform:translateY(1px)}"
    + ".reveal .touchcontrols button.active{background:" + o.accent + ";color:#fff}"
    + ".reveal.has-dark-background .touchcontrols button{border-color:#fff;color:#fff}"
    + ".reveal.has-dark-background .touchcontrols button:hover{background:rgba(255,255,255,.15)}"
    + ".reveal.has-dark-background .touchcontrols button.active{background:#fff;color:" + o.accent + "}"
    /* Whiteboard an: Leiste immer in Akzentfarbe, auch wenn die Folie dahinter dunkel ist */
    + ".reveal.has-dark-background .touchcontrols.wb-on button{border-color:" + o.accent + ";color:" + o.accent + "}"
    + ".reveal.has-dark-background .touchcontrols.wb-on button:hover{background:" + o.hover + "}"
    + ".reveal.has-dark-background .touchcontrols.wb-on button.active{background:" + o.accent + ";color:#fff}"
    + ".reveal .touchcontrols button svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"
    + ".reveal .touchcontrols-annot{position:fixed;inset:0;z-index:45;pointer-events:none;touch-action:none}"
    + ".reveal .touchcontrols-annot.on{cursor:" + penCursor(o.inks[0]) + "}"
    + ".reveal .touchcontrols-board{position:fixed;inset:0;z-index:44;background:#fff;display:none}"
    + ".reveal .touchcontrols-board.on{display:block}"
    + ".reveal .touchcontrols-timer{position:fixed;" + pos + ";bottom:" + (o.bottom + 48) + "px;z-index:60;display:none;padding:6px 16px;border-radius:12px;background:" + o.accent + ";color:#fff;font-family:Inter,system-ui,-apple-system,sans-serif;font-size:24px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.5px}"
    + ".reveal .touchcontrols-timer.on{display:block}"
    + ".reveal .touchcontrols-timer.done{background:#C0392B;animation:tc-pulse 1s ease-in-out infinite}"
    + "@keyframes tc-pulse{0%,100%{opacity:1}50%{opacity:.35}}"
    + ".reveal .controls{z-index:50}"
    + "@media print{.reveal .touchcontrols,.reveal .touchcontrols-annot,.reveal .touchcontrols-board,.reveal .touchcontrols-timer{display:none !important}}";
    var s = document.createElement('style');
    s.id = 'touchcontrols-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  function toggleFullscreen(){
    var d = document, el = d.documentElement;
    if (!d.fullscreenElement){ (el.requestFullscreen || el.webkitRequestFullscreen || function(){}).call(el); }
    else { (d.exitFullscreen || d.webkitExitFullscreen || function(){}).call(d); }
  }

  var Plugin = {
    id: 'touchcontrols',
    init: function (deck) {
      var d = document;
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
        buttons: (c.buttons && c.buttons.length) ? c.buttons : ['pen','whiteboard','zoom','timer','pause','overview','fullscreen'],
        timerMinutes: (c.timerMinutes && c.timerMinutes.length) ? c.timerMinutes : [5, 10, 15],
        autohide: (c.autohide != null) ? c.autohide : true,
        autohideDelay: c.autohideDelay || 3500
      };
      injectCSS(o);

      var bar = d.createElement('div');
      bar.className = 'touchcontrols';
      bar.setAttribute('aria-label', 'Steuerung');
      bar.addEventListener('contextmenu', function(ev){ ev.preventDefault(); });   // Langdruck ohne Kontextmenü

      /* ---- Auto-Ausblenden bei Inaktivität ---- */
      var idleTimer = null;
      function activity(){
        bar.classList.remove('idle');
        if (!o.autohide) return;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(function(){
          if (pen.on || zoom.on || zoom.armed || wb.on) return;   // im Stift-/Zoom-/Whiteboard-Modus sichtbar lassen
          bar.classList.add('idle');
        }, o.autohideDelay);
      }

      /* ---- Stift: Annotation, zyklische Farben, Langdruck = Folie löschen ---- */
      var pen = { on:false, canvas:null, ctx:null, drawing:false }, penBtn = null, longPressed = false;
      var currentInk = o.inks[0], penState = -1;   // -1 = aus, sonst Index in o.inks
      var lastX = 0, lastY = 0, activePtr = null;  // ein Finger/Stift zeichnet, der Rest wird ignoriert

      function sizeCanvas(){
        var cv = pen.canvas, dpr = window.devicePixelRatio || 1;
        cv.width  = Math.round(window.innerWidth  * dpr);
        cv.height = Math.round(window.innerHeight * dpr);
        cv.style.width  = window.innerWidth  + 'px';   // CSS-Größe explizit: Canvas streckt sich
        cv.style.height = window.innerHeight + 'px';   // als ersetztes Element nicht über inset:0
        pen.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);    // in CSS-Pixeln zeichnen, scharf auf HiDPI
      }
      function inkStyle(x){
        x.strokeStyle = currentInk; x.lineWidth = o.penWidth; x.lineCap = 'round'; x.lineJoin = 'round';
      }
      function ensureCanvas(){
        if (pen.canvas) return;
        var cv = d.createElement('canvas');
        cv.className = 'touchcontrols-annot';
        pen.ctx = cv.getContext('2d');
        pen.canvas = cv;
        sizeCanvas();
        cv.addEventListener('pointerdown', function(e){
          if (!pen.on || !e.isPrimary || activePtr !== null) return;   // Handballen/zweiter Finger zeichnet nicht
          activePtr = e.pointerId;
          if (cv.setPointerCapture){ try { cv.setPointerCapture(e.pointerId); } catch(_){} }
          pen.drawing = true; lastX = e.clientX; lastY = e.clientY;
          var x = pen.ctx; inkStyle(x);
          x.beginPath(); x.moveTo(lastX, lastY); x.lineTo(lastX + 0.01, lastY); x.stroke();   // Punkt bei blossem Tippen
          e.preventDefault(); e.stopPropagation();
        });
        cv.addEventListener('pointermove', function(e){
          if (!pen.drawing || e.pointerId !== activePtr) return;
          var evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
          if (!evs.length) evs = [e];
          var x = pen.ctx; inkStyle(x);
          x.beginPath(); x.moveTo(lastX, lastY);
          for (var i = 0; i < evs.length; i++){       // nur die neuen Segmente zeichnen
            x.lineTo(evs[i].clientX, evs[i].clientY);
            lastX = evs[i].clientX; lastY = evs[i].clientY;
          }
          x.stroke();
          e.preventDefault();
        });
        function endStroke(e){
          if (e.pointerId !== activePtr) return;
          pen.drawing = false; activePtr = null;
        }
        cv.addEventListener('pointerup', endStroke);
        cv.addEventListener('pointercancel', endStroke);   // vom System abgebrochene Gesten sauber beenden
        cv.addEventListener('contextmenu', function(e){ e.preventDefault(); });
        window.addEventListener('resize', sizeCanvas);
        host.appendChild(cv);
      }
      function clearAnnot(){
        if (!pen.ctx) return;
        var x = pen.ctx;
        x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
        x.clearRect(0, 0, pen.canvas.width, pen.canvas.height);
        x.restore();
      }
      function applyPen(){
        ensureCanvas();
        if (penState < 0){
          pen.on = false;
          penBtn.style.borderColor = ''; penBtn.style.color = '';
        } else {
          pen.on = true; currentInk = o.inks[penState];
          penBtn.style.borderColor = currentInk; penBtn.style.color = currentInk;   // Button zeigt aktive Farbe
        }
        pen.canvas.style.pointerEvents = pen.on ? 'auto' : 'none';
        pen.canvas.classList.toggle('on', pen.on);
        pen.canvas.style.cursor = pen.on ? penCursor(currentInk) : '';
        activity();
      }
      function penTap(){
        penState = penState + 1;
        if (penState >= o.inks.length) penState = -1;   // nach letzter Farbe: aus
        applyPen();
      }

      /* ---- Whiteboard: weiße Fläche, Stift geht automatisch an ---- */
      var wb = { on:false, el:null }, wbBtn = null;
      function ensureBoard(){
        if (wb.el) return;
        var el = d.createElement('div');
        el.className = 'touchcontrols-board';
        host.appendChild(el);
        wb.el = el;
      }
      function setBoard(on){
        ensureBoard();
        wb.on = on;
        wb.el.classList.toggle('on', on);
        bar.classList.toggle('wb-on', on);
        if (wbBtn) wbBtn.classList.toggle('active', on);
        if (on){
          if (penState < 0){ penState = 0; applyPen(); }   // gleich losschreiben können
        } else {
          clearAnnot();                                     // Tafelbild verwerfen
          if (penState >= 0){ penState = -1; applyPen(); }
        }
        activity();
      }
      function board(){ setBoard(!wb.on); }

      /* ---- Timer: Tippen schaltet die Stufen durch, Countdown gut sichtbar ---- */
      var timer = { idx:-1, left:0, iv:null, chip:null, done:false }, timerBtn = null;
      function two(n){ return (n < 10 ? '0' : '') + n; }
      function ensureChip(){
        if (timer.chip) return;
        var el = d.createElement('div');
        el.className = 'touchcontrols-timer';
        host.appendChild(el);
        timer.chip = el;
      }
      function paintTimer(){
        ensureChip();
        if (timer.idx < 0){
          timer.chip.classList.remove('on', 'done');
          if (timerBtn) timerBtn.classList.remove('active');
          return;
        }
        timer.chip.textContent = Math.floor(timer.left / 60) + ':' + two(timer.left % 60);
        timer.chip.classList.add('on');
        timer.chip.classList.toggle('done', timer.done);
        if (timerBtn) timerBtn.classList.add('active');
      }
      function stopTimer(){
        if (timer.iv){ clearInterval(timer.iv); timer.iv = null; }
        timer.idx = -1; timer.left = 0; timer.done = false;
        paintTimer();
      }
      function timerTap(){
        activity();
        if (timer.done){ stopTimer(); return; }              // abgelaufen: Tippen räumt auf
        timer.idx = timer.idx + 1;
        if (timer.idx >= o.timerMinutes.length){ stopTimer(); return; }   // nach letzter Stufe: aus
        timer.left = Math.round(o.timerMinutes[timer.idx] * 60);
        if (!timer.iv){
          timer.iv = setInterval(function(){
            if (timer.left > 0) timer.left = timer.left - 1;
            if (timer.left <= 0 && !timer.done){
              timer.done = true;
              clearInterval(timer.iv); timer.iv = null;
            }
            paintTimer();
          }, 1000);
        }
        paintTimer();
      }

      /* ---- Lupe: Button antippen, dann Stelle antippen = reinzoomen; erneut tippen = zurück ---- */
      var zoom = { armed:false, on:false, el:null }, lupeBtn = null;
      function targetEl(){ var s = deck.getCurrentSlide(); return s ? (s.querySelector('.cardslide') || s) : null; }
      function resetZoom(){
        if (zoom.el){ zoom.el.style.transform = ''; }   // Origin bleibt -> weiches Rauszoomen
        zoom.on=false; zoom.armed=false; zoom.el=null;
        if (lupeBtn) lupeBtn.classList.remove('active');
        d.removeEventListener('click', onTap, true);
      }
      function onTap(ev){
        if (ev.target.closest && ev.target.closest('.touchcontrols')) return;
        if (!zoom.el){ resetZoom(); return; }
        ev.preventDefault(); ev.stopPropagation();
        if (zoom.on){ resetZoom(); return; }
        var r = zoom.el.getBoundingClientRect();
        var x = Math.max(0, Math.min(100, ((ev.clientX - r.left)/r.width)*100));
        var y = Math.max(0, Math.min(100, ((ev.clientY - r.top)/r.height)*100));
        zoom.el.style.willChange = 'transform';
        zoom.el.style.transition = 'transform .42s cubic-bezier(.22,.61,.36,1)';
        zoom.el.style.transformOrigin = x+'% '+y+'%';
        zoom.el.style.transform = 'scale(2)';
        zoom.on = true; zoom.armed = false;
      }
      function lupe(){
        activity();
        if (zoom.on || zoom.armed){ resetZoom(); return; }
        zoom.el = targetEl();
        if (!zoom.el) return;
        zoom.armed = true; lupeBtn.classList.add('active');
        d.addEventListener('click', onTap, true);
      }

      /* neue Folie: Whiteboard zu, Markierungen weg, Zoom zurück (Timer läuft weiter) */
      if (deck.on) deck.on('slidechanged', function(){
        if (wb.on) setBoard(false);
        clearAnnot(); resetZoom();
      });

      /* ---- Buttons aus der Konfiguration ---- */
      var ALL = {
        pen:        { ic:ICON.pen,   t:'Stift – markieren · lang drücken löscht die Folie', pen:true },
        whiteboard: { ic:ICON.board, t:'Whiteboard – weiße Fläche zum Schreiben', wb:true, fn:board },
        zoom:       { ic:ICON.zoom,  t:'Lupe – Stelle antippen zum Zoomen', lupe:true, fn:lupe },
        timer:      { ic:ICON.timer, t:'Timer – Tippen wechselt ' + o.timerMinutes.join(' · ') + ' min, danach aus', tm:true, fn:timerTap },
        pause:      { ic:ICON.pause, t:'Pause – Bildschirm schwarz', fn:function(){ deck.togglePause(); } },
        overview:   { ic:ICON.grid,  t:'Folienübersicht', fn:function(){ deck.toggleOverview(); } },
        fullscreen: { ic:ICON.full,  t:'Vollbild', fn:toggleFullscreen }
      };
      var items = o.buttons.map(function(k){ return ALL[k]; }).filter(Boolean);

      items.forEach(function (item) {
        var b = d.createElement('button');
        b.type = 'button'; b.title = item.t; b.setAttribute('aria-label', item.t);
        b.innerHTML = item.ic;

        if (item.pen){
          penBtn = b;
          var lp = null;
          b.addEventListener('pointerdown', function(ev){
            ev.stopPropagation();
            longPressed = false;
            lp = setTimeout(function(){ longPressed = true; clearAnnot(); }, 550);   // Langdruck = löschen
          });
          var cancelLP = function(){ if (lp){ clearTimeout(lp); lp = null; } };
          b.addEventListener('pointerup', cancelLP);
          b.addEventListener('pointerleave', cancelLP);
          b.addEventListener('pointercancel', cancelLP);
          b.addEventListener('click', function(ev){
            ev.stopPropagation(); ev.preventDefault();
            if (longPressed){ longPressed = false; return; }   // nach Langdruck kein Umschalten
            penTap();
          });
        } else {
          if (item.lupe) lupeBtn = b;
          if (item.wb) wbBtn = b;
          if (item.tm) timerBtn = b;
          b.addEventListener('pointerdown', function(ev){ ev.stopPropagation(); });
          b.addEventListener('click', function(ev){ ev.stopPropagation(); ev.preventDefault(); item.fn(); });
        }
        bar.appendChild(b);
      });

      host.appendChild(bar);

      if (o.autohide){
        ['pointermove','pointerdown','keydown'].forEach(function(ev){ document.addEventListener(ev, activity, true); });
      }
      activity();
    }
  };

  return Plugin;
})));
