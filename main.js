/* Orchid Stay — interactions
   Booking is handled as a WhatsApp handoff so the hotel can confirm
   availability personally. No data is stored or sent to a server. */

(function () {
  "use strict";

  var WHATSAPP_NUMBER = "917200028882";
  var PHONE_NUMBER = "+917200028882";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toISODate(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function addDays(date, days) {
    var next = new Date(date.getTime());
    next.setDate(next.getDate() + days);
    return next;
  }

  function parseDate(value) {
    if (!value) return null;
    var parts = value.split("-");
    if (parts.length !== 3) return null;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  function prettyDate(value) {
    var d = parseDate(value);
    if (!d) return "—";
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(d);
  }

  function nightsBetween(a, b) {
    var start = parseDate(a);
    var end = parseDate(b);
    if (!start || !end) return 0;
    return Math.round((end - start) / 86400000);
  }

  function setMinDates(checkin, checkout) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayISO = toISODate(today);

    if (checkin) {
      checkin.min = todayISO;
      if (!checkin.value || checkin.value < todayISO) checkin.value = todayISO;
    }

    if (checkout) {
      checkout.min = checkin && checkin.value ? toISODate(addDays(parseDate(checkin.value), 1)) : toISODate(addDays(today, 1));
      if (!checkout.value || checkout.value <= (checkin ? checkin.value : todayISO)) {
        checkout.value = checkin && checkin.value
          ? toISODate(addDays(parseDate(checkin.value), 1))
          : toISODate(addDays(today, 1));
      }
    }
  }

  function syncCheckout(checkin, checkout) {
    if (!checkin.value) return;
    var next = toISODate(addDays(parseDate(checkin.value), 1));
    checkout.min = next;
    if (!checkout.value || checkout.value <= checkin.value) checkout.value = next;
  }

  /* ------------------------------------------------------------------ */
  /* Header scroll state                                                */
  /* ------------------------------------------------------------------ */
  var header = document.querySelector("[data-header]");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------ */
  /* Mobile navigation                                                  */
  /* ------------------------------------------------------------------ */
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.getElementById("mobile-nav");

  function setMenu(open) {
    if (!menuToggle || !mobileNav) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.classList.toggle("is-open", open);
    var use = menuToggle.querySelector("use");
    if (use) use.setAttribute("href", open ? "#i-close" : "#i-menu");
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });

    document.addEventListener("click", function (event) {
      if (menuToggle.getAttribute("aria-expanded") !== "true") return;
      if (mobileNav.contains(event.target) || menuToggle.contains(event.target)) return;
      setMenu(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Date fields                                                        */
  /* ------------------------------------------------------------------ */
  var inlineCheckin = document.getElementById("checkin");
  var inlineCheckout = document.getElementById("checkout");
  var inlineGuests = document.getElementById("guests");
  var inlineForm = document.querySelector("[data-booking-form]");

  var modalCheckin = document.getElementById("m-checkin");
  var modalCheckout = document.getElementById("m-checkout");
  var modalGuests = document.getElementById("m-guests");
  var modalRoom = document.getElementById("m-room");
  var modalName = document.getElementById("m-name");
  var modalPhone = document.getElementById("m-phone");
  var modalNotes = document.getElementById("m-notes");
  var modalForm = document.getElementById("booking-form");
  var formError = document.getElementById("form-error");
  var submitButton = modalForm ? modalForm.querySelector('button[type="submit"]') : null;

  if (inlineCheckin && inlineCheckout) {
    setMinDates(inlineCheckin, inlineCheckout);
    inlineCheckin.addEventListener("change", function () {
      syncCheckout(inlineCheckin, inlineCheckout);
    });
  }

  if (modalCheckin && modalCheckout) {
    setMinDates(modalCheckin, modalCheckout);
    modalCheckin.addEventListener("change", function () {
      syncCheckout(modalCheckin, modalCheckout);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Booking dialog                                                     */
  /* ------------------------------------------------------------------ */
  var bookingDialog = document.getElementById("booking-dialog");
  var lastFocused = null;

  function openBooking(room) {
    if (window.OrchidBooking) {
      window.OrchidBooking.open({
        room: room || "",
        checkin: inlineCheckin ? inlineCheckin.value : "",
        checkout: inlineCheckout ? inlineCheckout.value : "",
        guests: inlineGuests ? parseInt(inlineGuests.value, 10) : 2
      });
    }
  }

  function closeBooking() {
    if (!bookingDialog || !bookingDialog.open) return;
    bookingDialog.close();
  }

  document.querySelectorAll("[data-open-booking]").forEach(function (button) {
    button.addEventListener("click", function () {
      openBooking(button.getAttribute("data-room") || "");
    });
  });

  if (inlineForm) {
    inlineForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (inlineCheckin && inlineCheckout) {
        setMinDates(inlineCheckin, inlineCheckout);
        if (inlineCheckin.value && inlineCheckout.value && inlineCheckout.value <= inlineCheckin.value) {
          inlineCheckout.value = toISODate(addDays(parseDate(inlineCheckin.value), 1));
        }
      }
      openBooking("");
    });
  }

  if (bookingDialog) {
    bookingDialog.addEventListener("click", function (event) {
      if (event.target === bookingDialog) closeBooking();
    });

    bookingDialog.addEventListener("close", function () {
      document.body.classList.remove("is-locked");
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    });

    bookingDialog.querySelectorAll("[data-close-dialog]").forEach(function (button) {
      button.addEventListener("click", closeBooking);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Booking form → WhatsApp                                            */
  /* ------------------------------------------------------------------ */
  function buildMessage(data) {
    var nights = nightsBetween(data.checkin, data.checkout);
    var lines = [
      "Hello Orchid Stay, I'd like to check availability.",
      "",
      "Name: " + data.name,
      "Phone: " + data.phone,
      "Check-in: " + prettyDate(data.checkin),
      "Check-out: " + prettyDate(data.checkout) + (nights > 0 ? " (" + nights + (nights === 1 ? " night" : " nights") + ")" : ""),
      "Guests: " + data.guests,
      "Room: " + data.room
    ];

    if (data.notes) lines.push("Notes: " + data.notes);
    lines.push("", "Please confirm availability and the best direct rate. Thank you.");

    return lines.join("\n");
  }

  function showFormError(message) {
    if (!formError) return;
    formError.textContent = message;
    formError.hidden = false;
  }

  if (modalForm) {
    modalForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = modalName ? modalName.value.trim() : "";
      var phone = modalPhone ? modalPhone.value.trim() : "";
      var checkin = modalCheckin ? modalCheckin.value : "";
      var checkout = modalCheckout ? modalCheckout.value : "";
      var guests = modalGuests ? modalGuests.value : "2";
      var room = modalRoom ? modalRoom.value : "Not sure yet";
      var notes = modalNotes ? modalNotes.value.trim() : "";
      var digits = phone.replace(/\D/g, "");

      if (formError) formError.hidden = true;

      if (name.length < 2) {
        showFormError("Please add your name so we know who to expect.");
        if (modalName) modalName.focus();
        return;
      }

      if (digits.length < 7) {
        showFormError("Please add a phone number we can reach you on.");
        if (modalPhone) modalPhone.focus();
        return;
      }

      if (!checkin || !checkout || checkout <= checkin) {
        showFormError("Please choose a check-out date after your check-in date.");
        if (modalCheckout) modalCheckout.focus();
        return;
      }

      var message = buildMessage({
        name: name,
        phone: phone,
        checkin: checkin,
        checkout: checkout,
        guests: guests,
        room: room,
        notes: notes
      });

      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Opening WhatsApp…";
      }

      var link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(function () {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = 'Send on WhatsApp <svg class="icon icon--arrow" aria-hidden="true"><use href="#i-arrow"/></svg>';
        }
      }, 2400);
    });
  }

  /* ------------------------------------------------------------------ */
  /* FAQ accordion                                                      */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll("[data-faq]").forEach(function (list) {
    var items = list.querySelectorAll(".faq-item");

    items.forEach(function (item) {
      var button = item.querySelector(".faq-q");
      var panel = item.querySelector(".faq-a");
      if (!button || !panel) return;

      button.addEventListener("click", function () {
        var isOpen = button.getAttribute("aria-expanded") === "true";

        items.forEach(function (other) {
          var otherButton = other.querySelector(".faq-q");
          if (!otherButton) return;
          other.classList.remove("is-open");
          otherButton.setAttribute("aria-expanded", "false");
        });

        if (!isOpen) {
          item.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Gallery lightbox                                                   */
  /* ------------------------------------------------------------------ */
  var gallery = document.querySelector("[data-gallery]");
  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lb-img");
  var lightboxCaption = document.getElementById("lb-caption");
  var galleryItems = gallery ? Array.prototype.slice.call(gallery.querySelectorAll(".gallery-item")) : [];
  var galleryIndex = 0;

  function renderLightbox(index) {
    if (!lightboxImage || !galleryItems.length) return;
    galleryIndex = (index + galleryItems.length) % galleryItems.length;
    var item = galleryItems[galleryIndex];
    var img = item.querySelector("img");
    lightboxImage.src = item.getAttribute("data-src") || (img ? img.src : "");
    lightboxImage.alt = img ? img.alt : "";
    if (lightboxCaption) lightboxCaption.textContent = item.getAttribute("data-caption") || "";
  }

  function openLightbox(index) {
    if (!lightbox) return;
    renderLightbox(index);
    if (!lightbox.open) lightbox.showModal();
    document.body.classList.add("is-locked");
  }

  function closeLightbox() {
    if (lightbox && lightbox.open) lightbox.close();
  }

  galleryItems.forEach(function (item, index) {
    item.addEventListener("click", function () {
      openLightbox(index);
    });
  });

  if (lightbox) {
    lightbox.querySelectorAll("[data-lb-close]").forEach(function (button) {
      button.addEventListener("click", closeLightbox);
    });

    var prevButton = lightbox.querySelector("[data-lb-prev]");
    var nextButton = lightbox.querySelector("[data-lb-next]");

    if (prevButton) prevButton.addEventListener("click", function () { renderLightbox(galleryIndex - 1); });
    if (nextButton) nextButton.addEventListener("click", function () { renderLightbox(galleryIndex + 1); });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener("close", function () {
      document.body.classList.remove("is-locked");
    });

    lightbox.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") renderLightbox(galleryIndex - 1);
      if (event.key === "ArrowRight") renderLightbox(galleryIndex + 1);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                      */
  /* ------------------------------------------------------------------ */
  var revealItems = document.querySelectorAll("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = Number(entry.target.getAttribute("data-delay") || 0);
        entry.target.style.transitionDelay = delay + "ms";
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Small utilities                                                    */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Keep date fields honest when the page is restored from the bfcache.
  window.addEventListener("pageshow", function () {
    if (inlineCheckin && inlineCheckout) setMinDates(inlineCheckin, inlineCheckout);
  });

  // Expose the phone number for any future integrations without hardcoding elsewhere.
  window.ORCHID_STAY = { phone: PHONE_NUMBER, whatsapp: WHATSAPP_NUMBER };
})();

  /* ------------------------------------------------------------------ */
  /* Scroll parallax (data-parallax)                                    */
  /* ------------------------------------------------------------------ */
  (function () {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    if (!els.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var raf = null;
    var SCALE = "scale(1.12)";

    function tick() {
      raf = null;
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.08;
        var r = el.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        offset = Math.max(-44, Math.min(44, offset));
        el.style.transform = "translateY(" + offset.toFixed(1) + "px) " + SCALE;
      });
    }

    window.addEventListener("scroll", function () {
      if (!raf) raf = window.requestAnimationFrame(tick);
    }, { passive: true });

    window.addEventListener("resize", function () {
      if (!raf) raf = window.requestAnimationFrame(tick);
    });

    tick();
  })();
