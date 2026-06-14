import nunjucks from "nunjucks";
import { md5 } from "./md5.js";
import markdownit from "markdown-it";
import { ROCrate } from 'ro-crate';
import { templates } from '../template.js';
import { fetchLayouts } from './utils.js';

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

// const textEncoder = new TextEncoder();
export function quadTreeId(id) {
  // Create a hash of the ID to ensure even distribution
  //const hash = crypto.createHash('md5').update(id).digest('hex');
  //const hash = (new Uint8Array(await crypto.subtle.digest('SHA-1', textEncoder.encode(id))).toHex();
  const hash = md5(id);

  // MD5 hash is 32 characters, split into 4 parts of 8 characters each
  const part1 = hash.substring(0, 8);
  const part2 = hash.substring(8, 16);
  const part3 = hash.substring(16, 24);
  const part4 = hash.substring(24, 32);

  // Return as a path
  return `${part1}/${part2}/${part3}/${part4}/index.html`;
}

export async function roCrateToJSON(crate, multiPageConfig) {
  if (!(crate instanceof ROCrate)) crate = await ROCrate.create(crate);
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

  // Build parent collection relationships so templates can navigate upward contextually.
  for (let entityLite of Object.values(crateLite.ids)) {
    const isCollection = Array.isArray(entityLite.type) && entityLite.type.includes("Collection");
    const hasPart = entityLite.props["http://schema.org/hasPart"];
    if (!isCollection || !hasPart || !Array.isArray(hasPart.fwd)) {
      continue;
    }
    for (let part of hasPart.fwd) {
      if (!part.target_id || !crateLite.ids[part.target_id]) {
        continue;
      }
      const child = crateLite.ids[part.target_id];
      if (!child.parentCollections) {
        child.parentCollections = [];
      }
      child.parentCollections.push(entityLite.id);
    }
  }

  return crateLite;
}

/**
 * Render JSON as HTML
 * @param {Object} params
 * @param {Object} params.cratePath
 * @param {Object} params.data - The processed metadata object of the RO-Crate
 * @param {string} params.template - The content of the template
 * @param {Object} params.layout - The layout config object which groups properties
 * @param {Object} params.multipage -  multipage configuration object
 * @param {Function} params.getMdContent - Function to get markdown content
 * @returns {String} The rendered HTML
 */
export async function renderTemplate({ crate = {}, data, template, layout, multipage, getMdContent } = {}) {
  const env = nunjucks.configure({ autoescape: true });

  env.addFilter("setProp", function (obj, key) {
    obj[key] = true;
    return obj;
  });

  // renderMarkdown filter: converts markdown text to HTML
  env.addFilter("renderMarkdown", function (markdownPath) {
    if (typeof getMdContent === 'function') {
      const markdownText = getMdContent(markdownPath) || '';
      console.log(`Rendering markdown from: ${markdownPath}`);
      // console.log(markdownText);
      return markdownit().render(markdownText);
    }
  });
  data = data || await roCrateToJSON(crate, multipage);
  return env.renderString(template, { data, layout });
}

/**
 * Render a single page HTML preview with a default precompiled template and layout
 */
export async function renderSinglePage({ crate, getMdContent, layouts, layout } = {}) {
  const env = new nunjucks.Environment(new nunjucks.PrecompiledLoader(templates));
  env.addFilter("setProp", (obj, key) => (obj[key] = true, obj));
  env.addFilter("renderMarkdown", typeof getMdContent === 'function' ?
    (markdownPath) => markdownit().render(getMdContent(markdownPath) || '') : () => '');

  if (!(crate instanceof ROCrate)) crate = await ROCrate.create(crate);
  const data = await roCrateToJSON(crate);
  layouts = layouts || await fetchLayouts();
  layout = layout || crate.root.conformsTo?.find(e => layouts[e['@id']]) || layouts.default;
  return env.render('template.html', { data, layout });
}
