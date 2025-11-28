(function(){
  'use strict';
  
  const CONFIG = window.RF_CONFIG;
  if(!CONFIG) { alert('Error de configuración. Recarga la página.'); return; }

  const $ = (sel) => document.querySelector(sel);
  
  // Recuperar carrito
  let cart = { providers: [], courses: [] };
  try { cart = JSON.parse(localStorage.getItem('rf_cart')) || cart; } catch(e){}

  // Cálculo de totales (Reutiliza lógica si es posible o replícala exacta)
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
        s.innerHTML = '<div style="text-align:center; padding:20px;">Tu carrito está vacío.<br><a href="index.html" style="color:var(--primary)">Volver a la tienda</a></div>';
        return;
    }

    // Generar lista bonita usando nombres del CONFIG
    const pList = [...new Set(cart.providers)].map(id => CONFIG.products[id]?.name || id).join(', ') || 'Ninguno';
    const cList = cart.courses.map(c => CONFIG.products[c.id]?.name || c.id).join(', ') || 'Ninguno';

    s.innerHTML = `
      <div style="margin-bottom:16px;">
        <div style="font-size:14px; color:var(--text-muted); margin-bottom:4px;">Proveedores:</div>
        <div style="color:var(--text-main); font-weight:500;">${pList}</div>
      </div>
      <div style="margin-bottom:16px;">
        <div style="font-size:14px; color:var(--text-muted); margin-bottom:4px;">Cursos:</div>
        <div style="color:var(--text-main); font-weight:500;">${cList}</div>
      </div>
      <div style="margin-top:20px; border-top:1px solid var(--border-light); padding-top:16px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:18px;">Total a pagar:</span>
        <span style="font-size:24px; font-weight:800; color:var(--accent-success);">${total}${CONFIG.pricing.currency}</span>
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
    container.innerHTML = ''; // Limpiar previo

    paypal.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
      
      onInit: function(data, actions) {
        if(!checkbox.checked) actions.disable();
        checkbox.addEventListener('change', () => {
          checkbox.checked ? actions.enable() : actions.disable();
          notice.style.opacity = checkbox.checked ? '0' : '1';
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
          // Éxito: Redirigir
          window.location.href = 'gracias.html?orderId=' + encodeURIComponent(details.id);
        });
      },

      onError: function(err) {
        console.error(err);
        errorBox.style.display = 'block';
        errorBox.textContent = 'Hubo un problema con el pago. Por favor intenta de nuevo o usa tarjeta.';
      }
    }).render('#paypalContainer');
  }

  // Esperar a que cargue PayPal SDK
  const checkPP = setInterval(() => {
    if(window.paypal){
      clearInterval(checkPP);
      mountPayPal();
    }
  }, 100);

})();
