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
-l, --layout <layoutPath>   Filepath or URL to a layout file in JSON format. This forces the script to use the specified layout instead of the default or the one present in the crate. Use raw link if URL is from GitHub. (Default: "https://github.com/Language-Research-Technology/crate-o/blob/main/src/lib/components/default_layout.json")

-m, --multipage-config <configPath>  Filepath or URL to a multipage configuration file in JSON format.

-h, --help                  Display help for command.
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
node index.js test_data/sample
```

Farms to freeways -- multipages 

```
node index.js  -m test_data/f2fnew/f2fconfig.json test_data/f2fnew/data
```

## Contributing

To format the template run `npm run format`