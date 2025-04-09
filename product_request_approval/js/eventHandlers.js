// eventHandlers.js
import { SKU_VERIFICATION_URL } from "./api.js";

// Initialize all event handlers including header apply buttons
export function initEventHandlers() {
  // Create and style the submit button (unchanged)
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
  submitBtn.addEventListener("click", submitCheckedRows);

  // Attach event listeners for header "Apply All" buttons
  initHeaderApplyButtons();

  // "Select All" checkbox functionality
  const selectAllCheckbox = document.getElementById("selectAll");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", () => {
      const checkboxes = document.querySelectorAll(".rowCheckbox");
      checkboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
      });
    });
  }
}

// Function to attach header button events
function initHeaderApplyButtons() {
  const applyClientMupBtn = document.getElementById("applyClientMupBtn");
  if (applyClientMupBtn) {
    applyClientMupBtn.addEventListener("click", applyClientMupToAllRows);
  }
  const applyRetailMupBtn = document.getElementById("applyRetailMupBtn");
  if (applyRetailMupBtn) {
    applyRetailMupBtn.addEventListener("click", applyRetailMupToAllRows);
  }
}

// Function to process submission of checked rows.
async function submitCheckedRows() {
  const checkboxes = document.querySelectorAll(".rowCheckbox:checked");
  const skuArray = [];
  checkboxes.forEach(checkbox => {
    const row = checkbox.closest("tr");
    const skuInput = row.querySelector("td:nth-child(2) input");
    if (skuInput && skuInput.value.trim() !== "") {
      skuArray.push(skuInput.value.trim());
    }
  });

  if (skuArray.length === 0) {
    alert("No rows selected or missing SKU values.");
    return;
  }

  try {
    const response = await fetch(SKU_VERIFICATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku: skuArray })
    });
    const apiResponse = await response.json();
    if (apiResponse.Ack === "Success" && Array.isArray(apiResponse.Item)) {
      const returnedSKUs = new Set(apiResponse.Item.map(item => item.SKU));
      const missingSKUs = skuArray.filter(sku => !returnedSKUs.has(sku));
      if (missingSKUs.length > 0) {
        alert("The following SKU(s) were not found: " + missingSKUs.join(", "));
      } else {
        alert("All SKUs validated and submission complete.");
        // Further submission logic can be added here.
      }
    } else {
      alert("Error verifying SKUs. Please try again later.");
    }
  } catch (error) {
    console.error("Error during SKU verification:", error);
    alert("Error during SKU verification. Please try again later.");
  }
}

// Function to apply the first row's Client MUP to all other rows
function applyClientMupToAllRows() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  if (rows.length === 0) {
    alert("No data rows available.");
    return;
  }

  const firstRow = rows[0];
  const firstClientMup = firstRow.querySelector("td:nth-child(8) input");
  if (!firstClientMup) {
    alert("Unable to retrieve Client MUP from the first row.");
    return;
  }
  const clientMupVal = firstClientMup.value;

  rows.forEach((row, idx) => {
    if (idx === 0) return; // Skip first row
    const clientMupInput = row.querySelector("td:nth-child(8) input");
    if (clientMupInput) {
      clientMupInput.value = clientMupVal;
      // Dispatch an input event to trigger any update logic attached
      clientMupInput.dispatchEvent(new Event("input"));
    }
  });
  alert("Client MUP value applied to all rows.");
}

// Function to apply the first row's Retail MUP to all other rows
function applyRetailMupToAllRows() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  if (rows.length === 0) {
    alert("No data rows available.");
    return;
  }

  const firstRow = rows[0];
  const firstRetailMup = firstRow.querySelector("td:nth-child(9) input");
  if (!firstRetailMup) {
    alert("Unable to retrieve Retail MUP from the first row.");
    return;
  }
  const retailMupVal = firstRetailMup.value;

  rows.forEach((row, idx) => {
    if (idx === 0) return; // Skip first row
    const retailMupInput = row.querySelector("td:nth-child(9) input");
    if (retailMupInput) {
      retailMupInput.value = retailMupVal;
      retailMupInput.dispatchEvent(new Event("input"));
    }
  });
  alert("Retail MUP value applied to all rows.");
}
