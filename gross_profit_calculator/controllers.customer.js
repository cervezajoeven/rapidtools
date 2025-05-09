(function(App){
  "use strict";
  App.Controllers = App.Controllers || {};

  App.Controllers.Customer = {
    /**
     * Render customer info & toggle Apply button.
     */
    render: async function(data, orderUserGroup) {
      const orderInfoDiv = document.getElementById('orderInfo');
      const applyPricingBtn = document.getElementById('applyPricingBtn');
      
      // Clear the customer loader
      App.Controllers.Order.hideCustomerLoader();
      
      if (!data?.Customer?.length) {
        orderInfoDiv.textContent = "No customer information found.";
        applyPricingBtn.disabled = true;
        return;
      }
      
      const customer = data.Customer[0];
      const billing = customer.BillingAddress || {};
      const customerName = `${billing.BillFirstName || ""} ${billing.BillLastName || ""}`.trim();
      const customerUserGroup = customer.UserGroup || "N/A";
      
      try {
        // Show loading while fetching group mappings
        orderInfoDiv.innerHTML = `
          <div class="loader-container active" id="mappingLoader">
            <span class="loader"></span>
            <div class="loader-text">Loading group mappings...</div>
          </div>
        `;
        
        const mappingArray = await App.Services.GroupMapping.fetchAll();
        
        // Remove the mapping loader
        const mappingLoader = document.getElementById('mappingLoader');
        if (mappingLoader) mappingLoader.remove();
        
        // Find the group mappings
        const orderMapping = mappingArray.find(item => item.GroupID === orderUserGroup);
        const orderGroupName = orderMapping ? orderMapping.Group : orderUserGroup;
        
        const customerMapping = mappingArray.find(item => item.Group === customerUserGroup);
        const customerGroupName = customerMapping ? customerMapping.Group : customerUserGroup;
        const customerGroupID = customerMapping ? customerMapping.GroupID : "N/A";
        
        // Set global customer group ID for use in saving pricing
        window.globalCustomerGroupID = customerGroupID;
        
        // Determine if groups match
        const groupClass = (customerMapping && customerMapping.GroupID === orderUserGroup) 
          ? "group-match" 
          : "group-mismatch";
        
        // Create HTML for customer info
        let html = `
          <div class="info-block">
            <strong>Customer Name:</strong> ${customerName}
          </div>
          <div class="info-block">
            <strong>Order User Group:</strong> <span class="${groupClass}">${orderGroupName} (ID: ${orderUserGroup})</span>
          </div>
          <div class="info-block">
            <strong>Current User Group:</strong> ${customerGroupName} (ID: ${customerGroupID})
          </div>`;
        
        // Add notification if groups don't match
        if (!customerMapping || customerMapping.GroupID !== orderUserGroup) {
          html += `<div class="notification">The current user group does not match the order's user group.</div>`;
        }
        
        orderInfoDiv.innerHTML = html;
        
        // Enable/disable apply button based on customer group
        if (customerGroupID === "2" || customerGroupName === "Default Client Group") {
          applyPricingBtn.disabled = true;
        } else {
          applyPricingBtn.disabled = false;
        }
      } catch(error) {
        console.error(error);
        orderInfoDiv.innerHTML = `
          <div class="info-block">
            <strong>Customer Name:</strong> ${customerName}
          </div>
          <div class="info-block">
            <strong>Current User Group:</strong> ${customerUserGroup}
          </div>
          <div class="notification">Error loading group mappings: ${error.message || 'Unknown error'}</div>`;
        applyPricingBtn.disabled = true;
      }
    }
  };
})(window.App = window.App || {}); 