(function(App){
  "use strict";
  App.Services = App.Services || {};
  App.Services.GroupMapping = {
    /**
     * Get the mapping of user groups.
     * @returns {Promise<Array>}
     */
    fetchAll: async function() {
      const res = await fetch(App.Config.ENDPOINTS.GROUP_MAPPING, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error(`GroupMapping API error ${res.status}`);
      return res.json();
    }
  };
})(window.App = window.App || {}); 