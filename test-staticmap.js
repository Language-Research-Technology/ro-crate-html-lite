// Test framework for staticmap.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateStaticMap } from './lib/staticmap.js';

// Get the directory name correctly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test output directory if it doesn't exist
const outputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Test data: 5 points from Australia
const australiaPoints = [
  { name: 'Sydney', wkt: 'POINT(151.2093 -33.8688)', zoom: 12 },
  { name: 'Melbourne', wkt: 'POINT(144.9631 -37.8136)', zoom: 12 },
  { name: 'Brisbane', wkt: 'POINT(153.0251 -27.4698)', zoom: 12 },
  { name: 'Perth', wkt: 'POINT(115.8575 -31.9505)', zoom: 12 },
  { name: 'Uluru', wkt: 'POINT(131.0369 -25.3444)', zoom: 12 }
];

// Test data: 10 points from elsewhere in the world, including date line and polar regions
const worldPoints = [
  { name: 'New York', wkt: 'POINT(-74.0060 40.7128)', zoom: 12 },
  { name: 'Tokyo', wkt: 'POINT(139.6917 35.6895)', zoom: 12 },
  { name: 'London', wkt: 'POINT(-0.1278 51.5074)', zoom: 12 },
  { name: 'Fiji', wkt: 'POINT(178.4417 -18.1248)', zoom: 12 }, // Near the date line
  { name: 'Kiribati', wkt: 'POINT(172.9794 1.8709)', zoom: 12 }, // Near the date line
  { name: 'Longyearbyen', wkt: 'POINT(15.6455 78.2232)', zoom: 12 }, // Near North Pole
  { name: 'McMurdo Station', wkt: 'POINT(166.6682 -77.8460)', zoom: 12 }, // Near South Pole
  { name: 'Easter Island', wkt: 'POINT(-109.3673 -27.1127)', zoom: 12 }, // Remote location
  { name: 'Marrakesh', wkt: 'POINT(-8.0083 31.6295)', zoom: 12 },
  { name: 'Kathmandu', wkt: 'POINT(85.3240 27.7172)', zoom: 12 }
];

// Additional test data: LineString and Polygon examples
const lineAndPolygon = [
  { name: 'Sydney-Melbourne-LineString', wkt: 'LINESTRING(151.2093 -33.8688, 144.9631 -37.8136)', zoom: 12 },
  { name: 'Eastern-Australia-Polygon', wkt: 'POLYGON((153.0 -28.0, 150.0 -37.0, 145.0 -35.0, 148.0 -25.0, 153.0 -28.0))', zoom: 12 }
];

// Helper function to generate an HTML template
function generateHtmlTemplate(testResults) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StaticMap Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #555; margin-top: 30px; }
    .map-container { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 20px;
    }
    .map-item {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 10px;
      width: 650px;
    }
    .map-item h3 {
      margin-top: 0;
      margin-bottom: 10px;
    }
    .map-item p {
      font-family: monospace;
      font-size: 12px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .map-images {
      display: flex;
      gap: 10px;
    }
    .map-img-container {
      text-align: center;
    }
    .map-img-container span {
      display: block;
      margin-top: 5px;
      font-size: 12px;
      color: #555;
    }
  </style>
</head>
<body>
  <h1>StaticMap Test Results</h1>
  
  <h2>Australian Locations</h2>
  <div class="map-container">
    ${testResults.australia.map(result => `
    <div class="map-item">
      <h3>${result.name}</h3>
      <p>${result.wkt}</p>
      <div class="map-images">
        <div class="map-img-container">
          <img src="${result.dataUrl.main}" alt="${result.name}" width="300" height="300">
          <span>Zoom Level: ${result.zoom}</span>
        </div>
        <div class="map-img-container">
          <img src="${result.dataUrl.world}" alt="${result.name} (World View)" width="300" height="300">
          <span>Zoom Level: 0 (World View)</span>
        </div>
      </div>
    </div>
    `).join('')}
  </div>
  
  <h2>World Locations</h2>
  <div class="map-container">
    ${testResults.world.map(result => `
    <div class="map-item">
      <h3>${result.name}</h3>
      <p>${result.wkt}</p>
      <div class="map-images">
        <div class="map-img-container">
          <img src="${result.dataUrl.main}" alt="${result.name}" width="300" height="300">
          <span>Zoom Level: ${result.zoom}</span>
        </div>
        <div class="map-img-container">
          <img src="${result.dataUrl.world}" alt="${result.name} (World View)" width="300" height="300">
          <span>Zoom Level: 0 (World View)</span>
        </div>
      </div>
    </div>
    `).join('')}
  </div>
  
  <h2>LineString and Polygon Examples</h2>
  <div class="map-container">
    ${testResults.linePolygon.map(result => `
    <div class="map-item">
      <h3>${result.name}</h3>
      <p>${result.wkt}</p>
      <div class="map-images">
        <div class="map-img-container">
          <img src="${result.dataUrl.main}" alt="${result.name}" width="300" height="300">
          <span>Zoom Level: ${result.zoom}</span>
        </div>
        <div class="map-img-container">
          <img src="${result.dataUrl.world}" alt="${result.name} (World View)" width="300" height="300">
          <span>Zoom Level: 0 (World View)</span>
        </div>
      </div>
    </div>
    `).join('')}
  </div>
</body>
</html>`;
}

// Run the tests
async function runTests() {
  console.log('Starting StaticMap tests...');
  console.log('Output directory:', outputDir);
  
  const testResults = {
    australia: [],
    world: [],
    linePolygon: []
  };
  
  try {
    // Test with a single point first to debug
    console.log('Testing with a single point for debugging...');
    const testPoint = australiaPoints[0];
    console.log(`Generating map for ${testPoint.name} (${testPoint.wkt})...`);
    const result = await generateStaticMap(testPoint.wkt, 300, 300, testPoint.zoom, 256, true);
    console.log('Successfully generated maps!');
  } catch (error) {
    console.error('Error in initial test:', error);
    throw error;
  }
  
  // Test Australian points
  console.log('Testing Australian locations...');
  for (const point of australiaPoints) {
    console.log(`  Generating maps for ${point.name}...`);
    try {
      const mapData = await generateStaticMap(point.wkt, 300, 300, point.zoom, 256, true);
      testResults.australia.push({
        name: point.name,
        wkt: point.wkt,
        zoom: point.zoom,
        dataUrl: mapData
      });
      console.log(`  ✓ ${point.name}`);
    } catch (error) {
      console.error(`  ✗ Error generating maps for ${point.name}:`, error);
    }
  }
  
  // Test world points
  console.log('Testing world locations...');
  for (const point of worldPoints) {
    console.log(`  Generating maps for ${point.name}...`);
    try {
      const mapData = await generateStaticMap(point.wkt, 300, 300, point.zoom, 256, true);
      testResults.world.push({
        name: point.name,
        wkt: point.wkt,
        zoom: point.zoom,
        dataUrl: mapData
      });
      console.log(`  ✓ ${point.name}`);
    } catch (error) {
      console.error(`  ✗ Error generating maps for ${point.name}:`, error);
    }
  }
  
  // Test LineString and Polygon examples
  console.log('Testing LineString and Polygon examples...');
  for (const item of lineAndPolygon) {
    console.log(`  Generating maps for ${item.name}...`);
    try {
      const mapData = await generateStaticMap(item.wkt, 300, 300, item.zoom, 256, true);
      testResults.linePolygon.push({
        name: item.name,
        wkt: item.wkt,
        zoom: item.zoom,
        dataUrl: mapData
      });
      console.log(`  ✓ ${item.name}`);
    } catch (error) {
      console.error(`  ✗ Error generating maps for ${item.name}:`, error);
    }
  }
  
  // Generate HTML output
  console.log('Generating HTML output...');
  const htmlContent = generateHtmlTemplate(testResults);
  const htmlPath = path.join(outputDir, 'staticmap-test-results.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log(`Tests completed! Results saved to ${htmlPath}`);
  console.log(`Open this file in your browser to view the maps.`);
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:');
  console.error(error.stack || error);
});
