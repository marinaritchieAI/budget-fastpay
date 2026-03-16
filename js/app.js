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

    // Step navigation
    var continueBtn = document.getElementById('continue-btn');
    var backBtn = document.getElementById('back-btn');

    continueBtn.addEventListener('click', function() {
      if (BudgetState.getStep() === 1) {
        BudgetState.setStep(2);
        Renderer.renderStep(2);
        // Wire client name input on Step 2 after it becomes visible
        var clientNameInput = document.getElementById('client-name');
        if (clientNameInput) {
          clientNameInput.value = BudgetState.getState().clientName || '';
          clientNameInput.addEventListener('input', function() {
            BudgetState.setClientName(this.value);
          });
        }
      } else {
        PdfExport.generatePdf();
      }
    });

    backBtn.addEventListener('click', function() {
      BudgetState.setStep(1);
      Renderer.renderStep(1);
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
