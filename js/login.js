(function () {
  'use strict';
  var V = window.Vigil;
  if (V.init('login', { auth: false })) { location.replace('home.html'); return; }

  var form = document.getElementById('login-form');
  var msg = document.getElementById('login-msg');
  var btn = form.querySelector('button');

  function say(t) { msg.textContent = t; msg.hidden = false; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.hidden = true;
    var name = document.getElementById('codename').value.trim();
    var pw = document.getElementById('password').value;
    if (!name || !pw) { say('請輸入代號與密碼後再按「登入」。'); return; }
    btn.disabled = true;
    V.fetchJSON('data/users.json').then(function (users) {
      var u = null;
      for (var i = 0; i < users.length; i++) if (users[i].codename === name) { u = users[i]; break; }
      if (!u) return null;
      return V.sha256Hex(pw + u.salt).then(function (hex) { return hex === u.hash ? u : null; });
    }).then(function (u) {
      if (!u) { say('登入失敗：您輸入的代號或密碼與系統紀錄不符，請確認後再試一次。如需協助，請聯絡系統管理單位。'); return; }
      V.setSession(u);
      location.href = 'home.html';
    }).catch(function () {
      say('系統目前忙碌中，暫時無法完成登入，請稍後再試。造成不便，敬請見諒。');
    }).then(function () { btn.disabled = false; });
  });
})();
