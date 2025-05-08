(function(App){
  "use strict";
  document.addEventListener("DOMContentLoaded", function(){
    const submitBtn = document.getElementById("submitOrder");
    submitBtn.addEventListener("click", () => {
      const id = document.getElementById("orderIdInput").value.trim();
      if (!id) return alert("Please enter an Order ID.");
      App.Controllers.Order.load(id);
    });

    // Enter key in order id input also triggers search
    document.getElementById("orderIdInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitBtn.click();
      }
    });

    document.getElementById("toggleSaveDiscount")
      .addEventListener("change", e => {
        document
          .querySelectorAll("#orderLineTable tbody input[type=checkbox]")
          .forEach(cb => cb.checked = e.target.checked);
      });

    document.getElementById("applyPricingBtn")
      .addEventListener("click", App.Controllers.Pricing.apply);
  });
})(window.App = window.App || {}); 