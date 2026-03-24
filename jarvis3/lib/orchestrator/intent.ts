import type { TaskType } from "@/types";

interface IntentResult { taskType: TaskType; confidence: number; reason: string; }

const PATTERNS: Record<TaskType, RegExp[]> = {
  image: [
    /\b(draw|paint|illustrate|render|sketch|generate|create|make)\b.*(image|picture|photo|illustration|art|artwork|portrait|scene|landscape)/i,
    /\b(image|picture|photo|illustration|art|artwork|portrait|scene|landscape)\b.*(of|with|showing|depicting)/i,
    /\b(txt2img|text.?to.?image|img2img|stable.?diffusion|midjourney.?style)\b/i,
    /^(an?\s+)?(realistic|photorealistic|digital art|oil painting|watercolor|sketch of)/i,
  ],
  video: [
    /\b(animate|animation|video|film|movie|clip|footage)\b/i,
    /\b(animatediff|stable.?video|svd|txt2vid|text.?to.?video)\b/i,
    /\b(moving|motion|animated)\b.*(image|picture|scene)/i,
  ],
  code: [
    /\b(write|generate|create|build|make|code|implement|develop)\b.*(code|function|component|page|app|website|api|hook|class|module|script|utility)/i,
    /\b(code|function|component|page|app|website|api|hook|class|module|script)\b.*(for|that|to|with|in)\b/i,
    /\b(next\.?js|react|typescript|javascript|python|node\.?js)\b.*(code|component|function|app)/i,
    /\b(html|css|tailwind|shadcn)\b/i,
  ],
  workflow: [
    /\b(workflow|pipeline|chain|sequence|multi.?step|step.?by.?step)\b/i,
    /\b(then|after that|next|followed by|and then)\b.*\b(generate|create|make|use)\b/i,
    /\b(first|step 1|1\.|1\))\b.*(then|step 2|2\.|2\))\b/i,
  ],
  text: [
    /\b(write|explain|describe|summarize|translate|analyze|review|answer|tell|help)\b/i,
    /\b(what|how|why|when|where|who)\b/i,
  ],
};

export function detectIntent(prompt: string): IntentResult {
  const scores: Record<TaskType, number> = { image: 0, video: 0, code: 0, workflow: 0, text: 0 };
  for (const [taskType, patterns] of Object.entries(PATTERNS) as [TaskType, RegExp[]][]) {
    for (const pattern of patterns) if (pattern.test(prompt)) scores[taskType] += 1;
  }
  let bestType: TaskType = "text";
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores) as [TaskType, number][]) {
    if (type === "text") continue;
    if (score > bestScore) { bestScore = score; bestType = type as TaskType; }
  }
  if (bestScore === 0) bestType = "text";
  const totalPatterns = PATTERNS[bestType].length;
  const confidence = bestScore > 0 ? Math.min(1, bestScore / totalPatterns) : 0.5;
  return { taskType: bestType, confidence, reason: bestScore > 0 ? `Matched ${bestScore} pattern(s) for ${bestType}` : "No specific pattern matched, defaulting to text" };
}

export function parseWorkflowSteps(prompt: string): string[] {
  const numberedMatch = prompt.match(/\d+[\.)\s*[^\d\n]+/g);
  if (numberedMatch && numberedMatch.length > 1) return numberedMatch.map((s) => s.replace(/^\d+[\.)\s*/, "").trim());
  const thenSplit = prompt.split(/\bthen\b|\bafter that\b|\bnext\b|\bfollowed by\b/i);
  if (thenSplit.length > 1) return thenSplit.map((s) => s.trim()).filter(Boolean);
  return [prompt];
}
