const fs = require("fs");
const path = require("path");
const { Command } = require("commander");
const { ROCrate } = require("ro-crate");
const nunjucks = require("nunjucks");
const program = new Command();
const Terraformer = require('terraformer');
const WKT = require('terraformer-wkt-parser');
const puppeteer = require('puppeteer');


async function drawMap(geoJSON) {
    return null;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Map</title>
            <style>
                body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
                #map { width: 100%; height: 100%; }
            </style>
            <link href="https://unpkg.com/maplibre-gl/dist/maplibre-gl.css" rel="stylesheet" />
        </head>
        <body>
            <div id="map"></div>
            <script src="https://unpkg.com/maplibre-gl/dist/maplibre-gl.js"></script>
            <script>
                const geojson = ${JSON.stringify(geoJSON)};
                const bounds = new maplibregl.LngLatBounds();

                if (geojson.features) {
                    geojson.features.forEach(function(feature) {
                        if (feature.geometry && feature.geometry.coordinates) {
                            feature.geometry.coordinates.forEach(function(coord) {
                                bounds.extend(coord);
                            });
                        }
                    });
                }

                const center = bounds.getCenter();

                const map = new maplibregl.Map({
                    style: 'https://tiles.openfreemap.org/styles/liberty',
                    center: center.toArray(),
                    zoom: 9.5,
                    container: 'map',
                });

                map.on('load', () => {
                    map.addSource('geojson', {
                        'type': 'geojson',
                        'data': geojson
                    });

                    map.addLayer({
                        'id': 'geojson-layer',
                        'type': 'line',
                        'source': 'geojson',
                        'paint': {
                            'line-color': '#B42222',
                            'line-width': 2
                        }
                    });

                    map.fitBounds(bounds, { padding: 20 });

                    map.once('idle', async () => {
                        const svg = await map.getCanvas().toDataURL('image/svg+xml');
                        window.mapSVG = svg;
                    });
                });
            </script>
        </body>
        </html>
    `
    fs.writeFileSync('map.html', html);
    await page.setContent(html);

    await page.waitForFunction('window.mapSVG !== undefined');
    const mapSVG = await page.evaluate(() => window.mapSVG);

    await browser.close();
    return mapSVG;
}

async function loadRoCrate(cratePath, layout) {
  async function expandPropertyValue(property, value) {
    vals = [];
    if (property === "@id" || property === "@value") {
      return value;
    }

    for (let val of value) {
      returnVal = {
        value: "",
        target_id: "",
        target_name: "",
        url: "",
        map: null
      };

      if (val["@id"]) {
        if (val["@id"] === "ro-crate-metadata.json") {
          continue;
        }
        const target = crate.getEntity(val["@id"]);
        if (target) {
          returnVal.target_id = val["@id"];
          const name = target.name?.join(", ") || val["@id"];
          returnVal.target_name = name;
        } else {
          try {
            const disposable = new URL(val["@id"]);
            returnVal.url = val["@id"];
          } catch (error) {
            returnVal.value = val;
          }
        }
      } else {
        if (property === "asWKT") {
            try {
                returnVal.geoJSON = WKT.parse(val);
                returnVal.map = await drawMap(returnVal.geoJSON);
            } catch (error) {
                console.error(`Error parsing WKT: ${error}`);
                returnVal.value = val;
            }
        } else {
        returnVal.value = val;
    }
      }
      //console.log(returnVal)
      if (returnVal.value || returnVal.target_id || returnVal.url || returnVal.geoJSON) {   
        vals.push(returnVal);
      }
    }
    return vals;
  }
  const metadataFile = path.join(cratePath, "ro-crate-metadata.json");
  if (!fs.existsSync(metadataFile)) {
    console.error(`Error: Metadata file not found in ${cratePath}`);
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));
  const crate = new ROCrate(metadata, { array: true, link: true });
  crateLite = { entryPoint: crate.rootDataset["@id"], ids: {} };


function initializeProp(entityLite, prop){
    const uri = crate.resolveTerm(prop) || prop;
    if (!entityLite.props[uri]) {
        entityLite.props[uri] = {
          fwd: [],
          rev: [],
          label: prop,
        };
      }
    if (uri === prop)
    {
      entityLite.props[uri].url = null;
    } else if (crate.getEntity(uri)) {
        entityLite.props[uri].url = `#${uri}`;
    } else {      
        entityLite.props[uri].url = uri;
    } 
    return uri;

    
   }
  
  for (let entity of crate.entities()) {
    id = entity["@id"];
    entityLite = { id: entity["@id"], type: entity["@type"], props: {} };

    for (let prop of Object.keys(entity)) {
      if (["@id", "@type"].includes(prop)) {
        continue;
      }
      const uri = initializeProp(entityLite, prop);
      
      entityLite.props[uri].fwd =
        (prop, expandPropertyValue(prop, entity[prop]));
      for (let prop of Object.keys(entity["@reverse"])) {
        const uri = initializeProp(entityLite, prop);
        
        entityLite.props[uri].rev = expandPropertyValue(
          prop,
          entity["@reverse"][prop]
        );
      }
    }
    crateLite.ids[id] = entityLite;
  }
  //console.log(JSON.stringify(crateLite,null,2));
  renderTemplate(crateLite, cratePath, layout);
}

function renderTemplate(data, cratePath, layoutPath) {
  const templateFile = path.join(__dirname, "template.html");
  if (!fs.existsSync(templateFile)) {
    console.error(`Error: Template file not found`);
    return;
  }
  const template = fs.readFileSync(templateFile, "utf8");
  const layout = JSON.parse(fs.readFileSync(layoutPath, "utf8"));
  const env = nunjucks.configure({ autoescape: true });
  env.addFilter("setProp", function (obj, key) {
    obj[key] = true;
    return obj;
  });

  
  
  const renderedHtml = env.renderString(template, { data, layout });
  fs.writeFileSync(
    path.join(cratePath, "ro-crate-preview.html"),
    renderedHtml,
    "utf-8"
  );
}

program
  .name("load_ro_crate")
  .description("Load an RO-Crate from a specified directory")
  .argument("<path_to_crate_directory>", "Path to the crate directory")
  .option(
    "-l, --layout <layoutPath>",
    "Path to the layout file",
    path.join(__dirname, "lib", "default_layout.json")
  )

  .action((cratePath, options) => {
    if (!fs.existsSync(cratePath) || !fs.lstatSync(cratePath).isDirectory()) {
      console.error(`Error: ${cratePath} is not a valid directory`);
      return;
    }

    loadRoCrate(cratePath, options.layout);
  });

program.parse(process.argv);
