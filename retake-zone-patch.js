(function () {
  var WRONG_KEY = 'kmz-exam3-wrongs-v1';
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
  function describeItem(item) {
    var gloss = window.__KMZ_GLOSS || {};
    if (typeof item === 'string') {
      var entry = gloss[item];
      if (!entry || !entry.meanings || !entry.meanings.length) return null;
      var word = entry.word || item;
      return { en: word, zh: entry.meanings.join('；'), pos: entry.pos || '', phr: /phr/i.test(entry.pos || '') || /\s/.test(word) };
    }
    if (!item || !item.w || !item.z) return null;
    var known = gloss[String(item.w).toLowerCase()];
    return {
      en: item.w,
      zh: item.z,
      pos: item.phr ? '片語' : ((known && known.pos) || ''),
      phr: !!item.phr
    };
  }
  function resolvePool(items) {
    var pool = [];
    items.forEach(function (item) {
      var described = describeItem(item);
      if (described) pool.push(described);
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
        var source = slot === positions[index] ? answer : wrong[cursor++];
        options[slot] = { zh: source.zh, en: source.en, ok: source === answer };
      }
      return { en: answer.en, zh: answer.zh, pos: answer.pos, phr: !!answer.phr, options: options, answer: 'ABCD'[positions[index]] };
    });
  }
  function loadWrongs() {
    try {
      var list = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (error) { return []; }
  }
  function saveWrongs(list) {
    localStorage.setItem(WRONG_KEY, JSON.stringify(list));
  }
  function wrongKey(item) { return item.en + '\n' + item.zh; }
  function recordWrongs(setLabel, questions) {
    var map = {};
    loadWrongs().forEach(function (item) { map[wrongKey(item)] = item; });
    questions.forEach(function (question) {
      var key = wrongKey(question);
      var prev = map[key];
      map[key] = {
        en: question.en,
        zh: question.zh,
        pos: question.pos || (prev && prev.pos) || '',
        phr: !!question.phr,
        set: setLabel,
        misses: (prev ? prev.misses : 0) + 1,
        at: Date.now()
      };
    });
    var next = Object.keys(map).map(function (key) { return map[key]; });
    next.sort(function (a, b) { return b.at - a.at; });
    saveWrongs(next);
    return next;
  }
  function closeWindow() {
    var win = document.getElementById('kmz-e3-window');
    if (win) win.remove();
    document.body.classList.remove('kmzE3Lock');
    document.removeEventListener('keydown', onWindowKey);
    var zone = document.getElementById('retake-zone');
    if (zone) zone.scrollIntoView({ block: 'start' });
    var wrongBtn = document.getElementById('kmz-e3-wrongs');
    if (wrongBtn) wrongBtn.textContent = '錯題本（' + loadWrongs().length + '）';
  }
  function onWindowKey(event) {
    if (event.key === 'Escape') closeWindow();
  }
  function openWindow(title, render) {
    closeWindow();
    document.body.classList.add('kmzE3Lock');
    document.addEventListener('keydown', onWindowKey);
    var win = document.createElement('div');
    win.id = 'kmz-e3-window';
    win.className = 'kmzE3Window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    var inner = document.createElement('div');
    inner.className = 'kmzE3WindowInner';
    var bar = document.createElement('div');
    bar.className = 'kmzE3WindowBar';
    var home = document.createElement('button');
    home.type = 'button';
    home.className = 'kmzE3Home';
    home.textContent = '回主頁';
    home.addEventListener('click', closeWindow);
    var heading = document.createElement('h2');
    heading.textContent = title;
    bar.append(home, heading);
    var body = document.createElement('div');
    body.className = 'kmzE3WindowBody';
    inner.append(bar, body);
    win.appendChild(inner);
    document.body.appendChild(win);
    render({ body: body, bar: bar, heading: heading });
    home.focus();
  }
  function countValue() {
    var countSel = document.getElementById('kmz-e3-count');
    return countSel ? countSel.value : '20';
  }
  function fillChoice(button, letter, option, revealed) {
    button.replaceChildren();
    var main = document.createElement('span');
    main.textContent = letter + '. ' + option.zh;
    button.appendChild(main);
    if (!revealed) return;
    button.appendChild(document.createTextNode('　'));
    var en = document.createElement('span');
    en.className = 'kmzE3OptEn';
    en.textContent = option.en;
    button.appendChild(en);
  }
  function showWords(title, pool) {
    openWindow(title + '　單字', function (view) {
      var quizBtn = document.createElement('button');
      quizBtn.type = 'button';
      quizBtn.textContent = '英選中';
      quizBtn.addEventListener('click', function () { startQuiz(title, pool); });
      view.bar.appendChild(quizBtn);
      var filter = document.createElement('input');
      filter.className = 'kmzE3Filter';
      filter.type = 'search';
      filter.placeholder = '搜尋英文或中文';
      var count = document.createElement('p');
      var list = document.createElement('div');
      function paint() {
        var query = filter.value.trim().toLowerCase();
        var shown = pool.filter(function (item) {
          if (!query) return true;
          return (item.en + ' ' + item.zh + ' ' + item.pos).toLowerCase().indexOf(query) !== -1;
        });
        count.textContent = '共 ' + shown.length + ' / ' + pool.length + ' 項';
        list.replaceChildren();
        shown.forEach(function (item) {
          var row = document.createElement('div');
          row.className = 'kmzE3Word';
          var en = document.createElement('b');
          en.textContent = item.en;
          var pos = document.createElement('span');
          pos.className = 'pos';
          pos.textContent = item.pos || (item.phr ? '片語' : '');
          var zh = document.createElement('span');
          zh.textContent = item.zh;
          row.append(en, pos, zh);
          list.appendChild(row);
        });
      }
      filter.addEventListener('input', paint);
      view.body.append(filter, count, list);
      paint();
    });
  }
  function startQuiz(title, pool) {
    if (pool.length < 4) {
      openWindow(title, function (view) {
        var note = document.createElement('p');
        note.textContent = '這一回可用的項目不足 4 個，沒辦法組成四選一。';
        view.body.appendChild(note);
      });
      return;
    }
    var questions = buildQuestions(pool, countValue());
    if (!questions.length) {
      openWindow(title, function (view) {
        var note = document.createElement('p');
        note.textContent = '這一回無法組成題目。';
        view.body.appendChild(note);
      });
      return;
    }
    var cursor = 0;
    var answers = [];
    function paintResult(view) {
      var correct = questions.filter(function (question, index) { return answers[index] === question.answer; }).length;
      var wrong = questions.filter(function (question, index) { return answers[index] !== question.answer; });
      view.heading.textContent = title + '　成績';
      view.body.replaceChildren();
      var summary = document.createElement('p');
      summary.className = 'kmzE3Score';
      summary.textContent = '答對 ' + correct + ' / ' + questions.length;
      view.body.appendChild(summary);
      var saved = document.createElement('p');
      if (!wrong.length) {
        saved.textContent = '全部答對。';
      } else {
        try {
          recordWrongs(title, wrong);
          saved.textContent = '這次答錯的 ' + wrong.length + ' 題已記到錯題本。';
        } catch (error) {
          saved.textContent = '這次答錯 ' + wrong.length + ' 題。這台瀏覽器沒有把錯題存下來。';
        }
        var table = document.createElement('table');
        table.className = 'kmzWrongTable';
        wrong.forEach(function (question) {
          var row = document.createElement('tr');
          var head = document.createElement('th');
          head.scope = 'row';
          head.textContent = question.en;
          var cell = document.createElement('td');
          cell.textContent = question.zh;
          row.append(head, cell);
          table.appendChild(row);
        });
        view.body.appendChild(table);
      }
      view.body.appendChild(saved);
      var actions = document.createElement('div');
      actions.className = 'kmzE3WindowActions';
      var again = document.createElement('button');
      again.type = 'button';
      again.textContent = '再測一次';
      again.addEventListener('click', function () { startQuiz(title, pool); });
      var book = document.createElement('button');
      book.type = 'button';
      book.textContent = '打開錯題本';
      book.addEventListener('click', showWrongBook);
      var words = document.createElement('button');
      words.type = 'button';
      words.textContent = '看這一回的單字';
      words.addEventListener('click', function () { showWords(title, pool); });
      actions.append(again, book, words);
      view.body.appendChild(actions);
    }
    function paint(view) {
      if (cursor >= questions.length) return paintResult(view);
      var question = questions[cursor];
      view.heading.textContent = title + '　英選中';
      view.body.replaceChildren();
      var progress = document.createElement('p');
      progress.textContent = (cursor + 1) + ' / ' + questions.length;
      var prompt = document.createElement('p');
      prompt.className = 'kmzE3Prompt';
      prompt.textContent = question.en;
      view.body.append(progress, prompt);
      question.options.forEach(function (option, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'kmzE3Choice';
        fillChoice(button, 'ABCD'[index], option, false);
        button.addEventListener('click', function () {
          if (answers.length > cursor) return;
          answers[cursor] = 'ABCD'[index];
          Array.from(view.body.querySelectorAll('.kmzE3Choice')).forEach(function (choice, choiceIndex) {
            choice.disabled = true;
            fillChoice(choice, 'ABCD'[choiceIndex], question.options[choiceIndex], true);
            if (question.options[choiceIndex].ok) choice.classList.add('isCorrect');
            else if (choiceIndex === index) choice.classList.add('isWrong');
          });
          var next = document.createElement('button');
          next.type = 'button';
          next.textContent = cursor + 1 === questions.length ? '看成績' : '下一題';
          next.addEventListener('click', function () { cursor += 1; paint(view); });
          view.body.appendChild(next);
        });
        view.body.appendChild(button);
      });
    }
    openWindow(title + '　英選中', paint);
  }
  function showWrongBook() {
    openWindow('錯題本', function (view) {
      function paint() {
        var items = loadWrongs();
        view.body.replaceChildren();
        var count = document.createElement('p');
        count.textContent = items.length ? '目前記下 ' + items.length + ' 題。' : '還沒有記下的錯題。考完英選中後，答錯的題會出現在這裡。';
        view.body.appendChild(count);
        if (items.length >= 4) {
          var quiz = document.createElement('button');
          quiz.type = 'button';
          quiz.textContent = '用錯題本考英選中';
          quiz.addEventListener('click', function () { startQuiz('錯題本', items); });
          view.body.appendChild(quiz);
        } else if (items.length) {
          var need = document.createElement('p');
          need.textContent = '錯題要湊滿 4 個不同的意思，才能組成四選一。';
          view.body.appendChild(need);
        }
        items.forEach(function (item) {
          var row = document.createElement('div');
          row.className = 'kmzE3WrongRow';
          var en = document.createElement('b');
          en.textContent = item.en;
          var zh = document.createElement('span');
          zh.textContent = item.zh;
          var meta = document.createElement('small');
          meta.textContent = (item.set || '') + '　錯 ' + (item.misses || 1) + ' 次';
          var remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'kmzE3Remove';
          remove.textContent = '移出';
          remove.addEventListener('click', function () {
            saveWrongs(loadWrongs().filter(function (saved) { return wrongKey(saved) !== wrongKey(item); }));
            paint();
          });
          row.append(en, zh, meta, remove);
          view.body.appendChild(row);
        });
        if (items.length) {
          var clear = document.createElement('button');
          clear.type = 'button';
          clear.className = 'kmzE3Remove';
          clear.textContent = '清空錯題本';
          clear.addEventListener('click', function () {
            if (!window.confirm('要把錯題本全部清掉嗎？')) return;
            saveWrongs([]);
            paint();
          });
          view.body.appendChild(clear);
        }
      }
      paint();
    });
  }
  function setupExam3(root) {
    root.innerHTML = '<h3>第三次段考</h3><div class="kmzE3Bar"><label>類別<select id="kmz-e3-group" aria-label="第三次段考類別"><option value="">請選擇</option></select></label><label>範圍<select id="kmz-e3-set" aria-label="第三次段考範圍" disabled><option value="">請先選類別</option></select></label><label>題數<select id="kmz-e3-count" aria-label="題數"><option>10</option><option selected>20</option><option>30</option><option>50</option><option value="all">全部</option></select></label></div><div class="kmzE3Actions"><button type="button" id="kmz-e3-list" disabled>看這一回的單字</button><button type="button" id="kmz-e3-start" disabled>開始英選中</button><button type="button" id="kmz-e3-wrongs">錯題本（0）</button></div><p class="kmzE3Note">每一回可以看全部單字自己背，也可以英選中。兩個都會另開視窗，視窗裡可以回主頁。選完答案後，每個選項後面會標出那個意思的英文。答錯的題會記到錯題本。</p><p id="kmz-e3-msg"></p>';
    var groupSel = root.querySelector('#kmz-e3-group');
    var setSel = root.querySelector('#kmz-e3-set');
    var listBtn = root.querySelector('#kmz-e3-list');
    var startBtn = root.querySelector('#kmz-e3-start');
    var wrongBtn = root.querySelector('#kmz-e3-wrongs');
    var msg = root.querySelector('#kmz-e3-msg');
    var data = null;
    wrongBtn.textContent = '錯題本（' + loadWrongs().length + '）';
    function selectedSet() {
      if (groupSel.value === '' || setSel.value === '') return null;
      var group = data && data.groups[Number(groupSel.value)];
      return group && group.sets[Number(setSel.value)];
    }
    function syncButtons() {
      var ready = !!selectedSet();
      listBtn.disabled = !ready;
      startBtn.disabled = !ready;
      wrongBtn.textContent = '錯題本（' + loadWrongs().length + '）';
    }
    function prepare(kind) {
      var set = selectedSet();
      msg.textContent = '';
      if (!set) { msg.textContent = '請先選擇類別和範圍。'; return null; }
      if (!window.__KMZ_GLOSS) { msg.textContent = '字庫還在載入，請再按一次。'; return null; }
      var pool = resolvePool(set.items);
      if (!pool.length) { msg.textContent = '這一回還沒有可用的單字。'; return null; }
      if (kind === 'quiz' && pool.length < 4) { msg.textContent = '這一回可用的項目不足 4 個。'; return null; }
      return { title: set.label, pool: pool };
    }
    fetch(exam3Url()).then(function (response) { return response.json(); }).then(function (json) {
      data = json;
      json.groups.forEach(function (group, index) {
        var opt = document.createElement('option');
        opt.value = String(index);
        opt.textContent = group.label;
        groupSel.appendChild(opt);
      });
    }).catch(function () {
      msg.textContent = '第三次段考題庫載入失敗。';
    });
    groupSel.addEventListener('change', function () {
      msg.textContent = '';
      setSel.replaceChildren();
      var group = data && data.groups[Number(groupSel.value)];
      var placeholder = document.createElement('option');
      placeholder.value = '';
      if (!group) {
        setSel.disabled = true;
        placeholder.textContent = '請先選類別';
        setSel.appendChild(placeholder);
        syncButtons();
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
      syncButtons();
    });
    setSel.addEventListener('change', function () { msg.textContent = ''; syncButtons(); });
    listBtn.addEventListener('click', function () {
      var ready = prepare('list');
      if (ready) showWords(ready.title, ready.pool);
    });
    startBtn.addEventListener('click', function () {
      var ready = prepare('quiz');
      if (ready) startQuiz(ready.title, ready.pool);
    });
    wrongBtn.addEventListener('click', showWrongBook);
  }
  function mount() {
    if (!window.__KMZ_RETAKE_READY) return;
    var vocabulary = document.getElementById('vocabulary');
    if (!vocabulary || document.getElementById('retake-zone')) return;
    var panel = document.createElement('article');
    panel.id = 'retake-zone';
    panel.className = 'entryPanel indexPanel';
    panel.innerHTML = '<div class="entryHeader"><div class="inlineTitle"><h2>115-1補充教材</h2></div></div><section id="kmz-exam3"></section>';
    setupExam3(panel.querySelector('#kmz-exam3'));
    vocabulary.insertAdjacentElement('afterend', panel);
  }
  var style = document.createElement('style');
  style.textContent = '#retake-zone{grid-column:1/-1}#retake-zone .customHomeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}#retake-zone button{font:inherit;cursor:pointer;min-height:64px;border-radius:12px;padding:14px;border:1px solid #d99f45;background:#fff5dc;color:#533b20;font-weight:700}#retake-zone button[aria-expanded=true]{background:#ffe2a0;outline:2px solid #b77820}#retake-zone .retakeContents{grid-column:1/-1;margin-top:16px;padding:16px;border:1px solid #d99f45;border-radius:12px}#retake-zone h3{margin:0 0 8px}#retake-zone p{margin:0}@media(max-width:760px){#retake-zone .customHomeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){#retake-zone .customHomeGrid{grid-template-columns:1fr}}';
  style.textContent += '.kmzRetakeDirections{display:flex;gap:12px;margin-top:16px}.kmzRetakeDirections button{flex:1;background:#f7d88c!important}.kmzRetakeChoice{display:flex!important;flex-direction:column;align-items:stretch;gap:8px;max-width:760px;width:100%;margin:auto;box-sizing:border-box}.kmzRetakeChoice h2{margin:8px 0}.kmzRetakeChoice>button:first-child{align-self:flex-start}.kmzRetakeChoice fieldset{border:1px solid #d99f45;border-radius:12px;padding:12px;margin:8px 0}.kmzRetakeRange{display:flex;gap:12px;align-items:center;padding:8px;border-bottom:1px solid #7774}.kmzRetakeRange input{width:20px;height:20px}.kmzRetakeCount{display:flex;align-items:center;gap:12px;margin:8px 0}.kmzRetakeChoice select,.kmzRetakeChoice input[type=number]{font:inherit;padding:10px;max-width:170px;border-radius:8px}.kmzRetakeChoice button{font:inherit;padding:10px 16px;margin:4px;border-radius:8px;cursor:pointer}.kmzRetakeChoice button:disabled{opacity:.45;cursor:not-allowed}';
  style.textContent += '.kmzRetakeRounds{border:1px solid #7776;border-radius:10px;padding:12px;margin:12px 0}.kmzRetakeRounds summary{cursor:pointer;font-weight:700;padding:6px 0}.kmzRetakeRounds label{line-height:1.5}';style.textContent += '.kmzRetakeResults{display:block!important;width:100%;box-sizing:border-box}.kmzRetakeResults h2{margin:0 0 12px}.kmzResultStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}.kmzResultStat{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;border:1px solid #d99f45;border-radius:12px}.kmzResultStat strong{font-size:28px}.kmzWrongTableWrap{overflow-x:auto;margin:12px 0}.kmzWrongTable{width:100%;border-collapse:collapse;text-align:left}.kmzWrongTable th,.kmzWrongTable td{padding:12px;border-bottom:1px solid #7776;overflow-wrap:anywhere}.kmzWrongTable thead th{color:#f7d88c}.kmzResultActions{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}.kmzResultActions button{font:inherit;padding:12px 18px;border-radius:8px;cursor:pointer}.kmzAllCorrect{color:#80d6a3;font-weight:700}@media(max-width:600px){.kmzResultStats{grid-template-columns:repeat(2,minmax(0,1fr))}.kmzWrongTable th,.kmzWrongTable td{padding:10px 6px}.kmzWrongTable{font-size:14px}}';style.textContent += '.kmzUnitScopeGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0 8px}.kmzUnitScopeGroup{min-width:0}.kmzUnitScopeGrid .kmzRetakeRange{align-items:flex-start;gap:6px;min-width:0;font-size:13px;padding:8px 0}.kmzUnitScopeGrid .kmzRetakeRange input{flex:0 0 18px;width:18px;height:18px}.kmzUnitScopeGrid .kmzRetakeRange>span{min-width:0;white-space:nowrap}.kmzUnitScopeGrid small{display:block;font-size:11px;opacity:.75;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:600px){.kmzUnitScopeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:380px){.kmzUnitScopeGrid{grid-template-columns:1fr}}';style.textContent += '#retake-zone .entryHeader,#retake-zone #kmz-exam3{grid-column:1/-1;width:100%}#kmz-exam3>h3{margin:0 0 14px;font-size:28px}#kmz-exam3 .kmzE3Bar{display:grid;grid-template-columns:1.1fr 1.4fr .7fr;gap:14px;align-items:end;width:100%}#kmz-exam3 .kmzE3Actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:14px}#retake-zone select{width:100%;box-sizing:border-box;font:inherit;font-weight:800;font-size:18px;min-height:64px;border-radius:12px;border:1px solid #d99f45;background:#fff;color:#533b20;padding:8px 14px}#kmz-exam3 label{display:flex;flex-direction:column;gap:8px;min-width:0;font-size:18px;font-weight:800}#kmz-exam3 .kmzE3Note,#kmz-e3-msg{margin:12px 0 0;font-size:16px;line-height:1.6}#kmz-exam3 .kmzE3Actions button{width:100%;min-height:64px;font-size:20px;text-align:center}#kmz-e3-start:disabled,#kmz-e3-list:disabled{opacity:.45;cursor:not-allowed}body.kmzE3Lock{overflow:hidden}.kmzE3Window{position:fixed;inset:0;z-index:1000;background:#0b1220;color:#f3f6ff;overflow:auto;padding:18px 16px 56px}.kmzE3WindowInner{max-width:920px;margin:0 auto}.kmzE3WindowBar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;position:sticky;top:0;background:#0b1220;padding:4px 0 14px;z-index:2}.kmzE3WindowBar h2{margin:0;font-size:28px;flex:1 1 200px}.kmzE3Window button{font:inherit;cursor:pointer;border-radius:12px;border:1px solid #d99f45;background:#fff5dc;color:#533b20;font-weight:700}.kmzE3Home{background:#182234!important;color:#f3f6ff!important;border-color:#7f93b8!important;min-height:52px;padding:10px 18px;font-size:18px}.kmzE3WindowBar>button:not(.kmzE3Home){min-height:52px;padding:10px 18px;font-size:18px}.kmzE3WindowBody{display:flex;flex-direction:column;gap:12px}.kmzE3WindowBody>button,.kmzE3WindowActions button{min-height:56px;padding:12px 16px;font-size:18px}.kmzE3WindowActions{display:flex;flex-wrap:wrap;gap:12px}.kmzE3WindowActions button{flex:1 1 180px}.kmzE3Prompt{font-size:34px;font-weight:800;margin:8px 0}.kmzE3Score{font-size:22px;font-weight:800}.kmzE3Choice{width:100%;text-align:left;font-size:18px;line-height:1.5;min-height:64px;padding:14px 16px}.kmzE3Choice .kmzE3OptEn{font-weight:800}.kmzE3Choice.isCorrect{background:#d9f5e3!important}.kmzE3Choice.isWrong{background:#ffd6d6!important}.kmzE3Choice:disabled{cursor:default}.kmzE3Filter{width:100%;box-sizing:border-box;font:inherit;font-size:18px;min-height:52px;border-radius:12px;border:1px solid #d99f45;background:#fff;color:#533b20;padding:8px 14px}.kmzE3Word{display:grid;grid-template-columns:minmax(180px,1.3fr) 88px minmax(0,2fr);gap:8px 14px;padding:12px 2px;border-bottom:1px solid #445578;align-items:baseline}.kmzE3Word b{font-size:20px;overflow-wrap:anywhere}.kmzE3Word .pos{color:#ffb6c8}.kmzWrongTable{width:100%;border-collapse:collapse}.kmzWrongTable th,.kmzWrongTable td{padding:12px 8px;border-bottom:1px solid #445578;text-align:left;vertical-align:top;overflow-wrap:anywhere}.kmzE3Window .kmzWrongTable th{color:#ffb6c8;font-size:18px}.kmzE3WrongRow{display:grid;grid-template-columns:minmax(140px,1fr) minmax(0,2fr) auto auto;gap:10px 14px;align-items:center;padding:12px 0;border-bottom:1px solid #445578}.kmzE3WrongRow b{font-size:18px;overflow-wrap:anywhere}.kmzE3WrongRow small{color:#b0bdd6}.kmzE3Remove{min-height:44px!important;padding:8px 12px!important;background:#182234!important;color:#f3f6ff!important;border-color:#7f93b8!important}@media(max-width:800px){#kmz-exam3 .kmzE3Bar,#kmz-exam3 .kmzE3Actions{grid-template-columns:1fr}.kmzE3Word,.kmzE3WrongRow{grid-template-columns:1fr}}';document.head.appendChild(style);
  new MutationObserver(mount).observe(document.body, {childList:true, subtree:true});
  window.addEventListener('kmz-retake-ready', mount);
  mount();
})();
