(function(App){
  "use strict";
  App.Services = App.Services || {};
  App.Services.Order = {
    /**
     * Fetch order details by order ID.
     * @param {string} orderId
     * @returns {Promise<Object>}
     */
    fetchDetails: async function(orderId) {
      const res = await fetch(App.Config.ENDPOINTS.ORDER_DETAILS, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({order_id: orderId})
      });
      if (!res.ok) throw new Error(`Order API error ${res.status}`);
      return res.json();
    },

    /**
     * Process complete order flow
     */
    processOrder: async function(orderId) {
      document.getElementById('orderInfo').innerHTML = "";
      const tbody = document.querySelector("#orderLineTable tbody");
      tbody.innerHTML = "";
      
      document.getElementById('orderLineTable').style.display = 'none';
      App.Utils.showProgressBar();
      
      try {
        // 1. Order lines
        const data = await this.fetchDetails(orderId);
        const tablePromise = App.Controllers.Order.renderTable(data);
        
        // 2. Customer info
        let customerPromise = Promise.resolve();
        if (data?.Order?.length && data.Order[0].Username) {
          const orderUserGroup = data.Order[0].UserGroup || "N/A";
          customerPromise = App.Services.Customer.fetchInfo(data.Order[0].Username)
            .then(customerData => App.Controllers.Customer.render(customerData, orderUserGroup));
        }
        
        // Wait for all operations to complete
        await Promise.all([tablePromise, customerPromise]);
      } catch(err) {
        console.error(err);
      } finally {
        App.Utils.hideProgressBar();
        document.getElementById('orderLineTable').style.display = '';
      }
    }
  };
})(window.App = window.App || {}); 