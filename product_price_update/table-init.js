// table-init.js

let dataTable;

$(function() {
  // Initialize Select2 for dropdown filters
  $('#brand_filter, #primary_supplier_filter, #category_filter').select2({
    theme: 'bootstrap-5',
    placeholder: 'Select a value',
    allowClear: true,
    width: '100%'
  });

  // Initialize DataTable with page-length selector (10, 30, 50, 100, All)
  dataTable = $('#productTable').DataTable({
    paging: true,
    pageLength: 10,
    lengthChange: true,
    lengthMenu: [
      [10, 30, 50, 100, -1],
      [10, 30, 50, 100, 'All']
    ],
    info: true,
    searching: false,
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

  // Load filter dropdown data
  loadFilterData();
});

async function loadFilterData() {
  console.log('[loadFilterData] Starting to fetch filter data from APIs:', {
    brandsUrl: endpoints.BRANDS_URL.endpoint,
    supplierUrl: endpoints.SUPPLIER_URL.endpoint,
    categoriesUrl: endpoints.CATEGORIES_URL.endpoint
  });
  try {
    const [bRes, sRes, cRes] = await Promise.all([
      fetch(endpoints.BRANDS_URL.endpoint, { method: endpoints.BRANDS_URL.method }),
      fetch(endpoints.SUPPLIER_URL.endpoint, { method: endpoints.SUPPLIER_URL.method }),
      fetch(endpoints.CATEGORIES_URL.endpoint, { method: endpoints.CATEGORIES_URL.method })
    ]);
    console.log('[loadFilterData] Received responses. Status codes:', {
      brands: bRes.status,
      suppliers: sRes.status,
      categories: cRes.status
    });

    const [bJson, sJson, cJson] = await Promise.all([bRes.json(), sRes.json(), cRes.json()]);
    console.log('[loadFilterData] Parsed JSON. Raw data:', { bJson, sJson, cJson });

    const brands     = endpoints.BRANDS_URL.response.dataPath.reduce((o, k) => o[k], bJson);
    const suppliers  = endpoints.SUPPLIER_URL.response.dataPath.reduce((o, k) => o[k], sJson);
    const categories = endpoints.CATEGORIES_URL.response.dataPath.reduce((o, k) => o[k], cJson);

    console.log(`[loadFilterData] Extracted data counts → brands: ${brands.length}, suppliers: ${suppliers.length}, categories: ${categories.length}`);
    if (!brands.length)    console.warn('[loadFilterData] No brands fetched');
    if (!suppliers.length) console.warn('[loadFilterData] No suppliers fetched');
    if (!categories.length)console.warn('[loadFilterData] No categories fetched');

    $('#brand_filter').append('<option></option>');
    brands.forEach(i =>
      $('#brand_filter').append(
        new Option(i[endpoints.BRANDS_URL.response.itemField], i[endpoints.BRANDS_URL.response.itemField])
      )
    );

    $('#primary_supplier_filter').append('<option></option>');
    suppliers.forEach(i =>
      $('#primary_supplier_filter').append(
        new Option(i[endpoints.SUPPLIER_URL.response.itemField], i[endpoints.SUPPLIER_URL.response.itemField])
      )
    );

    $('#category_filter').append('<option></option>');
    categories.forEach(i =>
      $('#category_filter').append(new Option(i.CategoryName, i.CategoryID))
    );

    $('#brand_filter, #primary_supplier_filter, #category_filter').trigger('change');
    console.log('[loadFilterData] Filter dropdowns populated successfully');
  } catch (e) {
    console.error('[loadFilterData] Error loading filter data:', e);
    toastr.error('Failed to load filter data');
  }
}
