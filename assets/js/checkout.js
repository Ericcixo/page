(function(){
  'use strict';
  
  // Referencias seguras a precios (Hardcoded para seguridad)
  // Esto evita que alguien cambie window.CONFIG en la consola para pagar menos.
  var SAFE_PRICES = {
    providerUnit: 2,
    bundles: {'2':4, '3':5, '4':6},
    courseUnit: 1
  };

  if(!window.CONFIG){ window.CONFIG = { pricing:{ providerUnit:2, bundles:{'2':4,'3':5,'4':6}, courseUnit:1, currency:'€' }, paypal:{ currency:'EUR' } }; }
  
  function $(s){ return document.querySelector(s); }
  function sp(v){ try{return JSON.parse(v||'null')}catch(e){return null} }
  
  var cart = sp(localStorage.getItem('rf_cart')) || { providers: [], courses: [] };

  // Función de cálculo visual (usa CONFIG para flexibilidad visual)
  function providerBundlePrice(n){ if(n<=0) return 0; if(n===1) return CONFIG.pricing.providerUnit; if(n===2) return 4; if(n===3) return 5; return 6; }
  
  function totals(){ 
    var pc=cart.providers.length; 
    var pNom=pc*CONFIG.pricing.providerUnit; 
    var p=providerBundlePrice(pc); 
    var save=Math.max(0,pNom-p); 
    var c=0; 
    (cart.courses||[]).forEach(function(it){ c+=(it.qty||1)*CONFIG.pricing.courseUnit; }); 
    return {pc:pc,pNom:pNom,pPrice:p,pSave:save,cPrice:c,total:p+c}; 
  }

  // Función de cálculo SEGURO para PayPal (Ignora window.CONFIG)
  function getSecureTotal() {
    // 1. Calcular proveedores con lógica de bundles segura
    var pc = cart.providers.length;
    var priceProv = 0;
    if (pc === 1) priceProv = SAFE_PRICES.providerUnit;
    else if (pc === 2) priceProv = SAFE_PRICES.bundles['2'];
    else if (pc === 3) priceProv = SAFE_PRICES.bundles['3'];
    else if (pc >= 4) priceProv = SAFE_PRICES.bundles['4'];
    
    // 2. Calcular cursos
    var priceCourses = 0;
    (cart.courses||[]).forEach(function(it){ 
       // Forzamos cantidad a entero positivo para evitar decimales o negativos
       var q = Math.max(1, parseInt(it.qty) || 1);
       priceCourses += q * SAFE_PRICES.courseUnit; 
    });

    return (priceProv + priceCourses).toFixed(2);
  }

  function fe(n){ return (n||0).toFixed(2).replace('.', ',') + (CONFIG.pricing.currency||'€'); }
  
  function render(){ 
    var t=totals(); 
    var s=$('#summary'); 
    var prov = cart.providers.map(function(id){ return {p1:'Proveedor Zapatillas',p2:'Proveedor Vapers',p3:'Proveedor Relojes',p4:'Proveedor Colonias'}[id]||id; }).join(', ')||'—'; 
    var courses = cart.courses.map(function(it){ var name={c1:'Curso Lujo',c2:'Curso Seguridad',c3:'Curso Anuncios'}[it.id]||it.id; return name + (it.qty>1?(' ×'+it.qty):''); }).join(', ')||'—'; 
    
    s.innerHTML = '<div class="subtitle">Proveedores: '+prov+'</div>' + 
                  '<div class="subtitle">Cursos: '+courses+'</div>' + 
                  '<div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">' +
                  '<div><strong>Subtotal proveedores:</strong> '+fe(t.pPrice)+' '+(t.pSave>0?"<span style='color:#86efac; font-size:0.9em'>(ahorro "+fe(t.pSave)+")</span>":"")+'</div>' +
                  '<div><strong>Subtotal cursos:</strong> '+fe(t.cPrice)+'</div>' +
                  '<div style="margin-top:8px;font-size:20px; color:#a7f3d0"><strong>Total a pagar:</strong> '+fe(t.total)+'</div></div>'; 
  }
  render();

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
        // USAMOS EL TOTAL SEGURO AQUÍ
        var secureAmount = getSecureTotal();
        
        if(secureAmount <= 0){ alert('Tu carrito está vacío.'); return; } 
        
        return a.order.create({ 
          purchase_units: [{ 
            amount: { currency_code: (CONFIG.paypal.currency||'EUR'), value: secureAmount }, 
            description: 'RevendeFácil — Pedido digital' 
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
        if(eb){ eb.style.display='block'; eb.textContent='Error en el pago: Inténtalo de nuevo.'; }
        console.error(err);
      } 
    }).render('#paypalContainer'); 
  }
  
  var iv = setInterval(function(){ if(window.__paypalReady && window.paypal){ clearInterval(iv); if(checkbox && checkbox.checked){ mount(); } } }, 250);
  
  if(checkbox){ 
    checkbox.addEventListener('change', function(){ 
      if(checkbox.checked){ notice.textContent='PayPal listo.'; mount(); } 
      else { container.innerHTML=''; notice.textContent='Marca la casilla para habilitar el pago.'; } 
    }); 
  }
})();
