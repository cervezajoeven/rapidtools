// endpoints.js

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
  