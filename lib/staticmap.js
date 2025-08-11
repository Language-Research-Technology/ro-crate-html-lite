// filepath: /Users/pt/working/language-research-technology/ro-crate-html-lite-2/lib/staticmap.js
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
export async function generateStaticMap(wktString, width = 300, height = 300, zoom = 12, tileSize = 256, generateWorldMapFlag =  true) {
  // Generate the main map at the specified zoom level
  const mainMap = await generateMap(wktString, width, height, zoom, tileSize);
  
  if (generateWorldMapFlag) {
    // Generate a world map (zoom level 0) in addition to the main map
    // For zoom level 0, we want to use the single world tile and preserve its aspect ratio
    const worldMap = await generateWorldView(wktString, width, height, tileSize);
    return { 
      main: mainMap,
      world: worldMap
    };
  }
  
  return mainMap;
}

// Function to generate a world map (zoom level 0)
async function generateWorldView(wktString, width, height, tileSize) {
  const zoom = 0;
  // At zoom level 0, there's only one tile that shows the entire world
  // The tile is square (256x256), but the world is not - we'll preserve the aspect ratio
  
  // Parse WKT
  const geojson = wellknown.parse(wktString);
  
  // Create canvas - we'll maintain the requested dimensions
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill the canvas with a light blue background color (for oceans)
  ctx.fillStyle = '#c4e4ff';
  ctx.fillRect(0, 0, width, height);
  
  try {
    // Get the world tile
    const url = tileUrlTemplate(0, 0, 0);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const worldImage = await loadImage(response.data);
    
    // Calculate the largest size we can fit while preserving aspect ratio
    const aspectRatio = worldImage.width / worldImage.height;
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (width / height > aspectRatio) {
      // Container is wider than the image's aspect ratio
      drawHeight = height;
      drawWidth = height * aspectRatio;
      offsetX = (width - drawWidth) / 2;
    } else {
      // Container is taller than the image's aspect ratio
      drawWidth = width;
      drawHeight = width / aspectRatio;
      offsetY = (height - drawHeight) / 2;
    }
    
    // Draw the world tile to fill the canvas
    ctx.drawImage(worldImage, offsetX, offsetY, drawWidth, drawHeight);
    
    // Compute location coordinates for the point
    const coords = geojson.type === 'Polygon' ? geojson.coordinates.flat() :
                   geojson.type === 'LineString' ? geojson.coordinates :
                   [geojson.coordinates];
    
    const centerLon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
    const centerLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
    
    // Project coordinates to pixel space
    const project = ([lon, lat]) => {
      // Map longitude from -180...180 to 0...drawWidth
      const px = ((lon + 180) / 360) * drawWidth + offsetX;
      // Map latitude from 90...-90 to 0...drawHeight (note the reversed Y axis)
      const latRad = lat * Math.PI / 180;
      const py = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * drawHeight + offsetY;
      return [px, py];
    };
    
    // Draw the geometry
    if (geojson.type === 'Polygon') {
      ctx.strokeStyle = 'blue';  // Changed from red to blue to match main map
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(0,0,255,0.2)';  // Changed from red to blue to match main map
      
      // Handle each ring of the polygon separately
      for (const ring of geojson.coordinates) {
        // Check if this ring crosses the dateline
        let crossesDateline = false;
        for (let i = 0; i < ring.length - 1; i++) {
          // If longitude difference is more than 180 degrees, it likely crosses the dateline
          const lonDiff = Math.abs(ring[i][0] - ring[i+1][0]);
          if (lonDiff > 180) {
            crossesDateline = true;
            break;
          }
        }
        
        if (crossesDateline) {
          // Split the polygon into two parts at the dateline
          const westPart = [];
          const eastPart = [];
          
          for (let i = 0; i < ring.length; i++) {
            const current = ring[i];
            const next = ring[(i + 1) % ring.length];
            
            // Add current point to the appropriate part
            if (current[0] < 0) {
              westPart.push(current); // Western hemisphere (negative longitude)
            } else {
              eastPart.push(current); // Eastern hemisphere (positive longitude)
            }
            
            // Check if the line from current to next crosses the dateline
            const lonDiff = Math.abs(current[0] - next[0]);
            if (lonDiff > 180) {
              // Calculate intersection with dateline
              // We need to add points at both -180 and 180 to close both polygons
              
              // Determine direction of crossing
              const goingWest = (current[0] > 0 && next[0] < 0);
              const goingEast = (current[0] < 0 && next[0] > 0);
              
              // Calculate latitude at the dateline
              const ratio = (180 - Math.abs(current[0])) / lonDiff;
              const latAtDateline = current[1] + ratio * (next[1] - current[1]);
              
              if (goingWest) {
                // Crossing from east to west (positive to negative longitude)
                eastPart.push([180, latAtDateline]); // Add point at the dateline (east side)
                westPart.push([-180, latAtDateline]); // Add point at the dateline (west side)
              } else if (goingEast) {
                // Crossing from west to east (negative to positive longitude)
                westPart.push([-180, latAtDateline]); // Add point at the dateline (west side)
                eastPart.push([180, latAtDateline]); // Add point at the dateline (east side)
              }
            }
          }
          
          // Draw western part if it has points
          if (westPart.length > 0) {
            ctx.beginPath();
            const [startX, startY] = project(westPart[0]);
            ctx.moveTo(startX, startY);
            for (let i = 1; i < westPart.length; i++) {
              const [x, y] = project(westPart[i]);
              ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          
          // Draw eastern part if it has points
          if (eastPart.length > 0) {
            ctx.beginPath();
            const [startX, startY] = project(eastPart[0]);
            ctx.moveTo(startX, startY);
            for (let i = 1; i < eastPart.length; i++) {
              const [x, y] = project(eastPart[i]);
              ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        } else {
          // If the polygon doesn't cross the dateline, draw it normally
          ctx.beginPath();
          const [startX, startY] = project(ring[0]);
          ctx.moveTo(startX, startY);
          for (let i = 1; i < ring.length; i++) {
            const [x, y] = project(ring[i]);
            ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    } else if (geojson.type === 'LineString') {
      // Similar approach for LineString
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 3;
      
      // Check if the line crosses the dateline
      let crossesDateline = false;
      for (let i = 0; i < geojson.coordinates.length - 1; i++) {
        // If longitude difference is more than 180 degrees, it likely crosses the dateline
        const lonDiff = Math.abs(geojson.coordinates[i][0] - geojson.coordinates[i+1][0]);
        if (lonDiff > 180) {
          crossesDateline = true;
          break;
        }
      }
      
      if (crossesDateline) {
        // Split the line into segments that don't cross the dateline
        let currentSegment = [];
        
        for (let i = 0; i < geojson.coordinates.length; i++) {
          const current = geojson.coordinates[i];
          currentSegment.push(current);
          
          if (i < geojson.coordinates.length - 1) {
            const next = geojson.coordinates[i + 1];
            const lonDiff = Math.abs(current[0] - next[0]);
            
            if (lonDiff > 180) {
              // This segment crosses the dateline - finish it and start a new one
              
              // Calculate latitude at the dateline
              const ratio = (180 - Math.abs(current[0])) / lonDiff;
              const latAtDateline = current[1] + ratio * (next[1] - current[1]);
              
              // Determine direction of crossing
              const goingWest = (current[0] > 0 && next[0] < 0);
              const goingEast = (current[0] < 0 && next[0] > 0);
              
              // Add a point at the appropriate side of the dateline
              if (goingWest) {
                currentSegment.push([180, latAtDateline]);
              } else if (goingEast) {
                currentSegment.push([-180, latAtDateline]);
              }
              
              // Draw the current segment
              ctx.beginPath();
              const [startX, startY] = project(currentSegment[0]);
              ctx.moveTo(startX, startY);
              for (let j = 1; j < currentSegment.length; j++) {
                const [x, y] = project(currentSegment[j]);
                ctx.lineTo(x, y);
              }
              ctx.stroke();
              
              // Start a new segment from the other side of the dateline
              if (goingWest) {
                currentSegment = [[-180, latAtDateline]];
              } else if (goingEast) {
                currentSegment = [[180, latAtDateline]];
              } else {
                currentSegment = [];
              }
            }
          }
        }
        
        // Draw the final segment if it has points
        if (currentSegment.length > 0) {
          ctx.beginPath();
          const [startX, startY] = project(currentSegment[0]);
          ctx.moveTo(startX, startY);
          for (let j = 1; j < currentSegment.length; j++) {
            const [x, y] = project(currentSegment[j]);
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else {
        // If the line doesn't cross the dateline, draw it normally
        ctx.beginPath();
        const [startX, startY] = project(geojson.coordinates[0]);
        ctx.moveTo(startX, startY);
        for (let i = 1; i < geojson.coordinates.length; i++) {
          const [x, y] = project(geojson.coordinates[i]);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (geojson.type === 'Point') {
      const [x, y] = project(geojson.coordinates);
      
      // Draw a blue marker to match the main map
      ctx.fillStyle = 'blue';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      
      // Circle with border to match main map
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
  } catch (error) {
    console.error('Error loading world map tile:', error);
    // Add error text to the canvas
    ctx.font = '14px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('Error loading world map', width / 2, height / 2);
  }
  
  // Add copyright text
  ctx.font = '12px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'right';
  ctx.fillText('(c) OpenStreetMap contributors', width - 10, height - 25);
  ctx.fillStyle = 'blue';
  ctx.fillText('https://www.openstreetmap.org/copyright', width - 10, height - 10);
  
  return canvas.toDataURL('image/png');
}

// Internal function that handles the actual map generation
async function generateMap(wktString, width = 300, height = 300, zoom = 10, tileSize = 256) {
  // Parse WKT
  const geojson = wellknown.parse(wktString);

  // Compute bounds and center
  const coords = geojson.type === 'Polygon' ? geojson.coordinates.flat() :
                 geojson.type === 'LineString' ? geojson.coordinates :
                 [geojson.coordinates];

        
  // If it's a polygon or a linestring we need to recalculate the zoom level 
  if (geojson.type === 'Polygon' || geojson.type === 'LineString') {
    // Calculate the bounding box
    const minLon = Math.min(...coords.map(c => c[0]));
    const maxLon = Math.max(...coords.map(c => c[0]));
    const minLat = Math.min(...coords.map(c => c[1]));
    const maxLat = Math.max(...coords.map(c => c[1]));

    // Calculate the zoom level based on the bounding box
    const lonSpan = maxLon - minLon;
    const latSpan = maxLat - minLat;

    // Adjust zoom level based on the bounding box size
    zoom = Math.max(0, Math.min(19, Math.floor(Math.log2(Math.min(width / lonSpan, height / latSpan)))));
  }
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
      // Ensure x and y are valid at zoom level 0
      if (zoom === 0) {
        if (x < 0 || x > 0 || y < 0 || y > 0) continue;
      }
      
      const url = tileUrlTemplate(zoom, x, y);
      tilePromises.push(
        axios.get(url, { responseType: 'arraybuffer' })
          .then(response => loadImage(response.data))
          .then(image => ({ x, y, image }))
          .catch(err => {
            console.error(`Failed to load tile ${x}/${y} at zoom ${zoom}: ${err}`);
            return { x, y, image: null }; // Return null image to handle in the forEach loop
          })
      );
    }
  }

  const tiles = await Promise.all(tilePromises);

  const centerPixelX = lon2pixel(centerLon, zoom, tileSize);
  const centerPixelY = lat2pixel(centerLat, zoom, tileSize);

  // Fill the canvas with a light blue background color (for oceans)
  ctx.fillStyle = '#c4e4ff';
  ctx.fillRect(0, 0, width, height);

  tiles.forEach((tile) => {
    if (!tile || !tile.image) return;
    const { x, y, image } = tile;
    const tilePixelX = x * tileSize;
    const tilePixelY = y * tileSize;

    const dx = tilePixelX - centerPixelX + width / 2;
    const dy = tilePixelY - centerPixelY + height / 2;

    ctx.drawImage(image, dx, dy, tileSize, tileSize);
  });

  // Project coordinates to pixel space
  const project = ([lon, lat]) => {
    const px = lon2pixel(lon, zoom, tileSize) - centerPixelX + width / 2;
    const py = lat2pixel(lat, zoom, tileSize) - centerPixelY + height / 2;
    return [px, py];
  };

  // Draw WKT geometry with dateline crossing handling
  if (geojson.type === 'Polygon') {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0,0,255,0.2)';
    
    // Handle each ring of the polygon separately
    for (const ring of geojson.coordinates) {
      // Check if this ring crosses the dateline
      let crossesDateline = false;
      for (let i = 0; i < ring.length - 1; i++) {
        // If longitude difference is more than 180 degrees, it likely crosses the dateline
        const lonDiff = Math.abs(ring[i][0] - ring[i+1][0]);
        if (lonDiff > 180) {
          crossesDateline = true;
          break;
        }
      }
      
      if (crossesDateline) {
        // Split the polygon into two parts at the dateline
        const westPart = [];
        const eastPart = [];
        
        for (let i = 0; i < ring.length; i++) {
          const current = ring[i];
          const next = ring[(i + 1) % ring.length];
          
          // Add current point to the appropriate part
          if (current[0] < 0) {
            westPart.push(current); // Western hemisphere (negative longitude)
          } else {
            eastPart.push(current); // Eastern hemisphere (positive longitude)
          }
          
          // Check if the line from current to next crosses the dateline
          const lonDiff = Math.abs(current[0] - next[0]);
          if (lonDiff > 180) {
            // Calculate intersection with dateline
            // We need to add points at both -180 and 180 to close both polygons
            
            // Determine direction of crossing
            const goingWest = (current[0] > 0 && next[0] < 0);
            const goingEast = (current[0] < 0 && next[0] > 0);
            
            // Calculate latitude at the dateline
            const ratio = (180 - Math.abs(current[0])) / lonDiff;
            const latAtDateline = current[1] + ratio * (next[1] - current[1]);
            
            if (goingWest) {
              // Crossing from east to west (positive to negative longitude)
              eastPart.push([180, latAtDateline]); // Add point at the dateline (east side)
              westPart.push([-180, latAtDateline]); // Add point at the dateline (west side)
            } else if (goingEast) {
              // Crossing from west to east (negative to positive longitude)
              westPart.push([-180, latAtDateline]); // Add point at the dateline (west side)
              eastPart.push([180, latAtDateline]); // Add point at the dateline (east side)
            }
          }
        }
        
        // Draw western part if it has points
        if (westPart.length > 0) {
          ctx.beginPath();
          const [startX, startY] = project(westPart[0]);
          ctx.moveTo(startX, startY);
          for (let i = 1; i < westPart.length; i++) {
            const [x, y] = project(westPart[i]);
            ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        
        // Draw eastern part if it has points
        if (eastPart.length > 0) {
          ctx.beginPath();
          const [startX, startY] = project(eastPart[0]);
          ctx.moveTo(startX, startY);
          for (let i = 1; i < eastPart.length; i++) {
            const [x, y] = project(eastPart[i]);
            ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else {
        // If the polygon doesn't cross the dateline, draw it normally
        ctx.beginPath();
        const [startX, startY] = project(ring[0]);
        ctx.moveTo(startX, startY);
        for (let i = 1; i < ring.length; i++) {
          const [x, y] = project(ring[i]);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  } else if (geojson.type === 'LineString') {
    // Similar approach for LineString
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    
    // Check if the line crosses the dateline
    let crossesDateline = false;
    for (let i = 0; i < geojson.coordinates.length - 1; i++) {
      // If longitude difference is more than 180 degrees, it likely crosses the dateline
      const lonDiff = Math.abs(geojson.coordinates[i][0] - geojson.coordinates[i+1][0]);
      if (lonDiff > 180) {
        crossesDateline = true;
        break;
      }
    }
    
    if (crossesDateline) {
      // Split the line into segments that don't cross the dateline
      let currentSegment = [];
      
      for (let i = 0; i < geojson.coordinates.length; i++) {
        const current = geojson.coordinates[i];
        currentSegment.push(current);
        
        if (i < geojson.coordinates.length - 1) {
          const next = geojson.coordinates[i + 1];
          const lonDiff = Math.abs(current[0] - next[0]);
          
          if (lonDiff > 180) {
            // This segment crosses the dateline - finish it and start a new one
            
            // Calculate latitude at the dateline
            const ratio = (180 - Math.abs(current[0])) / lonDiff;
            const latAtDateline = current[1] + ratio * (next[1] - current[1]);
            
            // Determine direction of crossing
            const goingWest = (current[0] > 0 && next[0] < 0);
            const goingEast = (current[0] < 0 && next[0] > 0);
            
            // Add a point at the appropriate side of the dateline
            if (goingWest) {
              currentSegment.push([180, latAtDateline]);
            } else if (goingEast) {
              currentSegment.push([-180, latAtDateline]);
            }
            
            // Draw the current segment
            ctx.beginPath();
            const [startX, startY] = project(currentSegment[0]);
            ctx.moveTo(startX, startY);
            for (let j = 1; j < currentSegment.length; j++) {
              const [x, y] = project(currentSegment[j]);
              ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            // Start a new segment from the other side of the dateline
            if (goingWest) {
              currentSegment = [[-180, latAtDateline]];
            } else if (goingEast) {
              currentSegment = [[180, latAtDateline]];
            } else {
              currentSegment = [];
            }
          }
        }
      }
      
      // Draw the final segment if it has points
      if (currentSegment.length > 0) {
        ctx.beginPath();
        const [startX, startY] = project(currentSegment[0]);
        ctx.moveTo(startX, startY);
        for (let j = 1; j < currentSegment.length; j++) {
          const [x, y] = project(currentSegment[j]);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else {
      // If the line doesn't cross the dateline, draw it normally
      ctx.beginPath();
      const [startX, startY] = project(geojson.coordinates[0]);
      ctx.moveTo(startX, startY);
      for (let i = 1; i < geojson.coordinates.length; i++) {
        const [x, y] = project(geojson.coordinates[i]);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (geojson.type === 'Point') {
    const [px, py] = project(geojson.coordinates);
    
    // Draw a blue marker
    ctx.fillStyle = 'blue';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // Circle with border
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, 2 * Math.PI);
    ctx.fill();
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
