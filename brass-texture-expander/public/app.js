const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const dropText = document.querySelector("#dropText");
const sourceThumb = document.querySelector("#sourceThumb");
const generateBtn = document.querySelector("#generateBtn");
const promptInput = document.querySelector("#promptInput");
const statusEl = document.querySelector("#status");
const ratioButtons = [...document.querySelectorAll("[data-ratio]")];
const resultImage = document.querySelector("#resultImage");
const emptyState = document.querySelector("#emptyState");
const previewTitle = document.querySelector("#previewTitle");
const downloadLink = document.querySelector("#downloadLink");
const healthDot = document.querySelector("#healthDot");
const healthText = document.querySelector("#healthText");

let imageDataUrl = "";
let selectedRatio = "16:9";
let downloadObjectUrl = "";

const outputSpecs = {
  "16:9": {
    width: 3840,
    height: 2160,
    filename: "brass-texture-16x9-4k.png",
    title: "16:9 brass texture - 3840 x 2160",
  },
  "1:1": {
    width: 4096,
    height: 4096,
    filename: "brass-texture-square-4k.png",
    title: "Square brass texture - 4096 x 4096",
  },
};

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
};

const updateDownloadState = (href = "") => {
  if (downloadObjectUrl) URL.revokeObjectURL(downloadObjectUrl);
  downloadObjectUrl = href;
  downloadLink.href = href || "#";
  downloadLink.setAttribute("aria-disabled", href ? "false" : "true");
};

const clearResult = (title = "No generated texture yet") => {
  resultImage.removeAttribute("src");
  resultImage.style.display = "none";
  emptyState.style.display = "block";
  previewTitle.textContent = title;
  updateDownloadState("");
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Could not read image."));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load generated image."));
    image.src = src;
  });

const exactPngBlob = async (src, spec) => {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#b78334";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not prepare PNG download."));
    }, "image/png");
  });
};

const showExactPng = async (src, spec) => {
  const blob = await exactPngBlob(src, spec);
  const url = URL.createObjectURL(blob);
  updateDownloadState(url);
  resultImage.src = url;
  resultImage.style.display = "block";
  emptyState.style.display = "none";
};

const handleFile = async (file) => {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("Choose a PNG, JPG, or WebP image.", true);
    return;
  }
  if (file.size > 14 * 1024 * 1024) {
    setStatus("That source is too large. Try an image under 14 MB.", true);
    return;
  }

  imageDataUrl = await fileToDataUrl(file);
  sourceThumb.src = imageDataUrl;
  sourceThumb.style.display = "block";
  dropText.style.display = "none";
  generateBtn.disabled = false;
  clearResult("Ready to generate");
  setStatus(`${file.name} loaded.`);
};

const generateTexture = async () => {
  if (!imageDataUrl) return;
  const spec = outputSpecs[selectedRatio];
  generateBtn.disabled = true;
  clearResult("Generating texture");
  setStatus("Generating texture with Gemini. This can take a minute.");

  try {
    const prompt = promptInput.value.trim();
    const response = await fetch("/api/expand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl, aspectRatio: selectedRatio, prompt }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);

    previewTitle.textContent = spec.title;
    downloadLink.download = spec.filename;
    setStatus("Generated. Preparing exact-size PNG download.");

    await showExactPng(body.imageDataUrl, spec);
    setStatus(`Ready: ${spec.width} x ${spec.height} PNG.`);
  } catch (error) {
    clearResult("Generation failed");
    setStatus(error instanceof Error ? error.message : "Generation failed.", true);
  } finally {
    generateBtn.disabled = !imageDataUrl;
  }
};

ratioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedRatio = button.dataset.ratio;
    ratioButtons.forEach((item) => item.classList.toggle("active", item === button));
    clearResult(resultImage.style.display === "block" ? "Generate again for the new shape" : "No generated texture yet");
  });
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragging");
});

dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragging");
  await handleFile(event.dataTransfer.files?.[0]);
});

fileInput.addEventListener("change", async () => {
  await handleFile(fileInput.files?.[0]);
});

generateBtn.addEventListener("click", generateTexture);

downloadLink.addEventListener("click", (event) => {
  if (!downloadObjectUrl) event.preventDefault();
});

fetch("/api/health")
  .then((response) => response.json())
  .then((body) => {
    healthDot.classList.toggle("ok", Boolean(body.hasKey));
    healthText.textContent = body.hasKey ? "Gemini ready" : "Gemini key missing";
  })
  .catch(() => {
    healthText.textContent = "Server offline";
  });
