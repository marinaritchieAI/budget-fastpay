// Central state manager - observable singleton
var BudgetState = (function() {
  var _listeners = [];
  var _state = {
    clientName: '',
    buckets: [],
    assignedCategoryIds: new Set(),
    customBucketCount: 0
  };

  function _notify() {
    _listeners.forEach(function(fn) { fn(_state); });
  }

  function _deepCloneBuckets(buckets) {
    return buckets.map(function(b) {
      return {
        id: b.id,
        name: b.name,
        frequency: b.frequency || '',
        isDefault: b.isDefault,
        categories: b.categories.map(function(c) {
          return { id: c.id, name: c.name, isCustom: c.isCustom, budget: c.budget || 0 };
        })
      };
    });
  }

  function _findBucket(bucketId) {
    for (var i = 0; i < _state.buckets.length; i++) {
      if (_state.buckets[i].id === bucketId) return _state.buckets[i];
    }
    return null;
  }

  function _findCategoryInBucket(bucket, categoryId) {
    for (var i = 0; i < bucket.categories.length; i++) {
      if (bucket.categories[i].id === categoryId) return i;
    }
    return -1;
  }

  return {
    init: function() {
      _state.buckets = _deepCloneBuckets(DEFAULT_BUCKETS);
      _state.assignedCategoryIds = new Set();
      _state.customBucketCount = 0;
      _state.buckets.forEach(function(bucket) {
        bucket.categories.forEach(function(cat) {
          _state.assignedCategoryIds.add(cat.id);
        });
      });
      _notify();
    },

    subscribe: function(fn) {
      _listeners.push(fn);
    },

    getState: function() {
      return _state;
    },

    setClientName: function(name) {
      _state.clientName = name;
    },

    isAssigned: function(categoryId) {
      return _state.assignedCategoryIds.has(categoryId);
    },

    addCategoryToBucket: function(bucketId, category) {
      if (_state.assignedCategoryIds.has(category.id)) return false;
      var bucket = _findBucket(bucketId);
      if (!bucket) return false;
      bucket.categories.push({
        id: category.id,
        name: category.name,
        isCustom: category.isCustom || false,
        budget: 0
      });
      _state.assignedCategoryIds.add(category.id);
      _notify();
      return true;
    },

    removeCategoryFromBucket: function(bucketId, categoryId) {
      var bucket = _findBucket(bucketId);
      if (!bucket) return null;
      var idx = _findCategoryInBucket(bucket, categoryId);
      if (idx === -1) return null;
      var removed = bucket.categories.splice(idx, 1)[0];
      _state.assignedCategoryIds.delete(categoryId);
      _notify();
      return removed;
    },

    moveCategoryBetweenBuckets: function(fromBucketId, toBucketId, categoryId) {
      if (fromBucketId === toBucketId) return false;
      var fromBucket = _findBucket(fromBucketId);
      var toBucket = _findBucket(toBucketId);
      if (!fromBucket || !toBucket) return false;
      var idx = _findCategoryInBucket(fromBucket, categoryId);
      if (idx === -1) return false;
      var cat = fromBucket.categories.splice(idx, 1)[0];
      toBucket.categories.push(cat);
      _notify();
      return true;
    },

    reorderCategoryInBucket: function(bucketId, oldIndex, newIndex) {
      var bucket = _findBucket(bucketId);
      if (!bucket) return;
      var item = bucket.categories.splice(oldIndex, 1)[0];
      bucket.categories.splice(newIndex, 0, item);
      // No notify needed for simple reorder visual - SortableJS handles DOM
    },

    addCustomBucket: function(name) {
      if (_state.customBucketCount >= 3) return { error: 'Maximum of 3 custom buckets allowed.' };
      var trimmed = name.trim();
      if (!trimmed) return { error: 'Please enter a bucket name.' };
      // Check for duplicate names
      for (var i = 0; i < _state.buckets.length; i++) {
        if (_state.buckets[i].name.toLowerCase() === trimmed.toLowerCase()) {
          return { error: 'A bucket with that name already exists.' };
        }
      }
      var bucket = {
        id: 'custom-' + Date.now(),
        name: trimmed,
        isDefault: false,
        categories: []
      };
      _state.buckets.push(bucket);
      _state.customBucketCount++;
      _notify();
      return { success: true, bucket: bucket };
    },

    renameCustomBucket: function(bucketId, newName) {
      var bucket = _findBucket(bucketId);
      if (!bucket || bucket.isDefault) return false;
      var trimmed = newName.trim();
      if (!trimmed) return false;
      for (var i = 0; i < _state.buckets.length; i++) {
        if (_state.buckets[i].id !== bucketId &&
            _state.buckets[i].name.toLowerCase() === trimmed.toLowerCase()) {
          return false;
        }
      }
      bucket.name = trimmed;
      _notify();
      return true;
    },

    deleteCustomBucket: function(bucketId) {
      var bucket = _findBucket(bucketId);
      if (!bucket || bucket.isDefault) return false;
      // Remove assigned IDs for standard categories (they return to catalogue)
      // Custom categories are just deleted
      bucket.categories.forEach(function(cat) {
        _state.assignedCategoryIds.delete(cat.id);
      });
      _state.buckets = _state.buckets.filter(function(b) { return b.id !== bucketId; });
      _state.customBucketCount--;
      _notify();
      return true;
    },

    addCustomCategory: function(name, bucketId) {
      var trimmed = name.trim();
      if (!trimmed) return { error: 'Please enter a category name.' };
      var bucket = _findBucket(bucketId);
      if (!bucket) return { error: 'Please select a bucket.' };
      var cat = {
        id: generateId(trimmed),
        name: trimmed,
        isCustom: true,
        budget: 0
      };
      bucket.categories.push(cat);
      _state.assignedCategoryIds.add(cat.id);
      _notify();
      return { success: true };
    },

    isContinueEnabled: function() {
      return _state.buckets.some(function(b) { return b.categories.length > 0; });
    },

    getBuckets: function() {
      return _state.buckets;
    },

    setCategoryBudget: function(bucketId, categoryId, amount) {
      var bucket = _findBucket(bucketId);
      if (!bucket) return;
      var idx = _findCategoryInBucket(bucket, categoryId);
      if (idx === -1) return;
      var val = parseInt(amount, 10);
      bucket.categories[idx].budget = isNaN(val) || val < 0 ? 0 : val;
      // Don't call _notify() — caller updates totals directly to avoid losing input focus
    },

    getBucketTotal: function(bucketId) {
      var bucket = _findBucket(bucketId);
      if (!bucket) return 0;
      var total = 0;
      bucket.categories.forEach(function(c) { total += (c.budget || 0); });
      return total;
    },

    getGrandTotal: function() {
      var total = 0;
      _state.buckets.forEach(function(b) {
        b.categories.forEach(function(c) { total += (c.budget || 0); });
      });
      return total;
    },

    getBucketList: function() {
      return _state.buckets.map(function(b) { return { id: b.id, name: b.name }; });
    }
  };
})();
