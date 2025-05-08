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
        const mappingArray = await App.Services.GroupMapping.fetchAll();
        
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
          <div class="order-info">
            <span><strong>Customer Name:</strong> ${customerName}</span><br/>
            <span><strong>Order User Group:</strong> <span class="${groupClass}">${orderGroupName} (ID: ${orderUserGroup})</span></span><br/>
            <span><strong>Current User Group:</strong> ${customerGroupName} (ID: ${customerGroupID})</span>
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
          <div class="order-info">
            <span><strong>Customer Name:</strong> ${customerName}</span>
            <span><strong>Current User Group:</strong> ${customerUserGroup}</span>
          </div>`;
        applyPricingBtn.disabled = true;
      }
    }
  };
})(window.App = window.App || {}); 