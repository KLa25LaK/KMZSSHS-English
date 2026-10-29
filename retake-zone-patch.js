(function () {
  function mount() {
    var vocabulary = document.getElementById('vocabulary');
    if (!vocabulary || document.getElementById('retake-zone')) return;
    var panel = document.createElement('article');
    panel.id = 'retake-zone';
    panel.className = 'entryPanel indexPanel';
    panel.innerHTML = '<div class="entryHeader"><div class="inlineTitle"><h2>補考專區</h2></div></div><div class="customHomeGrid" aria-label="補考資料夾"></div><div class="retakeContents" hidden></div>';
    var grid = panel.querySelector('.customHomeGrid');
    var contents = panel.querySelector('.retakeContents');
    ['4U', '解析', '一般單字'].forEach(function (name) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'customHomeFolderButton';
      button.textContent = '📁 ' + name;
      button.setAttribute('aria-expanded', 'false');
      button.onclick = function () {
        var open = button.getAttribute('aria-expanded') !== 'true';
        grid.querySelectorAll('button').forEach(function (item) { item.setAttribute('aria-expanded', 'false'); });
        button.setAttribute('aria-expanded', String(open));
        contents.hidden = !open;
        contents.replaceChildren();
        if (open) {
          var title = document.createElement('h3');
          title.textContent = name;
          var empty = document.createElement('p');
          empty.textContent = '此資料夾尚未加入單字。';
          contents.append(title);
          if (name === '解析') {
            var weeks = ['解析10月W1', '解析10月W2', '解析10月W3', '解析10月W4'];
            var counts = [54, 47, 57, 48];
            var folders = document.createElement('div');
            folders.className = 'customHomeGrid';
            weeks.forEach(function (label, index) {
              var child = document.createElement('button');
              child.type = 'button';
              child.textContent = '📁 ' + label + '（' + counts[index] + ' 字）';
              child.onclick = function () {
                window.dispatchEvent(new CustomEvent('kmz-open-retake', {detail:{unitId:'W' + (index + 1)}}));
              };
              folders.appendChild(child);
            });
            contents.appendChild(folders);
          } else { contents.appendChild(empty); }
        }
      };
      grid.appendChild(button);
    });
    vocabulary.insertAdjacentElement('afterend', panel);
  }
  var style = document.createElement('style');
  style.textContent = '#retake-zone{grid-column:1/-1}#retake-zone .customHomeGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}#retake-zone button{font:inherit;cursor:pointer;min-height:64px;border-radius:12px;padding:14px;border:1px solid #d99f45;background:#fff5dc;color:#533b20;font-weight:700}#retake-zone button[aria-expanded=true]{background:#ffe2a0;outline:2px solid #b77820}#retake-zone .retakeContents{margin-top:16px;padding:16px;border:1px solid #d99f45;border-radius:12px}#retake-zone h3{margin:0 0 8px}#retake-zone p{margin:0}@media(max-width:480px){#retake-zone .customHomeGrid{grid-template-columns:1fr}}';
  document.head.appendChild(style);
  new MutationObserver(mount).observe(document.body, {childList:true, subtree:true});
  mount();
})();
