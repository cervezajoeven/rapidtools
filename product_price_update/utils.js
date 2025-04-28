// utils.js

function parseCategories(cats) {
    const names = [];
    if (Array.isArray(cats)) {
      cats.forEach(wrapper => {
        if (wrapper && wrapper.Category) {
          const inner = wrapper.Category;
          if (Array.isArray(inner)) {
            inner.forEach(c => c.CategoryName && names.push(c.CategoryName));
          } else if (inner.CategoryName) {
            names.push(inner.CategoryName);
          }
        } else if (typeof wrapper === 'string' && wrapper.trim()) {
          names.push(wrapper.trim());
        }
      });
    }
    return names.join(', ');
  }
  
  function getClientPrice(priceGroups) {
    if (!Array.isArray(priceGroups)) return '';
    for (const wrapper of priceGroups) {
      const pg = wrapper.PriceGroup;
      if (Array.isArray(pg)) {
        for (const p of pg) {
          if (p && String(p.GroupID) === '2') return p.Price;
        }
      } else if (pg && String(pg.GroupID) === '2') {
        return pg.Price;
      }
    }
    return '';
  }
  
  function buildSkuCell(SKU, InventoryID) {
    return InventoryID
      ? `<a href="https://www.rapidsupplies.com.au/_cpanel/products/view?id=${InventoryID}" target="_blank">${SKU}</a>`
      : SKU;
  }
  
  function buildNumberInput(className, value) {
    return `<input type="number" step="0.01" class="form-control ${className}" value="${value ?? ''}" />`;
  }
  