// events.js

// Helper to handle multi-row, single-column paste from Excel
function handleMultiPaste(e, className) {
  e.preventDefault();
  const text = e.originalEvent.clipboardData.getData('text/plain');
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  const $allRows = $(dataTable.rows().nodes());
  const startRowIdx = $allRows.index($(e.target).closest('tr'));

  lines.forEach((line, offset) => {
    const val = line.split('\t')[0]; // only first tab-separated column
    const $row = $allRows.eq(startRowIdx + offset);
    if (!$row.length) return;
    const $input = $row.find(`.${className}`);
    $input.val(val).trigger('input');
  });
}

// Recalculation on any typing, dragging, or paste
$(document).on('input', '.purchase-price-input, .client-mup-input, .retail-mup-input, .client-price-input, .rrp-input', function() {
  const $row = $(this).closest('tr');
  const price = parseFloat($row.find('.purchase-price-input').val()) || 0;

  if ($(this).hasClass('client-mup-input')) {
    const mup = parseFloat(this.value) || 0;
    $row.find('.client-price-input').val(((price * 1.1) * mup).toFixed(2));
  } 
  else if ($(this).hasClass('retail-mup-input')) {
    const mup = parseFloat(this.value) || 0;
    $row.find('.rrp-input').val(((price * 1.1) * mup).toFixed(2));
  } 
  else if ($(this).hasClass('client-price-input')) {
    const cp = parseFloat(this.value) || 0;
    $row.find('.client-mup-input').val((price ? cp / (price * 1.1) : 0).toFixed(2));
  } 
  else if ($(this).hasClass('rrp-input')) {
    const rv = parseFloat(this.value) || 0;
    $row.find('.retail-mup-input').val((price ? rv / (price * 1.1) : 0).toFixed(2));
  } 
  else if ($(this).hasClass('purchase-price-input')) {
    // on purchase-price change, re-run all four recalculations
    $row.find('.client-mup-input').trigger('input');
    $row.find('.retail-mup-input').trigger('input');
    $row.find('.client-price-input').trigger('input');
    $row.find('.rrp-input').trigger('input');
  }
});

// Intercept paste to enable multi-row paste for each column
const pasteCols = [
  'purchase-price-input',
  'client-mup-input',
  'retail-mup-input',
  'client-price-input',
  'rrp-input'
];

pasteCols.forEach(className => {
  $(document).on('paste', `.${className}`, function(e) {
    // temporarily show all pages so we can paste across them
    const oldLength = dataTable.page.len();
    const oldPage   = dataTable.page();

    dataTable.page.len(-1).draw(false);
    handleMultiPaste(e, className);

    dataTable.page.len(oldLength).draw(false);
    dataTable.page(oldPage).draw(false);
  });
});

// Select-all header checkbox: apply to all pages
$('#selectAll').on('change', function() {
  const checked = this.checked;
  // use DataTables API to get all row nodes
  $(dataTable.rows().nodes()).find('.row-checkbox').prop('checked', checked);
});

// Keep header checkbox in sync with row checkboxes across all pages
$(document).on('change', '.row-checkbox', function() {
  const $allCheckboxes = $(dataTable.rows().nodes()).find('.row-checkbox');
  const total    = $allCheckboxes.length;
  const selected = $allCheckboxes.filter(':checked').length;
  $('#selectAll').prop('checked', total > 0 && total === selected);
});

// Submit Checked Rows handler (supports multiple SKUs)
$('#submitChecked').on('click', async function() {
  console.log('[UI] Submit Checked Rows button clicked');

  const $checked = $(dataTable.rows().nodes()).find('.row-checkbox:checked');
  if ($checked.length === 0) {
    toastr.warning('Please select at least one row to submit');
    return;
  }

  const items = [];
  $checked.each(function() {
    const $row       = $(this).closest('tr');
    const sku        = $row.find('td').eq(1).text().trim();
    const price      = parseFloat($row.find('.purchase-price-input').val()) || 0;
    const clientMup  = parseFloat($row.find('.client-mup-input').val()) || 0;
    const retailMup  = parseFloat($row.find('.retail-mup-input').val()) || 0;
    const clientPrice= parseFloat($row.find('.client-price-input').val()) || 0;
    const rrpVal     = parseFloat($row.find('.rrp-input').val()) || 0;

    items.push({
      SKU: sku,
      DefaultPurchasePrice: price,
      RRP: rrpVal,
      Misc02: clientMup,
      Misc09: retailMup,
      PriceGroups: {
        PriceGroup: [
          { Group: "Default Client Group", Price: clientPrice },
          { Group: "Default RRP (Dont Assign to clients)", Price: rrpVal }
        ]
      }
    });
  });

  const payload = { Item: items };
  console.log('[submitChecked] Submitting payload:', payload);

  try {
    const res  = await fetch(
      'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/a14abba8479c457bafd63fe32fd9fea4/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Evz4dRmWiP8p-hxjZxofNX1q_o_-ufQK2c_XI4Quxto',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    console.log('[submitChecked] Received response. Status:', res.status);

    const json = await res.json();
    console.log('[submitChecked] Parsed JSON response:', json);

    if (!res.ok) {
      console.warn('[submitChecked] Response not OK, throwing error:', json);
      throw new Error(JSON.stringify(json));
    }

    toastr.success('Rows submitted successfully');
    const acks = (json.Item || []).map(i => i.SKU);
    if (acks.length) {
      console.log('[submitChecked] Acknowledged SKUs:', acks);
    } else {
      console.warn('[submitChecked] No acknowledgements returned');
    }

    $checked.each(function() {
      const $r  = $(this).closest('tr');
      const sku = $r.find('td').eq(1).text().trim();
      if (acks.includes(sku)) {
        $r.addClass('table-success');
      }
    });
  } catch (err) {
    console.error('[submitChecked] Submit Checked error:', err);
    toastr.error('Error submitting rows: ' + err.message);
  }
});
