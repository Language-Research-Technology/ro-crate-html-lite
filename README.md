# ro-crate-html-lite

A tool to create a complete, completely static `ro-crate-preview.html` file with the same functionality as [ro-crate-html-js](https://github.com/UTS-eResearch/ro-crate-html-js) but without any dependence on online resources or JavaScript (except for some small helpers).

HTML Preview Lite is available without any installation at the [RO-Crate Playground](https://ro-crate.ldaca.edu.au/).

## Install

```
npm install .

```

## Usage

```
node index.js [options] <path_to_crate_directory>

Load an RO-Crate from a specified directory.

Arguments:
path_to_crate_directory     Path to the crate directory.

Options:
-l, --layout <layoutPath>   Filepath or URL to a layout file in JSON format. This forces the script to use the specified layout (input groups) instead of the default or the one present in the crate. Use raw link if URL is from GitHub. (Default: "https://github.com/Language-Research-Technology/crate-o/blob/main/src/lib/components/default_layout.json")

-c, --config <configPath>           Filepath or URL to a configuration file in JSON format.

-m, --multipage-config <configPath> Deprecated alias for --config.

-s, --style <stylePath>      Filepath or URL to a CSS file. Overrides config style and default.css.

--stye <stylePath>           Deprecated alias for --style.

-h, --help                  Display help for command.
```

### CSS loading

CSS is loaded by the generator and injected into the HTML template (not linked with a stylesheet URL).

Style resolution order:

1. CLI `--style` (or deprecated `--stye`)
2. Config `style` (or `root.style`)
3. `default.css` in project root

Examples:

```bash
# Use default.css
node index.js test_data/COOEE/crate

# Use style from config
node index.js -c test_data/oral-history/oral-history-single-page-config.json test_data/oral-history/crate

# Override style from CLI
node index.js --style test_data/oral-history/oral-history-blue.css test_data/COOEE/crate
```

### About Page

To generate an About page for the site:
1. Include an entry for the file in the RO-Crate with `@type` of `File` and `AboutPage`. Use the path to the about content (in markdown format) as the entry's `@id`.  The `encodingFormat` describes the markdown file media type, and `isRef_about` indicates that the about information is related to the collection (rather than, say one of the collection objects).

```json
{
    "@id": "about/about.md",
    "@type": [
        "File",
        "AboutPage"
    ], 
    "encodingFormat":	"text/markdown",
    "isRef_about": "./"
},
```

2. Save the markdown file in the crate directory according to the path given as the file ID.

3. Associate the `AboutPage` type with a template in the multipage config.



## Run with test data

Sample crate:

```
node index.js test_data/sample/crate
```

Sample crate with tabular summary and no multipage output:

```
node index.js -c test_data/sample/sample-config.json test_data/sample/crate
```

Farms to freeways -- multiple pages  

```
node index.js -c test_data/f2fnew/f2fconfig.json test_data/f2fnew/data
```

### Optional tabular summary settings for multipage configs

You can add a `tabular` block to a multipage config to generate 
tablular summary on the root page.

```json
{
    "types": {
        "RepositoryCollection": {
            "template": "test_data/oral-history/templates/oral-history-collection-template.html"
        }
    },
    "root": {
        "template": "test_data/oral-history/templates/oral-history-root-template.html"
    },
    "tabular": {
        "mainNavType": "RepositoryCollection",
        "columnLimit": 6,
        "searchEnabled": true,
        "includeFallbackColumns": true
    }
}
```

You can also provide explicit per-type navigation and columns with `navigationByType`:

```json
{
    "multipage": false,
    "style": "oral-history-blue.css",
    "root": {"template": "template.html"},
    "navigationByType": {
        "http://pcdm.org/models#Collection": [
            {"uri": "http://schema.org/name", "label": "Collection name"},
            {"uri": "http://schema.org/description", "label": "Collection description"},
            {"uri": "http://schema.org/about", "label": "Collection subjects"},
            {"uri": "https://schema.org/holdingArchive", "label": "Collection holder"},
            {"uri": "http://schema.org/author", "label": "Contributor"}
        ]
    },
    "tabular": {
        "mainNavType": "RepositoryCollection",
        "columnLimit": 5,
        "searchEnabled": true,
        "columnSearchEnabled": false,
        "includeFallbackColumns": true
    }
}
```

How columns are chosen:

- Column order follows `inputGroups` from the resolved layout.
- If `navigationByType` is present, dropdown order follows config order.
- Columns with no values for that type are skipped.
- If `includeFallbackColumns` is `true`, extra populated properties not listed in `inputGroups` can be appended.
- `columnLimit` caps the number of columns shown in the summary table.
- `columnSearchEnabled` enables per-column search inputs in the table header.

`navigationByType` accepts full type URIs. Matching includes a local-name fallback so equivalent URI variants (for example `http`/`https`) still resolve.

If you want tabular summaries without generating per-entity pages, set:

```json
"multipage": false
```

in the config file.

### Demo styles

- Default style: `default.css`
- Oral-history blue demo: `test_data/oral-history/oral-history-blue.css`

## Contributing

To format the template run `npm run format`

### HTML Validation continuous integration

This repo has HTML validation set up to run on push/PR. It prints the report on the summary page of each [Actions workflow run](https://github.com/Language-Research-Technology/ro-crate-html-lite/actions/workflows/main.yml). The CI run won't fail on any validation errors, it's just for our information.

The validator is currently set up to only check `test_data/**/ro-crate-preview.html` files, this means that multipage previews won't be validated. Since the purpose of the validation is to check, by proxy, the validity of the template, CI for the multipage previews will be added as separate workflow in the future.
