# CollabBridge - Brand Creator Collaboration Platform

AI-powered marketplace connecting brands and creators with smart analytics and seamless collaboration management.

---

## Project Structure

```
brandcreator/
├── backend/          ← Node.js + Express + MongoDB API
│   ├── models/       ← Database schemas (User, Campaign, Application, Message)
│   ├── routes/       ← API endpoints
│   ├── middleware/   ← JWT auth middleware
│   ├── utils/        ← AI analysis logic
│   ├── server.js     ← Main server + Socket.IO
│   └── seed.js       ← Demo data creator
│
└── frontend/         ← Next.js + Tailwind CSS + Redux
    └── src/app/
        ├── page.js              ← Landing page
        ├── auth/                ← Login + Register
        ├── dashboard/           ← Main dashboard + profile + analytics
        ├── campaigns/           ← Browse, create, manage campaigns
        ├── creators/            ← Find creators (brands only)
        ├── messages/            ← Real-time chat
        └── admin/               ← Admin panel
```

---

## SETUP INSTRUCTIONS (Step by Step)

### STEP 1: Install Requirements
You need:
- **Node.js** (v18+): Download from https://nodejs.org
- **MongoDB**: 
  - Option A: Install locally (MongoDB Community Edition) from https://www.mongodb.com/try/download/community
  - Option B: Use a cloud MongoDB database service (MongoDB Atlas)

### STEP 2: Setup Backend

Open terminal/command prompt:

```bash
# Go to backend folder
cd brandcreator/backend

# Install packages
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` file:
```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/brandcreator
JWT_SECRET=change_this_to_any_random_string_like_abc123xyz
CLIENT_URL=http://localhost:3000
```

Replace MONGODB_URI with your MongoDB Atlas connection details.

```bash
# Seed demo data (creates demo accounts)
node seed.js

# Start the backend server
npm run dev
```

You should see:
```
✅ MongoDB Database connected successfully.
🚀 Server running on port 5000
```

### STEP 3: Setup Frontend

Open a NEW terminal window:

```bash
# Go to frontend folder
cd brandcreator/frontend

# Install packages
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:5000" >> .env.local

# Start the frontend
npm run dev
```

### STEP 4: Open the App

Go to: **http://localhost:3000**

---

## Demo Accounts

All seeded demo accounts use the password `MD123456`.

| Role      | Email               | Password |
|-----------|---------------------|----------|
| Brand 1   | brand@demo.com      | MD123456 |
| Brand 2   | nike@demo.com       | MD123456 |
| Brand 3   | zomato@demo.com     | MD123456 |
| Creator 1 | md@demo.com         | MD123456 |
| Creator 2 | krish@demo.com      | MD123456 |
| Creator 3 | tamanna@demo.com    | MD123456 |
| Creator 4 | harshita@demo.com   | MD123456 |
| Creator 5 | manav@demo.com      | MD123456 |
| Admin     | admin@demo.com      | MD123456 |

---

## Features

### For Creators
- Profile setup with social media links
- AI score generation (engagement, fake follower detection)
- Browse and apply to campaigns
- Real-time chat with brands
- Analytics dashboard

### For Brands
- Create campaigns with budget and requirements
- Search creators with advanced filters
- View AI analytics for each creator
- Manage applications (accept/reject/shortlist)
- Real-time chat with creators

### For Admins
- Platform overview stats
- User management (verify, ban, feature, delete)
- Campaign oversight

---

## AI Analysis

The AI system analyzes creators based on:
- **Engagement Rate**: Followers vs interaction ratio
- **Fake Follower Detection**: ML-based authenticity scoring
- **Content Consistency**: Regular posting patterns
- **Audience Location**: Geographic distribution
- **AI Score (0-100)**: Overall creator quality score

---

## API Endpoints

```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login
GET  /api/auth/me           - Get current user

GET  /api/users/creators    - List creators (with filters)
PUT  /api/users/profile     - Update profile
POST /api/users/analyze/:id - Run AI analysis

GET  /api/campaigns         - List active campaigns
POST /api/campaigns         - Create campaign (brands)
GET  /api/campaigns/my      - Brand's campaigns
PUT  /api/campaigns/:id     - Update campaign

POST /api/applications          - Apply to campaign
GET  /api/applications/my       - Creator's applications
GET  /api/applications/campaign/:id - Campaign applications
PUT  /api/applications/:id/status   - Update status

GET  /api/messages/:conversationId  - Get messages
POST /api/messages                  - Send message

GET  /api/analytics/creator - Creator analytics
GET  /api/analytics/brand   - Brand analytics

GET  /api/admin/stats       - Platform stats
GET  /api/admin/users       - All users
PUT  /api/admin/users/:id/ban    - Ban user
PUT  /api/admin/users/:id/verify - Verify user
```

---

## Production Deployment

**Backend** → Deploy on Render.com (free):
1. Push backend to GitHub
2. Create Web Service on Render
3. Set environment variables

**Frontend** → Deploy on Vercel (free):
1. Push frontend to GitHub
2. Import to Vercel
3. Set NEXT_PUBLIC_API_URL to your Render URL

**Database** → MongoDB Atlas

---

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | Next.js 14, Tailwind CSS, Redux Toolkit |
| Backend  | Node.js, Express.js     |
| Database | MongoDB Atlas + Mongoose |
| Realtime | Socket.IO               |
| Auth     | JWT                     |
| Charts   | Recharts                |
| AI       | Custom scoring algorithm|
