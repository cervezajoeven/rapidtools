(function(App){
  "use strict";
  App.Controllers = App.Controllers || {};

  App.Controllers.Order = {
    /**
     * Load & render order + customer.
     */
    load: async function(orderId) {
      // clear existing UI
      document.getElementById("orderInfo").innerHTML = "";
      const tbody = document.querySelector("#orderLineTable tbody");
      tbody.innerHTML = "";
      
      // Hide notification area initially
      const note = document.getElementById("maropostNotification");
      note.textContent = "";
      
      const pb = new App.Utils.ProgressBar();
      pb.show();

      try {
        // 1. Order lines
        const data = await App.Services.Order.fetchDetails(orderId);
        await App.Controllers.Order.renderTable(data);

        // 2. Customer info
        const user = data.Order?.[0]?.Username;
        const grp  = data.Order?.[0]?.UserGroup;
        if (user) {
          const cust = await App.Services.Customer.fetchInfo(user);
          App.Controllers.Customer.render(cust, grp);
        }
      } catch(err) {
        console.error(err);
      } finally {
        pb.hide();
      }
    },

    /**
     * Render table with order data.
     */
    renderTable: function(data) {
      return new Promise((resolve) => {
        const tbody = document.querySelector("#orderLineTable tbody");
        const costPriceMapping = {};
        const defaultPriceMapping = {};
        
        if (data?.Order?.length) {
          data.Order.forEach(order => {
            if (order.OrderLine?.length) {
              // Sort order lines
              const sortedOrderLines = order.OrderLine.sort((a, b) => {
                const seqA = parseInt(a.OrderLineID?.split('-').pop(), 10) || 0;
                const seqB = parseInt(b.OrderLineID?.split('-').pop(), 10) || 0;
                return seqA - seqB;
              });
              
              // Render each order line
              sortedOrderLines.forEach(line => {
                const row = document.createElement('tr');
                const unitPriceNum = parseFloat(line.UnitPrice) || 0;
                const costPriceNum = parseFloat(line.CostPrice) || 0;
                const quantityNum = parseFloat(line.Quantity) || 0;
                const unitPriceRounded = unitPriceNum.toFixed(3);
                const costPriceRounded = costPriceNum.toFixed(3);
                
                // Product name
                row.appendChild(App.Utils.createCell(line.ProductName || "N/A"));
                
                // SKU
                row.appendChild(App.Utils.createCell(line.SKU || "N/A"));
                
                // Quantity
                row.appendChild(App.Utils.createCell(line.Quantity || "N/A"));
                
                // Cost Price
                const costPriceCell = App.Utils.createCell(costPriceRounded);
                row.appendChild(costPriceCell);
                
                // RRP/Default Price
                const defaultPriceCell = App.Utils.createCell("N/A");
                row.appendChild(defaultPriceCell);
                
                // Unit Price
                const unitPriceCell = App.Utils.createCell(unitPriceRounded);
                row.appendChild(unitPriceCell);
                
                // Percent Discount - editable input
                const discountVal = isNaN(parseFloat(line.PercentDiscount)) ? 0 : parseFloat(line.PercentDiscount);
                const formattedDiscount = parseFloat(discountVal.toFixed(2));
                const discountCell = document.createElement('td');
                const discountInput = document.createElement('input');
                discountInput.type = 'number';
                discountInput.min = "0";
                discountInput.max = "100";
                discountInput.value = formattedDiscount;
                discountInput.style.width = "80px";
                discountInput.addEventListener('focus', function() { this.select(); });
                discountCell.appendChild(discountInput);
                row.appendChild(discountCell);
                
                // Accumulated Discount
                const accumDiscountCell = App.Utils.createCell("N/A");
                row.appendChild(accumDiscountCell);
                
                // Unit Price Discounted
                const unitPriceDiscountedNum = unitPriceNum * (1 - discountVal / 100);
                const unitPriceDiscounted = unitPriceDiscountedNum.toFixed(3);
                const discountedCell = App.Utils.createCell(unitPriceDiscounted);
                row.appendChild(discountedCell);
                
                // Gross Profit Percentage
                const grossProfitPercentage = unitPriceDiscountedNum > 0 
                  ? (((unitPriceDiscountedNum - costPriceNum) / unitPriceDiscountedNum) * 100).toFixed(3)
                  : "0.000";
                const gpPercentageCell = App.Utils.createCell(grossProfitPercentage);
                App.Utils.updateGPColor(gpPercentageCell, grossProfitPercentage);
                row.appendChild(gpPercentageCell);
                
                // Total
                const totalCell = App.Utils.createCell((quantityNum * unitPriceDiscountedNum).toFixed(3));
                row.appendChild(totalCell);
                
                // Save checkbox
                const saveDiscountCell = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                saveDiscountCell.appendChild(checkbox);
                row.appendChild(saveDiscountCell);
                
                tbody.appendChild(row);
                
                // Add event listener for discount input
                discountInput.addEventListener('blur', function() {
                  let newDiscount = parseFloat(this.value);
                  if (isNaN(newDiscount) || newDiscount < 0) newDiscount = 0;
                  else if (newDiscount > 100) newDiscount = 100;
                  newDiscount = parseFloat(newDiscount.toFixed(2));
                  this.value = newDiscount;
                  
                  // Update discounted price
                  const updatedDiscountedNum = unitPriceNum * (1 - newDiscount / 100);
                  const updatedDiscounted = updatedDiscountedNum.toFixed(3);
                  discountedCell.textContent = updatedDiscounted;
                  App.Utils.blinkCell(discountedCell);
                  
                  // Update gross profit percentage
                  const updatedGPPercentage = updatedDiscountedNum > 0 
                    ? (((updatedDiscountedNum - parseFloat(costPriceCell.textContent)) / updatedDiscountedNum) * 100).toFixed(3)
                    : "0.000";
                  gpPercentageCell.textContent = updatedGPPercentage;
                  App.Utils.blinkCell(gpPercentageCell);
                  App.Utils.updateGPColor(gpPercentageCell, updatedGPPercentage);
                  
                  // Update total
                  totalCell.textContent = (quantityNum * updatedDiscountedNum).toFixed(3);
                  App.Utils.blinkCell(totalCell);
                  
                  // Update accumulated discount if RRP is available
                  const defaultPriceText = defaultPriceCell.textContent;
                  const rrpParsed = parseFloat(defaultPriceText.split(" ")[0]);
                  if (!isNaN(rrpParsed) && rrpParsed > 0) {
                    const taxedDiscountedPrice = updatedDiscountedNum * 1.1;
                    const accumDiscount = ((rrpParsed - taxedDiscountedPrice) / rrpParsed) * 100;
                    accumDiscountCell.textContent = accumDiscount.toFixed(2) + "%";
                  } else {
                    accumDiscountCell.textContent = "N/A";
                  }
                  App.Utils.blinkCell(accumDiscountCell);
                });
                
                // Set up mapping objects for API lookups
                const skuVal = line.SKU || "N/A";
                if (skuVal !== "N/A") {
                  if (!defaultPriceMapping[skuVal]) defaultPriceMapping[skuVal] = [];
                  defaultPriceMapping[skuVal].push({ 
                    defaultPriceCell, 
                    unitPriceCell, 
                    accumDiscountCell, 
                    discountedCell 
                  });
                }
                
                if (costPriceNum === 0 && skuVal !== "N/A") {
                  if (!costPriceMapping[skuVal]) costPriceMapping[skuVal] = [];
                  costPriceMapping[skuVal].push({
                    costCell: costPriceCell,
                    defaultPriceCell: defaultPriceCell,
                    gpCell: gpPercentageCell,
                    discountedCell: discountedCell
                  });
                }
              });
            } else {
              // No order lines found
              const row = document.createElement('tr');
              const cell = document.createElement('td');
              cell.textContent = "No order lines found.";
              cell.colSpan = 12;
              row.appendChild(cell);
              tbody.appendChild(row);
            }
          });
        } else {
          // No orders found
          const row = document.createElement('tr');
          const cell = document.createElement('td');
          cell.textContent = "No orders found.";
          cell.colSpan = 12;
          row.appendChild(cell);
          tbody.appendChild(row);
        }
        
        // Fetch cost and default prices for SKUs
        if (Object.keys(costPriceMapping).length > 0) {
          App.Services.Pricing.updateCostPrices(costPriceMapping).then(() => {
            if (Object.keys(defaultPriceMapping).length > 0) {
              App.Services.Pricing.updateDefaultPrices(defaultPriceMapping).then(resolve);
            } else resolve();
          });
        } else {
          if (Object.keys(defaultPriceMapping).length > 0) {
            App.Services.Pricing.updateDefaultPrices(defaultPriceMapping).then(resolve);
          } else resolve();
        }
      });
    }
  };
})(window.App = window.App || {}); 