// Firebase configuration
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
  
  /**
   * Create a table row element for a given product data object.
   * @param {Object} data - The Firestore document data.
   * @returns {HTMLElement} - A table row element populated with data.
   */
  function createTableRow(data) {
    const tr = document.createElement("tr");
  
    // Checkbox column
    const checkboxTd = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("rowCheckbox");
    checkboxTd.appendChild(checkbox);
    tr.appendChild(checkboxTd);
  
    // SKU column
    const skuTd = document.createElement("td");
    skuTd.textContent = data.sku;
    tr.appendChild(skuTd);
  
    // Product Name column
    const productNameTd = document.createElement("td");
    productNameTd.textContent = data.product_name;
    tr.appendChild(productNameTd);
  
    // Brand column
    const brandTd = document.createElement("td");
    brandTd.textContent = data.brand;
    tr.appendChild(brandTd);
  
    // Primary Supplier column
    const primarySupplierTd = document.createElement("td");
    primarySupplierTd.textContent = data.primary_supplier;
    tr.appendChild(primarySupplierTd);
  
    // Purchase Price column
    const purchasePriceTd = document.createElement("td");
    purchasePriceTd.textContent = data.purchase_price;
    tr.appendChild(purchasePriceTd);
  
    // RRP column
    const rrpTd = document.createElement("td");
    rrpTd.textContent = data.rrp;
    tr.appendChild(rrpTd);
  
    return tr;
  }
  
  // Fetch data from the Firestore "product_requests" collection where status is "request"
  db.collection("product_requests")
    .where("status", "==", "request")
    .get()
    .then((querySnapshot) => {
      const tbody = document.querySelector("#productTable tbody");
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = createTableRow(data);
        tbody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error fetching documents: ", error);
    });
  
  // "Select All" checkbox functionality
  const selectAllCheckbox = document.getElementById('selectAll');
  
  selectAllCheckbox.addEventListener('change', function () {
    const rowCheckboxes = document.querySelectorAll('.rowCheckbox');
    rowCheckboxes.forEach(function(checkbox) {
      checkbox.checked = selectAllCheckbox.checked;
    });
  });
  