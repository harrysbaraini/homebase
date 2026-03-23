# CLAUDE.md - homebase Project Guidelines

## Project Overview

**homebase** is a TUI-style browser startpage/dashboard built with Deno Fresh. It serves customizable dashboards from YAML configuration files, with real-time updates via Server-Sent Events (SSE).

### Key Characteristics
- **Framework**: Deno Fresh 2.x (islands architecture)
- **Styling**: Tailwind CSS JIT
- **Config**: YAML files in `~/.config/homebase/dashboards/`
- **Real-time**: SSE for widget updates + file watching
- **Deployment**: Self-contained executable via `deno compile`

## Architecture Principles

### 1. Islands for Interactivity
- Server-render everything by default (zero JS shipped)
- Use islands ONLY for:
  - SSE connections (real-time updates)
  - Interactive widgets (future: markdown editing, filtering)
  - Time-sensitive updates (clock widget)
- Islands location: `islands/` directory
- Pass only serializable props to islands

### 2. Widget System
```
src/
├── widgets/           # Widget definitions
│   ├── registry.ts    # Widget type registry
│   ├── types.ts       # TypeScript interfaces
│   ├── clock/
│   │   ├── component.tsx   # Server component
│   │   ├── island.tsx      # Client island (if needed)
│   │   └── schema.ts       # Zod schema for settings
│   ├── bookmarks/
│   ├── markdown/
│   └── ...
```

### 3. Configuration Flow
```
YAML file → parse → validate (Zod) → Dashboard model → Render
```

### 4. SSE Architecture
```
[File Watcher] ──┐
                 ├──▶ [Event Bus] ──▶ [SSE Endpoint] ──▶ [Browser]
[Schedules]   ──┘
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Use Zod for runtime validation of YAML configs
- Prefer `type` over `interface` for consistency
- Use explicit return types on exported functions

### File Naming
- Components: `PascalCase.tsx`
- Islands: `PascalCase.tsx` in `islands/`
- Utilities: `kebab-case.ts`
- Types: `types.ts` within feature directories

### Imports
```typescript
// Deno/Fresh imports first
import { Handlers, PageProps } from "$fresh/server.ts";

// Third-party (jsr/npm)
import { z } from "zod";
import { parse as parseYaml } from "@std/yaml";

// Local imports last
import { type Dashboard } from "@/lib/types.ts";
```

### CSS/Tailwind
- Use Tailwind utility classes
- Theme colors via CSS variables (see `static/styles.css`)
- Tailwind color names in YAML config (e.g., `gray-400`, `blue-700`)
- No arbitrary values in YAML; map to Tailwind palette

## Key Implementation Details

### Dashboard YAML Schema
```yaml
name: "My Dashboard"           # Display name
container_max_width: "1200px"  # "full", "80%", or pixel value

font_family: "JetBrains Mono"  # Local font
# OR
font_face:                     # Remote font
  font_family: "..."
  src: "url(...)"

dark_theme:                    # Required
  bg: "zinc-900"
  text: "zinc-100"
  text_dimmed: "zinc-500"
  # ... semantic colors

light_theme:                   # Optional
  # ... same structure

widgets:
  - type: "clock"
    row: 1
    col: 1
    col_span: 2
    settings:
      timezone: "America/Sao_Paulo"
      format_24h: true
```

### Widget Interface
```typescript
// src/widgets/types.ts
export type WidgetProps<T = unknown> = {
  id: string;
  settings: T;
  theme: ThemeColors;
};

export type WidgetDefinition<T = unknown> = {
  type: string;
  schema: z.ZodSchema<T>;
  component: ComponentType<WidgetProps<T>>;
  island?: ComponentType<WidgetProps<T>>;  // For interactive widgets
  defaultSettings: T;
};
```

### SSE Events
```typescript
// Event types sent to browser
type SSEEvent =
  | { type: "widget:update"; widgetId: string; data: unknown }
  | { type: "dashboard:reload" }
  | { type: "heartbeat" };
```

### File Watching
- Use `Deno.watchFs()` with debounce (200ms)
- Watch: `$CONFIG_DIR/dashboards/*.yaml` and referenced markdown files
- On YAML change → full dashboard reload
- On markdown change → targeted widget update

## Testing Strategy

### Unit Tests
```bash
deno test src/lib/
```
- Config parsing/validation
- Widget schema validation
- Theme color mapping

### Integration Tests
```bash
deno test --allow-read --allow-net tests/
```
- SSE endpoint behavior
- Dashboard rendering
- File watcher debouncing

## Build & Deploy

### Development
```bash
deno task dev   # Fresh dev server with HMR
```

### Production Build
```bash
deno task build  # Build Fresh app
```

### Compile to Executable
```bash
deno task compile  # Creates ./homebase binary

# Run with:
CONFIG_DIR=~/.config/homebase ./homebase
```

**Important for `deno compile`:**
- Include static assets: `--include static/ --include _fresh/`
- Fresh assets must be pre-built before compile
- Config files are NOT bundled (read at runtime from `CONFIG_DIR`)

## Common Pitfalls

### ❌ Don't
- Import browser APIs in server components
- Use `localStorage` (islands only, and sparingly)
- Bundle config files into executable
- Use non-serializable props for islands
- Forget `--allow-read` for file watcher

### ✅ Do
- Validate all YAML with Zod schemas
- Use `import.meta.dirname` for relative paths
- Debounce file watcher events
- Clean up SSE connections on client disconnect
- Test with both dev server and compiled binary

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CONFIG_DIR` | `~/.config/homebase` | Dashboard configs location |
| `PORT` | `8000` | Server port |
| `HOST` | `127.0.0.1` | Server bind address |

## Dependencies (deno.json)

```json
{
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@1.6.8/",
    "@preact/signals": "npm:@preact/signals@^1.2.0",
    "preact": "npm:preact@^10.19.0",
    "@std/yaml": "jsr:@std/yaml@^1.0.0",
    "@std/async": "jsr:@std/async@^1.0.0",
    "@std/path": "jsr:@std/path@^1.0.0",
    "zod": "npm:zod@^3.23.0",
    "@/": "./src/"
  }
}
```

## Widget Development Checklist

When adding a new widget:

1. [ ] Create directory: `src/widgets/{name}/`
2. [ ] Define Zod schema in `schema.ts`
3. [ ] Create server component in `component.tsx`
4. [ ] Create island in `island.tsx` (if interactive)
5. [ ] Register in `src/widgets/registry.ts`
6. [ ] Add TypeScript types to `types.ts`
7. [ ] Write unit tests for schema validation
8. [ ] Update example YAML in `examples/`
9. [ ] Document in this file

## Design Reference

The UI follows **TUI-style aesthetics** (inspired by re-start):
- Dark background with subtle borders
- Monospace fonts
- Widget panels with labeled corners (fieldset-like)
- Minimal color usage; accent colors for emphasis
- Grid-based layout with explicit row/col positioning
