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
  // Calculation Helpers
  // ====================================================================
  function calculateClientPrice(purchasePrice, clientMup) {
    return purchasePrice * clientMup * 1.1;
  }
  
  function calculateRrp(purchasePrice, retailMup) {
    return purchasePrice * retailMup * 1.1;
  }
  