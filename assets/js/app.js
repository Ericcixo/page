
(function(){
  'use strict';
  window.RF = window.RF || { adds:0 };
  if(!window.CONFIG){ window.CONFIG = { brand:{title:'RevendeFácil',email:'info@revendefacil.com'}, pricing:{providerUnit:2, bundles:{'2':4,'3':5,'4':6}, courseUnit:1, currency:'€'}, paypal:{clientId:'9YZXF5328FBRG',currency:'EUR'} }; }
  function $(sel, ctx){ ctx=ctx||document; return ctx.querySelector(sel); }
  function $$(sel, ctx){ ctx=ctx||document; return Array.prototype.slice.call(ctx.querySelectorAll(sel)); }

    
  // Toast helper
  function toast(msg,type){ var t=document.getElementById('toast'); if(!t) return; var cls = type==='error'?'error':'success'; t.innerHTML = '<div class="item '+cls+'">'+(msg||'Añadido al carrito')+'</div>'; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 3200); }
  // Fly-to-cart animation
  function fly(el){ try{ var icon = el.closest('.card').querySelector('.icon'); var cart = document.getElementById('openCart'); if(!icon||!cart) return; var r1 = icon.getBoundingClientRect(); var r2 = cart.getBoundingClientRect(); var clone = icon.cloneNode(); clone.className = 'fly'; clone.style.position='fixed'; clone.style.left = r1.left+'px'; clone.style.top = r1.top+'px'; clone.style.width = r1.width+'px'; clone.style.height = r1.height+'px'; document.body.appendChild(clone); var dx = (r2.left + r2.width/2) - r1.left; var dy = (r2.top + r2.height/2) - r1.top; requestAnimationFrame(function(){ clone.style.transform = 'translate('+dx+'px,'+dy+'px) scale(.15)'; clone.style.opacity = '.25'; }); setTimeout(function(){ try{ document.body.removeChild(clone); var ripple=document.createElement('span'); ripple.className='ripple'; ripple.style.left=(r2.left + r2.width/2)+'px'; ripple.style.top=(r2.top + r2.height/2)+'px'; document.body.appendChild(ripple); setTimeout(function(){ if(ripple && ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 620); }catch(e){} }, 560); }catch(e){} }
  function bumpCounts(){ ['cartCount'].forEach(function(id){ var el=document.getElementById(id); if(el){ el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(function(){ el.classList.remove('bump'); }, 400); } }); }

  // Items map for pricing/labels
  var ITEMS = {
    providers: {
      p1:{title:'Proveedor Zapatillas', price: CONFIG.pricing.providerUnit, img:'img/providers/prov1.png'},
      p2:{title:'Proveedor Vapers', price: CONFIG.pricing.providerUnit, img:'img/providers/prov2.png'},
      p3:{title:'Proveedor Relojes', price: CONFIG.pricing.providerUnit, img:'img/providers/prov3.png'},
      p4:{title:'Proveedor Colonias', price: CONFIG.pricing.providerUnit, img:'img/providers/prov4.png'}
    },
    courses: {
      c1:{title:'Curso Lujo', price: CONFIG.pricing.courseUnit, img:'img/courses/course1.png'},
      c2:{title:'Curso Seguridad', price: CONFIG.pricing.courseUnit, img:'img/courses/course2.png'},
      c3:{title:'Curso Anuncios', price: CONFIG.pricing.courseUnit, img:'img/courses/course3.png'}
    }
  };

  // Cart state
  function sp(v){ try{return JSON.parse(v||'null')}catch(e){return null} }
  var cart = sp(localStorage.getItem('rf_cart')) || { providers: [], courses: [] };
  function save(){ localStorage.setItem('rf_cart', JSON.stringify(cart)); updateUI(); }

  function providerBundlePrice(n){ if(n<=0) return 0; if(n===1) return CONFIG.pricing.providerUnit; if(n===2) return CONFIG.pricing.bundles['2']; if(n===3) return CONFIG.pricing.bundles['3']; return CONFIG.pricing.bundles['4']; }
  function totals(){ var pc=cart.providers.length; var pNom = pc*CONFIG.pricing.providerUnit; var pPrice = providerBundlePrice(pc); var pSave = Math.max(0, pNom - pPrice); var cPrice=0; (cart.courses||[]).forEach(function(it){ cPrice += (it.qty||1)*CONFIG.pricing.courseUnit; }); return {pc:pc,pNom:pNom,pPrice:pPrice,pSave:pSave,cPrice:cPrice,total:pPrice+cPrice}; }
  function fe(n){ return (n||0).toFixed(2).replace('.', ',') + CONFIG.pricing.currency; }

  // Actions
  function addProvider(id, srcEl){ if(cart.providers.indexOf(id)!==-1){ toast('No puedes repetir este proveedor en la compra', 'error'); return; } cart.providers.push(id); save(); toast('Proveedor añadido'); bumpCounts(); if(srcEl) fly(srcEl); }
  function rmProvider(id){ cart.providers = cart.providers.filter(function(x){return x!==id}); save(); }
  function addCourse(id, srcEl){ var f = (cart.courses||[]).filter(function(x){return x.id===id})[0]; if(f){ toast('Este curso ya está en el carrito (máximo 1)', 'error'); return; } cart.courses.push({id:id, qty:1}); save(); toast('Curso añadido'); bumpCounts(); if(srcEl) fly(srcEl); }
  function decCourse(id){ var f = (cart.courses||[]).filter(function(x){return x.id===id})[0]; if(!f) return; f.qty = Math.max(0,(f.qty||1)-1); if(f.qty===0){ cart.courses = cart.courses.filter(function(x){return x.id!==id}); } save(); }
  function rmCourse(id){ cart.courses = cart.courses.filter(function(x){return x.id!==id}); save(); }
  function clear(){ cart = { providers: [], courses: [] }; save(); }

  // Bind buttons in pre-rendered cards
  function bindCards(){
    $$('.card').forEach(function(card){
      var add = card.querySelector('.actions .btn.primary'); if(add){
        var id = add.getAttribute('data-id'); var t = add.getAttribute('data-type');
        add.addEventListener('click', function(){ t==='provider' ? addProvider(id) : addCourse(id); });
      }
      var minus = card.querySelector('[data-minus]'); if(minus){ var idm = minus.getAttribute('data-id'); minus.addEventListener('click', function(){ decCourse(idm); }); }
    });
  }

  // Drawer cart controls
  var body = document.body; var drawer=$('#cartDrawer'); var overlay=$('#cartOverlay');
  function openDrawer(){ body.classList.add('cart-open'); if(drawer) drawer.setAttribute('aria-hidden','false'); if(overlay) overlay.style.display='block'; }
  function closeDrawer(){ body.classList.remove('cart-open'); if(drawer) drawer.setAttribute('aria-hidden','true'); if(overlay) overlay.style.display='none'; }
  var openBtn = $('#openCart'); if(openBtn) openBtn.addEventListener('click', openDrawer);
  var closeBtn = $('#closeCart'); if(closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if(overlay) overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeDrawer(); }});

  // Update cart UI
  function updateUI(){
    var t = totals();
    var count = t.pc + cart.courses.reduce(function(a,b){return a+(b.qty||1)},0);
    var c1=$('#cartCount'), c2=$('#cartCount2'); if(c1) c1.textContent = String(count); if(c2) c2.textContent = String(count);
    var sumTotal = $('#sumTotal'); if(sumTotal) sumTotal.textContent = fe(t.total);
    var sumSave = $('#sumSave'); if(sumSave) sumSave.textContent = t.pSave>0 ? (' (Ahorro: '+fe(t.pSave)+')') : '';
    renderLines();
  }

  function renderLines(){
    var box = $('#cartLines'); if(!box) return; var html='';
    // Providers
    cart.providers.forEach(function(id){ var m=ITEMS.providers[id]; if(!m) return; html += '<div class="line">'+
      '<img src="'+m.img+'" alt="'+m.title+'" width="64" height="64"/>'+
      '<div><div><strong>'+m.title+'</strong></div><div class="subtitle">Proveedor</div></div>'+
      '<div><button class="btn" data-rm-p="'+id+'">Eliminar</button></div>'+
      '</div>'; });
    // Courses
    (cart.courses||[]).forEach(function(it){ var m=ITEMS.courses[it.id]; if(!m) return; html += '<div class="line">'+
      '<img src="'+m.img+'" alt="'+m.title+'" width="64" height="64"/>'+
      '<div><div><strong>'+m.title+'</strong></div><div class="subtitle">Curso PDF</div></div>'+
      '<div class="qty">'+
      '<span>1</span>'+
      '<button class="btn" data-rm-c="'+it.id+'" style="margin-left:8px;">Eliminar</button>'+
      '</div></div>'; });
    if(!html) html = '<div class="subtitle">Tu carrito está vacío.</div>';
    // ... código anterior de renderLines ...
    
    // MEJORA: Cross-selling
    // Si hay proveedores pero NO hay cursos, sugerimos el curso de seguridad
    if(cart.providers.length > 0 && (!cart.courses || cart.courses.length === 0)){
       html += '<div class="line" style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); border-radius:8px; padding:8px 12px; display:block; margin-top:10px;">'+
               '<div style="font-size:13px; margin-bottom:4px; color:#bbf7d0">🔥 ¡Recomendado! Añade el <strong>Curso de Seguridad</strong> para evitar baneos.</div>'+
               '<button class="btn primary" style="width:100%; padding:6px; font-size:13px;" data-inc="c2">Añadir por 1€</button>'+
               '</div>';
    }

    if(!html) html = '<div class="subtitle" style="text-align:center; padding:20px;">Tu carrito está vacío.<br><br><span style="font-size:30px">🛒</span></div>';
    
    box.innerHTML = html;
    // ... resto de bindings ...
    box.innerHTML = html;
    // bind actions
    $$("[data-rm-p]", box).forEach(function(b){ b.addEventListener('click', function(){ rmProvider(b.getAttribute('data-rm-p')); }); });
    $$("[data-rm-c]", box).forEach(function(b){ b.addEventListener('click', function(){ rmCourse(b.getAttribute('data-rm-c')); }); });
    $$("[data-inc]", box).forEach(function(b){ b.addEventListener('click', function(){ addCourse(b.getAttribute('data-inc')); }); });
    $$("[data-dec]", box).forEach(function(b){ b.addEventListener('click', function(){ decCourse(b.getAttribute('data-dec')); }); });
  }

  // Reveal on scroll (safe fallback)
  var supportsIO = 'IntersectionObserver' in window; var els = $$('.reveal');
  if(supportsIO){ var io = new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); } }); },{threshold:.12}); els.forEach(function(el){ io.observe(el); }); }
  else { els.forEach(function(el){ el.classList.add('is-visible'); }); }

  // Buttons
  var goCheckout = $('#goCheckout'); if(goCheckout) goCheckout.addEventListener('click', function(){ window.location.href = 'checkout.html'; });
  var toCheckout = $('#toCheckout'); if(toCheckout) toCheckout.addEventListener('click', function(){ window.location.href = 'checkout.html'; });
  var clearCart = $('#clearCart'); if(clearCart) clearCart.addEventListener('click', function(){ clear(); });

  // Calculator (pro)
  function calcUpdate(){
    var cP = parseFloat(($('#costProduct')||{}).value)||0; var cS = parseFloat(($('#costShip')||{}).value)||0; var pV = parseFloat(($('#priceSell')||{}).value)||0;
    var costo = cP + cS; var margen = pV - costo; var pct = pV>0 ? (margen/pV)*100 : 0;
    var fmt=function(n){return n.toFixed(2).replace('.', ',')+'€'};
    var kC=$('#kCoste'), kB=$('#kBenef'), kM=$('#kMargen'); if(kC) kC.textContent = fmt(costo); if(kB) kB.textContent = fmt(margen); if(kM) kM.textContent = (pct.toFixed(1)+'%');
    var b=$('#barFill'); if(b){ var w=Math.max(0,Math.min(100,pct)); b.style.width = w+'%'; }
    var kBr=$('#kBreak'), kMu=$('#kMarkup'); if(kBr) kBr.textContent = fmt(costo); if(kMu) kMu.textContent = '×'+(pV>0?(pV/costo||0).toFixed(2):'0.00');
  }
  var calcBtn = $('#calcBtn'); if(calcBtn) calcBtn.addEventListener('click', calcUpdate);
  ;

  ['#costProduct','#costShip','#priceSell'].forEach(function(sel){ var el=$(sel.replace('#','')); if(el){ el.addEventListener('input', calcUpdate); } });
  calcUpdate();

  // Footer year
  var y = new Date().getFullYear(); var yEl = $('#year'); if(yEl) yEl.textContent = y;

  // First bind and paint
  bindCards();
  updateUI();
})();

  document.addEventListener('click', function(e){ var t=e.target; if(t && t.matches('button.btn.primary[data-type]')){ try{ window.RF.adds=(window.RF.adds||0)+1; }catch(_){ } } });
