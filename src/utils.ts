// utils.ts
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(__dirname, "..", "src", "data.json");

import { State } from "./types";

const defaultState: State = {
  tabs: [{ key: "home", components: [] }],
  activeTabKey: "home",
};

async function readState(): Promise<State> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const data = JSON.parse(raw);
    // Basic validation to ensure the data matches the State interface
    if (
      data &&
      Array.isArray(data.tabs) &&
      typeof data.activeTabKey === "string"
    ) {
      return data as State;
    }
    return defaultState;
  } catch (e: unknown) {
    const error = e as { code?: string };
    // If the file doesn't exist, let's return a default state.
    if (error.code === "ENOENT") {
      return defaultState;
    }
    throw e;
  }
}

async function writeState(state: State): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2));
}

export { readState, writeState };
