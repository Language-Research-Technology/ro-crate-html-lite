import fs from 'fs';
import path from 'path';
import nunjucks from 'nunjucks';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the previewer-template.html file
const templateFile = path.join(__dirname, 'previewer-template.html');
const templateContent = fs.readFileSync(templateFile, 'utf8');

// Load the preview.js file
const previewFile = path.join(__dirname, 'lib/preview.js');
let previewContent = fs.readFileSync(previewFile, 'utf8');
// Change the imports in preview.js to use Skypack
previewContent = previewContent.replace(/import (.*) from '(.*)';/g, `import $1 from "https://cdn.skypack.dev/$2";`);

// Load the template.html file as layout
const resultTemplateFile = path.join(__dirname, 'template.html');
const resultTemplateContent = fs.readFileSync(resultTemplateFile, 'utf8').replace(/\n/g, ' ');
const base64TemplateContent = Buffer.from(resultTemplateContent, 'utf-8').toString('base64');

const layoutFile = path.join(__dirname, 'lib/default_layout.json');
const layoutContent = JSON.parse(fs.readFileSync(layoutFile, 'utf8'));

// Configure Nunjucks
const env = nunjucks.configure({ autoescape: true });
env.addFilter('setProp', function (obj, key) {
  obj[key] = true;
  return obj;
});
env.addFilter('randomId', function () {
  return 'map-' + Math.floor(Math.random() * 1000000);
});

// Render the template with the modified preview.js content and layout
const renderedHtml = env.renderString(templateContent, {
  previewScripts: previewContent,
  layout: layoutContent,
  resultTemplate: base64TemplateContent
});

// Write out the result to ro-crate-preview-builder.html
const outputFile = path.join(__dirname, 'ro-crate-preview-builder.html');
fs.writeFileSync(outputFile, renderedHtml, 'utf-8');

console.log('ro-crate-preview-builder.html has been generated.');