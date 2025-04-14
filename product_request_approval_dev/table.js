// ====================================================================
// Create Table Row Function
// ====================================================================
function createTableRow(data) {
    const tr = document.createElement("tr");
    
    // Checkbox cell.
    const checkboxTd = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("rowCheckbox");
    checkboxTd.appendChild(checkbox);
    tr.appendChild(checkboxTd);
  
    // Requestor Name cell.
    const requestorNameTd = document.createElement("td");
    let requestorName = "";
    if (data.requestor_firstName || data.requestor_lastName) {
      requestorName = (data.requestor_firstName || "") + " " + (data.requestor_lastName || "");
      requestorName = requestorName.trim();
    }
    requestorNameTd.textContent = requestorName;
    tr.appendChild(requestorNameTd);
  
    // SKU cell.
    const skuTd = document.createElement("td");
    const skuInput = document.createElement("input");
    skuInput.type = "text";
    skuInput.value = data.sku || "";
    attachValidationListener(skuInput);
    skuTd.appendChild(skuInput);
    tr.appendChild(skuTd);
  
    // Product Name cell.
    const productNameTd = document.createElement("td");
    const productNameInput = document.createElement("input");
    productNameInput.type = "text";
    productNameInput.value = data.product_name || "";
    attachValidationListener(productNameInput);
    productNameTd.appendChild(productNameInput);
    tr.appendChild(productNameTd);
  
    // Brand select cell.
    const brandTd = document.createElement("td");
    const brandSelect = document.createElement("select");
    brandSelect.classList.add("brandSelect");
    brandSelect.setAttribute("data-selected", data.brand || "");
    brandTd.appendChild(brandSelect);
    tr.appendChild(brandTd);
  
    // Primary Supplier select cell.
    const supplierTd = document.createElement("td");
    const supplierSelect = document.createElement("select");
    supplierSelect.classList.add("supplierSelect");
    supplierSelect.setAttribute("data-selected", data.primary_supplier || "");
    supplierTd.appendChild(supplierSelect);
    tr.appendChild(supplierTd);
  
    // Category select cell.
    const categoryTd = document.createElement("td");
    const categorySelect = document.createElement("select");
    categorySelect.classList.add("categorySelect");
    categorySelect.setAttribute("data-selected", data.category || "");
    categoryTd.appendChild(categorySelect);
    tr.appendChild(categoryTd);
  
    // Purchase Price cell.
    const purchasePriceTd = document.createElement("td");
    const purchasePriceInput = document.createElement("input");
    purchasePriceInput.type = "number";
    purchasePriceInput.step = "0.01";
    purchasePriceInput.value = parseFloat(data.purchase_price).toFixed(2);
    attachValidationListener(purchasePriceInput);
    purchasePriceTd.appendChild(purchasePriceInput);
    tr.appendChild(purchasePriceTd);
  
    // Client MUP cell.
    const clientMupTd = document.createElement("td");
    const clientMupInput = document.createElement("input");
    clientMupInput.type = "number";
    clientMupInput.step = "0.01";
    clientMupInput.classList.add("clientMupInput");
    clientMupInput.value = parseFloat(data.client_mup).toFixed(2);
    attachValidationListener(clientMupInput);
    clientMupTd.appendChild(clientMupInput);
    tr.appendChild(clientMupTd);
  
    // Retail MUP cell.
    const retailMupTd = document.createElement("td");
    const retailMupInput = document.createElement("input");
    retailMupInput.type = "number";
    retailMupInput.step = "0.01";
    retailMupInput.classList.add("retailMupInput");
    retailMupInput.value = parseFloat(data.retail_mup).toFixed(2);
    attachValidationListener(retailMupInput);
    retailMupTd.appendChild(retailMupInput);
    tr.appendChild(retailMupTd);
  
    // Client Price cell.
    const clientPriceTd = document.createElement("td");
    const clientPriceInput = document.createElement("input");
    clientPriceInput.type = "number";
    clientPriceInput.step = "0.01";
    clientPriceInput.classList.add("clientPriceInput");
    clientPriceInput.value = parseFloat(data.client_price).toFixed(2);
    attachValidationListener(clientPriceInput);
    clientPriceTd.appendChild(clientPriceInput);
    tr.appendChild(clientPriceTd);
  
    // RRP cell.
    const rrpTd = document.createElement("td");
    const rrpInput = document.createElement("input");
    rrpInput.type = "number";
    rrpInput.step = "0.01";
    rrpInput.classList.add("rrpInput");
    rrpInput.value = parseFloat(data.rrp).toFixed(2);
    attachValidationListener(rrpInput);
    rrpTd.appendChild(rrpInput);
    tr.appendChild(rrpTd);
  
    // Flags to avoid recursive updates.
    let clientUpdating = false;
    let retailUpdating = false;
  
    purchasePriceInput.addEventListener("input", () => {
      const purchasePrice = parseFloat(purchasePriceInput.value);
      const clientMup = parseFloat(clientMupInput.value);
      if (!isNaN(purchasePrice) && !isNaN(clientMup)) {
        clientPriceInput.value = calculateClientPrice(purchasePrice, clientMup).toFixed(2);
      } else {
        clientPriceInput.value = "";
      }
      const retailMup = parseFloat(retailMupInput.value);
      if (!isNaN(purchasePrice) && !isNaN(retailMup)) {
        rrpInput.value = calculateRrp(purchasePrice, retailMup).toFixed(2);
      } else {
        rrpInput.value = "";
      }
    });
  
    clientMupInput.addEventListener("input", () => {
      if (clientUpdating) return;
      clientUpdating = true;
      const purchasePrice = parseFloat(purchasePriceInput.value);
      const clientMup = parseFloat(clientMupInput.value);
      if (!isNaN(purchasePrice) && !isNaN(clientMup)) {
        clientPriceInput.value = calculateClientPrice(purchasePrice, clientMup).toFixed(2);
      } else {
        clientPriceInput.value = "";
      }
      clientUpdating = false;
    });
  
    clientPriceInput.addEventListener("input", () => {
      if (clientUpdating) return;
      clientUpdating = true;
      const purchasePrice = parseFloat(purchasePriceInput.value);
      const clientPrice = parseFloat(clientPriceInput.value);
      if (!isNaN(purchasePrice) && purchasePrice !== 0 && !isNaN(clientPrice)) {
        const newClientMup = clientPrice / (purchasePrice * 1.1);
        clientMupInput.value = newClientMup.toFixed(2);
      } else {
        clientMupInput.value = "";
      }
      clientUpdating = false;
    });
  
    retailMupInput.addEventListener("input", () => {
      if (retailUpdating) return;
      retailUpdating = true;
      const purchasePrice = parseFloat(purchasePriceInput.value);
      const retailMup = parseFloat(retailMupInput.value);
      if (!isNaN(purchasePrice) && !isNaN(retailMup)) {
        rrpInput.value = calculateRrp(purchasePrice, retailMup).toFixed(2);
      } else {
        rrpInput.value = "";
      }
      retailUpdating = false;
    });
  
    rrpInput.addEventListener("input", () => {
      if (retailUpdating) return;
      retailUpdating = true;
      const purchasePrice = parseFloat(purchasePriceInput.value);
      const rrpVal = parseFloat(rrpInput.value);
      if (!isNaN(purchasePrice) && purchasePrice !== 0 && !isNaN(rrpVal)) {
        const newRetailMup = rrpVal / (purchasePrice * 1.1);
        retailMupInput.value = newRetailMup.toFixed(2);
      } else {
        retailMupInput.value = "";
      }
      retailUpdating = false;
    });
  
    const initialRrp = parseFloat(data.rrp);
    const purchasePriceVal = parseFloat(data.purchase_price);
    if (!isNaN(initialRrp) && initialRrp !== 0 && !isNaN(purchasePriceVal) && purchasePriceVal !== 0) {
      retailMupInput.value = (initialRrp / (purchasePriceVal * 1.1)).toFixed(2);
    }
  
    return tr;
  }
  