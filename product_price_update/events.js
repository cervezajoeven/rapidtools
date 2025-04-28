// events.js

// Recalculation handlers
$(document).on('change', '.client-mup-input', function() {
    const $row = $(this).closest('tr');
    const price = parseFloat($row.find('td').eq(6).text()) || 0;
    const mup   = parseFloat(this.value) || 0;
    $row.find('.client-price-input').val(((price * 1.1) * mup).toFixed(2));
  });
  
  $(document).on('change', '.retail-mup-input', function() {
    const $row = $(this).closest('tr');
    const price = parseFloat($row.find('td').eq(6).text()) || 0;
    const mup   = parseFloat(this.value) || 0;
    $row.find('.rrp-input').val(((price * 1.1) * mup).toFixed(2));
  });
  
  $(document).on('change', '.client-price-input', function() {
    const $row = $(this).closest('tr');
    const price     = parseFloat($row.find('td').eq(6).text()) || 0;
    const clientPrice = parseFloat(this.value) || 0;
    $row.find('.client-mup-input').val((price ? clientPrice / (price * 1.1) : 0).toFixed(2));
  });
  
  $(document).on('change', '.rrp-input', function() {
    const $row = $(this).closest('tr');
    const price = parseFloat($row.find('td').eq(6).text()) || 0;
    const val   = parseFloat(this.value) || 0;
    $row.find('.retail-mup-input').val((price ? val / (price * 1.1) : 0).toFixed(2));
  });
  
  // Submit Checked Rows
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
  
    const sku         = $row.find('td').eq(1).text().trim();
    const clientMup   = parseFloat($row.find('.client-mup-input').val()) || 0;
    const retailMup   = parseFloat($row.find('.retail-mup-input').val()) || 0;
    const clientPrice = parseFloat($row.find('.client-price-input').val()) || 0;
    const rrp         = parseFloat($row.find('.rrp-input').val()) || 0;
  
    const payload = {
      Item: [{
        SKU: sku,
        RRP: rrp,
        Misc02: clientMup,
        Misc09: retailMup,
        PriceGroups: {
          PriceGroup: [
            { Group: "Default Client Group", Price: clientPrice },
            { Group: "Default RRP (Dont Assign to clients)", Price: rrp }
          ]
        }
      }]
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
      $row.addClass('table-success');
    } catch (err) {
      console.error('Submit Checked error:', err);
      toastr.error('Error submitting row: ' + err.message);
    }
  });
  