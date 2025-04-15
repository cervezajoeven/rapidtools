// Firebase configuration (replace with your actual Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyAfcffroNPQiXxSZmk7ahUJ_5ez9eO3CCQ",
  authDomain: "rapidclean-ba9be.firebaseapp.com",
  projectId: "rapidclean-ba9be",
  storageBucket: "rapidclean-ba9be.firebasestorage.app",
  messagingSenderId: "39304689168",
  appId: "1:39304689168:web:19e9d73377df109270bc95",
  measurementId: "G-PLE91ET2H3"
};

// Initialize Firebase and Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global pagination variables
const pageSize = 10;         // Number of rows per page
let totalCount = 0;          // Total document count in the collection
let pageCursors = [];        // To store the last document snapshot for each fetched page

// Function to load the total number of documents from Firestore.
function loadTotalCount() {
  return db.collection("product_requests")
    .orderBy("date_created", "desc")
    .get()
    .then(snapshot => {
      totalCount = snapshot.size;
      console.log("Total document count:", totalCount);
      return totalCount;
    })
    .catch(err => {
      console.error("Error loading total count:", err);
      return 0;
    });
}

// ag-Grid datasource using the Infinite Row Model.
const datasource = {
  getRows: function (params) {
    const startRow = params.startRow;
    const page = Math.floor(startRow / pageSize);
    console.log(
      "Requesting rows: startRow = " + startRow + ", endRow = " + params.endRow
    );

    let query = db.collection("product_requests")
      .orderBy("date_created", "desc")
      .limit(pageSize);

    if (page > 0 && pageCursors[page - 1]) {
      query = query.startAfter(pageCursors[page - 1]);
    }

    query.get()
      .then(snapshot => {
        if (!snapshot.empty) {
          pageCursors[page] = snapshot.docs[snapshot.docs.length - 1];
        }

        const rows = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            documentId: doc.id,
            requestorName: ((data.requestor_firstName || "") + " " +
                            (data.requestor_lastName || "")).trim(),
            sku: data.sku || "",
            productName: data.product_name || "",
            brand: data.brand || "",
            primarySupplier: data.primary_supplier || "",
            purchasePrice: (data.purchase_price !== undefined)
              ? parseFloat(data.purchase_price).toFixed(2)
              : "",
            rrp: (data.rrp !== undefined)
              ? parseFloat(data.rrp).toFixed(2)
              : "",
            status: data.status || ""
          };
        });

        let lastRow = -1;
        if (snapshot.docs.length < pageSize) {
          lastRow = startRow + snapshot.docs.length;
        } else {
          lastRow = totalCount;
        }
        console.log("Returning rows:", rows, " lastRow:", lastRow);
        params.successCallback(rows, lastRow);
      })
      .catch(err => {
        console.error("Error fetching rows:", err);
        params.failCallback();
      });
  }
};

// ag-Grid column definitions.
const columnDefs = [
  { headerName: "Document ID", field: "documentId" },
  { headerName: "Requestor Name", field: "requestorName" },
  { headerName: "SKU", field: "sku" },
  { headerName: "Product Name", field: "productName" },
  { headerName: "Brand", field: "brand" },
  { headerName: "Primary Supplier", field: "primarySupplier" },
  { headerName: "Purchase Price", field: "purchasePrice" },
  { headerName: "RRP", field: "rrp" },
  { headerName: "Status", field: "status" }
];

// ag-Grid grid options.
const gridOptions = {
  columnDefs: columnDefs,
  rowModelType: "infinite",
  pagination: true,
  paginationPageSize: pageSize,
  cacheBlockSize: pageSize,
  datasource: datasource,
  defaultColDef: {
    resizable: true,
    sortable: true,
    filter: true,
    cellStyle: { padding: "5px" }
  },
  onGridReady: function (params) {
    // Fit all columns to the available width once the grid is ready.
    params.api.sizeColumnsToFit();
  }
};

// When the DOM is ready, initialize ag-Grid and set the datasource.
document.addEventListener("DOMContentLoaded", function () {
  console.log("agGrid global object:", window.agGrid);
  if (!window.agGrid || !window.agGrid.Grid) {
    console.error("Grid constructor not found in agGrid object.", window.agGrid);
    return;
  }
  const gridDiv = document.getElementById("myGrid");
  new window.agGrid.Grid(gridDiv, gridOptions);

  // Adjust column sizing on window resize.
  window.addEventListener("resize", function () {
    if (gridOptions.api) {
      gridOptions.api.sizeColumnsToFit();
    }
  });

  // Load the total document count from Firestore, then set the datasource.
  loadTotalCount().then(() => {
    gridOptions.api.setDatasource(datasource);
  });
});
