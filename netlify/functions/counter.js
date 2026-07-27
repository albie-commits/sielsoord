// Unique device counter for Sielsoord
// Stores count in /tmp — persists across warm Lambda invocations.
// For a low-traffic site, cold starts are rare enough that this works well.

const fs = require("fs");
const path = require("path");
const COUNTER_FILE = "/tmp/sielsoord-counter.json";

function readCount() {
  try {
    const data = fs.readFileSync(COUNTER_FILE, "utf8");
    return JSON.parse(data).count;
  } catch {
    return 0;
  }
}

function writeCount(n) {
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count: n }));
}

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  // GET — just return the current count (admin use)
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ count: readCount() }),
    };
  }

  // POST — increment from client (gated by localStorage on the client side)
  if (event.httpMethod === "POST") {
    const count = readCount() + 1;
    writeCount(count);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ count }),
    };
  }

  return { statusCode: 405, headers, body: "Method Not Allowed" };
};
