// server/index.ts
import express2 from "express";


// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  maps;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.maps = /* @__PURE__ */ new Map();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getMap(id) {
    return this.maps.get(id);
  }
  async getAllMaps() {
    return Array.from(this.maps.values());
  }
  async createMap(insertMap) {
    const id = randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const map = {
      ...insertMap,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.maps.set(id, map);
    return map;
  }
  async updateMap(id, updates) {
    const existingMap = this.maps.get(id);
    if (!existingMap) return void 0;
    const updatedMap = {
      ...existingMap,
      ...updates,
      id,
      createdAt: existingMap.createdAt,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.maps.set(id, updatedMap);
    return updatedMap;
  }
  async deleteMap(id) {
    return this.maps.delete(id);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var vertexSchema = z.object({
  x: z.number(),
  y: z.number()
});
var curveDataSchema = z.object({
  type: z.enum(["angle", "radius", "sagitta"]).default("angle"),
  value: z.number()
});
var segmentSchema = z.object({
  v0: z.number(),
  v1: z.number(),
  color: z.string().optional(),
  curve: z.number().optional(),
  curveData: curveDataSchema.optional()
});
var backgroundImageSchema = z.object({
  dataURL: z.string(),
  opacity: z.number().min(0).max(1).default(0.5),
  scale: z.number().min(0.1).max(5).default(1),
  offsetX: z.number().default(0),
  offsetY: z.number().default(0),
  fitMode: z.enum(["fit", "cover", "center"]).default("center"),
  locked: z.boolean().default(false)
});
var mapSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number().min(1),
  height: z.number().min(1),
  bg: z.object({
    color: z.string(),
    image: backgroundImageSchema.optional()
  }),
  vertexes: z.array(vertexSchema),
  segments: z.array(segmentSchema),
  discs: z.array(z.any()).optional().default([]),
  goals: z.array(z.any()).optional().default([]),
  planes: z.array(z.any()).optional().default([]),
  joints: z.array(z.any()).optional().default([]),
  traits: z.record(z.any()).optional().default({}),
  canBeStored: z.boolean().optional().default(true),
  createdAt: z.string(),
  updatedAt: z.string()
});
var insertMapSchema = mapSchema.omit({ id: true, createdAt: true, updatedAt: true });

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/maps", async (req, res) => {
    try {
      const maps = await storage.getAllMaps();
      res.json(maps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch maps" });
    }
  });
  app2.get("/api/maps/:id", async (req, res) => {
    try {
      const map = await storage.getMap(req.params.id);
      if (!map) {
        return res.status(404).json({ error: "Map not found" });
      }
      res.json(map);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch map" });
    }
  });
  app2.post("/api/maps", async (req, res) => {
    try {
      const validatedData = insertMapSchema.parse(req.body);
      const map = await storage.createMap(validatedData);
      res.status(201).json(map);
    } catch (error) {
      res.status(400).json({ error: "Invalid map data" });
    }
  });
  app2.put("/api/maps/:id", async (req, res) => {
    try {
      const validatedData = insertMapSchema.partial().parse(req.body);
      const map = await storage.updateMap(req.params.id, validatedData);
      if (!map) {
        return res.status(404).json({ error: "Map not found" });
      }
      res.json(map);
    } catch (error) {
      res.status(400).json({ error: "Invalid map data" });
    }
  });
  app2.delete("/api/maps/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMap(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Map not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete map" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
