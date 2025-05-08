(function(App){
  "use strict";
  App.Utils = App.Utils || {};

  /**
   * Create a <td> cell with text.
   */
  App.Utils.createCell = function(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
  };

  /**
   * Briefly flash a cell.
   */
  App.Utils.blinkCell = function(cell) {
    cell.classList.add('blink');
    setTimeout(() => cell.classList.remove('blink'), 500);
  };

  /**
   * Colour GP cell if below threshold.
   */
  App.Utils.updateGPColor = function(cell, value) {
    cell.style.backgroundColor = parseFloat(value) < 20 ? '#ffcccc' : '';
  };

  /**
   * Add blink style to head
   */
  App.Utils.addBlinkStyle = function() {
    // Check if the style already exists
    if (document.getElementById('blink-style')) return;

    const style = document.createElement('style');
    style.id = 'blink-style';
    style.textContent = `
      @keyframes blink { 0% { background-color: yellow; } 100% { background-color: transparent; } }
      .blink { animation: blink 0.5s ease-out; }
      .group-match { background-color: #c6f6d5; padding: 2px 4px; border-radius: 3px; }
      .group-mismatch { background-color: #feb2b2; padding: 2px 4px; border-radius: 3px; }
      .notification { color: #d69e2e; font-size: 14px; margin-top: 5px; padding: 5px; border: 1px solid #d69e2e; border-radius: 3px; background-color: #fefcbf; }
    `;
    document.head.appendChild(style);
  };

  /**
   * Show Firebase success notification
   */
  App.Utils.notifyFirebaseSuccess = function(message) {
    let notificationDiv = document.getElementById('firebaseNotification');
    if (!notificationDiv) {
      notificationDiv = document.createElement('div');
      notificationDiv.id = 'firebaseNotification';
      notificationDiv.style.position = "fixed";
      notificationDiv.style.top = "10px";
      notificationDiv.style.right = "10px";
      notificationDiv.style.backgroundColor = "#d4edda";
      notificationDiv.style.color = "#155724";
      notificationDiv.style.padding = "10px";
      notificationDiv.style.border = "1px solid #c3e6cb";
      notificationDiv.style.borderRadius = "5px";
      document.body.appendChild(notificationDiv);
    }
    notificationDiv.textContent = message;
    setTimeout(() => {
      notificationDiv.textContent = "";
    }, 3000);
  };
})(window.App = window.App || {}); 