# Knowledge Room

A MERN workplace knowledge-sharing app with a private personal space and a public company blog feed.

## What Is Built

- JWT signup/login with refresh tokens
- Employee/admin roles
- Private folders, nested folder tree, and block-based items
- Item editor with text, heading, list, code, link, and image blocks
- Personal search by text, tag, and type-ready backend
- Publish private items into public blog post copies
- Blog feed with sort/filter
- Blog post detail with view tracking, likes, comments, and save-to-my-space
- Saved from Community system folder
- My published posts analytics
- Author profile pages
- Notifications for likes, comments, and saves
- Settings/profile update
- Admin dashboard with stats and post moderation

## Run

```powershell
npm.cmd run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000/api/health
```

The first user who signs up becomes `admin`; later users become `employee`.

## MongoDB

The app uses `server/.env` for the Atlas connection string. MongoDB creates databases and collections automatically when the first document is inserted.

Main collections:

- `users`
- `folders`
- `items`
- `blogposts`
- `comments`
- `notifications`
