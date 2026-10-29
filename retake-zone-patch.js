(function () {
  var selectedFolder = null;
  function mount() {
    var vocabulary = document.getElementById('vocabulary');
    if (!vocabulary || document.getElementById('retake-zone')) return;
    var panel = document.createElement('article');
    panel.id = 'retake-zone';
    panel.className = 'entryPanel indexPanel';
    panel.innerHTML = '<div class="entryHeader"><div class="inlineTitle"><h2>115-1補充教材</h2></div></div><div class="customHomeGrid" aria-label="補充教材資料夾"></div><div class="retakeContents" hidden></div>';
    var grid = panel.querySelector('.customHomeGrid');
    var contents = panel.querySelector('.retakeContents');
    ['4U', '解析', '一般單字', '補考專區'].forEach(function (name) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'customHomeFolderButton';
      button.textContent = '📁 ' + name;
      if (name !== '補考專區') button.setAttribute('aria-expanded', 'false');
      button.onclick = function () {
        if (name === '補考專區') {
          selectedFolder = null;
          window.dispatchEvent(new CustomEvent('kmz-retake-choice', {detail:{direction:'enToZh'}}));
          return;
        }
        var open = button.getAttribute('aria-expanded') !== 'true';
        grid.querySelectorAll('button').forEach(function (item) { item.setAttribute('aria-expanded', 'false'); });
        button.setAttribute('aria-expanded', String(open));
        selectedFolder = open ? name : null;
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
            var counts = [78, 65, 78, 67];
            var folders = document.createElement('div');
            folders.className = 'customHomeGrid';
            weeks.forEach(function (label, index) {
              var child = document.createElement('button');
              child.type = 'button';
              child.textContent = '📁 ' + label + '（' + counts[index] + ' 項）';
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
    if (selectedFolder) {
      var restore = Array.from(grid.children).find(function (button) { return button.textContent === '📁 ' + selectedFolder; });
      if (restore) restore.click();
    }
  }
  var style = document.createElement('style');
  style.textContent = '#retake-zone{grid-column:1/-1}#retake-zone .customHomeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}#retake-zone button{font:inherit;cursor:pointer;min-height:64px;border-radius:12px;padding:14px;border:1px solid #d99f45;background:#fff5dc;color:#533b20;font-weight:700}#retake-zone button[aria-expanded=true]{background:#ffe2a0;outline:2px solid #b77820}#retake-zone .retakeContents{grid-column:1/-1;margin-top:16px;padding:16px;border:1px solid #d99f45;border-radius:12px}#retake-zone h3{margin:0 0 8px}#retake-zone p{margin:0}@media(max-width:760px){#retake-zone .customHomeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){#retake-zone .customHomeGrid{grid-template-columns:1fr}}';
  style.textContent += '.kmzRetakeDirections{display:flex;gap:12px;margin-top:16px}.kmzRetakeDirections button{flex:1;background:#f7d88c!important}.kmzRetakeChoice{display:flex!important;flex-direction:column;align-items:stretch;gap:8px;max-width:760px;width:100%;margin:auto;box-sizing:border-box}.kmzRetakeChoice h2{margin:8px 0}.kmzRetakeChoice>button:first-child{align-self:flex-start}.kmzRetakeChoice fieldset{border:1px solid #d99f45;border-radius:12px;padding:12px;margin:8px 0}.kmzRetakeRange{display:flex;gap:12px;align-items:center;padding:8px;border-bottom:1px solid #7774}.kmzRetakeRange input{width:20px;height:20px}.kmzRetakeCount{display:flex;align-items:center;gap:12px;margin:8px 0}.kmzRetakeChoice select,.kmzRetakeChoice input[type=number]{font:inherit;padding:10px;max-width:170px;border-radius:8px}.kmzRetakeChoice button{font:inherit;padding:10px 16px;margin:4px;border-radius:8px;cursor:pointer}.kmzRetakeChoice button:disabled{opacity:.45;cursor:not-allowed}';
  style.textContent += '.kmzRetakeRounds{border:1px solid #7776;border-radius:10px;padding:12px;margin:12px 0}.kmzRetakeRounds summary{cursor:pointer;font-weight:700;padding:6px 0}.kmzRetakeRounds label{line-height:1.5}';style.textContent += '.kmzRetakeResults{display:block!important;width:100%;box-sizing:border-box}.kmzRetakeResults h2{margin:0 0 12px}.kmzResultStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}.kmzResultStat{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;border:1px solid #d99f45;border-radius:12px}.kmzResultStat strong{font-size:28px}.kmzWrongTableWrap{overflow-x:auto;margin:12px 0}.kmzWrongTable{width:100%;border-collapse:collapse;text-align:left}.kmzWrongTable th,.kmzWrongTable td{padding:12px;border-bottom:1px solid #7776;overflow-wrap:anywhere}.kmzWrongTable thead th{color:#f7d88c}.kmzResultActions{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}.kmzResultActions button{font:inherit;padding:12px 18px;border-radius:8px;cursor:pointer}.kmzAllCorrect{color:#80d6a3;font-weight:700}@media(max-width:600px){.kmzResultStats{grid-template-columns:repeat(2,minmax(0,1fr))}.kmzWrongTable th,.kmzWrongTable td{padding:10px 6px}.kmzWrongTable{font-size:14px}}';style.textContent += '.kmzUnitScopeGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px}.kmzUnitScopeGroup{min-width:0}.kmzUnitScopeGrid .kmzRetakeRange{align-items:flex-start}.kmzUnitScopeGrid small{display:block;font-size:12px;opacity:.75;margin-top:4px;overflow-wrap:anywhere}@media(max-width:600px){.kmzUnitScopeGrid{grid-template-columns:1fr}}';document.head.appendChild(style);
  new MutationObserver(mount).observe(document.body, {childList:true, subtree:true});
  mount();
})();
