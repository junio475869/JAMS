import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import https from "https";

// Get the directory name in ES modules
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes with specific origins
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://alphacephei.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Serve static files from the public directory
app.use(express.static(path.join(currentDirPath, "../public")));

// Serve Vosk model files with proper headers
app.use("/vosk-model", express.static(path.join(currentDirPath, "../../client/public/vosk-model-small-en-us-0.15"), {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
  }
}));

// Proxy route for Vosk model download
app.get('/download-vosk-model', (req, res) => {
  console.log("Downloading Vosk model...");
  res.send("Downloading Vosk model...");
  return;
  const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.tar.gz';
  
  https.get(modelUrl, (response) => {
    // Forward the content type if it exists
    const contentType = response.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Forward the content length if it exists
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // Pipe the response
    response.pipe(res);
  }).on('error', (err) => {
    console.error('Error downloading model:', err);
    res.status(500).send('Error downloading model');
  });
});

// Your existing routes...

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 