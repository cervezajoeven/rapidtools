(function(App){
  "use strict";
  App.Services = App.Services || {};
  App.Services.Pricing = {
    /**
     * Fetch cost & default price data for an array of SKUs.
     * @param {string[]} skus
     * @returns {Promise<Object>}
     */
    fetchData: async function(skus) {
      const res = await fetch(App.Config.ENDPOINTS.COST_PRICE, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({sku: skus})
      });
      if (!res.ok) throw new Error(`Pricing API error ${res.status}`);
      return res.json();
    },
    /**
     * Save a SKU pricing to Maropost.
     * @param {Object} payload
     */
    saveToMaropost: async function(payload) {
      const res = await fetch(App.Config.ENDPOINTS.SAVE_MAROPOST, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Maropost API error ${res.status}`);
      return res.json();
    },
    /**
     * Update cost prices for all cells in the mapping
     */
    updateCostPrices: async function(mapping) {
      const skuList = Object.keys(mapping);
      if (skuList.length === 0) return;

      const data = await this.fetchData(skuList);
      
      if (data?.Item && Array.isArray(data.Item)) {
        data.Item.forEach(item => {
          const sku = item.SKU;
          const newCostPrice = parseFloat(item.DefaultPurchasePrice);
          if (mapping[sku]) {
            mapping[sku].forEach(ref => {
              ref.costCell.textContent = newCostPrice.toFixed(3);
              ref.costCell.style.backgroundColor = "rgb(255,236,160)";
              App.Utils.blinkCell(ref.costCell);
              
              const newRRP = parseFloat(item.RRP);
              ref.defaultPriceCell.textContent = newRRP.toFixed(2);
              App.Utils.blinkCell(ref.defaultPriceCell);
              
              const discountedVal = parseFloat(ref.discountedCell.textContent) || 0;
              const newGP = discountedVal > 0 
                ? (((discountedVal - newCostPrice) / discountedVal) * 100).toFixed(3)
                : "0.000";
              ref.gpCell.textContent = newGP;
              App.Utils.blinkCell(ref.gpCell);
              App.Utils.updateGPColor(ref.gpCell, newGP);
            });
          }
        });
      }
    },
    /**
     * Update default prices for all cells in the mapping
     */
    updateDefaultPrices: async function(mapping) {
      const skuList = Object.keys(mapping);
      if (skuList.length === 0) return;

      const data = await this.fetchData(skuList);
      
      if (data?.Item && Array.isArray(data.Item)) {
        data.Item.forEach(item => {
          const sku = item.SKU;
          const newRRP = parseFloat(item.RRP);
          const netRRP = newRRP / 1.1;
          
          if (mapping[sku]) {
            mapping[sku].forEach(ref => {
              ref.defaultPriceCell.textContent = `${newRRP.toFixed(2)} (${netRRP.toFixed(2)})`;
              App.Utils.blinkCell(ref.defaultPriceCell);
              
              const unitPrice = parseFloat(ref.unitPriceCell.textContent);
              const unitPriceRounded2 = parseFloat(unitPrice.toFixed(2));
              const netRRPRounded = parseFloat(netRRP.toFixed(2));
              
              if (Math.abs(unitPriceRounded2 - netRRPRounded) < 0.001) {
                ref.unitPriceCell.style.backgroundColor = "rgb(189,255,204)";
              } else if (unitPriceRounded2 < netRRPRounded) {
                ref.unitPriceCell.style.backgroundColor = "rgb(206,230,255)";
              } else {
                ref.unitPriceCell.style.backgroundColor = "";
              }
              
              const discountedVal = parseFloat(ref.discountedCell.textContent) || 0;
              if (newRRP > 0) {
                const taxedDiscountedPrice = discountedVal * 1.1;
                const accumDiscount = ((newRRP - taxedDiscountedPrice) / newRRP) * 100;
                ref.accumDiscountCell.textContent = `${accumDiscount.toFixed(2)}%`;
              } else {
                ref.accumDiscountCell.textContent = "N/A";
              }
              App.Utils.blinkCell(ref.accumDiscountCell);
            });
          }
        });
      }
    }
  };
})(window.App = window.App || {}); 