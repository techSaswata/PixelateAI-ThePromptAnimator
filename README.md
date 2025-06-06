# PixelateAI - AI-Powered Mathematical Animation Platform

Transform complex mathematical concepts into beautiful, engaging animations using simple text prompts. No coding or animation experience required.

## 🏗️ System Architecture

PixelateAI is built with a modern, scalable architecture that leverages cutting-edge AI and cloud technologies:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js UI   │────│   Supabase Auth  │────│  FastAPI Server │
│   (Frontend)    │    │   & Database     │    │   (Backend)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Video Editor   │    │ Supabase Storage │    │   OpenAI GPT    │
│   & Timeline    │    │   (Video Bucket) │    │ (Code Generator)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Manim Engine  │    │   Pinecone DB    │    │   Video Embed   │
│ (Python Render) │    │ (Vector Storage) │    │   Processing    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Complete Tech Stack

### 🎨 Frontend Layer
- **Next.js 14** - React framework with App Router and TypeScript
- **Tailwind CSS** - Modern utility-first styling framework
- **React Context** - State management for authentication and app state
- **Supabase Client** - Real-time database and authentication integration

### 🔐 Authentication & Database
- **Supabase Auth** - Secure user authentication with email/password and social logins
- **Supabase Database** - PostgreSQL database for user data, projects, and metadata
- **Row Level Security** - Database-level security policies for data protection

### 🤖 AI & Code Generation
- **OpenAI GPT-4** - Advanced language model for generating optimized Manim Python code
- **Custom Prompts** - Specialized prompt engineering for mathematical animation generation
- **Code Validation** - Automated syntax checking and optimization of generated code

### ⚡ Backend Services
- **FastAPI** - High-performance Python web framework for API endpoints
- **Python Manim Library** - Mathematical animation engine for rendering videos
- **Async Processing** - Non-blocking video generation and processing
- **RESTful APIs** - Clean, documented API endpoints for frontend integration

### 📹 Video Processing & Storage
- **Supabase Storage Bucket** - Scalable cloud storage for video files and thumbnails
- **Video Embedding** - Advanced video processing and metadata extraction
- **CDN Integration** - Fast global video delivery through Supabase CDN
- **Format Optimization** - Automatic video compression and format conversion

### 🔍 Vector Database & Search
- **Pinecone** - Vector database for storing video hashes and embeddings
- **Semantic Search** - AI-powered search through animation library
- **Duplicate Detection** - Hash-based duplicate video detection and deduplication
- **Content Indexing** - Automatic indexing of video content for fast retrieval

### 🎬 Video Editor Features
- **Timeline Editor** - Drag-and-drop video editing interface
- **Voice Recording** - Built-in voice-over recording and audio processing
- **Text Overlays** - Dynamic text overlay system with positioning and timing
- **Auto-Save** - Automatic project saving every 5 seconds
- **Video Splitting** - Precise video cutting and trimming tools
- **Clip Management** - Advanced clip selection, deletion, and organization

## 🚀 Data Flow Architecture

### 1. **User Authentication Flow**
```
User Input → Supabase Auth → JWT Token → Protected Routes → Dashboard
```

### 2. **Animation Generation Pipeline**
```
Text Prompt → OpenAI GPT-4 → Manim Code → FastAPI → Python Execution → Video File
```

### 3. **Video Storage & Retrieval**
```
Generated Video → Supabase Bucket → CDN → Video URL → Frontend Display
```

### 4. **Vector Search & Indexing**
```
Video Content → Embedding Generation → Pinecone Storage → Semantic Search → Results
```

### 5. **Editor Workflow**
```
Video Upload → Timeline Addition → Audio Recording → Text Overlays → Export
```

## 🔧 Core Technologies Deep Dive

### **Supabase Integration**
- **Authentication**: Email/password, magic links, and OAuth providers
- **Database**: Real-time PostgreSQL with automatic API generation
- **Storage**: Scalable file storage with automatic CDN distribution
- **Real-time**: Live updates for collaborative editing features

### **OpenAI API Integration**
- **Model**: GPT-4 for superior code generation quality
- **Prompt Engineering**: Specialized prompts for mathematical concepts
- **Token Optimization**: Efficient API usage with response caching
- **Error Handling**: Robust fallback mechanisms for API failures

### **FastAPI Backend**
- **Async Operations**: Non-blocking video processing and generation
- **Dependency Injection**: Clean, testable code architecture
- **Automatic Documentation**: OpenAPI/Swagger integration
- **CORS Configuration**: Secure cross-origin resource sharing

### **Manim Engine**
- **Python Integration**: Direct Python library execution
- **Quality Control**: Multiple rendering quality options
- **Format Support**: MP4, GIF, and PNG sequence output
- **Performance Optimization**: Efficient rendering pipeline

### **Pinecone Vector Database**
- **High-Dimensional Vectors**: Store complex video embeddings
- **Fast Similarity Search**: Sub-second search across millions of vectors
- **Metadata Filtering**: Advanced filtering by video properties
- **Scalable Infrastructure**: Auto-scaling based on usage

## 🚀 Complete Architecture

PixelateAI follows this comprehensive workflow:

1. **User Authentication** → Secure login via Supabase Auth
2. **Prompt Input** → User describes mathematical concept
3. **AI Code Generation** → OpenAI GPT-4 generates optimized Manim code
4. **Video Rendering** → FastAPI executes Python Manim library
5. **Storage & CDN** → Videos stored in Supabase bucket with CDN delivery
6. **Vector Indexing** → Video hashes and embeddings stored in Pinecone
7. **Video Editor** → Advanced editing with timeline, audio, and overlays
8. **Export & Share** → Final video export and sharing capabilities

## ✨ Features

- 🤖 **AI-Powered**: Generate animations from natural language descriptions
- 🔐 **Supabase Authentication**: Secure user accounts and project management
- 🎓 **Educational Focus**: Perfect for teachers, students, and content creators
- 📱 **Modern UI**: Beautiful, responsive interface built with Next.js
- 🐍 **Manim Integration**: Professional-quality mathematical visualizations
- 💾 **Code Export**: Download generated Python code for local rendering
- 🎬 **Video Editor**: Advanced timeline editor with voice recording and text overlays
- 🔍 **Smart Search**: AI-powered video search and duplicate detection
- ☁️ **Cloud Storage**: Scalable video storage with global CDN delivery

## 🛠️ Quick Tech Overview

### Frontend
- **Next.js 14** with TypeScript and Tailwind CSS
- **Supabase Client** for authentication and real-time features

### Backend  
- **FastAPI** with Python for high-performance API
- **OpenAI GPT-4** for intelligent code generation
- **Manim** for mathematical animation rendering

### Infrastructure
- **Supabase** for auth, database, and file storage
- **Pinecone** for vector search and video indexing
- **CDN** for fast global video delivery

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

Try these educational prompts with our comprehensive example library:

### 🔢 **Sorting Algorithms**
- **Bubble Sort**: "Explain bubble sort algorithm step by step"
- **Merge Sort**: "Show merge sort using divide and conquer approach"

### 🔗 **Data Structures**
- **Linked List**: "Explain traversal in linkedlist"
- **Binary Trees**: "Demonstrate level order traversal in binary tree"

### 📊 **Graph Algorithms**
- **Dijkstra's Algorithm**: "Explain Dijkstra's algorithm for shortest path"
- **Graph Traversal**: "Show breadth-first search visualization"

### 📐 **Mathematical Theorems**
- **Pythagorean Theorem**: "Prove the Pythagorean theorem with visual demonstration"
- **Geometric Proofs**: "Show how a² + b² = c² using squares on triangle sides"

### 🧮 **Advanced Topics**
- **Algebra**: "Visualize solving a quadratic equation step by step"
- **Geometry**: "Show how the area of a circle is derived using π"
- **Calculus**: "Animate the concept of limits approaching infinity"
- **Linear Algebra**: "Demonstrate matrix multiplication visually"
- **Statistics**: "Show the central limit theorem with multiple distributions"

### 💡 **Pro Tips for Better Results**
- Use specific algorithm names for exact matches (e.g., "Dijkstra's Algorithm")
- Include "step by step" for detailed explanations
- Mention "visualize" or "explain" for educational content
- Reference specific mathematical concepts for theorem proofs

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
│   ├── shot_promting/    # Example-based generation
│   │   └── examples/     # Algorithm examples
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