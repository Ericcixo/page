(function(){
  'use strict';
  
  const CONFIG = window.RF_CONFIG;
  if(!CONFIG) { console.error('Falta configuración'); return; }

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  
  // --- ANIMACIONES REVEAL (Corrección Pantalla Vacía) ---
  const observer = new IntersectionObserver((entries) => { 
    entries.forEach(e => { 
      if(e.isIntersecting){ 
        e.target.classList.add('visible'); 
        observer.unobserve(e.target); 
      } 
    }); 
  }, { threshold: 0.1 });
  $$('.reveal').forEach(el => observer.observe(el));

  // Recuperar carrito
  let cart = { providers: [], courses: [] };
  try { cart = JSON.parse(localStorage.getItem('rf_cart')) || cart; } catch(e){}

  // Cálculo de totales
  function getSecureTotal() {
    const uniqueP = [...new Set(cart.providers)].length;
    let pPrice = 0;
    if(uniqueP < CONFIG.pricing.bundleThreshold) {
        pPrice = uniqueP * CONFIG.pricing.providerUnit;
    } else {
        pPrice = CONFIG.pricing.bundlePrice + ((uniqueP - CONFIG.pricing.bundleThreshold) * CONFIG.pricing.providerUnit);
    }
    
    let cPrice = 0;
    cart.courses.forEach(c => cPrice += CONFIG.pricing.courseUnit);
    
    return (pPrice + cPrice).toFixed(2);
  }

  function renderSummary(){
    const s = $('#summary');
    const total = getSecureTotal();
    
    if(parseFloat(total) <= 0){
        s.innerHTML = '<div style="text-align:center; padding:20px;">Tu carrito está vacío.<br><a href="index.html" style="color:var(--primary); text-decoration:none; font-weight:600; margin-top:10px; display:inline-block;">Volver a la tienda</a></div>';
        return;
    }

    const pList = [...new Set(cart.providers)].map(id => CONFIG.products[id]?.name || id).join(', ') || 'Ninguno';
    const cList = cart.courses.map(c => CONFIG.products[c.id]?.name || c.id).join(', ') || 'Ninguno';

    s.innerHTML = `
      <div style="margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--border-light);">
        <div style="font-size:13px; color:var(--text-muted); margin-bottom:6px;">Proveedores</div>
        <div style="color:var(--text-main); font-weight:500;">${pList}</div>
      </div>
      <div style="margin-bottom:20px;">
        <div style="font-size:13px; color:var(--text-muted); margin-bottom:6px;">Cursos</div>
        <div style="color:var(--text-main); font-weight:500;">${cList}</div>
      </div>
      <div style="margin-top:24px; padding-top:20px; border-top:1px dashed var(--border-light); display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:18px; font-weight:600;">Total a pagar:</span>
        <span style="font-size:28px; font-weight:800; color:var(--accent);">${total}${CONFIG.pricing.currency}</span>
      </div>
    `;
  }

  renderSummary();

  // Integración PayPal
  const checkbox = $('#acceptTerms');
  const container = $('#paypalContainer');
  const notice = $('#payNotice');
  const errorBox = $('#errorBox');

  function mountPayPal(){
    if(!window.paypal || !window.paypal.Buttons) return;
    container.innerHTML = ''; 

    paypal.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
      
      onInit: function(data, actions) {
        actions.disable(); // Empezar deshabilitado
        checkbox.addEventListener('change', () => {
          checkbox.checked ? actions.enable() : actions.disable();
          notice.style.display = checkbox.checked ? 'none' : 'block';
        });
      },

      createOrder: function(data, actions) {
        const amount = getSecureTotal();
        if(amount <= 0) return;
        
        return actions.order.create({
          purchase_units: [{
            description: 'RevendeFácil Pedido Digital',
            amount: { currency_code: CONFIG.paypal.currency, value: amount }
          }],
          application_context: { shipping_preference: 'NO_SHIPPING' }
        });
      },

      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          window.location.href = 'gracias.html?orderId=' + encodeURIComponent(details.id);
        });
      },

      onError: function(err) {
        console.error(err);
        errorBox.style.display = 'block';
        errorBox.textContent = 'Hubo un problema con el pago. Inténtalo de nuevo.';
      }
    }).render('#paypalContainer');
  }

  const checkPP = setInterval(() => {
    if(window.paypal){
      clearInterval(checkPP);
      mountPayPal();
    }
  }, 100);

})();
