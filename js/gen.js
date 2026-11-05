(function () {
  'use strict';
  var V = window.Vigil, h = V.h;
  var s = V.init('gen'); if (!s) return;
  var main = document.getElementById('main');
  var UKEY = 'vigil.unlock.' + s.id;
  var SUFFIX = ' - Project Vigil';

  function unlocked() {
    try { var a = JSON.parse(V.sget(UKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function addUnlocked(n) {
    var a = unlocked(); if (a.indexOf(n) === -1) { a.push(n); V.sset(UKEY, JSON.stringify(a)); }
  }
  function crumbs(extra) {
    var c = h('p', { class: 'crumbs' }, [h('a', { href: 'home.html', text: '首頁' }), ' > ']);
    if (extra) { c.appendChild(h('a', { href: 'gen.html', text: '成員名冊' })); c.appendChild(document.createTextNode(' > ' + extra)); }
    else c.appendChild(document.createTextNode('成員名冊'));
    return c;
  }

  Promise.all([
    V.fetchJSON('data/gen.json'),
    V.fetchJSON('data/gen-locks.json').catch(function () { return {}; })
  ]).then(function (res) {
    var list = res[0], locks = res[1] || {};

    var gens = [];
    list.forEach(function (m) { if (gens.indexOf(m.batch) === -1) gens.push(m.batch); });
    if (s.batch !== 0 && gens.indexOf(s.batch) === -1) gens.push(s.batch);
    gens.sort(function (a, b) { return a - b; });
    function isOpen(n) { return s.batch === 0 || n === s.batch || !locks[n] || unlocked().indexOf(n) > -1; }

    var raw = V.param('n');
    var n = raw === null || raw === '' ? null : Number(raw);
    main.textContent = '';
    if (n === null) renderIndex(); else renderGen(n);

    function renderIndex() {
      document.title = '成員名冊' + SUFFIX;
      main.appendChild(crumbs());
      main.appendChild(h('h1', { text: '成員名冊' }));
      main.appendChild(h('p', { class: 'muted', text: '請選擇要查看的批次。' }));
      var ul = h('ul', { class: 'gen-list' });
      gens.forEach(function (g) {
        var note = g === s.batch && s.batch !== 0 ? '您所屬的批次' : (isOpen(g) ? '' : '需輸入密碼');
        ul.appendChild(h('li', null, h('a', { href: 'gen.html?n=' + g }, [
          h('strong', { text: '第 ' + g + ' 批' }),
          note ? h('span', { class: 'gen-note', text: note }) : null
        ])));
      });
      main.appendChild(ul);
    }

    function renderGen(g) {
      var rows = list.filter(function (m) { return m.batch === g; });
      if (isNaN(g) || gens.indexOf(g) < 0) {
        document.title = '找不到批次' + SUFFIX;
        main.appendChild(h('section', { class: 'panel' }, [
          h('h1', { text: '找不到批次' }),
          h('p', { text: '系統找不到您指定的批次，請回到成員名冊重新選擇。' }),
          h('p', null, h('a', { class: 'btn', href: 'gen.html', text: '回成員名冊' }))
        ]));
        return;
      }
      var label = '第 ' + g + ' 批';
      document.title = label + ' - 成員名冊' + SUFFIX;
      main.appendChild(crumbs(label));
      main.appendChild(h('h1', { text: label }));
      var body = h('div');
      main.appendChild(body);

      function paint() {
        body.textContent = '';
        if (!isOpen(g)) { body.appendChild(gate(g, locks[g], paint)); return; }
        if (!rows.length) { body.appendChild(h('p', { class: 'muted', text: '目前沒有可顯示的成員資料。' })); return; }
        var ul = h('ul', { class: 'people' });
        rows.forEach(function (m) {
          var img = h('img', { src: m.photo || 'images/gen/placeholder.svg', alt: m.codename + ' 的證件照', loading: 'lazy' });
          img.onerror = function () { img.onerror = null; img.src = 'images/gen/placeholder.svg'; };
          ul.appendChild(h('li', null, [
            img,
            h('strong', { text: m.codename }),
            h('span', { class: 'status', text: m.status || '' }),
            m.bio ? h('p', { text: m.bio }) : null
          ]));
        });
        body.appendChild(ul);
      }
      paint();
    }

    function gate(g, lock, onOpen) {
      var msg = h('p', { class: 'notice', role: 'alert', hidden: '' });
      var input = h('input', { type: 'password', id: 'pw', autocomplete: 'off', required: '' });
      var btn = h('button', { type: 'submit', class: 'btn', text: '查看' });
      var form = h('form', { class: 'unlock-form' }, [
        h('label', { for: 'pw', text: '請輸入第 ' + g + ' 批的查閱密碼' }),
        h('div', { class: 'unlock-row' }, [input, btn]),
        msg
      ]);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        btn.disabled = true; msg.hidden = true;
        V.sha256Hex(input.value + lock.salt).then(function (hex) {
          if (hex === lock.hash) { addUnlocked(g); onOpen(); return; }
          msg.textContent = '密碼不正確，請確認後再試一次。'; msg.hidden = false;
        }).catch(function () {
          msg.textContent = '系統目前忙碌中，請稍後再試。'; msg.hidden = false;
        }).then(function () { btn.disabled = false; });
      });
      var box = h('div', { class: 'panel batch-lock' }, h('p', { text: '此批次的成員資料需輸入密碼後才能查看。' }));
      if (lock.hint) box.appendChild(h('p', { class: 'muted', text: lock.hint }));
      box.appendChild(form);
      return box;
    }
  }).catch(function () { V.showError(main); });
})();
