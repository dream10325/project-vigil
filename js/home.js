(function () {
  'use strict';
  var V = window.Vigil, h = V.h;
  var s = V.init('home'); if (!s) return;
  var main = document.getElementById('main');
  main.textContent = '';

  var annBox = h('div');
  var unreadEl = h('span', { text: '正在讀取…' });
  main.appendChild(h('h1', { text: '歡迎，' + s.codename }));
  main.appendChild(annBox);
  main.appendChild(h('ul', { class: 'card-list' }, [
    h('li', null, h('a', { href: 'mail.html' }, [h('strong', { text: '信箱' }), unreadEl])),
    h('li', null, h('a', { href: 'album.html' }, [h('strong', { text: '相簿' }), h('span', { text: '瀏覽已歸檔的照片與文字紀錄' })])),
    h('li', null, h('a', { href: 'gen.html' }, [h('strong', { text: '成員名冊' }), h('span', { text: '查看組織成員資訊' })]))
  ]));

  V.fetchJSON('data/announcement.json').then(function (a) {
    var body = [].concat(a.body || []).filter(Boolean);
    if (!a.title && !body.length) return;
    var box = h('section', { class: 'panel announce' }, h('h2', { text: a.title || '系統公告' }));
    if (a.date) box.appendChild(h('p', { class: 'date', text: a.date }));
    V.paragraphs(box, body);
    annBox.appendChild(box);
  }).catch(function () {});

  V.fetchJSON('data/mail.json').then(function (all) {
    var mails = V.visibleMail(all, s), read = V.getRead(s);
    var n = mails.filter(function (m) { return read.indexOf(m.id) === -1; }).length;
    unreadEl.textContent = n > 0 ? '您有 ' + n + ' 封未讀信件' : '目前沒有未讀信件';
  }).catch(function () { unreadEl.textContent = '讀取收件匣'; });
})();
