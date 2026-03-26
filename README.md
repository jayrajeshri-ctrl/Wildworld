# 🌍 Wild World 3D — Multiplayer Server

## Deploy FREE on Glitch in 5 minutes

### Step 1 — Create Glitch account
Go to **glitch.com** and sign up (free)

### Step 2 — New Project
Click **New Project** → **glitch-hello-node**

### Step 3 — Upload files
In the Glitch editor, delete the existing files and upload:
- `server.js`
- `package.json`
- Create a folder called `public` and put `wildworld_ultimate.html` inside it, renamed to `index.html`

### Step 4 — Get your URL
Glitch gives you a URL like:
```
https://your-project-name.glitch.me
```
That's your server URL! Share it with friends.

### Step 5 — Connect the game
In the game, open the Online panel and enter your Glitch URL.

---

## How Multiplayer Works

1. **One player** clicks "Create Room" → gets a 6-letter code like `ABC123`
2. **Other players** click "Join Room" → enter the code
3. Up to **8 players** per room
4. Everyone sees each other moving in real time
5. **Chat** with other players in-game

---

## Server Features
- Real-time player positions (moves broadcast ~20x per second)
- Player join/leave notifications
- Host transfer if host disconnects
- Auto-cleanup of empty rooms
- Up to 8 players per room
- In-game chat

---

## Free Tier Limits (Glitch)
- 1000 hours/month (basically always on)
- Sleeps after 5 min idle (wakes up in ~30s when someone visits)
- 512MB RAM — plenty for Wild World

## Alternative: Railway.app
1. Go to **railway.app**
2. New Project → Deploy from GitHub
3. Push these files to a GitHub repo
4. Railway auto-deploys and gives you a URL
