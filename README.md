<div align="center">

<br />

```
██████╗ ███████╗██╗  ██╗██╗
██╔══██╗██╔════╝██║  ██║██║
██████╔╝█████╗  ███████║██║
██╔══██╗██╔══╝  ██╔══██║██║
██████╔╝██║     ██║  ██║███████╗
╚═════╝ ╚═╝     ╚═╝  ╚═╝╚══════╝
```

# Node Hierarchy Explorer

**Chitkara × Bajaj Finserv · Full Stack Engineering Challenge · Round 1**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CORS](https://img.shields.io/badge/CORS-Enabled-4CAF50?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

*A production-grade REST API that parses directed edge strings, constructs hierarchical trees, detects cycles, and returns rich structured insights — paired with a stunning dark-mode single-page frontend.*

<br />

[🔌 API Docs](#-api-reference) · [🚀 Quick Start](#-quick-start) · [🗂️ Architecture](#️-project-architecture) · [🚢 Deploy](#-deployment)

<br />

</div>

---

## 📋 Table of Contents

- [Live URLs](#-live-urls)
- [Features](#-features)
- [Project Architecture](#️-project-architecture)
- [API Reference](#-api-reference)
- [Processing Rules](#-processing-rules)
- [Quick Start](#-quick-start)
- [Deployment](#-deployment)
- [Tech Stack](#-tech-stack)
- [Candidate](#-candidate)

---

## 🌐 Live URLs

| Resource | URL |
|----------|-----|
| 🖥️ **Frontend** | *(update after Netlify deploy)* |
| 🔌 **API Base** | *(update after Render deploy)* |
| 📂 **GitHub** | *(your public repo URL)* |

> Submit these three URLs in the Bajaj Finserv submission form.

---

## ✨ Features

| # | Feature | Detail |
|---|---------|--------|
| 1 | **REST Endpoint** | `POST /bfhl` — accepts `{ "data": string[] }` |
| 2 | **Input Validation** | Regex `^[A-Z]->[A-Z]$`, trims whitespace, rejects self-loops |
| 3 | **Deduplication** | First occurrence kept; each repeated pair reported in `duplicate_edges` once |
| 4 | **Graph Construction** | Directed adjacency with **first-parent-wins** rule |
| 5 | **Component Discovery** | Undirected BFS — groups nodes into independent subtrees |
| 6 | **Cycle Detection** | Components with no root node → `has_cycle: true`, `tree: {}` |
| 7 | **Tree Building** | Recursive nested object construction |
| 8 | **Depth Calculation** | Longest root-to-leaf path (node count) |
| 9 | **Summary** | `total_trees`, `total_cycles`, `largest_tree_root` with lex tiebreaker |
| 10 | **CORS** | Globally enabled — safe for cross-origin evaluator calls |
| 11 | **Request Logging** | `morgan` dev logger in the console |
| 12 | **Premium Frontend** | Dark-mode SPA with animated tree visualisation & stats |

---

## 🗂️ Project Architecture

```
bfhl-challenge/
│
├── backend/                          ← REST API (Node.js + Express)
│   ├── server.js                     ← Entry point — binds port, starts server
│   ├── package.json
│   │
│   └── src/
│       ├── app.js                    ← Express app (middleware + routes + 404)
│       │
│       ├── config/
│       │   └── identity.js           ← Candidate credentials (single source of truth)
│       │
│       ├── routes/
│       │   └── bfhl.route.js         ← Route declarations only
│       │
│       ├── controllers/
│       │   └── bfhl.controller.js    ← HTTP boundary: validate shape → call service
│       │
│       ├── services/
│       │   └── bfhl.service.js       ← Orchestrates the 4-step pipeline
│       │
│       └── utils/
│           ├── validator.js          ← Input validation & deduplication
│           ├── graphBuilder.js       ← Directed graph + BFS component finder
│           └── treeProcessor.js      ← Tree builder, depth calc, hierarchy output
│
└── frontend/                         ← Single-page application
    ├── index.html
    ├── style.css                     ← Premium dark-mode design (no frameworks)
    └── app.js                        ← API calls, rendering, tree visualisation
```

### Data Flow

```
POST /bfhl  →  bfhl.route.js
             →  bfhl.controller.js   (HTTP validation)
             →  bfhl.service.js      (pipeline orchestration)
                  │
                  ├─ validator.js      Step 1 — validate & deduplicate
                  ├─ graphBuilder.js   Step 2 — build directed graph
                  ├─ graphBuilder.js   Step 3 — find connected components (BFS)
                  └─ treeProcessor.js  Step 4 — build hierarchies + summary
             ←  200 JSON response
```

---

## 🔌 API Reference

### `POST /bfhl`

```
POST /bfhl
Content-Type: application/json
```

#### Request Body

```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello", "A->"]
}
```

#### Response `200 OK`

```json
{
  "user_id": "yuvrajgupta_21062005",
  "email_id": "yuvraj1326.be23@chitkara.edu.in",
  "college_roll_number": "2310991326",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "depth": 3
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": ["hello", "A->"],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

#### Error Responses

| Code | Condition | Body |
|------|-----------|------|
| `400` | `data` is not an array | `{ "error": "Bad Request", "message": "..." }` |
| `500` | Unexpected server error | `{ "error": "Internal Server Error" }` |

#### Health Check

```
GET /   →  { "status": "ok", "message": "BFHL API is running ✔" }
```

---

## 📐 Processing Rules

### Validation

| Input | Result | Reason |
|-------|--------|--------|
| `"A->B"` | ✅ Valid | Correct format |
| `" A->B "` | ✅ Valid | Whitespace trimmed before validation |
| `"A->A"` | ❌ Invalid | Self-loop |
| `"AB->C"` | ❌ Invalid | Multi-character node |
| `"a->b"` | ❌ Invalid | Must be uppercase A–Z |
| `"1->2"` | ❌ Invalid | Not letters |
| `"A-B"` | ❌ Invalid | Wrong separator (no `>`) |
| `"A->"` | ❌ Invalid | Missing child node |
| `""` | ❌ Invalid | Empty string |

### Deduplication

```
Input:  ["A->B", "A->B", "A->B"]
Result: validEdges=["A->B"]  duplicateEdges=["A->B"]   ← added only once
```

### Tree Construction

- **First-parent-wins** — if node `D` already has parent `B`, any later edge `C->D` is silently discarded.
- **Diamond shapes** — resolved by first-parent-wins; no node can have two parents.
- **Multiple trees** — each connected component becomes its own hierarchy entry.
- **Cycle root** — if a component has no root (pure cycle), the **lexicographically smallest** node is used.

### Depth

> Depth = number of nodes on the **longest root-to-leaf path**

```
A → B → C          depth = 3
A → B, A → C → D   depth = 3  (A → C → D)
```

### Summary Tiebreaker

If two trees share the same depth, `largest_tree_root` is set to the **lexicographically smaller** root.

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 14.x |
| npm | ≥ 6.x |

### 1 · Clone

```bash
git clone https://github.com/<your-username>/bfhl-challenge.git
cd bfhl-challenge
```

### 2 · Install & Run the Backend

```bash
cd backend
npm install
npm start          # production
npm run dev        # development with auto-reload (nodemon)
```

API is live at **`http://localhost:3000`**

### 3 · Open the Frontend

Open `frontend/index.html` in any browser.
Set the **API URL** field to `http://localhost:3000`.

### 4 · Test with the Spec Example

```bash
curl -s -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      "A->B","A->C","B->D","C->E","E->F",
      "X->Y","Y->Z","Z->X",
      "P->Q","Q->R",
      "G->H","G->H","G->I",
      "hello","1->2","A->"
    ]
  }' | python -m json.tool
```

Expected `summary`:

```json
{
  "total_trees": 3,
  "total_cycles": 1,
  "largest_tree_root": "A"
}
```

---

## 🚢 Deployment

### Backend → [Render.com](https://render.com) (Free)

1. Push this repo to a **public** GitHub repository
2. Go to **render.com** → New → **Web Service**
3. Connect the repo and set:

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Environment | Node |

4. Click **Deploy** and copy your URL, e.g.  
   `https://bfhl-api-xxxx.onrender.com`

### Frontend → [Netlify](https://netlify.com) (Free)

1. Open `frontend/app.js` and update:

```js
// Line 6 — replace localhost with your Render URL
const DEFAULT_API_URL = 'https://bfhl-api-xxxx.onrender.com';
```

2. Go to **netlify.com** → Add new site → **Deploy manually**
3. Drag-and-drop the entire `frontend/` folder
4. Copy the deployed URL

### GitHub Repository

```bash
git init
git add .
git commit -m "feat: Chitkara BFHL Challenge Round 1"
git remote add origin https://github.com/<username>/bfhl-challenge.git
git push -u origin main
```

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18.x | Server-side JavaScript |
| **Framework** | Express.js 4.x | HTTP routing & middleware |
| **CORS** | `cors` | Cross-origin request support |
| **Logging** | `morgan` | HTTP request logger |
| **Dev Server** | `nodemon` | Auto-restart on file changes |
| **Frontend** | HTML5 + Vanilla CSS + JS | Zero-dependency SPA |
| **Fonts** | Inter + JetBrains Mono | Google Fonts |
| **API Hosting** | Render.com | Free Node.js hosting |
| **UI Hosting** | Netlify | Free static hosting |

---

## 👤 Candidate

| Field | Value |
|-------|-------|
| **Name** | Yuvraj Gupta |
| **Roll Number** | 2310991326 |
| **Email** | yuvraj1326.be23@chitkara.edu.in |
| **User ID** | `yuvrajgupta_21062005` |
| **College** | Chitkara University |

---

<div align="center">

Made with ❤️ for the **Bajaj Finserv × Chitkara** Full Stack Engineering Challenge

</div>
