// Application initialisation and event wiring
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // Initialise modules
    Renderer.init();
    PdfExport.init();
    CustomControls.init();

    // Initialise state (creates default buckets)
    BudgetState.init();

    // Subscribe renderer and custom controls to state changes
    BudgetState.subscribe(function() {
      Renderer.render();
      CustomControls.onStateChange();
    });

    // Initial render
    Renderer.render();
    CustomControls.onStateChange();

    // Client name input
    var clientNameInput = document.getElementById('client-name');
    clientNameInput.addEventListener('input', function() {
      BudgetState.setClientName(this.value);
    });

    // Continue button
    var continueBtn = document.getElementById('continue-btn');
    continueBtn.addEventListener('click', function() {
      PdfExport.generatePdf();
    });

    // Handle window resize for mobile detection
    var resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        DragManager.destroyAll();
        DragManager.initBuckets();
        DragManager.initCatalogue();
      }, 250);
    });
  });
})();
