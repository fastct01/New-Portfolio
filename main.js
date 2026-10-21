document.documentElement.classList.add("js");

document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Fade/slide sections in as they enter the viewport
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-in"));
}

// "Open ↗" bubble that follows the pointer over project cards
const cursor = document.querySelector(".cursor");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (cursor && finePointer) {
  let x = 0, y = 0, cx = 0, cy = 0, raf = 0;

  const tick = () => {
    cx += (x - cx) * 0.2;
    cy += (y - cy) * 0.2;
    cursor.style.left = cx + "px";
    cursor.style.top = cy + "px";
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(tick) : 0;
  };

  window.addEventListener("pointermove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  document.querySelectorAll(".project").forEach((card) => {
    card.addEventListener("pointerenter", () => cursor.classList.add("is-on"));
    card.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
  });
}

// Contact modal: opens centred, sends the query through the visitor's mail app
const modal = document.getElementById("contact-modal");
const openers = document.querySelectorAll("[data-open-contact]");

if (modal && typeof modal.showModal === "function") {
  const form = modal.querySelector("form");
  const status = modal.querySelector(".modal-status");
  const to = form.dataset.contactTo;
  let closeTimer = 0;

  const open = () => {
    modal.showModal();
    modal.querySelector("textarea").focus();
  };

  openers.forEach((btn) => btn.addEventListener("click", open));
  modal.querySelectorAll("[data-close-contact]").forEach((btn) => {
    btn.addEventListener("click", () => modal.close());
  });

  // click on the backdrop (outside the form) closes
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  modal.addEventListener("close", () => {
    clearTimeout(closeTimer);
    status.hidden = true;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const subject = encodeURIComponent("Query from the Osmos Studio site");
    const body = encodeURIComponent(`${message}\n\n— ${email}`);

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    status.textContent = `Opening your mail app… If nothing happens, email ${to} directly.`;
    status.hidden = false;
    closeTimer = setTimeout(() => {
      modal.close();
      form.reset();
    }, 3000);
  });
} else if (openers.length) {
  // very old browsers without <dialog>: fall back to a plain mail link
  openers.forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = "mailto:nme3015@gmail.com";
    });
  });
}

// Developer cards: collapsed brief by default, click to expand
document.querySelectorAll("[data-dev]").forEach((card) => {
  const toggle = card.querySelector(".dev-toggle");
  const panel = card.querySelector(".dev-more");
  const label = toggle.querySelector("[data-label]");

  const setOpen = (open) => {
    card.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    panel.inert = !open; // keeps the hidden content out of the tab order
    label.textContent = open ? "Show less" : toggle.dataset.more;
    if (!open && card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ block: "start" });
    }
  };
  setOpen(false);

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!card.classList.contains("is-open"));
  });

  card.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    const open = card.classList.contains("is-open");
    // once open, only the header / brief collapse it, so links and text stay usable
    if (open && !e.target.closest(".dev-head, .dev-brief")) return;
    setOpen(!open);
  });
});
