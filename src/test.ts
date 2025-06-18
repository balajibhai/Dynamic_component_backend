/*
Setup:
1. npm init -y
2. npm install openai dotenv
3. Create a .env file with ANTHROPIC_API_KEY (if still using Anthropic) or OPENAI_API_KEY for OpenAI

Usage:
node agent.js "I need a graph like this:\n date: 12/03/2021 distance: 3\n date: 11/04/2024 distance: 4"
*/

import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define the function schema
const functions = [
  {
    name: "classify_and_extract",
    description:
      "Classify input as table, graph, or text and extract date-distance pairs",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "One of table, graph, or text",
          enum: ["table", "graph", "text"],
        },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string", format: "date" },
              distance: { type: "number" },
            },
            required: ["date", "distance"],
          },
        },
      },
      required: ["type", "data"],
    },
  },
];

async function classifyAndExtract(input: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: input }],
    functions,
    function_call: { name: "classify_and_extract" },
  });

  const message = response.choices[0].message;
  if (message.function_call) {
    // Parse the function arguments JSON
    return JSON.parse(message.function_call.arguments);
  }
  throw new Error("Function not called");
}

export { classifyAndExtract };
