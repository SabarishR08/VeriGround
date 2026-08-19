# 🚀 Deploying VeriGround to Vercel

This guide provides step-by-step instructions for deploying **VeriGround** to **Vercel**.

---

## ⚡ Option 1: Quick Deployment via Vercel Dashboard (Recommended)

1. **Push Code to GitHub**:
   Ensure your repository is pushed to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push origin main
   ```

2. **Import Project into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Import your **VeriGround** GitHub repository.

3. **Configure Project Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Click Deploy**:
   - Vercel will build and host your production frontend application in under 1 minute.
   - Your live site will be accessible at `https://veriground.vercel.app`!

---

## ⚡ Option 2: Deploying via Vercel CLI

If you have Vercel CLI installed:

```bash
cd frontend
npx vercel
```

Follow the prompts:
- **Set up and deploy?**: `y`
- **Which scope?**: Select your Vercel account
- **Link to existing project?**: `n`
- **Project Name**: `veriground`
- **In which directory is your code located?**: `./`
- **Want to modify build settings?**: `n`

Your deployment URL will be printed directly in the terminal!

---

## 🔌 Connecting to Backend API

VeriGround includes a **100% Client Execution Fallback Engine**, meaning the app runs completely standalone on Vercel out-of-the-box!

If you also deploy the Python Flask backend (e.g. on Render, Railway, or AWS):
1. Go to your Vercel Project Settings $\rightarrow$ **Environment Variables**.
2. Add variable:
   - **Key**: `VITE_API_BASE`
   - **Value**: `https://your-backend-url.onrender.com/api`
3. Re-deploy your project on Vercel.
