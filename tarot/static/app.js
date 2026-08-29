/* Theme toggle. Three states exist in the wild — explicit light, explicit dark,
   and "whatever the OS says" — so the button reads the resolved theme rather
   than assuming the document is stamped. */
(function () {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  function resolved() {
    var stamped = document.documentElement.getAttribute('data-theme');
    if (stamped) return stamped;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function label() {
    btn.textContent = resolved() === 'dark' ? 'Light' : 'Dark';
  }

  btn.addEventListener('click', function () {
    var next = resolved() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });

  label();
})();
