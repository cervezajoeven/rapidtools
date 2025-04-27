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
      { orderable: false }, // checkbox
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

  // ==== Helper: parse Categories into comma-separated names ====
  function parseCategories(cats) {
    const names = [];
    if (Array.isArray(cats)) {
      cats.forEach(wrapper => {
        if (wrapper && typeof wrapper === 'object' && 'Category' in wrapper) {
          const inner = wrapper.Category;
          if (Array.isArray(inner)) {
            inner.forEach(c => c.CategoryName && names.push(c.CategoryName));
          } else if (inner && inner.CategoryName) {
            names.push(inner.CategoryName);
          }
        } else if (typeof wrapper === 'string' && wrapper.trim()) {
          names.push(wrapper.trim());
        }
      });
    }
    return names.join(', ');
  }

  // ==== Helper: extract client price (GroupID="2") from PriceGroups ====
  function getClientPrice(priceGroups) {
    if (!Array.isArray(priceGroups)) return '';
    for (const wrapper of priceGroups) {
      const pg = wrapper.PriceGroup;
      if (Array.isArray(pg)) {
        for (const p of pg) {
          if (p && String(p.GroupID) === '2') return p.Price;
        }
      } else if (pg && String(pg.GroupID) === '2') {
        return pg.Price;
      }
    }
    return '';
  }

  // ==== Load filter dropdown data ====
  (async function loadFilterData() {
    try {
      const [bRes, sRes, cRes] = await Promise.all([
        fetch(endpoints.BRANDS_URL.endpoint, { method: endpoints.BRANDS_URL.method }),
        fetch(endpoints.SUPPLIER_URL.endpoint, { method: endpoints.SUPPLIER_URL.method }),
        fetch(endpoints.CATEGORIES_URL.endpoint, { method: endpoints.CATEGORIES_URL.method })
      ]);
      const [bJson, sJson, cJson] = await Promise.all([bRes.json(), sRes.json(), cRes.json()]);

      const brands     = endpoints.BRANDS_URL.response.dataPath.reduce((o,k)=>o[k], bJson);
      const suppliers  = endpoints.SUPPLIER_URL.response.dataPath.reduce((o,k)=>o[k], sJson);
      const categories = endpoints.CATEGORIES_URL.response.dataPath.reduce((o,k)=>o[k], cJson);

      $('#brand_filter').append('<option></option>');
      brands.forEach(i => $('#brand_filter').append(new Option(i[endpoints.BRANDS_URL.response.itemField], i[endpoints.BRANDS_URL.response.itemField])));
      $('#primary_supplier_filter').append('<option></option>');
      suppliers.forEach(i => $('#primary_supplier_filter').append(new Option(i[endpoints.SUPPLIER_URL.response.itemField], i[endpoints.SUPPLIER_URL.response.itemField])));
      $('#category_filter').append('<option></option>');
      categories.forEach(i => $('#category_filter').append(new Option(i.CategoryName, i.CategoryID)));

      $('#brand_filter, #primary_supplier_filter, #category_filter').trigger('change');
    } catch (e) {
      console.error('Error loading filter data:', e);
      toastr.error('Failed to load filter data');
    }
  })();

  // ==== Stub handlers for other buttons ====
  $('#deleteChecked').on('click',    () => { /* TODO */ });
  $('#submitChecked').on('click',    () => { /* TODO */ });
  $('#applyClientMupBtn').on('click',() => { /* TODO */ });
  $('#applyRetailMupBtn').on('click',() => { /* TODO */ });

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
    f.Active = true;
    f.OutputSelector = [
      "SKU","Model","Categories","Brand","PrimarySupplier",
      "RRP","DefaultPurchasePrice","PriceGroups","Misc02","Misc09"
    ];

    try {
      const res  = await fetch(
        'https://prod-19.australiasoutheast.logic.azure.com:443/workflows/67422be18c5e4af0ad9291110dedb2fd/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=N_VRTyaFEkOUGjtwu8O56_L-qY6xwvHuGWEOvqKsoAk',
        { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({Filter:f}) }
      );
      console.log('❯ Raw response:', res);
      const json = await res.json();
      console.log('❯ Response JSON:', json);

      const items = Array.isArray(json.Item) ? json.Item : [];
      console.log('❯ items length:', items.length);

      toastr[res.ok?'success':'error']( res.ok?'Filters applied successfully':'Error applying filters' );
      if (!res.ok) throw new Error(JSON.stringify(json));

      dataTable.clear();
      items.forEach(item => {
        dataTable.row.add([
          '<input type="checkbox" class="row-checkbox" />',
          item.SKU,
          item.Model,
          item.Brand,
          item.PrimarySupplier,
          parseCategories(item.Categories),
          item.DefaultPurchasePrice,
          `<input type="number" step="0.01" class="form-control client-mup-input" value="${item.Misc02 ?? ''}" />`,
          `<input type="number" step="0.01" class="form-control retail-mup-input" value="${item.Misc09 ?? ''}" />`,
          getClientPrice(item.PriceGroups),
          item.RRP
        ]);
      });
      dataTable.draw();
    } catch (err) {
      console.error('Apply Filters error:', err);
      toastr.error('Error applying filters: ' + err.message);
    }
  });
});
