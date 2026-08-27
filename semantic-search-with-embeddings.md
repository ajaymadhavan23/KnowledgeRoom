# Semantic Search with Embeddings — Implementation Plan

## Why This Feature

Plugs directly into the app's save/fork mechanic — surfaces similar notes when a user is about to fork or save a blog. It's a genuinely different skill from the AI agent work already built (embeddings ≠ generation), and it's a manageable weekend project using existing infra (MongoDB Atlas) rather than a new architecture.

---

## Step 0: The Concept

An **embedding** is a list of numbers (a vector) representing the *meaning* of text. Similar meanings produce similar numbers, even when the words are completely different.

```
"how to catch errors" → [0.12, -0.45, 0.88, ...]  (768 numbers)
"exception handling"  → [0.11, -0.43, 0.85, ...]  (768 numbers, very close!)
"chocolate cake recipe" → [0.91, 0.02, -0.31, ...] (768 numbers, far away)
```

"Close" is measured with **cosine similarity** — how aligned two vectors are. This is what lets search match by *meaning* instead of exact keywords.

**Infra choice:** Use **MongoDB Atlas Vector Search** instead of a separate vector DB (Pinecone, Weaviate). Since the app already runs on MongoDB, this avoids introducing new infrastructure to manage.

---

## Step 1: Generate Embeddings with Gemini

Same API family already used for the blog-writing agent — just a different endpoint (`text-embedding-004`).

```javascript
// embeddingService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values; // array of ~768 floats
}

module.exports = { generateEmbedding };
```

---

## Step 2: Update the Note Schema

```javascript
// Note.js (Mongoose schema)
const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
  userId: mongoose.Schema.Types.ObjectId,
  embedding: {
    type: [Number], // array of floats
    select: false,   // don't return this huge array by default in queries
  },
  createdAt: { type: Date, default: Date.now },
});
```

---

## Step 3: Generate Embedding on Note Create/Update

```javascript
// noteController.js
const { generateEmbedding } = require("./embeddingService");

async function createNote(req, res) {
  const { title, content } = req.body;

  // Combine title + content so the embedding captures the full meaning
  const textForEmbedding = `${title}\n${content}`;
  const embedding = await generateEmbedding(textForEmbedding);

  const note = await Note.create({
    title,
    content,
    userId: req.user.id,
    embedding,
  });

  res.json(note);
}
```

> **Note:** For long content, consider doing this asynchronously (save the note first, update with the embedding shortly after) so the user isn't blocked waiting on the embedding call.

---

## Step 4: Create the Vector Search Index in Atlas

Done via the Atlas UI (or API), not application code.

1. Go to the collection → **Search Indexes** → **Create Search Index** → choose **Vector Search**
2. Use this index definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

---

## Step 5: Write the Search Query

```javascript
async function findSimilarNotes(noteId) {
  const sourceNote = await Note.findById(noteId).select("+embedding");

  const results = await Note.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: sourceNote.embedding,
        numCandidates: 100,
        limit: 5,
      },
    },
    {
      $project: {
        title: 1,
        content: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  // exclude the source note itself from its own results
  return results.filter((r) => r._id.toString() !== noteId);
}
```

`numCandidates` controls how many candidates are scanned before narrowing to `limit` — higher means more accurate but slightly slower. 100 is a reasonable starting point for a smaller app.

---

## Step 6: Plug Into the Fork/Save Flow

Expose an endpoint to check for similar notes right before a user saves/forks a public blog:

```javascript
// GET /api/notes/:id/similar
router.get("/notes/:id/similar", async (req, res) => {
  const similar = await findSimilarNotes(req.params.id);
  res.json(similar);
});
```

**Frontend idea:** Right before the "Save" button, show:

> *"You already have 2 similar notes — 'Error handling in Express' (91% match). Save anyway, or check those first?"*

---

## Decision Point: Real-Time vs Batch Embedding

| Approach | Pros | Cons |
|---|---|---|
| **Real-time** (embed on save) | Simple, works immediately | Adds ~200–500ms API latency per save |
| **Batch** (embed via background job seconds later) | Better UX, no blocking | More moving parts (pairs well with a queue like BullMQ) |

**Recommendation:** Start with real-time for the first working version — add a queue later if needed.

---

## Possible Next Steps

- Frontend panel design for showing "similar notes"
- Extend semantic search across **public blogs** (not just a user's own notes) for a "discover similar posts" feature on the public feed
