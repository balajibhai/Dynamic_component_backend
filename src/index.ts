// src/index.ts

// command to run this file or backend server
// npx ts-node-dev ./src/index.ts

import cors from "cors";
import express from "express";

const app = express();
const PORT = 5000;

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

app.post("/api/detect", (req: any, res: any) => {
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

app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
