(function(){
  'use strict';
  
  const CONFIG = window.RF_CONFIG; // Referencia al config maestro
  if(!CONFIG) console.error("Error Crítico: config.js no cargado");

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // --- 1. OPTIMIZACIÓN RENDIMIENTO (PARALLAX) ---
  // Usamos requestAnimationFrame para no saturar la CPU
  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateParallax() {
    // Interpolación lineal (Lerp) para movimiento ultra suave
    currentX += (mouseX - currentX) * 0.1;
    currentY += (mouseY - currentY) * 0.1;

    // Actualizar variables CSS para el foco
    document.body.style.setProperty('--mouse-x', currentX + 'px');
    document.body.style.setProperty('--mouse-y', currentY + 'px');

    // Mover capas de fondo (Glows)
    const xPct = currentX / window.innerWidth;
    const yPct = currentY / window.innerHeight;

    const g1 = $('.glow-1');
    const g2 = $('.glow-2');
    const g3 = $('.glow-3');

    if(g1) g1.style.transform = `translate(${xPct * 30}px, ${yPct * 30}px)`;
    if(g2) g2.style.transform = `translate(-${xPct * 40}px, -${yPct * 40}px)`;
    if(g3) g3.style.transform = `translate(${xPct * 20}px, -${yPct * 20}px)`;

    requestAnimationFrame(animateParallax);
  }
  animateParallax(); // Iniciar loop de animación

  // --- 2. GESTIÓN DEL TEMA (Dark/Light) ---
  const themeBtn = $('#themeToggle');
  const themeIcon = $('#themeIcon');
  const html = document.documentElement;

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('rf_theme', theme);
    if(themeIcon) themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
  // Cargar preferencia guardada
  setTheme(localStorage.getItem('rf_theme') || 'dark');

  if(themeBtn) {
    themeBtn.addEventListener('click', () => {
      setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  // --- 3. LÓGICA DEL CARRITO (Centralizada) ---
  let cart = { providers: [], courses: [] };
  try {
    cart = JSON.parse(localStorage.getItem('rf_cart')) || cart;
  } catch(e) { localStorage.removeItem('rf_cart'); }

  function saveCart(){ 
    localStorage.setItem('rf_cart', JSON.stringify(cart)); 
    updateUI(); 
  }

  // Cálculo de totales usando CONFIG
  function getTotals(){
    const uniqueP = [...new Set(cart.providers)];
    const pCount = uniqueP.length;
    
    // Lógica inteligente desde Config
    let pPrice = 0;
    const limit = CONFIG.pricing.bundleThreshold; // 4
    
    if(pCount < limit) {
        pPrice = pCount * CONFIG.pricing.providerUnit;
    } else {
        // Precio base del pack + extras unitarios
        pPrice = CONFIG.pricing.bundlePrice + ((pCount - limit) * CONFIG.pricing.providerUnit);
    }
    
    let cPrice = 0;
    cart.courses.forEach(c => cPrice += CONFIG.pricing.courseUnit);
    
    const pNominal = pCount * CONFIG.pricing.providerUnit;
    const saved = Math.max(0, pNominal - pPrice);
    
    return { 
      total: pPrice + cPrice, 
      saved: saved, 
      count: pCount + cart.courses.length 
    };
  }

  function formatMoney(n){ return n.toFixed(2).replace('.', ',') + CONFIG.pricing.currency; }

  function updateUI(){
    const t = getTotals();
    
    // Badges
    const badge = $('#cartCount');
    if(badge){
      badge.textContent = t.count;
      if(t.count > 0) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
    }

    // Drawer Footer
    const sumTotal = $('#sumTotal');
    const sumSave = $('#sumSave');
    if(sumTotal) sumTotal.textContent = formatMoney(t.total);
    if(sumSave) sumSave.innerHTML = t.saved > 0 ? `🎉 Ahorras <span style="color:var(--accent-success)">${formatMoney(t.saved)}</span>` : '';
    
    renderCartItems();
  }

  function renderCartItems(){
    const box = $('#cartLines');
    if(!box) return;
    
    const allItems = [
      ...[...new Set(cart.providers)].map(id => ({id, ...CONFIG.products[id]})),
      ...cart.courses.map(c => ({id: c.id, ...CONFIG.products[c.id]}))
    ];

    if(allItems.length === 0){
      box.innerHTML = '<div style="text-align:center; padding:60px 20px; opacity:0.5; display:flex; flex-direction:column; align-items:center; gap:16px"><div style="font-size:40px;">🛒</div><div>Tu carrito está vacío</div></div>';
      return;
    }

    box.innerHTML = allItems.map(item => `
      <div class="line" style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px dashed var(--border-light); padding-bottom:12px;">
        <div style="display:flex; gap:12px; align-items:center;">
           <div style="background:rgba(59,130,246,0.1); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px;">${item.icon||'📦'}</div>
           <div>
             <div style="font-weight:600; font-size:15px;">${item.name || 'Producto Desconocido'}</div>
             <div style="font-size:12px; opacity:0.7">${item.type === 'provider' ? 'Verificado' : 'Digital'}</div>
           </div>
        </div>
        <button class="btn-ghost" style="padding:8px; color:var(--danger)" data-remove="${item.id}" aria-label="Eliminar">✕</button>
      </div>
    `).join('');
    
    // Cross-selling inteligente
    if(cart.providers.length > 0 && cart.courses.length === 0){
       box.innerHTML += `<div style="margin-top:24px; background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); border-radius:12px; padding:16px;">
         <div style="font-size:13px; margin-bottom:12px; opacity:0.9; line-height:1.4">💡 <strong>Consejo Pro:</strong> Protege tu cuenta con el Curso de Seguridad.</div>
         <button class="btn-glow" style="padding:10px; font-size:13px; min-height:auto; width:100%" onclick="window.RF.addC('c2')">Añadir (+1€)</button>
       </div>`;
    }
  }

  // --- 4. INTERACCIONES ---
  // Exponemos funciones globales para los onclick del HTML
  window.RF = {
    addP: (id) => { if(cart.providers.includes(id)) return toast('Ya tienes este proveedor', 'error'); cart.providers.push(id); saveCart(); toast('Proveedor añadido'); openDrawer(); },
    rmP: (id) => { cart.providers = cart.providers.filter(x => x!==id); saveCart(); },
    addC: (id) => { if(cart.courses.find(x => x.id === id)) return toast('Ya tienes este curso', 'error'); cart.courses.push({id, qty:1}); saveCart(); toast('Curso añadido'); openDrawer(); },
    rmC: (id) => { cart.courses = cart.courses.filter(x => x.id!==id); saveCart(); }
  };

  // Delegación de eventos (Mejor rendimiento que muchos listeners)
  document.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if(!btn) return;

    // Botones de añadir
    if(btn.dataset.type === 'provider') window.RF.addP(btn.dataset.id);
    if(btn.dataset.type === 'course') window.RF.addC(btn.dataset.id);
    
    // Botones de eliminar en el carrito
    if(btn.dataset.remove) {
       const id = btn.dataset.remove;
       if(CONFIG.products[id].type === 'provider') window.RF.rmP(id);
       else window.RF.rmC(id);
    }
  });

  // Drawer Logic
  const overlay = $('#cartOverlay');
  function openDrawer(){ document.body.classList.add('cart-open'); overlay.style.display='block'; requestAnimationFrame(()=>overlay.style.opacity='1'); }
  function closeDrawer(){ document.body.classList.remove('cart-open'); overlay.style.opacity='0'; setTimeout(()=>overlay.style.display='none', 400); }
  
  if($('#openCart')) $('#openCart').addEventListener('click', openDrawer);
  if($('#closeCart')) $('#closeCart').addEventListener('click', closeDrawer);
  if(overlay) overlay.addEventListener('click', closeDrawer);
  if($('#clearCart')) $('#clearCart').addEventListener('click', () => { cart={providers:[],courses:[]}; saveCart(); });
  if($('#toCheckout')) $('#toCheckout').addEventListener('click', () => window.location.href='checkout');

  // Utilidad Toast
  function toast(msg, type='success'){
    const t = $('#toast');
    if(!t) return;
    t.innerHTML = `<div style="background:var(--bg-card); backdrop-filter:blur(10px); color:${type==='error'?'var(--danger)':'var(--accent-success)'}; padding:12px 24px; border-radius:99px; box-shadow:0 10px 40px rgba(0,0,0,0.5); border:1px solid var(--border-light); font-weight:600;">${msg}</div>`;
    t.style.display = 'block'; t.style.animation = 'fadeUp 0.3s forwards';
    setTimeout(() => { t.style.display='none'; }, 3000);
  }

  // Calculadora
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

  // Inicializar UI
  updateUI();
})();
