# 🚀 Victory11 Deployment Guide (Monorepo)

Both your Backend and Frontend are in this single GitHub repository. Follow these steps:

## 1. Backend Deployment (Railway)
1.  **Create a Railway account**: [railway.app](https://railway.app).
2.  **New Project**: Click **New Project** -> **Deploy from GitHub repo**.
3.  **Root Directory**: In the deployment settings, set the **Root Directory** to `backend`.
4.  **Add MongoDB**: Click **Add Service** -> **Database** -> **MongoDB`.
5.  **Environment Variables**: In your Backend service (under `backend` folder), add:
    - `MONGODB_URI`: (Auto-provided if you add MongoDB service).
    - `PORT`: `5001`
    - `JWT_SECRET`: `something_random_and_secure`
6.  **Public URL**: Once it's running, click **Generate Domain** in Railway. **Copy this URL**.

---

## 2. Frontend Deployment (Vercel)
1.  **Create a Vercel account**: [vercel.com](https://vercel.com).
2.  **Import Project**: Select the same GitHub repo.
3.  **Root Directory**: Click "Edit" next to the root directory and select **`frontend`**.
4.  **Configure Build Settings**:
    - **Build Command**: `npx expo export -p web`
    - **Output Directory**: `dist`
5.  **Environment Variables**: Add this ONE variable:
    - `EXPO_PUBLIC_API_URL`: Paste your **Railway URL** here (from step 1), ending with `/api`.
      - *Important*: Ensure it starts with `https://` and ends with `/api`.
6.  **Deploy**: Click Deploy! You are now LIVE.

---

## 3. How to use it as a Mobile App
Once your Vercel URL is live:
1.  Open the URL in **Chrome** (Android) or **Safari** (iOS) on your phone.
2.  **Android**: Tap the 3 dots (...) -> **"Install App"** or **"Add to Home Screen"**.
3.  **iOS**: Tap the **Share** button (box with arrow) -> **"Add to Home Screen"**.

Now you have the **Victory11** icon on your phone! 🏆
