(function () {
  var selectedFolder = null;
  var selectedArticleGroup = null;
  var actions = new WeakMap();
  // Handle injected controls before React's root event interception.
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('#retake-zone button');
    var action = button && actions.get(button);
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    action();
  }, true);
  function exam3Url() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('retake-zone-patch.js') !== -1) return src.replace(/retake-zone-patch\.js.*$/, 'exam3-1151.json');
    }
    return 'exam3-1151.json';
  }
  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }
  function resolvePool(items) {
    var gloss = window.__KMZ_GLOSS || {};
    var pool = [];
    items.forEach(function (item) {
      if (typeof item === 'string') {
        var entry = gloss[item];
        if (!entry || !entry.meanings || !entry.meanings.length) return;
        pool.push({ en: entry.word || item, zh: entry.meanings.join('；'), phr: /phr/i.test(entry.pos || '') || /\s/.test(entry.word || '') });
        return;
      }
      if (item && item.w && item.z) pool.push({ en: item.w, zh: item.z, phr: !!item.phr });
    });
    return pool;
  }
  function distractorsFor(answer, pool) {
    function usable(item) { return item !== answer && item.zh !== answer.zh && item.en !== answer.en; }
    function unique(list) {
      var seen = {};
      return list.filter(function (item) {
        if (seen[item.zh]) return false;
        seen[item.zh] = true;
        return true;
      });
    }
    var same = unique(pool.filter(function (item) { return usable(item) && item.phr === answer.phr; }));
    var source = same.length >= 3 ? same : unique(pool.filter(usable));
    return shuffle(source).slice(0, 3);
  }
  function buildQuestions(pool, countValue) {
    var usable = shuffle(pool).filter(function (item) { return distractorsFor(item, pool).length === 3; });
    var count = countValue === 'all' ? usable.length : Math.min(usable.length, Number(countValue) || 20);
    var picked = usable.slice(0, count);
    var positions = shuffle(picked.map(function (_, index) { return index % 4; }));
    return picked.map(function (answer, index) {
      var wrong = distractorsFor(answer, pool);
      var options = [];
      var cursor = 0;
      for (var slot = 0; slot < 4; slot++) {
        options[slot] = slot === positions[index] ? { zh: answer.zh, ok: true } : { zh: wrong[cursor++].zh, ok: false };
      }
      return { en: answer.en, zh: answer.zh, options: options, answer: 'ABCD'[positions[index]] };
    });
  }
  function runQuiz(stage, title, questions, again) {
    var cursor = 0;
    var answers = [];
    function paintResult() {
      var correct = questions.filter(function (question, index) { return answers[index] === question.answer; }).length;
      stage.replaceChildren();
      var heading = document.createElement('h3');
      heading.textContent = title + '　成績';
      var summary = document.createElement('p');
      summary.textContent = '答對 ' + correct + ' / ' + questions.length;
      stage.append(heading, summary);
      var wrong = questions.filter(function (question, index) { return answers[index] !== question.answer; });
      if (!wrong.length) {
        var all = document.createElement('p');
        all.textContent = '全部答對。';
        stage.appendChild(all);
      } else {
        var table = document.createElement('table');
        table.className = 'kmzWrongTable';
        wrong.forEach(function (question) {
          var row = document.createElement('tr');
          row.innerHTML = '<th scope="row"></th><td></td>';
          row.querySelector('th').textContent = question.en;
          row.querySelector('td').textContent = question.zh;
          table.appendChild(row);
        });
        stage.appendChild(table);
      }
      var retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = '再測一次';
      retry.addEventListener('click', again);
      stage.appendChild(retry);
    }
    function paint() {
      if (cursor >= questions.length) return paintResult();
      var question = questions[cursor];
      stage.replaceChildren();
      var progress = document.createElement('p');
      progress.textContent = title + '　' + (cursor + 1) + ' / ' + questions.length;
      var prompt = document.createElement('p');
      prompt.className = 'kmzE3Prompt';
      prompt.textContent = question.en;
      stage.append(progress, prompt);
      question.options.forEach(function (option, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'kmzE3Choice';
        button.textContent = 'ABCD'[index] + '. ' + option.zh;
        button.addEventListener('click', function () {
          if (answers.length > cursor) return;
          answers[cursor] = 'ABCD'[index];
          Array.from(stage.querySelectorAll('.kmzE3Choice')).forEach(function (choice, choiceIndex) {
            choice.disabled = true;
            if (question.options[choiceIndex].ok) choice.classList.add('isCorrect');
            else if (choiceIndex === index) choice.classList.add('isWrong');
          });
          var next = document.createElement('button');
          next.type = 'button';
          next.textContent = cursor + 1 === questions.length ? '看成績' : '下一題';
          next.addEventListener('click', function () { cursor += 1; paint(); });
          stage.appendChild(next);
        });
        stage.appendChild(button);
      });
    }
    paint();
  }
  function setupExam3(root) {
    root.innerHTML = '<h3>第三次段考</h3><div class="kmzE3Bar"><label>類別<select id="kmz-e3-group" aria-label="第三次段考類別"><option value="">請選擇</option></select></label><label>範圍<select id="kmz-e3-set" aria-label="第三次段考範圍" disabled><option value="">請先選類別</option></select></label><label>題數<select id="kmz-e3-count" aria-label="題數"><option>10</option><option selected>20</option><option>30</option><option>50</option><option value="all">全部</option></select></label><button type="button" id="kmz-e3-start" disabled>開始英選中</button></div><p class="kmzE3Note">英選中四選一。正確答案和另外三個選項都來自你選的這一回。</p><div id="kmz-e3-stage"></div>';
    var groupSel = root.querySelector('#kmz-e3-group');
    var setSel = root.querySelector('#kmz-e3-set');
    var countSel = root.querySelector('#kmz-e3-count');
    var stage = root.querySelector('#kmz-e3-stage');
    var startBtn = root.querySelector('#kmz-e3-start');
    var data = null;
    fetch(exam3Url()).then(function (response) { return response.json(); }).then(function (json) {
      data = json;
      json.groups.forEach(function (group, index) {
        var opt = document.createElement('option');
        opt.value = String(index);
        opt.textContent = group.label;
        groupSel.appendChild(opt);
      });
      startBtn.disabled = false;
    }).catch(function () {
      stage.textContent = '第三次段考題庫載入失敗。';
    });
    groupSel.addEventListener('change', function () {
      stage.replaceChildren();
      setSel.replaceChildren();
      var group = data && data.groups[Number(groupSel.value)];
      var placeholder = document.createElement('option');
      placeholder.value = '';
      if (!group) {
        setSel.disabled = true;
        placeholder.textContent = '請先選類別';
        setSel.appendChild(placeholder);
        return;
      }
      setSel.disabled = false;
      placeholder.textContent = '請選擇範圍';
      setSel.appendChild(placeholder);
      group.sets.forEach(function (set, index) {
        var opt = document.createElement('option');
        opt.value = String(index);
        opt.textContent = set.label + '（' + set.items.length + ' 項）';
        setSel.appendChild(opt);
      });
    });
    function begin() {
      var group = data && data.groups[Number(groupSel.value)];
      var set = group && group.sets[Number(setSel.value)];
      if (!set) { stage.textContent = '請先選擇類別和範圍。'; return; }
      if (!window.__KMZ_GLOSS) { stage.textContent = '字庫還在載入，請再按一次。'; return; }
      var pool = resolvePool(set.items);
      if (pool.length < 4) { stage.textContent = '這一回可用的項目不足 4 個。'; return; }
      var questions = buildQuestions(pool, countSel.value);
      if (!questions.length) { stage.textContent = '這一回無法組成題目。'; return; }
      runQuiz(stage, set.label, questions, begin);
    }
    startBtn.addEventListener('click', begin);
  }
  function mount() {
    if (!window.__KMZ_RETAKE_READY) return;
    var vocabulary = document.getElementById('vocabulary');
    if (!vocabulary || document.getElementById('retake-zone')) return;
    var panel = document.createElement('article');
    panel.id = 'retake-zone';
    panel.className = 'entryPanel indexPanel';
    panel.innerHTML = '<div class="entryHeader"><div class="inlineTitle"><h2>115-1補充教材</h2></div></div><div class="kmzExamSplit"><section id="kmz-exam2" class="kmzExamCell"><h3>第二次段考</h3><div class="customHomeGrid" aria-label="第二次段考"></div><div class="retakeContents" hidden></div></section><section id="kmz-exam3" class="kmzExamCell"><h3>第三次段考</h3></section></div>';
    var exam3 = panel.querySelector('#kmz-exam3');
    var grid = panel.querySelector('.customHomeGrid');
    var contents = panel.querySelector('.retakeContents');
    ['4U', '解析', '補充文章', '補考專區'].forEach(function (name) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'customHomeFolderButton';
      button.textContent = '📁 ' + name;
      if (name !== '補考專區') button.setAttribute('aria-expanded', 'false');
      actions.set(button, function () {
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
          function addUnits(parent, units, roundNumber) {
            var folders = document.createElement('div');
            folders.className = 'customHomeGrid';
            units.forEach(function (unit) {
              var child = document.createElement('button');
              child.type = 'button';
              child.textContent = '📁 ' + unit.title + '（' + unit.count + ' 項）';
              actions.set(child, function () {
                window.dispatchEvent(new CustomEvent('kmz-open-retake', {detail:{unitId:unit.id,roundNumber:roundNumber}}));
              });
              folders.appendChild(child);
            });
            parent.appendChild(folders);
          }
          if (name === '解析') {
            addUnits(contents, [
              {id:'W1',title:'解析10月W1',count:78},{id:'W2',title:'解析10月W2',count:65},
              {id:'W3',title:'解析10月W3',count:78},{id:'W4',title:'解析10月W4',count:67}
            ], 1001);
          } else if (name === '補充文章') {
            var groups = document.createElement('div');
            groups.className = 'customHomeGrid';
            groups.setAttribute('aria-label', '補充文章年級與段考');
            var articleContents = document.createElement('div');
            articleContents.className = 'retakeContents';
            articleContents.hidden = true;
            ['高二2段', '高一2段'].forEach(function (groupName) {
              var groupButton = document.createElement('button');
              groupButton.type = 'button';
              groupButton.textContent = '📁 ' + groupName;
              groupButton.setAttribute('aria-expanded', 'false');
              actions.set(groupButton, function () {
                var expanded = groupButton.getAttribute('aria-expanded') !== 'true';
                groups.querySelectorAll('button').forEach(function (item) { item.setAttribute('aria-expanded', 'false'); });
                groupButton.setAttribute('aria-expanded', String(expanded));
                selectedArticleGroup = expanded ? groupName : null;
                articleContents.hidden = !expanded;
                articleContents.replaceChildren();
                if (!expanded) return;
                var heading = document.createElement('h3');
                heading.textContent = groupName;
                articleContents.appendChild(heading);
                if (groupName === '高二2段') {
                  addUnits(articleContents, window.__KMZ_GENERAL_UNITS, 1002);
                } else {
                  addUnits(articleContents, window.__KMZ_GRADE1_UNITS, 1003);
                }
              });
              groups.appendChild(groupButton);
            });
            contents.append(groups, articleContents);
            if (selectedArticleGroup) {
              var restoreGroup = Array.from(groups.children).find(function (item) { return item.textContent === '📁 ' + selectedArticleGroup; });
              if (restoreGroup) restoreGroup.click();
            }
          } else { contents.appendChild(empty); }
        }
      });
      grid.appendChild(button);
    });
    setupExam3(exam3);
    vocabulary.insertAdjacentElement('afterend', panel);
    if (selectedFolder) {
      var restore = Array.from(grid.children).find(function (button) { return button.textContent === '📁 ' + selectedFolder; });
      if (restore) restore.click();
    }
  }
  var style = document.createElement('style');
  style.textContent = '#retake-zone{grid-column:1/-1}#retake-zone .customHomeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}#retake-zone button{font:inherit;cursor:pointer;min-height:64px;border-radius:12px;padding:14px;border:1px solid #d99f45;background:#fff5dc;color:#533b20;font-weight:700}#retake-zone button[aria-expanded=true]{background:#ffe2a0;outline:2px solid #b77820}#retake-zone .retakeContents{grid-column:1/-1;margin-top:16px;padding:16px;border:1px solid #d99f45;border-radius:12px}#retake-zone h3{margin:0 0 8px}#retake-zone p{margin:0}@media(max-width:760px){#retake-zone .customHomeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){#retake-zone .customHomeGrid{grid-template-columns:1fr}}';
  style.textContent += '.kmzRetakeDirections{display:flex;gap:12px;margin-top:16px}.kmzRetakeDirections button{flex:1;background:#f7d88c!important}.kmzRetakeChoice{display:flex!important;flex-direction:column;align-items:stretch;gap:8px;max-width:760px;width:100%;margin:auto;box-sizing:border-box}.kmzRetakeChoice h2{margin:8px 0}.kmzRetakeChoice>button:first-child{align-self:flex-start}.kmzRetakeChoice fieldset{border:1px solid #d99f45;border-radius:12px;padding:12px;margin:8px 0}.kmzRetakeRange{display:flex;gap:12px;align-items:center;padding:8px;border-bottom:1px solid #7774}.kmzRetakeRange input{width:20px;height:20px}.kmzRetakeCount{display:flex;align-items:center;gap:12px;margin:8px 0}.kmzRetakeChoice select,.kmzRetakeChoice input[type=number]{font:inherit;padding:10px;max-width:170px;border-radius:8px}.kmzRetakeChoice button{font:inherit;padding:10px 16px;margin:4px;border-radius:8px;cursor:pointer}.kmzRetakeChoice button:disabled{opacity:.45;cursor:not-allowed}';
  style.textContent += '.kmzRetakeRounds{border:1px solid #7776;border-radius:10px;padding:12px;margin:12px 0}.kmzRetakeRounds summary{cursor:pointer;font-weight:700;padding:6px 0}.kmzRetakeRounds label{line-height:1.5}';style.textContent += '.kmzRetakeResults{display:block!important;width:100%;box-sizing:border-box}.kmzRetakeResults h2{margin:0 0 12px}.kmzResultStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}.kmzResultStat{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;border:1px solid #d99f45;border-radius:12px}.kmzResultStat strong{font-size:28px}.kmzWrongTableWrap{overflow-x:auto;margin:12px 0}.kmzWrongTable{width:100%;border-collapse:collapse;text-align:left}.kmzWrongTable th,.kmzWrongTable td{padding:12px;border-bottom:1px solid #7776;overflow-wrap:anywhere}.kmzWrongTable thead th{color:#f7d88c}.kmzResultActions{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}.kmzResultActions button{font:inherit;padding:12px 18px;border-radius:8px;cursor:pointer}.kmzAllCorrect{color:#80d6a3;font-weight:700}@media(max-width:600px){.kmzResultStats{grid-template-columns:repeat(2,minmax(0,1fr))}.kmzWrongTable th,.kmzWrongTable td{padding:10px 6px}.kmzWrongTable{font-size:14px}}';style.textContent += '.kmzUnitScopeGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0 8px}.kmzUnitScopeGroup{min-width:0}.kmzUnitScopeGrid .kmzRetakeRange{align-items:flex-start;gap:6px;min-width:0;font-size:13px;padding:8px 0}.kmzUnitScopeGrid .kmzRetakeRange input{flex:0 0 18px;width:18px;height:18px}.kmzUnitScopeGrid .kmzRetakeRange>span{min-width:0;white-space:nowrap}.kmzUnitScopeGrid small{display:block;font-size:11px;opacity:.75;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:600px){.kmzUnitScopeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:380px){.kmzUnitScopeGrid{grid-template-columns:1fr}}';style.textContent += '#retake-zone .entryHeader,#retake-zone .kmzExamSplit{grid-column:1/-1;width:100%}#retake-zone .kmzExamSplit{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start}#retake-zone .kmzExamCell{min-width:0}#retake-zone .kmzExamCell>h3{margin:0 0 14px;font-size:24px}#kmz-exam2 .customHomeGrid{grid-template-columns:1fr 1fr}#retake-zone select{width:100%;box-sizing:border-box;font:inherit;font-weight:800;font-size:18px;min-height:64px;border-radius:12px;border:1px solid #d99f45;background:#fff;color:#533b20;padding:8px 14px}#kmz-exam3 .kmzE3Bar{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:end;width:100%}#kmz-exam3 label{display:flex;flex-direction:column;gap:8px;min-width:0;font-size:18px;font-weight:800}#kmz-exam3 .kmzE3Note{grid-column:1/-1;margin:0;font-size:16px}#kmz-e3-stage{grid-column:1/-1;display:flex;flex-direction:column;gap:12px;width:100%}#kmz-e3-stage button{width:100%;text-align:left;font-size:18px}#kmz-exam3 .kmzE3Bar button{width:100%;min-height:64px;padding:0 16px;font-size:20px;text-align:center}#kmz-exam3 .kmzE3Prompt{font-size:32px;font-weight:800;margin:8px 0}@media(max-width:800px){#retake-zone .kmzExamSplit{grid-template-columns:1fr}}#kmz-exam3 .kmzE3Choice.isCorrect{background:#d9f5e3!important}#kmz-exam3 .kmzE3Choice.isWrong{background:#ffd6d6!important}#kmz-e3-start:disabled{opacity:.45;cursor:not-allowed}';document.head.appendChild(style);
  new MutationObserver(mount).observe(document.body, {childList:true, subtree:true});
  window.addEventListener('kmz-retake-ready', mount);
  mount();
})();
