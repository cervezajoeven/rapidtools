$(function() {
  /*==========================================
    Global Variables, API Endpoints and Firebase Setup
  ==========================================*/
  // Arrays to hold fetched data.
  let brands = [];
  let suppliers = [];

  // API endpoint URLs.
  const brandsUrl = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/58215302c1c24203886ccf481adbaac5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RFQ4OtbS6cyjB_JzaIsowmww4KBqPQgavWLg18znE5s';
  const suppliersUrl = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/da5c5708146642768d63293d2bbb9668/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-n0W0PxlF1G83xHYHGoEOhv3XmHXWlesbRk5NcgNT9w';
  const skuCheckUrl = 'https://prod-03.australiasoutheast.logic.azure.com:443/workflows/151bc47e0ba4447b893d1c9fea9af46f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bRyr_oW-ud06XlU5VLhBqQ7tyU__jD3clEOGIEhax-Q';

  // Firebase configuration object.
  const firebaseConfig = {
    apiKey: "AIzaSyAfcffroNPQiXxSZmk7ahUJ_5ez9eO3CCQ",
    authDomain: "rapidclean-ba9be.firebaseapp.com",
    projectId: "rapidclean-ba9be",
    storageBucket: "rapidclean-ba9be.firebasestorage.app",
    messagingSenderId: "39304689168",
    appId: "1:39304689168:web:19e9d73377df109270bc95",
    measurementId: "G-PLE91ET2H3"
  };

  // Initialize Firebase and Firestore.
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // Default email address for summary email.
  let summaryEmail = "your.email@example.com";

  /*==========================================
    Utility Functions
  ==========================================*/
  // Format a number with commas and two decimals.
  function formatNumber(num) {
    if (typeof num === 'number' && !isNaN(num)) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return num;
  }

  // Loader functions.
  function showLoader() {
    $('#loaderModal').css('display', 'flex');
  }

  function hideLoader() {
    $('#loaderModal').css('display', 'none');
  }

  /*==========================================
    Data Fetching and Initialization with Loader
  ==========================================*/
  showLoader(); // Start loader before data fetch.
  let brandsRequest = $.ajax({ url: brandsUrl, method: 'POST' });
  let suppliersRequest = $.ajax({ url: suppliersUrl, method: 'POST' });

  $.when(brandsRequest, suppliersRequest).done(function(brandResp, supplierResp) {
    let brandData = brandResp[0];
    let supplierData = supplierResp[0];

    // Process Brands API response.
    if (brandData.status === 200 && brandData.message.Ack === "Success") {
      brands = brandData.message.Content.map(item => ({
        id: item.ContentID,
        text: item.ContentName
      }));
      console.log("Fetched Brands:", brands);
    } else {
      console.error("Error loading brands data");
    }

    // Process Suppliers API response.
    if (supplierData.status === 200 && supplierData.message.Ack === "Success") {
      suppliers = supplierData.message.Supplier.map(item => ({
        id: item.SupplierID,
        text: item.SupplierID
      }));
      console.log("Fetched Suppliers:", suppliers);
    } else {
      console.error("Error loading suppliers data");
    }

    hideLoader(); // Hide loader after data is fetched.
    // Add the initial dynamic row.
    addRow();
  }).fail(function() {
    console.error("Error fetching brands or suppliers data");
    hideLoader();
    addRow();
  });

  // Global row count tracker for dynamic row elements.
  let rowCount = 0;

  /*==========================================
    Error Handling Helper Functions
  ==========================================*/
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

  /*==========================================
    UI Helper Functions
  ==========================================*/
  function initSelect($select, data) {
    $select.empty();
    $select.append('<option></option>');
    data.forEach(item => {
      // Option's value remains the id; text is used in the summary.
      $select.append(`<option value="${item.id}">${item.text}</option>`);
    });
    $select.select2({
      placeholder: $select.attr('placeholder'),
      allowClear: true
    });
  }

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

    // Remove spaces in SKU and Product Name on blur.
    row.find(`#sku-${rowCount}, #productName-${rowCount}`).on('blur', function() {
      let val = $(this).val();
      $(this).val(val ? val.replace(/\s+/g, '') : '');
    });

    // Validate numeric inputs.
    row.find(`#purchasePrice-${rowCount}, #rrp-${rowCount}`).on('input', function() {
      let value = parseFloat($(this).val());
      if (isNaN(value) || value < 0) {
        $(this).val(0);
      }
    });
  }

  /*==========================================
    Event Listeners for UI Interactions
  ==========================================*/
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

  /*==========================================
    Paste Event Handling with Helper Function
  ==========================================*/
  function handlePaste(e, fieldPrefix, convertFn, validateFn, useCurrentIndex) {
    let clipboardData = e.originalEvent.clipboardData.getData('text/plain');
    let lines = clipboardData.split(/\r\n|\n|\r/).filter(item => item.trim() !== '');
    if (lines.length > 1 && validateFn(lines)) {
      e.preventDefault();
      let $current = $(e.currentTarget);
      if (useCurrentIndex) {
        let currentId = $current.attr('id');
        let currentIndex = parseInt(currentId.split('-')[1], 10);
        $current.val(convertFn(lines[0]));
        for (let i = 1; i < lines.length; i++) {
          let targetIndex = currentIndex + i;
          let $target = $(`#${fieldPrefix}-${targetIndex}`);
          if ($target.length > 0) {
            $target.val(convertFn(lines[i]));
          } else {
            addRow();
            $(`#${fieldPrefix}-${rowCount}`).val(convertFn(lines[i]));
          }
        }
      } else {
        $current.val(convertFn(lines[0]));
        for (let i = 1; i < lines.length; i++) {
          addRow();
          $(`#${fieldPrefix}-${rowCount}`).val(convertFn(lines[i]));
        }
      }
    }
  }

  $(document).on('paste', '#dynamicForm input[name="sku[]"]', function(e) {
    handlePaste(e, 'sku', v => v, () => true, false);
  });

  $(document).on('paste', '#dynamicForm input[name="productName[]"]', function(e) {
    let clipboardData = e.originalEvent.clipboardData.getData('text/plain');
    let lines = clipboardData.split(/\r\n|\n|\r/).filter(item => item.trim() !== '');
    console.log("Pasted product name lines:", lines);
    handlePaste(e, 'productName', v => v, () => true, true);
  });

  $(document).on('paste', '#dynamicForm input[name="purchasePrice[]"]', function(e) {
    handlePaste(e, 'purchasePrice', parseFloat, lines => lines.every(line => !isNaN(parseFloat(line))), true);
  });

  $(document).on('paste', '#dynamicForm input[name="rrp[]"]', function(e) {
    handlePaste(e, 'rrp', parseFloat, lines => lines.every(line => !isNaN(parseFloat(line))), true);
  });

  $(document).on('click', '.delete-row', function() {
    $(this).closest('.row').remove();
  });

  /*==========================================
    Form Submission, SKU Verification, Firestore Integration,
    Summary Generation, Email Trigger and Table Clear with Loader
  ==========================================*/
  $('#dynamicForm').on('submit', function(e) {
    e.preventDefault();
    let valid = true;

    // Validate each dynamic row.
    $('#rowsContainer .row').each(function() {
      let $row = $(this);

      // Validate SKU.
      let $skuField = $row.find('input[name="sku[]"]');
      let skuVal = $skuField.val();
      let sku = skuVal ? skuVal.trim() : "";
      if (!sku) {
        showError($skuField, "SKU is required");
        valid = false;
      } else {
        removeError($skuField);
      }

      // Validate Product Name.
      let $prodField = $row.find('input[name="productName[]"]');
      let productNameVal = $prodField.val();
      let productName = productNameVal ? productNameVal.trim() : "";
      if (!productName) {
        showError($prodField, "Product Name is required");
        valid = false;
      } else {
        removeError($prodField);
      }

      // Validate Brand.
      let $brandField = $row.find('select[name="brand[]"]');
      let brand = $brandField.val();
      if (!brand) {
        showError($brandField, "Brand is required");
        valid = false;
      } else {
        removeError($brandField);
      }

      // Validate Supplier.
      let $supplierField = $row.find('select[name="supplier[]"]');
      let supplier = $supplierField.val();
      if (!supplier) {
        showError($supplierField, "Supplier is required");
        valid = false;
      } else {
        removeError($supplierField);
      }

      // Validate Purchase Price.
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
    
    showLoader(); // Show loader for SKU check.
    
    // Prepare SKU array for duplicate checking.
    let skuArray = [];
    $('#rowsContainer .row').each(function() {
      let skuVal = $(this).find('input[name="sku[]"]').val();
      let sku = skuVal ? skuVal.trim() : "";
      if (sku) {
        skuArray.push(sku);
      }
    });
    
    // Verify SKUs via AJAX call.
    $.ajax({
      url: skuCheckUrl,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ SKU: skuArray }),
      success: function(response) {
        // Hide loader once SKU check is finished.
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

          //==============================================
          // Firestore Integration:
          // Save each dynamic row as a document in the "product_requests" collection.
          // Each document includes:
          // { sku, product_name, brand (as a string), primary_supplier, purchase_price, rrp, status:"request" }
          //==============================================
          let savePromises = [];
          let submittedProducts = []; // Array to store submitted product data for summary.

          $('#rowsContainer .row').each(function() {
            let $row = $(this);

            // Gather field values, add "status":"request"
            let productData = {
              sku: $row.find('input[name="sku[]"]').val().trim(),
              product_name: $row.find('input[name="productName[]"]').val().trim(),
              brand: $row.find('select[name="brand[]"] option:selected').text(),
              primary_supplier: $row.find('select[name="supplier[]"]').val(),
              purchase_price: parseFloat($row.find('input[name="purchasePrice[]"]').val()),
              rrp: parseFloat($row.find('input[name="rrp[]"]').val()),
              status: "request"
            };

            submittedProducts.push(productData);

            // Add Firestore write promise.
            savePromises.push(
              db.collection("product_requests").add(productData)
            );
          });

          // Show loader while saving Firestore documents.
          showLoader();
          Promise.all(savePromises)
            .then((results) => {
              console.log("All documents saved successfully!", results);

              //==============================================
              // Generate HTML Summary of the Submitted Products.
              //==============================================
              let summaryHtml = `
                <h2>Product Requests Summary</h2>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Brand</th>
                      <th>Primary Supplier</th>
                      <th>Purchase Price</th>
                      <th>RRP</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
              `;
              submittedProducts.forEach(product => {
                summaryHtml += `
                  <tr>
                    <td>${product.sku}</td>
                    <td>${product.product_name}</td>
                    <td>${product.brand}</td>
                    <td>${product.primary_supplier}</td>
                    <td>${formatNumber(product.purchase_price)}</td>
                    <td>${formatNumber(product.rrp)}</td>
                    <td>${product.status}</td>
                  </tr>
                `;
              });
              summaryHtml += `</tbody></table>`;

              // Display the summary in an element with id="submissionSummary".
              $("#submissionSummary").html(summaryHtml);

              //==============================================
              // Trigger Summary Email via API call.
              // Updated payload structure:
              // {
              //    "email_body": "<summaryHtml>",
              //    "email_subject": "Product Creation Request",
              //    "email_send_to": "marketing@rapidcleanillawarra.com.au"
              // }
              //==============================================
              showLoader(); // Show loader for email trigger.
              $.ajax({
                url: "https://prod-24.australiasoutheast.logic.azure.com:443/workflows/16979e5f23434b988b37be58343e93e9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=loAkudpZIyE7_2o54CIncgVBLoXBtND6G_4Qm2MJzOE",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                  email_body: summaryHtml,
                  email_subject: "Product Creation Request",
                  email_send_to: "marketing@rapidcleanillawarra.com.au"
                }),
                success: function(resp) {
                  console.log("Summary email triggered", resp);
                  hideLoader(); // Hide loader after email trigger completes.
                },
                error: function(err) {
                  console.error("Error triggering summary email", err);
                  hideLoader();
                }
              });

              //==============================================
              // Clear the table after successful submission.
              //==============================================
              $("#rowsContainer").empty();
              rowCount = 0;
              addRow(); // Optionally, add a new empty row.

              // Hide loader if still visible.
              hideLoader();
            })
            .catch((error) => {
              console.error("Error saving documents to Firestore:", error);
              hideLoader();
            });
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
