/* CONFIGURACIÓN MAESTRA DE REVENDEFÁCIL 
  ---------------------------------------
  Aquí se centralizan todos los datos. Cambia aquí precios o nombres
  y se actualizarán en el carrito, checkout y emails.
*/

window.RF_CONFIG = {
  // Configuración de Precios
  pricing: {
    currency: '€',
    providerUnit: 2.00, // Precio 1 proveedor
    courseUnit: 1.00,   // Precio 1 curso
    
    // Oferta de Bundles (Proveedores)
    bundleThreshold: 4, // A partir de cuántos se aplica oferta
    bundlePrice: 6.00   // Precio del pack oferta
  },

  // Catálogo de Productos (IDs deben coincidir con HTML)
  products: {
    // Proveedores
    'p1': { name: 'Prov. Zapatillas', type: 'provider', icon: '👟' },
    'p2': { name: 'Prov. Vapers',     type: 'provider', icon: '💨' },
    'p3': { name: 'Prov. Relojes',    type: 'provider', icon: '⌚' },
    'p4': { name: 'Prov. Colonias',   type: 'provider', icon: '✨' },
    
    // Cursos
    'c1': { name: 'Curso Lujo',       type: 'course',   icon: '💎' },
    'c2': { name: 'Curso Seguridad',  type: 'course',   icon: '🔒' },
    'c3': { name: 'Curso Anuncios',   type: 'course',   icon: '📢' }
  },

  // Configuración Técnica
  paypal: {
    currency: 'EUR',
    // Si tienes un client-id real de producción, ponlo aquí
    clientId: 'sb' 
  }
};
