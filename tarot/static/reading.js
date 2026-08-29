/* The reading stage: shuffle, deal, reveal, then stream the interpretation.
   Every step degrades to something usable — a failed model call still produces
   a full reading, because the server composes one from the card corpus. */
(function () {
  var cfg = window.READING;
  if (!cfg) return;

  var stack   = document.getElementById('deckStack');
  var drawBtn = document.getElementById('drawBtn');
  var status  = document.getElementById('status');
  var layout  = document.getElementById('spreadLayout');
  var interp  = document.getElementById('interp');
  var body    = document.getElementById('interpBody');
  var actions = document.getElementById('actions');
  var again   = document.getElementById('againBtn');
  var qInput  = document.getElementById('question');
  var qCount  = document.getElementById('qCount');
  var revBox  = document.getElementById('reversals');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;

  qInput.addEventListener('input', function () {
    qCount.textContent = qInput.value.length;
  });

  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* The model and the composed reading both emit a restrained markdown subset:
     bold to open a paragraph, italic for the quoted question. Nothing else is
     honoured, so a stray asterisk can never inject markup. */
  function render(text) {
    return esc(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  function backSVG() {
    var el = stack.querySelector('.cardface');
    return el ? el.outerHTML : '';
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, reduced ? 0 : ms); });
  }

  function buildSlots() {
    layout.innerHTML = '';
    cfg.positions.forEach(function (pos, i) {
      var el = document.createElement('div');
      el.className = 'drawn';
      el.style.animationDelay = (reduced ? 0 : i * 0.07) + 's';
      el.innerHTML =
        '<div class="pos">' + esc(pos[0]) + '</div>' +
        '<div class="flip"><div class="back">' + backSVG() + '</div>' +
        '<div class="front" data-front></div></div>' +
        '<div class="name" data-name>&nbsp;</div>';
      layout.appendChild(el);
    });
    layout.classList.remove('hidden');
    document.querySelector('.deck-zone').classList.add('dealt');
  }

  async function reveal(cards) {
    var slots = layout.querySelectorAll('.drawn');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var slot = slots[i];
      slot.querySelector('[data-front]').innerHTML = c.svg;
      slot.querySelector('[data-name]').innerHTML =
        '<a href="' + c.url + '">' + esc(c.name) + '</a>' +
        (c.reversed ? '<br><span class="rev">Reversed</span>' : '');
      slot.classList.add('revealed');
      status.textContent = 'Turning ' + (i + 1) + ' of ' + cards.length + '…';
      await sleep(360);
    }
  }

  async function stream(drawn) {
    interp.classList.remove('hidden');
    body.innerHTML = '<p class="thinking"><i></i><i></i><i></i></p>';

    var res = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spread: cfg.spread,
        drawn: drawn,
        question: qInput.value.trim()
      })
    });
    if (!res.ok || !res.body) throw new Error('interpretation unavailable');

    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buf = '';
    var first = true;
    var n = 0;

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });

      var parts = buf.split('\n\n');
      buf = parts.pop();
      for (var i = 0; i < parts.length; i++) {
        var lines = parts[i].split('\n');
        var event = '', data = '';
        lines.forEach(function (l) {
          if (l.indexOf('event: ') === 0) event = l.slice(7);
          else if (l.indexOf('data: ') === 0) data += l.slice(6);
        });
        if (event !== 'para') continue;
        if (first) { body.innerHTML = ''; first = false; }
        var p = document.createElement('p');
        p.style.animationDelay = (n++ * 0.05) + 's';
        p.innerHTML = render(JSON.parse(data).text);
        body.appendChild(p);
      }
    }
    if (first) body.innerHTML = '<p>The reading could not be generated. Please draw again.</p>';
  }

  function remember(cards) {
    try {
      var log = JSON.parse(localStorage.getItem('readings') || '[]');
      log.unshift({
        at: Date.now(),
        spread: cfg.spread,
        question: qInput.value.trim(),
        cards: cards.map(function (c) { return { name: c.name, reversed: c.reversed }; })
      });
      localStorage.setItem('readings', JSON.stringify(log.slice(0, 30)));
    } catch (e) { /* private mode, quota, blocked storage — never fatal */ }
  }

  async function go() {
    if (busy) return;
    busy = true;
    drawBtn.disabled = true;
    interp.classList.add('hidden');
    actions.classList.add('hidden');
    body.innerHTML = '';

    stack.classList.add('shuffling');
    status.textContent = 'Shuffling…';
    await sleep(900);
    stack.classList.remove('shuffling');

    try {
      var res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spread: cfg.spread, reversals: revBox.checked })
      });
      if (!res.ok) throw new Error('draw failed');
      var data = await res.json();

      buildSlots();
      await sleep(180);
      await reveal(data.cards);
      status.textContent = 'Reading the spread…';
      remember(data.cards);

      await stream(data.drawn);
      status.textContent = '';
      actions.classList.remove('hidden');
    } catch (err) {
      status.textContent = 'Something went wrong. Please try again.';
    } finally {
      busy = false;
      drawBtn.disabled = false;
      drawBtn.textContent = 'Shuffle & draw again';
    }
  }

  drawBtn.addEventListener('click', go);
  again.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    go();
  });
  stack.addEventListener('click', go);
  stack.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
  });
})();
