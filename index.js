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

  .action((cratePath, options) => {
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
  const crateLite = roCrateToJSON(metadata, layout);
  const html = renderTemplate(crateLite, template, layout)
    fs.writeFileSync(
      path.join(cratePath, "ro-crate-preview.html"),
      html,
      "utf-8"
    );
  });

program.parse(process.argv);

