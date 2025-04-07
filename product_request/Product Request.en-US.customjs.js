$(function() {
    // Arrays to hold fetched data.
    let brands = [];
    let suppliers = [];
  
    // API endpoints.
    const brandsUrl = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/58215302c1c24203886ccf481adbaac5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RFQ4OtbS6cyjB_JzaIsowmww4KBqPQgavWLg18znE5s';
    const suppliersUrl = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/da5c5708146642768d63293d2bbb9668/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-n0W0PxlF1G83xHYHGoEOhv3XmHXWlesbRk5NcgNT9w';
    const skuCheckUrl = 'https://prod-03.australiasoutheast.logic.azure.com:443/workflows/151bc47e0ba4447b893d1c9fea9af46f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bRyr_oW-ud06XlU5VLhBqQ7tyU__jD3clEOGIEhax-Q';
  
    // AJAX requests.
    let brandsRequest = $.ajax({ url: brandsUrl, method: 'POST' });
    let suppliersRequest = $.ajax({ url: suppliersUrl, method: 'POST' });
  
    $.when(brandsRequest, suppliersRequest).done(function(brandResp, supplierResp) {
      let brandData = brandResp[0];
      let supplierData = supplierResp[0];
  
      if (brandData.status === 200 && brandData.message.Ack === "Success") {
        brands = brandData.message.Content.map(item => ({
          id: item.ContentID,
          text: item.ContentName
        }));
        console.log("Fetched Brands:", brands);
      } else {
        console.error("Error loading brands data");
      }
  
      if (supplierData.status === 200 && supplierData.message.Ack === "Success") {
        suppliers = supplierData.message.Supplier.map(item => ({
          id: item.SupplierID,
          text: item.SupplierID
        }));
        console.log("Fetched Suppliers:", suppliers);
      } else {
        console.error("Error loading suppliers data");
      }
  
      // Add the initial row.
      addRow();
    }).fail(function() {
      console.error("Error fetching brands or suppliers data");
      addRow();
    });
  
    let rowCount = 0;
  
    // Helper functions for error messages.
    function showError($field, message) {
      $field.addClass('error');
      if ($field.is('select')) {
        let $select2 = $field.next('.select2-container');
        if ($select2.length > 0) {
          if ($select2.siblings('.error-message').length === 0) {
            $select2.after(`<div class="error-message">${message}</div>`);
          } else {
            $select2.siblings('.error-message').text(message);
          }
        } else {
          $field.after(`<div class="error-message">${message}</div>`);
        }
      } else {
        if ($field.siblings('.error-message').length === 0) {
          $field.after(`<div class="error-message">${message}</div>`);
        } else {
          $field.siblings('.error-message').text(message);
        }
      }
    }
  
    function removeError($field) {
      $field.removeClass('error');
      if ($field.is('select')) {
        let $select2 = $field.next('.select2-container');
        if ($select2.length > 0) {
          $select2.siblings('.error-message').remove();
        } else {
          $field.siblings('.error-message').remove();
        }
      } else {
        $field.siblings('.error-message').remove();
      }
    }
  
    // Helper to initialize a select2 element.
    function initSelect($select, data) {
      $select.empty();
      $select.append('<option></option>');
      data.forEach(item => {
        $select.append(`<option value="${item.id}">${item.text}</option>`);
      });
      $select.select2({
        placeholder: $select.attr('placeholder'),
        allowClear: true
      });
    }
  
    // Function to add a new row.
    function addRow() {
      rowCount++;
      const row = $(`
        <div class="row" id="row-${rowCount}">
          <div>
            <input type="text" id="sku-${rowCount}" name="sku[]" placeholder="SKU" />
          </div>
          <div>
            <input type="text" id="productName-${rowCount}" name="productName[]" placeholder="Product Name" />
          </div>
          <div>
            <select id="brand-${rowCount}" name="brand[]" placeholder="Select a brand"></select>
          </div>
          <div>
            <select id="supplier-${rowCount}" name="supplier[]" placeholder="Select a supplier"></select>
          </div>
          <div>
            <input type="number" step="0.01" id="purchasePrice-${rowCount}" name="purchasePrice[]" min="0" placeholder="Purchase Price" />
          </div>
          <div>
            <input type="number" step="0.01" id="rrp-${rowCount}" name="rrp[]" min="0" placeholder="RRP (if available)" />
          </div>
          <div>
            <button type="button" class="delete-row">Delete</button>
          </div>
        </div>
      `);
      $('#rowsContainer').append(row);
      initSelect(row.find(`#brand-${rowCount}`), brands);
      initSelect(row.find(`#supplier-${rowCount}`), suppliers);
      row.find(`#sku-${rowCount}, #productName-${rowCount}`).on('blur', function() {
        let val = $(this).val();
        $(this).val(val ? val.replace(/\s+/g, '') : '');
      });
      row.find(`#purchasePrice-${rowCount}, #rrp-${rowCount}`).on('input', function() {
        let value = parseFloat($(this).val());
        if (isNaN(value) || value < 0) {
          $(this).val(0);
        }
      });
    }
  
    // Loader modal functions (using flex display).
    function showLoader() {
      $('#loaderModal').css('display', 'flex');
    }
    function hideLoader() {
      $('#loaderModal').css('display', 'none');
    }
  
    $('#addRowBtn').on('click', function(e) {
      e.preventDefault();
      addRow();
    });
  
    $('.apply-all').on('click', function(e) {
      e.preventDefault();
      const target = $(this).data('target');
      const $firstSelect = $('#dynamicForm').find(`select[name="${target}[]"]`).first();
      const firstVal = $firstSelect.val();
      if (firstVal) {
        $('#dynamicForm').find(`select[name="${target}[]"]`).each(function() {
          $(this).val(firstVal).trigger('change');
        });
      } else {
        $(this).closest('div').find('select').addClass('error');
      }
    });
  
    // Paste events (unchanged).
    $(document).on('paste', '#dynamicForm input[name="sku[]"]', function(e) {
      let clipboardData = e.originalEvent.clipboardData.getData('text/plain');
      let lines = clipboardData.split(/\r\n|\n|\r/).filter(Boolean);
      if (lines.length > 1) {
        e.preventDefault();
        $(this).val(lines[0]);
        for (let i = 1; i < lines.length; i++) {
          addRow();
          $(`#sku-${rowCount}`).val(lines[i]);
        }
      }
    });
  
    $(document).on('paste', '#dynamicForm input[name="productName[]"]', function(e) {
      let clipboardData = e.originalEvent.clipboardData.getData('text/plain');
      let lines = clipboardData.split(/\r\n|\n|\r/).filter(Boolean);
      console.log("Pasted product name lines:", lines);
      if (lines.length > 1) {
        e.preventDefault();
        let currentId = $(this).attr('id');
        let currentIndex = parseInt(currentId.split('-')[1], 10);
        $(this).val(lines[0]);
        for (let i = 1; i < lines.length; i++) {
          let targetIndex = currentIndex + i;
          let $target = $(`#productName-${targetIndex}`);
          if ($target.length > 0) {
            $target.val(lines[i]);
          } else {
            addRow();
            $(`#productName-${rowCount}`).val(lines[i]);
          }
        }
      }
    });
  
    $(document).on('paste', '#dynamicForm input[name="purchasePrice[]"]', function(e) {
      let clipboardData = e.originalEvent.clipboardData.getData('text/plain');
      let lines = clipboardData.split(/\r\n|\n|\r/).filter(Boolean);
      if (lines.length > 1 && lines.every(line => !isNaN(parseFloat(line)))) {
        e.preventDefault();
        let currentId = $(this).attr('id');
        let currentIndex = parseInt(currentId.split('-')[1], 10);
        $(this).val(parseFloat(lines[0]));
        for (let i = 1; i < lines.length; i++) {
          let targetIndex = currentIndex + i;
          let $target = $(`#purchasePrice-${targetIndex}`);
          if ($target.length > 0) {
            $target.val(parseFloat(lines[i]));
          } else {
            addRow();
            $(`#purchasePrice-${rowCount}`).val(parseFloat(lines[i]));
          }
        }
      }
    });
  
    $(document).on('paste', '#dynamicForm input[name="rrp[]"]', function(e) {
      let clipboardData = e.originalEvent.clipboardData.getData('text/plain');
      let lines = clipboardData.split(/\r\n|\n|\r/).filter(Boolean);
      if (lines.length > 1 && lines.every(line => !isNaN(parseFloat(line)))) {
        e.preventDefault();
        let currentId = $(this).attr('id');
        let currentIndex = parseInt(currentId.split('-')[1], 10);
        $(this).val(parseFloat(lines[0]));
        for (let i = 1; i < lines.length; i++) {
          let targetIndex = currentIndex + i;
          let $target = $(`#rrp-${targetIndex}`);
          if ($target.length > 0) {
            $target.val(parseFloat(lines[i]));
          } else {
            addRow();
            $(`#rrp-${rowCount}`).val(parseFloat(lines[i]));
          }
        }
      }
    });
  
    $(document).on('click', '.delete-row', function() {
      $(this).closest('.row').remove();
    });
  
    // Form submission with SKU check and field validation.
    $('#dynamicForm').on('submit', function(e) {
      e.preventDefault();
      let valid = true;
      // Validate only rows in #rowsContainer.
      $('#rowsContainer .row').each(function() {
        let $row = $(this);
        let $skuField = $row.find('input[name="sku[]"]');
        let skuVal = $skuField.val();
        let sku = skuVal ? skuVal.trim() : "";
        if (!sku) {
          showError($skuField, "SKU is required");
          valid = false;
        } else {
          removeError($skuField);
        }
        let $prodField = $row.find('input[name="productName[]"]');
        let productNameVal = $prodField.val();
        let productName = productNameVal ? productNameVal.trim() : "";
        if (!productName) {
          showError($prodField, "Product Name is required");
          valid = false;
        } else {
          removeError($prodField);
        }
        let $brandField = $row.find('select[name="brand[]"]');
        let brand = $brandField.val();
        if (!brand) {
          showError($brandField, "Brand is required");
          valid = false;
        } else {
          removeError($brandField);
        }
        let $supplierField = $row.find('select[name="supplier[]"]');
        let supplier = $supplierField.val();
        if (!supplier) {
          showError($supplierField, "Supplier is required");
          valid = false;
        } else {
          removeError($supplierField);
        }
        let $priceField = $row.find('input[name="purchasePrice[]"]');
        let purchasePriceVal = $priceField.val();
        let purchasePrice = purchasePriceVal ? purchasePriceVal.trim() : "";
        if (!purchasePrice) {
          showError($priceField, "Purchase Price is required");
          valid = false;
        } else {
          removeError($priceField);
        }
      });
      if (!valid) {
        console.log("Validation errors found. Please correct the highlighted fields.");
        return;
      }
      
      showLoader();
      
      let skuArray = [];
      $('#rowsContainer .row').each(function() {
        let skuVal = $(this).find('input[name="sku[]"]').val();
        let sku = skuVal ? skuVal.trim() : "";
        if (sku) {
          skuArray.push(sku);
        }
      });
      
      $.ajax({
        url: skuCheckUrl,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ SKU: skuArray }),
        success: function(response) {
          hideLoader();
          if (response.Ack === "Success") {
            let existingSKUs = new Set();
            if (response.Item && response.Item.length > 0) {
              response.Item.forEach(item => {
                existingSKUs.add(item.SKU);
              });
            }
            let duplicateFound = false;
            $('#rowsContainer .row').each(function() {
              let skuVal = $(this).find('input[name="sku[]"]').val();
              let sku = skuVal ? skuVal.trim() : "";
              if (existingSKUs.has(sku)) {
                $(this).addClass('danger');
                duplicateFound = true;
              } else {
                $(this).removeClass('danger');
              }
            });
            if (duplicateFound) {
              console.log("One or more SKUs already exist. Please correct the highlighted rows.");
              return;
            }
            try {
              console.log("Form submitted successfully!");
              // Place your actual form submission code here.
            } catch (err) {
              console.error("An error occurred during submission: " + err.message);
            }
          } else {
            console.error("SKU check failed. Please try again later.");
          }
        },
        error: function(err) {
          hideLoader();
          console.error("Error during SKU check: " + err.statusText);
        }
      });
    });
  });