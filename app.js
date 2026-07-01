const canvas = document.getElementById("logoCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const controls = {
  text: document.getElementById("logoText"),
  fontFamily: document.getElementById("fontFamily"),
  canvasRatio: document.getElementById("canvasRatio"),
  fontSize: document.getElementById("fontSize"),
  letterSpacing: document.getElementById("letterSpacing"),
  effectStrength: document.getElementById("effectStrength"),
  textColor: document.getElementById("textColor"),
  backgroundColor: document.getElementById("backgroundColor"),
  bold: document.getElementById("boldToggle"),
  italic: document.getElementById("italicToggle"),
  invert: document.getElementById("invertToggle")
};

const labels = {
  fontSize: document.getElementById("fontSizeValue"),
  letterSpacing: document.getElementById("letterSpacingValue"),
  effectStrength: document.getElementById("effectStrengthValue")
};

const state = {
  effect: "type",
  text: "AURA",
  fontFamily: "Arial Black, Arial, sans-serif",
  ratio: "16:10",
  fontSize: 330,
  letterSpacing: -18,
  effectStrength: 56,
  textColor: "#ffffff",
  backgroundColor: "#111111",
  bold: true,
  italic: false,
  invert: false
};

const presets = {
  signal: {
    effect: "line",
    text: "SIGNAL",
    fontFamily: "Trebuchet MS, Arial, sans-serif",
    fontSize: 270,
    letterSpacing: 16,
    effectStrength: 62,
    textColor: "#f9fafb",
    backgroundColor: "#0f766e",
    bold: true,
    italic: false,
    invert: false
  },
  glass: {
    effect: "blur",
    text: "GLASS",
    fontFamily: "Georgia, serif",
    fontSize: 330,
    letterSpacing: -28,
    effectStrength: 72,
    textColor: "#ffffff",
    backgroundColor: "#161616",
    bold: true,
    italic: true,
    invert: false
  },
  index: {
    effect: "pixel",
    text: "INDEX",
    fontFamily: "Courier New, monospace",
    fontSize: 315,
    letterSpacing: -8,
    effectStrength: 78,
    textColor: "#f8fafc",
    backgroundColor: "#1d4ed8",
    bold: true,
    italic: false,
    invert: false
  },
  cut: {
    effect: "slice",
    text: "CUT",
    fontFamily: "Impact, Haettenschweiler, sans-serif",
    fontSize: 420,
    letterSpacing: 8,
    effectStrength: 64,
    textColor: "#fff7ed",
    backgroundColor: "#9a3412",
    bold: false,
    italic: false,
    invert: false
  }
};

const randomWords = ["AURA", "NOVA", "KIND", "MESH", "VOLT", "MONO", "ORBIT", "FIELD", "SHAPE"];
const randomColors = ["#111111", "#0f766e", "#9a3412", "#1d4ed8", "#5b21b6", "#365314", "#7f1d1d"];

let renderQueued = false;

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function syncFromControls() {
  state.text = controls.text.value || "TYPE";
  state.fontFamily = controls.fontFamily.value;
  state.ratio = controls.canvasRatio.value;
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
  controls.text.value = state.text;
  controls.fontFamily.value = state.fontFamily;
  controls.canvasRatio.value = state.ratio;
  controls.fontSize.value = state.fontSize;
  controls.letterSpacing.value = state.letterSpacing;
  controls.effectStrength.value = state.effectStrength;
  controls.textColor.value = state.textColor;
  controls.backgroundColor.value = state.backgroundColor;
  updateToggle(controls.bold, state.bold);
  updateToggle(controls.italic, state.italic);
  updateToggle(controls.invert, state.invert);
  document.querySelectorAll("[data-effect]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.effect === state.effect);
  });
  syncFromControls();
}

function updateToggle(button, value) {
  button.classList.toggle("is-on", value);
  button.setAttribute("aria-pressed", String(value));
}

function getCanvasSize() {
  const stage = canvas.parentElement.getBoundingClientRect();
  const [rw, rh] = state.ratio.split(":").map(Number);
  let width = stage.width;
  let height = width * (rh / rw);
  if (height > stage.height) {
    height = stage.height;
    width = height * (rw / rh);
  }
  return {
    cssWidth: Math.max(320, width),
    cssHeight: Math.max(240, height)
  };
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { cssWidth, cssHeight } = getCanvasSize();
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function fontString(size = state.fontSize) {
  const style = state.italic ? "italic" : "normal";
  const weight = state.bold ? "900" : "500";
  return `${style} ${weight} ${size}px ${state.fontFamily}`;
}

function measureSpacedText(text, size = state.fontSize) {
  ctx.font = fontString(size);
  return [...text].reduce((sum, char, index) => {
    return sum + ctx.measureText(char).width + (index ? state.letterSpacing : 0);
  }, 0);
}

function fitFontSize(text, maxWidth, maxHeight) {
  let size = state.fontSize;
  for (let i = 0; i < 12; i += 1) {
    const width = measureSpacedText(text, size);
    if (width <= maxWidth && size <= maxHeight) return size;
    size *= 0.9;
  }
  return Math.max(60, size);
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
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  maskCtx.scale(dpr, dpr);
  drawSpacedText(maskCtx, text, canvas.clientWidth / 2, canvas.clientHeight / 2, "#ffffff", size);
  return mask;
}

function render() {
  resizeCanvas();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const text = state.text.toUpperCase();
  const foreground = state.invert ? state.backgroundColor : state.textColor;
  const background = state.invert ? state.textColor : state.backgroundColor;
  const size = fitFontSize(text, w * 0.84, h * 0.58);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  if (state.effect === "type") {
    drawSpacedText(ctx, text, w / 2, h / 2, foreground, size);
  }

  if (state.effect === "blur") {
    drawBlur(text, foreground, size, w, h);
  }

  if (state.effect === "pixel") {
    drawPixel(text, foreground, size, w, h);
  }

  if (state.effect === "slice") {
    drawSlice(text, foreground, size, w, h);
  }

  if (state.effect === "line") {
    drawLine(text, foreground, size, w, h);
  }

  drawFrame(w, h);
}

function drawBlur(text, color, size, w, h) {
  const blur = 2 + state.effectStrength * 0.18;
  ctx.save();
  ctx.filter = `blur(${blur}px) contrast(${1.4 + state.effectStrength / 80})`;
  drawSpacedText(ctx, text, w / 2, h / 2, color, size);
  ctx.restore();
  ctx.globalAlpha = 0.44;
  drawSpacedText(ctx, text, w / 2, h / 2, color, size);
  ctx.globalAlpha = 1;
}

function drawPixel(text, color, size, w, h) {
  const mask = createTextMask(text, size);
  const maskCtx = mask.getContext("2d");
  const data = maskCtx.getImageData(0, 0, mask.width, mask.height).data;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cell = Math.max(5, Math.round(22 - state.effectStrength * 0.16));
  const gap = Math.max(1, Math.round(cell * 0.18));
  ctx.fillStyle = color;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const px = Math.floor((x + cell / 2) * dpr);
      const py = Math.floor((y + cell / 2) * dpr);
      const alpha = data[(py * mask.width + px) * 4 + 3];
      if (alpha > 80) {
        const jitter = (Math.sin(x * 0.07 + y * 0.05) + 1) * state.effectStrength * 0.012;
        const block = Math.max(2, cell - gap + jitter);
        ctx.fillRect(x, y, block, block);
      }
    }
  }
}

function drawSlice(text, color, size, w, h) {
  const mask = createTextMask(text, size);
  const sliceCount = 10 + Math.round(state.effectStrength / 7);
  const sliceHeight = h / sliceCount;
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < sliceCount; i += 1) {
    const y = i * sliceHeight;
    const offset = Math.sin(i * 1.73) * state.effectStrength * 0.9;
    ctx.drawImage(mask, 0, y * (mask.height / h), mask.width, sliceHeight * (mask.height / h), offset, y, w, sliceHeight + 1);
  }
  ctx.globalCompositeOperation = "source-in";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawLine(text, color, size, w, h) {
  const mask = createTextMask(text, size);
  const maskCtx = mask.getContext("2d");
  const data = maskCtx.getImageData(0, 0, mask.width, mask.height).data;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const spacing = Math.max(6, Math.round(24 - state.effectStrength * 0.16));
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.2, spacing * 0.16);
  ctx.lineCap = "round";
  for (let y = spacing; y < h; y += spacing) {
    ctx.beginPath();
    let drawing = false;
    for (let x = 0; x < w; x += 4) {
      const wave = Math.sin(x * 0.02 + y * 0.04) * state.effectStrength * 0.05;
      const px = Math.floor(x * dpr);
      const py = Math.floor(y * dpr);
      const alpha = data[(py * mask.width + px) * 4 + 3];
      if (alpha > 80) {
        if (!drawing) {
          ctx.moveTo(x, y + wave);
          drawing = true;
        } else {
          ctx.lineTo(x, y + wave);
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

function drawFrame(w, h) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  ctx.restore();
}

function setEffect(effect) {
  state.effect = effect;
  document.querySelectorAll("[data-effect]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.effect === effect);
  });
  queueRender();
}

function randomize() {
  state.text = randomWords[Math.floor(Math.random() * randomWords.length)];
  state.effect = ["type", "blur", "pixel", "slice", "line"][Math.floor(Math.random() * 5)];
  state.backgroundColor = randomColors[Math.floor(Math.random() * randomColors.length)];
  state.textColor = Math.random() > 0.2 ? "#ffffff" : "#fef3c7";
  state.fontSize = 230 + Math.round(Math.random() * 210);
  state.letterSpacing = -42 + Math.round(Math.random() * 96);
  state.effectStrength = 32 + Math.round(Math.random() * 62);
  state.bold = Math.random() > 0.25;
  state.italic = Math.random() > 0.68;
  state.invert = false;
  syncToControls();
}

function exportPng() {
  render();
  const link = document.createElement("a");
  link.download = `${state.text.toLowerCase() || "logo"}-${state.effect}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

document.querySelectorAll("[data-effect]").forEach((button) => {
  button.addEventListener("click", () => setEffect(button.dataset.effect));
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    Object.assign(state, presets[button.dataset.preset]);
    syncToControls();
  });
});

Object.values(controls).forEach((control) => {
  if (control.tagName !== "BUTTON") {
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

document.getElementById("randomize").addEventListener("click", randomize);
document.getElementById("exportPng").addEventListener("click", exportPng);
window.addEventListener("resize", queueRender);

syncToControls();
