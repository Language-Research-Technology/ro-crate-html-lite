import { strict as assert } from "assert";
import { roCrateToJSON, quadTreeId } from "../lib/preview.js";
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
      console.log("Converted JSON:", JSON.stringify(result, null, 2));
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
        fs.readFileSync("test_data/f2fnew/ro-crate-metadata.json", "utf8")
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
      console.log("Pages generated:", result.pages);

      // Check that pages are generated for entities of specified types
      assert.equal(
          Object.keys(result.pages).length,
          171,
        "Should have generated pages"
      );
    
      console.log("✅ Multi-page configuration test passed");
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
