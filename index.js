const fs = require("fs");
const path = require("path");
const { Command } = require("commander");
const { ROCrate } = require("ro-crate");
const nunjucks = require("nunjucks");
const program = new Command();
const WKT = require('terraformer-wkt-parser');



function loadRoCrate(cratePath, layout) {
  function expandPropertyValue(property, value) {
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
        geoJSON: null
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
                console.log(returnVal);
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
