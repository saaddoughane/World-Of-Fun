const SESSION_KEY = "gw_currentUser";

function basePath() {
  return window.location.pathname.includes("/jeux/") ? "../../" : "";
}

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
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

function attachLogout() {
  const btn = document.querySelector("[data-logout-btn]");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.removeItem(SESSION_KEY);
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

const navbar = document.querySelector('.nav');

let lastScrollY = window.scrollY;
let ticking = false;

function handleScroll() {
  const currentScrollY = window.scrollY;

  if (Math.abs(currentScrollY - lastScrollY) < 10) return;

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

// ================= UI based on session =================
(function () {
  const heroBtn = document.getElementById("heroAccountBtn");
  const navLoginBtn = document.getElementById("navAccountBtn") || document.querySelector("[data-account-link]");
  const logoutBtn   = document.getElementById("logoutBtn")     || document.querySelector("[data-logout-btn]");

  const currentUser = sessionStorage.getItem("gw_currentUser");

  if (currentUser) {
    // USER CONNECTED

    // Hero button → Mon compte
    if (heroBtn) {
      heroBtn.textContent = "Mon compte";
      heroBtn.href = "account.html";
    }

    // Navbar: hide Login
    if (navLoginBtn) {
      navLoginBtn.style.display = "none";
    }

    // Navbar: show Logout
    if (logoutBtn) {
      logoutBtn.style.display = "inline-flex";
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem("gw_currentUser");
        window.location.reload();
      });
    }

  } else {
    // USER NOT CONNECTED

    // Hero button → Login
    if (heroBtn) {
      heroBtn.textContent = "Connexion";
      heroBtn.href = "auth.html";
    }

    // Navbar: show Login
    if (navLoginBtn) {
      navLoginBtn.style.display = "inline-flex";
    }

    // Navbar: hide Logout
    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }
  }
})();

setNav();
attachLogout();
initPins();