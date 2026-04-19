(function () {
  // Anime l'engin volant qui traverse le globe.
  const flyer = document.getElementById("flyer");
  if (!flyer) return;

  const assets = [
    { src: "assets/avion.png", alt: "Avion en vol" },
    { src: "assets/fusee.png", alt: "Fus\u00e9e en vol" }
  ];

  // Tire une valeur aleatoire dans un intervalle.
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Selectionne un element au hasard dans une liste.
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Lance un trajet aerien unique avant le suivant.
  function animateOnce() {
    const a = pick(assets);
    const leftToRight = Math.random() < 0.5;
    const flip = leftToRight ? 1 : -1;

    flyer.src = a.src;
    flyer.alt = a.alt;

    const stage = document.querySelector(".globe-stage");
    if (!stage) return;

    // La largeur de scene sert a calculer une entree et une sortie hors cadre.
    const w = stage.clientWidth;

    const startX = leftToRight ? -160 : w + 160;
    const endX = leftToRight ? w + 160 : -160;

    const y0 = rand(40, 85);
    const yPeak = y0 - rand(55, 95);
    const yEnd = y0 + rand(-10, 20);

    // La duree variable evite une boucle trop mecanique.
    const dur = rand(3400, 5200);

    flyer.style.opacity = "1";

    const tiltStart = leftToRight ? rand(-18, -6) : rand(6, 18);
    const tiltMid = leftToRight ? rand(8, 18) : rand(-18, -8);
    const tiltEnd = leftToRight ? rand(-10, 6) : rand(-6, 10);

    // Le scale negatif retourne visuellement le sprite selon le sens.
    const scale = rand(0.9, 1.12);

    const anim = flyer.animate(
      [
        { transform: `translate(${startX}px, ${y0}px) rotate(${tiltStart}deg) scale(${flip * scale}, ${scale})`},
        { transform: `translate(${(startX + endX) / 2}px, ${yPeak}px) rotate(${tiltMid}deg) scale(${flip * scale}, ${scale})`},
        { transform: `translate(${endX}px, ${yEnd}px) rotate(${tiltEnd}deg) scale(${flip * scale}, ${scale})`}
      ],
      { duration: dur, easing: "ease-in-out", fill: "forwards" }
    );

    anim.onfinish = () => {
      flyer.style.opacity = "0";
      const wait = rand(900, 1800);
      setTimeout(animateOnce, wait);
    };
  }

  const firstWait = rand(350, 900);
  setTimeout(animateOnce, firstWait);
})();

(function () {
  // Revele la bulle du robot avec un leger delai.
  const assistant = document.querySelector(".hero-assistant");
  const bubble = document.querySelector(".hero-bubble");
  if (!assistant || !bubble) return;

  setTimeout(() => {
    assistant.classList.add("is-bubble-on");
  }, 3000);
})();
