// main.js
import { db } from "./firebase.js";
import { fetchApiData, BRANDS_URL, SUPPLIER_URL, CATEGORIES_URL } from "./api.js";
import { updateBrandSelects, updateSupplierSelects, updateCategorySelects, createTableRow } from "./dom.js";
import { initEventHandlers } from "./eventHandlers.js";

let brandsList = [];
let supplierList = [];
let categoriesList = [];

// Fetch all data from the API endpoints in parallel and update the select dropdowns
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

// Load Firestore data and populate the table rows
function loadTableRows() {
  const tbody = document.querySelector("#productTable tbody");
  db.collection("product_requests")
    .where("status", "==", "request")
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const row = createTableRow(data);
        tbody.appendChild(row);
      });
      // Update dropdowns inside the newly created rows
      updateBrandSelects(brandsList);
      updateSupplierSelects(supplierList);
      updateCategorySelects(categoriesList);
    })
    .catch(error => {
      console.error("Error fetching documents:", error);
    });
}

// Initialize the app after DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  loadTableRows();
  initEventHandlers();
});
