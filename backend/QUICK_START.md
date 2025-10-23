# PixelateAI Backend - Quick Start Guide 🚀

## Start the Backend Server

```bash
cd /Users/techsaswata/Downloads/PixelateAI/backend
source venv/bin/activate
python run.py
```

Server will start at: **http://localhost:5001**

---

## Verify It's Running

```bash
# Health check
curl http://localhost:5001/api/health

# Expected: {"status":"ok","message":"Backend is running!"}
```

---

## Test Video Generation

```bash
curl -X POST http://localhost:5001/api/simple-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show a blue circle moving from left to right", "quality": "l"}'
```

---

## View Server Logs

The server will show logs in the terminal where you ran `python run.py`

---

## Stop the Server

Press `Ctrl+C` in the terminal running the server

---

## What Was Fixed?

1. ✅ Created `.env` file with proper configuration
2. ✅ Installed all Python dependencies in virtual environment
3. ✅ Fixed missing `COHERE_API_KEY` configuration
4. ✅ Made TinyTeX paths cross-platform compatible
5. ✅ Updated Manim to Python 3.13 compatible version

---

## Need Help?

- See `BACKEND_FIXES.md` for detailed issue analysis
- Check environment variables in `.env` file
- Verify OpenAI API key is set correctly
- Check logs for error messages

---

**Status: 🟢 Backend is Running Successfully!**

