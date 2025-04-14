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

async function loadTableRows() {
  const tbody = document.querySelector("#productTable tbody");
  try {
    const querySnapshot = await db.collection("product_requests")
      .where("status", "==", "request")
      .get();
    if (querySnapshot.empty) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 12; // Adjust if table columns change.
      td.textContent = "No Request at the moment";
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
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
    }
    updateBrandSelects(brandsList);
    updateSupplierSelects(supplierList);
    updateCategorySelects(categoriesList);
  } catch (error) {
    console.error("Error fetching Firestore documents:", error);
  }
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
  await loadTableRows();
  initEventHandlers();
  hideLoader();
});
