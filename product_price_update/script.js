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
    endpoint: "https://prod-47.australiasoutheast.logic.azure.com:443/workflows/0d67bcf1bb64e78a2495f13a7498081/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fJJzmNyuARuwEcNCoMuWwMS9kmWZQABw9kJXsUj9Wk8",
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

  // ==== Stub handlers for MUP buttons ====  
  $('#applyClientMupBtn').on('click', () => { /* TODO */ });
  $('#applyRetailMupBtn').on('click', () => { /* TODO */ });

  // ==== Apply Filters button handler ====  
  $('#submitFilters').on('click', async function() {
    const f = {};

    // Read and split SKUs from textarea into an array
    const skuRaw = $('#sku_filter').val().trim();
    if (skuRaw) {
      const skuArr = skuRaw
        .split(/\r?\n/)   // split by line
        .map(s => s.trim())
        .filter(Boolean);
      if (skuArr.length) {
        f.SKU = skuArr;   // array payload
      }
    }

    const model    = $('#product_name_filter').val().trim();
    const brand    = $('#brand_filter').val();
    const supplier = $('#primary_supplier_filter').val();
    const category = $('#category_filter').val();
    if (model)    f.Model           = model;
    if (brand)    f.Brand           = brand;
    if (supplier) f.PrimarySupplier = supplier;
    if (category) f.CategoryID      = category;

    f.Active = true;
    f.OutputSelector = [
      "SKU","Model","Categories","Brand","PrimarySupplier",
      "RRP","DefaultPurchasePrice","PriceGroups","Misc02","Misc09","InventoryID"
    ];

    try {
      const res  = await fetch(
        'https://prod-19.australiasoutheast.logic.azure.com:443/workflows/67422be18c5e4af0ad9291110dedb2fd/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=N_VRTyaFEkOUGjtwu8O56_L-qY6xwvHuGWEOvqKsoAk',
        { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ Filter: f }) }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));

      const items = Array.isArray(json.Item) ? json.Item : [];
      toastr.success('Filters applied successfully');

      dataTable.clear();
      items.forEach(item => {
        // SKU link
        const skuCell = item.InventoryID
          ? `<a href="https://www.rapidsupplies.com.au/_cpanel/products/view?id=${item.InventoryID}" target="_blank">${item.SKU}</a>`
          : item.SKU;

        const purchasePrice    = item.DefaultPurchasePrice;
        const clientMupInput   = `<input type="number" step="0.01" class="form-control client-mup-input" value="${item.Misc02 ?? ''}" />`;
        const retailMupInput   = `<input type="number" step="0.01" class="form-control retail-mup-input" value="${item.Misc09 ?? ''}" />`;
        const clientPriceInput = `<input type="number" step="0.01" class="form-control client-price-input" value="${getClientPrice(item.PriceGroups)}" />`;
        const rrpInput         = `<input type="number" step="0.01" class="form-control rrp-input" value="${item.RRP}" />`;

        dataTable.row.add([
          '<input type="checkbox" class="row-checkbox" />',
          skuCell,
          item.Model,
          item.Brand,
          item.PrimarySupplier,
          parseCategories(item.Categories),
          purchasePrice,
          clientMupInput,
          retailMupInput,
          clientPriceInput,
          rrpInput
        ]);
      });
      dataTable.draw();
    } catch (err) {
      console.error('Apply Filters error:', err);
      toastr.error('Error applying filters: ' + err.message);
    }
  });

  // ==== Recalculation handlers ====  
  $(document).on('change', '.client-mup-input', function() {
    const $row = $(this).closest('tr');
    const purchasePrice = parseFloat($row.find('td').eq(6).text()) || 0;
    const clientMup     = parseFloat($(this).val()) || 0;
    const newClientPrice = (purchasePrice * 1.1) * clientMup;
    $row.find('.client-price-input').val(newClientPrice.toFixed(2));
  });

  $(document).on('change', '.retail-mup-input', function() {
    const $row = $(this).closest('tr');
    const purchasePrice = parseFloat($row.find('td').eq(6).text()) || 0;
    const retailMup     = parseFloat($(this).val()) || 0;
    const newRrp        = (purchasePrice * 1.1) * retailMup;
    $row.find('.rrp-input').val(newRrp.toFixed(2));
  });

  $(document).on('change', '.client-price-input', function() {
    const $row = $(this).closest('tr');
    const purchasePrice  = parseFloat($row.find('td').eq(6).text()) || 0;
    const clientPrice    = parseFloat($(this).val()) || 0;
    const newClientMup   = purchasePrice ? clientPrice / (purchasePrice * 1.1) : 0;
    $row.find('.client-mup-input').val(newClientMup.toFixed(2));
  });

  $(document).on('change', '.rrp-input', function() {
    const $row = $(this).closest('tr');
    const purchasePrice  = parseFloat($row.find('td').eq(6).text()) || 0;
    const rrp            = parseFloat($(this).val()) || 0;
    const newRetailMup   = purchasePrice ? rrp / (purchasePrice * 1.1) : 0;
    $row.find('.retail-mup-input').val(newRetailMup.toFixed(2));
  });

  // ==== Submit Checked Rows handler ====  
  $('#submitChecked').on('click', async function() {
    const $checked = $('#productTable tbody .row-checkbox:checked');
    if ($checked.length === 0) {
      toastr.warning('Please select one row to submit');
      return;
    }
    if ($checked.length > 1) {
      toastr.warning('Only one SKU can be processed at a time');
    }
    const $row = $checked.first().closest('tr');

    // Extract values
    const sku         = $row.find('td').eq(1).text().trim();
    const clientMup   = parseFloat($row.find('.client-mup-input').val()) || 0;
    const retailMup   = parseFloat($row.find('.retail-mup-input').val()) || 0;
    const clientPrice = parseFloat($row.find('.client-price-input').val()) || 0;
    const rrp         = parseFloat($row.find('.rrp-input').val()) || 0;

    // Build payload
    const payload = {
      Item: [
        {
          SKU: sku,
          RRP: rrp,
          Misc02: clientMup,
          Misc09: retailMup,
          PriceGroups: {
            PriceGroup: [
              {
                Group: "Default Client Group",
                Price: clientPrice
              },
              {
                Group: "Default RRP (Dont Assign to clients)",
                Price: rrp
              }
            ]
          }
        }
      ]
    };

    try {
      const res = await fetch(
        'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/a14abba8479c457bafd63fe32fd9fea4/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Evz4dRmWiP8p-hxjZxofNX1q_o_-ufQK2c_XI4Quxto',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));

      toastr.success('Row submitted successfully');
      // highlight the submitted row in light green
      $row.addClass('table-success');
    } catch (err) {
      console.error('Submit Checked error:', err);
      toastr.error('Error submitting row: ' + err.message);
    }
  });

});
