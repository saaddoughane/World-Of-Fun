(function () {
  const flyer = document.getElementById("flyer");
  if (!flyer) return;

  const assets = [
    { src: "assets/avion.png", alt: "Flying plane" },
    { src: "assets/fusee.png", alt: "Flying rocket" }
  ];

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function animateOnce() {
    const a = pick(assets);
    const leftToRight = Math.random() < 0.5;

    flyer.src = a.src;
    flyer.alt = a.alt;

    const stage = document.querySelector(".globe-stage");
    if (!stage) return;

    const w = stage.clientWidth;

    const startX = leftToRight ? -160 : w + 160;
    const endX = leftToRight ? w + 160 : -160;

    const y0 = rand(40, 85);
    const yPeak = y0 - rand(55, 95);
    const yEnd = y0 + rand(-10, 20);

    const dur = rand(3400, 5200);

    flyer.style.opacity = "1";

    const tiltStart = leftToRight ? rand(-18, -6) : rand(6, 18);
    const tiltMid = leftToRight ? rand(8, 18) : rand(-18, -8);
    const tiltEnd = leftToRight ? rand(-10, 6) : rand(-6, 10);

    const scale = rand(0.9, 1.12);

    const anim = flyer.animate(
      [
        { transform: `translate(${startX}px, ${y0}px) rotate(${tiltStart}deg) scale(${scale})`, opacity: 0 },
        { transform: `translate(${(startX + endX) / 2}px, ${yPeak}px) rotate(${tiltMid}deg) scale(${scale})`, opacity: 1 },
        { transform: `translate(${endX}px, ${yEnd}px) rotate(${tiltEnd}deg) scale(${scale})`, opacity: 0 }
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
