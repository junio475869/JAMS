import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.tar.gz';
const MODEL_DIR = path.join(__dirname, '../public/vosk-model-small-en-us-0.15');

// Create public directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '../public'))) {
  fs.mkdirSync(path.join(__dirname, '../public'));
}

// Download the model
console.log('Downloading Vosk model...');
const modelTarGz = path.join(__dirname, '../public/model.tar.gz');

// Download using https
const file = fs.createWriteStream(modelTarGz);
https.get(MODEL_URL, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download completed');

    // Extract the model
    console.log('Extracting model...');
    try {
      // Create model directory if it doesn't exist
      if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
      }

      // Remove existing files
      if (fs.existsSync(MODEL_DIR)) {
        fs.rmSync(MODEL_DIR, { recursive: true, force: true });
      }
      fs.mkdirSync(MODEL_DIR, { recursive: true });

      // Extract tar.gz file
      execSync(`tar -xzf "${modelTarGz}" -C "${path.join(__dirname, '../public')}"`);
      console.log('Extraction completed');

      // Set correct permissions
      execSync(`chmod -R 755 "${MODEL_DIR}"`);
      console.log('Permissions set');

      // Clean up
      console.log('Cleaning up...');
      fs.unlinkSync(modelTarGz);
      console.log('Done!');
    } catch (error) {
      console.error('Error during extraction:', error);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('Error downloading model:', err);
  fs.unlinkSync(modelTarGz);
  process.exit(1);
}); 