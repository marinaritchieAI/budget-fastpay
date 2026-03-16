// DOM rendering functions
var Renderer = (function() {
  var bucketsContainer;
  var catalogueContainer;
  var continueBtn;
  var totalCountBadge;
  var targetBucketSelect;

  function init() {
    bucketsContainer = document.getElementById('buckets-container');
    catalogueContainer = document.getElementById('catalogue-container');
    continueBtn = document.getElementById('continue-btn');
    totalCountBadge = document.getElementById('total-count');
    targetBucketSelect = document.getElementById('target-bucket-select');
  }

  function formatCurrency(amount) {
    return '$' + Math.round(amount || 0).toLocaleString('en-AU');
  }

  function renderBuckets() {
    var state = BudgetState.getState();
    var buckets = state.buckets;
    var html = '';
    var totalCategories = 0;

    buckets.forEach(function(bucket) {
      totalCategories += bucket.categories.length;
      var isCustom = !bucket.isDefault;
      var isStaging = bucket.id === 'uncategorised';
      var headerClass = isStaging ? 'bucket-header staging' : (isCustom ? 'bucket-header custom' : 'bucket-header');
      var bucketTotal = BudgetState.getBucketTotal(bucket.id);

      html += '<div class="bucket" data-bucket-id="' + bucket.id + '">';
      html += '<div class="' + headerClass + '">';
      html += '<div class="bucket-header-left">';
      html += '<span class="bucket-name">' + escapeHtml(bucket.name) + '</span>';
      html += '<span class="bucket-count">' + bucket.categories.length + '</span>';
      html += '</div>';

      if (bucket.frequency) {
        html += '<span class="bucket-frequency">' + escapeHtml(bucket.frequency) + '</span>';
      }

      if (isCustom) {
        html += '<div class="bucket-actions">';
        html += '<button class="rename-bucket-btn" data-bucket-id="' + bucket.id + '" title="Rename bucket">&#9998;</button>';
        html += '<button class="delete-bucket-btn" data-bucket-id="' + bucket.id + '" title="Delete bucket">&#10005;</button>';
        html += '</div>';
      }

      html += '</div>';
      html += '<div class="bucket-body" data-bucket-id="' + bucket.id + '">';

      if (bucket.categories.length === 0) {
        html += '<div class="bucket-empty">Drag categories here or use the Add button</div>';
      } else {
        bucket.categories.forEach(function(cat) {
          var pillClass = cat.isCustom ? 'cat-pill custom' : 'cat-pill';
          var budgetVal = cat.budget || 0;
          html += '<div class="' + pillClass + '" data-id="' + cat.id + '" data-bucket-id="' + bucket.id + '" data-custom="' + (cat.isCustom ? '1' : '0') + '">';
          html += '<span class="cat-name">' + escapeHtml(cat.name) + '</span>';
          html += '<input type="number" class="budget-input" min="0" step="1" placeholder="0" value="' + (budgetVal > 0 ? Math.round(budgetVal) : '') + '" data-id="' + cat.id + '" data-bucket-id="' + bucket.id + '">';
          html += '<button class="remove-btn" data-id="' + cat.id + '" data-bucket-id="' + bucket.id + '" aria-label="Remove ' + escapeHtml(cat.name) + '">&times;</button>';
          html += '</div>';
        });
      }

      html += '</div>';

      // Bucket total row
      if (bucket.categories.length > 0) {
        html += '<div class="bucket-total" data-bucket-id="' + bucket.id + '">';
        html += '<span class="total-label">Total:</span>';
        html += '<span class="total-value">' + formatCurrency(bucketTotal) + '</span>';
        html += '</div>';
      }

      html += '</div>';
    });

    // Grand total
    var grandTotal = BudgetState.getGrandTotal();
    html += '<div class="grand-total" id="grand-total">';
    html += '<span class="total-label">Grand Total:</span>';
    html += '<span class="total-value">' + formatCurrency(grandTotal) + '</span>';
    html += '</div>';

    bucketsContainer.innerHTML = html;
    totalCountBadge.textContent = totalCategories + (totalCategories === 1 ? ' category' : ' categories');

    // Wire remove buttons
    var removeButtons = bucketsContainer.querySelectorAll('.remove-btn');
    removeButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var catId = this.getAttribute('data-id');
        var bucketId = this.getAttribute('data-bucket-id');
        BudgetState.removeCategoryFromBucket(bucketId, catId);
      });
    });

    // Wire budget inputs - update totals without full re-render
    var budgetInputs = bucketsContainer.querySelectorAll('.budget-input');
    budgetInputs.forEach(function(input) {
      input.addEventListener('input', function() {
        var catId = this.getAttribute('data-id');
        var bucketId = this.getAttribute('data-bucket-id');
        BudgetState.setCategoryBudget(bucketId, catId, this.value);
        updateTotals();
      });
      // Prevent drag when clicking on input
      input.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });
    });

    // Wire rename buttons
    var renameButtons = bucketsContainer.querySelectorAll('.rename-bucket-btn');
    renameButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var bucketId = this.getAttribute('data-bucket-id');
        startBucketRename(bucketId);
      });
    });

    // Wire delete buttons
    var deleteButtons = bucketsContainer.querySelectorAll('.delete-bucket-btn');
    deleteButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var bucketId = this.getAttribute('data-bucket-id');
        showDeleteConfirm(bucketId);
      });
    });

    // Re-init drag and drop
    if (typeof DragManager !== 'undefined') {
      DragManager.initBuckets();
    }
  }

  function updateTotals() {
    var state = BudgetState.getState();
    state.buckets.forEach(function(bucket) {
      var totalEl = bucketsContainer.querySelector('.bucket-total[data-bucket-id="' + bucket.id + '"] .total-value');
      if (totalEl) {
        totalEl.textContent = formatCurrency(BudgetState.getBucketTotal(bucket.id));
      }
    });
    var grandEl = bucketsContainer.querySelector('#grand-total .total-value');
    if (grandEl) {
      grandEl.textContent = formatCurrency(BudgetState.getGrandTotal());
    }
  }

  function startBucketRename(bucketId) {
    var bucketEl = bucketsContainer.querySelector('.bucket[data-bucket-id="' + bucketId + '"]');
    var nameSpan = bucketEl.querySelector('.bucket-name');
    var currentName = nameSpan.textContent;

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'bucket-rename-input';
    input.value = currentName;
    input.maxLength = 40;

    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    function finishRename() {
      var newName = input.value.trim();
      if (newName && newName !== currentName) {
        if (!BudgetState.renameCustomBucket(bucketId, newName)) {
          // Name conflict or invalid - revert
          renderBuckets();
          return;
        }
      } else {
        renderBuckets();
      }
    }

    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { input.blur(); }
      if (e.key === 'Escape') {
        input.value = currentName;
        input.blur();
      }
    });
  }

  function showDeleteConfirm(bucketId) {
    var bucketEl = bucketsContainer.querySelector('.bucket[data-bucket-id="' + bucketId + '"]');
    // Remove any existing confirm
    var existing = bucketEl.querySelector('.delete-confirm');
    if (existing) { existing.remove(); return; }

    var confirm = document.createElement('div');
    confirm.className = 'delete-confirm';
    confirm.innerHTML = '<span>Delete this bucket?</span>' +
      '<button class="confirm-yes">Delete</button>' +
      '<button class="confirm-no">Cancel</button>';

    bucketEl.appendChild(confirm);

    confirm.querySelector('.confirm-yes').addEventListener('click', function() {
      BudgetState.deleteCustomBucket(bucketId);
    });

    confirm.querySelector('.confirm-no').addEventListener('click', function() {
      confirm.remove();
    });
  }

  function renderCatalogue() {
    // Open all groups by default on first render
    if (!groupsInitialised) {
      CATALOGUE_GROUPS.forEach(function(g) { expandedGroups.add(g.id); });
      groupsInitialised = true;
    }

    var html = '';

    CATALOGUE_GROUPS.forEach(function(group) {
      var availableCategories = group.categories.filter(function(cat) {
        return !BudgetState.isAssigned(cat.id);
      });

      html += '<div class="catalogue-group" data-group-id="' + group.id + '">';
      html += '<div class="group-header" data-group-id="' + group.id + '">';
      html += '<span>' + escapeHtml(group.name) + '</span>';
      html += '<span class="group-count">' + availableCategories.length + ' of ' + group.categories.length + '</span>';
      html += '<span class="chevron">&#9654;</span>';
      html += '</div>';
      html += '<div class="group-body" data-group-id="' + group.id + '">';
      html += '<div class="group-body-inner">';

      if (availableCategories.length === 0) {
        html += '<div class="group-all-added">All categories added</div>';
      } else {
        availableCategories.forEach(function(cat) {
          html += '<div class="cat-item" data-id="' + cat.id + '" data-name="' + escapeHtml(cat.name) + '">';
          html += '<span class="cat-name">' + escapeHtml(cat.name) + '</span>';
          html += '<button class="add-btn" data-id="' + cat.id + '" data-name="' + escapeHtml(cat.name) + '" title="Add to budget">+</button>';
          html += '</div>';
        });
      }

      html += '</div></div></div>';
    });

    catalogueContainer.innerHTML = html;

    // Wire group toggle
    var headers = catalogueContainer.querySelectorAll('.group-header');
    headers.forEach(function(header) {
      header.addEventListener('click', function() {
        var groupId = this.getAttribute('data-group-id');
        toggleGroup(groupId);
      });
    });

    // Wire add buttons
    var addButtons = catalogueContainer.querySelectorAll('.add-btn');
    addButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var catId = this.getAttribute('data-id');
        var catName = this.getAttribute('data-name');
        // Default target: Uncategorised staging bucket
        BudgetState.addCategoryToBucket('uncategorised', {
          id: catId,
          name: catName,
          isCustom: false
        });
      });
    });

    // Re-init drag for catalogue items
    if (typeof DragManager !== 'undefined') {
      DragManager.initCatalogue();
    }
  }

  // Track expanded groups across renders - all open by default
  var expandedGroups = new Set();
  var groupsInitialised = false;

  function toggleGroup(groupId) {
    if (expandedGroups.has(groupId)) {
      expandedGroups.delete(groupId);
    } else {
      expandedGroups.add(groupId);
    }
    applyGroupStates();
  }

  function applyGroupStates() {
    CATALOGUE_GROUPS.forEach(function(group) {
      var header = catalogueContainer.querySelector('.group-header[data-group-id="' + group.id + '"]');
      var body = catalogueContainer.querySelector('.group-body[data-group-id="' + group.id + '"]');
      if (!header || !body) return;

      if (expandedGroups.has(group.id)) {
        header.classList.add('expanded');
        body.classList.add('expanded');
      } else {
        header.classList.remove('expanded');
        body.classList.remove('expanded');
      }
    });
  }

  function renderReview() {
    var reviewContainer = document.getElementById('review-buckets-container');
    var reviewGrandTotal = document.getElementById('review-grand-total');
    var state = BudgetState.getState();
    var html = '';

    state.buckets.forEach(function(bucket) {
      if (bucket.categories.length === 0) return;
      var bucketTotal = BudgetState.getBucketTotal(bucket.id);
      var isStaging = bucket.id === 'uncategorised';
      var headerClass = isStaging ? 'bucket-header staging' : 'bucket-header';

      html += '<div class="review-bucket" data-bucket-id="' + bucket.id + '">';
      html += '<div class="' + headerClass + '">';
      html += '<div class="bucket-header-left">';
      html += '<span class="bucket-name">' + escapeHtml(bucket.name) + '</span>';
      html += '<span class="bucket-count">' + bucket.categories.length + '</span>';
      html += '</div>';
      if (bucket.frequency) {
        html += '<span class="bucket-frequency">' + escapeHtml(bucket.frequency) + '</span>';
      }
      html += '</div>';

      bucket.categories.forEach(function(cat) {
        var budgetVal = cat.budget || 0;
        html += '<div class="review-category">';
        html += '<div class="review-cat-row">';
        html += '<span class="cat-name">' + escapeHtml(cat.name) + '</span>';
        html += '<input type="number" class="budget-input" min="0" step="1" placeholder="0" value="' + (budgetVal > 0 ? Math.round(budgetVal) : '') + '" data-id="' + cat.id + '" data-bucket-id="' + bucket.id + '">';
        html += '</div>';
        html += '<textarea class="description-input" placeholder="Add a description (optional)" data-id="' + cat.id + '" data-bucket-id="' + bucket.id + '" rows="1">' + escapeHtml(cat.description || '') + '</textarea>';
        html += '</div>';
      });

      // Bucket total
      html += '<div class="bucket-total" data-bucket-id="' + bucket.id + '">';
      html += '<span class="total-label">Total:</span>';
      html += '<span class="total-value">' + formatCurrency(bucketTotal) + '</span>';
      html += '</div>';

      html += '</div>';
    });

    reviewContainer.innerHTML = html;

    // Grand total
    var grandTotal = BudgetState.getGrandTotal();
    reviewGrandTotal.innerHTML = '<div class="grand-total"><span class="total-label">Grand Total:</span><span class="total-value">' + formatCurrency(grandTotal) + '</span></div>';

    // Wire budget inputs
    var budgetInputs = reviewContainer.querySelectorAll('.budget-input');
    budgetInputs.forEach(function(input) {
      input.addEventListener('input', function() {
        var catId = this.getAttribute('data-id');
        var bucketId = this.getAttribute('data-bucket-id');
        BudgetState.setCategoryBudget(bucketId, catId, this.value);
        updateReviewTotals();
      });
    });

    // Wire description textareas
    var descInputs = reviewContainer.querySelectorAll('.description-input');
    descInputs.forEach(function(textarea) {
      textarea.addEventListener('input', function() {
        var catId = this.getAttribute('data-id');
        var bucketId = this.getAttribute('data-bucket-id');
        BudgetState.setCategoryDescription(bucketId, catId, this.value);
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      });
    });
  }

  function updateReviewTotals() {
    var reviewContainer = document.getElementById('review-buckets-container');
    var state = BudgetState.getState();
    state.buckets.forEach(function(bucket) {
      var totalEl = reviewContainer.querySelector('.bucket-total[data-bucket-id="' + bucket.id + '"] .total-value');
      if (totalEl) {
        totalEl.textContent = formatCurrency(BudgetState.getBucketTotal(bucket.id));
      }
    });
    var grandEl = document.querySelector('#review-grand-total .total-value');
    if (grandEl) {
      grandEl.textContent = formatCurrency(BudgetState.getGrandTotal());
    }
  }

  function renderStep(step) {
    var step1 = document.getElementById('step-1-content');
    var step2 = document.getElementById('step-2-content');
    var backBtn = document.getElementById('back-btn');
    var contBtn = document.getElementById('continue-btn');

    if (step === 1) {
      step1.style.display = '';
      step2.style.display = 'none';
      backBtn.style.display = 'none';
      contBtn.textContent = 'Continue';
      contBtn.disabled = !BudgetState.isContinueEnabled();
    } else {
      step1.style.display = 'none';
      step2.style.display = '';
      backBtn.style.display = '';
      contBtn.textContent = 'Save as PDF';
      contBtn.disabled = false;
      renderReview();
    }
    window.scrollTo(0, 0);
  }

  function renderContinueButton() {
    continueBtn.disabled = !BudgetState.isContinueEnabled();
  }

  function renderBucketSelect() {
    var buckets = BudgetState.getBucketList();
    var html = '';
    buckets.forEach(function(b) {
      html += '<option value="' + b.id + '">' + escapeHtml(b.name) + '</option>';
    });
    targetBucketSelect.innerHTML = html;
  }

  function render() {
    renderBuckets();
    renderCatalogue();
    applyGroupStates();
    renderContinueButton();
    renderBucketSelect();
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return {
    init: init,
    render: render,
    renderBuckets: renderBuckets,
    renderCatalogue: renderCatalogue,
    renderContinueButton: renderContinueButton,
    renderReview: renderReview,
    renderStep: renderStep,
    escapeHtml: escapeHtml
  };
})();
