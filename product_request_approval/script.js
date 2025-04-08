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

/**
* Create a table row element for a given product data object.
* Renders client_mup, retail_mup, client_price, and rrp as input fields (allowing float values).
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

// Client MUP (New field as an input)
const clientMupTd = document.createElement("td");
const clientMupInput = document.createElement("input");
clientMupInput.type = "number";
clientMupInput.step = "0.01";
clientMupInput.classList.add("clientMupInput");
clientMupInput.value = parseFloat(data.client_mup).toFixed(2);
clientMupTd.appendChild(clientMupInput);
tr.appendChild(clientMupTd);

// Retail MUP (New field as an input)
const retailMupTd = document.createElement("td");
const retailMupInput = document.createElement("input");
retailMupInput.type = "number";
retailMupInput.step = "0.01";
retailMupInput.classList.add("retailMupInput");
retailMupInput.value = parseFloat(data.retail_mup).toFixed(2);
retailMupTd.appendChild(retailMupInput);
tr.appendChild(retailMupTd);

// Client Price (New field as an input)
const clientPriceTd = document.createElement("td");
const clientPriceInput = document.createElement("input");
clientPriceInput.type = "number";
clientPriceInput.step = "0.01";
clientPriceInput.classList.add("clientPriceInput");
clientPriceInput.value = parseFloat(data.client_price).toFixed(2);
clientPriceTd.appendChild(clientPriceInput);
tr.appendChild(clientPriceTd);

// RRP (Now rendered as an input field)
const rrpTd = document.createElement("td");
const rrpInput = document.createElement("input");
rrpInput.type = "number";
rrpInput.step = "0.01";
rrpInput.classList.add("rrpInput");
rrpInput.value = parseFloat(data.rrp).toFixed(2);
rrpTd.appendChild(rrpInput);
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
