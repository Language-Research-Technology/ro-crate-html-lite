import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const program = new Command();
import { fileURLToPath } from 'url';
import { roCrateToJSON, renderTemplate } from './lib/preview.js';


program
  .name("load_ro_crate")
  .description("Load an RO-Crate from a specified directory")
  .argument("<path_to_crate_directory>", "Path to the crate directory")
  .option(
    "-l, --layout <layoutPath>",
    "Path to the layout file",
    path.join(__dirname, "lib", "default_layout.json")
  )

  .action(async (cratePath, options) => {
    if (!fs.existsSync(cratePath) || !fs.lstatSync(cratePath).isDirectory()) {
      console.error(`Error: ${cratePath} is not a valid directory`);
      return;
    }
    const metadataFile = path.join(cratePath, "ro-crate-metadata.json");
  if (!fs.existsSync(metadataFile)) {
    console.error(`Error: Metadata file not found in ${cratePath}`);
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));
  const templateFile = path.join(__dirname, "template.html");
  const template = fs.readFileSync(templateFile, "utf8");
  const layoutPath = options.layout;
  const layout = JSON.parse(fs.readFileSync(layoutPath, "utf8"));
  const crateLite = await roCrateToJSON(metadata, layout);
  const html = renderTemplate(crateLite, template, layout)
    fs.writeFileSync(
      path.join(cratePath, "ro-crate-preview.html"),
      html,
      "utf-8"
    );
  
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

async function processData() {
  try {
    // Fetch the mapping
    const conformsToMapping = await fetchMapping();
    if (!conformsToMapping) {
      console.log("No mapping data available.");
      return;
    }

    // Get the conformsTo dynamically from the input JSON (metadata needs to be defined)
    const conformsToLookup = metadata["@graph"][1].conformsTo["@id"];
    console.log(`conformsTo lookup: ${conformsToLookup}`);

    // Check if the conformsTo exists in the mapping
    if (conformsToMapping.hasOwnProperty(conformsToLookup)) {
      const mode = conformsToMapping[conformsToLookup];
      
      // Fetch the inputGroups from the mode
      const jsonData = await fetchJsonFromMode(mode);
      
      if (jsonData.inputGroups) {
        const layoutFile = jsonData.inputGroups;
        // console.log("layoutFile:", layoutFile);
        console.log("layoutFile found.");
      } else {
        console.log("No 'inputGroups' key found in the JSON file.");
      }
    } else {
      console.log(`conformsTo ${conformsToLookup} not found in the key-value list. Using default layout.`);
      const layoutFile = path.join(__dirname, 'lib/default_layout.json'); //TODO
      console.log("Using default layout:", layoutFile);
    }
  } catch (error) {
    console.error("Error processing data:", error);
  }
}
processData()
  });
program.parse(process.argv);