import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Rocket, 
  BookOpen, 
  MousePointer2, 
  Code2, 
  Zap,
  ChevronRight,
  Terminal
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060606] text-foreground selection:bg-primary/30 font-sans">
      {/* Navbar */}
      <nav className="w-full z-50 border-b border-white/5 bg-[#060606]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon-trace.png" alt="HaxTrace Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            <span className="font-bold text-2xl tracking-tight text-white">
              Hax<span className="text-[#60a5fa]">Trace</span>
            </span>
          </div>
          <Link href="/editor">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 group shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-all">
              Launch Editor
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-6 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            Vectorized logos for <br />
            <span className="text-primary drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">Haxball Maps</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Build complex vectorized assets without writing code. <br className="hidden md:block" />
            The professional tool for the Haxball community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/editor">
              <Button size="xl" className="h-16 px-12 bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-black rounded-full shadow-[0_0_40px_rgba(var(--primary),0.3)] hover:shadow-[0_0_60px_rgba(var(--primary),0.5)] transition-all hover:scale-105 active:scale-95">
                Start Creating Now
              </Button>
            </Link>
            <a href="https://github.com/haxball/haxball-issues/wiki/Stadium-(.hbs)-File" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="xl" className="h-16 px-10 border-white/10 hover:bg-white/5 text-xl font-bold rounded-full transition-all">
                View Documentation
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-[#080808] to-[#060606]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] hover:border-primary/40 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors" />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <MousePointer2 className="h-8 w-8 text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              </div>
              <h3 className="text-2xl font-black mb-4 text-white">Easy and Simplified</h3>
              <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                Easy and simplified to use for vectorizing anything.
              </p>
            </div>

            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] hover:border-primary/40 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors" />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Terminal className="h-8 w-8 text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              </div>
              <h3 className="text-2xl font-black mb-4 text-white">Draw your Images</h3>
              <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                Draw any logo, image, or icon to complement your Haxball maps.
              </p>
            </div>

            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] hover:border-primary/40 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors" />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Zap className="h-8 w-8 text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              </div>
              <h3 className="text-2xl font-black mb-4 text-white">Instant Deploy</h3>
              <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                Export your segments in one click and use them directly on your Haxball maps. Simple and fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-muted-foreground font-medium">© 2026 mo0negtt. Built for the community.</p>
        </div>
      </footer>
    </div>
  );
}
