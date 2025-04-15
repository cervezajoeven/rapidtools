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

// Global pagination variables
const pageSize = 10;
let currentPage = 0;
let totalPages = 0;
let pageCursors = []; // Will store the last document snapshot for each page

// Updates the pagination display text
function updatePaginationDisplay() {
  document.getElementById("pageNumbers").innerText = `Page ${currentPage + 1} of ${totalPages}`;
}

// Loads the total number of pages using the same query criteria as in the paginated query.
function loadTotalPages() {
  db.collection("product_requests")
    .orderBy("date_created", "desc")
    .get()
    .then(snapshot => {
      const totalDocs = snapshot.size;
      console.log(`Total documents matching query: ${totalDocs}`);
      totalPages = totalDocs > 0 ? Math.ceil(totalDocs / pageSize) : 1;
      updatePaginationDisplay();
    })
    .catch(err => console.error("Error retrieving total document count:", err));
}

// Function to load a specific page based on pageIndex
function loadPage(pageIndex) {
  const tbody = document.querySelector('#allRequestsTable tbody');
  if (!tbody) {
    console.error("Table body element '#allRequestsTable tbody' not found!");
    return;
  }
  tbody.innerHTML = ''; // Clear current rows
  console.log(`Loading page ${pageIndex + 1}`);

  // Build the query using "date_created" ordered descending, with a limit.
  let query = db.collection("product_requests")
    .orderBy("date_created", "desc")
    .limit(pageSize);

  // For pages past the first, use the cursor from the previous page.
  if (pageIndex > 0 && pageCursors[pageIndex - 1]) {
    query = query.startAfter(pageCursors[pageIndex - 1]);
  }

  query.get()
    .then(snapshot => {
      console.log(`Documents fetched: ${snapshot.size}`);

      if (snapshot.empty) {
        console.log("No product requests found on this page.");
      } else {
        // Store the last document snapshot as the cursor for this page
        pageCursors[pageIndex] = snapshot.docs[snapshot.docs.length - 1];

        snapshot.forEach(doc => {
          const data = doc.data();
          const documentId = doc.id;
          // Combine first and last names to form the requestor name
          const requestorName = ((data.requestor_firstName || "") + " " + (data.requestor_lastName || "")).trim();
          const sku = data.sku || "";
          const productName = data.product_name || "";
          const brand = data.brand || "";
          const primarySupplier = data.primary_supplier || "";
          const purchasePrice = (data.purchase_price !== undefined) ? parseFloat(data.purchase_price).toFixed(2) : "";
          const rrp = (data.rrp !== undefined) ? parseFloat(data.rrp).toFixed(2) : "";
          const status = data.status || "";

          // Log the current product details along with its document ID
          console.log(`Adding product (ID: ${documentId}): ${productName}, SKU: ${sku}, Requestor: ${requestorName}`);

          // Create a table row including only the necessary columns
          const rowHTML = `
            <tr>
              <td>${documentId}</td>
              <td>${requestorName}</td>
              <td>${sku}</td>
              <td>${productName}</td>
              <td>${brand}</td>
              <td>${primarySupplier}</td>
              <td>${purchasePrice}</td>
              <td>${rrp}</td>
              <td>${status}</td>
            </tr>
          `;
          tbody.insertAdjacentHTML('beforeend', rowHTML);
        });
      }

      // Update pagination buttons (disable "Previous" on first page and "Next" if fewer than pageSize docs)
      document.getElementById("prevPage").disabled = (pageIndex === 0);
      document.getElementById("nextPage").disabled = (snapshot.size < pageSize);
      currentPage = pageIndex;
      updatePaginationDisplay();
    })
    .catch(err => {
      console.error("Error retrieving documents: ", err);
    });
}

// Set up event listeners once the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Document loaded. Initiating page load.");
  loadTotalPages();
  loadPage(0);

  document.getElementById("nextPage").addEventListener("click", function() {
    loadPage(currentPage + 1);
  });

  document.getElementById("prevPage").addEventListener("click", function() {
    loadPage(currentPage - 1);
  });
});
