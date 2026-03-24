# Jarvis 3 — Open Source AI Creation Platform

> Local-first, free, and built on real open-source tools.

Jarvis 3 is a self-hosted autonomous AI platform that orchestrates text, image, video, and code generation using free local tools. No paid APIs required.

---

## Features

- **Text generation** via Ollama (LLaMA 3, Mistral, etc.)
- **Image generation** via ComfyUI or Automatic1111
- **Video generation** via ComfyUI + AnimateDiff
- **Code generation** with structured output (React, Next.js, TypeScript)
- **Multi-step workflows** — chain outputs between tasks
- **Async job system** with status tracking
- **Local file storage** — no cloud required
- **Settings page** to configure all endpoints
- **Debug panel** with health checks and setup instructions

---

## Quick Start

### 1. Install dependencies

```bash
cd jarvis3
npm install
```

### 2. Set up local AI providers

#### Text — Ollama
```bash
# Install from https://ollama.com
ollama serve
ollama pull llama3
```

#### Image — ComfyUI (primary)
```bash
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI && pip install -r requirements.txt
# Download a checkpoint to ComfyUI/models/checkpoints/
python main.py --listen
```

#### Image — Automatic1111 (fallback)
```bash
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
cd stable-diffusion-webui
./webui.sh --api
```

#### Video — ComfyUI + AnimateDiff
```bash
# Inside ComfyUI/custom_nodes:
git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite
# Download AnimateDiff model to ComfyUI/models/animatediff_models/
```

### 3. Run Jarvis 3

```bash
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
jarvis3/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes (jobs, config, providers, workflows)
│   ├── gallery/           # Generated outputs gallery
│   ├── history/           # Job history
│   ├── workflows/         # Multi-step workflow manager
│   ├── settings/          # Provider configuration
│   └── debug/             # Health checks and diagnostics
├── components/
│   ├── chat/              # Command interface components
│   ├── gallery/           # Gallery view
│   ├── history/           # Job history table
│   ├── workflows/         # Workflow cards
│   ├── settings/          # Settings form
│   ├── debug/             # Debug panel
│   └── ui/                # Shared UI components (shadcn-style)
├── lib/
│   ├── providers/         # Provider abstraction layer
│   │   ├── text/          # Ollama provider
│   │   ├── image/         # ComfyUI + A1111 providers
│   │   ├── video/         # ComfyUI AnimateDiff provider
│   │   └── code/          # Local code generator
│   ├── orchestrator/      # Intent detection + task routing
│   ├── jobs/              # Job queue + file-based store
│   ├── storage/           # Local file storage utilities
│   └── config/            # Config management (data/config.json)
├── types/                 # Shared TypeScript types
├── data/                  # Runtime data (jobs, workflows, config)
└── public/outputs/        # Generated files served publicly
```

---

## Provider Architecture

Each provider implements the `BaseProvider` interface:

```typescript
abstract class BaseProvider {
  isAvailable(): Promise<ProviderHealthResult>
  generate(input: JobInput, opts: GenerateOptions): Promise<JobOutput[]>
  validateInput(input: JobInput): string | null
  normalizeOutput(raw: unknown): JobOutput[]
}
```

**Priority order (free/local first):**
- Text: Ollama → *(future: OpenAI optional)*
- Image: ComfyUI → Automatic1111 → *(future: Stability optional)*
- Video: ComfyUI AnimateDiff → *(future: Replicate optional)*
- Code: Local Generator (with Ollama if available)

---

## Workflow Example

From the Command Center, select **Workflow** mode and type:

```
Generate a realistic forest landscape image, then write marketing copy for it, then create a Next.js landing page component for it
```

Jarvis 3 will:
1. Detect 3 steps and their types (image → text → code)
2. Route each to the correct provider
3. Execute them sequentially
4. Pass outputs between steps

---

## Configuration

Settings are stored in `data/config.json` and can be edited via the Settings page or the API:

```bash
# Get current config
curl http://localhost:3000/api/config

# Update Ollama endpoint
curl -X PATCH http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"ollamaEndpoint": "http://192.168.1.100:11434"}'
```

---

## Future / Supabase Migration

The storage layer is abstracted in `lib/storage/local.ts`.
To migrate to Supabase:
1. Replace `readDataFile` / `writeDataFile` with Supabase queries
2. Replace `public/outputs/` with Supabase Storage
3. Job polling can be replaced with Supabase realtime

---

## License

MIT — Free and open source.
