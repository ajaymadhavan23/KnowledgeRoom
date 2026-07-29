# AGENTS.md — Knowledge Room
### A Personal + Social Knowledge Management Platform for Companies (MERN Stack)

---

## 1. PROJECT OVERVIEW

**Knowledge Room** is a workplace knowledge-sharing platform where every employee gets a private, Notion-like workspace to organize what they've learned (folders, notes, code, links, images), plus a **shared public Blog feed** where employees can publish any of their private items for the whole company to see, like, comment on, and save into their own space.

**Core philosophy:** Private learning space (for yourself) + Public feed (for the team) = a company-wide knowledge flywheel. Someone learns something → writes it up privately → decides to share it → others discover it, save it into their own space, and build on it.

**Tech Stack:**
- **Frontend:** React (Vite), React Router, Context API or Zustand for state, TailwindCSS
- **Backend:** Node.js + Express (REST API)
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (access + refresh token pattern)
- **File/Image storage:** Cloudinary or AWS S3 (images), or GridFS if you want to keep it all in Mongo
- **Rich text editor:** Tiptap or Editor.js (block-based, Notion-style) — recommended: **Editor.js** since it naturally supports block types (text, code, image, link) which maps perfectly to your requirement
- **Code syntax highlighting:** Prism.js or react-syntax-highlighter
- **Optional real-time:** Socket.io (for live comment/like updates on blog posts)

---

## 2. USER ROLES

Keep it simple — this isn't a multi-tier approval workflow like your ADNHC app. Two roles are enough:

| Role | Permissions |
|---|---|
| **Employee** (default) | Full access to own personal space, can publish to public blog, can like/comment/save on others' posts |
| **Admin** | Everything an Employee can do + manage users, moderate/remove inappropriate blog posts, view company-wide analytics (most active users, most saved posts, etc.) |

*(Optional future role: "Team Lead" who can see team-specific saved collections — skip for v1)*

---

## 3. SCREENS (Full List)

### Auth
1. **Login** — email + password
2. **Signup** — name, email, password, department (dropdown)
3. **Forgot/Reset Password**

### Personal Space (Private)
4. **My Space (Home/Dashboard)** — folder tree view (sidebar) + recent items grid, "Continue where you left off"
5. **Folder View** — shows all items inside a folder (notes, links, code, images) as cards; breadcrumb navigation for nested folders
6. **Item Editor / Viewer** — the core Notion-style block editor:
   - Add text blocks, headings, bullet lists
   - Add a code block (with language selector + syntax highlighting)
   - Add a link block (auto-fetches title/favicon preview like Notion does)
   - Add an image block (upload or paste URL)
   - Tag the item (e.g. #PowerFx, #React)
   - "Publish to Blog" button right inside the editor
7. **Search (Personal)** — full-text search across all your own folders/items, filter by tag/type
8. **Saved from Community** — a special auto-folder that holds everything you've saved from the public Blog

### Public Blog (Community)
9. **Blog Feed (Home)** — infinite-scroll/paginated feed of all published posts company-wide, sorted by Latest / Most Liked / Most Viewed, filter by tag
10. **Blog Post Detail** — full rendered content (same block-based renderer as the editor, but read-only) + like button + view counter + comment thread + "Save to My Space" button
11. **My Published Posts** — a filtered view of just what *you've* published, with per-post analytics (views, likes, comments)
12. **Author Profile Page** — click any user's name → see their public bio, department, and all their published posts (like a mini portfolio)

### Shared/Utility
13. **Notifications** — someone liked/commented on your post, or someone saved your post
14. **Settings/Profile** — edit name, avatar, department, bio
15. **Admin Dashboard** *(admin only)* — total users, total posts, most active users, flagged/reported posts, ability to delete a post

---

## 4. FUNCTIONALITY BREAKDOWN

### 4.1 Personal Space
- Create/rename/delete/move folders (nested folders allowed — a folder can contain sub-folders)
- Create items of type: `note`, `link`, `code`, `image`, or `mixed` (a note that contains multiple block types together, like true Notion pages)
- Drag-and-drop reordering of items within a folder *(nice-to-have, not MVP)*
- Tag any item with one or more tags for filtering
- Full item history isn't needed for v1 — keep it simple, just `createdAt`/`updatedAt`

### 4.2 Publishing to Blog
- From any item, click "Publish" → creates a **copy** as a `BlogPost` (don't just reference the original — if the user edits their private note later, the published post shouldn't silently change, unless you want to add a "synced" toggle as a stretch goal)
- On publish, prompt for an optional short **excerpt/summary** (helps the blog feed look clean, like Medium's preview text)
- Un-publish/delete option — removes it from the public feed but original private item stays untouched

### 4.3 Public Blog Feed
- Every post shows: author name + avatar, department, title, excerpt, tags, like count, view count, comment count, published date
- **View count** — increments once per unique user per post (track in a `views` array of userIds on the post, or a separate `PostView` collection if you want IP/timestamp granularity)
- **Like** — toggle like/unlike, like count updates instantly (optimistic UI update on frontend)
- **Comment** — simple flat comments (no nested replies for v1), each with author + timestamp + delete-own-comment option
- **Save to My Space** — copies the full post content into the viewer's personal space, into their auto-created "Saved from Community" folder (this is essentially the same "copy on save" pattern as publishing)

### 4.4 Search
- Personal search: MongoDB text index on the user's own items only
- Public blog search: text index across all published posts + tag filter

### 4.5 Notifications *(simple polling or Socket.io based)*
- New like on your post
- New comment on your post
- Someone saved your post

---

## 5. MONGODB SCHEMA DESIGN

### `User`
```javascript
{
  _id: ObjectId,
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  department: String,
  role: { type: String, enum: ["employee", "admin"], default: "employee" },
  avatarUrl: String,
  bio: String,
  createdAt: Date
}
```

### `Folder`
```javascript
{
  _id: ObjectId,
  owner: { type: ObjectId, ref: "User" },
  name: String,
  parentFolder: { type: ObjectId, ref: "Folder", default: null }, // null = root level
  isSystemFolder: { type: Boolean, default: false }, // true for the auto "Saved from Community" folder
  createdAt: Date
}
```

### `Item` (the core content unit — a note/link/code/image page)
```javascript
{
  _id: ObjectId,
  owner: { type: ObjectId, ref: "User" },
  folder: { type: ObjectId, ref: "Folder" },
  title: String,
  tags: [String],
  blocks: [
    {
      type: { type: String, enum: ["text", "heading", "code", "link", "image", "list"] },
      content: String,       // raw text, code, or URL depending on type
      language: String,      // only used when type === "code" (e.g. "javascript", "powerfx")
      meta: Object            // e.g. link preview title/favicon, image alt text
    }
  ],
  isPublished: { type: Boolean, default: false },
  publishedPostId: { type: ObjectId, ref: "BlogPost", default: null }, // link back if published
  createdAt: Date,
  updatedAt: Date
}
```

### `BlogPost` (the published, public-facing copy)
```javascript
{
  _id: ObjectId,
  author: { type: ObjectId, ref: "User" },
  originalItem: { type: ObjectId, ref: "Item" }, // reference to source, for traceability
  title: String,
  excerpt: String,
  tags: [String],
  blocks: [ /* same block schema as Item */ ],
  likes: [{ type: ObjectId, ref: "User" }],       // array of userIds who liked it
  views: [{ type: ObjectId, ref: "User" }],       // array of unique userIds who viewed it
  isActive: { type: Boolean, default: true },     // for admin soft-delete/moderation
  publishedAt: Date
}
```
*(Index `title`, `excerpt`, and `tags` with a MongoDB text index for search)*

### `Comment`
```javascript
{
  _id: ObjectId,
  post: { type: ObjectId, ref: "BlogPost" },
  author: { type: ObjectId, ref: "User" },
  text: String,
  createdAt: Date
}
```

### `Notification`
```javascript
{
  _id: ObjectId,
  recipient: { type: ObjectId, ref: "User" },
  type: { type: String, enum: ["like", "comment", "save"] },
  fromUser: { type: ObjectId, ref: "User" },
  post: { type: ObjectId, ref: "BlogPost" },
  isRead: { type: Boolean, default: false },
  createdAt: Date
}
```

---

## 6. API ROUTES (Express)

### Auth
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/logout
```

### Folders
```
GET    /api/folders                 → get folder tree for logged-in user
POST   /api/folders                 → create folder
PATCH  /api/folders/:id             → rename/move folder
DELETE /api/folders/:id
```

### Items (Personal Space)
```
GET    /api/items?folderId=xxx      → list items in a folder
GET    /api/items/:id                → get single item (full blocks)
POST   /api/items                    → create item
PATCH  /api/items/:id                → update item/blocks
DELETE /api/items/:id
GET    /api/items/search?q=xxx&tag=xxx
```

### Publishing
```
POST   /api/items/:id/publish        → creates BlogPost copy, sets isPublished = true
POST   /api/posts/:id/unpublish      → sets isActive = false, keeps original Item untouched
```

### Blog (Public)
```
GET    /api/posts?sort=latest|top|mostViewed&tag=xxx&page=1
GET    /api/posts/:id
POST   /api/posts/:id/like           → toggle like
POST   /api/posts/:id/view           → register a view (idempotent per user)
POST   /api/posts/:id/save           → copies post into user's "Saved from Community" folder
GET    /api/posts/search?q=xxx
```

### Comments
```
GET    /api/posts/:id/comments
POST   /api/posts/:id/comments
DELETE /api/comments/:id             → only comment author or admin
```

### Users
```
GET    /api/users/:id                → public profile (name, dept, bio, their published posts)
PATCH  /api/users/me                 → update own profile
```

### Admin
```
GET    /api/admin/stats              → total users, posts, most active users
GET    /api/admin/posts              → all posts including flagged
PATCH  /api/admin/posts/:id/deactivate
```

### Notifications
```
GET    /api/notifications
PATCH  /api/notifications/:id/read
```

---

## 7. FRONTEND STRUCTURE (React)

```
/src
  /components
    /editor         → BlockEditor.jsx, TextBlock.jsx, CodeBlock.jsx, LinkBlock.jsx, ImageBlock.jsx
    /blog           → PostCard.jsx, PostDetail.jsx, CommentThread.jsx, LikeButton.jsx
    /space          → FolderTree.jsx, FolderView.jsx, ItemCard.jsx
    /shared         → Navbar.jsx, SearchBar.jsx, TagFilter.jsx, Avatar.jsx
  /pages
    LoginPage.jsx
    SignupPage.jsx
    MySpacePage.jsx
    FolderPage.jsx
    ItemEditorPage.jsx
    BlogFeedPage.jsx
    BlogPostPage.jsx
    MyPostsPage.jsx
    ProfilePage.jsx
    AdminDashboardPage.jsx
  /context or /store
    AuthContext.jsx
    useAuth.js
  /services
    api.js            → axios instance with interceptor for JWT
    authService.js
    itemService.js
    postService.js
  /hooks
    useDebounce.js     → for search-as-you-type
```

---

## 8. BUILD PHASES (Suggested Order)

**Phase 1 — Foundation**
- Express server setup, MongoDB connection, User model
- JWT auth (signup/login/middleware)
- Basic React app shell + routing + protected routes

**Phase 2 — Personal Space Core**
- Folder CRUD + nested folder tree UI
- Item CRUD with basic block editor (text + code block first, simplest to build)
- Personal search

**Phase 3 — Rich Content**
- Add link block (with metadata scraping — use a package like `link-preview-js` or `open-graph-scraper` on the backend)
- Add image block (Cloudinary upload)

**Phase 4 — Publishing + Public Blog**
- Publish flow (Item → BlogPost copy)
- Blog feed with pagination + sort/filter
- Blog post detail page rendering blocks read-only

**Phase 5 — Social Features**
- Like + view tracking
- Comments
- Save-to-my-space (the reverse copy operation)

**Phase 6 — Polish**
- Notifications
- Author profile pages
- Admin dashboard
- Tag-based discovery/filtering

**Phase 7 — Nice-to-haves (stretch)**
- Drag-and-drop block reordering in editor
- Real-time notifications via Socket.io
- "Trending this week" algorithm on blog feed (views + likes weighted by recency)
- Export a folder/item as PDF (you already know the pdf skill pattern from your other work!)

---

## 9. KEY DESIGN DECISIONS (and why)

1. **Copy-on-publish, not reference-on-publish** — Keeps the private space and public blog decoupled. If you edit your private note after publishing, the public post doesn't silently change underneath viewers who already liked/commented on it. Cleaner mental model, avoids a class of sync bugs.
2. **Block-based content model (`blocks: []`) instead of one big HTML/Markdown string** — Matches your requirement of mixed content types (text + code + image + link in one note) and makes rendering/editing predictable, same reasoning as why Notion/Editor.js do it this way.
3. **Two roles only (Employee/Admin)** — Deliberately kept simple compared to your ADNHC project's 3-role workflow. Adding more roles later (e.g. "Team Lead") is easy to bolt on since permissions are just role-string checks in middleware.
4. **"Saved from Community" as a system folder, not a separate schema** — Reuses your existing Folder+Item schema instead of inventing a new concept, so your personal space UI code doesn't need a special case to display saved items.

---

## 10. SUGGESTED MVP SCOPE (if you want to ship fast)

If you want a genuinely shippable v1 in ~1-2 weeks of evenings/weekends:
- Auth ✅
- Folders + Items with just `text` and `code` block types (skip image/link blocks for v1)
- Publish → Blog feed → Like + Comment + Save
- Skip: notifications, admin dashboard, author profile pages

Everything else in this doc is your roadmap for v2+.
