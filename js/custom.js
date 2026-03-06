// Custom bucket and category input handlers
var CustomControls = (function() {
  var bucketNameInput;
  var addBucketBtn;
  var bucketLimitMsg;
  var categoryNameInput;
  var targetBucketSelect;
  var addCategoryBtn;

  function init() {
    bucketNameInput = document.getElementById('new-bucket-name');
    addBucketBtn = document.getElementById('add-bucket-btn');
    bucketLimitMsg = document.getElementById('bucket-limit-msg');
    categoryNameInput = document.getElementById('new-category-name');
    targetBucketSelect = document.getElementById('target-bucket-select');
    addCategoryBtn = document.getElementById('add-category-btn');

    addBucketBtn.addEventListener('click', handleAddBucket);
    bucketNameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleAddBucket();
    });

    addCategoryBtn.addEventListener('click', handleAddCategory);
    categoryNameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleAddCategory();
    });
  }

  function handleAddBucket() {
    var name = bucketNameInput.value;
    var result = BudgetState.addCustomBucket(name);

    clearErrors();

    if (result.error) {
      showError(bucketNameInput, result.error);
      return;
    }

    bucketNameInput.value = '';
    updateBucketLimit();
  }

  function handleAddCategory() {
    var name = categoryNameInput.value;
    var bucketId = targetBucketSelect.value;

    clearErrors();

    if (!name.trim()) {
      showError(categoryNameInput, 'Please enter a category name.');
      return;
    }

    if (!bucketId) {
      showError(targetBucketSelect, 'Please select a bucket.');
      return;
    }

    var result = BudgetState.addCustomCategory(name, bucketId);

    if (result.error) {
      showError(categoryNameInput, result.error);
      return;
    }

    categoryNameInput.value = '';
  }

  function updateBucketLimit() {
    var state = BudgetState.getState();
    bucketLimitMsg.textContent = state.customBucketCount + ' of 3 custom buckets used';
    if (state.customBucketCount >= 3) {
      bucketLimitMsg.classList.add('input-error');
      addBucketBtn.disabled = true;
      addBucketBtn.style.opacity = '0.5';
    } else {
      bucketLimitMsg.classList.remove('input-error');
      addBucketBtn.disabled = false;
      addBucketBtn.style.opacity = '1';
    }
  }

  function showError(inputEl, message) {
    var errorEl = document.createElement('span');
    errorEl.className = 'input-error';
    errorEl.textContent = message;
    inputEl.parentNode.insertAdjacentElement('afterend', errorEl);
    inputEl.focus();
  }

  function clearErrors() {
    var errors = document.querySelectorAll('.custom-controls .input-error:not(#bucket-limit-msg)');
    errors.forEach(function(el) { el.remove(); });
  }

  function onStateChange() {
    updateBucketLimit();
  }

  return {
    init: init,
    onStateChange: onStateChange
  };
})();
