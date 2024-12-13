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

async function findLayout(crate, TODO) {
  try {
    // Fetch the mapping
    const conformsToMapping = await fetchMapping();
    if (!conformsToMapping) {
      console.log("No mapping data available.");
      return;
    }

    // Get the conformsTo dynamically from the input JSON (metadata needs to be defined)
    const conformsToLookup = crate.rootDataset.conformsTo?.[0]?.['@id'];
    console.log(`conformsTo lookup: ${conformsToLookup}`);

    // Check if the conformsTo exists in the mapping
    if (conformsToLookup && conformsToMapping.hasOwnProperty(conformsToLookup)) {
      const mode = conformsToMapping[conformsToLookup];
      
      // Fetch the inputGroups from the mode
      const jsonData = await fetchJsonFromMode(mode);
      
      if (jsonData.inputGroups) {
        const layout = jsonData.inputGroups;
        // console.log("layoutFile:", layoutFile);
        console.log("layoutFile found.");
        return layout
      } else {
        console.log("No 'inputGroups' key found in the JSON file.");
      }}
      console.log(`conformsTo ${conformsToLookup} not found in the key-value list. Using default layout.`);
      const layoutFile = path.join(__dirname, 'lib/default_layout.json'); //TODO pass this in instead of path
      const layout = JSON.parse(fs.readFileSync(layoutFile, "utf8"));
      return layout
  } catch (error) {
    console.error("Error processing data:", error);
  }
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
  const crate = new ROCrate(metadata, { array: true, link: true });
  await crate.resolveContext();
  const crateLite = roCrateToJSON(crate);
  const layout = await findLayout(crate, options.layout);
  const html = renderTemplate(crateLite, template, layout)
    fs.writeFileSync(
      path.join(cratePath, "ro-crate-preview.html"),
      html,
      "utf-8"
    );
  

  });
program.parse(process.argv);