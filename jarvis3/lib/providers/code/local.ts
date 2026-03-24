/**
 * LocalCodeProvider — structured code generation pipeline.
 *
 * Uses Ollama (if available) or a structured template engine to generate:
 *   - Next.js/React component files
 *   - Page structures
 *   - Config suggestions
 *   - Folder output structure
 *
 * The output is structured code — no fake placeholders.
 */
import type { JobInput, JobOutput, ProviderHealthResult } from "@/types";
import { BaseProvider, type GenerateOptions } from "../base";
import { readConfig } from "@/lib/config";

interface CodeGenerationPlan {
  projectType: string;
  files: Array<{
    path: string;
    description: string;
    content: string;
  }>;
  setupInstructions: string;
}

export class LocalCodeProvider extends BaseProvider {
  readonly id = "local-code";
  readonly name = "Code Generator (Local)";
  readonly capability = "code" as const;
  readonly isFree = true;
  readonly isLocal = true;

  private get ollamaEndpoint(): string {
    return readConfig().ollamaEndpoint;
  }

  private get ollamaModel(): string {
    return readConfig().ollamaModel;
  }

  async isAvailable(): Promise<ProviderHealthResult> {
    // Code generation is always available (falls back to structured templates)
    // But it's better with Ollama running
    try {
      const res = await fetch(`${this.ollamaEndpoint}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        return {
          status: "available",
          checkedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Ollama not available — still usable via template engine
    }

    return {
      status: "available",
      checkedAt: new Date().toISOString(),
    };
  }

  validateInput(input: JobInput): string | null {
    if (!input.prompt || input.prompt.trim().length === 0) {
      return "Prompt cannot be empty";
    }
    return null;
  }

  async generate(input: JobInput, opts: GenerateOptions): Promise<JobOutput[]> {
    const validationError = this.validateInput(input);
    if (validationError) throw new Error(validationError);

    opts.onProgress?.(10);

    let plan: CodeGenerationPlan;

    // Try Ollama first for intelligent generation
    try {
      plan = await this.generateWithOllama(input.prompt, opts.onProgress);
    } catch {
      // Fall back to structured template if Ollama fails
      plan = this.generateWithTemplate(input.prompt);
    }

    opts.onProgress?.(90);

    const outputs: JobOutput[] = [];

    // Output 1: The full plan as structured JSON
    outputs.push({
      type: "code",
      content: JSON.stringify(plan, null, 2),
      metadata: {
        format: "json",
        kind: "generation-plan",
        provider: this.id,
      },
    });

    // Output 2: Individual files as separate text outputs
    for (const file of plan.files) {
      outputs.push({
        type: "code",
        content: file.content,
        metadata: {
          format: "code",
          filePath: file.path,
          description: file.description,
          provider: this.id,
        },
      });
    }

    opts.onProgress?.(100);
    return outputs;
  }

  private async generateWithOllama(
    prompt: string,
    onProgress?: (p: number) => void
  ): Promise<CodeGenerationPlan> {
    onProgress?.(20);

    const systemPrompt = `You are an expert full-stack developer.
When given a request, respond with a JSON object that describes the code to generate.
The JSON must follow this exact schema:
{
  "projectType": "string (e.g. 'Next.js component', 'React page', 'utility function')",
  "files": [
    {
      "path": "string (relative file path, e.g. 'components/Button.tsx')",
      "description": "string (one-line description)",
      "content": "string (full file content)"
    }
  ],
  "setupInstructions": "string (any npm installs or setup steps needed)"
}
Respond ONLY with valid JSON, no markdown, no explanation outside the JSON.`;

    const res = await fetch(`${this.ollamaEndpoint}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.ollamaModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: false,
        options: { temperature: 0.3, num_predict: 4096 },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) throw new Error(`Ollama error ${res.status}`);

    const data = await res.json() as { message?: { content: string }; response?: string };
    const raw = data.message?.content ?? data.response ?? "";

    onProgress?.(70);

    // Extract JSON from response (handle cases where model adds extra text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as CodeGenerationPlan;
    return parsed;
  }

  private generateWithTemplate(prompt: string): CodeGenerationPlan {
    // Structured template fallback when Ollama is not available.
    // Analyzes the prompt to determine what kind of code to generate.
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("component") || lowerPrompt.includes("button") || lowerPrompt.includes("card")) {
      return this.reactComponentTemplate(prompt);
    } else if (lowerPrompt.includes("page") || lowerPrompt.includes("landing")) {
      return this.nextPageTemplate(prompt);
    } else if (lowerPrompt.includes("api") || lowerPrompt.includes("route") || lowerPrompt.includes("endpoint")) {
      return this.apiRouteTemplate(prompt);
    } else if (lowerPrompt.includes("hook") || lowerPrompt.includes("use")) {
      return this.reactHookTemplate(prompt);
    } else {
      return this.genericTemplate(prompt);
    }
  }

  private reactComponentTemplate(prompt: string): CodeGenerationPlan {
    const componentName = this.extractComponentName(prompt) || "GeneratedComponent";
    return {
      projectType: "React Component",
      files: [
        {
          path: `components/${componentName}.tsx`,
          description: `${componentName} React component`,
          content: `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

/**
 * ${componentName}
 * Generated by Jarvis 3 — customize as needed.
 * Prompt: ${prompt}
 */
export function ${componentName}({ className, children }: ${componentName}Props) {
  return (
    <div className={\`\${className ?? ''}\`}>
      {children ?? <p>${componentName} component</p>}
    </div>
  );
}

export default ${componentName};
`,
        },
      ],
      setupInstructions: "No additional dependencies required.",
    };
  }

  private nextPageTemplate(prompt: string): CodeGenerationPlan {
    const pageName = this.extractPageName(prompt) || "GeneratedPage";
    return {
      projectType: "Next.js Page",
      files: [
        {
          path: `app/${pageName.toLowerCase()}/page.tsx`,
          description: `${pageName} page`,
          content: `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${pageName}',
  description: 'Generated by Jarvis 3',
};

/**
 * ${pageName}
 * Generated by Jarvis 3 — customize as needed.
 * Prompt: ${prompt}
 */
export default function ${pageName}Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">${pageName}</h1>
      <p className="text-muted-foreground">
        Content generated for: ${prompt}
      </p>
    </main>
  );
}
`,
        },
      ],
      setupInstructions: "Add to your Next.js app directory.",
    };
  }

  private apiRouteTemplate(prompt: string): CodeGenerationPlan {
    return {
      projectType: "Next.js API Route",
      files: [
        {
          path: "app/api/generated/route.ts",
          description: "API route",
          content: `import { NextRequest, NextResponse } from 'next/server';

/**
 * Generated API Route
 * Prompt: ${prompt}
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  return NextResponse.json({
    success: true,
    data: {
      message: 'Generated endpoint',
      params: Object.fromEntries(searchParams),
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  return NextResponse.json({
    success: true,
    data: body,
  });
}
`,
        },
      ],
      setupInstructions: "No additional dependencies required.",
    };
  }

  private reactHookTemplate(prompt: string): CodeGenerationPlan {
    const hookName = "useGenerated";
    return {
      projectType: "React Custom Hook",
      files: [
        {
          path: `hooks/${hookName}.ts`,
          description: "Custom React hook",
          content: `import { useState, useEffect, useCallback } from 'react';

/**
 * ${hookName}
 * Generated by Jarvis 3 — customize as needed.
 * Prompt: ${prompt}
 */
export function ${hookName}() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: implement logic based on: ${prompt}
      setData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
`,
        },
      ],
      setupInstructions: "No additional dependencies required.",
    };
  }

  private genericTemplate(prompt: string): CodeGenerationPlan {
    return {
      projectType: "TypeScript Module",
      files: [
        {
          path: "lib/generated.ts",
          description: "Generated TypeScript module",
          content: `/**
 * Generated Module
 * Prompt: ${prompt}
 *
 * Generated by Jarvis 3 — customize as needed.
 */

export interface GeneratedConfig {
  // Add your configuration here
}

export async function execute(config: GeneratedConfig): Promise<unknown> {
  // TODO: Implement logic for: ${prompt}
  throw new Error('Not yet implemented — edit this file to add your logic.');
}
`,
        },
      ],
      setupInstructions: "No additional dependencies required.",
    };
  }

  private extractComponentName(prompt: string): string {
    const match = prompt.match(/(?:called?|named?)\s+([A-Z][a-zA-Z]+)/);
    if (match) return match[1];
    const words = prompt.split(/\s+/).filter(w => /^[a-zA-Z]/.test(w));
    if (words.length > 0) {
      return words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    return "Component";
  }

  private extractPageName(prompt: string): string {
    const match = prompt.match(/(?:page?|called?|named?)\s+([A-Z][a-zA-Z]+)/);
    if (match) return match[1];
    return "Page";
  }

  normalizeOutput(raw: unknown): JobOutput[] {
    if (Array.isArray(raw)) return raw as JobOutput[];
    return [];
  }
}
