/* ==================================================================
   Orchid Stay — booking popup (injected on every page)
   WhatsApp enquiry only. No booking engine, no prepayment.
   ================================================================== */
(function () {
  "use strict";

  var MS_DAY = 86400000;
  var WA = "917200028882";
  var MAX_AHEAD = 60;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toISO(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(v) {
    var p = String(v || "").split("-");
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }
  function today0() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function nightsBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / MS_DAY); }

  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DAYS_S = ["S", "M", "T", "W", "T", "F", "S"];
  var DAYS_L = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function pretty(iso) {
    var d = parseISO(iso);
    if (!d) return "";
    return DAYS_L[d.getDay()].slice(0, 3) + ", " + d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3);
  }
  function inr(n) { return "₹" + n.toLocaleString("en-IN"); }

  var RATES = { "Deluxe Room": 1199, "Family Room": 1699 };

  var ICONS = {
    close: '<svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>',
    cal: '<svg class="icon" aria-hidden="true"><use href="#i-calendar"/></svg>',
    plus: '<svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>',
    minusRow: '<svg class="icon" aria-hidden="true"><path d="M5 12h14"/></svg>',
    key: '<svg class="icon" aria-hidden="true"><use href="#i-key"/></svg>',
    shield: '<svg class="icon" aria-hidden="true"><use href="#i-shield"/></svg>',
    arrow: '<svg class="icon icon--arrow" aria-hidden="true"><use href="#i-arrow"/></svg>',
    wa: '<svg class="icon icon--fill" aria-hidden="true"><use href="#i-whatsapp"/></svg>',
    left: '<svg class="icon" aria-hidden="true"><use href="#i-chevron-left"/></svg>',
    right: '<svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg>'
  };

  var TPL =
    '<dialog id="booking-dialog" class="booking-dialog" aria-labelledby="bk-title">' +
    '<form class="bk-card" id="bk-form" novalidate>' +
    '<div class="bk-head">' +
    '<div>' +
    '<p class="eyebrow">Orchid Stay · Direct enquiry</p>' +
    '<h2 id="bk-title">Let\'s get you <em class="hand">in.</em></h2>' +
    '</div>' +
    '<button type="button" class="bk-close" data-bk-close aria-label="Close booking form">' + ICONS.close + '</button>' +
    '</div>' +
    '<div class="bk-fields">' +
    '<div class="bk-dates">' +
    '<button type="button" class="date-trigger" data-date-trigger="checkin" aria-haspopup="dialog" aria-expanded="false">' +
    ICONS.cal + '<span class="date-trigger-text"><small>Check in</small><strong data-date-text="checkin">Choose date</strong></span></button>' +
    '<button type="button" class="date-trigger" data-date-trigger="checkout" aria-haspopup="dialog" aria-expanded="false">' +
    ICONS.cal + '<span class="date-trigger-text"><small>Check out</small><strong data-date-text="checkout">Choose date</strong></span></button>' +
    '</div>' +
    '<p class="nights-chip" data-nights-chip hidden>' + ICONS.key + '<span data-nights-text></span></p>' +
    '<div class="bk-row">' +
    '<div class="stepper" aria-label="Guests">' +
    '<button type="button" class="stepper-btn" data-stepper="-1" aria-label="Fewer guests">' + ICONS.minusRow + '</button>' +
    '<span class="stepper-value" data-guests-value>2 <small>guests</small></span>' +
    '<button type="button" class="stepper-btn" data-stepper="1" aria-label="More guests">' + ICONS.plus + '</button>' +
    '</div>' +
    '<div class="room-picker" role="radiogroup" aria-label="Room type">' +
    '<label class="room-option"><input type="radio" name="room" value="Deluxe Room" data-rate="1199"><span class="room-option-name">Deluxe</span><span class="room-option-price">₹1,199<small>/night</small></span></label>' +
    '<label class="room-option"><input type="radio" name="room" value="Family Room" data-rate="1699"><span class="room-option-name">Family</span><span class="room-option-price">₹1,699<small>/night</small></span></label>' +
    '<label class="room-option"><input type="radio" name="room" value="Not sure yet" data-rate="0" checked><span class="room-option-name">Not sure</span></label>' +
    '</div>' +
    '</div>' +
    '<div class="bk-row">' +
    '<input class="bk-input" type="text" id="bk-name" autocomplete="name" placeholder="Your name">' +
    '<input class="bk-input" type="tel" id="bk-phone" autocomplete="tel" inputmode="tel" placeholder="WhatsApp number">' +
    '</div>' +
    '<input class="bk-input" type="text" id="bk-notes" placeholder="Anything else? Late arrival, pickup, weekly stay…">' +
    '<p class="form-error" data-bk-error hidden></p>' +
    '<button class="btn btn--primary btn--block" type="submit">' + ICONS.wa + 'Send enquiry on WhatsApp</button>' +
    '<p class="book-fineprint">' + ICONS.shield + 'No payment now. We reply — usually in minutes — and you hold the room.</p>' +
    '</div>' +
    '<p class="bk-summary" data-bk-summary aria-live="polite"></p>' +
    '</form>' +
    '</dialog>' +

    '<dialog id="date-dialog" class="date-dialog" aria-labelledby="dp-title">' +
    '<div class="dp-card">' +
    '<div class="dp-head"><div><p class="eyebrow">Select dates</p><h2 id="dp-title">When are you coming?</h2></div>' +
    '<button class="dp-close" type="button" data-dp-close aria-label="Close calendar">' + ICONS.close + '</button></div>' +
    '<div class="dp-quick">' +
    '<button type="button" class="chip" data-quick="tonight">Tonight</button>' +
    '<button type="button" class="chip" data-quick="tomorrow">Tomorrow</button>' +
    '<button type="button" class="chip" data-quick="weekend">This weekend</button>' +
    '<button type="button" class="chip" data-quick="week">A week</button>' +
    '</div>' +
    '<div class="dp-nav">' +
    '<button type="button" class="dp-nav-btn" data-dp-prev aria-label="Previous month">' + ICONS.left + '</button>' +
    '<button type="button" class="dp-nav-btn" data-dp-next aria-label="Next month">' + ICONS.right + '</button>' +
    '</div>' +
    '<div class="dp-months" data-dp-months></div>' +
    '<div class="dp-foot"><p class="dp-status" data-dp-status aria-live="polite"></p>' +
    '<div class="dp-actions"><button type="button" class="btn btn--ghost btn--sm" data-dp-clear>Clear</button>' +
    '<button type="button" class="btn btn--primary btn--sm" data-dp-apply>Done</button></div></div>' +
    '</div>' +
    '</dialog>';

  /* host page may still carry the old static dialog; remove it so ids stay unique */
  var stale = document.getElementById("booking-dialog");
  if (stale) stale.remove();

  document.body.insertAdjacentHTML("beforeend", TPL);

  var dialog = document.getElementById("booking-dialog");
  var form = document.getElementById("bk-form");
  var picker = document.getElementById("date-dialog");

  var today = today0();
  var minISO = toISO(today);
  var maxISO = toISO(addDays(today, MAX_AHEAD));

  var state = { checkin: toISO(today), checkout: toISO(addDays(today, 1)), viewY: today.getFullYear(), viewM: today.getMonth(), picking: null };
  var lastFocus = null;

  var el = {
    close: form.querySelector("[data-bk-close]"),
    text: {
      checkin: form.querySelector('[data-date-text="checkin"]'),
      checkout: form.querySelector('[data-date-text="checkout"]')
    },
    triggers: {
      checkin: form.querySelector('[data-date-trigger="checkin"]'),
      checkout: form.querySelector('[data-date-trigger="checkout"]')
    },
    nightsChip: form.querySelector("[data-nights-chip]"),
    nightsText: form.querySelector("[data-nights-text]"),
    guestsValue: form.querySelector("[data-guests-value]"),
    guestsInput: form.querySelector('input[name="guests"]') || (function () {
      var i = document.createElement("input"); i.type = "hidden"; i.name = "guests"; i.value = "2"; form.appendChild(i); return i;
    })(),
    error: form.querySelector("[data-bk-error]"),
    submit: form.querySelector('[type="submit"]'),
    summary: form.querySelector("[data-bk-summary]")
  };

  var dpMonths = picker.querySelector("[data-dp-months]");
  var dpStatus = picker.querySelector("[data-dp-status]");
  var dpPrev = picker.querySelector("[data-dp-prev]");
  var dpNext = picker.querySelector("[data-dp-next]");
  var dpApply = picker.querySelector("[data-dp-apply]");
  var dpClear = picker.querySelector("[data-dp-clear]");
  var twoUp = window.matchMedia("(min-width: 720px)");

  function selectedRoom() {
    var r = form.querySelector('input[name="room"]:checked');
    return r ? r.value : "Not sure yet";
  }
  function rate() { var r = form.querySelector('input[name="room"]:checked'); return r ? parseInt(r.getAttribute("data-rate"), 10) || 0 : 0; }

  function updateSummary() {
    var n = state.checkin && state.checkout ? nightsBetween(state.checkin, state.checkout) : 0;
    var room = selectedRoom();
    var r = rate();

    el.text.checkin.textContent = state.checkin ? pretty(state.checkin) : "Choose date";
    el.text.checkout.textContent = state.checkout ? pretty(state.checkout) : "Choose date";

    if (n > 0) {
      el.nightsChip.hidden = false;
      el.nightsText.textContent = n + (n === 1 ? " night" : " nights") + " · 12 PM check-in";
    } else {
      el.nightsChip.hidden = true;
    }

    if (!el.summary) return;
    if (!state.checkin || !state.checkout) { el.summary.textContent = ""; return; }
    var bits = [n + (n === 1 ? " night" : " nights"), room + (r ? " · " + inr(r) + "/night" : ""),
      "est. " + (r ? inr(n * r) + " total" : "rate on WhatsApp")];
    el.summary.textContent = bits.join("  ·  ");
  }

  /* ------------------------------ calendar ------------------------------ */
  function monthGrid(y, m) {
    var first = new Date(y, m, 1);
    var days = new Date(y, m + 1, 0).getDate();
    var cells = '<p class="dp-month-name">' + MONTHS[m] + " " + y + '</p><div class="dp-week" aria-hidden="true">' +
      DAYS_S.map(function (d) { return "<span>" + d + "</span>"; }).join("") + '</div><div class="dp-grid">';
    for (var i = 0; i < first.getDay(); i++) cells += '<span class="dp-day dp-day--pad"></span>';
    for (i = 1; i <= days; i++) {
      var d = new Date(y, m, i), iso = toISO(d);
      var cls = ["dp-day"];
      if (iso < minISO || iso > maxISO) cls.push("is-off");
      if (iso === minISO) cls.push("is-today");
      if (iso === state.checkin) cls.push("is-start");
      if (iso === state.checkout) cls.push("is-end");
      if (state.checkin && state.checkout && iso > state.checkin && iso < state.checkout) cls.push("is-range");
      cells += '<button type="button" class="' + cls.join(" ") + '" data-date="' + iso + '" aria-label="' + pretty(iso) + '"' +
        (cls.indexOf("is-off") !== -1 ? " disabled" : "") + ">" + i + "</button>";
    }
    return cells + "</div>";
  }

  function renderPicker() {
    var n = twoUp.matches ? 2 : 1, html = "", y = state.viewY, m = state.viewM;
    for (var k = 0; k < n; k++) { html += '<div class="dp-month">' + monthGrid(y, m) + "</div>"; m++; if (m > 11) { m = 0; y++; } }
    dpMonths.innerHTML = html;
    dpPrev.disabled = (state.viewY === today.getFullYear() && state.viewM === today.getMonth());
    var maxY = parseISO(maxISO).getFullYear(), maxM = parseISO(maxISO).getMonth();
    dpNext.disabled = (state.viewY > maxY) || (state.viewY === maxY && state.viewM >= maxM);
    var nights = state.checkin && state.checkout ? nightsBetween(state.checkin, state.checkout) : 0;
    dpStatus.textContent = !state.checkout
      ? "Now choose check-out."
      : nights + (nights === 1 ? " night selected." : " nights selected.");
    dpApply.disabled = !(state.checkin && state.checkout);
  }

  function pickDay(iso) {
    if (!state.checkin || (state.checkin && state.checkout) || state.picking === "checkin") {
      state.checkin = iso; state.checkout = null; state.picking = "checkout";
    } else if (iso > state.checkin) {
      state.checkout = iso; state.picking = null;
    } else {
      state.checkin = iso; state.checkout = null; state.picking = "checkout";
    }
    updateSummary();
    renderPicker();
  }

  dpMonths.addEventListener("click", function (e) {
    var b = e.target.closest(".dp-day");
    if (b && !b.disabled) pickDay(b.getAttribute("data-date"));
  });

  dpMonths.addEventListener("keydown", function (e) {
    var b = e.target.closest(".dp-day");
    if (!b) return;
    var d = parseISO(b.getAttribute("data-date"));
    var map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (map[e.key]) d = addDays(d, map[e.key]);
    else if (e.key === "PageDown") { state.viewM++; if (state.viewM > 11) { state.viewM = 0; state.viewY++; } renderPicker(); var t = dpMonths.querySelector(".dp-day:not(.is-off):not(.dp-day--pad)"); if (t) t.focus(); e.preventDefault(); return; }
    else if (e.key === "PageUp") { state.viewM--; if (state.viewM < 0) { state.viewM = 11; state.viewY--; } renderPicker(); var t2 = dpMonths.querySelector(".dp-day.is-off ~ .dp-day, .dp-day:not(.is-off)"); if (t2) t2.focus(); e.preventDefault(); return; }
    else return;
    var iso = toISO(d);
    if (iso < minISO || iso > maxISO) return;
    e.preventDefault();
    var jumped = state.viewY !== d.getFullYear() || state.viewM !== d.getMonth();
    state.viewY = d.getFullYear(); state.viewM = d.getMonth();
    if (jumped) renderPicker();
    var t3 = dpMonths.querySelector('.dp-day[data-date="' + iso + '"]');
    if (t3) t3.focus();
  });

  dpPrev.addEventListener("click", function () { state.viewM--; if (state.viewM < 0) { state.viewM = 11; state.viewY--; } renderPicker(); });
  dpNext.addEventListener("click", function () { state.viewM++; if (state.viewM > 11) { state.viewM = 0; state.viewY++; } renderPicker(); });
  dpApply.addEventListener("click", function () { if (dpApply.disabled) return; picker.close(); });
  dpClear.addEventListener("click", function () { state.checkin = minISO; state.checkout = toISO(addDays(today, 1)); state.picking = null; updateSummary(); renderPicker(); });
  picker.querySelector("[data-dp-close]").addEventListener("click", function () { picker.close(); });
  picker.addEventListener("click", function (e) { if (e.target === picker) picker.close(); });
  picker.addEventListener("close", function () { state.picking = null; if (lastFocus) lastFocus.focus(); updateSummary(); });

  picker.querySelectorAll("[data-quick]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var k = chip.getAttribute("data-quick");
      if (k === "tonight") { state.checkin = minISO; state.checkout = toISO(addDays(today, 1)); }
      else if (k === "tomorrow") { var t = addDays(today, 1); state.checkin = toISO(t); state.checkout = toISO(addDays(t, 1)); }
      else if (k === "weekend") { var f = addDays(today, (5 - today.getDay() + 7) % 7); if (f.getTime() < today.getTime()) f = addDays(today, 7 - (today.getDay() - 5) || 1); state.checkin = toISO(f); state.checkout = toISO(addDays(f, 2)); }
      else { state.checkin = minISO; state.checkout = toISO(addDays(today, 7)); }
      state.picking = null;
      updateSummary(); renderPicker(); picker.close();
    });
  });

  twoUp.addEventListener("change", renderPicker);
  el.triggers.checkin.addEventListener("click", function () { openCal("checkin"); });
  el.triggers.checkout.addEventListener("click", function () { openCal("checkout"); });

  function openCal(which) {
    lastFocus = document.activeElement;
    state.picking = null;
    var base = parseISO(state.checkin) || today;
    state.viewY = base.getFullYear(); state.viewM = base.getMonth();
    renderPicker();
    if (which) state.picking = which;
    picker.showModal();
    setTimeout(function () {
      var t = dpMonths.querySelector('.dp-day[data-date="' + (state.checkin || minISO) + '"]:not([disabled])') || dpMonths.querySelector(".dp-day:not(.is-off):not(.dp-day--pad)");
      if (t) t.focus();
    }, 60);
  }

  /* ------------------------------ form wiring ------------------------------ */
  form.querySelectorAll("[data-stepper]").forEach(function (b) {
    b.addEventListener("click", function () {
      var g = Math.min(6, Math.max(1, parseInt(el.guestsInput.value, 10) + parseInt(b.getAttribute("data-stepper"), 10)));
      el.guestsInput.value = g;
      el.guestsValue.innerHTML = g + " <small>guests</small>";
      updateSummary();
    });
  });

  form.querySelectorAll('input[name="room"]').forEach(function (r) { r.addEventListener("change", updateSummary); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();

    var name = form.querySelector("#bk-name").value.trim();
    var digits = form.querySelector("#bk-phone").value.replace(/\D/g, "");
    var notes = form.querySelector("#bk-notes").value.trim();
    var n = nightsBetween(state.checkin, state.checkout);

    if (name.length < 2) return showError("Add your name so we know who to expect.", form.querySelector("#bk-name"));
    if (digits.length < 10) return showError("Add the WhatsApp number we should reply to.", form.querySelector("#bk-phone"));
    if (!state.checkin || n < 1) { openCal("checkout"); return showError("Choose a check-out date after check-in."); }

    var room = selectedRoom(), r = rate();
    var lines = [
      "Hello Orchid Stay, I'd like to check availability.",
      "",
      "Name: " + name,
      "Phone: " + digits,
      "Check-in: " + pretty(state.checkin),
      "Check-out: " + pretty(state.checkout) + " (" + n + (n === 1 ? " night" : " nights") + ")",
      "Guests: " + el.guestsInput.value,
      "Room: " + room
    ];
    if (r) { lines.push("Rate seen on site: " + inr(r) + "/night · " + inr(n * r) + " est. total"); }
    if (notes) lines.push("Notes: " + notes);
    lines.push("", "Please confirm availability and the best direct rate. Thank you.");

    var url = "https://wa.me/" + WA + "?text=" + encodeURIComponent(lines.join("\n"));
    if (el.submit) { el.submit.disabled = true; el.submit.innerHTML = "Opening WhatsApp…"; }
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () {
      if (el.submit) { el.submit.disabled = false; el.submit.innerHTML = ICONS.wa + 'Send enquiry on WhatsApp'; }
      closeBooking();
    }, 1200);
  });

  function showError(msg, focusEl) {
    if (el.error) { el.error.textContent = msg; el.error.hidden = false; }
    if (focusEl) focusEl.focus();
    if (focusEl) focusEl.classList.add("is-invalid");
    setTimeout(function () { if (focusEl) focusEl.classList.remove("is-invalid"); }, 1600);
  }
  function hideError() { if (el.error) el.error.hidden = true; }

  el.close.addEventListener("click", closeBooking);
  dialog.addEventListener("click", function (e) { if (e.target === dialog) closeBooking(); });

  /* ------------------------------ open / close with animation ------------------------------ */
  function openBooking(opts) {
    opts = opts || {};
    lastFocus = document.activeElement;

    if (opts.checkin && parseISO(opts.checkin) && opts.checkin >= minISO && opts.checkin <= maxISO) state.checkin = opts.checkin;
    else state.checkin = minISO;

    if (opts.checkout && parseISO(opts.checkout) && parseISO(opts.checkout) > state.checkin && opts.checkout <= maxISO) state.checkout = opts.checkout;
    else state.checkout = toISO(addDays(parseISO(state.checkin), 1));

    if (opts.guests >= 1 && opts.guests <= 6) {
      el.guestsInput.value = opts.guests;
      el.guestsValue.innerHTML = opts.guests + " <small>guests</small>";
    }

    if (opts.room) {
      var match = form.querySelector('input[name="room"][value="' + opts.room.replace(/"/g, '\\"') + '"]');
      if (match) match.checked = true;
    }

    hideError();
    updateSummary();

    if (!dialog.open) {
      dialog.showModal();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { dialog.classList.add("is-open"); });
      });
      document.body.classList.add("is-locked");
      setTimeout(function () { form.querySelector("#bk-name").focus(); }, 340);
    }
  }

  function closeBooking() {
    if (!dialog.open) return;
    dialog.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    setTimeout(function () { dialog.close(); if (lastFocus) lastFocus.focus(); }, 330);
  }

  window.OrchidBooking = {
    open: openBooking,
    close: closeBooking,
    isOpen: function () { return dialog.open; }
  };

  /* Esc key closes with animation */
  dialog.addEventListener("cancel", function (e) { e.preventDefault(); closeBooking(); });

  updateSummary();
})();
