# PixelateAI - AI-Powered Mathematical Animation Platform

Transform complex mathematical concepts into beautiful, engaging animations using simple text prompts. No coding or animation experience required.

## 🚀 Complete Architecture

PixelateAI follows this workflow:

1. **User Prompt** → Enter mathematical concept description
2. **LLM (OpenAI GPT)** → Generates optimized Manim Python code
3. **Code Generation** → Creates professional animation scripts
4. **Manim Rendering** → Converts code to video (local/server)
5. **Video Editor** → Edit, add voice-over, overlays
6. **Export/Publish** → Share your educational content

## ✨ Features

- 🤖 **AI-Powered**: Generate animations from natural language descriptions
- 🔐 **Supabase Authentication**: Secure user accounts and project management
- 🎓 **Educational Focus**: Perfect for teachers, students, and content creators
- 📱 **Modern UI**: Beautiful, responsive interface built with Next.js
- 🐍 **Manim Integration**: Professional-quality mathematical visualizations
- 💾 **Code Export**: Download generated Python code for local rendering

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling
- **Supabase Client** - Authentication and database

### Backend
- **FastAPI** - High-performance Python API
- **OpenAI GPT-4** - Code generation
- **Pinecone** - Vector database for knowledge retrieval
- **Manim** - Mathematical animation engine

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- OpenAI API Key
- Supabase Account
- Pinecone Account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/pixelateai.git
cd pixelateai
```

### 2. Frontend Setup
```bash
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PYTHON_BACKEND_URL=http://localhost:5001/simple-generate
```

Start frontend:
```bash
npm run dev
```

### 3. Backend Setup
```bash
cd backend
pip3 install -r requirements-minimal.txt
```

Create environment file:
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual API keys
# OPENAI_API_KEY=your_openai_api_key_here
# (Add other required environment variables)
```

Or set environment variables directly:
```bash
export OPENAI_API_KEY="your_openai_api_key_here"
```

Start backend:
```bash
python3 run.py
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## 📋 Usage Guide

### 1. Create Account
- Visit the landing page
- Click "Sign Up" and create your account
- Verify your email through Supabase

### 2. Generate Animation
- Navigate to "Create" page
- Enter your mathematical concept description
- Example: "Show the Pythagorean theorem with a right triangle and squares on each side"
- Click "Generate Animation"

### 3. Use Generated Code
The system generates professional Manim code that you can:
- **Copy** directly from the interface
- **Download** as a `.py` file
- **Run locally** with Manim installed

### 4. Render Animation Locally
```bash
# Install Manim (if not already installed)
pip install manim

# Render your animation
manim animation.py Scene -qm --preview
```

### 5. Video Output
- Videos are saved in `media/videos/` directory
- Medium quality (720p) MP4 format
- Ready for editing and sharing

## 🔧 API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Animation Generation
- `POST /simple-generate` - Generate Manim code from prompt
  ```json
  {
    "prompt": "Create a visualization of linear transformations",
    "quality": "medium"
  }
  ```

### Health Check
- `GET /health` - Backend status check

## 🎯 Example Prompts

Try these educational prompts:

- **Algebra**: "Visualize solving a quadratic equation step by step"
- **Geometry**: "Show how the area of a circle is derived using π"
- **Calculus**: "Animate the concept of limits approaching infinity"
- **Linear Algebra**: "Demonstrate matrix multiplication visually"
- **Statistics**: "Show the central limit theorem with multiple distributions"

## 🔧 Development

### Project Structure
```
pixelateai/
├── src/                    # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   └── lib/              # Utilities
├── backend/               # FastAPI backend
│   ├── app/              # Backend modules
│   ├── requirements.txt  # Python dependencies
│   └── run.py           # Server startup
├── manim_test.py         # Local testing script
└── sample_animation.py   # Example output
```

### Environment Variables

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
PYTHON_BACKEND_URL=http://localhost:5001/simple-generate
```

**Backend (run.py)**:
```python
os.environ["OPENAI_API_KEY"] = "sk-..."
os.environ["PINECONE_API_KEY"] = "pcsk_..."
os.environ["PINECONE_INDEX_NAME"] = "manim-docs"
```

## 🚧 Known Limitations

1. **Local Rendering Required**: Full video rendering requires local Manim installation
2. **System Dependencies**: Manim needs Cairo, Pango, and FFmpeg
3. **Processing Time**: Complex animations may take time to render
4. **Code Validation**: Generated code may need manual review for complex concepts

## 🛣️ Roadmap

- [ ] **Cloud Rendering**: Server-side video generation
- [ ] **Video Editor**: Built-in editing capabilities
- [ ] **Template Library**: Pre-built animation templates
- [ ] **Collaboration**: Share and remix animations
- [ ] **Voice Generation**: AI-powered narration
- [ ] **Interactive Animations**: Web-based interactive math

## 📚 Learning Resources

- [Manim Documentation](https://docs.manim.community/)
- [Mathematical Animation Techniques](https://3blue1brown.com)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **3Blue1Brown** for inspiring mathematical visualization
- **Manim Community** for the animation engine
- **OpenAI** for powerful language models
- **Supabase** for backend infrastructure

---

**Made with ❤️ for educators and students worldwide** 