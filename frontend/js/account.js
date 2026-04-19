(function () {
  const SESSION_KEY = "gw_session";
  const USERS_KEY = "gw_users";
  const MONKEY_CLOSED = String.fromCodePoint(0x1F435);
  const MONKEY_OPEN = String.fromCodePoint(0x1F648);
  const GAME_ALIASES = {
    memory: ["memory"],
    banana: ["banana", "typing"],
    snake: ["snake", "geo"]
  };

  // Lit l'utilisateur courant depuis la session locale.
  function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  // Analyse un JSON sans interrompre la page compte.
  function safeParse(raw, fallback) {
    try {
      const value = JSON.parse(raw);
      return value === null || value === undefined ? fallback : value;
    } catch {
      return fallback;
    }
  }

  // Echappe les valeurs affichees dans le HTML.
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  // Reutilise le hash simple du projet pour les mots de passe.
  function hash(password) {
    return btoa(password);
  }

  // Normalise l'email depuis les anciens formats de donnees.
  function normalizeEmail(entry) {
    return String(
      entry?.email ??
      entry?.utilisateur ??
      entry?.player ??
      entry?.user ??
      entry?.username ??
      ""
    ).trim();
  }

  // Aligne les anciennes cles de jeux sur les noms actuels.
  function normalizeGameKey(game) {
    const key = String(game || "").trim().toLowerCase();

    if (key === "typing") return "banana";
    if (key === "geo") return "snake";

    return key;
  }

  // Convertit une date ISO en timestamp exploitable.
  function dateMs(iso) {
    const time = new Date(iso || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  // Formate une date pour l'affichage francais.
  function fmtDate(iso) {
    if (!iso) return "-";

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("fr-FR");
  }

  // Lit un score standard quelle que soit sa cle d'origine.
  function genericToPoints(entry) {
    const value = Number(entry?.score ?? entry?.points ?? entry?.value ?? entry?.total ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  // Reconstitue un score memoire pour les anciennes tentatives.
  function memoryToPoints(entry) {
    const directScore = genericToPoints(entry);
    if (directScore > 0) return directScore;

    const niveau = Number(entry?.niveau ?? 1);
    const coups = Number(entry?.coups ?? 0);
    const temps = Number(entry?.temps ?? 999);

    // La formule garde le meme bareme que la sauvegarde memoire recente.
    return Math.max(0, Math.min(500, Math.round((niveau * 100) + Math.max(0, 200 - temps) - (coups * 5))));
  }

  // Choisit la bonne logique de score selon le jeu.
  function scoreForGame(gameKey, entry) {
    return gameKey === "memory" ? memoryToPoints(entry) : genericToPoints(entry);
  }

  // Recupere toutes les tentatives d'un jeu logique.
  function readGameScores(gameKey) {
    const aliases = GAME_ALIASES[gameKey] || [gameKey];
    const allScores = safeParse(localStorage.getItem("gw_scores"), []);

    return allScores.filter((entry) => aliases.includes(normalizeGameKey(entry?.game)));
  }

  // Trie les tentatives par score puis par date recente.
  function sortAttemptsByScore(entries, gameKey) {
    return [...entries].sort((a, b) => {
      const scoreDiff = scoreForGame(gameKey, b) - scoreForGame(gameKey, a);
      if (scoreDiff !== 0) return scoreDiff;

      return dateMs(b?.date) - dateMs(a?.date);
    });
  }

  // Recupere le meilleur score d'un joueur pour un jeu donne.
  function bestScoreForEmail(entries, email, gameKey) {
    const mine = entries.filter((entry) => normalizeEmail(entry) === email);
    if (mine.length === 0) return null;

    return scoreForGame(gameKey, sortAttemptsByScore(mine, gameKey)[0]);
  }

  // Affiche une ligne vide dans un tableau sans donnees.
  function renderEmptyRow(tbodyId, colspan) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="${colspan}">-</td></tr>`;
  }

  // Rend les cinq meilleures tentatives du jeu memoire.
  function renderMemoryRows(entries) {
    const tbody = document.getElementById("myMemoryRows");
    if (!tbody) return;
    if (entries.length === 0) return renderEmptyRow("myMemoryRows", 5);

    const rows = sortAttemptsByScore(entries, "memory")
      .slice(0, 5)
      .map((entry) => ({
        date: fmtDate(entry?.date),
        progression: `Niveau ${Number(entry?.completedLevels ?? entry?.niveau ?? 1)}`,
        coups: Number(entry?.coups ?? 0),
        temps: Number(entry?.temps ?? 0),
        score: scoreForGame("memory", entry)
      }));

    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(row.progression)}</td>
        <td>${row.coups}</td>
        <td>${row.temps}</td>
        <td>${row.score}</td>
      </tr>
    `).join("");
  }

  // Rend les cinq meilleures tentatives d'un jeu standard.
  function renderGenericRows(tbodyId, entries, gameKey) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    if (entries.length === 0) return renderEmptyRow(tbodyId, 2);

    const rows = sortAttemptsByScore(entries, gameKey)
      .slice(0, 5)
      .map((entry) => ({
        date: fmtDate(entry?.date),
        score: scoreForGame(gameKey, entry)
      }));

    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.date)}</td>
        <td>${row.score}</td>
      </tr>
    `).join("");
  }

  const user = getCurrentUser();
  const guard = document.querySelector("[data-auth-guard]");
  if (!user || !user.email) {
    if (guard) guard.style.display = "block";
    setTimeout(() => { window.location.href = "auth.html"; }, 700);
    return;
  }
  if (guard) guard.style.display = "none";

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

  const email = user.email;
  const accEmail = document.getElementById("accEmail");
  if (accEmail) accEmail.textContent = email;

  const memoryEntries = readGameScores("memory").filter((entry) => normalizeEmail(entry) === email);
  const bananaEntries = readGameScores("banana").filter((entry) => normalizeEmail(entry) === email);
  const snakeEntries = readGameScores("snake").filter((entry) => normalizeEmail(entry) === email);

  const bestMemory = bestScoreForEmail(readGameScores("memory"), email, "memory");
  const bestBanana = bestScoreForEmail(readGameScores("banana"), email, "banana");
  const bestSnake = bestScoreForEmail(readGameScores("snake"), email, "snake");

  const bestMemoryEl = document.getElementById("bestMemory");
  const bestBananaEl = document.getElementById("bestBanana");
  const bestSnakeEl = document.getElementById("bestSnake");
  const accTotal = document.getElementById("accTotal");

  if (bestMemoryEl) bestMemoryEl.textContent = bestMemory === null ? "-" : String(bestMemory);
  if (bestBananaEl) bestBananaEl.textContent = bestBanana === null ? "-" : String(bestBanana);
  if (bestSnakeEl) bestSnakeEl.textContent = bestSnake === null ? "-" : String(bestSnake);

  const total = (bestMemory ?? 0) + (bestBanana ?? 0) + (bestSnake ?? 0);
  if (accTotal) accTotal.textContent = total > 0 ? String(total) : "-";

  renderMemoryRows(memoryEntries);
  renderGenericRows("myBananaRows", bananaEntries, "banana");
  renderGenericRows("mySnakeRows", snakeEntries, "snake");

  const emailForm = document.getElementById("emailForm");
  const pwdForm = document.getElementById("pwdForm");
  const emailErr = document.getElementById("emailErr");
  const emailOk = document.getElementById("emailOk");
  const pwdErr = document.getElementById("pwdErr");
  const pwdOk = document.getElementById("pwdOk");

  // Affiche ou masque les messages de retour des formulaires.
  function showMsg(okEl, errEl, okMsg, errMsg) {
    if (okEl) {
      okEl.textContent = okMsg || "";
      okEl.style.display = okMsg ? "block" : "none";
      okEl.classList.remove("err");
    }
    if (errEl) {
      errEl.textContent = errMsg || "";
      errEl.style.display = errMsg ? "block" : "none";
      if (errMsg) errEl.classList.add("err");
    }
  }

  // Lit la liste complete des utilisateurs.
  function readUsers() {
    return safeParse(localStorage.getItem(USERS_KEY), []);
  }

  // Sauvegarde la liste complete des utilisateurs.
  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Repercute un changement d'email dans les anciens stockages de scores.
  function updateEmailEverywhere(oldEmail, newEmail) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!key.startsWith("gw_scores") && !key.endsWith("_scores") && !key.includes("scores")) continue;

      const list = safeParse(localStorage.getItem(key), null);
      if (!Array.isArray(list)) continue;

      let changed = false;
      for (const entry of list) {
        if (!entry || typeof entry !== "object") continue;

        const fields = ["email", "utilisateur", "player", "user", "username"];
        for (const field of fields) {
          if (String(entry[field] ?? "") === oldEmail) {
            entry[field] = newEmail;
            changed = true;
          }
        }
      }

      if (changed) localStorage.setItem(key, JSON.stringify(list));
    }
  }

  if (emailForm) {
    // Met a jour l'email du compte puis recharge la page.
    emailForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showMsg(emailOk, emailErr, "", "");

      const input = document.getElementById("newEmail");
      const newEmail = String(input?.value || "").trim();
      if (!newEmail || !newEmail.includes("@")) {
        return showMsg(emailOk, emailErr, "", "Email invalide.");
      }

      const users = readUsers();
      const alreadyUsed = users.some((entry) => String(entry.email || "") === newEmail);
      if (alreadyUsed) {
        return showMsg(emailOk, emailErr, "", "Cet email est d\u00e9j\u00e0 utilis\u00e9.");
      }

      const index = users.findIndex((entry) => String(entry.email || "") === email);
      if (index === -1) {
        return showMsg(emailOk, emailErr, "", "Utilisateur introuvable.");
      }

      users[index].email = newEmail;
      writeUsers(users);

      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...user,
          email: newEmail
        })
      );
      updateEmailEverywhere(email, newEmail);

      showMsg(emailOk, emailErr, "Email mis \u00e0 jour.", "");
      setTimeout(() => window.location.reload(), 300);
    });
  }

  if (pwdForm) {
    // Met a jour le mot de passe si les controles sont valides.
    pwdForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showMsg(pwdOk, pwdErr, "", "");

      const currentPwd = String(document.getElementById("currentPwd")?.value || "");
      const newPwd = String(document.getElementById("newPwd")?.value || "");
      const newPwd2 = String(document.getElementById("newPwd2")?.value || "");

      if (!newPwd || newPwd.length < 4) {
        return showMsg(pwdOk, pwdErr, "", "Mot de passe trop court (min 4 caract\u00e8res).");
      }
      if (newPwd !== newPwd2) {
        return showMsg(pwdOk, pwdErr, "", "Les deux mots de passe ne correspondent pas.");
      }

      const users = readUsers();
      const index = users.findIndex((entry) => String(entry.email || "") === email);
      if (index === -1) {
        return showMsg(pwdOk, pwdErr, "", "Utilisateur introuvable.");
      }

      if (String(users[index].password || "") !== hash(currentPwd)) {
        return showMsg(pwdOk, pwdErr, "", "Mot de passe actuel incorrect.");
      }

      users[index].password = hash(newPwd);
      writeUsers(users);

      showMsg(pwdOk, pwdErr, "Mot de passe mis \u00e0 jour.", "");
      pwdForm.reset();
    });
  }
})();
