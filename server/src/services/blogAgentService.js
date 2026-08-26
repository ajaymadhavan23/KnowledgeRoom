import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { markdownToBlocks } from "../utils/markdownToBlocks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "server/.env"),
  path.resolve(process.cwd(), "Project1/.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../../Project1/.env")
];

dotenv.config({ quiet: true });

function loadLooseEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return false;

  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
  return true;
}

function loadAgentEnv() {
  for (const envPath of envPaths) {
    dotenv.config({ path: envPath, override: false, quiet: true });
    loadLooseEnvFile(envPath);
  }
}

loadAgentEnv();

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
}

export function getBlogAgentEnvStatus() {
  return {
    hasGeminiKey: Boolean(getApiKey()),
    model: getModel(),
    checkedEnvFiles: [...new Set(envPaths)].map((envPath) => ({
      path: envPath,
      exists: fs.existsSync(envPath)
    }))
  };
}

function getModel() {
  const configured = process.env.MODEL || "gemini-3.5-flash";
  const aliases = {
    "gemini-flash-latest": "gemini-3.5-flash",
    "gemini-latest-flash": "gemini-3.5-flash"
  };
  return aliases[configured] || configured;
}

function extractText(data) {
  return data?.candidates?.flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n")
    .trim();
}

async function callGemini(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const status = getBlogAgentEnvStatus();
    const checked = status.checkedEnvFiles
      .filter((file) => file.exists)
      .map((file) => file.path)
      .join(", ");
    const error = new Error(`Gemini API key is missing. Add GEMINI_API_KEY to server/.env, Project1/.env, or server environment variables. Checked existing files: ${checked || "none"}`);
    error.status = 500;
    throw error;
  }

  const model = getModel();
  const response = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.65,
        topP: 0.9,
        maxOutputTokens: 4096
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Gemini draft generation failed");
    error.status = response.status;
    throw error;
  }

  const text = extractText(data);
  if (!text) {
    const error = new Error("Gemini returned an empty draft");
    error.status = 502;
    throw error;
  }
  return text;
}

function parseJsonObject(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) throw new Error("AI response did not contain JSON");
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function normalizeTags(tags = []) {
  return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 8);
}

function excerptFromBlocks(blocks) {
  return blocks
    .filter((block) => ["text", "list"].includes(block.type))
    .map((block) => block.content.replace(/\n/g, " "))
    .join(" ")
    .slice(0, 180)
    .trim();
}

export async function generateBlogDraft({ topic, user }) {
  const safeTopic = String(topic || "").trim();
  if (!safeTopic) {
    const error = new Error("Topic is required");
    error.status = 400;
    throw error;
  }

  const prompt = `
You are the Knowledge Room blog agent for a company knowledge-sharing MERN app.

Create a practical technical blog draft for this topic:
"${safeTopic}"

Audience:
- Software engineers and technical employees
- Prefer practical, clear explanations over generic marketing language

Logged-in author context:
- Name: ${user?.name || "Employee"}
- Department: ${user?.department || "General"}

Return ONLY valid JSON with this exact shape:
{
  "title": "Short title — 2 to 5 words MAX, no subtitle or colon",
  "excerpt": "One short feed preview under 180 characters",
  "tags": ["tag-one", "tag-two"],
  "markdown": "# Title\\n\\nIntro...\\n\\n## Section..."
}

Markdown rules:
- Title rule: MUST be 2 to 5 words, no colon, no subtitle (e.g. "JWT Auth Explained", "React State Deep Dive").
- Include one H1 title, a short intro, 4 to 6 H2 sections, and a conclusion.
- Include bullet lists where useful.
- Include concise fenced code blocks only when they genuinely help.
- Keep the complete draft around 700 to 1100 words.
`;

  const firstPass = await callGemini(prompt);
  let parsed;
  try {
    parsed = parseJsonObject(firstPass);
  } catch (_error) {
    const repairPass = await callGemini(`
Convert the following response into ONLY valid JSON with keys title, excerpt, tags, markdown.
Do not add commentary.

${firstPass}
`);
    parsed = parseJsonObject(repairPass);
  }

  const title = String(parsed.title || safeTopic).trim();
  const blocks = markdownToBlocks(parsed.markdown || "");

  return {
    title,
    excerpt: String(parsed.excerpt || excerptFromBlocks(blocks)).slice(0, 180),
    tags: normalizeTags(Array.isArray(parsed.tags) ? parsed.tags : []),
    blocks
  };
}
