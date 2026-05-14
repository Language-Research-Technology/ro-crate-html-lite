/**
 * Fetch the mapping JSON between conformsTo and mode
 */
export async function fetchMapping() {
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

/**
 * Fetch JSON from any URL
 * @param {string} url 
 * @returns 
 */
export async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch url: ${url}, Status: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching from URL:', error.message);
    throw error;
  }
}

var layoutsCache;
export async function fetchLayouts(refresh) {
  if (!layoutsCache || refresh) {
    const conformsToMapping = await fetchMapping();
    const defaultLayout = await fetchJson('https://raw.githubusercontent.com/Language-Research-Technology/crate-o/refs/heads/main/src/lib/components/default_layout.json');
    const layouts = layoutsCache = { default: defaultLayout };
    for (const key in conformsToMapping) {
      const mode = await fetchJson(conformsToMapping[key]);
      if (mode.inputGroups) {
        layouts[key] = mode.inputGroups;
      }
    }
  }
  return layoutsCache;
  //console.log('export const layouts = ' + JSON.stringify(layouts) + ';');  
}