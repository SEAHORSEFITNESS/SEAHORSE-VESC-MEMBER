import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SETTINGS_FILE = path.join(DATA_DIR, "app_settings.json");

// Helper to run safe JSON read/write operations
const readJSON = (filePath: string, fallback: any) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return fallback;
};

const writeJSON = (filePath: string, obj: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
    return false;
  }
};

// API Endpoints for System Settings
app.get("/api/settings", (req, res) => {
  const settings = readJSON(SETTINGS_FILE, null);
  if (!settings) {
    return res.json({ status: "not_configured" });
  }
  res.json({ status: "ok", settings });
});

app.post("/api/settings", (req, res) => {
  const { settings } = req.body;
  if (!settings) {
    return res.status(400).json({ error: "Missing settings body" });
  }
  const ok = writeJSON(SETTINGS_FILE, settings);
  if (ok) {
    res.json({ status: "ok" });
  } else {
    res.status(500).json({ error: "Failed to write settings" });
  }
});

// API Endpoints for Members in specific Profiles
app.get("/api/members/:profileId", (req, res) => {
  const { profileId } = req.params;
  const safeProfileId = profileId.replace(/[^a-zA-Z0-9_-]/g, "");
  const membersFile = path.join(DATA_DIR, `members_${safeProfileId}.json`);
  const members = readJSON(membersFile, null);
  if (!members) {
    return res.json({ status: "not_found", members: null });
  }
  res.json({ status: "ok", members });
});

app.post("/api/members/:profileId", (req, res) => {
  const { profileId } = req.params;
  const safeProfileId = profileId.replace(/[^a-zA-Z0-9_-]/g, "");
  const { members } = req.body;
  if (!members || !Array.isArray(members)) {
    return res.status(400).json({ error: "Missing or invalid members list" });
  }
  const membersFile = path.join(DATA_DIR, `members_${safeProfileId}.json`);
  const ok = writeJSON(membersFile, members);
  if (ok) {
    res.json({ status: "ok" });
  } else {
    res.status(500).json({ error: "Failed to write members list" });
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
