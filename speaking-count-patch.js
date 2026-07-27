(function () {
  var STYLE_ID = "kmz-speaking-count-style";
  var OVERLAY_CLASS = "kmzSpeakingCountOverlay";
  var COUNTS = [10, 20, 35, 70];
  var allowNextSpeakingClick = false;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      "." + OVERLAY_CLASS + "{" +
      "position:fixed;inset:0;z-index:10000;display:grid;place-items:center;" +
      "background:rgba(8,16,32,.58);padding:16px;}" +
      ".kmzSpeakingCountDialog{" +
      "width:min(420px,calc(100vw - 32px));display:grid;gap:14px;padding:20px;" +
      "border-radius:16px;border:1px solid #7dd3fc;background:#132033;color:#f4f7ff;}" +
      ".kmzSpeakingCountDialog .eyebrow{margin:0;color:#7dd3fc;font-size:12px;font-weight:800;letter-spacing:.04em;}" +
      ".kmzSpeakingCountDialog h3{margin:4px 0 0;font-size:20px;}" +
      ".kmzSpeakingCountDialog p{margin:0;opacity:.85;line-height:1.5;}" +
      ".kmzSpeakingCountOptions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}" +
      ".kmzSpeakingCountOptions button{" +
      "min-height:48px;border-radius:12px;border:1px solid rgba(125,211,252,.45);" +
      "background:#0f1a2c;color:#f4f7ff;font:inherit;font-weight:900;cursor:pointer;}" +
      ".kmzSpeakingCountOptions button:hover," +
      ".kmzSpeakingCountOptions button:focus-visible{border-color:#7dd3fc;background:#173049;}" +
      ".kmzSpeakingCountOptions button:disabled{opacity:.4;cursor:not-allowed;}" +
      ".kmzSpeakingCountCancel{" +
      "min-height:40px;border-radius:10px;border:1px solid rgba(255,255,255,.25);" +
      "background:transparent;color:#f4f7ff;font:inherit;font-weight:800;cursor:pointer;justify-self:end;}";
    document.head.appendChild(style);
  }

  function closeDialog() {
    var overlay = document.querySelector("." + OVERLAY_CLASS);
    if (overlay) overlay.remove();
  }

  function openDialog(button) {
    ensureStyle();
    closeDialog();

    var header = button.closest(".unitPracticeHeader");
    var totalText = header && header.querySelector(".unitPracticeTitle span");
    var total = 70;
    if (totalText) {
      var matched = totalText.textContent.match(/(\d+)/);
      if (matched) total = parseInt(matched[1], 10) || 70;
    }

    var options = COUNTS.filter(function (count) {
      return count <= total;
    });
    if (!options.length && total > 0) options = [total];

    var overlay = document.createElement("div");
    overlay.className = OVERLAY_CLASS;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "選擇發音題數");
    overlay.innerHTML =
      '<div class="kmzSpeakingCountDialog">' +
      '<div><p class="eyebrow">發音練習</p><h3>這次要念幾個字？</h3>' +
      "<p>從本課 " + total + " 字中隨機抽出題數。</p></div>" +
      '<div class="kmzSpeakingCountOptions"></div>' +
      '<button type="button" class="kmzSpeakingCountCancel">取消</button>' +
      "</div>";

    var optionsWrap = overlay.querySelector(".kmzSpeakingCountOptions");
    options.forEach(function (count) {
      var opt = document.createElement("button");
      opt.type = "button";
      opt.textContent = count + " 字";
      opt.addEventListener("click", function () {
        window.__KMZ_SPEAKING_COUNT = count;
        window.__KMZ_SPEAKING_FRESH = Date.now();
        allowNextSpeakingClick = true;
        closeDialog();
        window.setTimeout(function () {
          button.click();
        }, 0);
      });
      optionsWrap.appendChild(opt);
    });

    overlay.querySelector(".kmzSpeakingCountCancel").addEventListener("click", closeDialog);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeDialog();
    });

    document.body.appendChild(overlay);
  }

  function isRoundSpeakingButton(target) {
    var button = target && target.closest ? target.closest(".unitPracticeHeader .unitPracticeActions button") : null;
    if (!button) return null;
    return button.textContent.replace(/\s+/g, "") === "發音練習" ? button : null;
  }

  document.addEventListener(
    "click",
    function (event) {
      var button = isRoundSpeakingButton(event.target);
      if (!button) return;
      if (allowNextSpeakingClick) {
        allowNextSpeakingClick = false;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openDialog(button);
    },
    true
  );
})();
