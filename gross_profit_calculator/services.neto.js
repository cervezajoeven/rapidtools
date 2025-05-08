(function(App){
  "use strict";
  App.Services = App.Services || {};
  
  // Global cache for Neto API responses
  const netoAPICache = {};
  
  App.Services.Neto = {
    /**
     * Fetch Neto data for one SKU (with simple cache).
     * @param {string} sku
     * @returns {Promise<Object>}
     */
    getData: async function(sku) {
      if (netoAPICache[sku]) {
        return netoAPICache[sku];
      }
      
      try {
        const res = await fetch(App.Config.ENDPOINTS.NETO, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ skus: [sku] })
        });
        
        if (!res.ok) {
          throw new Error(`Neto API request failed with status ${res.status}`);
        }
        
        const data = await res.json();
        if (data && data.Item && Array.isArray(data.Item)) {
          // Case-insensitive matching for SKU
          const item = data.Item.find(item => 
            item.SKU.toString().toLowerCase() === sku.toString().toLowerCase()
          );
          
          if (item) {
            netoAPICache[sku] = item;
            return item;
          }
        }
        
        netoAPICache[sku] = {};
        return {};
      } catch (error) {
        console.error("Error fetching Neto API data:", error);
        netoAPICache[sku] = {};
        return {};
      }
    }
  };
})(window.App = window.App || {}); 