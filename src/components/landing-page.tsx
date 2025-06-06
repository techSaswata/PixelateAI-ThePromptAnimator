"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Play, Sparkles, MessageSquare, BarChart3, Video, Zap, BookOpen, Wand2 } from "lucide-react"

export default function LandingPage() {
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">PixelateAI</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection("features-section")}
                className="text-lg font-bold tracking-wide text-white/70 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 transition-all transform hover:scale-105"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("solutions-section")}
                className="text-lg font-bold tracking-wide text-white/70 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 transition-all transform hover:scale-105"
              >
                How it Works
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex relative">
              <input
                type="text"
                placeholder="Search animations..."
                className="w-64 px-3 py-1.5 bg-[#111] border border-[#333] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-white/40"
                style={{ color: '#ffffff' }}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white/40 border border-[#333] rounded px-1.5 py-0.5">
                /
              </kbd>
            </div>
            <Link href="/login" className="text-white/70 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-semibold"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-purple-900/20 via-transparent to-transparent opacity-80" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-blue-900/10 via-transparent to-transparent opacity-80" />
        </div>
        <div className="absolute inset-0">
          <div className="h-full w-full bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200"
            >
              Effortless Animations with PixelateAI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-white/70 mb-8 max-w-3xl mx-auto font-medium tracking-wide"
            >
              <span className="font-sans">
                Create stunning educational animations through simple text prompts. Perfect for teachers, educators, and
                content creators who want to bring mathematical and scientific concepts to life.
              </span>
              <br />
              <motion.span
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
                className="block text-center text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg hover:scale-105 transition-transform duration-300 mt-4"
              >
                - Simplifying Animations with AI
              </motion.span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/create"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-md hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
              >
                Create Animation
                <Sparkles className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="px-6 py-3 bg-[#111] text-white rounded-md hover:bg-[#181818] transition-all border border-[#333] flex items-center justify-center gap-2 text-sm font-semibold"
              >
                Watch Demo
                <Play className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12 mt-8"
          >
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-base font-semibold text-white/60 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 hover:underline transition-all"
            >
              with ❤️ by UniMinds Team
            </motion.h3>
          </motion.div>
          {/* Featured UI Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600/30 to-blue-500/30 rounded-2xl blur" />
            <div className="relative bg-[#111] rounded-xl p-6 shadow-2xl border border-[#222]">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-900/20 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">AI-Powered Animation</h3>
                      <p className="text-white/70">
                        Generate complex mathematical animations using simple text prompts and AI assistance.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-900/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Educational Focus</h3>
                      <p className="text-white/70">
                        Built specifically for educators with pre-built mathematical and scientific animation templates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-[#0a0a0a] rounded-lg p-4 border border-[#222]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="text-xs text-white/50 ml-2">animation-prompt.py</div>
                  </div>
                  <div className="font-mono text-sm text-white/70 space-y-1">
                    <div>
                      <span className="text-purple-400">prompt</span> ={" "}
                      <span className="text-yellow-300">"Create a linear"</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-yellow-300">"transformation animation"</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-yellow-300">"showing matrix multiplication"</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-blue-300">animation</span> ={" "}
                      <span className="text-green-300">generate_manim</span>(
                    </div>
                    <div className="pl-4">
                      <span className="text-green-300">prompt</span>=<span className="text-yellow-300">prompt</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-green-300">style</span>=
                      <span className="text-yellow-300">"educational"</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-green-300">quality</span>=<span className="text-yellow-300">"high"</span>
                    </div>
                    <div>)</div>
                    <div className="mt-2">
                      <span className="text-purple-400">return</span> <span className="text-blue-300">animation</span>.
                      <span className="text-green-300">render</span>()
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#0a0a0a]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-900/10 via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
            >
              Everything educators need for animation
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg text-white/70 max-w-2xl mx-auto"
            >
              Powerful features to help you create engaging educational content without technical barriers.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur" />
                <div className="relative bg-[#111] border border-[#222] rounded-lg p-6 hover:border-purple-500/50 transition-colors h-full">
                  <div className="w-10 h-10 rounded-lg bg-purple-900/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#111] border border-[#222] rounded-lg p-6 text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  {stat.value}
                </div>
                <div className="text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="solutions-section" className="relative py-32">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
            >
              How PixelateAI works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg text-white/70 max-w-2xl mx-auto"
            >
              Create professional animations in minutes with these simple steps
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100" />
                <div className="relative bg-[#111] border border-[#222] rounded-xl p-6 h-full">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center mb-4 text-white font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-white/70 mb-4">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-blue-900/10 via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600/20 to-blue-500/20 rounded-2xl blur" />
            <div className="relative bg-[#111] rounded-xl p-12 shadow-2xl border border-[#222]">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                Ready to revolutionize your educational content?
              </h2>
              <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
                Join thousands of educators already creating engaging animations with PixelateAI.
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-md hover:opacity-90 transition-all text-sm font-semibold"
              >
                Start Creating Animations
                <Sparkles className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 border-[#222]">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#222]">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">PixelateAI</span>
            </div>
            <div className="text-white/50 text-sm">Made with ❤️ by UniMinds Team</div>
            <div className="text-white/50 text-sm">© {new Date().getFullYear()} PixelateAI. </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

const features = [
  {
    title: "Prompt-Based Creation",
    description: "Create complex animations using simple text prompts. No coding knowledge required.",
    icon: MessageSquare,
  },
  {
    title: "Educational Templates",
    description: "Pre-built mathematical and scientific animation templates for quick content creation.",
    icon: BookOpen,
  },
  {
    title: "AI-Powered Scenes",
    description: "Advanced AI understands context and generates accurate visual representations automatically.",
    icon: Sparkles,
  },
  {
    title: "Manim Integration",
    description: "Built on the powerful Manim engine for precise, professional mathematical animations.",
    icon: Zap,
  },
  {
    title: "Video Editor",
    description: "Built-in editor for assembling scenes, adding voiceovers, and integrating text overlays.",
    icon: Video,
  },
  {
    title: "Data Visualization",
    description: "Auto-generate charts and graphs from data prompts with dynamic, interactive elements.",
    icon: BarChart3,
  },
]

const stats = [
  { value: "1K+", label: "Educators" },
  { value: "10K+", label: "Animations Created" },
  { value: "50+", label: "Templates" },
  { value: "99.9%", label: "Uptime" },
]

const steps = [
  {
    title: "Describe Your Animation",
    description: "Simply type what mathematical or scientific concept you want to visualize in plain English.",
  },
  {
    title: "AI Generates Code",
    description: "Our AI understands your prompt and automatically generates optimized Manim animation code.",
  },
  {
    title: "Edit and Export",
    description: "Use our built-in video editor to refine your animation and export it for your lessons.",
  },
]
