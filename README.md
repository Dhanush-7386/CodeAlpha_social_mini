# SocialMini — Code Alpha Internship Project

A full-stack mini social media application built with Node.js, Express, MongoDB, and Vanilla JS.

---

## Tech Stack

| Layer     | Technology                   |
|-----------|------------------------------|
| Backend   | Node.js + Express.js         |
| Database  | MongoDB + Mongoose           |
| Frontend  | Vanilla HTML, CSS, JS        |

---

## Features

- **User Profiles** — Create and browse user profiles with bio and stats.
- **Posts & Feed** — Publish posts (up to 500 chars) and browse a live feed.
- **Comments** — Comment on any post in a modal thread view.
- **Likes** — Toggle likes on posts; count updates instantly.
- **Follow System** — Follow / unfollow other users; stats update in real-time.
- **Session Persistence** — Last logged-in user is remembered via `localStorage`.

---

## Project Structure

```
socialmini/
├── server.js               # Express app, MongoDB connection, static serving
├── .env                    # Environment variables
├── package.json
├── models/
│   ├── User.js             # username, email, bio, followers[], following[]
│   ├── Post.js             # author ref, content, likes[], commentCount
│   └── Comment.js          # post ref, author ref, text
├── routes/
│   ├── users.js            # CRUD + follow/unfollow
│   ├── posts.js            # CRUD + like toggle + feed
│   └── comments.js         # Add + fetch comments per post
└── public/
    ├── index.html          # Main UI shell
    ├── styles.css          # Dark editorial theme
    └── app.js              # Fetch-based API client + DOM rendering
```

---

## Setup & Running

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017

### Steps

```bash
# 1. Clone / unzip the project
cd socialmini

# 2. Install dependencies (already done if you ran npm install)
npm install

# 3. Configure environment
# Edit .env — default values work for a local MongoDB instance:
#   PORT=3000
#   MONGO_URI=mongodb://127.0.0.1:27017/socialmini

# 4. Start MongoDB (if not already running)
mongod

# 5. Start the server
npm start
# or for auto-reload during development (Node.js 18+):
npm run dev

# 6. Open in browser
# http://localhost:3000
```

---

## REST API Reference

### Users

| Method | Endpoint                  | Body                                | Description          |
|--------|---------------------------|-------------------------------------|----------------------|
| POST   | `/api/users`              | `{ username, email, bio? }`         | Create a user        |
| GET    | `/api/users`              | —                                   | List all users       |
| GET    | `/api/users/:id`          | —                                   | Get one user         |
| POST   | `/api/users/:id/follow`   | `{ followerId }`                    | Follow / unfollow    |

### Posts

| Method | Endpoint                  | Body                                | Description          |
|--------|---------------------------|-------------------------------------|----------------------|
| POST   | `/api/posts`              | `{ authorId, content }`             | Create a post        |
| GET    | `/api/posts`              | query: `?page=1&limit=20`           | Get feed             |
| GET    | `/api/posts/:id`          | —                                   | Get one post         |
| POST   | `/api/posts/:id/like`     | `{ userId }`                        | Toggle like          |
| DELETE | `/api/posts/:id`          | —                                   | Delete a post        |

### Comments

| Method | Endpoint                  | Body                                | Description          |
|--------|---------------------------|-------------------------------------|----------------------|
| POST   | `/api/comments`           | `{ postId, authorId, text }`        | Add a comment        |
| GET    | `/api/comments/:postId`   | —                                   | Get comments for post|
| DELETE | `/api/comments/:id`       | —                                   | Delete a comment     |

---

## Health Check

```
GET /api/health
→ { status: "ok", dbState: "connected", uptime: 42.1 }
```
