// utils.js
const fs = require("fs").promises;
const path = require("path");
const DATA_PATH = path.join(__dirname, "data.json");

async function readState() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeState(state) {
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2));
}

module.exports = { readState, writeState };
