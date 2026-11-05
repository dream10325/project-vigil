(function () {
  'use strict';
  var V = window.Vigil, h = V.h;
  var s = V.init('mail'); if (!s) return;
  var main = document.getElementById('main');

  V.fetchJSON('data/mail.json').then(function (all) {
    var mails = V.visibleMail(all, s).reverse();
    var read = V.getRead(s);
    var items = {};
    main.textContent = '';
    main.appendChild(h('h1', { text: '信箱' }));

    var ul = h('ul');
    var list = h('section', { class: 'mail-list', 'aria-label': '收件匣' }, [h('h2', { text: '收件匣' }), ul]);
    var view = h('section', { class: 'mail-view', 'aria-live': 'polite' });
    var layout = h('div', { class: 'mail-layout' }, [list, view]);
    main.appendChild(layout);

    function typeTag(m) {
      var sys = m.from && m.from.type === 'system';
      return h('span', { class: 'tag' + (sys ? ' system' : ''), text: sys ? '系統' : '個人' });
    }
    function isRead(id) { return read.indexOf(id) > -1; }

    function paintItem(m) {
      var a = items[m.id];
      a.className = 'mail-item' + (isRead(m.id) ? '' : ' unread');
      var old = a.querySelector('.tag.unread'); if (old) old.remove();
      if (!isRead(m.id)) a.querySelector('.subject').appendChild(h('span', { class: 'tag unread', text: '未讀' }));
    }

    mails.forEach(function (m) {
      var a = h('a', { href: 'mail.html?m=' + encodeURIComponent(m.id) }, [
        h('span', { class: 'top' }, [h('span', null, [(m.from && m.from.name) || '', typeTag(m)]), h('span', { text: m.date || '' })]),
        h('span', { class: 'subject', text: m.subject || '（無主旨）' })
      ]);
      a.addEventListener('click', function (e) { e.preventDefault(); select(m.id, true); });
      items[m.id] = a;
      ul.appendChild(h('li', null, a));
      paintItem(m);
    });
    if (!mails.length) ul.appendChild(h('li', { class: 'empty', text: '目前沒有信件。' }));

    function showEmpty() {
      layout.classList.remove('show-view');
      view.textContent = '';
      view.appendChild(h('p', { class: 'muted', text: '請從左側選擇要閱讀的信件。' }));
      Object.keys(items).forEach(function (k) { items[k].classList.remove('active'); });
    }

    function select(id, push) {
      var m = mails.filter(function (x) { return x.id === id; })[0];
      if (!m) { showEmpty(); return; }
      if (push) history.pushState({ m: id }, '', 'mail.html?m=' + encodeURIComponent(id));
      V.markRead(s, id);
      if (read.indexOf(id) === -1) read.push(id);
      Object.keys(items).forEach(function (k) { items[k].classList.toggle('active', k === id); });
      paintItem(m);
      layout.classList.add('show-view');

      view.textContent = '';
      var back = h('button', { type: 'button', class: 'back', text: '← 返回收件匣' });
      back.addEventListener('click', function () {
        if (history.state && history.state.m) history.back(); else { history.replaceState(null, '', 'mail.html'); showEmpty(); }
      });
      var body = h('div', { class: 'mail-body' });
      V.paragraphs(body, m.body);
      [].concat(m.images || []).forEach(function (im) {
        var o = typeof im === 'string' ? { src: im } : im;
        var fig = h('figure', null, h('img', { src: o.src, alt: o.alt || '', loading: 'lazy' }));
        if (o.caption) fig.appendChild(h('figcaption', { text: o.caption }));
        body.appendChild(fig);
      });
      view.appendChild(back);
      view.appendChild(h('h2', { text: m.subject || '（無主旨）' }));
      view.appendChild(h('p', { class: 'mail-meta' }, ['寄件者：' + ((m.from && m.from.name) || ''), typeTag(m), '　日期：' + (m.date || '')]));
      view.appendChild(body);
      window.scrollTo(0, 0);
    }

    window.addEventListener('popstate', function () {
      var id = V.param('m');
      if (id) select(id, false); else showEmpty();
    });
    var first = V.param('m');
    if (first) select(first, false); else showEmpty();
  }).catch(function () { V.showError(main); });
})();
