/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

// Initialize widgets registry
import "./src/widgets/index.ts";

// Ensure config directories exist
import { ensureConfigDirs } from "./src/lib/config.ts";
await ensureConfigDirs();

await start(manifest, config);
