(function(){
  'use strict';
  
  // --- EFECTO SPOTLIGHT MOUSE (Lo complicado hecho fácil) ---
  document.addEventListener('mousemove', function(e) {
    const x = e.clientX;
    const y = e.clientY;
    document.body.style.setProperty('--mouse-x', x + 'px');
    document.body.style.setProperty('--mouse-y', y + 'px');
  });

  // --- CONFIGURACIÓN & ESTADO ---
  window.RF = window.RF || {};
  if(!window.CONFIG){ window.CONFIG = { pricing:{ providerUnit:2, bundles:{'4':6}, courseUnit:1, currency:'€' }, paypal:{ currency:'EUR' } }; }
  
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  
  function getCart(){ try{ return JSON.parse(localStorage.getItem('rf_cart')) || {providers:[], courses:[]}; }catch{ return {providers:[], courses:[]}; } }
  let cart = getCart();
  function saveCart(){ localStorage.setItem('rf_cart', JSON.stringify(cart)); updateUI(); }
  
  // --- LÓGICA DE PRECIOS ---
  function getTotals(){
    const uniqueP = [...new Set(cart.providers)];
    const pCount = uniqueP.length;
    let pPrice = 0;
    const unitP = CONFIG.pricing.providerUnit;
    const bundle4 = CONFIG.pricing.bundles['4'];
    
    if(pCount < 4) pPrice = pCount * unitP;
    else pPrice = bundle4 + (pCount - 4) * unitP;
    
    let cPrice = 0;
    cart.courses.forEach(c => cPrice += (c.qty||1) * CONFIG.pricing.courseUnit);
    
    const pNom = pCount * unitP;
    const saved = Math.max(0, pNom - pPrice);
    return { pCount, pPrice, cPrice, saved, total: pPrice + cPrice };
  }
  
  function formatMoney(n){ return n.toFixed(2).replace('.', ',') + '€'; }

  // --- UI UPDATES ---
  function updateUI(){
    const t = getTotals();
    const count = t.pCount + cart.courses.length;
    
    const badge = $('#cartCount');
    if(badge){
      badge.textContent = count;
      if(count > 0) badge.classList.add('pop'); 
      setTimeout(()=>badge.classList.remove('pop'), 300);
    }

    const sumTotal = $('#sumTotal');
    const sumSave = $('#sumSave');
    if(sumTotal) sumTotal.textContent = formatMoney(t.total);
    if(sumSave) sumSave.innerHTML = t.saved > 0 ? `🎉 Ahorras <span style="color:#4ade80">${formatMoney(t.saved)}</span>` : '';
    
    renderDrawerLines();
  }

  function renderDrawerLines(){
    const box = $('#cartLines');
    if(!box) return;
    
    if(cart.providers.length === 0 && cart.courses.length === 0){
      box.innerHTML = '<div style="text-align:center; padding:60px 20px; color:rgba(255,255,255,0.3); display:flex; flex-direction:column; align-items:center; gap:16px"><div style="font-size:40px;">🛒</div><div>Tu carrito está vacío</div></div>';
      return;
    }

    let html = '';
    const pNames = {p1:'Zapatillas', p2:'Vapers', p3:'Relojes', p4:'Colonias'};
    [...new Set(cart.providers)].forEach(id => {
      html += `<div class="line" style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:12px;">
        <div style="display:flex; gap:12px; align-items:center;">
           <div style="background:rgba(59,130,246,0.1); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px;">📦</div>
           <div><div style="font-weight:600; font-size:15px;">${pNames[id] || 'Proveedor'}</div><div style="font-size:12px; color:#94a3b8">Verificado</div></div>
        </div>
        <button class="btn-ghost" style="padding:8px; color:#f87171" onclick="window.RF.rmP('${id}')">✕</button>
      </div>`;
    });

    const cNames = {c1:'Curso Lujo', c2:'Curso Seguridad', c3:'Curso Anuncios'};
    cart.courses.forEach(c => {
      html += `<div class="line" style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:12px;">
        <div style="display:flex; gap:12px; align-items:center;">
           <div style="background:rgba(139,92,246,0.1); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px;">📚</div>
           <div><div style="font-weight:600; font-size:15px;">${cNames[c.id] || 'Guía PDF'}</div><div style="font-size:12px; color:#94a3b8">Digital</div></div>
        </div>
        <button class="btn-ghost" style="padding:8px; color:#f87171" onclick="window.RF.rmC('${c.id}')">✕</button>
      </div>`;
    });
    
    if(cart.providers.length > 0 && cart.courses.length === 0){
       html += `<div style="margin-top:24px; background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); border-radius:12px; padding:16px;">
         <div style="font-size:13px; margin-bottom:12px; color:#bfdbfe; line-height:1.4">💡 <strong>Consejo Pro:</strong> Protege tu cuenta con el Curso de Seguridad.</div>
         <button class="btn-glow" style="padding:10px; font-size:13px; min-height:auto" onclick="window.RF.addC('c2')">Añadir (+1€)</button>
       </div>`;
    }
    box.innerHTML = html;
  }

  // --- ACCIONES GLOBALES ---
  window.RF.addP = (id) => { if(cart.providers.includes(id)) return toast('Ya tienes este proveedor', 'error'); cart.providers.push(id); saveCart(); toast('Proveedor añadido'); openDrawer(); };
  window.RF.rmP = (id) => { cart.providers = cart.providers.filter(x => x!==id); saveCart(); };
  window.RF.addC = (id) => { if(cart.courses.find(x => x.id === id)) return toast('Ya tienes este curso', 'error'); cart.courses.push({id, qty:1}); saveCart(); toast('Curso añadido'); openDrawer(); };
  window.RF.rmC = (id) => { cart.courses = cart.courses.filter(x => x.id!==id); saveCart(); };

  function toast(msg, type='success'){
    const t = $('#toast');
    t.innerHTML = `<div style="background:${type==='error'?'rgba(127,29,29,0.9)':'rgba(6,78,59,0.9)'}; backdrop-filter:blur(10px); color:${type==='error'?'#fca5a5':'#a7f3d0'}; padding:12px 24px; border-radius:99px; box-shadow:0 10px 40px rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1); font-weight:600; font-size:14px;">${msg}</div>`;
    t.style.display = 'block'; t.style.animation = 'fadeUp 0.3s forwards';
    setTimeout(() => { t.style.display='none'; }, 3000);
  }

  // --- DRAWER ---
  const overlay = $('#cartOverlay');
  function openDrawer(){ document.body.classList.add('cart-open'); overlay.style.display='block'; setTimeout(() => overlay.style.opacity = '1', 10); }
  function closeDrawer(){ document.body.classList.remove('cart-open'); overlay.style.opacity = '0'; setTimeout(()=> overlay.style.display='none', 300); }
  
  if($('#openCart')) $('#openCart').addEventListener('click', openDrawer);
  if($('#closeCart')) $('#closeCart').addEventListener('click', closeDrawer);
  if(overlay) overlay.addEventListener('click', closeDrawer);
  if($('#clearCart')) $('#clearCart').addEventListener('click', () => { cart={providers:[],courses:[]}; saveCart(); });
  if($('#toCheckout')) $('#toCheckout').addEventListener('click', () => window.location.href='checkout.html');

  // --- CONTACT FORM LOGIC ---
  const contactForm = $('#contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
        e.preventDefault();
        const btn = contactForm.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Enviando...';
        btn.disabled = true;
        
        // Simulación de envío
        setTimeout(() => {
            btn.textContent = '¡Enviado!';
            btn.style.background = 'var(--accent-success)';
            toast('Mensaje recibido. Te responderemos pronto.');
            contactForm.reset();
            setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 3000);
        }, 1500);
    });
  }

  // --- COOKIES ---
  (function initCookies(){
    const banner = $('#cookieBanner');
    if(!localStorage.getItem('rf_cookie_consent') && banner) banner.style.display = 'flex'; 
    else if(banner) banner.style.display = 'none';

    function handleConsent(choice) {
        localStorage.setItem('rf_cookie_consent', choice);
        if(banner) { banner.style.opacity = '0'; setTimeout(() => banner.style.display = 'none', 500); }
    }
    if($('#cookieAccept')) $('#cookieAccept').addEventListener('click', () => handleConsent('accept'));
    if($('#cookieReject')) $('#cookieReject').addEventListener('click', () => handleConsent('reject'));
  })();

  document.addEventListener('click', e => {
    const btn = e.target.closest('button[data-type]');
    if(!btn) return;
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    if(type === 'provider') window.RF.addP(id);
    if(type === 'course') window.RF.addC(id);
  });

  // --- CALCULATOR & SCROLL ---
  function updateCalc(){
    const cost = parseFloat($('#costProduct').value) || 0;
    const ship = parseFloat($('#costShip').value) || 0;
    const sell = parseFloat($('#priceSell').value) || 0;
    localStorage.setItem('rf_calc_state', JSON.stringify({cost, ship, sell}));
    
    const totalCost = cost + ship;
    const profit = sell - totalCost;
    const margin = sell > 0 ? (profit / sell) * 100 : 0;
    
    $('#kCoste').textContent = formatMoney(totalCost);
    const kBenef = $('#kBenef');
    kBenef.textContent = formatMoney(profit);
    kBenef.style.color = profit > 0 ? '#4ade80' : (profit < 0 ? '#f87171' : 'white');
    $('#kMargen').textContent = margin.toFixed(1) + '%';
  }
  
  if($('#calcBtn')){
    const savedCalc = JSON.parse(localStorage.getItem('rf_calc_state'));
    if(savedCalc){ $('#costProduct').value = savedCalc.cost || ''; $('#costShip').value = savedCalc.ship || ''; $('#priceSell').value = savedCalc.sell || ''; }
    $('#calcBtn').addEventListener('click', updateCalc);
    $$('.calc-grid input').forEach(i => i.addEventListener('input', updateCalc));
    updateCalc();
  }

  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.1 });
  $$('.reveal').forEach(el => observer.observe(el));
  
  $$('.stagger-grid').forEach(grid => {
    const children = Array.from(grid.children);
    children.forEach((child, index) => {
      child.style.opacity = '0'; child.style.transform = 'translateY(20px)';
      child.style.transition = `all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 0.1}s`;
      const gridObs = new IntersectionObserver((entries) => { if(entries[0].isIntersecting){ child.style.opacity = '1'; child.style.transform = 'translateY(0)'; } }, {threshold:0.1});
      gridObs.observe(grid);
    });
  });

  updateUI();
})();
