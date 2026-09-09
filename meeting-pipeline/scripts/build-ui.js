const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const srcDir = path.join(root, "src", "console");
const outDir = path.join(root, "static", "console");

fs.mkdirSync(outDir, { recursive: true });

esbuild.buildSync({
  entryPoints: [path.join(srcDir, "main.js")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  outfile: path.join(outDir, "bundle.js"),
});

for (const file of ["index.html", "style.css"]) {
  fs.copyFileSync(path.join(srcDir, file), path.join(outDir, file));
}

console.log(`Built Custom UI → ${path.relative(root, outDir)}`);
