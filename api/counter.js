// Unique device counter for Sielsoord — Vercel Serverless Function
// Stores count in /tmp — persists across warm invocations.

const fs = require("fs");
const COUNTER_FILE = "/tmp/sielsoord-counter.json";

function readCount() {
  try {
    return JSON.parse(fs.readFileSync(COUNTER_FILE, "utf8")).count;
  } catch {
    return 0;
  }
}

function writeCount(n) {
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count: n }));
}

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET — return current count
  if (req.method === "GET") {
    return res.status(200).json({ count: readCount() });
  }

  // POST — increment (gated by localStorage on client)
  if (req.method === "POST") {
    const count = readCount() + 1;
    writeCount(count);
    return res.status(200).json({ count });
  }

  return res.status(405).end();
};
