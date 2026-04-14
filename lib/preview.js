import nunjucks from "nunjucks";
import crypto from 'crypto';
import markdownIt from "markdown-it";

function getReadableLabel(uri) {
  if (!uri || typeof uri !== "string") {
    return "Property";
  }
  const hashSplit = uri.split("#");
  if (hashSplit.length > 1 && hashSplit[1]) {
    return hashSplit[1];
  }
  const slashSplit = uri.split("/");
  return slashSplit[slashSplit.length - 1] || uri;
}

function summarizePropValues(propObj) {
  if (!propObj || !Array.isArray(propObj.fwd) || propObj.fwd.length === 0) {
    return "";
  }
  const values = propObj.fwd
    .map((val) => {
      if (val.target_name) {
        return val.target_name;
      }
      if (val.value && typeof val.value === "object") {
        return JSON.stringify(val.value);
      }
      if (val.value !== undefined && val.value !== null) {
        return String(val.value);
      }
      if (val.url) {
        return val.url;
      }
      return "";
    })
    .filter((v) => v);

  return values.join(", ");
}

function resolveTabularColumns(layout, entitiesForType, config = {}) {
  const seen = new Set();
  const ordered = [];

  if (Array.isArray(layout)) {
    for (const group of layout) {
      const inputs = group && Array.isArray(group.inputs) ? group.inputs : [];
      for (const input of inputs) {
        if (input === "@id" || input === "@type") {
          continue;
        }
        if (!seen.has(input)) {
          seen.add(input);
          ordered.push(input);
        }
      }
    }
  }

  const includeFallbackColumns = config.includeFallbackColumns !== false;
  if (includeFallbackColumns) {
    for (const entity of entitiesForType) {
      const props = entity && entity.props ? Object.keys(entity.props) : [];
      for (const propUri of props) {
        if (!seen.has(propUri)) {
          seen.add(propUri);
          ordered.push(propUri);
        }
      }
    }
  }

  const populated = ordered.filter((uri) =>
    entitiesForType.some((entity) => {
      const propObj = entity.props[uri];
      return propObj && Array.isArray(propObj.fwd) && propObj.fwd.length > 0;
    })
  );

  const defaultLimit = 6;
  const parsedLimit = Number.parseInt(config.columnLimit, 10);
  const columnLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit;

  return populated.slice(0, columnLimit);
}

function normalizeConfiguredColumns(configuredColumns) {
  if (!Array.isArray(configuredColumns) || configuredColumns.length === 0) {
    return [];
  }

  return configuredColumns
    .map((col) => {
      if (typeof col === "string") {
        return {
          uri: col,
          label: getReadableLabel(col)
        };
      }

      if (col && typeof col === "object" && typeof col.uri === "string") {
        return {
          uri: col.uri,
          label: typeof col.label === "string" && col.label.trim() ? col.label : getReadableLabel(col.uri),
          stripPrefix: typeof col.stripPrefix === "string" ? col.stripPrefix : ""
        };
      }

      return null;
    })
    .filter((col) => !!col);
}

function getColumnCellValue(entity, colDef) {
  if (!entity) {
    return "";
  }

  const colUri = colDef && typeof colDef === "object" ? colDef.uri : colDef;

  if (colUri === "@id") {
    const rawId = entity.id || "";
    if (colDef && typeof colDef.stripPrefix === "string" && colDef.stripPrefix) {
      return rawId.startsWith(colDef.stripPrefix)
        ? rawId.slice(colDef.stripPrefix.length)
        : rawId;
    }
    return rawId;
  }

  const propObj = entity.props[colUri];
  if (!propObj) {
    return "";
  }

  const fwdValues = Array.isArray(propObj.fwd) ? propObj.fwd : [];
  const revValues = Array.isArray(propObj.rev) ? propObj.rev : [];

  // Build cells array with link information where applicable
  const cells = [];
  
  for (let i = 0; i < fwdValues.length; i++) {
    const val = fwdValues[i];
    if (val.target_id && val.target_name) {
      cells.push({
        text: val.target_name,
        target_id: val.target_id,
        isReverse: false
      });
    } else if (val.target_name) {
      cells.push({
        text: val.target_name
      });
    } else if (val.value && typeof val.value === "object") {
      cells.push({
        text: JSON.stringify(val.value)
      });
    } else if (val.value !== undefined && val.value !== null) {
      cells.push({
        text: String(val.value)
      });
    } else if (val.url) {
      cells.push({
        text: val.url
      });
    }
  }
  
  for (let i = 0; i < revValues.length; i++) {
    const val = revValues[i];
    if (val.target_id && val.target_name) {
      cells.push({
        text: val.target_name,
        target_id: val.target_id,
        isReverse: true
      });
    }
  }

  // For search/filter purposes, convert to display string
  // But keep rich cell objects for rendering
  if (cells.length === 0) {
    return "";
  } else if (cells.length === 1) {
    return cells[0];
  } else if (cells.length <= 2) {
    // 2 values - return array for inline rendering
    return cells;
  } else {
    // 3+ values - mark as long for scrollable rendering
    return {
      isLong: true,
      items: cells
    };
  }
}

// Helper to convert cell value to searchable text
function getCellSearchText(cell) {
  if (!cell) return "";
  if (typeof cell === "string") return cell;
  if (cell.isLong && Array.isArray(cell.items)) return cell.items.map(c => getCellSearchText(c)).join(", ");
  if (cell.text) return cell.text;
  if (Array.isArray(cell)) return cell.map(c => getCellSearchText(c)).join(", ");
  return "";
}

function buildTabularData(crateLite, layout, multiPageConfig) {
  const config = multiPageConfig || {};
  const tabularConfig = config.tabular || {};
  const hasNavigationByType = !!config.navigationByType;
  const noConfigProvided = !multiPageConfig;

  const getTypeUsageCount = (typeName) => {
    const ids = Array.isArray(crateLite.types[typeName]) ? crateLite.types[typeName] : [];
    if (ids.length === 0) {
      return 0;
    }
    const nonRootCount = ids.filter((id) => id !== crateLite.entryPoint).length;
    return nonRootCount > 0 ? nonRootCount : ids.length;
  };

  const sortTypesByUsage = (typeNames) =>
    [...typeNames].sort((a, b) => {
      const diff = getTypeUsageCount(b) - getTypeUsageCount(a);
      if (diff !== 0) {
        return diff;
      }
      return a.localeCompare(b);
    });

  // Resolve the list of bare type names to include in tabular navigation.
  // navigationByType (preferred): keys are full type URIs e.g. "http://schema.org/Dataset".
  // Backward compat: fall back to Object.keys(types) if navigationByType is absent.
  let configuredTypes;
  if (noConfigProvided) {
    configuredTypes = sortTypesByUsage(Object.keys(crateLite.types)).map((typeName) => ({
      typeName,
      columnsConfig: []
    }));
  } else if (config.navigationByType) {
    configuredTypes = [];
    for (const navKey of Object.keys(config.navigationByType)) {
      if (crateLite.types[navKey]) {
        // Already a bare name that matches directly
        configuredTypes.push({
          typeName: navKey,
          columnsConfig: config.navigationByType[navKey]
        });
      } else {
        // URI key – reverse-lookup via typeUrls
        const bareName = Object.keys(crateLite.typeUrls).find(
          (t) => crateLite.typeUrls[t] === navKey
        );
        if (bareName && crateLite.types[bareName]) {
          configuredTypes.push({
            typeName: bareName,
            columnsConfig: config.navigationByType[navKey]
          });
        }
      }
    }
  } else if (config.types) {
    configuredTypes = Object.keys(config.types).map((typeName) => ({
      typeName,
      columnsConfig: []
    }));
  } else {
    configuredTypes = sortTypesByUsage(Object.keys(crateLite.types)).map((typeName) => ({
      typeName,
      columnsConfig: []
    }));
  }

  const typeEntries = {};
  for (const configuredType of configuredTypes) {
    const typeName = configuredType.typeName;
    const ids = Array.isArray(crateLite.types[typeName]) ? crateLite.types[typeName] : [];
    let rowIds = ids.filter((id) => id !== crateLite.entryPoint);
    if (rowIds.length === 0 && ids.length > 0) {
      rowIds = [...ids];
    }
    if (rowIds.length === 0) {
      continue;
    }

    const entities = rowIds
      .map((id) => crateLite.ids[id])
      .filter((entity) => !!entity);

    const configuredColumns = normalizeConfiguredColumns(configuredType.columnsConfig);
    const columns = configuredColumns.length > 0
      ? configuredColumns
      : resolveTabularColumns(layout, entities, tabularConfig).map((uri) => {
        const firstEntityWithProp = entities.find((entity) => entity.props[uri]);
        const label = firstEntityWithProp && firstEntityWithProp.props[uri] && firstEntityWithProp.props[uri].label
          ? firstEntityWithProp.props[uri].label
          : getReadableLabel(uri);
        return { uri, label };
      });

    const rows = entities
      .map((entity) => {
        const nameProp = entity.props["http://schema.org/name"];
        const displayName = summarizePropValues(nameProp) || entity.id;
        const cells = columns.map((col) => getColumnCellValue(entity, col));
        
        // Pre-compute search text for each cell
        const cellSearchTexts = cells.map((cell) => {
          if (!cell) return "";
          if (typeof cell === "string") return cell;
          if (cell.text) return cell.text;
          if (Array.isArray(cell)) return cell.map(c => (c && c.text) ? c.text : "").join(", ");
          return "";
        });
        
        return {
          id: entity.id,
          displayName,
          pagePath: crateLite.pages[entity.id] ? crateLite.pages[entity.id].path : "",
          cells,
          cellSearchTexts
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    typeEntries[typeName] = {
      columns,
      rows
    };
  }

  const configuredTypeOrder = configuredTypes
    .map((configuredType) => configuredType.typeName)
    .filter((typeName, index, arr) => arr.indexOf(typeName) === index);

  const navTypes = hasNavigationByType
    ? configuredTypeOrder.filter((typeName) => !!typeEntries[typeName])
    : sortTypesByUsage(Object.keys(typeEntries));
  const navType = tabularConfig.mainNavType && typeEntries[tabularConfig.mainNavType]
    ? tabularConfig.mainNavType
    : navTypes[0] || null;

  const navItems = navTypes.map((typeName) => {
    const count = typeEntries[typeName].rows.length;
    return {
      type: typeName,
      count,
      label: `${typeName} (${count})`
    };
  });

  return {
    enabled: Object.keys(typeEntries).length > 0,
    navOnly: false,
    hideRootSummary: true,
    searchEnabled: noConfigProvided ? true : tabularConfig.searchEnabled !== false,
    columnSearchEnabled: tabularConfig.columnSearchEnabled === true,
    mainNavType: navType,
    navTypes,
    navItems,
    types: typeEntries
  };
}

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
  let uri = crate.resolveTerm(prop) || prop;
  if (
    uri === prop &&
    typeof prop === "string" &&
    !prop.startsWith("@") &&
    !prop.includes(":") &&
    !prop.startsWith("http://") &&
    !prop.startsWith("https://")
  ) {
    uri = `http://schema.org/${prop}`;
  }
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

async function roCrateToJSON(crate, multiPageConfig, layout = []) {
  const multipageEnabled = !!(multiPageConfig && multiPageConfig.multipage !== false);
  const crateLite = {
    entryPoint: crate.rootDataset["@id"],
    pages: {},
    ids: {},
    types: {},
    typeUrls: {},
  };

  // First pass to create pages if multiPageConfig is provided
  if (multipageEnabled) {
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
  crateLite.tabular = buildTabularData(crateLite, layout, multiPageConfig);

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
    if (aboutPath.startsWith(data.cratePath)) {
      return aboutPath;
    }
    // Browser-compatible path joining
    const cratePath = data.cratePath.endsWith('/') ? data.cratePath : data.cratePath + '/';
    return cratePath + aboutPath;
  });

  // renderMarkdown filter: converts markdown text to HTML
  // Note: In browser context, this expects markdown content, not a file path
  env.addFilter("renderMarkdown", function (markdownContent) {
    if (!markdownContent || typeof markdownContent !== 'string') {
      console.warn('Invalid markdown content provided');
      return "";
    }
    return markdownIt().render(markdownContent);
  });

  return env.renderString(template, { data, layout });
}

export { roCrateToJSON, quadTreeId, renderTemplate };
