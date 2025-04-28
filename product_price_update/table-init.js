// table-init.js

let dataTable;

$(function() {
  // Initialize Select2
  $('#brand_filter, #primary_supplier_filter, #category_filter').select2({
    theme: 'bootstrap-5',
    placeholder: 'Select a value',
    allowClear: true,
    width: '100%'
  });

  // Initialize DataTable
  dataTable = $('#productTable').DataTable({
    paging: true,
    pageLength: 10,
    info: true,
    searching: false,
    lengthChange: false,
    columns: [
      { orderable: false }, // checkbox
      null, null, null, null, null, null,
      null, null, null, null
    ]
  });

  // Load dropdown data
  loadFilterData();
});

async function loadFilterData() {
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
  } catch (e) {
    console.error('Error loading filter data:', e);
    toastr.error('Failed to load filter data');
  }
}
