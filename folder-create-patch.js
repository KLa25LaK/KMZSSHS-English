(function () {
  var STYLE_ID = "kmz-folder-create-style";
  var PLUS_CLASS = "kmzAddFolderPlus";
  var OVERLAY_CLASS = "kmzCreateFolderOverlay";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      ".customPanel.indexPanel .homeFolderCreator{" +
      "position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;" +
      "overflow:hidden!important;opacity:0!important;pointer-events:none!important;}" +
      "." +
      PLUS_CLASS +
      "{" +
      "display:inline-flex;align-items:center;justify-content:center;" +
      "width:auto;height:auto;margin:0;padding:0 2px;border:none;border-radius:0;" +
      "cursor:pointer;background:transparent;color:#e11d48;font-size:28px;font-weight:900;" +
      "line-height:1;box-shadow:none;flex:0 0 auto;}" +
      "." +
      PLUS_CLASS +
      ":disabled{opacity:.4;cursor:not-allowed;}" +
      "." +
      OVERLAY_CLASS +
      "{" +
      "position:fixed;inset:0;z-index:10000;display:grid;place-items:center;" +
      "background:rgba(8,16,32,.58);padding:16px;}" +
      ".kmzCreateFolderDialog{" +
      "width:min(420px,calc(100vw - 32px));display:grid;gap:14px;padding:20px;" +
      "border-radius:16px;border:1px solid #ffe08a;background:#16233a;color:#f4f7ff;}" +
      ".kmzCreateFolderDialog .eyebrow{margin:0;color:#ffe08a;font-size:12px;font-weight:800;letter-spacing:.04em;}" +
      ".kmzCreateFolderDialog h3{margin:4px 0 0;font-size:20px;}" +
      ".kmzCreateFolderDialog p{margin:0;opacity:.85;line-height:1.5;}" +
      ".kmzCreateFolderDialog input{" +
      "min-height:44px;width:100%;box-sizing:border-box;border-radius:10px;" +
      "border:1px solid rgba(255,224,138,.45);background:#0f1a2c;color:#fff;" +
      "font:inherit;font-weight:800;padding:0 12px;}" +
      ".kmzCreateFolderActions{display:flex;justify-content:flex-end;gap:8px;}" +
      ".kmzCreateFolderActions button{" +
      "min-height:40px;border-radius:10px;border:1px solid transparent;padding:0 14px;" +
      "font:inherit;font-weight:800;cursor:pointer;}" +
      ".kmzCreateFolderCancel{background:transparent;border-color:rgba(255,255,255,.25);color:#f4f7ff;}" +
      ".kmzCreateFolderConfirm{background:#5a4a1a;border-color:#ffe08a;color:#fff8e8;}" +
      ".kmzCreateFolderConfirm:disabled{opacity:.45;cursor:not-allowed;}";
    document.head.appendChild(style);
  }

  function setReactInputValue(input, value) {
    var descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    if (descriptor && descriptor.set) descriptor.set.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function closeDialog() {
    var overlay = document.querySelector("." + OVERLAY_CLASS);
    if (overlay) overlay.remove();
  }

  function openDialog(panel) {
    closeDialog();
    var creator = panel.querySelector(".homeFolderCreator");
    if (!creator) return;
    var input = creator.querySelector("input");
    var addButton = creator.querySelector("button");
    if (!input || !addButton) return;
    if (addButton.disabled) return;

    var overlay = document.createElement("div");
    overlay.className = OVERLAY_CLASS;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "新增資料夾");
    overlay.innerHTML =
      '<div class="kmzCreateFolderDialog">' +
      '<div><p class="eyebrow">新增資料夾</p><h3>替這個資料夾取名</h3>' +
      "<p>名稱最多 18 個字。按新增後會出現在自訂單字區。</p></div>" +
      '<input maxlength="18" placeholder="輸入資料夾名稱" />' +
      '<div class="kmzCreateFolderActions">' +
      '<button type="button" class="kmzCreateFolderCancel">取消</button>' +
      '<button type="button" class="kmzCreateFolderConfirm" disabled>新增</button>' +
      "</div></div>";

    var dialogInput = overlay.querySelector("input");
    var cancelBtn = overlay.querySelector(".kmzCreateFolderCancel");
    var confirmBtn = overlay.querySelector(".kmzCreateFolderConfirm");

    function syncConfirm() {
      confirmBtn.disabled = !dialogInput.value.trim();
    }

    function submit() {
      var name = dialogInput.value.trim().slice(0, 18);
      if (!name) return;
      setReactInputValue(input, name);
      window.setTimeout(function () {
        addButton.click();
        closeDialog();
      }, 0);
    }

    cancelBtn.addEventListener("click", closeDialog);
    confirmBtn.addEventListener("click", submit);
    dialogInput.addEventListener("input", syncConfirm);
    dialogInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
      if (event.key === "Escape") closeDialog();
    });
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeDialog();
    });

    document.body.appendChild(overlay);
    dialogInput.focus();
  }

  function enhance() {
    ensureStyle();
    var panel = document.querySelector(".customPanel.indexPanel");
    if (!panel) return;
    var title = panel.querySelector(".inlineTitle");
    if (!title) return;
    var span = Array.prototype.find.call(title.querySelectorAll("span"), function (el) {
      return el.textContent.indexOf("最多") !== -1 && el.textContent.indexOf("資料夾") !== -1;
    });
    if (!span) return;

    var creator = panel.querySelector(".homeFolderCreator");
    var addButton = creator && creator.querySelector("button");
    var disabled = Boolean(addButton && addButton.disabled);

    // Move any old plus that was wrongly nested inside the badge.
    var nested = span.querySelector("." + PLUS_CLASS);
    if (nested) nested.remove();

    var existing = title.querySelector(":scope > ." + PLUS_CLASS);
    if (!existing) {
      existing = document.createElement("button");
      existing.type = "button";
      existing.className = PLUS_CLASS;
      existing.textContent = "+";
      existing.setAttribute("aria-label", "新增資料夾");
      existing.title = "新增資料夾";
      existing.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openDialog(panel);
      });
      if (span.nextSibling) title.insertBefore(existing, span.nextSibling);
      else title.appendChild(existing);
    } else if (existing.previousElementSibling !== span) {
      if (span.nextSibling) title.insertBefore(existing, span.nextSibling);
      else title.appendChild(existing);
    }

    existing.disabled = disabled;
    existing.title = disabled ? "已達 21 個資料夾上限" : "新增資料夾";
  }

  var observer = new MutationObserver(function () {
    enhance();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhance);
  } else {
    enhance();
  }
})();
