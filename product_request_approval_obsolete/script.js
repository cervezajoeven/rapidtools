// ====================================================================
// Firebase Initialization
// ====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAfcffroNPQiXxSZmk7ahUJ_5ez9eO3CCQ",
  authDomain: "rapidclean-ba9be.firebaseapp.com",
  projectId: "rapidclean-ba9be",
  storageBucket: "rapidclean-ba9be.firebasestorage.app",
  messagingSenderId: "39304689168",
  appId: "1:39304689168:web:19e9d73377df109270bc95",
  measurementId: "G-PLE91ET2H3"
};

// Initialize Firebase (Firebase scripts loaded in HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ====================================================================
// API Endpoints & Fetch Helper
// ====================================================================
const BRANDS_URL = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/58215302c1c24203886ccf481adbaac5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RFQ4OtbS6cyjB_JzaIsowmww4KBqPQgavWLg18znE5s';
const SUPPLIER_URL = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/da5c5708146642768d63293d2bbb9668/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-n0W0PxlF1G83xHYHGoEOhv3XmHXWlesbRk5NcgNT9w';
const CATEGORIES_URL = 'https://prod-47.australiasoutheast.logic.azure.com:443/workflows/0d67bc8f1bb64e78a2495f13a7498081/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fJJzmNyuARuwEcNCoMuWwMS9kmWZQABw9kJXsUj9Wk8';
const SKU_VERIFICATION_URL = 'https://prod-03.australiasoutheast.logic.azure.com:443/workflows/151bc47e0ba4447b893d1c9fea9af46f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bRyr_oW-ud06XlU5VLhBqQ7tyU__jD3clEOGIEhax-Q';

// ====================================================================
// Loader Helper Functions
// ====================================================================
function showLoader() {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "flex";
  }
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "none";
  }
}

// ====================================================================
// Helper Functions for Validation
// ====================================================================
function attachValidationListener(input) {
  if (input.type !== "checkbox") {
    input.addEventListener("input", function() {
      if(this.value.trim() === "") {
        this.style.border = "1px solid red";
      } else {
        this.style.border = "";
      }
    });
  }
}

function validateRowInputs(row) {
  let valid = true;
  const inputs = row.querySelectorAll("input:not([type='checkbox'])");
  inputs.forEach(input => {
    if(input.value.trim() === "") {
      input.style.border = "1px solid red";
      valid = false;
    } else {
      input.style.border = "";
    }
  });
  return valid;
}

// ====================================================================
// DOM Helper Functions
// ====================================================================
function updateSelectElements(selectSelector, options, placeholderText, valueKey) {
  const selects = document.querySelectorAll(selectSelector);
  selects.forEach(select => {
    const currentValue = select.getAttribute("data-selected") || "";
    select.innerHTML = "";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholderText;
    select.appendChild(placeholderOption);
    options.forEach(item => {
      const option = document.createElement("option");
      option.value = item[valueKey];
      option.textContent = item[valueKey];
      if (currentValue === item[valueKey]) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });
}

function updateBrandSelects(brandsList) {
  updateSelectElements("select.brandSelect", brandsList, "Select Brand", "ContentName");
}

function updateSupplierSelects(supplierList) {
  updateSelectElements("select.supplierSelect", supplierList, "Select Supplier", "SupplierID");
}

function updateCategorySelects(categoriesList) {
  $("select.categorySelect").each(function() {
      if ($(this).data('select2')) {
           $(this).select2('destroy');
      }
  });
  updateSelectElements("select.categorySelect", categoriesList, "Select Category", "CategoryName");
  $("select.categorySelect").select2({
      width: 'resolve',
      placeholder: "Select Category",
      allowClear: true
  });
}

// ====================================================================
// Calculation helpers.
function calculateClientPrice(purchasePrice, clientMup) {
  return purchasePrice * clientMup * 1.1;
}
function calculateRrp(purchasePrice, retailMup) {
  return purchasePrice * retailMup * 1.1;
}

// ====================================================================
// Create a table row with all fields including new Requestor Name.
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

// ====================================================================
// Event Handlers
// ====================================================================
function initEventHandlers() {
  const submitBtn = document.getElementById("submitChecked");
  if (submitBtn) {
    submitBtn.addEventListener("click", submitCheckedRows);
  }
  
  const deleteBtn = document.getElementById("deleteChecked");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", deleteCheckedRows);
  }
  
  initHeaderApplyButtons();
  
  const selectAllCheckbox = document.getElementById("selectAll");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", () => {
      document.querySelectorAll(".rowCheckbox").forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
      });
    });
  }
}

function initHeaderApplyButtons() {
  const applyClientMupBtn = document.getElementById("applyClientMupBtn");
  if (applyClientMupBtn) {
    applyClientMupBtn.addEventListener("click", applyClientMupToAllRows);
  }
  const applyRetailMupBtn = document.getElementById("applyRetailMupBtn");
  if (applyRetailMupBtn) {
    applyRetailMupBtn.addEventListener("click", applyRetailMupToAllRows);
  }
  const applyCategoryBtn = document.getElementById("applyCategoryBtn");
  if (applyCategoryBtn) {
    applyCategoryBtn.addEventListener("click", applyCategoryToAllRows);
  }
}

async function fetchApiData(url, dataKey) {
  try {
    const response = await fetch(url, { method: "POST" });
    const data = await response.json();
    if (data.status === 200 && data.message && Array.isArray(data.message[dataKey])) {
      return data.message[dataKey];
    } else {
      console.error("Unexpected API response:", data);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    return [];
  }
}


async function submitCheckedRows() {
  // Validate checked rows.
  let allRowsValid = true;
  const checkedRows = document.querySelectorAll(".rowCheckbox:checked");
  checkedRows.forEach(checkbox => {
    const row = checkbox.closest("tr");
    if (!validateRowInputs(row)) {
      allRowsValid = false;
    }
  });
  if (!allRowsValid) {
    toastr.error("Please fill in all required fields.");
    return;
  }
  
  const skuArray = [];
  const skuToRows = {};
  checkedRows.forEach(checkbox => {
    const row = checkbox.closest("tr");
    const skuInput = row.querySelector("td:nth-child(3) input"); // Adjusted due to new Requestor column
    if (skuInput && skuInput.value.trim() !== "") {
      const skuValue = skuInput.value.trim();
      skuArray.push(skuValue);
      if (!skuToRows[skuValue]) {
        skuToRows[skuValue] = [];
      }
      skuToRows[skuValue].push(row);
    }
  });
  
  if (skuArray.length === 0) {
    toastr.warning("No rows selected or missing SKU values.");
    return;
  }
  
  const localDuplicates = Object.keys(skuToRows).filter(sku => skuToRows[sku].length > 1);
  if (localDuplicates.length > 0) {
    localDuplicates.forEach(dupSku => {
      skuToRows[dupSku].forEach(row => {
        row.style.backgroundColor = "orange";
      });
    });
    toastr.error("Duplicate SKU found in submitted rows: " + localDuplicates.join(", "));
    return;
  }
  
  showLoader();
  try {
    const response = await fetch(SKU_VERIFICATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku: skuArray })
    });
    const apiResponse = await response.json();
    if (apiResponse.Ack === "Success" && Array.isArray(apiResponse.Item)) {
      const returnedSKUs = new Set(apiResponse.Item.map(item => item.SKU));
  
      Object.keys(skuToRows).forEach(sku => {
        skuToRows[sku].forEach(row => {
          row.style.backgroundColor = returnedSKUs.has(sku) ? "red" : "";
        });
      });
  
      const duplicateSKUs = skuArray.filter(sku => returnedSKUs.has(sku));
      if (duplicateSKUs.length > 0) {
        toastr.info("Duplicate SKUs (already exist): " + duplicateSKUs.join(", "));
      }
  
      const newSKUList = skuArray.filter(sku => !returnedSKUs.has(sku));
      if (newSKUList.length > 0) {
        const newItemsArray = newSKUList.map(sku => {
          const row = skuToRows[sku][0];
          return {
            docId: row.getAttribute("data-doc-id"),
            sku: sku,
            productName: row.querySelector("td:nth-child(4) input").value,
            brand: row.querySelector("td:nth-child(5) select").value,
            primarySupplier: row.querySelector("td:nth-child(6) select").value,
            categoryId: row.querySelector("td:nth-child(7) select").value,
            purchasePrice: row.querySelector("td:nth-child(8) input").value,
            clientMup: row.querySelector("td:nth-child(9) input").value,
            retailMup: row.querySelector("td:nth-child(10) input").value,
            rrp: row.querySelector("td:nth-child(12) input").value,
            requestor_email: row.getAttribute("data-requestor-email"),
            requestor_firstname: row.getAttribute("data-requestor-firstname"),
            requestor_lastname: row.getAttribute("data-requestor-lastname")
          };
        });
        sendNewItems(newItemsArray);
      } else {
        toastr.info("No new SKUs to create; all selected SKUs are duplicates.");
      }
    } else {
      toastr.error("Error verifying SKUs. Please try again later.");
    }
  } catch (error) {
    console.error("Error during SKU verification:", error);
    toastr.error("Error during SKU verification. Please try again later.");
  } finally {
    hideLoader();
  }
}

async function deleteCheckedRows() {
  const checkedRows = document.querySelectorAll(".rowCheckbox:checked");
  if (checkedRows.length === 0) {
    toastr.warning("No rows selected for deletion.");
    return;
  }
  
  showLoader();
  const deletionPromises = [];
  checkedRows.forEach(rowCheckbox => {
    const row = rowCheckbox.closest("tr");
    const docId = row.getAttribute("data-doc-id");
    if (docId) {
      const deletionPromise = db.collection("product_requests").doc(docId).update({
        status: "delete",
        deletion_date: new Date().toISOString()
      })
      .then(() => {
        row.style.backgroundColor = "#ccc";
        toastr.success("Request deleted successfully for doc id: " + docId);
      })
      .catch((error) => {
        console.error("Error deleting document with id " + docId, error);
        toastr.error("Error deleting request for doc id: " + docId);
      });
      deletionPromises.push(deletionPromise);
    }
  });
  await Promise.all(deletionPromises);
  hideLoader();
}

async function sendNewItems(newItemsArray) {
  for (const item of newItemsArray) {
    const purchasePrice = parseFloat(item.purchasePrice) || 0;
    const clientMUP = parseFloat(item.clientMup) || 0;
    const retailMUP = parseFloat(item.retailMup) || 0;
    const categoryId = parseInt(item.categoryId, 10) || 0;
    const rrp = parseFloat(item.rrp) || 0;
    const priceGroup = purchasePrice * clientMUP * 1.1;
  
    const payload = {
      SKU: item.sku || "",
      Model: item.productName || "",
      Brand: item.brand || "",
      PrimarySupplier: item.primarySupplier || "",
      DefaultPurchasePrice: purchasePrice,
      Category: categoryId,
      RRP: rrp,
      ClientMUP: clientMUP,
      RetailMUP: retailMUP,
      PriceGroup: priceGroup,
      requestor_email: item.requestor_email || "",
      requestor_firstname: item.requestor_firstName || "",
      requestor_lastname: item.requestor_lastName || ""
    };
    
    try {
      const response = await fetch(
        "https://prod-52.australiasoutheast.logic.azure.com:443/workflows/fa1aaf833393486a82d6edb76ad0ff33/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FLveH751-xsf6plOm8Fm3awsXw2oFBHAfogkn0IwnGY",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      
      const contentType = response.headers.get("content-type");
      let responseData;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      console.log("Response from new API for SKU " + item.sku + ":", responseData);
      
      if (item.docId) {
        db.collection("product_requests").doc(item.docId).update({
          status: "product_created",
          product_creation_date: new Date().toISOString()
        })
        .then(() => {
          toastr.success("Product created successfully for SKU: " + item.sku);
        })
        .catch((updateError) => {
          console.error("Error updating Firestore for SKU " + item.sku, updateError);
          toastr.error("Failed to update Firestore for SKU: " + item.sku);
        });
      }
    } catch (error) {
      console.error("Error sending new item for SKU " + item.sku + ":", error);
      toastr.error("Error sending new item for SKU: " + item.sku);
    }
  }
}

function applyClientMupToAllRows() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  if (rows.length === 0) {
    alert("No data rows available.");
    return;
  }
  const firstRow = rows[0];
  const firstClientMup = firstRow.querySelector("td:nth-child(9) input"); // Adjusted index
  if (!firstClientMup) {
    alert("Unable to retrieve Client MUP from the first row.");
    return;
  }
  const clientMupVal = firstClientMup.value;
  rows.forEach((row, idx) => {
    if (idx === 0) return;
    const clientMupInput = row.querySelector("td:nth-child(9) input");
    if (clientMupInput) {
      clientMupInput.value = clientMupVal;
      clientMupInput.dispatchEvent(new Event("input"));
    }
  });
  alert("Client MUP value applied to all rows.");
}

function applyRetailMupToAllRows() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  if (rows.length === 0) {
    alert("No data rows available.");
    return;
  }
  const firstRow = rows[0];
  const firstRetailMup = firstRow.querySelector("td:nth-child(10) input"); // Adjusted index
  if (!firstRetailMup) {
    alert("Unable to retrieve Retail MUP from the first row.");
    return;
  }
  const retailMupVal = firstRetailMup.value;
  rows.forEach((row, idx) => {
    if (idx === 0) return;
    const retailMupInput = row.querySelector("td:nth-child(10) input");
    if (retailMupInput) {
      retailMupInput.value = retailMupVal;
      retailMupInput.dispatchEvent(new Event("input"));
    }
  });
  alert("Retail MUP value applied to all rows.");
}

function applyCategoryToAllRows() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  if (rows.length === 0) {
    alert("No data rows available.");
    return;
  }
  const firstRow = rows[0];
  const firstCategorySelect = firstRow.querySelector("select.categorySelect");
  if (!firstCategorySelect) {
    alert("Unable to retrieve Category from the first row.");
    return;
  }
  const categoryVal = firstCategorySelect.value;
  rows.forEach((row, idx) => {
    if (idx === 0) return;
    const categorySelect = row.querySelector("select.categorySelect");
    if (categorySelect) {
      categorySelect.value = categoryVal;
      categorySelect.dispatchEvent(new Event("change"));
    }
  });
  alert("Category value applied to all rows.");
}

// ====================================================================
// Main Initialization
// ====================================================================
let brandsList = [];
let supplierList = [];
let categoriesList = [];

async function loadData() {
  [brandsList, supplierList, categoriesList] = await Promise.all([
    fetchApiData(BRANDS_URL, "Content"),
    fetchApiData(SUPPLIER_URL, "Supplier"),
    fetchApiData(CATEGORIES_URL, "Category")
  ]);
  updateBrandSelects(brandsList);
  updateSupplierSelects(supplierList);
  updateCategorySelects(categoriesList);
}

function loadTableRows() {
  const tbody = document.querySelector("#productTable tbody");
  db.collection("product_requests")
    .where("status", "==", "request")
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const data = doc.data();
        data.docId = doc.id;
        const row = createTableRow(data);
        row.setAttribute("data-doc-id", doc.id);
        row.setAttribute("data-requestor-email", data.requestor_email || "");
        row.setAttribute("data-requestor-firstname", data.requestor_firstName || "");
        row.setAttribute("data-requestor-lastname", data.requestor_lastName || "");
        tbody.appendChild(row);
      });
      updateBrandSelects(brandsList);
      updateSupplierSelects(supplierList);
      updateCategorySelects(categoriesList);
    })
    .catch(error => {
      console.error("Error fetching Firestore documents:", error);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  };

  showLoader();
  await loadData();
  loadTableRows();
  initEventHandlers();
  hideLoader();
});
