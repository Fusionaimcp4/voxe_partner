(function () {
  var KEY = 'voxe-theme';

  function updateButton(theme) {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var icon = btn.querySelector('i');
    var next = theme === 'light' ? 'dark' : 'light';
    if (icon) icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    var label = 'Switch to ' + next + ' theme';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  function apply(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    updateButton(theme);
  }

  function init() {
    var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    updateButton(current);
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var now = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var next = now === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
