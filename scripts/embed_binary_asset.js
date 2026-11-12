#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const [inputArgument, outputArgument, globalName] = process.argv.slice(2);

if (!inputArgument || !outputArgument || !globalName) {
  console.error("Usage: embed_binary_asset.js INPUT OUTPUT_JS WINDOW_GLOBAL");
  process.exit(1);
}

if (!/^[A-Z][A-Z0-9_]+$/.test(globalName)) {
  throw new Error("WINDOW_GLOBAL must be an uppercase JavaScript identifier.");
}

const inputPath = path.resolve(inputArgument);
const outputPath = path.resolve(outputArgument);
const encoded = fs.readFileSync(inputPath).toString("base64");
const output = `window.${globalName}="${encoded}";\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, "ascii");
console.log(`Wrote ${outputPath} (${output.length.toLocaleString("en-GB")} bytes).`);
