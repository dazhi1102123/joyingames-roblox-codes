/* Reads the local reading log and looks for pattern.

   This is the one thing a tarot product can own that an astrology app cannot:
   a natal chart is fixed the day you sign up, but a reading history compounds.
   All of it stays in the browser — the server never sees a reading. */
(function () {
  var box = document.getElementById('deckStats');
  var empty = document.getElementById('empty');
  if (!box) return;

  var log = [];
  try { log = JSON.parse(localStorage.getItem('readings') || '[]'); } catch (e) { log = []; }

  if (!log.length) { empty.classList.remove('hidden'); return; }
  box.classList.remove('hidden');

  var draws = [];
  log.forEach(function (r) { (r.cards || []).forEach(function (c) { draws.push(c); }); });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slugify(name) { return name.toLowerCase().replace(/\s+/g, '-'); }
  function cardHref(name) { return window.CARD_URL.replace('SLUG', slugify(name)); }

  /* ---- headline numbers ---- */
  var reversed = draws.filter(function (c) { return c.reversed; }).length;
  var suitOf = { Wands: 'Wands', Cups: 'Cups', Swords: 'Swords', Pentacles: 'Pentacles' };
  var suits = { Wands: 0, Cups: 0, Swords: 0, Pentacles: 0 };
  var majors = 0;
  draws.forEach(function (c) {
    var m = /of (Wands|Cups|Swords|Pentacles)$/.exec(c.name);
    if (m && suitOf[m[1]] !== undefined) suits[m[1]]++;
    else majors++;
  });

  var stats = [
    ['Readings', log.length],
    ['Cards drawn', draws.length],
    ['Major arcana', Math.round(majors / draws.length * 100) + '%'],
    ['Reversed', Math.round(reversed / draws.length * 100) + '%']
  ];
  document.getElementById('statRow').innerHTML = stats.map(function (s) {
    return '<div class="stat"><span class="v">' + esc(s[1]) + '</span>' +
           '<span class="k">' + esc(s[0]) + '</span></div>';
  }).join('');

  /* ---- recurring cards ---- */
  var counts = {};
  draws.forEach(function (c) { counts[c.name] = (counts[c.name] || 0) + 1; });
  var repeats = Object.keys(counts)
    .filter(function (n) { return counts[n] > 1; })
    .sort(function (a, b) { return counts[b] - counts[a]; })
    .slice(0, 8);

  if (!repeats.length) {
    document.getElementById('noRecurring').classList.remove('hidden');
  } else {
    var host = document.getElementById('recurring');
    /* Render the tally immediately, then swap in the real card faces once they
       arrive — the page is useful before the fetch resolves, and stays useful
       if it never does. */
    host.innerHTML = repeats.map(function (n) {
      return '<a class="deck-item repeat" href="' + cardHref(n) + '" data-slug="' + slugify(n) + '">' +
             '<span class="tally">' + counts[n] + '&times;</span>' +
             '<span class="label">' + esc(n) + '</span></a>';
    }).join('');

    fetch('/api/card-art?slugs=' + repeats.map(slugify).join(','))
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (art) {
        host.querySelectorAll('.deck-item.repeat').forEach(function (el) {
          var svg = art[el.dataset.slug];
          if (!svg) return;
          el.classList.add('has-art');
          el.querySelector('.tally').outerHTML =
            '<span class="art">' + svg + '<span class="tally-badge">' +
            counts[el.querySelector('.label').textContent] + '&times;</span></span>';
        });
      })
      .catch(function () { /* tally-only view is a fine outcome */ });
  }

  /* ---- suit balance ---- */
  var order = ['Wands', 'Cups', 'Swords', 'Pentacles'];
  var minorTotal = order.reduce(function (a, k) { return a + suits[k]; }, 0);
  document.getElementById('suitBars').innerHTML = order.map(function (k) {
    var pct = minorTotal ? Math.round(suits[k] / minorTotal * 100) : 0;
    return '<div class="suit-bar suit-' + k.toLowerCase() + '">' +
           '<span class="nm">' + k + '</span>' +
           '<span class="track"><span style="width:' + pct + '%"></span></span>' +
           '<span class="pc">' + pct + '%</span></div>';
  }).join('');

  var note = document.getElementById('suitNote');
  if (!minorTotal) {
    note.textContent = 'All major arcana so far — a small sample, but a striking one.';
  } else {
    var top = order.slice().sort(function (a, b) { return suits[b] - suits[a]; })[0];
    var share = suits[top] / minorTotal;
    note.textContent = share > 0.4
      ? top + ' lead your readings at ' + Math.round(share * 100) + '% of the minor arcana drawn. ' +
        'With enough draws every suit converges on 25% — a lean this far off is either a small ' +
        'sample or a run worth noticing.'
      : 'Your suits are close to even, which is what a fair deck does over time.';
  }

  /* ---- recent readings ---- */
  document.getElementById('history').innerHTML = log.slice(0, 12).map(function (r) {
    var when = new Date(r.at).toLocaleDateString(undefined,
      { year: 'numeric', month: 'short', day: 'numeric' });
    var names = (r.cards || []).map(function (c) {
      return '<a href="' + cardHref(c.name) + '">' + esc(c.name) + '</a>' +
             (c.reversed ? ' <span class="r">rev</span>' : '');
    }).join(', ');
    return '<div class="entry"><div class="when">' + esc(when) + '</div>' +
           '<div class="what">' + names +
           (r.question ? '<div class="q">&ldquo;' + esc(r.question) + '&rdquo;</div>' : '') +
           '</div></div>';
  }).join('');

  document.getElementById('clearBtn').addEventListener('click', function () {
    if (!window.confirm('Delete your reading history on this device? This cannot be undone.')) return;
    try { localStorage.removeItem('readings'); } catch (e) {}
    window.location.reload();
  });
})();
