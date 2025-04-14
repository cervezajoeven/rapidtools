$(document).ready(function() {
  /*==========================================
    Global Variables, API Endpoints and Firebase Setup
  ==========================================*/
  let brands = [];
  let suppliers = [];
  let rowCount = 0;
  let currentUser = null; // Current user info

  const brandsUrl = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/58215302c1c24203886ccf481adbaac5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RFQ4OtbS6cyjB_JzaIsowmww4KBqPQgavWLg18znE5s';
  const suppliersUrl = 'https://prod-06.australiasoutheast.logic.azure.com:443/workflows/da5c5708146642768d63293d2bbb9668/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-n0W0PxlF1G83xHYHGoEOhv3XmHXWlesbRk5NcgNT9w';
  const skuCheckUrl = 'https://prod-03.australiasoutheast.logic.azure.com:443/workflows/151bc47e0ba4447b893d1c9fea9af46f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bRyr_oW-ud06XlU5VLhBqQ7tyU__jD3clEOGIEhax-Q';

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

  /*==========================================
    Initial UI Setup: Hide sections until needed
  ==========================================*/
  $("#savedUserInfo, #productRequestContainer, #dynamicForm").hide();

  // Check for saved user info in localStorage.
  const storedUser = localStorage.getItem("currentUser");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    displaySavedUser(currentUser);
  } else {
    $("#userInfoSection").show();
  }

  /*==========================================
    Helper Functions
  ==========================================*/
  // Display user info on successful submission/retrieval.
  function displaySavedUser(userInfo) {
    $("#userDisplay").text(`Hello, ${userInfo.firstName} ${userInfo.lastName} (${userInfo.email})`);
    $("#userInfoSection").hide();
    $("#savedUserInfo").show();
    $("#productRequestContainer").show();
    $("#dynamicForm").show();
  }

  // Format numbers with commas and two decimals.
  function formatNumber(num) {
    if (typeof num === 'number' && !isNaN(num)) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return num;
  }

  // Duplicate SKU checker function. Iterates over all rows in the form.
  function checkDuplicateSKUs() {
    let skuSet = new Set();
    let duplicateFound = false;
    $('#rowsContainer .row').each(function() {
      let sku = $(this).find('input[name="sku[]"]').val().trim();
      if (sku) {
        if (skuSet.has(sku)) {
          duplicateFound = true;
          $(this).addClass('danger'); // Highlight duplicate row
        } else {
          skuSet.add(sku);
          $(this).removeClass('danger');
        }
      }
    });
    return duplicateFound;
  }

  // Bind click event to the Add Row button
  $("#addRowBtn").on("click", function() {
    addRow();
  });

  $(".apply-all").on("click", function() {
    // Get the target attribute (for example, "brand" or "supplier")
    let target = $(this).data("target");
    // Retrieve the master value from the first row of that field
    let masterValue = $(`#${target}-1`).val();
    
    // If the first row's field has a value, apply it to all rows
    if (masterValue) {
      $(`[id^='${target}-']`).each(function() {
        $(this).val(masterValue).trigger("change");
      });
    } else {
      alert(`Please fill in the first row's ${target} field before applying to all.`);
    }
  });
  
  // Loader functions.
  function showLoader() {
    $('#loaderModal').css('display', 'flex');
  }
  function hideLoader() {
    $('#loaderModal').css('display', 'none');
  }

  // Initialize select inputs using select2.
  function initSelect($select, data) {
    $select.empty().append('<option></option>');
    data.forEach(item => {
      $select.append(`<option value="${item.id}">${item.text}</option>`);
    });
    $select.select2({
      placeholder: $select.attr('placeholder'),
      allowClear: true
    });
  }

  // Error handling: show and remove error messages.
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

  // Add a new dynamic product row.
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

    // Remove spaces in SKU when blurred.
    row.find(`#sku-${rowCount}`).on('blur', function() {
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

  // Paste event helper function.
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

  // Show the notification modal with a given message.
  function showNotification(message) {
    $("#notificationModalMessage").text(message);
    $("#notificationModal").fadeIn();
  }

  // Hide the notification modal.
  function hideNotification() {
    $("#notificationModal").fadeOut();
  }

  // Bind click event on the modal close button.
  $(document).on('click', '#notificationModalClose', function() {
    hideNotification();
  });

  /*==========================================
    User Info Management
  ==========================================*/
  $("#userInfoForm").on("submit", function(e) {
    e.preventDefault();
    showLoader(); // Show loader when form submission starts
  
    const firstName = $("#firstName").val().trim();
    const lastName = $("#lastName").val().trim();
    const email = $("#email").val().trim();
  
    if (!firstName || !lastName || !email) {
      alert("Please fill in all required fields.");
      hideLoader(); // Hide loader if fields are missing
      return;
    }
  
    const browserInfo = navigator.userAgent;
    const userObj = {
      firstName,
      lastName,
      email,
      browserInfo,
      date_created: firebase.firestore.FieldValue.serverTimestamp()
    };
  
    const docRef = db.collection("product_request_users").doc(email);
    docRef.get().then((doc) => {
      if (doc.exists) {
        currentUser = doc.data();
        // Save user info in localStorage.
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        displaySavedUser(currentUser);
        hideLoader(); // Hide loader after successful retrieval
      } else {
        docRef.set(userObj)
          .then(() => {
            currentUser = userObj;
            localStorage.setItem("currentUser", JSON.stringify(userObj));
            displaySavedUser(currentUser);
            hideLoader(); // Hide loader after successful save
          })
          .catch((error) => {
            console.error("Error saving user info to Firestore:", error);
            hideLoader(); // Hide loader in case of error saving
          });
      }
    }).catch((error) => {
      console.error("Error getting user info from Firestore:", error);
      hideLoader(); // Hide loader in case of error retrieving user info
    });
  });
  
  // Edit User Info handler.
  $("#editUserInfoBtn").on("click", function() {
    localStorage.removeItem("currentUser");
    $("#userInfoSection").show();
    $("#savedUserInfo, #productRequestContainer, #dynamicForm").hide();
  });

  /*==========================================
    Paste Event Bindings
  ==========================================*/
  $(document).on('paste', '#dynamicForm input[name="sku[]"]', function(e) {
    handlePaste(e, 'sku', v => v, () => true, false);
  });
  $(document).on('paste', '#dynamicForm input[name="productName[]"]', function(e) {
    handlePaste(e, 'productName', v => v, () => true, true);
  });
  $(document).on('paste', '#dynamicForm input[name="purchasePrice[]"]', function(e) {
    handlePaste(e, 'purchasePrice', parseFloat, lines => lines.every(line => !isNaN(parseFloat(line))), true);
  });
  $(document).on('paste', '#dynamicForm input[name="rrp[]"]', function(e) {
    handlePaste(e, 'rrp', parseFloat, lines => lines.every(line => !isNaN(parseFloat(line))), true);
  });

  /*==========================================
    Delete Row Event
  ==========================================*/
  $(document).on('click', '.delete-row', function() {
    $(this).closest('.row').remove();
  });

  /*==========================================
    Fetching Brands and Suppliers Data
  ==========================================*/
  showLoader();
  let brandsRequest = $.ajax({ url: brandsUrl, method: 'POST' });
  let suppliersRequest = $.ajax({ url: suppliersUrl, method: 'POST' });

  $.when(brandsRequest, suppliersRequest).done(function(brandResp, supplierResp) {
    const brandData = brandResp[0];
    const supplierData = supplierResp[0];

    if (brandData.status === 200 && brandData.message.Ack === "Success") {
      brands = brandData.message.Content.map(item => ({
        id: item.ContentID,
        text: item.ContentName
      }));
    } else {
      console.error("Error loading brands data");
    }

    if (supplierData.status === 200 && supplierData.message.Ack === "Success") {
      suppliers = supplierData.message.Supplier.map(item => ({
        id: item.SupplierID,
        text: item.SupplierID
      }));
    } else {
      console.error("Error loading suppliers data");
    }
    hideLoader();
    addRow();
  }).fail(function() {
    console.error("Error fetching brands or suppliers data");
    hideLoader();
    addRow();
  });

  /*==========================================
    Dynamic Form Submission, SKU Verification and Firestore Integration
  ==========================================*/
  $("#dynamicForm").on("submit", function(e) {
    e.preventDefault();
    let valid = true;
  
    $('#rowsContainer .row').each(function() {
      let $row = $(this);
      let sku = $row.find('input[name="sku[]"]').val().trim();
      let productName = $row.find('input[name="productName[]"]').val().trim();
      let $brandField = $row.find('select[name="brand[]"]');
      let $supplierField = $row.find('select[name="supplier[]"]');
      let $priceField = $row.find('input[name="purchasePrice[]"]');
  
      if (!sku) {
        showError($row.find('input[name="sku[]"]'), "SKU is required");
        valid = false;
      } else {
        removeError($row.find('input[name="sku[]"]'));
      }
  
      if (!productName) {
        showError($row.find('input[name="productName[]"]'), "Product Name is required");
        valid = false;
      } else {
        removeError($row.find('input[name="productName[]"]'));
      }
  
      if (!$brandField.val()) {
        showError($brandField, "Brand is required");
        valid = false;
      } else {
        removeError($brandField);
      }
  
      if (!$supplierField.val()) {
        showError($supplierField, "Supplier is required");
        valid = false;
      } else {
        removeError($supplierField);
      }
  
      if (!$priceField.val().trim()) {
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
    
    // --- Duplicate SKU Check Before Submission ---
    if (checkDuplicateSKUs()) {
      alert("Duplicate SKUs found within the submitted requests. Please ensure each SKU is unique.");
      return;
    }
    // -------------------------------------------------
    
    showLoader();
    let skuArray = [];
    $('#rowsContainer .row').each(function() {
      let sku = $(this).find('input[name="sku[]"]').val().trim();
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
            response.Item.forEach(item => existingSKUs.add(item.SKU));
          }
          let duplicateFound = false;
          $('#rowsContainer .row').each(function() {
            let sku = $(this).find('input[name="sku[]"]').val().trim();
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
  
          let savePromises = [];
          let submittedProducts = [];
          $('#rowsContainer .row').each(function() {
            let $row = $(this);
            let productData = {
              sku: $row.find('input[name="sku[]"]').val().trim(),
              product_name: $row.find('input[name="productName[]"]').val().trim(),
              brand: $row.find('select[name="brand[]"] option:selected').text(),
              primary_supplier: $row.find('select[name="supplier[]"]').val(),
              purchase_price: parseFloat($row.find('input[name="purchasePrice[]"]').val()),
              rrp: parseFloat($row.find('input[name="rrp[]"]').val()),
              status: "request",
              date_created: firebase.firestore.FieldValue.serverTimestamp(),
              requestor_firstName: currentUser ? currentUser.firstName : "",
              requestor_lastName: currentUser ? currentUser.lastName : "",
              requestor_email: currentUser ? currentUser.email : ""
            };
            submittedProducts.push(productData);
            savePromises.push(db.collection("product_requests").add(productData));
          });
  
          showLoader();
          Promise.all(savePromises)
            .then(() => {
              let summaryHtml = `
                <h2>Product Requests Summary</h2>
                <p><strong>Requestor:</strong> ${currentUser ? currentUser.firstName + " " + currentUser.lastName : ""}</p>
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
              summaryHtml += `<tr><td colspan="7" style="text-align: center;"><a href="https://rapidclean-pricing.powerappsportals.com/Product-Request-Approval" target="_blank">View Product Requests</a></td></tr>`;
              summaryHtml += `</tbody></table>`;
              $("#submissionSummary").html(summaryHtml);
  
              // Trigger Summary Email to Marketing.
              showLoader();
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
                  console.log("Summary email triggered for marketing", resp);
                  // Trigger second email to the requestor.
                  $.ajax({
                    url: "https://prod-24.australiasoutheast.logic.azure.com:443/workflows/16979e5f23434b988b37be58343e93e9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=loAkudpZIyE7_2o54CIncgVBLoXBtND6G_4Qm2MJzOE",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({
                      email_body: summaryHtml,
                      email_subject: "Product Creation Request Sent",
                      email_send_to: currentUser.email
                    }),
                    success: function(resp2) {
                      console.log("Confirmation email triggered for requestor", resp2);
                      hideLoader();
                      // Show notification modal after successful submission.
                      showNotification("Your product requests have been successfully saved and you will receive a confirmation email shortly.");
                    },
                    error: function(err2) {
                      console.error("Error triggering confirmation email for requestor", err2);
                      hideLoader();
                    }
                  });
                },
                error: function(err) {
                  console.error("Error triggering summary email for marketing", err);
                  hideLoader();
                }
              });
  
              // Clear the form and add a new row.
              $("#rowsContainer").empty();
              rowCount = 0;
              addRow();
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
