// script.js

// ==== Endpoint Configuration (provided by user) ==== 
const endpoints = {
  BRANDS_URL: {
    endpoint: "https://prod-06.australiasoutheast.logic.azure.com:443/workflows/58215302c1c24203886ccf481adbaac5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RFQ4OtbS6cyjB_JzaIsowmww4KBqPQgavWLg18znE5s",
    method: "POST",
    response: {
      dataPath: ['message', 'Content'],
      itemField: 'ContentName'
    }
  },
  SUPPLIER_URL: {
    endpoint: "https://prod-06.australiasoutheast.logic.azure.com:443/workflows/da5c5708146642768d63293d2bbb9668/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-n0W0PxlF1G83xHYHGoEOhv3XmHXWlesbRk5NcgNT9w",
    method: "POST",
    response: {
      dataPath: ['message', 'Supplier'],
      itemField: 'SupplierID'
    }
  },
  CATEGORIES_URL: {
    endpoint: "https://prod-47.australiasoutheast.logic.azure.com:443/workflows/0d67bc8f1bb64e78a2495f13a7498081/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fJJzmNyuARuwEcNCoMuWwMS9kmWZQABw9kJXsUj9Wk8",
    method: "POST",
    response: {
      dataPath: ['message', 'Category'],
      itemFields: ['CategoryID', 'CategoryName']
    }
  }
};

// ==== Firebase Initialization (filled from your .env) ====  
const firebaseConfig = {
  apiKey: "AIzaSyAfcffroNPQiXxSZmk7ahUJ_5ez9eO3CCQ",
  authDomain: "rapidclean-ba9be.firebaseapp.com",
  projectId: "rapidclean-ba9be",
  storageBucket: "rapidclean-ba9be.firebasestorage.app",
  messagingSenderId: "39304689168",
  appId: "1:39304689168:web:19e9d73377df109270bc95",
  measurementId: "G-PLE91"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

$(document).ready(function() {
  // ==== Initialize Select2 for dropdown filters ====
  $('#brand_filter, #primary_supplier_filter, #category_filter').select2({
    theme: 'bootstrap-5',
    placeholder: 'Select a value',
    allowClear: true,
    width: '100%'
  });

  // ==== Initialize DataTable ====
  const dataTable = $('#productTable').DataTable({
    paging: true,
    pageLength: 10,
    info: true,
    searching: false,
    lengthChange: false,
    columns: [
      { orderable: false }, // checkbox column
      null, // SKU
      null, // Product Name
      null, // Brand
      null, // Primary Supplier
      null, // Category
      null, // Purchase Price
      null, // Client MUP
      null, // Retail MUP
      null, // Client Price
      null  // RRP
    ]
  });

  // ==== Load filter dropdown data ====
  (async function loadFilterData() {
    try {
      // Brands
      const brandRes = await fetch(endpoints.BRANDS_URL.endpoint, { method: endpoints.BRANDS_URL.method });
      const brandJson = await brandRes.json();
      const brands = endpoints.BRANDS_URL.response.dataPath.reduce((obj, key) => obj[key], brandJson);
      $('#brand_filter').append('<option></option>');
      brands.forEach(item => {
        $('#brand_filter').append(new Option(item[endpoints.BRANDS_URL.response.itemField], item[endpoints.BRANDS_URL.response.itemField]));
      });

      // Primary Suppliers
      const supRes = await fetch(endpoints.SUPPLIER_URL.endpoint, { method: endpoints.SUPPLIER_URL.method });
      const supJson = await supRes.json();
      const suppliers = endpoints.SUPPLIER_URL.response.dataPath.reduce((obj, key) => obj[key], supJson);
      $('#primary_supplier_filter').append('<option></option>');
      suppliers.forEach(item => {
        $('#primary_supplier_filter').append(new Option(item[endpoints.SUPPLIER_URL.response.itemField], item[endpoints.SUPPLIER_URL.response.itemField]));
      });

      // Categories
      const catRes = await fetch(endpoints.CATEGORIES_URL.endpoint, { method: endpoints.CATEGORIES_URL.method });
      const catJson = await catRes.json();
      const categories = endpoints.CATEGORIES_URL.response.dataPath.reduce((obj, key) => obj[key], catJson);
      $('#category_filter').append('<option></option>');
      categories.forEach(item => {
        $('#category_filter').append(new Option(item.CategoryName, item.CategoryID));
      });

      // Refresh Select2 to show new items
      $('#brand_filter, #primary_supplier_filter, #category_filter').trigger('change');
    } catch (e) {
      console.error('Error loading filter data', e);
      toastr.error('Failed to load filter data');
    }
  })();

  // ==== Existing event handlers (stubs) ====
  $('#deleteChecked').on('click', function() {
    // TODO: implement delete checked logic
  });

  $('#submitChecked').on('click', function() {
    // TODO: implement submit checked logic
  });

  $('#applyCategoryBtn').on('click', function() {
    // TODO: apply selected category to all rows
  });
  
  $('#applyClientMupBtn').on('click', function() {
    // TODO: apply selected client MUP to all rows
  });
  
  $('#applyRetailMupBtn').on('click', function() {
    // TODO: apply selected retail MUP to all rows
  });

  // ==== Apply Filters button handler ====
  $('#submitFilters').on('click', async function() {
    const f = {};
    const sku      = $('#sku_filter').val().trim();
    const model    = $('#product_name_filter').val().trim();
    const brand    = $('#brand_filter').val();
    const supplier = $('#primary_supplier_filter').val();
    const category = $('#category_filter').val();

    if (sku)      f.SKU             = sku;
    if (model)    f.Model           = model;
    if (brand)    f.Brand           = brand;
    if (supplier) f.PrimarySupplier = supplier;
    if (category) f.CategoryID      = category;

    // Static fields
    f.Active = true;
    f.OutputSelector = [
      "SKU",
      "Model",
      "Categories",
      "Brand",
      "PrimarySupplier",
      "RRP",
      "DefaultPurchasePrice",
      "PriceGroups",
      "Misc02",
      "Misc09"
    ];

    try {
      const response = await fetch(
        'https://prod-19.australiasoutheast.logic.azure.com:443/workflows/67422be18c5e4af0ad9291110dedb2fd/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=N_VRTyaFEkOUGjtwu8O56_L-qY6xwvHuGWEOvqKsoAk',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Filter: f })
        }
      );

      console.log('Apply Filters raw response:', response);
      const json = await response.json();
      console.log('Apply Filters response JSON:', json);

      // figure out where the array lives:
      const items = Array.isArray(json)
        ? json
        : Array.isArray(json.value)
        ? json.value
        : Array.isArray(json.results)
        ? json.results
        : [];

      toastr[response.ok ? 'success' : 'error'](
        response.ok ? 'Filters applied successfully' : 'Error applying filters'
      );
      if (!response.ok) throw new Error(JSON.stringify(json));

      // Render into DataTable
      dataTable.clear();
      items.forEach(item => {
        dataTable.row.add([
          '<input type="checkbox" class="row-checkbox" />',
          item.SKU,
          item.Model,
          item.Brand,
          item.PrimarySupplier,
          Array.isArray(item.Categories) ? item.Categories.join(', ') : item.Categories,
          item.DefaultPurchasePrice,
          '', // client MUP placeholder
          '', // retail MUP placeholder
          '', // client price placeholder
          item.RRP
        ]);
      });
      dataTable.draw();
    } catch (err) {
      console.error('Error applying filters:', err);
      toastr.error('Error applying filters: ' + err.message);
    }
  });
});
