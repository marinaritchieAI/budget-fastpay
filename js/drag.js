// Drag and drop manager using SortableJS
var DragManager = (function() {
  var bucketSortables = [];
  var catalogueSortables = [];
  var isMobile = false;

  function detectMobile() {
    isMobile = window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024);
  }

  function destroyAll() {
    bucketSortables.forEach(function(s) {
      if (s && s.destroy) s.destroy();
    });
    catalogueSortables.forEach(function(s) {
      if (s && s.destroy) s.destroy();
    });
    bucketSortables = [];
    catalogueSortables = [];
  }

  function initBuckets() {
    bucketSortables.forEach(function(s) {
      if (s && s.destroy) s.destroy();
    });
    bucketSortables = [];

    detectMobile();

    var bucketBodies = document.querySelectorAll('#buckets-container .bucket-body');
    bucketBodies.forEach(function(el) {
      var bucketId = el.getAttribute('data-bucket-id');

      var sortable = Sortable.create(el, {
        group: {
          name: 'budget',
          pull: true,
          put: true
        },
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        draggable: '.cat-pill, .cat-item',
        disabled: isMobile,
        filter: '.bucket-empty',

        onAdd: function(evt) {
          var itemEl = evt.item;
          var catId = itemEl.getAttribute('data-id');
          var catName = itemEl.querySelector('.cat-name') ? itemEl.querySelector('.cat-name').textContent : '';

          if (itemEl.classList.contains('cat-item')) {
            // Coming from catalogue - remove the dropped clone/element
            itemEl.remove();
            BudgetState.addCategoryToBucket(bucketId, {
              id: catId,
              name: catName,
              isCustom: false
            });
          } else if (itemEl.classList.contains('cat-pill')) {
            // Moving between buckets
            var fromBucketId = itemEl.getAttribute('data-bucket-id');
            if (fromBucketId && fromBucketId !== bucketId) {
              itemEl.remove();
              BudgetState.moveCategoryBetweenBuckets(fromBucketId, bucketId, catId);
            }
          }
        },

        onUpdate: function(evt) {
          BudgetState.reorderCategoryInBucket(bucketId, evt.oldIndex, evt.newIndex);
        },

        onStart: function() {
          document.querySelectorAll('.bucket-body').forEach(function(body) {
            body.classList.add('drag-over');
          });
        },

        onEnd: function() {
          document.querySelectorAll('.bucket-body').forEach(function(body) {
            body.classList.remove('drag-over');
          });
        }
      });

      bucketSortables.push(sortable);
    });
  }

  function initCatalogue() {
    catalogueSortables.forEach(function(s) {
      if (s && s.destroy) s.destroy();
    });
    catalogueSortables = [];

    detectMobile();

    if (isMobile) return;

    var groupInners = document.querySelectorAll('.group-body-inner');
    groupInners.forEach(function(el) {
      var sortable = Sortable.create(el, {
        group: {
          name: 'budget',
          pull: 'clone',
          put: false
        },
        sort: false,
        animation: 150,
        ghostClass: 'sortable-ghost',
        draggable: '.cat-item',
        filter: '.group-all-added',

        onStart: function() {
          // Highlight bucket drop zones when dragging from catalogue
          document.querySelectorAll('.bucket-body').forEach(function(body) {
            body.classList.add('drag-over');
          });
        },

        onEnd: function(evt) {
          // Remove highlights
          document.querySelectorAll('.bucket-body').forEach(function(body) {
            body.classList.remove('drag-over');
          });

          // Clean up clone if dropped back in catalogue
          if (evt.to === evt.from) {
            return;
          }
        }
      });

      catalogueSortables.push(sortable);
    });
  }

  return {
    initBuckets: initBuckets,
    initCatalogue: initCatalogue,
    destroyAll: destroyAll
  };
})();
