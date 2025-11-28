(function(){
  if(!window.I18N){ window.I18N = { en: {
    'hero.title': 'Verified suppliers to resell on Vinted with higher margin',
    'hero.subtitle': 'Connect with <strong>verified suppliers</strong> and get their details <strong>instantly</strong>. Add <strong>PDF courses</strong> (€1) to master pricing, listings and safety. Secure payment and friendly support.',
    'providers': 'Featured suppliers',
    'courses': 'PDF Courses',
    'calc': 'Profit calculator',
    'cost.product':'Product cost (€)','cost.ship':'Shipping cost (€)','price.sell':'Selling price (€)',
    'calc.btn':'Calculate','k.total':'Total cost','k.profit':'Profit','k.margin':'Margin',
    'add':'Add','minus':'-','cart.title':'Your cart','close':'Close','total':'Total:','clear':'Empty','checkout':'Go to Checkout →',
    'cookies.accept':'Accept','cookies.reject':'Reject'
  } }; }
  function setLang(lang){ localStorage.setItem('rf_lang',lang); applyLang(); }
  function t(k){ var en=(window.I18N||{}).en||{}; return en[k]||null; }
  function applyLang(){ var lang = localStorage.getItem('rf_lang') || (navigator.language||'').slice(0,2); if(lang!=='en') return; 
    var $ = function(q){return document.querySelector(q)}; var $$ = function(q){return Array.prototype.slice.call(document.querySelectorAll(q))};
    var m = t; var h1 = $('.hero h1'); if(h1){ h1.innerHTML = m('hero.title'); }
    var sub = $('.hero .subtitle'); if(sub){ sub.innerHTML = m('hero.subtitle'); }
    var pv = document.querySelector('#proveedores h2'); if(pv) pv.textContent = m('providers');
    var cr = document.querySelector('#cursos h2'); if(cr) cr.textContent = m('courses');
    var cc = document.querySelector('#calculadora h2'); if(cc) cc.textContent = m('calc');
    var labels = $$('#calculadora label'); if(labels[0]) labels[0].textContent = m('cost.product'); if(labels[1]) labels[1].textContent = m('cost.ship'); if(labels[2]) labels[2].textContent = m('price.sell');
    var k = $$('#calculadora .kpis .label'); if(k[0]) k[0].textContent = m('k.total'); if(k[1]) k[1].textContent = m('k.profit'); if(k[2]) k[2].textContent = m('k.margin');
    $$('.actions .btn.primary').forEach(function(b){ b.textContent = m('add'); });
    var dTitle = document.querySelector('.drawer-header strong'); if(dTitle) dTitle.textContent = m('cart.title');
    var cBtn = document.getElementById('closeCart'); if(cBtn) cBtn.textContent = m('close');
    var tLbl = document.querySelector('.drawer-footer div strong'); if(tLbl) tLbl.textContent = m('total');
    var clr = document.getElementById('clearCart'); if(clr) clr.textContent = m('clear');
    var go = document.getElementById('goCheckout'); if(go) go.textContent = m('checkout');
    var ca = document.getElementById('cookieAccept'); if(ca) ca.textContent = m('cookies.accept'); var crj = document.getElementById('cookieReject'); if(crj) crj.textContent = m('cookies.reject');
  }
  document.addEventListener('DOMContentLoaded', function(){
    var preset = localStorage.getItem('rf_lang') || (navigator.language||'').slice(0,2);
    if(preset==='en'){ applyLang(); }
    document.querySelectorAll('.lang-switch .lang').forEach(function(btn){ btn.addEventListener('click', function(){ setLang(this.getAttribute('data-lang')); location.reload(); }); });
  });
})();
