(function () {
  'use strict';
  var V = window.Vigil, h = V.h;
  var s = V.init('photo'); if (!s) return;
  var main = document.getElementById('main');
  var id = V.param('id');

  Promise.all([
    V.fetchJSON('data/photos.json'),
    V.fetchJSON('data/folders.json').catch(function () { return []; })
  ]).then(function (res) {
    var photos = res[0], folders = res[1] || [];
    function find(fid) { for (var j = 0; j < folders.length; j++) if (folders[j].id === fid) return folders[j]; return null; }
    function fidOf(p) { return find(p.folder) ? p.folder : ''; }
    var i = -1;
    for (var k = 0; k < photos.length; k++) if (photos[k].id === id) { i = k; break; }
    main.textContent = '';
    if (i < 0) {
      document.title = '找不到相片 - Project Vigil';
      main.appendChild(h('section', { class: 'panel' }, [
        h('h1', { text: '找不到相片' }),
        h('p', { text: '系統找不到您指定的相片，請回到相簿重新選擇。' }),
        h('p', null, h('a', { class: 'btn', href: 'album.html', text: '回相簿' }))
      ]));
      return;
    }
    var p = photos[i];
    var f = find(fidOf(p));
    var albumHref = f ? 'album.html?folder=' + encodeURIComponent(f.id) : 'album.html';

    function crumbs(last) {
      var c = [h('a', { href: 'home.html', text: '首頁' }), ' > ', h('a', { href: 'album.html', text: '相簿' }), ' > '];
      if (f) c.push(h('a', { href: albumHref, text: f.title || f.id }), ' > ');
      c.push(last);
      return h('p', { class: 'crumbs' }, c);
    }

    function paint() {
      main.textContent = '';
      if (!V.folderOpen(s, f)) {
        document.title = '相片 - Project Vigil';
        main.appendChild(crumbs('已加密'));
        main.appendChild(h('h1', { text: '此相片位於加密的資料夾' }));
        main.appendChild(V.folderGate(s, f, paint));
        return;
      }
      document.title = (p.title || p.id) + ' - 相簿 - Project Vigil';

      var img = h('img', { src: p.image, alt: p.title || '' });
      img.onerror = function () { img.onerror = null; img.src = 'images/placeholder-photo.svg'; };

      main.appendChild(crumbs(p.title || p.id));
      main.appendChild(h('h1', { text: p.title || p.id }));
      main.appendChild(h('figure', { class: 'photo-figure' }, img));

      var meta = h('dl', { class: 'photo-meta' });
      if (p.date) { meta.appendChild(h('dt', { text: '拍攝日期' })); meta.appendChild(h('dd', { text: p.date })); }
      if (p.photographer) { meta.appendChild(h('dt', { text: '拍攝者' })); meta.appendChild(h('dd', { text: p.photographer })); }
      if (meta.children.length) main.appendChild(meta);

      var rec = h('section', { class: 'record' }, h('h2', { text: '文字紀錄' }));
      var lines = [].concat(p.record || []).filter(Boolean);
      if (lines.length) V.paragraphs(rec, lines); else rec.appendChild(h('p', { class: 'muted', text: '本相片尚無文字紀錄。' }));
      main.appendChild(rec);

      var sib = photos.filter(function (q) { return fidOf(q) === fidOf(p); });
      var si = sib.indexOf(p);
      function link(q, label) {
        return q ? h('a', { href: 'photo.html?id=' + encodeURIComponent(q.id), text: label }) : h('span', { class: 'off', text: label });
      }
      main.appendChild(h('nav', { class: 'pager', 'aria-label': '相片切換' }, [
        link(sib[si - 1], '‹ 上一張'),
        h('a', { href: albumHref, text: f ? '回資料夾' : '回相簿' }),
        link(sib[si + 1], '下一張 ›')
      ]));
    }
    paint();
  }).catch(function () { V.showError(main); });
})();
