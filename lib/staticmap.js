import { createCanvas, loadImage } from 'canvas';
import wellknown from 'wellknown';
import axios from 'axios';

// OpenStreetMap tile URL
const tileUrlTemplate = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

// Helper functions for tile and pixel calculations
function lon2tile(lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  const rad = lat * Math.PI / 180;
  return Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * Math.pow(2, zoom));
}

function lon2pixel(lon, zoom, tileSize) {
  return ((lon + 180) / 360 * Math.pow(2, zoom) * tileSize);
}

function lat2pixel(lat, zoom, tileSize) {
  const rad = lat * Math.PI / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * Math.pow(2, zoom) * tileSize);
}

// Main function to generate the map
export async function generateStaticMap(wktString, width = 300, height = 300, zoom = 10, tileSize = 256) {
  // Parse WKT
  const geojson = wellknown.parse(wktString);

  // Compute bounds and center
  const coords = geojson.type === 'Polygon' ? geojson.coordinates.flat() :
                 geojson.type === 'LineString' ? geojson.coordinates :
                 [geojson.coordinates];

  const minLon = Math.min(...coords.map(c => c[0]));
  const maxLon = Math.max(...coords.map(c => c[0]));
  const minLat = Math.min(...coords.map(c => c[1]));
  const maxLat = Math.max(...coords.map(c => c[1]));

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;

  // Calculate tile ranges
  const centerTileX = lon2tile(centerLon, zoom);
  const centerTileY = lat2tile(centerLat, zoom);

  const halfWidthInTiles = Math.ceil((width / 2) / tileSize);
  const halfHeightInTiles = Math.ceil((height / 2) / tileSize);

  const minTileX = centerTileX - halfWidthInTiles;
  const maxTileX = centerTileX + halfWidthInTiles;
  const minTileY = centerTileY - halfHeightInTiles;
  const maxTileY = centerTileY + halfHeightInTiles;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fetch and draw tiles
  const tilePromises = [];
  for (let x = minTileX; x <= maxTileX; x++) {
    for (let y = minTileY; y <= maxTileY; y++) {
      const url = tileUrlTemplate(zoom, x, y);
      tilePromises.push(
        axios.get(url, { responseType: 'arraybuffer' })
          .then(response => loadImage(response.data))
          .then(image => ({ x, y, image }))
          .catch(err => {
            console.error(`Failed to load tile ${x}/${y} at zoom ${zoom}: ${err}`);
          })
      );
    }
  }

  const tiles = await Promise.all(tilePromises);

  const centerPixelX = lon2pixel(centerLon, zoom, tileSize);
  const centerPixelY = lat2pixel(centerLat, zoom, tileSize);

  tiles.forEach(({ x, y, image }) => {
    if (!image) return;
    const tilePixelX = x * tileSize;
    const tilePixelY = y * tileSize;

    const dx = tilePixelX - centerPixelX + width / 2;
    const dy = tilePixelY - centerPixelY + height / 2;

    ctx.drawImage(image, dx, dy, tileSize, tileSize);
  });

  // Draw WKT geometry
  const project = ([lon, lat]) => {
    const px = lon2pixel(lon, zoom, tileSize) - centerPixelX + width / 2;
    const py = lat2pixel(lat, zoom, tileSize) - centerPixelY + height / 2;
    return [px, py];
  };

  if (geojson.type === 'Polygon') {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255,0,0,0.2)';
    ctx.beginPath();
    for (const ring of geojson.coordinates) {
      for (let i = 0; i < ring.length; i++) {
        const [x, y] = project(ring[i]);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (geojson.type === 'LineString') {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < geojson.coordinates.length; i++) {
      const [x, y] = project(geojson.coordinates[i]);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  } else if (geojson.type === 'Point') {
    const [x, y] = project(geojson.coordinates);
    // Draw a map marker
    ctx.beginPath();
    ctx.moveTo(x, y); // Tail of the marker
    ctx.lineTo(x - 5, y - 15); // Left side of the marker
    ctx.lineTo(x + 5, y - 15); // Right side of the marker
    ctx.closePath();
    ctx.fillStyle = 'blue'; // Fill color for the marker
    ctx.fill();

    // Draw the circular head of the marker
    ctx.beginPath();
    ctx.arc(x, y - 20, 7, 0, 2 * Math.PI); // Circle above the tail
    ctx.fillStyle = 'blue'; // Fill color for the circle
    ctx.fill();
    ctx.strokeStyle = 'black'; // Optional: Add a border for better visibility
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Add copyright text to the bottom-right corner
ctx.font = '12px Arial';
ctx.fillStyle = 'black';
ctx.textAlign = 'right';
ctx.fillText('(c) OpenStreetMap contributors', width - 10, height - 25);

// Add a clickable link (optional, for HTML embedding)
ctx.fillStyle = 'blue';
ctx.fillText('https://www.openstreetmap.org/copyright', width - 10, height - 10);

  // Return base64-encoded PNG
  
  return canvas.toDataURL('image/png');
}
