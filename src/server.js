// server.js
const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const { readState, writeState } = require("./utils");

const app = express();
app.use(cors());
app.use(express.json());

// 1. GET entire state
app.get("/state", async (_, res) => {
  const state = await readState();
  res.json(state);
});

// 2. Add a component to a tab (or create tab if missing)
app.post("/components", async (req, res) => {
  const { key, type, data } = req.body; // matches your PayloadAction
  const state = await readState();

  let tab = state.tabs.find((t) => t.key === key);
  if (!tab) {
    tab = { key, components: [] };
    state.tabs.push(tab);
  }
  tab.components.push({ id: nanoid(), type, data });

  await writeState(state);
  res.status(201).json(tab);
});

// 3. Update a component’s data
app.put("/components/:id", async (req, res) => {
  const { id } = req.params;
  const { key, data } = req.body; // { key, data: DataPoint[] }
  const state = await readState();

  const tab = state.tabs.find((t) => t.key === key);
  if (!tab) return res.status(404).json({ error: "Tab not found" });

  const comp = tab.components.find((c) => c.id === id);
  if (!comp) return res.status(404).json({ error: "Component not found" });

  comp.data = data;
  await writeState(state);
  res.json(comp);
});

// 4. Clear all components in a tab
app.delete("/components", async (req, res) => {
  const { key } = req.query;
  const state = await readState();
  const tab = state.tabs.find((t) => t.key === key);
  if (!tab) return res.status(404).json({ error: "Tab not found" });

  tab.components = [];
  await writeState(state);
  res.status(204).send();
});

// 5. Merge home (tabs[0]) components into another tab
app.post("/merge", async (req, res) => {
  const { key } = req.body; // { key: string }
  const state = await readState();
  const homeComponents = state.tabs[0].components;

  let target = state.tabs.find((t) => t.key === key);
  if (!target) {
    state.tabs.push({ key, components: [...homeComponents] });
  } else {
    target.components.push(...homeComponents);
  }

  state.tabs[0].components = [];
  await writeState(state);
  res.json(state);
});

// 6. Update the active tab
app.post("/activeTab", async (req, res) => {
  const { key } = req.body;
  const state = await readState();
  state.activeTabKey = key;
  await writeState(state);
  res.status(200).send();
});

const PORT = 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
