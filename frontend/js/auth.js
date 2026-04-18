(function () {
  const USERS_KEY_LOCAL =
    (typeof USERS_KEY !== "undefined" && USERS_KEY) ? USERS_KEY : "gw_users";

  const SESSION_KEY_LOCAL = "gw_session";
  const MONKEY_CLOSED = String.fromCodePoint(0x1F435);
  const MONKEY_OPEN = String.fromCodePoint(0x1F648);

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY_LOCAL)) ?? []; }
    catch { return []; }
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY_LOCAL, JSON.stringify(users));
  }

  function setSessionUser(email) {
    localStorage.setItem(
      SESSION_KEY_LOCAL,
      JSON.stringify({ email, loginAt: new Date().toISOString() })
    );
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  function isValidPassword(password) {
    const length = String(password).length;
    return length >= 6 && length <= 64;
  }

  function show(element, message) {
    if (!element) return;
    element.style.display = "block";
    element.textContent = message;
  }

  function hide(element) {
    if (!element) return;
    element.style.display = "none";
    element.textContent = "";
  }

  function hash(password) {
    return btoa(password);
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
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      hide(loginErr);
      hide(loginOk);

      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;

      if (!isValidEmail(email)) return show(loginErr, "Email invalide.");
      if (!isValidPassword(password)) {
        return show(loginErr, "Le mot de passe doit contenir entre 6 et 64 caract\u00e8res.");
      }

      const users = readUsers();
      const user = users.find((entry) => entry.email === email);

      if (!user) {
        show(loginErr, "Compte invalide. Redirection vers l'inscription.");
        openRegister();
        if (registerForm) registerForm.email.value = email;
        return;
      }

      if (user.password !== hash(password)) {
        show(loginErr, "Mot de passe incorrect.");
        return;
      }

      setSessionUser(email);
      show(loginOk, "Connexion...");
      setTimeout(() => window.location.href = "index.html", 600);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      hide(regErr);
      hide(regOk);

      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;
      const password2 = registerForm.password2.value;

      if (!isValidEmail(email)) return show(regErr, "Email invalide.");
      if (!isValidPassword(password)) {
        return show(regErr, "Le mot de passe doit contenir entre 6 et 64 caract\u00e8res.");
      }
      if (password !== password2) {
        return show(regErr, "Les mots de passe doivent \u00eatre identiques.");
      }

      const users = readUsers();
      if (users.some((entry) => entry.email === email)) {
        return show(regErr, "Email d\u00e9j\u00e0 utilis\u00e9.");
      }

      users.push({ email, password: hash(password), createdAt: new Date().toISOString() });
      writeUsers(users);

      setSessionUser(email);
      show(regOk, "Compte cr\u00e9\u00e9. Connexion...");
      setTimeout(() => window.location.href = "index.html", 600);
    });
  }

  document.querySelectorAll(".pwd-toggle").forEach((btn) => {
    btn.textContent = MONKEY_CLOSED;
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;

      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.textContent = isHidden ? MONKEY_OPEN : MONKEY_CLOSED;
    });
  });
})();
