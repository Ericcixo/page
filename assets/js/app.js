(function(){
  'use strict';
  
  // --- EFECTO PARALLAX DE FONDO ---
  document.addEventListener('mousemove', function(e) {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    const glow1 = document.querySelector('.glow-1');
    const glow2 = document.querySelector('.glow-2');
    const glow3 = document.querySelector('.glow-3');
    
    if(glow1) glow1.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
    if(glow2) glow2.style.transform = `translate(-${x * 40}px, -${y * 40}px)`;
    if(glow3) glow3.style.transform = `translate(${x * 20}px, -${y * 20}px)`;
  });

  // --- THEME TOGGLE ---
  const themeBtn = document.querySelector('#themeToggle');
  const themeIcon = document.querySelector('#themeIcon');
  const html = document.documentElement;

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('rf_theme', theme);
    if(themeIcon) themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  const savedTheme = localStorage.getItem('rf_theme') || 'dark';
  setTheme(savedTheme);

  if(themeBtn) {
    themeBtn.addEventListener('click', () => {
      setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

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
    cart.courses.forEach(c => cPrice += CONFIG.pricing.courseUnit);
    
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
      if(count > 0) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
    }

    const sumTotal = $('#sumTotal');
    const sumSave = $('#sumSave');
    if(sumTotal) sumTotal.textContent = formatMoney(t.total);
    if(sumSave) sumSave.innerHTML = t.saved > 0 ? `🎉 Ahorras <span style="color:var(--accent-success)">${formatMoney(t.saved)}</span>` : '';
    
    renderDrawerLines();
  }

  function renderDrawerLines(){
    const box = $('#cartLines');
    if(!box) return;
    
    if(cart.providers.length === 0 && cart.courses.length === 0){
      box.innerHTML = '<div style="text-align:center; padding:60px 20px; opacity:0.5; display:flex; flex-direction:column; align-items:center; gap:16px"><div style="font-size:40px;">🛒</div><div>Tu carrito está vacío</div></div>';
      return;
    }

    let html = '';
    const pNames = {p1:'Zapatillas', p2:'Vapers', p3:'Relojes', p4:'Colonias'};
    [...new Set(cart.providers)].forEach(id => {
      html += `<div class="line" style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px dashed var(--border-light); padding-bottom:12px;">
        <div style="display:flex; gap:12px; align-items:center;">
           <div style="background:rgba(59,130,246,0.1); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px;">📦</div>
           <div><div style="font-weight:600; font-size:15px;">${pNames[id] || 'Proveedor'}</div><div style="font-size:12px; opacity:0.7">Verificado</div></div>
        </div>
        <button class="btn-ghost" style="padding:8px; color:var(--danger)" onclick="window.RF.rmP('${id}')">✕</button>
      </div>`;
    });

    const cNames = {c1:'Curso Lujo', c2:'Curso Seguridad', c3:'Curso Anuncios'};
    cart.courses.forEach(c => {
      html += `<div class="line" style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px dashed var(--border-light); padding-bottom:12px;">
        <div style="display:flex; gap:12px; align-items:center;">
           <div style="background:rgba(139,92,246,0.1); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px;">📚</div>
           <div><div style="font-weight:600; font-size:15px;">${cNames[c.id] || 'Guía PDF'}</div><div style="font-size:12px; opacity:0.7">Digital</div></div>
        </div>
        <button class="btn-ghost" style="padding:8px; color:var(--danger)" onclick="window.RF.rmC('${c.id}')">✕</button>
      </div>`;
    });
    
    if(cart.providers.length > 0 && cart.courses.length === 0){
       html += `<div style="margin-top:24px; background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); border-radius:12px; padding:16px;">
         <div style="font-size:13px; margin-bottom:12px; opacity:0.8; line-height:1.4">💡 <strong>Consejo Pro:</strong> Protege tu cuenta con el Curso de Seguridad.</div>
         <button class="btn-glow" style="padding:10px; font-size:13px; min-height:auto; width:100%" onclick="window.RF.addC('c2')">Añadir (+1€)</button>
       </div>`;
    }
    box.innerHTML = html;
  }

  // --- ACCIONES GLOBALES ---
  window.RF = {
    addP: (id) => { if(cart.providers.includes(id)) return toast('Ya tienes este proveedor', 'error'); cart.providers.push(id); saveCart(); toast('Proveedor añadido'); openDrawer(); },
    rmP: (id) => { cart.providers = cart.providers.filter(x => x!==id); saveCart(); },
    addC: (id) => { if(cart.courses.find(x => x.id === id)) return toast('Ya tienes este curso', 'error'); cart.courses.push({id, qty:1}); saveCart(); toast('Curso añadido'); openDrawer(); },
    rmC: (id) => { cart.courses = cart.courses.filter(x => x.id!==id); saveCart(); }
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('button[data-type]');
    if(!btn) return;
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    if(type === 'provider') window.RF.addP(id);
    if(type === 'course') window.RF.addC(id);
  });

  // --- DRAWER ---
  const overlay = $('#cartOverlay');
  function openDrawer(){ 
    document.body.classList.add('cart-open'); 
    overlay.style.display='block'; 
    requestAnimationFrame(()=>overlay.style.opacity='1');
  }
  function closeDrawer(){ 
    document.body.classList.remove('cart-open'); 
    overlay.style.opacity='0'; 
    setTimeout(()=>overlay.style.display='none', 400); 
  }
  
  if($('#openCart')) $('#openCart').addEventListener('click', openDrawer);
  if($('#closeCart')) $('#closeCart').addEventListener('click', closeDrawer);
  if(overlay) overlay.addEventListener('click', closeDrawer);
  if($('#clearCart')) $('#clearCart').addEventListener('click', () => { cart={providers:[],courses:[]}; saveCart(); });
  if($('#toCheckout')) $('#toCheckout').addEventListener('click', () => window.location.href='checkout.html');

  // --- COOKIES (FIXED) ---
  // Esperamos a que el DOM esté listo
  // --- COOKIES (AVANZADO) ---
  (function initCookies(){
    const banner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('cookieAccept');
    const rejectBtn = document.getElementById('cookieReject');

    if (!banner || !acceptBtn || !rejectBtn) return;

    // Comprobar si ya existe decisión
    const hasConsent = localStorage.getItem('rf_cookie_consent');

    if (!hasConsent) {
        // Forzar visualización si no hay consentimiento
        banner.style.display = 'flex';
        // Pequeño delay para asegurar que la opacidad transición funcione si usas fade
        setTimeout(() => banner.style.opacity = '1', 100);
    } else {
        banner.style.display = 'none';
    }

    function handleConsent(choice) {
        // 1. Guardar en navegador
        localStorage.setItem('rf_cookie_consent', choice);
        
        // 2. Ocultar banner
        banner.style.opacity = '0';
        setTimeout(() => banner.style.display = 'none', 500);

        // 3. Enviar datos al servidor (cookies.php)
        const fd = new FormData();
        fd.append('choice', choice);
        
        // Usar navigator.sendBeacon si está disponible (es más fiable al cerrar página)
        if (navigator.sendBeacon) {
            const data = new URLSearchParams();
            data.append('choice', choice);
            navigator.sendBeacon('cookies.php', data);
        } else {
            // Fallback tradicional
            fetch('cookies.php', {
                method: 'POST',
                body: fd
            }).catch(err => console.error('Error logging consent:', err));
        }
    }

    acceptBtn.addEventListener('click', () => handleConsent('accept'));
    rejectBtn.addEventListener('click', () => handleConsent('reject'));
  })();

  // --- CALCULATOR ---
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
    kBenef.style.color = profit > 0 ? 'var(--accent-success)' : (profit < 0 ? 'var(--danger)' : 'inherit');
    $('#kMargen').textContent = margin.toFixed(1) + '%';
  }
  
  if($('#calcBtn')){
    const saved = JSON.parse(localStorage.getItem('rf_calc_state'));
    if(saved){ $('#costProduct').value = saved.cost||''; $('#costShip').value = saved.ship||''; $('#priceSell').value = saved.sell||''; }
    $('#calcBtn').addEventListener('click', updateCalc);
    $$('.calc-grid input').forEach(i => i.addEventListener('input', updateCalc));
    updateCalc();
  }

  // Animaciones Scroll
  const observer = new IntersectionObserver((entries) => { entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); observer.unobserve(e.target); } }); }, { threshold: 0.1 });
  $$('.reveal').forEach(el => observer.observe(el));
  
  $$('.stagger-grid').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      child.style.opacity = '0'; child.style.transform = 'translateY(20px)';
      child.style.transition = `all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 0.1}s`;
      const go = new IntersectionObserver((es) => { if(es[0].isIntersecting){ child.style.opacity = '1'; child.style.transform = 'translateY(0)'; } });
      go.observe(grid);
    });
  });

  function toast(msg, type='success'){
    const t = $('#toast');
    if(!t) return;
    t.innerHTML = `<div style="background:var(--bg-card); backdrop-filter:blur(10px); color:${type==='error'?'var(--danger)':'var(--primary)'}; padding:12px 24px; border-radius:99px; box-shadow:0 10px 40px rgba(0,0,0,0.5); border:1px solid var(--border-light); font-weight:600;">${msg}</div>`;
    t.style.display = 'block'; t.style.animation = 'fadeUp 0.3s forwards';
    setTimeout(() => { t.style.display='none'; }, 3000);
  }

  updateUI();
})();
