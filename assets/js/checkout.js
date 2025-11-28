(function(){
  'use strict';
  
  var SAFE_PRICES = {
    providerUnit: 2,
    bundles: {'2':4, '3':5, '4':6}, // 4 proveedores = 6€
    courseUnit: 1
  };

  if(!window.CONFIG){ window.CONFIG = { pricing:{ providerUnit:2, bundles:{'2':4,'3':5,'4':6}, courseUnit:1, currency:'€' }, paypal:{ currency:'EUR' } }; }
  
  function $(s){ return document.querySelector(s); }
  function sp(v){ try{return JSON.parse(v||'null')}catch(e){return null} }
  var cart = sp(localStorage.getItem('rf_cart')) || { providers: [], courses: [] };

  // --- LÓGICA DE PRECIOS VISUAL ---
  function getBundlePrice(n) {
    if (n <= 0) return 0;
    if (n === 1) return SAFE_PRICES.providerUnit;
    if (n === 2) return SAFE_PRICES.bundles['2'];
    if (n === 3) return SAFE_PRICES.bundles['3'];
    if (n === 4) return SAFE_PRICES.bundles['4'];
    // Si hay más de 4, cobramos el pack de 4 (6€) + precio unitario por cada extra
    // Ejemplo: 5 proveedores = 6€ + 2€ = 8€
    return SAFE_PRICES.bundles['4'] + ((n - 4) * SAFE_PRICES.providerUnit);
  }

  function totals(){ 
    // Usamos Set para eliminar duplicados si alguien manipuló localStorage
    var uniqueProviders = [...new Set(cart.providers)];
    var pc = uniqueProviders.length;
    
    var pPrice = getBundlePrice(pc);
    var pNom = pc * SAFE_PRICES.providerUnit;
    var save = Math.max(0, pNom - pPrice);
    
    var cPrice = 0; 
    (cart.courses||[]).forEach(function(it){ 
      var q = Math.max(1, parseInt(it.qty) || 1);
      cPrice += q * SAFE_PRICES.courseUnit; 
    });
    
    return {pc:pc, pNom:pNom, pPrice:pPrice, pSave:save, cPrice:cPrice, total:pPrice+cPrice}; 
  }

  function fe(n){ return (n||0).toFixed(2).replace('.', ',') + (CONFIG.pricing.currency||'€'); }
  
  function render(){ 
    var t=totals(); 
    var s=$('#summary'); 
    var provNombres = {p1:'Zapatillas', p2:'Vapers', p3:'Relojes', p4:'Colonias'};
    // Filtrar duplicados visualmente también
    var uniqueP = [...new Set(cart.providers)];
    
    var provText = uniqueP.map(function(id){ return provNombres[id] || 'Proveedor '+id; }).join(', ') || 'Ninguno';
    var courseText = cart.courses.map(function(it){ return (it.id==='c1'?'Lujo':it.id==='c2'?'Seguridad':'Anuncios') + (it.qty>1?' x'+it.qty:''); }).join(', ') || 'Ninguno';
    
    s.innerHTML = `
      <div class="subtitle" style="font-size:14px">Proveedores: <span style="color:white">${provText}</span></div>
      <div class="subtitle" style="font-size:14px">Cursos: <span style="color:white">${courseText}</span></div>
      <div style="margin-top:16px; border-top:1px solid rgba(255,255,255,0.1); padding-top:12px;">
        <div style="display:flex;justify-content:space-between"><span>Proveedores:</span> <span>${fe(t.pPrice)} ${t.pSave>0 ? '<small style="color:#86efac">(-'+fe(t.pSave)+')</small>' : ''}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Cursos:</span> <span>${fe(t.cPrice)}</span></div>
        <div style="display:flex;justify-content:space-between; margin-top:10px; font-size:20px; color:#a7f3d0; font-weight:bold;">
          <span>Total:</span> <span>${fe(t.total)}</span>
        </div>
      </div>`;
  }
  render();

  // --- PAYPAL ---
  var checkbox = $('#acceptTerms'); var container = $('#paypalContainer'); var notice = $('#payNotice');
  
  function mount(){ 
    if(!window.__paypalReady || !window.paypal || !paypal.Buttons) return; 
    container.innerHTML = ''; 
    
    pp.Buttons({ 
      style:{ layout:'vertical', color:'blue', shape:'rect', label:'pay' }, 
      onInit: function(d,a){ 
        if(!checkbox.checked) a.disable(); 
        checkbox.addEventListener('change', function(){ checkbox.checked ? a.enable() : a.disable(); }); 
      }, 
      createOrder: function(d,a){ 
        var t = totals(); // Usamos la función segura 'totals' que ya limpia duplicados
        if(t.total <= 0){ alert('El carrito está vacío.'); return; } 
        
        return a.order.create({ 
          purchase_units: [{ 
            amount: { currency_code: 'EUR', value: t.total.toFixed(2) }, 
            description: 'RevendeFácil Pedido (' + t.pc + ' prov, ' + cart.courses.length + ' cur)' 
          }], 
          application_context: { shipping_preference: 'NO_SHIPPING' } 
        }); 
      }, 
      onApprove: function(d,a){ 
        return a.order.capture().then(function(details){ 
          localStorage.setItem('rf_cart', JSON.stringify(cart)); 
          window.location.href = 'gracias.html?orderId=' + encodeURIComponent(details.id||''); 
        }); 
      }, 
      onError: function(err){ 
        var eb=document.getElementById('errorBox'); 
        if(eb){ eb.style.display='block'; eb.textContent='Hubo un error con PayPal. Por favor, recarga e intenta de nuevo.'; }
      } 
    }).render('#paypalContainer'); 
  }
  
  var iv = setInterval(function(){ if(window.__paypalReady && window.paypal){ clearInterval(iv); if(checkbox && checkbox.checked){ mount(); } } }, 250);
  if(checkbox){ checkbox.addEventListener('change', function(){ if(checkbox.checked){ notice.textContent='PayPal listo.'; mount(); } else { container.innerHTML=''; notice.textContent='Marca la casilla para habilitar el pago.'; } }); }
})();
