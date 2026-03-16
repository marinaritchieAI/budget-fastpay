// PDF export logic — pure jsPDF (no html2canvas, no CORS issues)
var PdfExport = (function() {
  var jsPDF = window.jspdf.jsPDF;

  // Brand colours
  var BLUE = [46, 117, 182];     // #2E75B6
  var LIGHT_BG = [235, 242, 250]; // #EBF2FA
  var DARK_TEXT = [26, 26, 46];   // #1A1A2E
  var GREY_TEXT = [113, 128, 150]; // #718096
  var BODY_TEXT = [74, 85, 104];   // #4A5568
  var LINE_COL = [226, 232, 240];  // #E2E8F0

  var PAGE_W = 210; // A4 mm
  var MARGIN = 20;
  var CONTENT_W = PAGE_W - MARGIN * 2;

  function init() {}

  function formatCurrency(amount) {
    return '$' + Math.round(amount || 0).toLocaleString('en-AU');
  }

  // Check if we need a new page; if so add one and return reset Y
  function checkPage(doc, y, needed) {
    if (y + needed > 277) { // 297 - 20mm margin
      doc.addPage();
      return MARGIN;
    }
    return y;
  }

  function generatePdf() {
    var state = BudgetState.getState();
    var clientName = state.clientName.trim();

    if (!clientName) {
      var input = document.getElementById('client-name');
      input.classList.add('error');
      input.focus();
      input.addEventListener('input', function handler() {
        input.classList.remove('error');
        input.removeEventListener('input', handler);
      });
      return;
    }

    var today = new Date();
    var dateStr = today.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    var doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    var y = MARGIN;

    // ── Logo (top-right corner) ──
    if (typeof LOGO_DATA_URL !== 'undefined') {
      try {
        doc.addImage(LOGO_DATA_URL, 'PNG', PAGE_W - MARGIN - 35, y, 35, 10);
      } catch (e) {
        // Logo failed — continue without it
      }
    }

    // ── Title ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text('Budget Category Selection', MARGIN, y + 7);
    y += 14;

    // ── Client name ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(BODY_TEXT[0], BODY_TEXT[1], BODY_TEXT[2]);
    doc.text(clientName, MARGIN, y);
    y += 5;

    // ── Date ──
    doc.setFontSize(10);
    doc.setTextColor(GREY_TEXT[0], GREY_TEXT[1], GREY_TEXT[2]);
    doc.text(dateStr, MARGIN, y);
    y += 4;

    // ── Header divider ──
    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 8;

    // ── Buckets ──
    state.buckets.forEach(function(bucket, bucketIndex) {
      if (bucket.categories.length === 0) return;
      var bucketTotal = BudgetState.getBucketTotal(bucket.id);

      // Check space for at least header + 1 category + total
      y = checkPage(doc, y, 25);

      // Bucket header background
      doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
      doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, 'F');

      // Bucket name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.text(bucket.name, MARGIN + 4, y + 5.5);

      // Frequency label on right
      if (bucket.frequency) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(bucket.frequency, PAGE_W - MARGIN - 4, y + 5.5, { align: 'right' });
      }

      y += 10;

      // Categories
      bucket.categories.forEach(function(cat) {
        // Estimate space needed for this category
        var neededHeight = 7;
        if (cat.description && cat.description.trim()) {
          var estimatedLines = Math.ceil(cat.description.trim().length / 70);
          neededHeight += 1 + (estimatedLines * 3.5);
        }
        y = checkPage(doc, y, neededHeight);

        var catName = cat.name;
        if (cat.isCustom) catName += ' (custom)';
        var budgetStr = formatCurrency(cat.budget);

        // Category name
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(DARK_TEXT[0], DARK_TEXT[1], DARK_TEXT[2]);
        doc.text(catName, MARGIN + 6, y + 3);

        // Budget amount (right-aligned)
        doc.setFont('helvetica', 'bold');
        doc.text(budgetStr, PAGE_W - MARGIN - 6, y + 3, { align: 'right' });

        // Subtle bottom line
        doc.setDrawColor(LINE_COL[0], LINE_COL[1], LINE_COL[2]);
        doc.setLineWidth(0.2);
        doc.line(MARGIN + 4, y + 5.5, PAGE_W - MARGIN - 4, y + 5.5);

        y += 7;

        // Description (if provided)
        if (cat.description && cat.description.trim()) {
          y += 0.5;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(GREY_TEXT[0], GREY_TEXT[1], GREY_TEXT[2]);
          var descLines = doc.splitTextToSize(cat.description.trim(), CONTENT_W - 16);
          descLines.forEach(function(line) {
            y = checkPage(doc, y, 4);
            doc.text(line, MARGIN + 8, y + 2.5);
            y += 3.5;
          });
          y += 1;
        }
      });

      // Bucket total
      y += 1;
      doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.setLineWidth(0.5);
      doc.line(PAGE_W - MARGIN - 55, y, PAGE_W - MARGIN - 4, y);
      y += 1;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.text('Total:', PAGE_W - MARGIN - 38, y + 4);
      doc.text(formatCurrency(bucketTotal), PAGE_W - MARGIN - 6, y + 4, { align: 'right' });

      y += 10;
    });

    // ── Grand total ──
    y = checkPage(doc, y, 14);
    doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
    doc.roundedRect(MARGIN, y, CONTENT_W, 10, 2, 2, 'F');

    var grandTotal = BudgetState.getGrandTotal();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text('Grand Total:', PAGE_W - MARGIN - 48, y + 7);
    doc.text(formatCurrency(grandTotal), PAGE_W - MARGIN - 6, y + 7, { align: 'right' });

    y += 16;

    // ── Footer ──
    y = checkPage(doc, y, 10);
    doc.setDrawColor(LINE_COL[0], LINE_COL[1], LINE_COL[2]);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(GREY_TEXT[0], GREY_TEXT[1], GREY_TEXT[2]);
    doc.text('Prepared by FastPay Oculus  \u00B7  ' + dateStr, PAGE_W / 2, y, { align: 'center' });

    // Save
    var filename = clientName.replace(/[^a-zA-Z0-9 ]/g, '').trim() + ' - Budget Categories.pdf';
    doc.save(filename);
  }

  return {
    init: init,
    generatePdf: generatePdf
  };
})();
