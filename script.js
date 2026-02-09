/* Romantic Valentine Page (vanilla JS)
   - Typewriter lines
   - Floating DOM hearts
   - Canvas "heart bloom" particles
   - Sweet Yes/No ending (respectful either way)
*/

const $ = (s) => document.querySelector(s);

const fx = $("#fx");
const ctx = fx.getContext("2d", { alpha: true });

const startBtn = $("#start");
const headline = $("#headline");
const subtitle = $("#subtitle");

const l1 = $("#l1");
const l2 = $("#l2");
const l3 = $("#l3");

const question = $("#question");
const result = $("#result");
const resultTitle = $("#resultTitle");
const resultText = $("#resultText");
const replayBtn = $("#replay");

const yesBtn = $("#yes");
const noBtn = $("#no");
const music = $("#music");
const imageGallery = $("#imageGallery");
const galleryImages = document.querySelectorAll(".gallery-image");

let W = 0, H = 0, DPR = 1;
let running = false;
let particles = [];
let domHearts = [];
let rafId = null;
let imageSlideInterval = null;
let currentImageIndex = 0;

function resize() {
  DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);
  fx.width = Math.floor(W * DPR);
  fx.height = Math.floor(H * DPR);
  fx.style.width = W + "px";
  fx.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function rnd(min, max){ return Math.random() * (max - min) + min; }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

/* ----- Typewriter ----- */
async function typeLine(el, text, speed = 45) {
  el.textContent = "";
  el.classList.add("typing");

  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    // tiny natural variance for more human feel
    const jitter = rnd(-8, 12);
    await wait(Math.max(12, speed + jitter));
  }
  el.classList.remove("typing");
}

/* ----- Fade-in line by line ----- */
async function fadeInLine(el, text, delay = 0) {
  await wait(delay);
  el.textContent = text;
  el.style.opacity = "0";
  el.style.transform = "translateY(10px)";
  el.style.transition = "opacity 1.2s ease-out, transform 1.2s ease-out";
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
}

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

/* ----- Floating DOM hearts ----- */
function spawnDomHeart(x, y) {
  const h = document.createElement("div");
  h.className = "heart";
  document.body.appendChild(h);

  const size = rnd(10, 18);
  const drift = rnd(-80, 80);
  const rise = rnd(160, 260);
  const dur  = rnd(1200, 1900);

  h.style.width = size + "px";
  h.style.height = size + "px";

  // color variation
  const hueShift = rnd(-8, 10);
  h.style.background = `hsla(${340 + hueShift}, 100%, ${rnd(65, 78)}%, ${rnd(0.75, 0.95)})`;

  const start = performance.now();

  function step(now){
    const t = clamp((now - start) / dur, 0, 1);
    const e = easeOutCubic(t);

    const nx = x + drift * e;
    const ny = y - rise * e;

    const rot = 45 + rnd(-12, 12) * e;
    const sc = 1 + 0.25 * Math.sin(e * Math.PI);
    const op = 1 - t;

    h.style.left = nx + "px";
    h.style.top  = ny + "px";
    h.style.opacity = op.toFixed(3);
    h.style.transform = `translate(-50%,-50%) rotate(${rot}deg) scale(${sc})`;

    if (t < 1) requestAnimationFrame(step);
    else h.remove();
  }
  requestAnimationFrame(step);
}

/* ----- Canvas heart bloom particles ----- */
function heartPoint(t) {
  // classic heart param curve
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  return { x, y: -y }; // flip y for canvas
}

function burstHearts(cx, cy, count = 120) {
  for (let i = 0; i < count; i++) {
    const t = rnd(0, Math.PI * 2);
    const p = heartPoint(t);

    // scale & randomize slightly
    const scale = rnd(6, 11);
    const x = cx + p.x * scale + rnd(-6, 6);
    const y = cy + p.y * scale + rnd(-6, 6);

    const vx = (x - cx) * rnd(0.008, 0.016) + rnd(-0.6, 0.6);
    const vy = (y - cy) * rnd(0.008, 0.016) + rnd(-0.6, 0.6);

    particles.push({
      x: cx, y: cy,
      vx, vy,
      life: rnd(900, 1500),
      born: performance.now(),
      r: rnd(1.2, 2.6),
      hue: rnd(330, 355),
      sat: rnd(90, 100),
      lum: rnd(65, 80),
      a: rnd(0.7, 1)
    });
  }
}

function tick(now) {
  ctx.clearRect(0, 0, W, H);

  // soft vignette glow
  const g = ctx.createRadialGradient(W*0.5, H*0.35, 80, W*0.5, H*0.5, Math.max(W,H)*0.65);
  g.addColorStop(0, "rgba(255,77,141,0.08)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  particles = particles.filter(pt => (now - pt.born) < pt.life);

  for (const pt of particles) {
    const age = (now - pt.born);
    const t = clamp(age / pt.life, 0, 1);
    const e = 1 - Math.pow(t, 1.8);

    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vx *= 0.992;
    pt.vy *= 0.992;
    pt.vy += 0.006; // tiny gravity

    const alpha = pt.a * e;
    ctx.beginPath();
    ctx.fillStyle = `hsla(${pt.hue}, ${pt.sat}%, ${pt.lum}%, ${alpha})`;
    ctx.arc(pt.x, pt.y, pt.r * (0.85 + 0.6 * e), 0, Math.PI * 2);
    ctx.fill();
  }

  if (running) rafId = requestAnimationFrame(tick);
}

/* ----- Flow ----- */
function resetUI() {
  l1.textContent = "";
  l2.textContent = "";
  l3.textContent = "";
  question.hidden = true;
  result.hidden = true;
  headline.textContent = "Hei Rakas...";
  subtitle.textContent = "";
  subtitle.style.opacity = "0";
  subtitle.style.transform = "translateY(10px)";
  startBtn.disabled = false;
  startBtn.style.display = "";
  $(".card").classList.remove("question-focus");
  document.body.classList.remove("romantic-focus");
  question.style.opacity = "1";
  question.style.transform = "translateY(0)";
  resultTitle.style.opacity = "1";
  resultTitle.style.transform = "scale(1)";
  resultTitle.classList.remove("heartbeat-reveal");
  resultText.style.opacity = "1";
  resultText.style.transform = "scale(1)";
  resultText.classList.remove("love-reveal");
  particles = [];
  ctx.clearRect(0, 0, W, H);
  
  // Reset image gallery
  if (imageSlideInterval) {
    clearInterval(imageSlideInterval);
    imageSlideInterval = null;
  }
  imageGallery.style.display = "none";
  galleryImages.forEach(img => img.classList.remove("active"));
  currentImageIndex = 0;
  
  // Clear flower animation
  if (window.flowerInterval) {
    clearInterval(window.flowerInterval);
    window.flowerInterval = null;
  }
  
  // Stop music
  try {
    music.pause();
    music.currentTime = 0;
  } catch(e) {}
}

function startImageGallery() {
  imageGallery.style.opacity = "0";
  imageGallery.style.display = "block";
  
  // Position gallery initially in a random spot
  positionGalleryRandomly();
  
  // Fade in the gallery with romantic entrance
  requestAnimationFrame(() => {
    imageGallery.style.transition = "opacity 1.5s ease-in-out, transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)";
    imageGallery.style.opacity = "1";
  });

  // Function to position gallery in a random romantic spot
  function positionGalleryRandomly() {
    const isMobile = window.innerWidth <= 968;
    const galleryWidth = parseInt(getComputedStyle(imageGallery).width) || 400;
    const galleryHeight = parseInt(getComputedStyle(imageGallery).height) || 500;
    
    // Clear all positioning first
    imageGallery.style.left = "auto";
    imageGallery.style.right = "auto";
    imageGallery.style.top = "auto";
    imageGallery.style.bottom = "auto";
    
    if (isMobile) {
      // Mobile: random horizontal position, bottom area
      const maxX = window.innerWidth - galleryWidth;
      const x = rnd(20, Math.max(20, maxX - 20));
      const y = rnd(window.innerHeight * 0.55, window.innerHeight * 0.85);
      imageGallery.style.left = x + "px";
      imageGallery.style.bottom = (window.innerHeight - y - galleryHeight) + "px";
      imageGallery.style.transform = "translateX(0) translateY(0) scale(1)";
    } else {
      // Desktop: random position in corners or sides
      const positions = [
        { right: rnd(2, 8), top: rnd(10, 30) }, // Top right
        { right: rnd(2, 8), top: rnd(40, 60) }, // Middle right
        { right: rnd(2, 8), bottom: rnd(5, 15) }, // Bottom right
        { left: rnd(2, 8), top: rnd(15, 35) }, // Top left
        { left: rnd(2, 8), bottom: rnd(5, 20) }, // Bottom left
      ];
      const pos = positions[Math.floor(rnd(0, positions.length))];
      
      // Set positioning based on chosen position
      if (pos.right !== undefined) {
        imageGallery.style.right = pos.right + "%";
        imageGallery.style.left = "auto";
      }
      if (pos.left !== undefined) {
        imageGallery.style.left = pos.left + "%";
        imageGallery.style.right = "auto";
      }
      if (pos.top !== undefined) {
        imageGallery.style.top = pos.top + "%";
        imageGallery.style.bottom = "auto";
        imageGallery.style.transform = "translateY(-50%) scale(1)";
      }
      if (pos.bottom !== undefined) {
        imageGallery.style.bottom = pos.bottom + "%";
        imageGallery.style.top = "auto";
        imageGallery.style.transform = "translateY(0) scale(1)";
      }
    }
  }

  // Start image slideshow with romantic transitions
  function showNextImage() {
    const imageWrappers = document.querySelectorAll(".image-wrapper");
    const prevWrapper = imageWrappers[currentImageIndex];
    prevWrapper.querySelector(".gallery-image").classList.remove("active");
    
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    const nextWrapper = imageWrappers[currentImageIndex];
    nextWrapper.querySelector(".gallery-image").classList.add("active");
    
    // Move gallery to a new random position with smooth transition
    imageGallery.style.transition = "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)";
    positionGalleryRandomly();
    
    // Wait for position to update, then get new center
    setTimeout(() => {
      const galleryRect = imageGallery.getBoundingClientRect();
      const centerX = galleryRect.left + galleryRect.width / 2;
      const centerY = galleryRect.top + galleryRect.height / 2;
      
      // Create a heart-shaped pattern of floating hearts
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const radius = rnd(100, 180);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        spawnDomHeart(x, y);
      }
      
      // Burst of canvas hearts
      burstHearts(centerX, centerY, 150);
      
      // Additional romantic sparkles
      setTimeout(() => {
        for (let i = 0; i < 5; i++) {
          const x = centerX + rnd(-120, 120);
          const y = centerY + rnd(-120, 120);
          spawnDomHeart(x, y);
        }
      }, 500);
    }, 100);
  }

  // Show first image immediately, then cycle every 4.5 seconds for romantic pacing
  document.querySelectorAll(".image-wrapper")[0].querySelector(".gallery-image").classList.add("active");
  
  // Initial romantic burst
  setTimeout(() => {
    const galleryRect = imageGallery.getBoundingClientRect();
    const centerX = galleryRect.left + galleryRect.width / 2;
    const centerY = galleryRect.top + galleryRect.height / 2;
    burstHearts(centerX, centerY, 200);
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const radius = rnd(120, 200);
      spawnDomHeart(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    }
  }, 800);
  
  imageSlideInterval = setInterval(showNextImage, 4500);
  
  // Add floating animation to gallery
  animateGalleryFloat();
  
  // Continuous gentle heart spawns around gallery
  setInterval(() => {
    if (running && !question.hidden) {
      const galleryRect = imageGallery.getBoundingClientRect();
      const x = galleryRect.left + rnd(0, galleryRect.width);
      const y = galleryRect.top + rnd(0, galleryRect.height);
      spawnDomHeart(x, y);
    }
  }, 2000);
}

function animateGalleryFloat() {
  const gallery = imageGallery.querySelector(".gallery-frame");
  let floatOffset = 0;
  
  function float() {
    floatOffset += 0.002;
    const y = Math.sin(floatOffset) * 8;
    const x = Math.cos(floatOffset * 0.7) * 5;
    gallery.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(float);
  }
  float();
}

async function startSequence({ fast = false } = {}) {
  startBtn.disabled = true;

  // Fade in romantic music slowly
  try {
    music.volume = 0;
    music.loop = true;
    await music.play();
    
    // Fade in over 3 seconds
    const fadeDuration = 3000;
    const startTime = performance.now();
    const targetVolume = 0.35;
    
    function fadeIn() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / fadeDuration, 1);
      music.volume = targetVolume * progress;
      if (progress < 1) {
        requestAnimationFrame(fadeIn);
      }
    }
    fadeIn();
  } catch(e) {
    console.log("Audio play failed:", e);
  }

  // Start the romantic image gallery animation
  startImageGallery();

  running = true;
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);

  // Gentle sparkle bursts at start
  burstHearts(W * 0.5, H * 0.55, 90);

  // Fade in headline line by line
  await fadeInLine(headline, "Hei Rakas...", 300);
  await wait(800);
  await fadeInLine(subtitle, "Tein sulle jotain..", 0);
  await wait(1200);

  const lines = [
    "Oot ollut mun mielessä… joten tein sulle pikku yllärin.",
    "Jokainen sydän täällä on pieni kiitos siitä, että oot mun elämässä",
    "Ja mulla on tärkeä kysymys…"
  ];

  if (fast) {
    l1.textContent = lines[0];
    l2.textContent = lines[1];
    l3.textContent = lines[2];
  } else {
    await wait(600);
    await typeLine(l1, lines[0], 50); // Slower typing
    await wait(800);
    await typeLine(l2, lines[1], 50);
    await wait(1000);
    await typeLine(l3, lines[2], 50);
    await wait(1200);
  }

  // Fade back other content slightly before showing question
  const card = $(".card");
  card.classList.add("question-focus");
  
  await wait(400);
  
  // show question with sacred moment animation
  question.hidden = false;
  question.style.opacity = "0";
  question.style.transform = "translateY(20px)";
  startBtn.style.display = "none";
  
  requestAnimationFrame(() => {
    question.style.transition = "opacity 1.5s ease-out, transform 1.5s ease-out";
    question.style.opacity = "1";
    question.style.transform = "translateY(0)";
  });

  // a little bloom under the card
  burstHearts(W * 0.5, H * 0.68, 130);
}

/* ----- Interactions ----- */
startBtn.addEventListener("click", () => startSequence());

// Tap/click anywhere for sparkles once question is visible
window.addEventListener("pointerdown", (e) => {
  if (!running) return;
  if (!question.hidden && !result.hidden) return;

  const x = e.clientX;
  const y = e.clientY;

  // DOM hearts + canvas bloom
  for (let i = 0; i < 6; i++) spawnDomHeart(x + rnd(-14,14), y + rnd(-14,14));
  burstHearts(x, y, 60);
}, { passive: true });

/* ----- Romantic Flower Petals Animation ----- */
function spawnFlowerPetal(x, y) {
  const petal = document.createElement("div");
  petal.className = "flower-petal";
  document.body.appendChild(petal);

  const size = rnd(12, 20);
  const driftX = rnd(-150, 150);
  const driftY = rnd(-200, -100);
  const rotation = rnd(0, 360);
  const spin = rnd(-360, 360);
  const dur = rnd(2500, 4000);

  petal.style.width = size + "px";
  petal.style.height = size + "px";
  petal.style.left = x + "px";
  petal.style.top = y + "px";

  // Random flower colors (pink, rose, peach, white)
  const colors = [
    "rgba(255, 182, 193, 0.9)", // light pink
    "rgba(255, 105, 180, 0.9)", // hot pink
    "rgba(255, 192, 203, 0.9)", // pink
    "rgba(255, 160, 122, 0.9)", // light salmon
    "rgba(255, 218, 185, 0.9)", // peach
    "rgba(255, 228, 225, 0.9)", // misty rose
  ];
  petal.style.background = colors[Math.floor(rnd(0, colors.length))];

  const start = performance.now();

  function step(now) {
    const t = clamp((now - start) / dur, 0, 1);
    const e = 1 - Math.pow(t, 2); // ease out

    const nx = x + driftX * t + Math.sin(t * Math.PI * 2) * 30;
    const ny = y + driftY * t + Math.sin(t * Math.PI * 4) * 20;
    const rot = rotation + spin * t;
    const op = e;
    const sc = 1 - t * 0.3;

    petal.style.left = nx + "px";
    petal.style.top = ny + "px";
    petal.style.opacity = op.toFixed(3);
    petal.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`;

    if (t < 1) requestAnimationFrame(step);
    else petal.remove();
  }
  requestAnimationFrame(step);
}

function createFlowerAnimation() {
  // Create multiple waves of flower petals falling from top
  const cardRect = $(".card").getBoundingClientRect();
  const centerX = cardRect.left + cardRect.width / 2;
  const topY = cardRect.top;

  // First wave - from top center
  for (let i = 0; i < 25; i++) {
    setTimeout(() => {
      const x = centerX + rnd(-200, 200);
      spawnFlowerPetal(x, topY - 50);
    }, i * 80);
  }

  // Second wave - from sides
  setTimeout(() => {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const side = Math.random() > 0.5 ? "left" : "right";
        const x = side === "left" 
          ? cardRect.left - 50 + rnd(-30, 30)
          : cardRect.right + 50 + rnd(-30, 30);
        const y = topY + rnd(0, cardRect.height);
        spawnFlowerPetal(x, y);
      }, i * 100);
    }
  }, 500);

  // Third wave - gentle shower
  setTimeout(() => {
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const x = rnd(0, window.innerWidth);
        spawnFlowerPetal(x, -50);
      }, i * 120);
    }
  }, 1500);

  // Continuous gentle petals
  const flowerInterval = setInterval(() => {
    if (result.hidden) {
      clearInterval(flowerInterval);
      return;
    }
    const x = rnd(0, window.innerWidth);
    spawnFlowerPetal(x, -30);
  }, 300);

  // Store interval to clear later if needed
  window.flowerInterval = flowerInterval;
}

yesBtn.addEventListener("click", () => {
  // Sparkle burst on Yes button
  const btnRect = yesBtn.getBoundingClientRect();
  const centerX = btnRect.left + btnRect.width / 2;
  const centerY = btnRect.top + btnRect.height / 2;
  burstHearts(centerX, centerY, 100);
  for (let i = 0; i < 8; i++) {
    spawnDomHeart(centerX + rnd(-30, 30), centerY + rnd(-30, 30));
  }
  
  // Hide question immediately
  question.hidden = true;
  
  // Add romantic focus effect (darken background, add glow)
  document.body.classList.add("romantic-focus");
  
  // Cinematic pause (800ms) before revealing result
  setTimeout(() => {
    result.hidden = false;
    resultTitle.textContent = "Yey 🥹💘 sait mun sydämen hymyilemään, niin kuin aina teet❤️❤️";
    
    // Initially hide resultText
    resultText.textContent = "RAKASTAN SUA KUUHUN JA TAKAISIN";
    resultText.style.opacity = "0";
    resultText.style.transform = "scale(0.9)";
    resultText.classList.remove("love-reveal");
    
    // Animate resultTitle with heartbeat scale
    resultTitle.style.opacity = "0";
    resultTitle.style.transform = "scale(0.8)";
    resultTitle.classList.add("heartbeat-reveal");
    
    requestAnimationFrame(() => {
      resultTitle.style.transition = "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
      resultTitle.style.opacity = "1";
      resultTitle.style.transform = "scale(1)";
    });
    
    // Reveal "RAKASTAN SINUA" after title animation (900ms delay)
    setTimeout(() => {
      resultText.classList.add("love-reveal");
      resultText.style.transition = "opacity 1.2s ease-out, transform 1.2s ease-out";
      resultText.style.opacity = "1";
      resultText.style.transform = "scale(1)";
      
      // Trigger heart/flower burst when "RAKASTAN SINUA" becomes visible
      const cardRect = $(".card").getBoundingClientRect();
      const centerX = cardRect.left + cardRect.width / 2;
      const centerY = cardRect.top + cardRect.height / 2;
      
      // Celebratory bloom
      burstHearts(centerX, centerY, 280);
      
      // Additional heart burst
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const radius = rnd(100, 200);
        spawnDomHeart(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      }
      
      // Romantic flower petal animation
      createFlowerAnimation();
    }, 900);
  }, 800);
});

noBtn.addEventListener("mouseenter", dodgeNo);
noBtn.addEventListener("touchstart", (e) => { e.preventDefault(); dodgeNo(); }, { passive: false });
noBtn.addEventListener("click", () => {
  // If she does manage to click No, be kind.
  question.hidden = true;
  result.hidden = false;

  resultTitle.textContent = "Ei se mitään 💗";
  resultText.textContent =
    "Kiitos rehellisyydestäsi. " +
    "Sinä olet silti minulle tärkeä, ja olen kiitollinen sinulle.";

  burstHearts(W * 0.5, H * 0.4, 120);
});

function dodgeNo() {
  // playful dodge inside the card bounds with smooth animation
  const card = document.querySelector(".card");
  const rect = card.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();

  const pad = 20;
  const maxX = rect.left + rect.width - btnRect.width - pad;
  const maxY = rect.top + rect.height - btnRect.height - pad;

  // Calculate new position (avoid current position)
  let newX, newY;
  let attempts = 0;
  do {
    newX = rnd(rect.left + pad, maxX);
    newY = rnd(rect.top + pad, maxY);
    attempts++;
  } while (
    attempts < 10 && 
    Math.abs(newX - (btnRect.left)) < 50 && 
    Math.abs(newY - (btnRect.top)) < 50
  );

  // Add smooth transition
  noBtn.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
  noBtn.style.position = "fixed";
  noBtn.style.left = newX + "px";
  noBtn.style.top = newY + "px";
  
  // Add playful rotation and scale
  const rotation = rnd(-15, 15);
  const scale = rnd(0.95, 1.05);
  noBtn.style.transform = `rotate(${rotation}deg) scale(${scale})`;
  
  // Reset transform after animation
  setTimeout(() => {
    noBtn.style.transition = "all 0.3s ease-out";
    noBtn.style.transform = "rotate(0deg) scale(1)";
  }, 400);

  // Spawn hearts at old and new position
  const oldCenterX = btnRect.left + btnRect.width/2;
  const oldCenterY = btnRect.top + btnRect.height/2;
  spawnDomHeart(oldCenterX, oldCenterY);
  burstHearts(oldCenterX, oldCenterY, 30);
  
  setTimeout(() => {
    spawnDomHeart(newX + btnRect.width/2, newY + btnRect.height/2);
    burstHearts(newX + btnRect.width/2, newY + btnRect.height/2, 40);
  }, 200);
}

replayBtn.addEventListener("click", () => {
  // stop and restart
  resetUI();
  // reset "No" button position if moved
  noBtn.style.position = "";
  noBtn.style.left = "";
  noBtn.style.top = "";
  noBtn.style.transform = "";
  noBtn.style.transition = "";
  // optional: music.currentTime = 0;
});

/* Start with a tiny idle animation bloom */
running = true;
rafId = requestAnimationFrame(tick);
burstHearts(W * 0.5, H * 0.55, 70);

/* Continuous gentle background hearts */
function spawnBackgroundHeart() {
  const x = rnd(0, W);
  const y = H + 20;
  const h = document.createElement("div");
  h.className = "background-heart";
  document.body.appendChild(h);
  
  const size = rnd(4, 8);
  const drift = rnd(-30, 30);
  const rise = rnd(200, 350);
  const dur = rnd(8000, 12000);
  
  h.style.width = size + "px";
  h.style.height = size + "px";
  h.style.left = x + "px";
  h.style.top = y + "px";
  h.style.opacity = rnd(0.3, 0.6);
  h.style.background = `hsla(${rnd(330, 360)}, ${rnd(70, 90)}%, ${rnd(75, 85)}%, ${rnd(0.3, 0.6)})`;
  
  const start = performance.now();
  function step(now) {
    const t = clamp((now - start) / dur, 0, 1);
    const nx = x + drift * t + Math.sin(t * Math.PI * 4) * 20;
    const ny = y - rise * t;
    const op = (1 - t) * rnd(0.3, 0.6);
    
    h.style.left = nx + "px";
    h.style.top = ny + "px";
    h.style.opacity = op.toFixed(3);
    
    if (t < 1) requestAnimationFrame(step);
    else h.remove();
  }
  requestAnimationFrame(step);
}

// Spawn background hearts continuously
setInterval(() => {
  if (!running || question.hidden === false) return;
  spawnBackgroundHeart();
}, 3000);
