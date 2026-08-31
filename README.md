# 🌾 KrishiMitra

> Smart Farm Decision Support System
-----Deployment url -----
https://krishimitra2026.vercel.app/

-----farmer -----
"email": "shubhamuprade0@gmail.com",
"password": "Sonu@321"

---

### 🌐 Deployment URL
https://krishimitra2026.vercel.app/

---

### 🔑 Demo Credentials

**Admin:**
- Email: `adminnik@gmail.com`
- Password: `Admin@123`

**Farmer:**
- Email: `shubhamuprade0@gmail.com`
- Password: `Sonu@321`

---

KrishiMitra is a full-stack agriculture platform that helps farmers make better decisions using weather intelligence, irrigation guidance, crop health monitoring, market price insights, and personalized farm management.

The goal is to reduce farming risks by providing data-driven recommendations through a simple and accessible dashboard.

---

# 📌 Problem Statement

Farmers often make critical decisions such as:

- Which crop to grow
- When to irrigate
- How weather may impact crops
- Whether a crop disease requires action
- When to sell produce for better prices

Most of these decisions are based on experience and guesswork rather than real-time data.

KrishiMitra solves this problem by combining farm information, weather forecasts, crop monitoring, and market insights into a single platform.

---

# 🚀 Solution

KrishiMitra provides:

- Secure farmer authentication
- Farm profile management
- Weather-based irrigation recommendations
- Weather risk alerts
- Crop health monitoring using AI
- Market price trend analysis
- Voice-enabled assistance
- Unified decision dashboard

---

# 📊 Today's Decision Summary

Example dashboard output:

text
⚠️ Rain Expected Tomorrow

💧 Do Not Irrigate Today

🌾 Soybean Prices Rising

🦠 No Disease Risk Detected

📈 Farm Health Score: 89/100


This allows farmers to instantly understand what action is needed today.

---

# ✨ Core Features

## 🔐 Authentication & Security

- JWT Authentication
- Refresh Token System
- Password Hashing using bcrypt
- Protected Routes
- Role-Based Access Control
- Rate Limiting
- Helmet Security
- Environment Variable Protection

---

## 👨‍🌾 Farmer Dashboard

- Personalized Dashboard
- Farm Overview
- Weather Insights
- Crop Health Status
- Market Price Updates
- Action Alerts

---

## 🌱 Farm Management

- Create Farm Profile
- Update Farm Profile
- Delete Farm Profile
- View Farm Details
- Multiple Farm Support
- Location-Based Personalization

---

## 🌦️ Weather Intelligence

- Real-Time Weather Data
- Rain Forecast
- Temperature Monitoring
- Weather Alerts
- Extreme Heat Warnings
- Irrigation Guidance

Examples:

text
Rain expected in next 48 hours.
No irrigation needed today.


---

## 💧 Irrigation Recommendation Engine

- Smart Irrigation Suggestions
- Rain-Based Recommendations
- Water Saving Guidance
- Weather-Aware Irrigation Planning

---

## 🦠 Crop Health Monitoring

- Crop Image Upload
- Leaf Analysis
- Disease Detection
- Pest Detection
- AI-Based Recommendations
- Farmer Guidance

Powered by:

- Gemini Vision API

---

## 📈 Market Price Insights

- Crop Price Monitoring
- Market Trends
- Price Comparison
- Selling Recommendations

Examples:

text
Soybean prices increased by 8% this week.

Recommended:
Wait 3-5 days before selling.


---

## 🎤 Voice Assistant

Supported Languages:

- English
- Hindi
- Marathi

Features:

- Voice Guidance
- Voice Commands
- Audio Recommendations

---

## 👨‍💼 Admin Dashboard

- User Management
- Farm Monitoring
- Analytics Overview
- System Health Monitoring
- Content Management

---

# 🏗️ System Architecture

text
Farmer
   │
   ▼
React Frontend
   │
   ▼
Node.js + Express Backend
   │
   ▼
MongoDB Atlas
   │
   ├── Weather API
   ├── Gemini Vision API
   └── Market Price API


---

# 🛠️ Tech Stack

## Frontend

- React.js
- Tailwind CSS
- Axios
- React Router DOM

## Backend

- Node.js
- Express.js
- JWT Authentication
- Multer
- Cloudinary

## Database

- MongoDB Atlas
- Mongoose

## Deployment

### Frontend

- Vercel

### Backend

- Render

### Database

- MongoDB Atlas

---

# 🔗 Third Party APIs

## 🌦️ Open-Meteo API

Used For:

- Weather Forecast
- Rain Prediction
- Temperature Monitoring
- Weather Alerts

---

## 🤖 Gemini Vision API

Used For:

- Crop Disease Detection
- Leaf Analysis
- Pest Identification

---

## 📈 Market Price API

Used For:

- Crop Price Trends
- Market Insights
- Selling Recommendations

---

# 📂 Project Structure

text
KrishiMitra/
│
├── client/
│
├── server/
│
├── docs/
│   ├── FEATURES.md
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── SYSTEM_ARCHITECTURE.md
│   └── FUTURE_SCOPE.md
│
├── architecture-diagram.png
├── presentation.pptx
├── README.md
└── .gitignore


---

# ⚙️ Installation

## Clone Repository

bash
git clone <repository-url>


## Frontend Setup

bash
cd client

npm install

npm run dev


## Backend Setup

bash
cd server

npm install

npm run dev


---

# 🔑 Environment Variables

Create a .env file inside the server directory.

env
PORT=

MONGODB_URI=

JWT_SECRET=
JWT_REFRESH_SECRET=

GEMINI_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=


Do not commit actual secret keys to GitHub.

---

# 📖 Documentation

Additional documentation can be found inside the docs folder:

- FEATURES.md
- API_DOCUMENTATION.md
- DATABASE_SCHEMA.md
- SYSTEM_ARCHITECTURE.md
- FUTURE_SCOPE.md

---

# 👥 Team Members

- Sanjay Sende --- Team Leader
- Shubham Uprade --Frontend Developer
- Atul Baghel    --Frontend Developer
- Nikhil Waghade --Backend Developer

---

# 🔮 Future Scope

- Yield Prediction
- Smart Fertilizer Recommendation
- Community Disease Alerts
- Offline Support
- IoT Sensor Integration
- Drone-Based Monitoring
- Satellite Crop Analysis
- Regional Language Expansion

---

# 🌍 Impact

KrishiMitra empowers farmers with real-time insights and practical recommendations, helping them:

- Reduce farming risks
- Save water
- Detect diseases early
- Improve crop productivity
- Make better selling decisions
- Increase profitability

---

# 🏆 HackInMotion 2026

Built for the Agriculture & Farming Theme.

Smart decisions today.
Better harvest tomorrow.
