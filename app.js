const canvas = document.getElementById("logoCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const controls = {
  tool: document.getElementById("toolSelect"),
  text: document.getElementById("logoText"),
  fontFamily: document.getElementById("fontFamily"),
  fontSize: document.getElementById("fontSize"),
  letterSpacing: document.getElementById("letterSpacing"),
  effectStrength: document.getElementById("effectStrength"),
  textColor: document.getElementById("textColor"),
  backgroundColor: document.getElementById("backgroundColor"),
  bold: document.getElementById("boldToggle"),
  italic: document.getElementById("italicToggle"),
  invert: document.getElementById("invertToggle"),
  animate: document.getElementById("animateToggle")
};

const labels = {
  fontSize: document.getElementById("fontSizeValue"),
  letterSpacing: document.getElementById("letterSpacingValue"),
  effectStrength: document.getElementById("effectStrengthValue")
};

const words = {
  blur: ["OAK", "PINE", "BIRCH", "MAPLE", "CEDAR", "WILLOW", "REDWOOD"],
  dither: ["Robin", "Sparrow", "Eagle", "Owl", "Parrot", "Swan", "Hawk"],
  line: ["Zebra", "Tiger", "Okapi", "Bongo", "Quagga", "Serval"],
  slice: ["Cheetah", "Falcon", "Gazelle", "Hare", "Ostrich", "Leopard"],
  type: ["Flock", "Herd", "Pack", "Pride", "School", "Swarm", "Colony"]
};

const electricColors = [
  "#000000",
  "#ADD8E6",
  "#FF96FF",
  "#ffcf37",
  "#B5651D",
  "#ff781e",
  "#b6b6ed",
  "#00FF00",
  "#FF3333"
];

const state = {
  effect: "type",
  text: "Flock",
  fontFamily: "Arial Black, Arial, sans-serif",
  fontSize: 400,
  letterSpacing: 0,
  effectStrength: 56,
  textColor: "#ffffff",
  backgroundColor: "#000000",
  bold: false,
  italic: false,
  invert: false,
  animate: false,
  time: 0,
  centerY: 0
};

const presets = {
  signal: {
    effect: "line",
    text: "Zebra",
    fontFamily: "Arial Black, Arial, sans-serif",
    fontSize: 410,
    letterSpacing: 0,
    effectStrength: 52,
    backgroundColor: "#000000",
    bold: false,
    italic: false,
    invert: false
  },
  glass: {
    effect: "blur",
    text: "BIRCH",
    fontFamily: "Arial Black, Arial, sans-serif",
    fontSize: 410,
    letterSpacing: -36,
    effectStrength: 70,
    backgroundColor: "#ff781e",
    bold: true,
    italic: true,
    invert: false
  },
  index: {
    effect: "dither",
    text: "Swan",
    fontFamily: "Arial Black, Arial, sans-serif",
    fontSize: 430,
    letterSpacing: 0,
    effectStrength: 76,
    backgroundColor: "#ADD8E6",
    bold: false,
    italic: false,
    invert: false
  },
  cut: {
    effect: "slice",
    text: "Falcon",
    fontFamily: "Arial Black, Arial, sans-serif",
    fontSize: 395,
    letterSpacing: 0,
    effectStrength: 63,
    backgroundColor: "#FF3333",
    bold: true,
    italic: true,
    invert: false
  }
};

let animationId = 0;

function queueRender() {
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(render);
}

function updateToggle(button, value) {
  button.classList.toggle("is-on", value);
  button.setAttribute("aria-pressed", String(value));
}

function syncFromControls() {
  state.effect = controls.tool.value;
  state.text = controls.text.value || "TYPE";
  state.fontFamily = controls.fontFamily.value;
  state.fontSize = Number(controls.fontSize.value);
  state.letterSpacing = Number(controls.letterSpacing.value);
  state.effectStrength = Number(controls.effectStrength.value);
  state.textColor = controls.textColor.value;
  state.backgroundColor = controls.backgroundColor.value;
  labels.fontSize.textContent = state.fontSize;
  labels.letterSpacing.textContent = state.letterSpacing;
  labels.effectStrength.textContent = state.effectStrength;
  queueRender();
}

function syncToControls() {
  controls.tool.value = state.effect;
  controls.text.value = state.text;
  controls.fontFamily.value = state.fontFamily;
  controls.fontSize.value = state.fontSize;
  controls.letterSpacing.value = state.letterSpacing;
  controls.effectStrength.value = state.effectStrength;
  controls.textColor.value = state.textColor;
  controls.backgroundColor.value = state.backgroundColor;
  updateToggle(controls.bold, state.bold);
  updateToggle(controls.italic, state.italic);
  updateToggle(controls.invert, state.invert);
  updateToggle(controls.animate, state.animate);
  syncFromControls();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function fontString(size = state.fontSize) {
  const style = state.italic ? "italic" : "normal";
  const weight = state.bold ? "900" : "500";
  return `${style} ${weight} ${size}px ${state.fontFamily}`;
}

function measureSpacedText(text, size) {
  ctx.font = fontString(size);
  return [...text].reduce((sum, char, index) => {
    return sum + ctx.measureText(char).width + (index ? state.letterSpacing : 0);
  }, 0);
}

function fitFontSize(text, maxWidth, maxHeight) {
  let size = state.fontSize;
  for (let i = 0; i < 32; i += 1) {
    if (measureSpacedText(text, size) <= maxWidth && size <= maxHeight) return size;
    size *= 0.9;
  }
  return Math.max(48, size);
}

function drawSpacedText(targetCtx, text, x, y, fillStyle, size) {
  targetCtx.save();
  targetCtx.font = fontString(size);
  targetCtx.textAlign = "left";
  targetCtx.textBaseline = "middle";
  targetCtx.fillStyle = fillStyle;
  const width = measureSpacedText(text, size);
  let cursor = x - width / 2;
  [...text].forEach((char, index) => {
    if (index) cursor += state.letterSpacing;
    targetCtx.fillText(char, cursor, y);
    cursor += targetCtx.measureText(char).width;
  });
  targetCtx.restore();
}

function createTextMask(text, size) {
  const mask = document.createElement("canvas");
  mask.width = canvas.width;
  mask.height = canvas.height;
  const maskCtx = mask.getContext("2d", { willReadFrequently: true });
  drawSpacedText(maskCtx, text, window.innerWidth / 2, state.centerY, "#ffffff", size);
  return mask;
}

function render(now = 0) {
  state.time = now;
  resizeCanvas();

  const w = window.innerWidth;
  const h = window.innerHeight;
  const text = state.text;
  const foreground = state.invert ? state.backgroundColor : state.textColor;
  const background = state.invert ? state.textColor : state.backgroundColor;
  state.centerY = w <= 768 ? h * 0.35 : h / 2;
  const size = fitFontSize(text, w <= 768 ? w * 0.58 : w * 0.82, w <= 768 ? h * 0.24 : h * 0.58);

  ctx.clearRect(0, 0, w, h);
  canvas.style.backgroundColor = background;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  if (state.effect === "type") drawType(text, foreground, size, w, h);
  if (state.effect === "blur") drawBlur(text, foreground, size, w, h);
  if (state.effect === "dither") drawDither(text, foreground, size, w, h);
  if (state.effect === "line") drawLine(text, foreground, size, w, h);
  if (state.effect === "slice") drawSlice(text, foreground, size, w, h);

  if (state.animate) {
    animationId = requestAnimationFrame(render);
  }
}

function drawBlur(text, color, size, w, h) {
  const blur = state.effectStrength > 55 ? 20 : 10;
  ctx.save();
  ctx.filter = `blur(${blur}px) contrast(4)`;
  drawSpacedText(ctx, text, w / 2, state.centerY, color, size);
  ctx.restore();
  ctx.globalAlpha = 0.28;
  drawSpacedText(ctx, text, w / 2, state.centerY, color, size);
  ctx.globalAlpha = 1;
}

function drawDither(text, color, size, w, h) {
  const mask = createTextMask(text, size);
  const data = mask.getContext("2d").getImageData(0, 0, mask.width, mask.height).data;
  const dpr = 1;
  const cell = Math.max(4, Math.round(22 - state.effectStrength * 0.16));
  const rounded = state.effectStrength > 48;
  ctx.fillStyle = color;

  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const px = Math.floor((x + cell / 2) * dpr);
      const py = Math.floor((y + cell / 2) * dpr);
      const alpha = data[(py * mask.width + px) * 4 + 3];
      const shouldDraw = state.invert ? alpha < 80 : alpha > 80;
      if (!shouldDraw) continue;
      const jitter = state.animate ? (Math.sin(state.time * 0.006 + x * 0.04 + y * 0.03) + 1) * 2 : 0;
      const block = Math.max(2, cell * 0.82 + jitter);
      if (rounded) {
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, block / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, block, block);
      }
    }
  }
}

function drawLine(text, color, size, w, h) {
  const mask = createTextMask(text, size);
  const data = mask.getContext("2d").getImageData(0, 0, mask.width, mask.height).data;
  const dpr = 1;
  const lineSize = Math.max(2, Math.round(1 + state.effectStrength * 0.17));
  const spacing = lineSize + 2;
  const angle = ((state.animate ? state.time * 0.012 : state.effectStrength * 1.8) % 180) * Math.PI / 180;
  const diagonal = Math.sqrt(w * w + h * h);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const pxv = -dy;
  const pyv = dx;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineSize;
  ctx.lineCap = "round";

  for (let d = -diagonal; d < diagonal; d += spacing) {
    let drawing = false;
    ctx.beginPath();
    for (let step = -diagonal; step < diagonal; step += 3) {
      const x = w / 2 + d * pxv + step * dx;
      const y = h / 2 + d * pyv + step * dy;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const mx = Math.floor(x * dpr);
      const my = Math.floor(y * dpr);
      const alpha = data[(my * mask.width + mx) * 4 + 3];
      const shouldDraw = state.invert ? alpha < 80 : alpha > 80;
      if (shouldDraw) {
        if (!drawing) {
          ctx.moveTo(x, y);
          drawing = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else if (drawing) {
        ctx.stroke();
        ctx.beginPath();
        drawing = false;
      }
    }
    if (drawing) ctx.stroke();
  }
}

function drawSlice(text, color, size, w, h) {
  const count = 3 + Math.round(state.effectStrength * 0.27);
  const sliceH = h / count;
  const maxOffset = state.animate
    ? Math.sin(state.time * 0.006) * 50
    : (state.effectStrength - 50);

  for (let i = 0; i < count; i += 1) {
    const y = i * sliceH;
    const offset = (i - (count - 1) / 2) * maxOffset * 0.18;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y, w, sliceH + 1);
    ctx.clip();
    drawSpacedText(ctx, text, w / 2 + offset, state.centerY, color, size);
    ctx.restore();
  }
}

function drawType(text, color, size, w, h) {
  const mask = createTextMask(text, size);
  const data = mask.getContext("2d").getImageData(0, 0, mask.width, mask.height).data;
  const dpr = 1;
  const cell = Math.max(9, Math.round(24 - state.effectStrength * 0.12));
  const alphabet = text.toUpperCase().replace(/[^A-Z0-9]/g, "") || "TYPE";
  ctx.save();
  ctx.font = `700 ${Math.max(10, cell * 0.9)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;

  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const mx = Math.floor((x + cell / 2) * dpr);
      const my = Math.floor((y + cell / 2) * dpr);
      const alpha = data[(my * mask.width + mx) * 4 + 3];
      const shouldDraw = state.invert ? alpha < 80 : alpha > 80;
      if (!shouldDraw) continue;
      const seed = Math.abs(Math.sin(x * 12.9898 + y * 78.233 + (state.animate ? state.time * 0.01 : 0)));
      const letter = alphabet[Math.floor(seed * alphabet.length) % alphabet.length];
      ctx.fillText(letter, x + cell / 2, y + cell / 2);
    }
  }
  ctx.restore();
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomize() {
  const effect = randomFrom(["blur", "dither", "line", "slice", "type"]);
  state.effect = effect;
  state.text = randomFrom(words[effect]);
  state.backgroundColor = randomFrom(electricColors);
  state.textColor = "#ffffff";
  state.fontSize = 320 + Math.round(Math.random() * 170);
  state.letterSpacing = effect === "blur" ? -40 + Math.round(Math.random() * 38) : 0;
  state.effectStrength = 35 + Math.round(Math.random() * 60);
  state.bold = Math.random() > 0.5;
  state.italic = Math.random() > 0.5;
  state.invert = false;
  syncToControls();
}

function exportPng() {
  const wasAnimating = state.animate;
  state.animate = false;
  render();
  state.animate = wasAnimating;
  const link = document.createElement("a");
  link.download = `${state.text.toLowerCase() || "type"}-${state.effect}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  if (state.animate) queueRender();
}

controls.tool.addEventListener("change", () => {
  state.effect = controls.tool.value;
  state.text = randomFrom(words[state.effect]);
  syncToControls();
});

Object.values(controls).forEach((control) => {
  if (control.tagName !== "BUTTON" && control !== controls.tool) {
    control.addEventListener("input", syncFromControls);
    control.addEventListener("change", syncFromControls);
  }
});

controls.bold.addEventListener("click", () => {
  state.bold = !state.bold;
  updateToggle(controls.bold, state.bold);
  queueRender();
});

controls.italic.addEventListener("click", () => {
  state.italic = !state.italic;
  updateToggle(controls.italic, state.italic);
  queueRender();
});

controls.invert.addEventListener("click", () => {
  state.invert = !state.invert;
  updateToggle(controls.invert, state.invert);
  queueRender();
});

controls.animate.addEventListener("click", () => {
  state.animate = !state.animate;
  updateToggle(controls.animate, state.animate);
  queueRender();
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    Object.assign(state, presets[button.dataset.preset]);
    syncToControls();
  });
});

document.getElementById("randomize").addEventListener("click", randomize);
document.getElementById("exportPng").addEventListener("click", exportPng);
window.addEventListener("resize", queueRender);

randomize();
render();
