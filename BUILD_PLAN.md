# BUILD_PLAN.md - Multi-Agent Implementation Plan for homebase

## Overview

This plan is designed for **Claude Code** multi-agent sessions. Each phase is self-contained and produces testable artifacts. Agents should complete phases sequentially, but can parallelize within phases where indicated.

---

## Phase 0: Project Bootstrap (Single Agent)

**Goal**: Set up Fresh project with Tailwind, verify toolchain works.

### Tasks

```
0.1 Initialize Fresh project
    Command: deno run -A https://fresh.deno.dev homebase-app
    - Answer: Yes to Tailwind
    - Answer: Yes to VS Code
    
0.2 Restructure to match our layout
    - Move Fresh output to project root (merge with existing flake.nix, .envrc)
    - Verify deno.json has correct imports
    
0.3 Create base directory structure
    mkdir -p src/{lib,widgets,services}
    mkdir -p islands
    mkdir -p examples
    mkdir -p tests
    
0.4 Verify dev server starts
    deno task dev
    - Confirm http://localhost:8000 shows Fresh default page
```

### Deliverables
- [ ] Fresh project initialized
- [ ] `deno task dev` works
- [ ] Directory structure matches CLAUDE.md

### Verification
```bash
curl -s http://localhost:8000 | grep -q "Fresh"
```

---

## Phase 1: Configuration System (Single Agent)

**Goal**: Parse YAML dashboard configs with Zod validation.

### Tasks

```
1.1 Create base types
    File: src/lib/types.ts
    - Dashboard, Widget, Theme, GridPosition types
    
1.2 Create Zod schemas
    File: src/lib/schemas.ts
    - dashboardSchema, widgetBaseSchema, themeSchema
    - Export validation functions
    
1.3 Create config loader
    File: src/lib/config.ts
    - loadDashboard(path: string): Promise<Dashboard>
    - listDashboards(configDir: string): Promise<string[]>
    - Expand ~ to $HOME
    - Handle file not found gracefully
    
1.4 Create example dashboard
    File: examples/default.yaml
    - Include all 3 MVP widgets (clock, bookmarks, markdown)
    - Include theme configuration
    
1.5 Write unit tests
    File: tests/config_test.ts
    - Test YAML parsing
    - Test Zod validation errors
    - Test missing file handling
```

### Deliverables
- [ ] `src/lib/types.ts` with all core types
- [ ] `src/lib/schemas.ts` with Zod validation
- [ ] `src/lib/config.ts` with loader functions
- [ ] `examples/default.yaml` as reference
- [ ] Tests pass: `deno test tests/config_test.ts`

### Verification
```bash
deno test --allow-read tests/config_test.ts
```

---

## Phase 2: Theme System (Single Agent)

**Goal**: CSS variable-based theming from YAML config.

### Tasks

```
2.1 Create Tailwind color mapper
    File: src/lib/theme.ts
    - Map Tailwind color names (e.g., "zinc-900") to hex values
    - Generate CSS variable declarations
    - Handle light/dark theme switching
    
2.2 Create theme stylesheet generator
    File: src/lib/styles.ts
    - generateThemeCSS(theme: Theme): string
    - Include font-face if specified
    
2.3 Update static/styles.css
    - Define CSS variable structure
    - Base typography (monospace)
    - TUI-style borders and panels
    - Grid layout utilities
    
2.4 Create theme context
    File: src/lib/theme-context.ts
    - Preact context for theme colors
    - Hook: useTheme()
```

### Deliverables
- [ ] Tailwind-to-CSS-variable mapping works
- [ ] Theme CSS generates correctly
- [ ] Base styles establish TUI aesthetic

### Verification
```bash
deno eval "import { mapTailwindColor } from './src/lib/theme.ts'; console.log(mapTailwindColor('zinc-900'))"
# Should output: #18181b
```

---

## Phase 3: Widget Framework (Single Agent)

**Goal**: Create extensible widget system with registry.

### Tasks

```
3.1 Create widget types
    File: src/widgets/types.ts
    - WidgetProps<T> generic interface
    - WidgetDefinition type
    - WidgetRenderContext (includes theme, config)
    
3.2 Create widget registry
    File: src/widgets/registry.ts
    - registerWidget(definition: WidgetDefinition)
    - getWidget(type: string): WidgetDefinition | undefined
    - getAllWidgets(): WidgetDefinition[]
    
3.3 Create widget container component
    File: src/components/WidgetContainer.tsx
    - Renders widget in TUI-style panel
    - Applies grid positioning (row, col, span)
    - Shows widget label in corner
    
3.4 Create dashboard grid component
    File: src/components/DashboardGrid.tsx
    - CSS Grid layout
    - Responsive breakpoints
    - container-max-width support
```

### Deliverables
- [ ] Widget registry functional
- [ ] Container component renders TUI panels
- [ ] Grid component positions widgets

### Verification
```bash
# Add a dummy widget and verify registration
deno eval "
import { registerWidget, getWidget } from './src/widgets/registry.ts';
registerWidget({ type: 'test', schema: null, component: () => null });
console.log(getWidget('test')?.type);
"
# Should output: test
```

---

## Phase 4: MVP Widgets (Parallelizable - 3 Agents)

**Goal**: Implement clock, bookmarks, and markdown widgets.

### Agent 4A: Clock Widget

```
4A.1 Create clock schema
     File: src/widgets/clock/schema.ts
     - timezone: string (IANA timezone)
     - format_24h: boolean
     - show_seconds: boolean
     - show_date: boolean
     
4A.2 Create clock island (needs client-side updates)
     File: islands/ClockIsland.tsx
     - useSignal for time state
     - setInterval for updates
     - Format with Intl.DateTimeFormat
     
4A.3 Create clock component
     File: src/widgets/clock/component.tsx
     - Server-renders initial time
     - Hydrates with ClockIsland
     
4A.4 Register widget
     - Add to src/widgets/registry.ts
     - Export from src/widgets/index.ts
```

### Agent 4B: Bookmarks Widget

```
4B.1 Create bookmarks schema
     File: src/widgets/bookmarks/schema.ts
     - columns: number (1-4)
     - groups: Array<{ name: string, links: Link[] }>
     - Link: { label: string, url: string, icon?: string }
     
4B.2 Create bookmarks component (server-only)
     File: src/widgets/bookmarks/component.tsx
     - Render groups as columns
     - ">" prefix style like re-start
     - No island needed (static content)
     
4B.3 Register widget
```

### Agent 4C: Markdown Widget

```
4C.1 Create markdown schema
     File: src/widgets/markdown/schema.ts
     - file: string (relative to config dir)
     - max_height?: string
     
4C.2 Create markdown renderer
     File: src/lib/markdown.ts
     - Use deno-gfm or marked
     - Sanitize HTML output
     
4C.3 Create markdown component
     File: src/widgets/markdown/component.tsx
     - Read file at render time
     - Apply prose styles
     
4C.4 Create markdown island (for SSE updates)
     File: islands/MarkdownIsland.tsx
     - Listen for SSE updates
     - Re-render content
     
4C.5 Register widget
```

### Deliverables (All Agents)
- [ ] Clock widget with live updates
- [ ] Bookmarks widget renders links
- [ ] Markdown widget reads and renders files

### Verification
```bash
# Render each widget type in isolation
deno task dev
# Visit http://localhost:8000/test/clock
# Visit http://localhost:8000/test/bookmarks  
# Visit http://localhost:8000/test/markdown
```

---

## Phase 5: Dashboard Routes (Single Agent)

**Goal**: Route structure for listing and viewing dashboards.

### Tasks

```
5.1 Create index route
    File: routes/index.tsx
    - List all dashboards from CONFIG_DIR
    - Link to each dashboard
    - TUI-style listing
    
5.2 Create dashboard route
    File: routes/[dashboard].tsx
    - Load dashboard YAML
    - Render DashboardGrid with widgets
    - Inject theme CSS
    - Handle 404 for missing dashboard
    
5.3 Create _app.tsx layout
    File: routes/_app.tsx
    - Base HTML structure
    - Meta tags
    - Global styles
    
5.4 Create _404.tsx
    File: routes/_404.tsx
    - TUI-style error page
```

### Deliverables
- [ ] `/` lists all dashboards
- [ ] `/{name}` renders dashboard
- [ ] 404 page for missing dashboards

### Verification
```bash
# Copy example to config dir
cp examples/default.yaml ~/.config/homebase/dashboards/
curl -s http://localhost:8000/ | grep -q "default"
curl -s http://localhost:8000/default | grep -q "clock"
```

---

## Phase 6: SSE & File Watching (Single Agent)

**Goal**: Real-time updates when config/content files change.

### Tasks

```
6.1 Create event bus
    File: src/services/event-bus.ts
    - Singleton EventTarget
    - Type-safe event dispatch
    - Client connection tracking
    
6.2 Create file watcher service
    File: src/services/file-watcher.ts
    - Watch CONFIG_DIR/dashboards/*.yaml
    - Watch referenced markdown files
    - Debounce with @std/async
    - Emit events to bus
    
6.3 Create SSE endpoint
    File: routes/api/events/[dashboard].ts
    - GET handler returns SSE stream
    - Subscribe to event bus
    - Send heartbeat every 30s
    - Clean up on disconnect
    
6.4 Create SSE client island
    File: islands/SSEClient.tsx
    - Connect to /api/events/{dashboard}
    - Dispatch browser events for widget updates
    - Auto-reconnect on disconnect
    
6.5 Update markdown island
    - Listen for SSE widget:update events
    - Re-fetch content when file changes
```

### Deliverables
- [ ] File changes trigger SSE events
- [ ] Browser receives real-time updates
- [ ] Markdown widget updates live

### Verification
```bash
# Terminal 1: Start server
deno task dev

# Terminal 2: Watch SSE
curl -N http://localhost:8000/api/events/default

# Terminal 3: Modify file
echo "# Updated!" >> ~/.config/homebase/notes.md

# Should see event in Terminal 2
```

---

## Phase 7: Polish & Production (Single Agent)

**Goal**: Production-ready build and deployment.

### Tasks

```
7.1 Add container-max-width support
    - CSS for full/percentage/pixel values
    - Responsive adjustments
    
7.2 Add font loading
    - Local font-family support
    - @font-face for remote fonts
    - Fallback to system monospace
    
7.3 Add error boundaries
    - Graceful widget error handling
    - Show error state in widget panel
    
7.4 Create deno task compile
    - Build Fresh app first
    - Include static/, _fresh/, deno.json
    - Test compiled binary
    
7.5 Add logging
    - Request logging
    - File watcher events
    - SSE connection tracking
    
7.6 Write integration tests
    File: tests/integration/
    - Dashboard rendering
    - SSE event delivery
    - Config validation errors
```

### Deliverables
- [ ] `deno task compile` produces working binary
- [ ] All visual polish complete
- [ ] Integration tests pass

### Verification
```bash
# Build and test executable
deno task build
deno task compile
CONFIG_DIR=~/.config/homebase ./homebase &
curl -s http://localhost:8000/default | grep -q "datetime"
kill %1
```

---

## Phase 8: Documentation (Single Agent)

**Goal**: Complete documentation for users and contributors.

### Tasks

```
8.1 Create README.md
    - Project overview
    - Quick start
    - Configuration reference
    - Widget documentation
    
8.2 Create examples/
    - Multiple example dashboards
    - Commented configurations
    - Theme examples
    
8.3 Update CLAUDE.md
    - Reflect final architecture
    - Add troubleshooting section
    - Document all environment variables
```

### Deliverables
- [ ] README.md comprehensive
- [ ] Multiple example configs
- [ ] CLAUDE.md up to date

---

## Dependency Graph

```
Phase 0 (Bootstrap)
    │
    ▼
Phase 1 (Config) ──────────────────┐
    │                              │
    ▼                              │
Phase 2 (Theme) ───┐               │
    │              │               │
    ▼              ▼               ▼
Phase 3 (Widget Framework) ◄───────┤
    │                              │
    ├───────────┬──────────┬───────┤
    ▼           ▼          ▼       │
Phase 4A    Phase 4B   Phase 4C    │
(Clock)    (Bookmarks) (Markdown)  │
    │           │          │       │
    └───────────┴──────────┴───────┤
                │                  │
                ▼                  │
         Phase 5 (Routes) ◄────────┘
                │
                ▼
         Phase 6 (SSE)
                │
                ▼
         Phase 7 (Polish)
                │
                ▼
         Phase 8 (Docs)
```

---

## Agent Assignment Strategy

For optimal multi-agent execution:

| Agent | Phases | Notes |
|-------|--------|-------|
| Agent 1 | 0, 1, 2 | Foundation work, must complete first |
| Agent 2 | 3, 5 | Framework + routing (after Agent 1) |
| Agent 3 | 4A | Clock widget (after Phase 3) |
| Agent 4 | 4B | Bookmarks widget (after Phase 3) |
| Agent 5 | 4C | Markdown widget (after Phase 3) |
| Agent 6 | 6 | SSE system (after Phase 5) |
| Agent 7 | 7, 8 | Polish + docs (final) |

Minimum agents for sequential execution: **1**  
Optimal agents for parallel execution: **5** (peak during Phase 4)

---

## Success Criteria

The project is complete when:

1. ✅ `deno task dev` starts without errors
2. ✅ Example dashboard renders at `/default`
3. ✅ All 3 MVP widgets display correctly
4. ✅ Clock updates in real-time
5. ✅ Markdown widget updates when file changes
6. ✅ Theme colors apply from YAML config
7. ✅ `deno compile` produces working binary
8. ✅ All tests pass
9. ✅ Documentation is complete
