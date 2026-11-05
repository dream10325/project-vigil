(function (global) {
  'use strict';

  var SITE = {
    name: 'Project Vigil',
    copyright: '© 2026 Project Vigil. All rights reserved.',
    version: '系統版本 1.20.1'
  };
  var NAV = [
    ['home.html', '首頁', 'home'],
    ['mail.html', '信箱', 'mail'],
    ['album.html', '相簿', 'album'],
    ['gen.html', '成員名冊', 'gen']
  ];
  var SESSION_KEY = 'vigil.session';

  var memory = {};
  function probe(name) {
    try {
      var s = global[name], t = '__vigil_t';
      s.setItem(t, '1'); s.removeItem(t);
      return s;
    } catch (e) { return null; }
  }
  var stores = [probe('localStorage'), probe('sessionStorage')].filter(Boolean);
  function sget(k) {
    for (var i = 0; i < stores.length; i++) {
      try { var v = stores[i].getItem(k); if (v !== null) return v; } catch (e) {}
    }
    return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null;
  }
  function sset(k, v) {
    memory[k] = v;
    for (var i = 0; i < stores.length; i++) {
      try { stores[i].setItem(k, v); return; } catch (e) {}
    }
  }
  function sdel(k) {
    delete memory[k];
    for (var i = 0; i < stores.length; i++) {
      try { stores[i].removeItem(k); } catch (e) {}
    }
  }

  function getSession() {
    try {
      var s = JSON.parse(sget(SESSION_KEY));
      if (s && s.id && s.codename) return s;
    } catch (e) {}
    return null;
  }
  function setSession(u) {
    sset(SESSION_KEY, JSON.stringify({ id: u.id, codename: u.codename, batch: u.batch }));
  }
  function logout() {
    var s = getSession();
    if (s) { sdel('vigil.unlock.' + s.id); sdel('vigil.albumunlock.' + s.id); }
    sdel(SESSION_KEY);
    location.href = 'index.html';
  }

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    if (kids != null) {
      [].concat(kids).forEach(function (c) {
        if (c == null) return;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  }
  function fetchJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function sha256Hex(text) {
    if (!global.crypto || !global.crypto.subtle) return Promise.reject(new Error('no subtle'));
    return global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  function richText(parent, str) {
    var re = /\[([^\]]+)\]\(([^)\s]+)\)/g, last = 0, m;
    str = String(str == null ? '' : str);
    while ((m = re.exec(str))) {
      if (m.index > last) parent.appendChild(document.createTextNode(str.slice(last, m.index)));
      if (/^\s*([a-z][a-z0-9+.\-]*:|\/\/)/i.test(m[2])) parent.appendChild(document.createTextNode(m[0]));
      else parent.appendChild(h('a', { href: m[2], text: m[1] }));
      last = re.lastIndex;
    }
    if (last < str.length) parent.appendChild(document.createTextNode(str.slice(last)));
    return parent;
  }
  function paragraphs(parent, list) {
    [].concat(list || []).forEach(function (t) { parent.appendChild(richText(h('p'), t)); });
    return parent;
  }
  function showError(parent, msg) {
    parent.textContent = '';
    parent.appendChild(h('p', { class: 'notice', role: 'alert', text: msg || '資料暫時無法載入，請稍後再試。' }));
  }
  function param(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }

  function visibleMail(all, s) {
    if (s.batch === 0) return (all || []).slice();
    var keys = ['all', 'batch' + s.batch, s.codename];
    return (all || []).filter(function (m) {
      return (m.to || []).some(function (t) { return keys.indexOf(t) > -1; });
    });
  }
  function folderUnlockedList(s) {
    try { var a = JSON.parse(sget('vigil.albumunlock.' + s.id) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function folderOpen(s, f) {
    if (!f || !f.lock) return true;
    if (s.batch === 0) return true;
    return folderUnlockedList(s).indexOf(f.id) > -1;
  }
  function folderGate(s, f, onOpen) {
    var msg = h('p', { class: 'notice', role: 'alert', hidden: '' });
    var input = h('input', { type: 'password', id: 'folder-pw', autocomplete: 'off', required: '' });
    var btn = h('button', { type: 'submit', class: 'btn', text: '查看' });
    var form = h('form', { class: 'unlock-form' }, [
      h('label', { for: 'folder-pw', text: '請輸入此資料夾的查閱密碼' }),
      h('div', { class: 'unlock-row' }, [input, btn]),
      msg
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      btn.disabled = true; msg.hidden = true;
      sha256Hex(input.value + f.lock.salt).then(function (hex) {
        if (hex === f.lock.hash) {
          var a = folderUnlockedList(s);
          if (a.indexOf(f.id) === -1) { a.push(f.id); sset('vigil.albumunlock.' + s.id, JSON.stringify(a)); }
          onOpen(); return;
        }
        msg.textContent = '密碼不正確，請確認後再試一次。'; msg.hidden = false;
      }).catch(function () {
        msg.textContent = '系統目前忙碌中，請稍後再試。'; msg.hidden = false;
      }).then(function () { btn.disabled = false; });
    });
    var box = h('div', { class: 'panel batch-lock' }, h('p', { text: '此資料夾需輸入密碼後才能查看。' }));
    if (f.lock.hint) box.appendChild(h('p', { class: 'muted', text: f.lock.hint }));
    box.appendChild(form);
    return box;
  }
  function readKey(s) { return 'vigil.read.' + s.id; }
  function getRead(s) {
    try {
      var a = JSON.parse(sget(readKey(s)) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function markRead(s, id) {
    var a = getRead(s);
    if (a.indexOf(id) === -1) { a.push(id); sset(readKey(s), JSON.stringify(a)); }
  }

  function renderHeader(active, s) {
    var el = document.getElementById('site-header');
    if (!el) return;
    el.textContent = '';
    var right = h('div', { class: 'userbox' });
    if (s) {
      right.appendChild(h('span', null, [h('span', { class: 'userlabel', text: '目前登入：' }), s.codename + '（第 ' + s.batch + ' 批）']));
      var b = h('button', { type: 'button', class: 'linkbtn', text: '登出' });
      b.addEventListener('click', logout);
      right.appendChild(b);
    }
    el.appendChild(h('div', { class: 'topbar' }, h('div', { class: 'wrap topbar-in' }, [
      h('a', { class: 'brand', href: 'home.html' }, SITE.name),
      right
    ])));
    if (s) {
      var nav = h('nav', { class: 'mainnav', 'aria-label': '主選單' });
      var wrap = h('div', { class: 'wrap' });
      NAV.forEach(function (n) {
        var a = h('a', { href: n[0], text: n[1] });
        if (n[2] === active || (active === 'photo' && n[2] === 'album')) a.setAttribute('aria-current', 'page');
        wrap.appendChild(a);
      });
      nav.appendChild(wrap);
      el.appendChild(nav);
    }
  }
  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    el.textContent = '';
    el.appendChild(h('div', { class: 'wrap' }, [
      h('p', { text: SITE.copyright + '　|　' + SITE.version })
    ]));
  }

  function init(page, opts) {
    var auth = !(opts && opts.auth === false);
    var s = getSession();
    if (auth && !s) { location.replace('index.html'); return null; }
    renderHeader(page, s);
    renderFooter();
    if (auth && s) refreshSession(s);
    return s;
  }

  function refreshSession(s) {
    fetchJSON('data/users.json').then(function (users) {
      var u = null;
      for (var i = 0; i < users.length; i++) if (users[i].id === s.id) { u = users[i]; break; }
      if (!u) { sdel(SESSION_KEY); location.replace('index.html'); return; }
      if (u.batch !== s.batch || u.codename !== s.codename) { setSession(u); location.reload(); }
    }).catch(function () {});
  }

  global.Vigil = {
    folderOpen: folderOpen, folderGate: folderGate,
    init: init, getSession: getSession, setSession: setSession, logout: logout,
    h: h, fetchJSON: fetchJSON, sha256Hex: sha256Hex, richText: richText, paragraphs: paragraphs,
    showError: showError, param: param, sget: sget, sset: sset,
    visibleMail: visibleMail, getRead: getRead, markRead: markRead
  };
})(window);
