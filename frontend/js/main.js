const SESSION_KEY = "gw_session";

// Calcule le chemin de base selon la profondeur de la page.
function basePath() {
  return window.location.pathname.includes("/jeux/") ? "../../" : "";
}

// Lit l'utilisateur courant depuis le stockage local.
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

// Met a jour les liens de navigation selon la session.
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

// Redirige les cartes de jeux vers le bon point d'entree.
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

// Branche le bouton de deconnexion global.
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

// Gere l'ouverture et la fermeture des cartes de regions.
function initPins() {
  const pins = Array.from(document.querySelectorAll(".pin"));
  if (pins.length === 0) return;

  // Ferme toutes les cartes sauf celle a conserver ouverte.
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

// Masque la barre quand on descend franchement dans la page.
function handleScroll() {
  const currentScrollY = window.scrollY;

  // Le seuil evite les clignotements sur les micro-scrolls.
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

// Analyse un JSON sans casser le reste de l'interface.
function safeParse(raw, fallback) {
  try {
    const value = JSON.parse(raw);
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

// Enregistre un score normalise pour les classements globaux.
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

// Ajuste le bouton hero selon l'etat de connexion.
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
