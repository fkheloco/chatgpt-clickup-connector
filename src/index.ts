import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { processCommand } from "./commands";

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const result = await processCommand(message);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// placeholder for future webhooks
app.post("/webhook", (req, res) => {
  console.log("Webhook event:", req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


