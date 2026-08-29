# n8n Blog Notification — App Integration Instructions

## Context

The n8n workflow is built, tested, and **published/live**. It listens for a webhook call and emails all users when a new blog post is created. This document is the instruction set to hand to an AI coding assistant (or to follow manually) to wire this into the app's backend.

**Production Webhook URL:**
```
http://localhost:5678/webhook/97ebc3e7-ab43-4ecd-8462-5d2fd2974cfd
```

> Note: `localhost:5678` only works while n8n is running on the same machine as the app during local development. If the app is ever deployed elsewhere (a server, cloud host, etc.), n8n will need to be hosted somewhere reachable from that server too, and this URL will need to be updated.

---

## Required JSON Payload Shape

The webhook expects **exactly** this structure — the n8n workflow's Split Out node and Email node are built around these exact field names:

```json
{
  "postId": "string",
  "title": "string",
  "authorName": "string",
  "postUrl": "string",
  "recipients": [
    { "email": "string", "name": "string" }
  ]
}
```

- `recipients` must be an array of objects, each with exactly `email` and `name` fields.
- Field names are case-sensitive and must match exactly.

---

## Instructions for the AI Coding Assistant

```
I have a Node.js/Express app with MongoDB. I need to add a feature: 
whenever a new blog post is created, send a webhook request to n8n 
so it can email all users about the new post.

First, find these on your own by searching the project:
- The Blog/Post model (likely in a models/ folder, defines the blog schema)
- The User model (likely in models/, check its actual field names for 
  email and display name — they might not be called exactly "email"/"name")
- The controller or route function that handles creating a new blog post

The n8n webhook URL is: http://localhost:5678/webhook/97ebc3e7-ab43-4ecd-8462-5d2fd2974cfd

The webhook expects this exact JSON body:
  {
    "postId": string,
    "title": string,
    "authorName": string,
    "postUrl": string,
    "recipients": [ { "email": string, "name": string } ]
  }
Note: "email" and "name" inside recipients must be exactly these keys, 
even if your User model's own field names are different — map them 
when building the recipients array.

Requirements:
1. After a blog post is successfully saved, fire a POST request to 
   the webhook URL above using axios (install it if it's not already 
   a dependency).
2. Fetch all users EXCEPT the post's author for the recipients list 
   (only need their email and display name).
3. Do NOT make the user wait for the webhook call to finish before 
   responding — fire it and catch errors silently (just console.log 
   them), don't block or fail the main request if the webhook fails.
4. Store the webhook URL in an environment variable (.env) instead 
   of hardcoding it in the file.

Show me exactly which files you found and changed, and the diffs.
```

---

## Reference Implementation

```javascript
// blogController.js
const axios = require("axios");

async function createBlogPost(req, res) {
  const { title, content } = req.body;

  const post = await Blog.create({
    title,
    content,
    authorId: req.user.id,
    authorName: req.user.name,
  });

  // Exclude the author from their own notification
  const recipients = await User.find(
    { _id: { $ne: req.user.id } },
    "email name"
  );

  axios.post(process.env.N8N_WEBHOOK_URL, {
    postId: post._id,
    title: post.title,
    authorName: req.user.name,
    postUrl: `https://yourapp.com/blogs/${post._id}`,
    recipients,
  }).catch(err => console.error("n8n webhook failed:", err.message));

  res.json(post); // respond immediately, don't wait on the webhook
}
```

**.env addition:**
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/97ebc3e7-ab43-4ecd-8462-5d2fd2974cfd
```

---

## Still To Do (Not Yet Built)

- **Secure the webhook** — right now anyone who finds the URL could trigger fake notification emails to all users. Add a shared-secret header check:
  - App side: send a header like `x-webhook-secret` with the request
  - n8n side: add an IF node right after the Webhook node that checks the header matches before continuing
- **Consider a dedicated sending service** if the user base grows — personal Gmail SMTP will get rate-limited/blocked at scale. SendGrid or Resend are drop-in replacements in the n8n Email node's credentials.
