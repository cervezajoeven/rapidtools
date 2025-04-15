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
    console.error("Error fetching Firestore product requests:", error);
  }
}

// ====================================================================
// New Function: Search Markups Using Mixed Terms from Product Requests
// ====================================================================
async function searchMarkupsByProductRequestTerms() {
  try {
    // Query product_requests with status "request"
    const requestSnapshot = await db.collection("product_requests")
      .where("status", "==", "request")
      .get();
      
    const productRequests = [];
    requestSnapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      productRequests.push(data);
    });
    console.log("Total product requests loaded:", productRequests.length);

    // Extract unique, non-empty values from both 'brand' and 'primary_supplier'
    const brandTerms = productRequests.map(req => (req.brand || "").trim());
    const supplierTerms = productRequests.map(req => (req.primary_supplier || "").trim());
    const combinedTerms = brandTerms.concat(supplierTerms);
    
    const searchTerms = Array.from(new Set(combinedTerms)).filter(term => term !== "");
    console.log("Unique search terms from product requests (mixed):", searchTerms);

    // Retrieve all documents from the "markups" collection once.
    const markupsSnapshot = await db.collection("markups").get();
    const allMarkups = [];
    markupsSnapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      allMarkups.push(data);
    });
    console.log("Total markups documents loaded:", allMarkups.length);

    // Create an object to store search results for each term.
    const results = {};
    searchTerms.forEach(term => {
      if (!term || term.trim() === "") {
        console.log("Skipping empty term");
        return;
      }
      // Filter the markups documents by a case-insensitive partial match on the "brand" field.
      const matches = allMarkups.filter(doc => {
        const brand = doc.brand ? doc.brand.toLowerCase() : "";
        return brand.includes(term.toLowerCase());
      });
      results[term] = matches;
      console.log(`Term "${term}" matched ${matches.length} markups.`);
    });
    
    console.log("Final search results for each term:", results);
    renderSearchResults(results);
  } catch (error) {
    console.error("Error searching markups by product request terms:", error);
  }
}

// ====================================================================
// New Function: Render Search Results into the Search Results Table
// ====================================================================
function renderSearchResults(results) {
  const tableBody = document.querySelector("#searchResultsTable tbody");
  if (!tableBody) return;
  
  // Clear existing contents.
  tableBody.innerHTML = "";
  
  // Iterate over the search results object.
  Object.keys(results).forEach(term => {
    const docs = results[term];
    docs.forEach(doc => {
      const tr = document.createElement("tr");
      
      // Brand
      const tdBrand = document.createElement("td");
      tdBrand.textContent = doc.brand;
      tr.appendChild(tdBrand);
      
      // Main Category
      const tdMainCategory = document.createElement("td");
      tdMainCategory.textContent = doc.main_category ? doc.main_category : "";
      tr.appendChild(tdMainCategory);
      
      // Sub Category
      const tdSubCategory = document.createElement("td");
      tdSubCategory.textContent = doc.sub_category ? doc.sub_category : "";
      tr.appendChild(tdSubCategory);
      
      // Description
      const tdDescription = document.createElement("td");
      tdDescription.textContent = doc.description ? doc.description : "";
      tr.appendChild(tdDescription);
      
      // RRP Markup
      const tdRrpMarkup = document.createElement("td");
      tdRrpMarkup.textContent = (doc.rrp_markup || doc.rrp_markup === 0) ? doc.rrp_markup : "";
      tr.appendChild(tdRrpMarkup);
      
      tableBody.appendChild(tr);
    });
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
  await loadTableRows();
  initEventHandlers();
  // Use the mixed brand and supplier values from product requests as search terms.
  await searchMarkupsByProductRequestTerms();
  hideLoader();
});
