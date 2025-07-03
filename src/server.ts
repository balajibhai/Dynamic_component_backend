// server.ts
import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { readState, writeState } from "./utils";
import { classifyAndExtract } from "./chatwithai";

import { State, Tab, Component } from "./types";

interface QuestionPayload {
  question: string;
}

// Payload types
interface AddComponentPayload {
  key: string;
  type: string;
  data: any;
}

interface UpdateComponentPayload {
  key: string;
  data: any;
}

interface KeyPayload {
  key: string;
}

const app = express();

app.use(cors());
app.use(express.json());

/** tiny demo dictionary */
const DICTIONARY: Record<string, string> = {
  table: "Here is the table in the preview!",
  text: "Here is the text in the preview!",
  graph: "Here is the graph in the preview!",
  tab: "Here are the tabs in the footer!",
  set: "successfully set!",
  new: "successfully set in a new tab!",
};

function extractFirstNumber(str: string) {
  const m = str.match(/\d+/);
  return m ? Number(m[0]) : null;
}


// 1. GET entire state
app.get("/state", async (_req: Request, res: Response<State>) => {
  const state = await readState();
  res.json(state);
});

// 2. Add a component to a tab (or create tab if missing)
app.post(
  "/components",
  async (
    req: Request<unknown, unknown, AddComponentPayload>,
    res: Response<Tab>
  ) => {
    const { key, type, data } = req.body;
    const state = await readState();

    let tab = state.tabs.find((t: Tab) => t.key === key);
    if (!tab) {
      tab = { key, components: [] };
      state.tabs.push(tab);
    }
    tab.components.push({ id: nanoid(), type, data });

    await writeState(state);
    res.status(201).json(tab);
  }
);

// 3. Update a component’s data
app.put(
  "/components/:id",
  async (
    req: Request<{ id: string }, unknown, UpdateComponentPayload>,
    res: any
  ) => {
    const { id } = req.params;
    const { key, data } = req.body;
    const state = await readState();

    const tab = state.tabs.find((t: Tab) => t.key === key);
    if (!tab) {
      return res.status(404).json({ error: "Tab not found" });
    }

    const component = tab.components.find((c: Component) => c.id === id);
    if (!component) {
      return res.status(404).json({ error: "Component not found" });
    }

    component.data = data;

    await writeState(state);

    res.json(component);
  }
);

// 4. Clear all components in a tab
app.delete(
  "/components",
  async (req: Request<unknown, unknown, unknown, KeyPayload>, res: any) => {
    const { key } = req.query;
    const state = await readState();
    const tab = state.tabs.find((t: Tab) => t.key === key);
    if (!tab) {
      return res.status(404).json({ error: "Tab not found" });
    }

    tab.components = [];
    await writeState(state);
    res.sendStatus(204);
  }
);

// 5. Merge home (tabs[0]) components into another tab
app.post(
  "/merge",
  async (req: Request<unknown, unknown, KeyPayload>, res: Response<State>) => {
    const { key } = req.body;
    const state = await readState();
    const homeComponents = state.tabs[0].components;

    let target = state.tabs.find((t: Tab) => t.key === key);
    if (!target) {
      state.tabs.push({ key, components: [...homeComponents] });
    } else {
      target.components.push(...homeComponents);
    }

    state.tabs[0].components = [];
    await writeState(state);
    res.json(state);
  }
);

// 6. Update the active tab
app.post(
  "/activeTab",
  async (req: Request<unknown, unknown, KeyPayload>, res: Response) => {
    const { key } = req.body;
    const state = await readState();
    state.activeTabKey = key;
    await writeState(state);
    res.sendStatus(200);
  }
);

// 7. Question classification endpoint
app.post(
  "/api/question",
  async (req: Request<{}, {}, QuestionPayload>, res: any) => {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    try {
      const result = await classifyAndExtract(question);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process the question" });
    }
  }
);

// Detect keyword endpoint
app.post("/api/detect", (req: Request<any, any, { text: string }>, res: any) => {
  const { text } = req.body;
  const timestamp = new Date().toISOString();

  if (typeof text !== "string") {
    return res.status(400).json({ error: "Missing 'text' field", timestamp });
  }

  // split into lines, drop the first, and rejoin
  const lines = text.split(/\r?\n/);
  const maindata = lines.slice(1).join("\n");

  const lowered = text.toLowerCase();
  for (const [k, v] of Object.entries(DICTIONARY)) {
    if (lowered.includes(k)) {
      if (k === "tab" || k === "set") {
        const num = extractFirstNumber(text);
        if (num) {
          return res.json({
            key: k,
            value: v,
            timestamp,
            maindata,
            numberOfTabs: num,
          });
        }
      }
      return res.json({ key: k, value: v, timestamp, maindata });
    }
  }

  return res.json({ key: null, timestamp, maindata });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
