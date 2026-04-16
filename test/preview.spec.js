import { strict as assert } from "assert";
import { roCrateToJSON } from "../lib/preview.js";
import { ROCrate } from "ro-crate";
import fs from "fs";

describe("preview.js", function () {
  describe("roCrateToJSON", function () {
    it("should convert a basic RO-Crate to JSON format", async function () {
      // Create a basic RO-Crate using the ro-crate library
      const crate = new ROCrate({ array: true, link: true });

      // Set the name of the root dataset
      crate.root.name = "Test RO-Crate";
      crate.root.description = "A test crate for unit testing";

      // Add a simple file entity
      crate.root.hasPart = {
        "@id": "test-file.txt",
        "@type": "File",
        name: "Test File",
        description: "A test file",
      };

      // Link the person as author of the root dataset
      crate.root.author = {
        "@id": "https://orcid.org/0000-0000-0000-0000",
        "@type": "Person",
        name: "Test Author",
        email: "test@example.com",
      };

      // Add a part with a diff prefix
      crate.root["pcdm:hasMember"] = {
        "@id": "#object1",
        "@type": "RepositoryObject",
        name: "Repo Object",
        description: "...",
      };

      // Convert to JSON using our function
      const result = await roCrateToJSON(crate);
      //console.log("Converted JSON:", JSON.stringify(result, null, 2));
      // Test the basic structure
      assert.ok(result, "Result should exist");
      assert.ok(result.entryPoint, "Should have an entry point");
      assert.ok(result.ids, "Should have an ids object");
      assert.ok(result.types, "Should have a types object");
      assert.ok(result.typeUrls, "Should have a typeUrls object");

      // Test that the root dataset is properly converted
      const rootEntity = result.ids[result.entryPoint];
      assert.ok(rootEntity, "Root entity should exist in ids");
      assert.equal(rootEntity.id, "./", "Root entity should have correct id");
      assert.ok(
        rootEntity.type.includes("Dataset"),
        "Root entity should be of type Dataset"
      );

      // Test that the name property is properly expanded
      const nameUri = "http://schema.org/name";
      assert.ok(
        rootEntity.props[nameUri].fwd,
        "Name should have forward values"
      );
      assert.equal(
        rootEntity.props[nameUri].fwd.length,
        1,
        "Should have one name value"
      );
      assert.equal(
        rootEntity.props[nameUri].fwd[0].value,
        "Test RO-Crate",
        "Name should match what we set"
      );

      // Test that the file entity is included
      const fileEntityResult = result.ids["test-file.txt"];
      assert.ok(fileEntityResult, "File entity should exist");
      assert.equal(
        fileEntityResult.id,
        "test-file.txt",
        "File entity should have correct id"
      );
      assert.ok(
        fileEntityResult.type.includes("File"),
        "File entity should be of type File"
      );

      // Test that the person entity is included
      const personEntityResult =
        result.ids["https://orcid.org/0000-0000-0000-0000"];
      assert.ok(personEntityResult, "Person entity should exist");
      assert.ok(
        personEntityResult.type.includes("Person"),
        "Person entity should be of type Person"
      );

      // Test that the author relationship is properly expanded
      const authorUri = "http://schema.org/author";
      assert.ok(authorUri, "Should have an author property");
      assert.ok(
        rootEntity.props[authorUri].fwd,
        "Author should have forward values"
      );
      assert.equal(
        rootEntity.props[authorUri].fwd.length,
        1,
        "Should have one author value"
      );
      assert.equal(
        rootEntity.props[authorUri].fwd[0].target_id,
        "https://orcid.org/0000-0000-0000-0000",
        "Author should link to person entity"
      );
      assert.equal(
        rootEntity.props[authorUri].fwd[0].target_name,
        "Test Author",
        "Author should have correct name"
      );

      // check that the pcdm:hasMember relationship is properly expanded
      const hasMemberUri = "http://pcdm.org/models#hasMember";
      assert.ok(
        rootEntity.props[hasMemberUri],
        "Should have a pcdm:hasMember property"
      );
      assert.ok(
        rootEntity.props[hasMemberUri].fwd,
        "pcdm:hasMember should have forward values"
      );
      assert.equal(
        rootEntity.props[hasMemberUri].fwd.length,
        1,
        "Should have one pcdm:hasMember value"
      );
      assert.equal(
        rootEntity.props[hasMemberUri].fwd[0].target_id,
        "#object1",
        "pcdm:hasMember should link to the RepositoryObject entity"
      );
      assert.equal(
        rootEntity.props[hasMemberUri].fwd[0].target_name,
        "Repo Object",
        "pcdm:hasMember should have correct name"
      );

      // Test that types are properly categorized
      assert.ok(result.types.Dataset, "Should have Dataset type category");
      assert.ok(result.types.File, "Should have File type category");
      assert.ok(result.types.Person, "Should have Person type category");
      assert.ok(
        result.types.Dataset.includes("./"),
        "Dataset type should include root entity"
      );
      assert.ok(
        result.types.File.includes("test-file.txt"),
        "File type should include test file"
      );
      assert.ok(
        result.types.Person.includes("https://orcid.org/0000-0000-0000-0000"),
        "Person type should include test person"
      );

      console.log("✅ roCrateToJSON test passed");
    });

    it("should handle empty crate", async function () {
      // Create an empty crate
      const crate = new ROCrate({ array: true, link: true });

      // Convert to JSON
      const result = await roCrateToJSON(crate);

      // Test basic structure exists even for empty crate
      assert.ok(result, "Result should exist");
      assert.ok(result.entryPoint, "Should have an entry point");
      assert.ok(result.ids, "Should have an ids object");
      assert.ok(result.types, "Should have a types object");

      // Should at least have the root dataset
      const rootEntity = result.ids[result.entryPoint];
      assert.ok(rootEntity, "Root entity should exist");
      assert.ok(rootEntity.type.includes("Dataset"), "Root should be Dataset");

      console.log("✅ Empty crate test passed");
    });

    it("should handle external URLs in properties", async function () {
      // Create a crate with external URL references
      const crate = new ROCrate({ array: true, link: true });

      // Add an entity that references an external URL
      const datasetEntity = {
        "@id": "data.csv",
        "@type": "File",
        name: "Data File",
        license: { "@id": "https://creativecommons.org/licenses/by/4.0/" },
      };
      crate.addEntity(datasetEntity);

      // Convert to JSON
      const result = await roCrateToJSON(crate);

      // Check that external URLs are properly handled
      const fileEntity = result.ids["data.csv"];
      assert.ok(fileEntity, "File entity should exist");

      // Find license property
      const licenseUri = Object.keys(fileEntity.props).find(
        (key) => fileEntity.props[key].label === "license" || key === "license"
      );
      assert.ok(licenseUri, "Should have license property");
      assert.ok(
        fileEntity.props[licenseUri].fwd,
        "License should have forward values"
      );
      assert.equal(
        fileEntity.props[licenseUri].fwd[0].url,
        "https://creativecommons.org/licenses/by/4.0/",
        "License should be external URL"
      );

      console.log("✅ External URL test passed");
    });

    it("Should handle multi-page configuration", async function () {
      // Create a crate with multiple entities of different types
      const crateData = JSON.parse(
        fs.readFileSync("test_data/f2fnew/data/ro-crate-metadata.json", "utf8")
      );
      const crate = new ROCrate(crateData, { array: true, link: true });
      const multiPageConfig = {
        types: {
          RepositoryObject: {
            template: "test_data/f2f-subobject-template.html",
          },
          Person: { template: "test_data/f2f-subobject-template.html" },
        },
        root: { template: "test_data/f2f-root-template.html" },
      };

      crate.resolveContext();

      // Convert to JSON with multi-page config
      const result = await roCrateToJSON(crate, multiPageConfig);
      //console.log("Pages generated:", result.pages);

      // Check that pages are generated for entities of specified types
      assert.equal(
          Object.keys(result.pages).length,
          171,
        "Should have generated pages"
      );
    
      console.log("✅ Multi-page configuration test passed");
    });

    it("should generate tabular summaries ordered by inputGroups", async function () {
      const crateData = JSON.parse(
        fs.readFileSync("test_data/f2fnew/data/ro-crate-metadata.json", "utf8")
      );
      const crate = new ROCrate(crateData, { array: true, link: true });
      await crate.resolveContext();

      const multiPageConfig = {
        types: {
          RepositoryObject: {
            template: "test_data/f2fnew/templates/f2f-subobject-template.html",
          },
        },
        root: { template: "test_data/f2fnew/templates/f2f-root-template.html" },
        tabular: {
          mainNavType: "RepositoryObject",
          columnLimit: 4,
          includeFallbackColumns: false,
        },
      };
      multiPageConfig.navigationByType = {
        "http://pcdm.org/models#Object": [],
        "http://schema.org/MediaObject": [],
      };

      const layout = [
        {
          name: "About",
          inputs: [
            "http://schema.org/name",
            "http://schema.org/description",
            "http://schema.org/license",
          ],
        },
      ];

      const result = await roCrateToJSON(crate, multiPageConfig, layout);
      assert.ok(result.tabular, "Should include tabular metadata");
      assert.equal(result.tabular.mainNavType, "RepositoryObject");
      assert.ok(
        result.tabular.types.RepositoryObject,
        "Should include RepositoryObject tabular entries"
      );

      const columns = result.tabular.types.RepositoryObject.columns;
      assert.ok(
        columns.length > 0 && columns.length <= 4,
        "Should include populated columns up to tabular columnLimit"
      );
      assert.equal(
        columns[0].uri,
        "http://schema.org/name",
        "First column should follow layout input ordering"
      );
      assert.equal(
        columns[1].uri,
        "http://schema.org/description",
        "Second column should follow layout input ordering"
      );

      const row = result.tabular.types.RepositoryObject.rows[0];
      assert.ok(row, "Should include at least one tabular row");
      assert.ok(
        typeof row.pagePath === "string",
        "Row should include a path for navigation"
      );
      assert.equal(
        row.cells.length,
        columns.length,
        "Each row should provide one cell per configured column"
      );
    });

    it("should use configured navigationByType columns in order with custom labels", async function () {
      const crateData = JSON.parse(
        fs.readFileSync("test_data/oral-history/crate/ro-crate-metadata.json", "utf8")
      );
      const crate = new ROCrate(crateData, { array: true, link: true });
      await crate.resolveContext();

      const config = {
        multipage: false,
        root: { template: "template.html" },
        navigationByType: {
          "http://pcdm.org/models#Collection": [
            { uri: "http://schema.org/name", label: "Collection name" },
            { uri: "http://schema.org/description", label: "Collection description" },
            { uri: "@id", label: "ID", stripPrefix: "#collection-" },
          ],
        },
        tabular: {
          mainNavType: "RepositoryCollection",
          searchEnabled: true,
          columnSearchEnabled: true,
        },
      };

      const result = await roCrateToJSON(crate, config, []);
      assert.ok(result.tabular && result.tabular.enabled, "Tabular should be enabled");
      assert.equal(result.tabular.columnSearchEnabled, true, "Column search should be enabled from config");
      assert.ok(result.tabular.types.RepositoryCollection, "Should include RepositoryCollection tabular entries");

      const columns = result.tabular.types.RepositoryCollection.columns;
      assert.equal(columns.length, 3, "Should use exactly configured columns");
      assert.equal(columns[0].uri, "http://schema.org/name");
      assert.equal(columns[0].label, "Collection name");
      assert.equal(columns[1].uri, "http://schema.org/description");
      assert.equal(columns[1].label, "Collection description");
      assert.equal(columns[2].uri, "@id");
      assert.equal(columns[2].label, "ID");

      const firstRow = result.tabular.types.RepositoryCollection.rows[0];
      assert.ok(firstRow, "Should include at least one row");
      assert.ok(
        !String(firstRow.cells[2] || "").startsWith("#collection-"),
        "Configured stripPrefix should be applied to @id values"
      );
    });

    it("should normalise bare property terms to URIs so layout inputGroups can match them", async function () {
      const crateData = JSON.parse(
        fs.readFileSync("test_data/sample/crate/ro-crate-metadata.json", "utf8")
      );
      const crate = new ROCrate(crateData, { array: true, link: true });
      await crate.resolveContext();

      const config = JSON.parse(fs.readFileSync("test_data/sample/sample-config.json", "utf8"));
      const layout = JSON.parse(fs.readFileSync("lib/default_layout.json", "utf8"));

      const result = await roCrateToJSON(crate, config, layout);

      const rootEntity = result.ids[result.entryPoint];
      assert.ok(rootEntity, "Root entity should exist");

      const propKeys = Object.keys(rootEntity.props);

      // Schema.org properties from the sample crate must be stored as full URIs
      assert.ok(
        propKeys.includes("http://schema.org/name"),
        'Props should contain "http://schema.org/name" not bare "name"'
      );
      assert.ok(
        propKeys.includes("http://schema.org/description"),
        'Props should contain "http://schema.org/description" not bare "description"'
      );

      // Bare terms (no colon or http prefix, not @-keywords) must NOT appear as prop keys
      const bareTermKeys = propKeys.filter(
        (k) => !k.includes(":") && !k.startsWith("@")
      );
      assert.deepEqual(
        bareTermKeys,
        [],
        `Bare property terms should be normalised to URIs (found: ${bareTermKeys.join(", ")})`
      );

      // The layout "About" group's URIs must be present among prop keys to ensure grouping works
      const aboutInputs = layout.find((g) => g.name === "About").inputs.filter((u) => u.startsWith("http"));
      const matchedAbout = aboutInputs.filter((u) => propKeys.includes(u));
      assert.ok(
        matchedAbout.length > 0,
        `At least one "About" group URI should match root entity props (layout URIs: ${aboutInputs.join(", ")})`
      );

      console.log("✅ inputGroup URI normalisation regression test passed");
    });

    it("should keep tabular data when multipage is disabled", async function () {
      const crateData = JSON.parse(
        fs.readFileSync("test_data/sample/crate/ro-crate-metadata.json", "utf8")
      );
      const crate = new ROCrate(crateData, { array: true, link: true });
      await crate.resolveContext();

      const config = {
        multipage: false,
        root: { template: "template.html" },
        navigationByType: {
          "http://schema.org/Dataset": [],
        },
        tabular: {
          mainNavType: "Dataset",
          columnLimit: 5,
          searchEnabled: true,
        },
      };

      const layout = JSON.parse(fs.readFileSync("lib/default_layout.json", "utf8"));
      const result = await roCrateToJSON(crate, config, layout);

      assert.equal(
        Object.keys(result.pages).length,
        0,
        "No per-entity pages should be generated when multipage is disabled"
      );
      assert.ok(result.tabular && result.tabular.enabled, "Tabular data should still be generated");
      assert.ok(
        result.tabular.types.Dataset && result.tabular.types.Dataset.rows.length > 0,
        "Dataset tabular rows should be present"
      );
    });

    it("should deduplicate reciprocal hasPart/isPartOf and hasMember/memberOf pairs", async function () {
      const crateData = {
        "@context": "https://w3id.org/ro/crate/1.1/context",
        "@graph": [
          {
            "@id": "ro-crate-metadata.json",
            "@type": "CreativeWork",
            about: { "@id": "./" },
            conformsTo: { "@id": "https://w3id.org/ro/crate/1.1" },
          },
          {
            "@id": "./",
            "@type": ["Dataset"],
            name: "Reciprocal test root",
            hasPart: { "@id": "file-1.txt" },
            "pcdm:hasMember": { "@id": "#object-1" },
          },
          {
            "@id": "file-1.txt",
            "@type": ["File"],
            isPartOf: { "@id": "./" },
          },
          {
            "@id": "#object-1",
            "@type": ["RepositoryObject"],
            "pcdm:memberOf": { "@id": "./" },
          },
        ],
      };

      const crate = new ROCrate(crateData, { array: true, link: true });
      await crate.resolveContext();

      const result = await roCrateToJSON(crate, null, []);

      const root = result.ids["./"];
      const file = result.ids["file-1.txt"];
      const repoObject = result.ids["#object-1"];

      assert.ok(root, "Root entity should exist");
      assert.ok(file, "File entity should exist");
      assert.ok(repoObject, "RepositoryObject entity should exist");

      assert.ok(root.props["http://schema.org/hasPart"], "Root should keep hasPart");
      assert.ok(
        !root.props["http://schema.org/isPartOf"],
        "Root should not also include reciprocal isPartOf"
      );

      assert.ok(file.props["http://schema.org/isPartOf"], "File should keep isPartOf");
      assert.ok(
        !file.props["http://schema.org/hasPart"],
        "File should not also include reciprocal hasPart"
      );

      assert.ok(root.props["http://pcdm.org/models#hasMember"], "Root should keep pcdm:hasMember");
      assert.ok(
        !root.props["http://pcdm.org/models#memberOf"],
        "Root should not also include reciprocal pcdm:memberOf"
      );

      assert.ok(
        repoObject.props["http://pcdm.org/models#memberOf"],
        "RepositoryObject should keep pcdm:memberOf"
      );
      assert.ok(
        !repoObject.props["http://pcdm.org/models#hasMember"],
        "RepositoryObject should not also include reciprocal pcdm:hasMember"
      );
    });
  });
});

// If running directly with Node.js (not via Mocha)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Running preview.js tests...");

  // Simple test runner for direct execution
  async function runTests() {
    try {
      // Test 1: Basic crate
      console.log("Testing basic RO-Crate conversion...");
      const crate = new ROCrate();
      crate.rootDataset.name = "Test RO-Crate";
      crate.rootDataset.description = "A test crate for unit testing";

      const result = await roCrateToJSON(crate);

      if (result && result.entryPoint && result.ids && result.types) {
        console.log("✅ Basic structure test passed");
      } else {
        console.log("❌ Basic structure test failed");
      }

      // Test 2: Check root dataset name
      const rootEntity = result.ids[result.entryPoint];
      const nameProperty = Object.values(rootEntity.props).find(
        (prop) =>
          prop.label === "name" &&
          prop.fwd &&
          prop.fwd[0] &&
          prop.fwd[0].value === "Test RO-Crate"
      );

      if (nameProperty) {
        console.log("✅ Name property test passed");
      } else {
        console.log("❌ Name property test failed");
      }

      console.log("All tests completed!");
    } catch (error) {
      console.error("Test failed with error:", error);
    }
  }

  runTests();
}
