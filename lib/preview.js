import nunjucks from 'nunjucks';
import { generateStaticMap } from './staticmap.js';


async function expandPropertyValue(crate, property, value, maps = false) {
  const vals = [];
  if (property === "@id" || property === "@value") {
    return value;
  }

  for (let val of value) {
    const returnVal = {
      value: "",
      target_id: "",
      target_name: "",
      url: "",
      mapImage: null
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
      if (maps && property === "asWKT") {
           try {
                        const wkt = val;
                        const mapdata = await generateStaticMap(wkt);
                        returnVal.value = wkt;
                        returnVal.mapImage = mapdata;
                        console.log(Object.keys(returnVal.mapImage));
                        console.log(Object.keys(returnVal.mapImage.world));

                    } catch (error) {
              console.error(`Error parsing WKT: ${error}`);
          } 
          returnVal.value = val;

      } else {
      returnVal.value = val;
  }
    }
    if (returnVal.value || returnVal.target_id || returnVal.url) {   
      vals.push(returnVal);
    }
  }
  return vals;
}


function initializeProp(crate, entityLite, prop){
  const uri = crate.resolveTerm(prop) || prop;
  if (!entityLite.props[uri]) {
      entityLite.props[uri] = {
        fwd: [],
        rev: [],
        label: prop,
      };
    }
  
  if (uri === prop){  
    entityLite.props[uri].url = null;
  } else if (crate.getEntity(uri)) {
      entityLite.props[uri].url = `#${uri}`;
  } else {      
      entityLite.props[uri].url = uri;
  } 
  return uri;

  
 }


async function roCrateToJSON(crate, maps) {

  
  const crateLite = { entryPoint: crate.rootDataset["@id"], ids: {}, types: {}, typeUrls: {} };

  
  for (let entity of crate.entities()) {
    const id = entity["@id"];
    const entityLite = { id: entity["@id"], type: entity["@type"], props: {}};
    for (let type of entity["@type"]) {
   
      if (!crateLite.types[type]) {
        crateLite.types[type] = [];
        crateLite.typeUrls[type] = crate.resolveTerm(type) || "type";

      }
      crateLite.types[type].push(entity["@id"]);
    }
    for (let prop of Object.keys(entity)) {
      if (["@id", "@type"].includes(prop)) {
        continue;
      }
      
      const uri = initializeProp(crate, entityLite, prop);
      
      entityLite.props[uri].fwd =
        (prop, await expandPropertyValue(crate, prop, entity[prop], maps));
      for (let prop of Object.keys(entity["@reverse"])) {
        const uri = initializeProp(crate, entityLite, prop);
        
        entityLite.props[uri].rev = await expandPropertyValue(
          crate,
          prop,
          entity["@reverse"][prop],
          false
        );
      }
    }
    crateLite.ids[id] = entityLite;
  }
  return crateLite;
}

/* 
    * Render JSON as HTML
    * @param {Object} metadata - The processed metadata object of the RO-Crate
    * @param {String} layoutPath - The path to the layout file which groups properties
    *  @returns {String} The rendered HTML
    * 
*/
function renderTemplate(data, template, layout) {
   const env = nunjucks.configure({ autoescape: true });
  env.addFilter("setProp", function (obj, key) {
    obj[key] = true;
    return obj;
  });
  return env.renderString(template, { data, layout });
}

export { roCrateToJSON, renderTemplate };
