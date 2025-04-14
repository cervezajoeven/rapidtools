// Firebase configuration (same as your original configuration)
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
  
  // Simple function to load all product requests sorted by creation_date descending
  function loadAllRequests() {
    const tbody = document.querySelector('#allRequestsTable tbody');
    tbody.innerHTML = '';
  
    // Query Firestore to retrieve documents sorted by "creation_date" (latest first)
    db.collection("product_requests")
      .orderBy("creation_date", "desc")
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
  
          // Build a simple string for Requestor Name (combining first and last names)
          const requestorName = ((data.requestor_firstName || "") + " " + (data.requestor_lastName || "")).trim();
          const sku = data.sku || "";
          const productName = data.product_name || "";
          const brand = data.brand || "";
          const primarySupplier = data.primary_supplier || "";
          const category = data.category || "";
          // Format numeric values if available
          const purchasePrice = (data.purchase_price !== undefined) ? parseFloat(data.purchase_price).toFixed(2) : "";
          const clientMup = (data.client_mup !== undefined) ? parseFloat(data.client_mup).toFixed(2) : "";
          const retailMup = (data.retail_mup !== undefined) ? parseFloat(data.retail_mup).toFixed(2) : "";
          const clientPrice = (data.client_price !== undefined) ? parseFloat(data.client_price).toFixed(2) : "";
          const rrp = (data.rrp !== undefined) ? parseFloat(data.rrp).toFixed(2) : "";
          const status = data.status || "";
  
          // Create a table row using a template literal
          const rowHTML = `
            <tr>
              <td>${requestorName}</td>
              <td>${sku}</td>
              <td>${productName}</td>
              <td>${brand}</td>
              <td>${primarySupplier}</td>
              <td>${category}</td>
              <td>${purchasePrice}</td>
              <td>${clientMup}</td>
              <td>${retailMup}</td>
              <td>${clientPrice}</td>
              <td>${rrp}</td>
              <td>${status}</td>
            </tr>
          `;
          tbody.insertAdjacentHTML('beforeend', rowHTML);
        });
      })
      .catch((err) => console.error("Error retrieving documents: ", err));
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    loadAllRequests();
  });
  