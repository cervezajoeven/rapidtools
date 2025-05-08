(function(App){
  "use strict";
  App.Services = App.Services || {};
  
  /**
   * Firebase Firestore operations
   */
  App.Services.Firestore = {
    /**
     * Upsert a customer_group_pricing record into Firestore.
     */
    upsertPricing: async function(sku, price, groupId) {
      const netoItem = await App.Services.Neto.getData(sku);
      console.log(`Neto data for SKU ${sku}:`, netoItem);
      
      const now = new Date().toISOString();
      
      // Build fields object
      const fields = {
        date_created: { stringValue: now },
        email: { stringValue: "" },
        group_id: { stringValue: groupId },
        price: { doubleValue: price },
        sku: { stringValue: sku },
        brand: { stringValue: netoItem.Brand || "" },
        categories: { arrayValue: { values: [] } }
      };

      // Process categories
      const categoriesArray = [];
      if (netoItem.Categories && Array.isArray(netoItem.Categories)) {
        const catEntry = netoItem.Categories[0];
        if (catEntry && catEntry.Category) {
          let catList = catEntry.Category;
          if (!Array.isArray(catList)) {
            catList = [catList];
          }
          for (const cat of catList) {
            if (cat.CategoryID) {
              categoriesArray.push({ integerValue: parseInt(cat.CategoryID, 10) });
            }
          }
        }
      }
      fields.categories.arrayValue.values = categoriesArray;
      console.log(`New record for SKU ${sku}:`, fields);

      // 1) Query existing
      const queryUrl = "https://firestore.googleapis.com/v1/projects/rapidclean-ba9be/databases/(default)/documents:runQuery";
      const queryPayload = {
        structuredQuery: {
          from: [{ collectionId: "customer_group_pricing" }],
          where: {
            compositeFilter: {
              op: "AND",
              filters: [
                { fieldFilter: { field: { fieldPath: "sku" }, op: "EQUAL", value: { stringValue: sku } } },
                { fieldFilter: { field: { fieldPath: "group_id" }, op: "EQUAL", value: { stringValue: groupId } } }
              ]
            }
          }
        }
      };

      let existingDocumentId = null;
      let existingDocumentData = null;
      
      try {
        const queryResponse = await fetch(queryUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queryPayload)
        });
        
        if (queryResponse.ok) {
          const queryResult = await queryResponse.json();
          if (queryResult && queryResult.length > 0 && queryResult[0].document) {
            const docName = queryResult[0].document.name;
            const segments = docName.split("/");
            existingDocumentId = segments[segments.length - 1];
            existingDocumentData = queryResult[0].document.fields;
          }
        }
      } catch (error) {
        console.error("Error querying Firestore:", error);
      }

      if (existingDocumentId && existingDocumentData) {
        // 2a) Archive
        const historyUrl = "https://firestore.googleapis.com/v1/projects/rapidclean-ba9be/databases/(default)/documents/customer_group_pricing_history";
        const historyPayload = {
          fields: {
            ...existingDocumentData,
            date_replaced: { stringValue: now }
          }
        };
        
        try {
          const historyResponse = await fetch(historyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(historyPayload)
          });
          
          if (!historyResponse.ok) {
            console.error(`Failed to archive record for SKU ${sku}`);
          }
        } catch (error) {
          console.error("Error archiving record:", error);
        }
        
        // 2b) Update
        const updateUrl = `https://firestore.googleapis.com/v1/projects/rapidclean-ba9be/databases/(default)/documents/customer_group_pricing/${existingDocumentId}?updateMask.fieldPaths=date_created&updateMask.fieldPaths=email&updateMask.fieldPaths=group_id&updateMask.fieldPaths=price&updateMask.fieldPaths=sku&updateMask.fieldPaths=brand&updateMask.fieldPaths=categories`;
        
        try {
          const updateResponse = await fetch(updateUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields })
          });
          
          if (!updateResponse.ok) {
            throw new Error(`Failed to update record for SKU ${sku} with status: ${updateResponse.status}`);
          }
          
          const updateResult = await updateResponse.json();
          console.log("Updated Firestore record:", updateResult);
          App.Utils.notifyFirebaseSuccess(`Pricing record for SKU ${sku} successfully updated.`);
        } catch (error) {
          console.error("Error updating record:", error);
        }
      } else {
        // 3) Create new
        const pricingUrl = "https://firestore.googleapis.com/v1/projects/rapidclean-ba9be/databases/(default)/documents/customer_group_pricing";
        
        try {
          const createResponse = await fetch(pricingUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields })
          });
          
          if (!createResponse.ok) {
            throw new Error(`Failed to create new record for SKU ${sku} with status: ${createResponse.status}`);
          }
          
          const createResult = await createResponse.json();
          console.log("Created new Firestore record:", createResult);
          App.Utils.notifyFirebaseSuccess(`Pricing record for SKU ${sku} successfully created.`);
        } catch (error) {
          console.error("Error creating new record:", error);
        }
      }
    }
  };
})(window.App = window.App || {}); 