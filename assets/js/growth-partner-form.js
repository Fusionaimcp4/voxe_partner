/**
 * Growth Partner Program Expression of Interest form.
 * POSTs to /api/growth-partner-interest.php (same origin on PHP hosting).
 * On success: clears form, shows success message, hides form.
 */
(function() {
  var FORM_ID = 'growth-partner-eoi-form';
  var SUCCESS_ID = 'eoi-success-msg';
  var ERROR_ID = 'eoi-form-error';
  var SUBMIT_BTN_ID = 'eoi-submit-btn';
  var ENDPOINT = '/api/growth-partner-interest.php';

  function getEl(id) {
    return document.getElementById(id);
  }

  function collectPayload(form) {
    return {
      full_name: (form.querySelector('[name="full_name"]') || {}).value.trim(),
      email: (form.querySelector('[name="email"]') || {}).value.trim(),
      phone: (form.querySelector('[name="phone"]') || {}).value.trim() || undefined,
      contribution: (form.querySelector('[name="contribution"]') || {}).value.trim(),
      experience_network: (form.querySelector('[name="experience_network"]') || {}).value.trim() || undefined,
      notes: (form.querySelector('[name="notes"]') || {}).value.trim() || undefined
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
    button.textContent = submitting
      ? 'Submitting…'
      : 'Submit Growth Partner Expression of Interest';
  }

  function looksLikeEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      if (!payload.full_name) {
        showError(errorEl, 'Please enter your full name.');
        return;
      }
      if (!payload.email) {
        showError(errorEl, 'Please enter your email address.');
        return;
      }
      if (!looksLikeEmail(payload.email)) {
        showError(errorEl, 'Please enter a valid email address.');
        return;
      }
      if (!payload.contribution) {
        showError(errorEl, 'Please describe how you believe you can contribute to Voxe growth.');
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
        .then(function() {
          form.style.display = 'none';
          if (successEl) successEl.style.display = 'block';
          form.reset();
          if (successEl) successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
