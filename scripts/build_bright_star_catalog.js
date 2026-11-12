#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const [inputArgument, outputArgument] = process.argv.slice(2);

if (!inputArgument || !outputArgument) {
  console.error("Usage: build_bright_star_catalog.js INPUT_TSV OUTPUT_JS");
  process.exit(1);
}

const inputPath = path.resolve(inputArgument);
const outputPath = path.resolve(outputArgument);
const rows = fs.readFileSync(inputPath, "utf8").split(/\r?\n/);
const data = [];

function sexagesimalToDegrees(value, isRightAscension) {
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  if (isRightAscension) {
    return 15 * (parts[0] + parts[1] / 60 + parts[2] / 3600);
  }

  const sign = value.trim().startsWith("-") ? -1 : 1;
  return sign * (Math.abs(parts[0]) + parts[1] / 60 + parts[2] / 3600);
}

for (const row of rows) {
  if (!/^\s*\d+\t/.test(row)) continue;
  const [, rightAscension, declination, visualMagnitude, colourIndex] =
    row.split("\t");
  const ra = sexagesimalToDegrees(rightAscension, true);
  const dec = sexagesimalToDegrees(declination, false);
  const magnitude = Number(visualMagnitude);
  const bv = Number(colourIndex);

  if (ra === null || dec === null || !Number.isFinite(magnitude)) continue;
  data.push(
    Number(ra.toFixed(5)),
    Number(dec.toFixed(5)),
    Number(magnitude.toFixed(2)),
    Number.isFinite(bv) ? Number(bv.toFixed(2)) : null
  );
}

const output =
  "window.EUCLID_STAR_CATALOG=" +
  JSON.stringify({
    epoch: "J2000",
    catalogue: "Bright Star Catalogue, 5th Revised Edition",
    count: data.length / 4,
    stride: 4,
    fields: ["rightAscensionDegrees", "declinationDegrees", "visualMagnitude", "bvColourIndex"],
    data
  }) +
  ";\n";

fs.writeFileSync(outputPath, output, "utf8");
console.log(
  `Wrote ${outputPath} with ${(data.length / 4).toLocaleString("en-GB")} stars.`
);
