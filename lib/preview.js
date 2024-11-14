import { ROCrate } from 'ro-crate';
import nunjucks from 'nunjucks';
import WKT from 'terraformer-wkt-parser';

function expandPropertyValue(crate, property, value) {
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

          } catch (error) {
              console.error(`Error parsing WKT: ${error}`);
          } 
          returnVal.value = val;

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


function initializeProp(crate, entityLite, prop){
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


function roCrateToJSON(metadata) {
  
  
  const crate = new ROCrate(metadata, { array: true, link: true });
  const crateLite = { entryPoint: crate.rootDataset["@id"], ids: {} };


  
  for (let entity of crate.entities()) {
    const id = entity["@id"];
    const entityLite = { id: entity["@id"], type: entity["@type"], props: {} };

    for (let prop of Object.keys(entity)) {
      if (["@id", "@type"].includes(prop)) {
        continue;
      }
      const uri = initializeProp(crate, entityLite, prop);
      
      entityLite.props[uri].fwd =
        (prop, expandPropertyValue(crate, prop, entity[prop]));
      for (let prop of Object.keys(entity["@reverse"])) {
        const uri = initializeProp(crate, entityLite, prop);
        
        entityLite.props[uri].rev = expandPropertyValue(
          crate,
          prop,
          entity["@reverse"][prop]
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
