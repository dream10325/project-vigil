(function () {
  'use strict';
  var V = window.Vigil, h = V.h;
  var s = V.init('album'); if (!s) return;
  var main = document.getElementById('main');

  function thumbs(list) {
    var ul = h('ul', { class: 'thumbs' });
    list.forEach(function (p) {
      var img = h('img', { src: p.image, alt: p.title || '', loading: 'lazy' });
      img.onerror = function () { img.onerror = null; img.src = 'images/placeholder-photo.svg'; };
      ul.appendChild(h('li', null, h('a', { href: 'photo.html?id=' + encodeURIComponent(p.id) }, [img, h('span', { text: p.title || p.id })])));
    });
    return ul;
  }

  Promise.all([
    V.fetchJSON('data/photos.json'),
    V.fetchJSON('data/folders.json').catch(function () { return []; })
  ]).then(function (res) {
    var photos = res[0], folders = res[1] || [];
    function find(id) { for (var i = 0; i < folders.length; i++) if (folders[i].id === id) return folders[i]; return null; }
    function inFolder(fid) { return photos.filter(function (p) { return (find(p.folder) ? p.folder : '') === fid; }); }
    var fid = V.param('folder');
    main.textContent = '';

    /* ---- 資料夾內 ---- */
    if (fid) {
      var f = find(fid);
      if (!f) {
        document.title = '找不到資料夾 - Project Vigil';
        main.appendChild(h('section', { class: 'panel' }, [
          h('h1', { text: '找不到資料夾' }),
          h('p', { text: '系統找不到您指定的資料夾，請回到相簿重新選擇。' }),
          h('p', null, h('a', { class: 'btn', href: 'album.html', text: '回相簿' }))
        ]));
        return;
      }
      document.title = (f.title || f.id) + ' - 相簿 - Project Vigil';
      main.appendChild(h('p', { class: 'crumbs' }, [h('a', { href: 'home.html', text: '首頁' }), ' > ', h('a', { href: 'album.html', text: '相簿' }), ' > ' + (f.title || f.id)]));
      main.appendChild(h('h1', { text: f.title || f.id }));
      if (f.note) main.appendChild(h('p', { class: 'muted', text: f.note }));
      var body = h('div');
      main.appendChild(body);
      (function paint() {
        body.textContent = '';
        if (!V.folderOpen(s, f)) { body.appendChild(V.folderGate(s, f, paint)); return; }
        var list = inFolder(f.id);
        if (!list.length) body.appendChild(h('p', { class: 'muted', text: '此資料夾目前沒有照片。' }));
        else body.appendChild(thumbs(list));
      })();
      return;
    }

    /* ---- 相簿首頁：資料夾 + 未分類照片 ---- */
    document.title = '相簿 - Project Vigil';
    main.appendChild(h('h1', { text: '相簿' }));
    var root = inFolder('');
    if (!folders.length && !root.length) { main.appendChild(h('p', { class: 'muted', text: '目前沒有已歸檔的照片。' })); return; }
    if (folders.length) {
      var ul = h('ul', { class: 'gen-list folder-list' });
      folders.forEach(function (fo) {
        var note = fo.lock && !V.folderOpen(s, fo) ? '需輸入密碼' : '';
        ul.appendChild(h('li', null, h('a', { href: 'album.html?folder=' + encodeURIComponent(fo.id) }, [
          h('strong', { text: fo.title || fo.id }),
          note ? h('span', { class: 'gen-note', text: note }) : null
        ])));
      });
      main.appendChild(ul);
    }
    if (root.length) main.appendChild(thumbs(root));
  }).catch(function () { V.showError(main); });
})();
