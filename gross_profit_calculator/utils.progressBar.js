(function(App){
  "use strict";
  App.Utils = App.Utils || {};
  
  /**
   * Simple top‐of‐page loading bar.
   */
  App.Utils.showProgressBar = function() {
    let progressBar = document.getElementById('progressBar');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'progressBar';
      Object.assign(progressBar.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '0%',
        height: '5px',
        backgroundColor: 'blue',
        transition: 'width 0.3s'
      });
      document.body.appendChild(progressBar);
    }
    progressBar.style.width = '0%';
    progressBar.style.display = 'block';
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 90) clearInterval(interval);
      progressBar.style.width = progress + '%';
    }, 300);
    progressBar.dataset.intervalId = interval;
  };

  App.Utils.hideProgressBar = function() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      clearInterval(progressBar.dataset.intervalId);
      progressBar.style.width = '100%';
      setTimeout(() => {
        progressBar.style.display = 'none';
        progressBar.style.width = '0%';
      }, 500);
    }
  };
})(window.App = window.App || {}); 