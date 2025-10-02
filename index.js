import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { ROCrate } from 'ro-crate';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const program = new Command();
import { fileURLToPath } from 'url';
import { roCrateToJSON, renderTemplate } from './lib/preview.js';
import { config } from 'process';

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

program
  .name("html_preview")
  .description("Load an RO-Crate from a specified directory.")
  .argument("<path_to_crate_directory>", "Path to the crate directory.")
  .option(
    "-l, --layout <layoutPath>",
    "Filepath or URL to a layout file in JSON format. This forces the script to use the specified layout instead of the default or the one present in the crate. Use a raw link if the URL is from GitHub. (Default: \"https://github.com/Language-Research-Technology/crate-o/blob/main/src/lib/components/default_layout.json\")",
  )
  .option(
   "-m --multipage-config <configPath>",
   "Filepath or URL to a multipage configuration file in JSON format."
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
    
    // Fix the multipage config handling
    let configData = null;
    if (options.multipageConfig) {
      const configFile = options.multipageConfig;
      console.log(`Using multipage configuration from ${configFile}`);
      
      if (!fs.existsSync(configFile)) {
        console.error(`Error: Config file not found: ${configFile}`);
        return;
      }
      
      try {
        const configContent = fs.readFileSync(configFile, "utf8");
        configData = JSON.parse(configContent); // Parse the JSON content
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
    
    // Pass the parsed config data, not the raw string
    const crateLite = {
        ...await roCrateToJSON(crate, configData),
          cratePath: cratePath, // Pass cratePath to the template to use in path prefixing filter
    }
    const layout = await findLayout(crate, options.layout);

    if (options.multipageConfig) {

      template = fs.readFileSync(configData.root.template, "utf8");
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

        const html = renderTemplate(pageData, pageTemplate, layout);

        const outputPath = path.join(cratePath, pageDetails.path);
        const outputDir = path.dirname(outputPath);
        
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, html, "utf-8");
        console.log(`Wrote page for ${entityId} to ${outputPath}`);
      }
    } 
    const html = renderTemplate(crateLite, template, layout);
    fs.writeFileSync(
      path.join(cratePath, "ro-crate-preview.html"),
      html,
      "utf-8"
    );
    console.log(`Wrote preview to ${path.join(cratePath, "ro-crate-preview.html")}`);
  
  });
program.parse(process.argv);