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
      if (this.value.trim() === "") {
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
    if (input.value.trim() === "") {
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
  // Destroy any existing select2 instances on category selects.
  $("select.categorySelect").each(function() {
    if ($(this).data('select2')) {
      $(this).select2('destroy');
    }
  });
  // Update each category select manually.
  const selects = document.querySelectorAll("select.categorySelect");
  selects.forEach(select => {
    const currentValue = select.getAttribute("data-selected") || "";
    select.innerHTML = "";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Category";
    select.appendChild(placeholderOption);
    
    categoriesList.forEach(item => {
      const option = document.createElement("option");
      // Use the CategoryID from the API as the value.
      option.value = item.CategoryID;
      // Display the CategoryName in the dropdown.
      option.textContent = item.CategoryName;
      // If the current value matches either CategoryID or CategoryName, mark as selected.
      if (currentValue === item.CategoryID || currentValue === item.CategoryName) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });
  // Reinitialize select2 for the updated elements.
  $("select.categorySelect").select2({
    width: 'resolve',
    placeholder: "Select Category",
    allowClear: true
  });
}

// ====================================================================
// Calculation Helpers
// ====================================================================
function calculateClientPrice(purchasePrice, clientMup) {
  return purchasePrice * clientMup * 1.1;
}

function calculateRrp(purchasePrice, retailMup) {
  return purchasePrice * retailMup * 1.1;
}
