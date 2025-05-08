(function(App){
  "use strict";
  App.Services = App.Services || {};
  App.Services.Customer = {
    /**
     * Fetch customer info by username.
     * @param {string} username
     * @returns {Promise<Object>}
     */
    fetchInfo: async function(username) {
      const res = await fetch(App.Config.ENDPOINTS.CUSTOMER_INFO, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username:[username]})
      });
      if (!res.ok) throw new Error(`Customer API error ${res.status}`);
      return res.json();
    }
  };
})(window.App = window.App || {}); 