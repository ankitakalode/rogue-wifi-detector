# SentinelAP — Rogue WiFi Detector

A cybersecurity project that detects fake ("rogue") WiFi access points in public places like airports, cafes, and malls — before users connect to them.

## The problem

Attackers often set up a fake WiFi network with the same name as a trusted one (e.g. "Airport_Free_WiFi") to intercept user traffic. Most people can't tell the difference just by looking at the network name.

## What this does

- Scans nearby WiFi networks
- Flags networks that show signs of being fake (duplicate SSIDs, open encryption, suspicious signal patterns)
- Shows real-time alerts and a history dashboard

## Tech stack

- **Backend:** Node.js, Express, MongoDB
- **Frontend:** React (Vite), React Router
- **ML model (in progress):** Python, scikit-learn
- **Scanning agent (in progress):** Python

## Project structure

Rogue-WiFi-Project/
├── Backend/ → Express API + MongoDB
├── Frontend/ → React website (landing page, dashboard)


## How to run locally

**Backend:**

cd Backend
npm install
node server.js


**Frontend:**

cd Frontend/React
npm install
npm run dev


## Current status

- ✅ Backend API (save + fetch scan results)
- ✅ React dashboard with live data
- ✅ Landing page with real-time alert popup
- 🔲 Python WiFi scanning agent (in progress)
- 🔲 ML model integration (in progress)
- 🔲 Cloud deployment (planned)

## Team

- [Ankita Kalode] — Backend + database
- [Ankita Kalode] — Frontend + dashboard
- [Shoib Sayyad] — WiFi scanning agent
- [Saloni Funne] — ML model
- [Shoib Sayyad] — Deployment