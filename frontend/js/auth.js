(function () {
  // Ne pas redéclarer USERS_KEY / SESSION_KEY en global.
  // On les récupère si elles existent, sinon fallback.
  const USERS_KEY_LOCAL =
    (typeof USERS_KEY !== "undefined" && USERS_KEY) ? USERS_KEY : "gw_users";

  const SESSION_KEY_LOCAL =
    (typeof SESSION_KEY !== "undefined" && SESSION_KEY) ? SESSION_KEY : "gw_currentUser";

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY_LOCAL)) ?? []; }
    catch { return []; }
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY_LOCAL, JSON.stringify(users));
  }

  function setSessionUser(email) {
    sessionStorage.setItem(
      SESSION_KEY_LOCAL,
      JSON.stringify({ email, loginAt: new Date().toISOString() })
    );
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  function isValidPassword(pwd) {
    const n = String(pwd).length;
    return n >= 6 && n <= 64;
  }

  function show(el, msg) {
    if (!el) return;
    el.style.display = "block";
    el.textContent = msg;
  }

  function hide(el) {
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
  }

  const btnLogin = document.getElementById("btnLogin");
  const btnRegister = document.getElementById("btnRegister");
  const panelLogin = document.getElementById("panelLogin");
  const panelRegister = document.getElementById("panelRegister");

  function openLogin() {
    if (!panelLogin || !panelRegister) return;
    panelLogin.style.display = "block";
    panelRegister.style.display = "none";
  }

  function openRegister() {
    if (!panelLogin || !panelRegister) return;
    panelLogin.style.display = "none";
    panelRegister.style.display = "block";
  }

  const goRegister = document.getElementById("goRegister");
  const goLogin = document.getElementById("goLogin");

  if (goRegister) goRegister.addEventListener("click", openRegister);
  if (goLogin) goLogin.addEventListener("click", openLogin);

  if (btnLogin) btnLogin.addEventListener("click", openLogin);
  if (btnRegister) btnRegister.addEventListener("click", openRegister);

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  const loginErr = document.getElementById("loginErr");
  const loginOk = document.getElementById("loginOk");
  const regErr = document.getElementById("regErr");
  const regOk = document.getElementById("regOk");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      hide(loginErr); hide(loginOk);

      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;

      if (!isValidEmail(email)) return show(loginErr, "Email invalide.");
      if (!isValidPassword(password)) return show(loginErr, "Le mot e passe doit contenir entre 6 et 64 caractères.");

      const users = readUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        show(loginErr, "Compte invalide. Redirection vers l'inscription.");
        openRegister();
        if (registerForm) registerForm.email.value = email;
        return;
      }

      if (user.password !== password) {
        show(loginErr, "Mot de passe incorrect.");
        return;
      }

      setSessionUser(email);
      show(loginOk, "Connexion...");
      setTimeout(() => window.location.href = "index.html", 600);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      hide(regErr); hide(regOk);

      const email = registerForm.email.value.trim();
      const pwd1 = registerForm.password.value;
      const pwd2 = registerForm.password2.value;

      if (!isValidEmail(email)) return show(regErr, "Email invalide.");
      if (!isValidPassword(pwd1)) return show(regErr, "Le mot e passe doit contenir entre 6 et 64 caractères.");
      if (pwd1 !== pwd2) return show(regErr, "Les mots de passe doivent être identiques.");

      const users = readUsers();
      if (users.some(u => u.email === email)) return show(regErr, "Email déjà utilisé.");

      users.push({ email, password: pwd1, createdAt: new Date().toISOString() });
      writeUsers(users);

      show(regOk, "Compte créé. Tu peux te connecter.");
      openLogin();
      if (loginForm) {
        loginForm.email.value = email;
        loginForm.password.value = "";
      }
    });
  }

  // Toggle show/hide password (eye button) 🙈 / 🐵
  document.querySelectorAll(".pwd-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;

      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.textContent = isHidden ? "🙈" : "🐵";
    });
  });

})();