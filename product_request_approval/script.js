// Firebase configuration (using your provided configuration)
const firebaseConfig = {
  apiKey: "AIzaSyAfcffroNPQiXxSZmk7ahUJ_5ez9eO3CCQ",
  authDomain: "rapidclean-ba9be.firebaseapp.com",
  projectId: "rapidclean-ba9be",
  storageBucket: "rapidclean-ba9be.firebasestorage.app",
  messagingSenderId: "39304689168",
  appId: "1:39304689168:web:19e9d73377df109270bc95",
  measurementId: "G-PLE91ET2H3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global variables for the API responses
let brandsList = [];
let supplierList = [];

// API endpoints for brands and suppliers
const brandsUrl = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/58215302c1c24203886ccf481adbaac5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RFQ4OtbS6cyjB_JzaIsowmww4KBqPQgavWLg18znE5s';
const supplierUrl = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/da5c5708146642768d63293d2bbb9668/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-n0W0PxlF1G83xHYHGoEOhv3XmHXWlesbRk5NcgNT9w';

// SKU verification API endpoint
const skuVerificationUrl = 'https://prod-03.australiasoutheast.logic.azure.com:443/workflows/151bc47e0ba4447b893d1c9fea9af46f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bRyr_oW-ud06XlU5VLhBqQ7tyU__jD3clEOGIEhax-Q';

// ----------------------------------------------------------------------------
// Fetch Brands List
fetch(brandsUrl, { method: 'POST' })
  .then(response => response.json())
  .then(apiResponse => {
    if (
      apiResponse.status === 200 &&
      apiResponse.message &&
      apiResponse.message.Content &&
      Array.isArray(apiResponse.message.Content)
    ) {
      brandsList = apiResponse.message.Content;
      updateBrandSelects();
    } else {
      console.error('Unexpected brands API response:', apiResponse);
    }
  })
  .catch(error => console.error('Error fetching brands:', error));

// ----------------------------------------------------------------------------
// Fetch Primary Supplier List
fetch(supplierUrl, { method: 'POST' })
  .then(response => response.json())
  .then(apiResponse => {
    if (
      apiResponse.status === 200 &&
      apiResponse.message &&
      apiResponse.message.Supplier &&
      Array.isArray(apiResponse.message.Supplier)
    ) {
      supplierList = apiResponse.message.Supplier;
      updateSupplierSelects();
    } else {
      console.error('Unexpected supplier API response:', apiResponse);
    }
  })
  .catch(error => console.error('Error fetching supplier list:', error));

// ----------------------------------------------------------------------------
// Helper: Update all Brand dropdowns
function updateBrandSelects() {
  const brandSelects = document.querySelectorAll("select.brandSelect");
  brandSelects.forEach(select => {
    // Retrieve the current selected value stored in a data attribute.
    const currentValue = select.getAttribute("data-selected") || "";
    select.innerHTML = "";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Brand";
    select.appendChild(placeholderOption);
    brandsList.forEach(brand => {
      const option = document.createElement("option");
      option.value = brand.ContentName;
      option.textContent = brand.ContentName;
      if (currentValue === brand.ContentName) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });
}

// ----------------------------------------------------------------------------
// Helper: Update all Primary Supplier dropdowns
function updateSupplierSelects() {
  const supplierSelects = document.querySelectorAll("select.supplierSelect");
  supplierSelects.forEach(select => {
    // Retrieve the current selected value stored in a data attribute.
    const currentValue = select.getAttribute("data-selected") || "";
    select.innerHTML = "";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Supplier";
    select.appendChild(placeholderOption);
    supplierList.forEach(supplier => {
      const option = document.createElement("option");
      option.value = supplier.SupplierID;
      option.textContent = supplier.SupplierID;
      if (currentValue === supplier.SupplierID) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });
}

// ----------------------------------------------------------------------------
// Create a table row element for a given product data object.
function createTableRow(data) {
  const tr = document.createElement("tr");

  // Checkbox column.
  const checkboxTd = document.createElement("td");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("rowCheckbox");
  checkboxTd.appendChild(checkbox);
  tr.appendChild(checkboxTd);

  // SKU column as an editable input field.
  const skuTd = document.createElement("td");
  const skuInput = document.createElement("input");
  skuInput.type = "text";
  skuInput.value = data.sku;
  skuTd.appendChild(skuInput);
  tr.appendChild(skuTd);

  // Product Name column as an editable input field.
  const productNameTd = document.createElement("td");
  const productNameInput = document.createElement("input");
  productNameInput.type = "text";
  productNameInput.value = data.product_name;
  productNameTd.appendChild(productNameInput);
  tr.appendChild(productNameTd);

  // Brand column as a dropdown.
  const brandTd = document.createElement("td");
  const brandSelect = document.createElement("select");
  brandSelect.classList.add("brandSelect");
  // Store the current brand value (if any) for later use.
  brandSelect.setAttribute("data-selected", data.brand || "");
  brandTd.appendChild(brandSelect);
  tr.appendChild(brandTd);

  // Primary Supplier column as a dropdown.
  const primarySupplierTd = document.createElement("td");
  const primarySupplierSelect = document.createElement("select");
  primarySupplierSelect.classList.add("supplierSelect");
  // Store the current supplier value (if any) for later use.
  primarySupplierSelect.setAttribute("data-selected", data.primary_supplier || "");
  primarySupplierTd.appendChild(primarySupplierSelect);
  tr.appendChild(primarySupplierTd);

  // Purchase Price column as an editable input field.
  const purchasePriceTd = document.createElement("td");
  const purchasePriceInput = document.createElement("input");
  purchasePriceInput.type = "number";
  purchasePriceInput.step = "0.01";
  purchasePriceInput.value = parseFloat(data.purchase_price).toFixed(2);
  purchasePriceTd.appendChild(purchasePriceInput);
  tr.appendChild(purchasePriceTd);

  // Client MUP column.
  const clientMupTd = document.createElement("td");
  const clientMupInput = document.createElement("input");
  clientMupInput.type = "number";
  clientMupInput.step = "0.01";
  clientMupInput.classList.add("clientMupInput");
  clientMupInput.value = parseFloat(data.client_mup).toFixed(2);
  clientMupTd.appendChild(clientMupInput);
  tr.appendChild(clientMupTd);

  // Retail MUP column.
  const retailMupTd = document.createElement("td");
  const retailMupInput = document.createElement("input");
  retailMupInput.type = "number";
  retailMupInput.step = "0.01";
  retailMupInput.classList.add("retailMupInput");
  retailMupInput.value = parseFloat(data.retail_mup).toFixed(2);
  retailMupTd.appendChild(retailMupInput);
  tr.appendChild(retailMupTd);

  // Client Price column.
  const clientPriceTd = document.createElement("td");
  const clientPriceInput = document.createElement("input");
  clientPriceInput.type = "number";
  clientPriceInput.step = "0.01";
  clientPriceInput.classList.add("clientPriceInput");
  clientPriceInput.value = parseFloat(data.client_price).toFixed(2);
  clientPriceTd.appendChild(clientPriceInput);
  tr.appendChild(clientPriceTd);

  // RRP column.
  const rrpTd = document.createElement("td");
  const rrpInput = document.createElement("input");
  rrpInput.type = "number";
  rrpInput.step = "0.01";
  rrpInput.classList.add("rrpInput");
  rrpInput.value = parseFloat(data.rrp).toFixed(2);
  rrpTd.appendChild(rrpInput);
  tr.appendChild(rrpTd);

  // Flags to prevent recursive updates.
  let clientUpdating = false;
  let retailUpdating = false;

  // Update calculated fields when Purchase Price changes.
  purchasePriceInput.addEventListener("input", function () {
    const purchasePrice = parseFloat(purchasePriceInput.value);
    const clientMup = parseFloat(clientMupInput.value);
    if (!isNaN(purchasePrice) && !isNaN(clientMup)) {
      const clientPrice = (purchasePrice * clientMup) * 1.1;
      clientPriceInput.value = clientPrice.toFixed(2);
    } else {
      clientPriceInput.value = "";
    }
    const retailMup = parseFloat(retailMupInput.value);
    if (!isNaN(purchasePrice) && !isNaN(retailMup)) {
      const rrp = (purchasePrice * retailMup) * 1.1;
      rrpInput.value = rrp.toFixed(2);
    } else {
      rrpInput.value = "";
    }
  });

  // Update Client Price when Client MUP changes.
  clientMupInput.addEventListener("input", function () {
    if (clientUpdating) return;
    clientUpdating = true;
    const purchasePrice = parseFloat(purchasePriceInput.value);
    const clientMup = parseFloat(clientMupInput.value);
    if (!isNaN(purchasePrice) && !isNaN(clientMup)) {
      const clientPrice = (purchasePrice * clientMup) * 1.1;
      clientPriceInput.value = clientPrice.toFixed(2);
    } else {
      clientPriceInput.value = "";
    }
    clientUpdating = false;
  });

  // Update Client MUP when Client Price changes.
  clientPriceInput.addEventListener("input", function () {
    if (clientUpdating) return;
    clientUpdating = true;
    const purchasePrice = parseFloat(purchasePriceInput.value);
    const clientPrice = parseFloat(clientPriceInput.value);
    if (!isNaN(purchasePrice) && purchasePrice !== 0 && !isNaN(clientPrice)) {
      const clientMup = clientPrice / (purchasePrice * 1.1);
      clientMupInput.value = clientMup.toFixed(2);
    } else {
      clientMupInput.value = "";
    }
    clientUpdating = false;
  });

  // Update RRP when Retail MUP changes.
  retailMupInput.addEventListener("input", function () {
    if (retailUpdating) return;
    retailUpdating = true;
    const purchasePrice = parseFloat(purchasePriceInput.value);
    const retailMup = parseFloat(retailMupInput.value);
    if (!isNaN(purchasePrice) && !isNaN(retailMup)) {
      const rrp = (purchasePrice * retailMup) * 1.1;
      rrpInput.value = rrp.toFixed(2);
    } else {
      rrpInput.value = "";
    }
    retailUpdating = false;
  });

  // Update Retail MUP when RRP changes.
  rrpInput.addEventListener("input", function () {
    if (retailUpdating) return;
    retailUpdating = true;
    const purchasePrice = parseFloat(purchasePriceInput.value);
    const rrpValue = parseFloat(rrpInput.value);
    if (!isNaN(purchasePrice) && purchasePrice !== 0 && !isNaN(rrpValue)) {
      const retailMup = rrpValue / (purchasePrice * 1.1);
      retailMupInput.value = retailMup.toFixed(2);
    } else {
      retailMupInput.value = "";
    }
    retailUpdating = false;
  });

  // If an initial RRP is provided, calculate Retail MUP.
  const initialRrp = parseFloat(data.rrp);
  const purchasePriceVal = parseFloat(data.purchase_price);
  if (!isNaN(initialRrp) && initialRrp !== 0 && !isNaN(purchasePriceVal) && purchasePriceVal !== 0) {
    const calculatedRetailMup = initialRrp / (purchasePriceVal * 1.1);
    retailMupInput.value = calculatedRetailMup.toFixed(2);
  }

  return tr;
}

// ----------------------------------------------------------------------------
// Fetch data from the Firestore "product_requests" collection where status is "request"
db.collection("product_requests")
  .where("status", "==", "request")
  .get()
  .then(querySnapshot => {
    const tbody = document.querySelector("#productTable tbody");
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const row = createTableRow(data);
      tbody.appendChild(row);
    });
    if (brandsList.length > 0) {
      updateBrandSelects();
    }
    if (supplierList.length > 0) {
      updateSupplierSelects();
    }
  })
  .catch(error => {
    console.error("Error fetching documents: ", error);
  });

// ----------------------------------------------------------------------------
// Create a sticky submit button at the top right of the screen.
const submitBtn = document.createElement("button");
submitBtn.id = "stickySubmit";
submitBtn.textContent = "Submit Checked Rows";
submitBtn.style.position = "fixed";
submitBtn.style.top = "20px";
submitBtn.style.right = "20px";
submitBtn.style.zIndex = "1000";
submitBtn.style.padding = "10px 20px";
submitBtn.style.backgroundColor = "#007bff";
submitBtn.style.color = "#fff";
submitBtn.style.border = "none";
submitBtn.style.borderRadius = "4px";
document.body.appendChild(submitBtn);

// ----------------------------------------------------------------------------
// Function to process submission of checked rows.
function submitCheckedRows() {
  // Gather SKUs from all checked rows.
  const checkedCheckboxes = document.querySelectorAll(".rowCheckbox:checked");
  let skuArray = [];

  checkedCheckboxes.forEach(checkbox => {
    const row = checkbox.closest("tr");
    // Assuming the SKU input is in the second cell (index 1).
    const skuInput = row.querySelector("td:nth-child(2) input");
    if (skuInput && skuInput.value.trim() !== "") {
      skuArray.push(skuInput.value.trim());
    }
  });

  if (skuArray.length === 0) {
    alert("No rows selected or missing SKU values.");
    return;
  }

  // Send the SKU array to the verification API.
  fetch(skuVerificationUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sku: skuArray })
  })
    .then(response => response.json())
    .then(apiResponse => {
      if (apiResponse.Ack === "Success" && Array.isArray(apiResponse.Item)) {
        // Create a set of returned SKUs for easy lookup.
        const returnedSKUs = new Set(apiResponse.Item.map(item => item.SKU));
        // Verify that each submitted SKU exists in the response.
        const missingSKUs = skuArray.filter(sku => !returnedSKUs.has(sku));

        if (missingSKUs.length > 0) {
          alert("The following SKU(s) were not found: " + missingSKUs.join(", "));
        } else {
          // All SKUs validated successfully.
          alert("All SKUs validated and submission complete.");
          // TODO: Implement further submission logic as needed.
        }
      } else {
        alert("Error verifying SKUs. Please try again later.");
      }
    })
    .catch(error => {
      console.error("Error during SKU verification:", error);
      alert("Error during SKU verification. Please try again later.");
    });
}

// ----------------------------------------------------------------------------
// Attach event listener to the submit button.
submitBtn.addEventListener("click", submitCheckedRows);

// ----------------------------------------------------------------------------
// "Select All" checkbox functionality.
const selectAllCheckbox = document.getElementById("selectAll");
selectAllCheckbox.addEventListener("change", function () {
  const rowCheckboxes = document.querySelectorAll(".rowCheckbox");
  rowCheckboxes.forEach(function (checkbox) {
    checkbox.checked = selectAllCheckbox.checked;
  });
});
