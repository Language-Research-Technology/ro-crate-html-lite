import nunjucks from "nunjucks";
import crypto from 'crypto';
import fs from "fs";
import markdownIt from "markdown-it";
import { strict } from "assert";
import path from 'path';

async function expandPropertyValue(crate, property, value) {
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
      local_url: ""
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
      returnVal.value = val;
    }
    if (returnVal.value || returnVal.target_id || returnVal.url) {
      vals.push(returnVal);
    }
  }
  return vals;
}

function initializeProp(crate, entityLite, prop) {
  const uri = crate.resolveTerm(prop) || prop;
  if (!entityLite.props[uri]) {
    entityLite.props[uri] = {
      fwd: [],
      rev: [],
      label: prop,
    };
  }

  if (uri === prop) {
    entityLite.props[uri].url = null;
  } else if (crate.getEntity(uri)) {
    entityLite.props[uri].url = `#${uri}`;
  } else {
    entityLite.props[uri].url = uri;
  }
  return uri;
}

function quadTreeId(id) {
  // Create a hash of the ID to ensure even distribution
  const hash = crypto.createHash('md5').update(id).digest('hex');
  
  // MD5 hash is 32 characters, split into 4 parts of 8 characters each
  const part1 = hash.substring(0, 8);
  const part2 = hash.substring(8, 16);
  const part3 = hash.substring(16, 24);
  const part4 = hash.substring(24, 32);
  
  // Return as a path
  return `${part1}/${part2}/${part3}/${part4}/index.html`;
}

async function roCrateToJSON(crate, multiPageConfig) {
  const crateLite = {
    entryPoint: crate.rootDataset["@id"],
    pages: {},
    ids: {},
    types: {},
    typeUrls: {},
  };

  // First pass to create pages if multiPageConfig is provided
  if (multiPageConfig) {
    console.log("Generating pages based on multi-page configuration...");
    crateLite.pages[crate.rootDataset["@id"]] = {
      path: "ro-crate-preview.html",
      template: multiPageConfig.root.template
    };
    for (let entity of crate.entities()) {
      for (let type of entity["@type"]) {
        if (multiPageConfig.types[type]) {
          crateLite.pages[entity["@id"]] = {
            path: "ro-crate-preview_html/" + quadTreeId(entity["@id"]),
            template: multiPageConfig.types[type].template
          };
          break; // Only need to match one type
        }
      }
    }
  }

  // Second pass to process all entities
  for (let entity of crate.entities()) {
    const id = entity["@id"];
    const entityLite = { id: entity["@id"], type: entity["@type"], props: {} };

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
      entityLite.props[uri].fwd = await expandPropertyValue(crate, prop, entity[prop]);
    }

    // Handle reverse properties if they exist
    if (entity["@reverse"]) {
      for (let prop of Object.keys(entity["@reverse"])) {
        const uri = initializeProp(crate, entityLite, prop);
        entityLite.props[uri].rev = await expandPropertyValue(
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

  // prefixPathWithCratePath filter: prefixes a given path with the cratePath
  env.addFilter("prefixPathWithCratePath", function (aboutPath) {
    return aboutPath.startsWith(data.cratePath) ? aboutPath : path.join(data.cratePath, aboutPath);
  });

  // renderMarkdown filter: converts markdown text to HTML
  env.addFilter("renderMarkdown", function (markdownPath) {
    if (!fs.existsSync(markdownPath)) {
      console.warn(`Markdown file not found: ${markdownPath}`);
      return "";
    }
    const markdownText = fs.readFileSync(markdownPath, "utf-8");
    console.log(`Rendering markdown from: ${markdownPath}`);
    return markdownIt().render(markdownText);
  });

  return env.renderString(template, { data, layout });
}

export { roCrateToJSON, quadTreeId, renderTemplate };
