/* Ride Price Training Hub — shared behavior */
(function () {
  "use strict";

  /* mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () { links.classList.toggle("open"); });
  }

  /* accordions */
  document.querySelectorAll(".acc__head").forEach(function (head) {
    head.addEventListener("click", function () {
      head.closest(".acc").classList.toggle("open");
    });
  });
  document.querySelectorAll("[data-expand-all]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var scope = document.querySelector(btn.getAttribute("data-expand-all")) || document;
      var accs = scope.querySelectorAll(".acc");
      var anyClosed = Array.prototype.some.call(accs, function (a) { return !a.classList.contains("open"); });
      accs.forEach(function (a) { a.classList.toggle("open", anyClosed); });
      btn.textContent = anyClosed ? "Collapse all" : "Expand all";
    });
  });

  /* toast */
  var toast = document.createElement("div");
  toast.id = "toast";
  document.body.appendChild(toast);
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 1800);
  }

  /* copy to clipboard — navigator.clipboard needs a secure context, so it is
     absent when the hub is served over plain http on the LAN (phones) */
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:absolute;left:-9999px;top:0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text, onDone) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        onDone(true);
      }, function () {
        onDone(legacyCopy(text));
      });
      return;
    }
    onDone(legacyCopy(text));
  }

  /* copy buttons for word tracks */
  document.querySelectorAll(".wordtrack").forEach(function (wt) {
    var quote = wt.querySelector("blockquote");
    if (!quote) return;
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      copyText(quote.textContent.trim(), function (ok) {
        showToast(ok ? "Word track copied" : "Couldn't copy — select the text and copy manually");
      });
    });
    wt.appendChild(btn);
  });

  /* live search / filter (any page with .searchbar input[data-filter]) */
  var search = document.querySelector(".searchbar input[data-filter]");
  if (search) {
    var itemSel = search.getAttribute("data-filter");
    var empty = document.querySelector(".no-results");
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      document.querySelectorAll(itemSel).forEach(function (el) {
        var hit = !q || el.textContent.toLowerCase().indexOf(q) !== -1;
        el.style.display = hit ? "" : "none";
        if (hit) shown++;
      });
      /* hide section headers with no visible items */
      document.querySelectorAll("[data-filter-group]").forEach(function (group) {
        var visible = group.querySelectorAll(itemSel);
        var any = Array.prototype.some.call(visible, function (el) { return el.style.display !== "none"; });
        group.style.display = any ? "" : "none";
      });
      if (empty) empty.style.display = shown ? "none" : "block";
    });
  }

  /* flashcard practice mode (objections page) */
  var fcBtn = document.getElementById("practiceBtn");
  if (fcBtn) {
    var cards = [];
    document.querySelectorAll(".acc[data-fc]").forEach(function (acc) {
      cards.push({
        tag: acc.getAttribute("data-fc"),
        q: acc.querySelector(".acc__head span").textContent.trim(),
        a: acc.querySelector(".acc__body").innerHTML
      });
    });
    if (cards.length) {
      var overlay = document.createElement("div");
      overlay.className = "fc-overlay";
      overlay.innerHTML =
        '<div class="fc-card">' +
        '<button class="fc-close" type="button" aria-label="Close">×</button>' +
        '<span class="pill pill--hot fc-tag"></span>' +
        "<h3></h3>" +
        '<div class="fc-a"></div>' +
        '<div class="fc-hint">Think through your response, then tap the card to reveal the play.</div>' +
        '<div class="fc-controls"><button type="button" class="fc-flip">Flip</button><button type="button" class="fc-next">Next card →</button></div>' +
        "</div>";
      document.body.appendChild(overlay);
      var card = overlay.querySelector(".fc-card");
      var order = [], pos = 0;
      function shuffle() {
        order = cards.map(function (_, i) { return i; });
        for (var i = order.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var t = order[i]; order[i] = order[j]; order[j] = t;
        }
        pos = 0;
      }
      function render() {
        var c = cards[order[pos]];
        card.classList.remove("flipped");
        overlay.querySelector(".fc-tag").textContent = c.tag;
        overlay.querySelector("h3").textContent = c.q;
        overlay.querySelector(".fc-a").innerHTML = c.a;
      }
      fcBtn.addEventListener("click", function () {
        shuffle(); render();
        overlay.classList.add("open");
      });
      overlay.querySelector(".fc-close").addEventListener("click", function (e) {
        e.stopPropagation(); overlay.classList.remove("open");
      });
      overlay.querySelector(".fc-flip").addEventListener("click", function (e) {
        e.stopPropagation(); card.classList.toggle("flipped");
      });
      overlay.querySelector(".fc-next").addEventListener("click", function (e) {
        e.stopPropagation();
        pos = (pos + 1) % order.length;
        if (pos === 0) shuffle();
        render();
      });
      card.addEventListener("click", function () { card.classList.toggle("flipped"); });
      overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.classList.remove("open"); });
    }
  }

  /* back to top */
  var top = document.createElement("button");
  top.id = "toTop";
  top.type = "button";
  top.title = "Back to top";
  top.textContent = "↑";
  document.body.appendChild(top);
  window.addEventListener("scroll", function () {
    top.classList.toggle("show", window.scrollY > 700);
  });
  top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
})();
