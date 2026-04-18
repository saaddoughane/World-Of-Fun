const SESSION_KEY = "gw_session";

function basePath() {
  return window.location.pathname.includes("/jeux/") ? "../../" : "";
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function setNav() {
  const user = getCurrentUser();
  const accountLink = document.querySelector("[data-account-link]");
  const logoutBtn = document.querySelector("[data-logout-btn]");

  if (!accountLink) return;

  if (user && user.email) {
    accountLink.textContent = "Mon Compte";
    accountLink.setAttribute("href", `${basePath()}account.html`);
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
  } else {
    accountLink.textContent = "Connexion";
    accountLink.setAttribute("href", `${basePath()}auth.html`);
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

function setGameLinks() {
  const user = getCurrentUser();
  const isLoggedIn = Boolean(user && user.email);
  const gameLinks = Array.from(document.querySelectorAll("[data-game-href]"));

  gameLinks.forEach((link) => {
    const gameHref = link.getAttribute("data-game-href");
    if (!gameHref) return;

    link.setAttribute("href", isLoggedIn ? gameHref : `${basePath()}auth.html`);
  });
}

function attachLogout() {
  const btn = document.querySelector("[data-logout-btn]");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem(SESSION_KEY);
    setNav();
    window.location.href = `${basePath()}index.html`;
  });
}

function initPins() {
  const pins = Array.from(document.querySelectorAll(".pin"));
  if (pins.length === 0) return;

  function closeAll(except = null) {
    pins.forEach(p => { if (p !== except) p.classList.remove("is-open"); });
  }

  pins.forEach(pin => {
    pin.addEventListener("click", (e) => {
      const clickedLink = e.target.closest("a");
      if (clickedLink) return;

      e.preventDefault();
      const willOpen = !pin.classList.contains("is-open");
      closeAll();
      if (willOpen) pin.classList.add("is-open");
    });
  });

  document.addEventListener("click", (e) => {
    const insidePin = e.target.closest(".pin");
    if (!insidePin) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}

  let navbar = null;

  window.addEventListener("DOMContentLoaded", () => {
    navbar = document.querySelector('.nav');
  });

let lastScrollY = window.scrollY;
let ticking = false;

function handleScroll() {
  const currentScrollY = window.scrollY;

  if (Math.abs(currentScrollY - lastScrollY) < 10) return;

  if (!navbar) return;

  if (currentScrollY > lastScrollY && currentScrollY > 80) {
    navbar.classList.add('is-hidden');
  } else {
    navbar.classList.remove('is-hidden');
  }

  lastScrollY = currentScrollY;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      handleScroll();
      ticking = false;
    });
    ticking = true;
  }
});

const SCORES_KEY = "gw_scores";

function safeParse(raw, fallback) {
  try {
    const value = JSON.parse(raw);
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

function saveScore(game, score, extra = {}) {
  const session = safeParse(localStorage.getItem("gw_session"), null);
  if (!session || !session.email) return;

  const scores = safeParse(localStorage.getItem(SCORES_KEY), []);

  scores.push({
    ...extra,
    email: session.email,
    game: game,
    score: score,
    date: new Date().toISOString()
  });

  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));

  console.log("Score sauvegardé :", game, score);
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  const heroBtn = document.getElementById("heroAccountBtn");

  if (!heroBtn) return;

  if (user && user.email) {
    heroBtn.textContent = "Mon compte";
    heroBtn.href = `${basePath()}account.html`;
  } else {
    heroBtn.textContent = "Connexion";
    heroBtn.href = `${basePath()}auth.html`;
  }
});

setNav();
setGameLinks();
attachLogout();
initPins();
