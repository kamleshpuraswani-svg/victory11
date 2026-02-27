# 🚀 Victory11 Deployment Guide

Follow these steps to take your app from your computer to the world!

## 1. Backend Deployment (Railway)
Railway will host your database (MongoDB) and your Node.js server.

1.  **Create a Railway account**: Go to [railway.app](https://railway.app).
2.  **Upload to GitHub**: Create a new GitHub repository and upload the `backend` folder contents there.
3.  **New Project**: In Railway, click **New Project** -> **Deploy from GitHub repo**.
4.  **Add MongoDB**: Click **Add Service** -> **Database** -> **MongoDB**.
5.  **Set Environment Variables**: In your Backend service settings, add these variables:
    - `MONGODB_URI`: (Railway will auto-provide this if you add the MongoDB service).
    - `PORT`: `5001` (or leave empty, Railway provides one).
    - `JWT_SECRET`: `your_random_secret_here`
6.  **Get your URL**: Once deployed, Railway will give you a URL like `https://victory11-production.up.railway.app`. **Copy this!**

---

## 2. Frontend Deployment (Vercel)
Vercel will host your website/app so anyone can access it via a URL.

1.  **Create a Vercel account**: Go to [vercel.com](https://vercel.com).
2.  **Upload to GitHub**: Upload your `frontend` folder contents to a GitHub repository.
3.  **Import Project**: In Vercel, click **Add New** -> **Project** and select your frontend repo.
4.  **Configure Build Settings**:
    - **Framework Preset**: Other
    - **Build Command**: `npx expo export -p web`
    - **Output Directory**: `dist`
5.  **Set Environment Variables**: This is the most important part! Add this variable:
    - `EXPO_PUBLIC_API_URL`: Paste your **Railway URL** here (the one you copied in step 1), ending with `/api`. 
      - *Example*: `https://victory11-production.up.railway.app/api`
6.  **Deploy**: Click Deploy! You'll get a URL like `victory11.vercel.app`.

---

## 3. How to use it as a Mobile App
Once your Vercel URL is live:
1.  Open the URL in **Chrome** (Android) or **Safari** (iOS) on your phone.
2.  **Android**: Tap the 3 dots (...) -> **"Install App"** or **"Add to Home Screen"**.
3.  **iOS**: Tap the **Share** button (box with arrow) -> **"Add to Home Screen"**.

Now you have the **Victory11** icon on your phone! 🏆
