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

async function submitCheckedRows() {
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
    const skuInput = row.querySelector("td:nth-child(3) input");
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
      // Updated to use correct lower-case property names:
      requestor_firstname: item.requestor_firstname || "",
      requestor_lastname: item.requestor_lastname || ""
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
        // Retrieve the corresponding row to read updated values
        const row = document.querySelector(`tr[data-doc-id="${item.docId}"]`);
        const updatedCategory = row ? row.querySelector("td:nth-child(7) select").value : item.categoryId;
        const updatedClientMup = row ? row.querySelector("td:nth-child(9) input").value : item.clientMup;
        const updatedRetailMup = row ? row.querySelector("td:nth-child(10) input").value : item.retailMup;
        const updatedClientPrice = row ? row.querySelector("td:nth-child(11) input").value : "";
        const updatedRrp = row ? row.querySelector("td:nth-child(12) input").value : item.rrp;
        
        db.collection("product_requests").doc(item.docId).update({
          status: "product_created",
          product_creation_date: new Date().toISOString(),
          category: updatedCategory,
          client_mup: parseFloat(updatedClientMup),
          retail_mup: parseFloat(updatedRetailMup),
          client_price: updatedClientPrice === "" ? null : parseFloat(updatedClientPrice),
          rrp: parseFloat(updatedRrp)
        })
        .then(() => {
          toastr.success("Product created successfully for SKU: " + item.sku);
          // Clear the corresponding row from the table
          if (row && row.parentNode) {
            row.parentNode.removeChild(row);
          }
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
  const firstClientMup = firstRow.querySelector("td:nth-child(9) input");
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
  const firstRetailMup = firstRow.querySelector("td:nth-child(10) input");
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
// Delegated jQuery Event Listener for Category Dropdown Changes
// ====================================================================
$(document).on("change", "select.categorySelect", function(e) {
  console.log("Category changed to id:", $(this).val());
});
