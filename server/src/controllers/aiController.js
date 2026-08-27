import { generateBlogDraft } from "../services/blogAgentService.js";

export async function createBlogDraft(req, res, next) {
  try {
    const draft = await generateBlogDraft({
      topic: req.body.topic,
      stylePreference: req.body.stylePreference ?? null,
      user: req.user
    });
    res.json(draft);
  } catch (error) {
    next(error);
  }
}
