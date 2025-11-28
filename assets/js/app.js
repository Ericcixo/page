(function(){
  'use strict';
  
  // --- CONFIGURACIÓN & ESTADO ---
  window.RF = window.RF || {};
  if(!window.CONFIG){ window.CONFIG = { pricing:{ providerUnit:2, bundles:{'4':6}, courseUnit:1, currency:'€' }, paypal:{ currency:'EUR' } }; }
  
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  
  // Estado del Carrito (Safe Parse)
  function getCart(){ try{ return JSON.parse(localStorage.getItem('rf_cart')) || {providers:[], courses:[]}; }catch{ return {providers:[], courses:[]}; } }
  let cart = getCart();
  
  function saveCart(){ localStorage.setItem('rf_cart', JSON.stringify(cart)); updateUI(); }
  
  // --- LÓGICA DE PRECIOS ---
  function getTotals(){
    const uniqueP = [...new Set(cart.providers)];
    const pCount = uniqueP.length;
    
    // Lógica Bundle: 1=2€, 2=4€, 3=6€, 4=6€ (OFERTA), 5=8€...
    // Interpretación: Hasta 3 es unitario, 4 es el pack, a partir de 4 sumamos unitario
    let pPrice = 0;
    const unitP = CONFIG.pricing.providerUnit;
    const bundle4 = CONFIG.pricing.bundles['4']; // 6€
    
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
    
    // Badges
    const badge = $('#cartCount');
    if(badge){
      badge.textContent = count;
      if(count > 0) badge.classList.add('pop'); 
      setTimeout(()=>badge.classList.remove('pop'), 300);
    }

    // Drawer Footer
    const sumTotal = $('#sumTotal');
    const sumSave = $('#sumSave');
    if(sumTotal) sumTotal.textContent = formatMoney(t.total);
    if(sumSave) sumSave.innerHTML = t.saved > 0 ? `🎉 Te ahorras <span style="color:#4ade80">${formatMoney(t.saved)}</span>` : '';
    
    renderDrawerLines();
  }

  function renderDrawerLines(){
    const box = $('#cartLines');
    if(!box) return;
    
    if(cart.providers.length === 0 && cart.courses.length === 0){
      box.innerHTML = '<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3)">Tu carrito está vacío<br>🛒</div>';
      return;
    }

    let html = '';
    // Proveedores (con Nombres bonitos)
    const pNames = {p1:'Zapatillas', p2:'Vapers', p3:'Relojes', p4:'Colonias'};
    [...new Set(cart.providers)].forEach(id => {
      html += `
      <div class="line" style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:8px;">
        <div>
          <div style="font-weight:600">${pNames[id] || 'Proveedor'}</div>
          <div style="font-size:12px; color:#94a3b8">Proveedor Verificado</div>
        </div>
        <button class="btn-ghost" style="padding:4px 8px; font-size:12px; color:#f87171" onclick="window.RF.rmP('${id}')">Eliminar</button>
      </div>`;
    });

    // Cursos
    const cNames = {c1:'Curso Lujo', c2:'Curso Seguridad', c3:'Curso Anuncios'};
    cart.courses.forEach(c => {
      html += `
      <div class="line" style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:8px;">
        <div>
          <div style="font-weight:600">${cNames[c.id] || 'Guía PDF'}</div>
          <div style="font-size:12px; color:#94a3b8">Formato Digital</div>
        </div>
        <button class="btn-ghost" style="padding:4px 8px; font-size:12px; color:#f87171" onclick="window.RF.rmC('${c.id}')">Eliminar</button>
      </div>`;
    });
    
    // Cross-sell inteligente
    if(cart.providers.length > 0 && cart.courses.length === 0){
       html += `<div style="margin-top:20px; background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.2); border-radius:12px; padding:12px;">
         <div style="font-size:13px; margin-bottom:8px;">💡 <strong>Consejo Pro:</strong> Protege tu cuenta con el Curso de Seguridad.</div>
         <button class="btn-glow" style="padding:8px; font-size:13px;" onclick="window.RF.addC('c2')">Añadir (+1€)</button>
       </div>`;
    }

    box.innerHTML = html;
  }

  // --- ACTIONS ---
  window.RF.addP = (id) => { 
    if(cart.providers.includes(id)) return toast('Ya tienes este proveedor', 'error');
    cart.providers.push(id); saveCart(); toast('Proveedor añadido'); openDrawer();
  };
  window.RF.rmP = (id) => { cart.providers = cart.providers.filter(x => x!==id); saveCart(); };
  
  window.RF.addC = (id) => {
    if(cart.courses.find(x => x.id === id)) return toast('Ya tienes este curso', 'error');
    cart.courses.push({id, qty:1}); saveCart(); toast('Curso añadido'); openDrawer();
  };
  window.RF.rmC = (id) => { cart.courses = cart.courses.filter(x => x.id!==id); saveCart(); };

  // Toast System
  function toast(msg, type='success'){
    const t = $('#toast');
    t.innerHTML = `<div style="background:${type==='error'?'#7f1d1d':'#064e3b'}; color:${type==='error'?'#fca5a5':'#a7f3d0'}; padding:12px 24px; border-radius:99px; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); font-weight:600">${msg}</div>`;
    t.style.display = 'block'; t.style.animation = 'fadeUp 0.3s forwards';
    setTimeout(() => { t.style.display='none'; }, 3000);
  }

  // --- DRAWER LOGIC ---
  const drawer = $('#cartDrawer');
  const overlay = $('#cartOverlay');
  function openDrawer(){ document.body.classList.add('cart-open'); overlay.style.display='block'; }
  function closeDrawer(){ document.body.classList.remove('cart-open'); setTimeout(()=>overlay.style.display='none', 300); }
  
  $('#openCart').addEventListener('click', openDrawer);
  $('#closeCart').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  $('#clearCart').addEventListener('click', () => { cart={providers:[],courses:[]}; saveCart(); });
  $('#toCheckout').addEventListener('click', () => window.location.href='checkout.html');

  // --- BINDING CLICKS ---
  document.addEventListener('click', e => {
    const btn = e.target.closest('button[data-type]');
    if(!btn) return;
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    if(type === 'provider') window.RF.addP(id);
    if(type === 'course') window.RF.addC(id);
  });

  // --- CALCULATOR PRO ---
  function updateCalc(){
    const cost = parseFloat($('#costProduct').value) || 0;
    const ship = parseFloat($('#costShip').value) || 0;
    const sell = parseFloat($('#priceSell').value) || 0;
    
    // Save state
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
  
  // Restore Calc & Bind
  const savedCalc = JSON.parse(localStorage.getItem('rf_calc_state'));
  if(savedCalc){
    $('#costProduct').value = savedCalc.cost || '';
    $('#costShip').value = savedCalc.ship || '';
    $('#priceSell').value = savedCalc.sell || '';
  }
  $('#calcBtn').addEventListener('click', updateCalc);
  $$('.calc-grid input').forEach(i => i.addEventListener('input', updateCalc));
  updateCalc();

  // --- SCROLL ANIMATIONS (Intersection Observer) ---
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Solo animar una vez
      }
    });
  }, { threshold: 0.1 });

  $$('.reveal').forEach(el => observer.observe(el));
  
  // Staggered Grid Animation
  $$('.stagger-grid').forEach(grid => {
    const children = Array.from(grid.children);
    children.forEach((child, index) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(20px)';
      child.style.transition = `all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 0.1}s`;
      
      const gridObs = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting){
          child.style.opacity = '1';
          child.style.transform = 'translateY(0)';
        }
      }, {threshold:0.1});
      gridObs.observe(grid);
    });
  });

  updateUI();
})();
