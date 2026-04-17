import { strict as assert } from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const indexPath = path.join(repoRoot, "index.js");
const sampleCratePath = path.join(repoRoot, "test_data", "sample", "crate");
const layoutPath = path.join(repoRoot, "lib", "default_layout.json");

function runGenerateConfig(configPath) {
  execFileSync(
    process.execPath,
    [indexPath, sampleCratePath, "--layout", layoutPath, "--generate-config", configPath],
    { cwd: repoRoot, stdio: "pipe" }
  );
}

describe("index.js --generate-config", function () {
  this.timeout(30000);

  let tempDir;

  beforeEach(function () {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ro-crate-generate-config-"));
  });

  afterEach(function () {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates a config that includes inputGroups from the provided/found layout", function () {
    const configPath = path.join(tempDir, "generated-config.json");
    const expectedInputGroups = JSON.parse(fs.readFileSync(layoutPath, "utf8"));

    runGenerateConfig(configPath);

    const generated = JSON.parse(fs.readFileSync(configPath, "utf8"));
    assert.ok(Array.isArray(generated.inputGroups), "inputGroups should be present");
    assert.deepEqual(
      generated.inputGroups,
      expectedInputGroups,
      "inputGroups should be written from the passed/found layout"
    );
    assert.ok(generated.termMapping, "termMapping should be present");
  });

  it("updates existing config by adding missing data without changing existing settings", function () {
    const configPath = path.join(tempDir, "existing-config.json");
    const existingConfig = {
      multipage: true,
      termMapping: {
        "http://schema.org/name": {
          defaultLabel: "Old Name Label",
          customLabel: "Preferred Name",
        },
      },
      inputGroups: [
        {
          name: "Custom Group",
          inputs: ["http://schema.org/name"],
        },
      ],
    };
    fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2), "utf8");

    runGenerateConfig(configPath);

    const updated = JSON.parse(fs.readFileSync(configPath, "utf8"));

    assert.equal(updated.multipage, true, "existing scalar values should not be overwritten");
    assert.deepEqual(
      updated.inputGroups,
      existingConfig.inputGroups,
      "existing inputGroups should not be changed"
    );
    assert.equal(
      updated.termMapping["http://schema.org/name"].defaultLabel,
      "Old Name Label",
      "existing termMapping.defaultLabel should be preserved"
    );
    assert.equal(
      updated.termMapping["http://schema.org/name"].customLabel,
      "Preferred Name",
      "existing termMapping.customLabel should be preserved"
    );

    assert.ok(updated.root && updated.root.template, "missing root.template should be added");
    assert.ok(updated.tabular, "missing tabular defaults should be added");
    assert.ok(
      updated.termMapping["http://schema.org/description"],
      "missing term mappings should be added"
    );
  });

  it("adds inputGroups when they are missing in an existing config", function () {
    const configPath = path.join(tempDir, "missing-input-groups.json");
    const existingConfig = {
      multipage: false,
      termMapping: {},
    };
    fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2), "utf8");

    runGenerateConfig(configPath);

    const updated = JSON.parse(fs.readFileSync(configPath, "utf8"));
    assert.ok(Array.isArray(updated.inputGroups), "inputGroups should be added when missing");
    assert.ok(updated.inputGroups.length > 0, "added inputGroups should not be empty");
  });
});
