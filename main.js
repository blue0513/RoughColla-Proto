// -----------------------------
// Setup
// -----------------------------

const canvas = new fabric.Canvas("canvas", {
  width: window.innerWidth,
  height: window.innerHeight - 150,
  backgroundColor: "rgb(255,255,255)",
  preserveObjectStacking: true,
});
const defaultTextBoxOption = {
  left: 50,
  top: 50,
  width: 150,
  fontSize: 20,
};
const localStorageKey = "temp";

// declare in style.css
const fonts = [
  "Times New Roman",
  "Noto Sans JP",
  "Shippori Antique B1",
  "Mochiy Pop One",
  "Zen Antique",
  "Zen Old Mincho",
];

const dropArea = document.getElementById("drop-area");
const imageInput = document.getElementById("img-input");
const imageRemove = document.getElementById("imageRemove");
const objectCopy = document.getElementById("object-copy");
const objectPaste = document.getElementById("object-paste");
const objectFront = document.getElementById("object-front");
const objectBack = document.getElementById("object-back");
const textAdd = document.getElementById("text-add");
const fontSelect = document.getElementById("font-family");
const fontColor = document.getElementById("font-color");
const fontBold = document.getElementById("font-bold");
const imageSave = document.getElementById("image-save");
const canvasDump = document.getElementById("canvas-dump");
const canvasRestore = document.getElementById("canvas-restore");

// -----------------------------
// Event listeners
// -----------------------------

dropArea.addEventListener("click", function () {
  imageInput.click();
});
dropArea.addEventListener("dragover", function (e) {
  e.preventDefault();
  dropArea.classList.add("active");
});
dropArea.addEventListener("dragleave", function (e) {
  e.preventDefault();
  dropArea.classList.remove("active");
});
dropArea.addEventListener("drop", function (e) {
  e.preventDefault();
  dropArea.classList.remove("active");

  const file = e.dataTransfer.files[0];
  if (isVideo(file)) {
    renderVideo(file);
  } else {
    renderImage(file);
  }
});

imageInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (isVideo(file)) {
    renderVideo(file);
  } else {
    renderImage(file);
  }
});

imageRemove.addEventListener("click", handleRemove);

objectCopy.addEventListener("click", Copy);
objectPaste.addEventListener("click", Paste);

objectFront.addEventListener("click", function () {
  const currentObject = canvas.getActiveObject();
  const currentIndex = canvas.getObjects().indexOf(currentObject);
  currentObject.moveTo(currentIndex + 1);
});
objectBack.addEventListener("click", function () {
  const currentObject = canvas.getActiveObject();
  const currentIndex = canvas.getObjects().indexOf(currentObject);
  currentObject.moveTo(currentIndex - 1);
});

textAdd.addEventListener("click", function () {
  addText();
});

fontSelect.onchange = function () {
  if (fontSelect.value !== "Times New Roman") {
    loadAndUse(this.value);
  } else {
    canvas.getActiveObject().set("fontFamily", fontSelect.value);
    canvas.requestRenderAll();
  }
};
fonts.forEach(function (font) {
  const option = document.createElement("option");
  option.innerHTML = font;
  option.value = font;
  fontSelect.appendChild(option);
});
fontColor.addEventListener("change", function () {
  canvas.getActiveObject().set("fill", fontColor.value);
  canvas.requestRenderAll();
});
fontBold.addEventListener("input", function () {
  const weight = this.checked ? "bold" : "normal";
  canvas.getActiveObject().set("fontWeight", weight);
  canvas.requestRenderAll();
});

imageSave.addEventListener("click", saveImage);

canvasDump.addEventListener("click", function () {
  const json = JSON.stringify(canvas);
  localStorage.setItem(localStorageKey, json);
});
canvasRestore.addEventListener("click", function () {
  const json = localStorage.getItem(localStorageKey);
  canvas.loadFromJSON(json, function () {
    canvas.renderAll();
  });
});

$(function () {
  $("#demo").colorpicker({
    popover: false,
    inline: true,
    container: "#demo",
  });
});

// -----------------------------
// Functions
// -----------------------------

function handleRemove() {
  canvas.remove(canvas.getActiveObject());
}

function loadImage(data) {
  new fabric.Image.fromURL(data, function (img) {
    canvas.add(img).renderAll();
    img.onSelect = function () {
      img.bringToFront();
    };
  });
}

function loadAndUse(font) {
  const myfont = new FontFaceObserver(font);
  myfont
    .load()
    .then(function () {
      // when font is loaded, use it.
      if (!!canvas.getActiveObject()) {
        canvas.getActiveObject().set("fontFamily", font);
        canvas.requestRenderAll();
      }
    })
    .catch(function (e) {
      console.log(e);
      alert("font loading failed " + font);
    });
}

function addText() {
  const defaultTextBox = new fabric.Textbox("Text", defaultTextBoxOption);
  canvas.add(defaultTextBox);
  canvas.setActiveObject(defaultTextBox);

  defaultTextBox.onSelect = function () {
    defaultTextBox.bringToFront();
  };
}

function saveImage() {
  const link = document.createElement("a");
  link.href = canvas.toDataURL({ format: "png" });
  link.download = "helloWorld.png";
  link.click();
}

function Copy() {
  canvas.getActiveObject().clone(function (cloned) {
    _clipboard = cloned;
  });
}

function Paste() {
  // clone again, so you can do multiple copies.
  _clipboard.clone(function (clonedObj) {
    canvas.discardActiveObject();
    clonedObj.set({
      left: clonedObj.left + 10,
      top: clonedObj.top + 10,
      evented: true,
    });
    if (clonedObj.type === "activeSelection") {
      // active selection needs a reference to the canvas.
      clonedObj.canvas = canvas;
      clonedObj.forEachObject(function (obj) {
        canvas.add(obj);
      });
      // this should solve the unselectability
      clonedObj.setCoords();
    } else {
      canvas.add(clonedObj);
    }
    _clipboard.top += 10;
    _clipboard.left += 10;
    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
  });
}

function renderVideo(file) {
  const media = URL.createObjectURL(file);
  const videoEl = document.createElement("video");
  document.getElementById("video-wrapper").appendChild(videoEl);

  videoEl.src = media;
  videoEl.muted = true;
  videoEl.controls = true;
  videoEl.loop = true;
  videoEl.style.display = "none";

  videoEl.onloadedmetadata = function () {
    const width = videoEl.videoWidth;
    const height = videoEl.videoHeight;
    videoEl.width = width;
    videoEl.height = height;

    const video1 = new fabric.Image(videoEl, {
      left: 200,
      top: 300,
      originX: "center",
      originY: "center",
      objectCaching: false,
    });

    canvas.add(video1);
    video1.getElement().play();
  };
}

function renderImage(file) {
  const reader = new FileReader();
  reader.onload = function (f) {
    loadImage(f.target.result);
  };
  reader.readAsDataURL(file);
}

function isVideo(file) {
  return file && file.type.indexOf("video/") === 0;
}

// -----------------------------
// Main
// -----------------------------

fabric.util.requestAnimFrame(function render() {
  canvas.renderAll();
  fabric.util.requestAnimFrame(render);
});
