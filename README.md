# ro-crate-html-lite

A tool to create a complete, completely static `ro-crate-preview.html` file with the same functionality as [ro-crate-html-js](https://github.com/UTS-eResearch/ro-crate-html-js) but without any dependence on online resources or JavaScript (except for some small helpers).

HTML Preview Lite is available without any installation at the [RO-Crate Playground](https://ro-crate.ldaca.edu.au/).

## Install

```
npm install .

```

## Development/contributing

Run `npm run dev` to start a development server at `http://localhost:8000/`. It will rebuild and reload the preview webpages when changes are made to `template.html`.

## Usage

```
node index.js [options] <path_to_crate_directory>

Load an RO-Crate from a specified directory.

Arguments:
path_to_crate_directory     Path to the crate directory.

Options:
-l, --layout <layoutPath>   Filepath or URL to a layout file in JSON format. This forces the script to use the specified layout instead of the default or the one present in the crate. Use raw link if URL is from GitHub. (Default: "https://github.com/Language-Research-Technology/crate-o/blob/main/src/lib/components/default_layout.json")
  -m, --maps                 Include maps in the generated HTML preview. This will render a map for any geographic data found in the RO-Crate in asWKt properties.

-h, --help                  Display help for command.
```

## Run with test data

Sample crate:

```
node index.js test_data/sample
```

Farms to freeways (with maps!)

```
node index.js -m  test_data/f2fnew
```
COOEE:

```
node index.js test_data/cooee
```
