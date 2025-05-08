(function(App){
  "use strict";
  App.Controllers = App.Controllers || {};

  App.Controllers.Pricing = {
    /**
     * "Apply Customer Pricing" click handler.
     */
    apply: async function() {
      const rows = document.querySelectorAll("#orderLineTable tbody tr");
      let successCount = 0;
      let failureCount = 0;
      
      // Show notification area
      const notificationDiv = document.getElementById('maropostNotification');
      notificationDiv.textContent = "Saving to Maropost...";
      notificationDiv.style.display = "block";
      
      for (const row of rows) {
        const checkbox = row.querySelector('td:last-child input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
          const sku = row.children[1].textContent.trim();
          const price = parseFloat(row.children[8].textContent);
          
          const maropostPayload = {
            sku: sku,
            price_group_id: window.globalCustomerGroupID || "2",
            price: price
          };
          
          try {
            const response = await fetch(App.Config.ENDPOINTS.SAVE_MAROPOST, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(maropostPayload)
            });
            
            if (!response.ok) {
              failureCount++;
              console.error(`Error saving SKU: ${sku} (status: ${response.status})`);
            } else {
              const result = await response.json();
              console.log('Save to Maropost API success:', result);
              successCount++;
              // Add visual feedback
              row.children[8].classList.add("blink");
            }
          } catch (error) {
            console.error('Error saving product to Maropost:', error);
            failureCount++;
          }
          
          try {
            await App.Services.Firestore.upsertPricing(sku, price, window.globalCustomerGroupID || "2");
          } catch (error) {
            console.error(`Error upserting Firestore pricing record for SKU: ${sku}`, error);
          }
        }
      }
      
      notificationDiv.textContent = `Saved ${successCount} product(s) to Maropost. ${failureCount ? failureCount + ' failure(s) occurred.' : 'All products saved successfully.'}`;
      
      if (successCount > 0 && failureCount === 0) {
        const applyBtn = document.getElementById("applyPricingBtn");
        applyBtn.classList.add('success');
        setTimeout(() => {
          applyBtn.classList.remove('success');
        }, 2000);
      }
    }
  };
})(window.App = window.App || {}); 