/**
 * Friends & Family Expression of Interest form.
 * POSTs to /api/friends-family-interest (same origin when served by investor server).
 * On success: clears form, shows success message, hides form.
 */
(function() {
  var FORM_ID = 'friends-family-eoi-form';
  var SUCCESS_ID = 'eoi-success-msg';
  var ERROR_ID = 'eoi-form-error';
  var SUBMIT_BTN_ID = 'eoi-submit-btn';
  // Root-relative so it works from any page. Must exist at /api/friends-family-interest.php on the server.
  var ENDPOINT = '/api/friends-family-interest.php';

  function getEl(id) {
    return document.getElementById(id);
  }

  function parseAmount(val) {
    if (val == null || val === '') return null;
    var s = String(val).replace(/[^\d.-]/g, '');
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function collectPayload(form) {
    var amountRaw = (form.querySelector('[name="amount_usd"]') || {}).value;
    var amount = parseAmount(amountRaw);
    return {
      full_name: (form.querySelector('[name="full_name"]') || {}).value.trim(),
      email: (form.querySelector('[name="email"]') || {}).value.trim(),
      phone: (form.querySelector('[name="phone"]') || {}).value.trim() || undefined,
      location: (form.querySelector('[name="location"]') || {}).value.trim(),
      amount_usd: amount != null ? amount : (amountRaw || '').trim(),
      notes: (form.querySelector('[name="notes"]') || {}).value.trim() || undefined,
      risk_acknowledgment: !!((form.querySelector('[name="risk_acknowledgment"]') || {}).checked)
    };
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg || 'Something went wrong. Please try again.';
    el.style.display = 'block';
  }

  function hideError(el) {
    if (el) el.style.display = 'none';
  }

  function setSubmitting(button, submitting) {
    if (!button) return;
    button.disabled = submitting;
    button.textContent = submitting ? 'Submitting…' : 'Submit Expression of Interest';
  }

  function init() {
    var form = getEl(FORM_ID);
    var successEl = getEl(SUCCESS_ID);
    var errorEl = getEl(ERROR_ID);
    var submitBtn = getEl(SUBMIT_BTN_ID);

    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      hideError(errorEl);

      var payload = collectPayload(form);
      if (!payload.full_name || !payload.email || !payload.location) {
        showError(errorEl, 'Please fill in all required fields (Full Name, Email, City & Country / State).');
        return;
      }
      if (!payload.risk_acknowledgment) {
        showError(errorEl, 'Please acknowledge the risk before submitting.');
        return;
      }
      if (payload.amount_usd === '' || (typeof payload.amount_usd !== 'number' && !String(payload.amount_usd).trim())) {
        showError(errorEl, 'Please indicate the approximate amount you are considering investing (USD).');
        return;
      }
      var amountNum = typeof payload.amount_usd === 'number' ? payload.amount_usd : parseAmount(payload.amount_usd);
      if (amountNum != null && amountNum > 5000) {
        showError(errorEl, 'Maximum amount per investor is $5,000.');
        return;
      }

      setSubmitting(submitBtn, true);

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function(res) {
          if (!res.ok) throw new Error(res.statusText || 'Request failed');
          return res.json().catch(function() { return {}; });
        })
        .then(function(data) {
          form.style.display = 'none';
          if (successEl) successEl.style.display = 'block';
          form.reset();
          if (successEl) successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          // If the backend returned a personalised SAFE PDF path, trigger an automatic download.
          if (data && data.pdf_path) {
            try {
              var link = document.createElement('a');
              link.href = data.pdf_path;
              // Empty download attribute lets the browser pick the filename from the URL.
              link.download = '';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (e) {
              if (typeof console !== 'undefined' && console.error) console.error(e);
            }
          }
        })
        .catch(function(err) {
          showError(errorEl, 'We couldn’t send your submission. Please try again or contact us directly.');
          if (typeof console !== 'undefined' && console.error) console.error(err);
        })
        .finally(function() {
          setSubmitting(submitBtn, false);
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
