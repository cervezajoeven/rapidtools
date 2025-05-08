(function(App){
  "use strict";
  // Centralised API endpoints
  App.Config = {
    ENDPOINTS: {
      ORDER_DETAILS: "https://prod-29.australiasoutheast.logic.azure.com:443/workflows/0282bb0f980c4c6596ceba7d465d1269/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FRC97yHJR3C2eV4mxLDx4Ud95WQZbihro6I6Rr58JGA",
      CUSTOMER_INFO: "https://prod-25.australiasoutheast.logic.azure.com:443/workflows/4f1fcf1326d54948b153273c442e8cf8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RAYNMIVXwsCfoqzZAQavfd01Ch07_pASYP6XGOqHd5U",
      COST_PRICE:     "https://prod-62.australiasoutheast.logic.azure.com:443/workflows/e66b00b9cb084f5a8b7f4954526fecaa/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CLVwwY4ZmM6CX_O-IPzgIND6QCk_C6tAaSaOwbxq6n0",
      GROUP_MAPPING:  "https://prod-60.australiasoutheast.logic.azure.com:443/workflows/c38543a949594553b4ad99cab7dd8c00/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=411u61erX0g_vm0mpwRrWKWuzPlcio6FJlgLJEdADUo",
      SAVE_MAROPOST:  "https://prod-53.australiasoutheast.logic.azure.com:443/workflows/105609f052e04dc8ab8b972bf1613942/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=TBHCbQPF_kEUBNkl-nFBDNEkooeZWc8gRINpD8PL4BE",
      NETO:           "https://prod-21.australiasoutheast.logic.azure.com:443/workflows/aac65666de1841ec9537e69c137232b1/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=IAGws7ZOZR0miDvdjn1S3dC6s2VkByAqwc1wk2ds_sI"
    }
  };

  // Global variable for customer group ID
  window.globalCustomerGroupID = null;
})(window.App = window.App || {}); 