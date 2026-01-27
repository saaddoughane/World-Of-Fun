document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const topbar = document.querySelector(".topbar");
  const syncTopbarHeight = () => {
    if (!topbar) return;
    const h = Math.ceil(topbar.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--topbar-h", `${h}px`);
  };
  syncTopbarHeight();
  window.addEventListener("resize", syncTopbarHeight);

  const btnAccess = document.getElementById("btnAccessGames");
  const gamesSection = document.getElementById("gamesSection");
  if (btnAccess && gamesSection) {
    btnAccess.addEventListener("click", () => {
      gamesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const coverflow = document.getElementById("coverflow");
  const cards = Array.from(document.querySelectorAll(".covercard"));
  if (!coverflow || cards.length === 0) return;

  const n = cards.length;
  const mod = (a, m) => ((a % m) + m) % m;

  let activeIndex = Math.floor(Math.random() * n);

  function setPositions(centerIdx) {
    const leftIdx = mod(centerIdx - 1, n);
    const rightIdx = mod(centerIdx + 1, n);

    cards.forEach((c) => c.removeAttribute("data-pos"));

    cards[centerIdx].setAttribute("data-pos", "center");
    cards[leftIdx].setAttribute("data-pos", "left");
    cards[rightIdx].setAttribute("data-pos", "right");
  }

  function goNext() {
    activeIndex = mod(activeIndex + 1, n);
    setPositions(activeIndex);
  }

  function goPrev() {
    activeIndex = mod(activeIndex - 1, n);
    setPositions(activeIndex);
  }

  setPositions(activeIndex);

  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      activeIndex = i;
      setPositions(activeIndex);
    });
  });

  let wheelAcc = 0;
  let wheelLock = false;
  let lastWheelTs = 0;

  const WHEEL_RESET_MS = 220;
  const WHEEL_COOLDOWN_MS = 260;
  const WHEEL_THRESHOLD = 90;

  function maybeStepFromWheel(delta) {
    const now = performance.now();

    if (now - lastWheelTs > WHEEL_RESET_MS) {
      wheelAcc = 0;
    }
    lastWheelTs = now;

    wheelAcc += delta;

    if (wheelLock) return;

    if (Math.abs(wheelAcc) >= WHEEL_THRESHOLD) {
      wheelLock = true;

      if (wheelAcc > 0) goNext();
      else goPrev();

      wheelAcc = wheelAcc > 0 ? wheelAcc - WHEEL_THRESHOLD : wheelAcc + WHEEL_THRESHOLD;

      setTimeout(() => {
        wheelLock = false;
      }, WHEEL_COOLDOWN_MS);
    }
  }

  coverflow.addEventListener(
    "wheel",
    (e) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      const isTrackpadHorizontal = absX > absY && absX > 0;

      const isShiftWheel = e.shiftKey && absY > 0;

      if (!isTrackpadHorizontal && !isShiftWheel) return;

      e.preventDefault();

      const delta = isTrackpadHorizontal ? e.deltaX : e.deltaY;
      maybeStepFromWheel(delta);
    },
    { passive: false }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  });
});
