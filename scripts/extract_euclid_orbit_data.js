#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const [sourceArgument, outputArgument] = process.argv.slice(2);

if (!sourceArgument || !outputArgument) {
  console.error("Usage: extract_euclid_orbit_data.js SOURCE_HTML OUTPUT_JS");
  process.exit(1);
}

const sourcePath = path.resolve(sourceArgument);
const outputPath = path.resolve(outputArgument);
const source = fs.readFileSync(sourcePath, "utf8");

function arraySource(name) {
  const match = source.match(new RegExp(`^\\s*var ${name} = (\\[.*\\]);\\s*$`, "m"));
  if (!match) throw new Error(`Could not find ${name} in ${sourcePath}`);
  JSON.parse(match[1]);
  return match[1];
}

const arrays = {
  x: arraySource("FULL_X"),
  y: arraySource("FULL_Y"),
  z: arraySource("FULL_Z"),
  t: arraySource("FULL_T"),
  dates: arraySource("FULL_DATE")
};

const lengths = Object.fromEntries(
  Object.entries(arrays).map(([name, value]) => [name, JSON.parse(value).length])
);
const uniqueLengths = new Set(Object.values(lengths));

if (uniqueLengths.size !== 1) {
  throw new Error(`Orbit arrays have different lengths: ${JSON.stringify(lengths)}`);
}

const output = `/* Extracted from ${path.basename(sourcePath)}. Distances are kilometres; t is days. */
window.EUCLID_ORBIT_DATA = {
  x: ${arrays.x},
  y: ${arrays.y},
  z: ${arrays.z},
  t: ${arrays.t},
  dates: ${arrays.dates}
};
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, "utf8");
console.log(`Wrote ${outputPath} with ${Object.values(lengths)[0]} trajectory points.`);
