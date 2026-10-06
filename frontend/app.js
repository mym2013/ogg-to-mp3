const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const selectButton = document.getElementById("selectButton");

const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");

const removeButton = document.getElementById("removeButton");
const convertButton = document.getElementById("convertButton");
const status = document.getElementById("status");

let selectedFile = null;


// --------------------------------------------------
// Seleccionar archivo
// --------------------------------------------------

selectButton.addEventListener("click", (event) => {
  event.stopPropagation();
  fileInput.click();
});


dropZone.addEventListener("click", () => {
  fileInput.click();
});


fileInput.addEventListener("change", () => {

  const file = fileInput.files[0];

  if (file) {
    handleFile(file);
  }

});


// --------------------------------------------------
// Drag & Drop
// --------------------------------------------------

dropZone.addEventListener("dragover", (event) => {

  event.preventDefault();

  dropZone.classList.add("drag-over");

});


dropZone.addEventListener("dragleave", () => {

  dropZone.classList.remove("drag-over");

});


dropZone.addEventListener("drop", (event) => {

  event.preventDefault();

  dropZone.classList.remove("drag-over");

  const file = event.dataTransfer.files[0];

  if (file) {
    handleFile(file);
  }

});


// --------------------------------------------------
// Procesar archivo seleccionado
// --------------------------------------------------

function handleFile(file) {

  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  const allowedExtensions = ["ogg", "opus"];

  if (!allowedExtensions.includes(extension)) {

    resetFile();

    status.textContent =
      "Selecciona un archivo con extensión .ogg o .opus";

    return;
  }

  selectedFile = file;

  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);

  fileInfo.classList.remove("hidden");

  convertButton.disabled = false;

  status.textContent = "";

}


// --------------------------------------------------
// Eliminar archivo
// --------------------------------------------------

removeButton.addEventListener("click", () => {

  resetFile();

  status.textContent = "";

});


function resetFile() {

  selectedFile = null;

  fileInput.value = "";

  fileInfo.classList.add("hidden");

  fileName.textContent = "";
  fileSize.textContent = "";

  convertButton.disabled = true;

}


// --------------------------------------------------
// Conversión OGG / OPUS → MP3
// --------------------------------------------------

convertButton.addEventListener("click", async () => {

  if (!selectedFile) {
    return;
  }

  convertButton.disabled = true;
  convertButton.textContent = "Convirtiendo...";

  status.textContent = "Procesando archivo...";

  const formData = new FormData();

  formData.append(
    "audio",
    selectedFile,
    selectedFile.name
  );

  try {

    const response = await fetch(
      "/convert",
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {

      let message =
        "No fue posible convertir el archivo.";

      try {

        const data = await response.json();

        if (data.error) {
          message = data.error;
        }

      } catch {
        // La respuesta no contenía JSON.
      }

      throw new Error(message);
    }

    const mp3Blob = await response.blob();

    const downloadUrl =
      URL.createObjectURL(mp3Blob);

    const downloadLink =
      document.createElement("a");

    const originalName =
      selectedFile.name.replace(/\.(ogg|opus)$/i, "");

    downloadLink.href = downloadUrl;

    downloadLink.download =
      `${originalName}.mp3`;

    document.body.appendChild(downloadLink);

    downloadLink.click();

    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);

    status.textContent =
      "Conversión completada.";

  } catch (error) {

    console.error(error);

    status.textContent =
      `Error: ${error.message}`;

  } finally {

    convertButton.textContent =
      "Convertir a MP3";

    convertButton.disabled =
      selectedFile === null;

  }

});


// --------------------------------------------------
// Utilidades
// --------------------------------------------------

function formatFileSize(bytes) {

  if (bytes === 0) {
    return "0 KB";
  }

  const kilobytes = bytes / 1024;
  const megabytes = kilobytes / 1024;

  if (megabytes >= 1) {
    return `${megabytes.toFixed(2)} MB`;
  }

  return `${kilobytes.toFixed(2)} KB`;

}