import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
const MODEL_DIR = path.join(__dirname, '../public/vosk-model-small-en-us-0.15');

// Create public directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '../public'))) {
  fs.mkdirSync(path.join(__dirname, '../public'));
}

// Download the model
console.log('Downloading Vosk model...');
execSync(`curl -L ${MODEL_URL} -o ${path.join(__dirname, '../public/model.zip')}`);

// Unzip the model
console.log('Extracting model...');
execSync(`unzip ${path.join(__dirname, '../public/model.zip')} -d ${path.join(__dirname, '../public')}`);

// Clean up
console.log('Cleaning up...');
fs.unlinkSync(path.join(__dirname, '../public/model.zip'));

console.log('Done!'); 