// filter-handler.js

// When the “Apply Filters” button is clicked, log it and then run applyFilters
$('#submitFilters').on('click', function() {
  console.log('[UI] Apply Filters button clicked');
  alert();
  applyFilters();
});

async function applyFilters() {
  const f = {
    Active: true,
    OutputSelector: [
      "SKU", "Model", "Categories", "Brand", "PrimarySupplier",
      "RRP", "DefaultPurchasePrice", "PriceGroups", "Misc02", "Misc09", "InventoryID"
    ]
  };

  // parse multiline SKU textbox
  const skuRaw = $('#sku_filter').val().trim();
  if (skuRaw) {
    const arr = skuRaw
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
    if (arr.length) f.SKU = arr;
  }

  // other filters
  const model    = $('#product_name_filter').val().trim();
  const brand    = $('#brand_filter').val();
  const supplier = $('#primary_supplier_filter').val();
  const category = $('#category_filter').val();
  if (model)    f.Model           = model;
  if (brand)    f.Brand           = brand;
  if (supplier) f.PrimarySupplier = supplier;
  if (category) f.CategoryID      = category;

  console.log('[applyFilters] Sending filter request with payload:', f);

  try {
    const res = await fetch(
      'https://prod-19.australiasoutheast.logic.azure.com:443/workflows/67422be18c5e4af0ad9291110dedb2fd/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=N_VRTyaFEkOUGjtwu8O56_L-qY6xwvHuGWEOvqKsoAk',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Filter: f })
      }
    );
    console.log('[applyFilters] Received response. Status:', res.status);

    const json = await res.json();
    console.log('[applyFilters] Parsed JSON response:', json);

    if (!res.ok) {
      console.warn('[applyFilters] Response not OK, throwing error:', json);
      throw new Error(JSON.stringify(json));
    }

    const items = Array.isArray(json.Item) ? json.Item : [];
    if (items.length) {
      console.log(`[applyFilters] Fetched ${items.length} items`);
    } else {
      console.warn('[applyFilters] No items fetched from API');
    }

    toastr.success('Filters applied successfully');
    dataTable.clear();

    items.forEach(item => {
      dataTable.row.add([
        '<input type="checkbox" class="row-checkbox" />',
        buildSkuCell(item.SKU, item.InventoryID),
        item.Model,
        item.Brand,
        item.PrimarySupplier,
        parseCategories(item.Categories),
        buildNumberInput('purchase-price-input', item.DefaultPurchasePrice),
        buildNumberInput('client-mup-input',    item.Misc02),
        buildNumberInput('retail-mup-input',    item.Misc09),
        buildNumberInput('client-price-input',  getClientPrice(item.PriceGroups)),
        buildNumberInput('rrp-input',           item.RRP)
      ]);
    });

    dataTable.draw();
    console.log('[applyFilters] Table updated with new items');
  } catch (err) {
    console.error('[applyFilters] Error applying filters:', err);
    toastr.error('Error applying filters: ' + err.message);
  }
}
