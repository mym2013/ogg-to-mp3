const express = require("express");
const cors = require("cors");
const multer = require("multer");

const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3020;

// --------------------------------------------------
// Rutas del proyecto
// --------------------------------------------------

const ROOT_DIR = path.join(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const INPUT_DIR = path.join(ROOT_DIR, "input");
const OUTPUT_DIR = path.join(ROOT_DIR, "output");

// Asegurar que las carpetas existan
fs.mkdirSync(INPUT_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.static(FRONTEND_DIR));

// --------------------------------------------------
// Multer
// --------------------------------------------------

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, INPUT_DIR);
  },

  filename: (req, file, cb) => {

    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}.ogg`;

    cb(null, uniqueName);
  }

});

const upload = multer({
  storage,

  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

// --------------------------------------------------
// Estado del servidor
// --------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "OGG to MP3 Converter"
  });
});

// --------------------------------------------------
// Conversión OGG → MP3
// --------------------------------------------------

app.post("/convert", upload.single("audio"), (req, res) => {

  if (!req.file) {

    return res.status(400).json({
      error: "No se recibió ningún archivo."
    });

  }

  const inputPath = req.file.path;

  const originalName =
    path.parse(req.file.originalname).name;

  const safeName = originalName
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim() || "audio";

  const outputName = `${safeName}.mp3`;

  const outputPath = path.join(
    OUTPUT_DIR,
    `${Date.now()}-${outputName}`
  );

  const ffmpegArgs = [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "2",
    outputPath
  ];

  execFile("ffmpeg", ffmpegArgs, (error) => {

    // El archivo OGG temporal ya no es necesario
    fs.unlink(inputPath, () => {});

    if (error) {

      console.error("Error FFmpeg:", error.message);

      fs.unlink(outputPath, () => {});

      return res.status(500).json({
        error: "No fue posible convertir el archivo."
      });

    }

    res.download(
      outputPath,
      outputName,
      (downloadError) => {

        // Eliminamos también el MP3 temporal
        fs.unlink(outputPath, () => {});

        if (downloadError) {
          console.error(
            "Error enviando archivo:",
            downloadError.message
          );
        }

      }
    );

  });

});

// --------------------------------------------------
// Inicio
// --------------------------------------------------

app.listen(PORT, () => {

  console.log(
    `OGG → MP3 backend activo en http://localhost:${PORT}`
  );

});