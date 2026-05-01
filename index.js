import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { ROCrate } from 'ro-crate';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const program = new Command();
import { fileURLToPath } from 'url';
import { roCrateToJSON, renderTemplate } from './lib/preview.js';

// Fetch the mapping JSON between conformsTo and mode
async function fetchMapping() {
  const mappingLocation = 'https://raw.githubusercontent.com/Language-Research-Technology/ro-crate-modes/refs/heads/main/conformsToMapping.json';
  try {
    const response = await fetch(mappingLocation);
    if (!response.ok) {
      throw new Error(`Failed to fetch mapping: ${response.statusText}`);
    }
    const conformsToMapping = await response.json();
        return conformsToMapping;
  } catch (error) {
    console.error("Error fetching mapping from GitHub:", error);
    return null;
  }
}

// Fetch JSON from the mode
async function fetchJsonFromMode(mode) {
  const response = await fetch(mode);
  if (!response.ok) {
    throw new Error(`Failed to fetch mode: ${mode}, Status: ${response.status}`);
  }
  return await response.json();
}

async function findLayout(crate, layoutOption) {
  try {
    // If layoutOption is provided, override other logic and use that layout
    if (layoutOption) {
      console.log(`Using layout "${layoutOption}" from -l option.`);
      return await loadLayout(layoutOption);
    }
    // Fetch the mapping if no -l option provided
    const conformsToMapping = await fetchMapping();
    if (!conformsToMapping) {
      console.log("No mapping data available.");
      return;
    }

    // Get the conformsTo dynamically from the input JSON
    const conformsToLookup = crate.rootDataset.conformsTo?.[0]?.['@id'];
    console.log(`conformsTo "${conformsToLookup}"`);

    // Check if the conformsTo exists in the mapping
    if (conformsToLookup && conformsToMapping.hasOwnProperty(conformsToLookup)) {
      const mode = conformsToMapping[conformsToLookup];
      
      // Fetch the inputGroups from the mode
      const jsonData = await fetchJsonFromMode(mode);
      
      if (jsonData.inputGroups) {
        const layout = jsonData.inputGroups;
        console.log(`Fetched layout for "${conformsToLookup}"`);
        return layout
      } else {
        console.log("No 'inputGroups' key found in the JSON file.");
      }}
      console.log(`conformsTo "${conformsToLookup}" not found in the mapping. Using default layout.`);

      const defaultUrl = "https://raw.githubusercontent.com/Language-Research-Technology/crate-o/refs/heads/main/src/lib/components/default_layout.json";

    // Fetch the default layout from GitHub
    const response = await fetch(defaultUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch default layout: ${response.statusText}`);
    }

    // Parse the response body as JSON
    const layout = await response.json();
    
    console.log("Fetched default layout.");
    return layout;
      
  } catch (error) {
    console.error("Error processing data:", error);
  }
}

// Load layout from a file or URL
async function loadLayout(layoutOption) {
  if (layoutOption.startsWith('http://') || layoutOption.startsWith('https://')) {
    // If it's a URL, fetch the layout from the URL
    try {
      const response = await fetch(layoutOption);
      if (!response.ok) {
        throw new Error(`Error status: ${response.status}`);
      }
      const jsonData = await response.json();  // Parse the response as JSON

      // Check if inputGroups exists and return it
      if (jsonData.inputGroups) {
        return jsonData.inputGroups;
      }

      // If no inputGroups, return the entire JSON
      return jsonData;

    } catch (error) {
      console.error('Error fetching layout from URL:', error.message);
      throw error;
    }
  } else {
    // If it's a file path, read the layout from the file
    try {
      const layout = fs.readFileSync(layoutOption, 'utf8');
      const jsonData = JSON.parse(layout);  // Parse the file as JSON

      // Check if inputGroups exists and return it
      if (jsonData.inputGroups) {
        return jsonData.inputGroups;
      }

      // If no inputGroups, return the entire JSON
      return jsonData;

    } catch (error) {
      console.error('Error reading layout from file:', error.message);
      throw error;
    }
  }
}

function isHttpUrl(value) {
  return typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://"));
}

function resolveStylePath(stylePath, baseDir) {
  if (!stylePath || typeof stylePath !== "string") {
    return null;
  }
  if (isHttpUrl(stylePath) || path.isAbsolute(stylePath)) {
    return stylePath;
  }
  return path.resolve(baseDir, stylePath);
}

function getReadableLabel(uri) {
  if (!uri || typeof uri !== "string") {
    return "";
  }
  const hashSplit = uri.split("#");
  if (hashSplit.length > 1 && hashSplit[1]) {
    return hashSplit[1];
  }
  const slashSplit = uri.split("/");
  return slashSplit[slashSplit.length - 1] || uri;
}

function resolveTermUri(crate, term) {
  let uri = crate.resolveTerm(term) || term;
  if (
    uri === term &&
    typeof term === "string" &&
    !term.startsWith("@") &&
    !term.includes(":") &&
    !term.startsWith("http://") &&
    !term.startsWith("https://")
  ) {
    uri = `http://schema.org/${term}`;
  }
  return uri;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeMissingObjectKeys(target, source) {
  const merged = isPlainObject(target) ? cloneJson(target) : {};

  for (const [key, value] of Object.entries(source || {})) {
    if (!(key in merged)) {
      merged[key] = cloneJson(value);
      continue;
    }
    if (isPlainObject(merged[key]) && isPlainObject(value)) {
      merged[key] = mergeMissingObjectKeys(merged[key], value);
    }
  }

  return merged;
}

function mergeTermMapping(existing, generated) {
  const merged = isPlainObject(existing) ? cloneJson(existing) : {};
  for (const [uri, generatedEntry] of Object.entries(generated || {})) {
    if (!(uri in merged)) {
      merged[uri] = cloneJson(generatedEntry);
      continue;
    }
    if (isPlainObject(merged[uri]) && isPlainObject(generatedEntry)) {
      merged[uri] = mergeMissingObjectKeys(merged[uri], generatedEntry);
    }
  }
  return merged;
}

function mergeGeneratedConfig(existingConfig, generatedConfig) {
  const existing = isPlainObject(existingConfig) ? cloneJson(existingConfig) : {};
  const generated = isPlainObject(generatedConfig) ? generatedConfig : {};

  const merged = mergeMissingObjectKeys(existing, generated);

  // Always merge term mappings additively, preserving user edits.
  merged.termMapping = mergeTermMapping(existing.termMapping, generated.termMapping);

  // Add discovered/passed input groups only when absent.
  if (!("inputGroups" in existing) && Array.isArray(generated.inputGroups)) {
    merged.inputGroups = cloneJson(generated.inputGroups);
  }

  return merged;
}

function buildGeneratedConfig(crate, inputGroups = []) {
  const classUriToDefaultLabel = new Map();
  const propertyUriSet = new Set();

  for (const entity of crate.entities()) {
    const types = Array.isArray(entity["@type"]) ? entity["@type"] : [];
    for (const typeTerm of types) {
      const typeUri = resolveTermUri(crate, typeTerm);
      if (!classUriToDefaultLabel.has(typeUri)) {
        classUriToDefaultLabel.set(typeUri, typeTerm || getReadableLabel(typeUri));
      }
    }

    for (const prop of Object.keys(entity)) {
      if (["@id", "@type", "@reverse"].includes(prop)) {
        continue;
      }
      propertyUriSet.add(resolveTermUri(crate, prop));
    }

    if (entity["@reverse"]) {
      for (const reverseProp of Object.keys(entity["@reverse"])) {
        propertyUriSet.add(resolveTermUri(crate, reverseProp));
      }
    }
  }

  const classUris = [...classUriToDefaultLabel.keys()].sort((a, b) => a.localeCompare(b));
  const propertyUris = [...propertyUriSet].sort((a, b) => a.localeCompare(b));

  const navigationByType = {};
  for (const classUri of classUris) {
    navigationByType[classUri] = [];
  }

  const allUris = [...new Set([...classUris, ...propertyUris])].sort((a, b) => a.localeCompare(b));
  const termMapping = {};
  for (const uri of allUris) {
    const defaultLabel = classUriToDefaultLabel.get(uri) || getReadableLabel(uri);
    termMapping[uri] = {
      defaultLabel,
      customLabel: "",
    };
  }

  return {
    multipage: false,
    style: "",
    root: {
      template: "template.html",
    },
    inputGroups: Array.isArray(inputGroups) ? cloneJson(inputGroups) : [],
    navigationByType,
    tabular: {
      mainNavType: "",
      columnLimit: 5,
      searchEnabled: true,
      columnSearchEnabled: false,
      includeFallbackColumns: true,
      hideColumns: [],
    },
    termMapping,
  };
}

async function loadStyleText(stylePath) {
  if (!stylePath) {
    return "";
  }
  if (isHttpUrl(stylePath)) {
    const response = await fetch(stylePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch style from URL: ${stylePath}`);
    }
    return await response.text();
  }

  if (!fs.existsSync(stylePath)) {
    throw new Error(`Style file not found: ${stylePath}`);
  }
  return fs.readFileSync(stylePath, "utf8");
}

program
  .name("html_preview")
  .description("Load an RO-Crate from a specified directory.")
  .argument("<path_to_crate_directory>", "Path to the crate directory.")
  .option(
    "-l, --layout <layoutPath>",
    "Filepath or URL to a layout file in JSON format. This forces the script to use the specified layout instead of the default or the one present in the crate. Use a raw link if the URL is from GitHub. (Default: \"https://github.com/Language-Research-Technology/crate-o/blob/main/src/lib/components/default_layout.json\")",
  )
  .option(
    "-c, --config <configPath>",
    "Filepath or URL to a configuration file in JSON format."
    )
    .option(
    "-m, --multipage-config <configPath>",
    "Deprecated alias for --config."
  )
  .option(
    "-s, --style <stylePath>",
    "Filepath or URL to a CSS file. Overrides config style and default.css."
  )
  .option(
    "--generate-config <configPath>",
    "Generate a starter config file with empty structure and termMapping for crate class/property URIs."
  )
  .option(
    "--rm",
    "Remove ro-crate-preview.html and ro-crate-preview_html directory from the crate."
  )
 
  

  .action(async (cratePath, options) => {
    if (!fs.existsSync(cratePath) || !fs.lstatSync(cratePath).isDirectory()) {
      console.error(`Error: ${cratePath} is not a valid directory`);
      return;
    }

    if (options.rm) {
      const previewHtmlPath = path.join(cratePath, "ro-crate-preview.html");
      const previewHtmlDirPath = path.join(cratePath, "ro-crate-preview_html");

      let removed = false;
      if (fs.existsSync(previewHtmlPath)) {
        fs.unlinkSync(previewHtmlPath);
        console.log(`Removed ${previewHtmlPath}`);
        removed = true;
      }
      if (fs.existsSync(previewHtmlDirPath)) {
        fs.rmSync(previewHtmlDirPath, { recursive: true, force: true });
        console.log(`Removed ${previewHtmlDirPath}`);
        removed = true;
      }
      if (!removed) {
        console.log("No preview files found to remove.");
      }
      return;
    }
    
    const metadataFile = path.join(cratePath, "ro-crate-metadata.json");
    if (!fs.existsSync(metadataFile)) {
      console.error(`Error: Metadata file not found in ${cratePath}`);
      return;
    }
    
    // Load optional config (preferred --config, deprecated --multipage-config)
    let configData = null;
    let configFilePath = null;
    const configFile = options.config || options.multipageConfig;
    if (options.multipageConfig && !options.config) {
      console.warn("Warning: -m/--multipage-config is deprecated. Use -c/--config instead.");
    }
    if (configFile) {
      console.log(`Using configuration from ${configFile}`);
      
      if (!fs.existsSync(configFile)) {
        console.error(`Error: Config file not found: ${configFile}`);
        return;
      }
      
      try {
        const configContent = fs.readFileSync(configFile, "utf8");
        configData = JSON.parse(configContent); // Parse the JSON content
        configFilePath = configFile;
      } catch (error) {
        console.error(`Error reading/parsing config file: ${error.message}`);
        return;
      }
    }

    const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));
    const templateFile = path.join(__dirname, "template.html");
    var template = fs.readFileSync(templateFile, "utf8");
    const crate = new ROCrate(metadata, { array: true, link: true });
    await crate.resolveContext();

    if (options.generateConfig) {
      const outputConfigPath = path.resolve(process.cwd(), options.generateConfig);
      const layout = await findLayout(crate, options.layout);
      const generatedConfig = buildGeneratedConfig(crate, layout);
      const outputDir = path.dirname(outputConfigPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      if (fs.existsSync(outputConfigPath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(outputConfigPath, "utf8"));
          const merged = mergeGeneratedConfig(existing, generatedConfig);
          fs.writeFileSync(outputConfigPath, JSON.stringify(merged, null, 2), "utf8");
          console.log(`Updated config at ${outputConfigPath} with missing generated fields.`);
        } catch (error) {
          console.error(`Error reading/parsing existing config file: ${error.message}`);
          return;
        }
      } else {
        fs.writeFileSync(outputConfigPath, JSON.stringify(generatedConfig, null, 2), "utf8");
        console.log(`Generated starter config at ${outputConfigPath}`);
      }
      return;
    }
    
    let layout;
    if (options.layout) {
      layout = await findLayout(crate, options.layout);
    } else if (configData && Array.isArray(configData.inputGroups) && configData.inputGroups.length > 0) {
      layout = configData.inputGroups;
      console.log("Using inputGroups from config.");
    } else {
      layout = await findLayout(crate, options.layout);
    }

    // Determine CSS source with precedence:
    // 1) CLI --style, 2) config "style" (or root.style), 3) default.css
    const defaultStylePath = path.join(__dirname, "default.css");
    const cliStyle = options.style || null;
    const configStyle = configData && (configData.style || (configData.root && configData.root.style))
      ? (configData.style || configData.root.style)
      : null;

    const stylePath = cliStyle
      ? resolveStylePath(cliStyle, process.cwd())
      : configStyle
        ? resolveStylePath(configStyle, configFilePath ? path.dirname(configFilePath) : process.cwd())
        : defaultStylePath;

    let styleText = "";
    try {
      styleText = await loadStyleText(stylePath);
      console.log(`Using style from ${stylePath}`);
    } catch (error) {
      console.error(`Error loading style: ${error.message}`);
      return;
    }

    // Pass the parsed config data and resolved layout
    const crateLite = {
        ...await roCrateToJSON(crate, configData, layout),
          cratePath: cratePath, // Pass cratePath to the template to use in path prefixing filter
    }

    // Load markdown content for File entities
    for (const [id, entity] of Object.entries(crateLite.ids)) {
      if (entity.id.match(/\.md$/i)) {
        const markdownPath = path.join(cratePath, entity.id);
        if (fs.existsSync(markdownPath)) {
          entity.content = fs.readFileSync(markdownPath, 'utf-8');
        }
      }
    }

    if (configFile) {

      template = fs.readFileSync(configData.root.template, "utf8");
      if (configData.multipage !== false) {
        for (const [entityId, pageDetails] of Object.entries(crateLite.pages)) {
        
          // Create a temporary crateLite with this entity as the entry point
          const pageData = {
            ...crateLite,
            entryPoint: entityId,
          };
          
          // For now, use the template file content for all pages
          // Later you might want to load different templates based on entity type
          console.log(`Rendering page for entity ${entityId} using template ${pageDetails.template}`);
          const pageTemplate = fs.readFileSync(pageDetails.template, "utf8");

          const html = renderTemplate(pageData, pageTemplate, layout, styleText);

          const outputPath = path.join(cratePath, pageDetails.path);
          const outputDir = path.dirname(outputPath);
          
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          fs.writeFileSync(outputPath, html, "utf-8");
          console.log(`Wrote page for ${entityId} to ${outputPath}`);
        }
      }
    } 
    const html = renderTemplate(crateLite, template, layout, styleText);
    fs.writeFileSync(
      path.join(cratePath, "ro-crate-preview.html"),
      html,
      "utf-8"
    );
    console.log(`Wrote preview to ${path.join(cratePath, "ro-crate-preview.html")}`);
  
  });
program.parse(process.argv);