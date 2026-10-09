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
