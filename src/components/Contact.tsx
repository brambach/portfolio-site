import { ScrollReveal } from "./ScrollReveal";
import { Mail, Linkedin, Github } from "lucide-react";
import { Magnetic } from "./Magnetic";

export function Contact() {
  return (
    <section id="contact" className="relative py-40 md:py-56 overflow-hidden">
      {/* Decorative gradient circle */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-linear-to-br from-blue-500/10 via-purple-500/10 to-emerald-500/5 blur-3xl pointer-events-none"
      />

      {/* Decorative horizontal lines */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent -translate-y-20"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-0 w-full h-px bg-linear-to-r from-transparent via-white/5 to-transparent translate-y-20"
      />

      <div className="relative max-w-5xl mx-auto px-6 md:px-12 text-center">
        <ScrollReveal>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8">
            Let's build something{" "}
            <span className="text-gradient-accent">together</span>.
          </h2>
        </ScrollReveal>

        <ScrollReveal slideFrom={1}>
          <p className="text-xl md:text-2xl font-light text-neutral-400 mb-16 max-w-2xl mx-auto">
            I'm targeting Solutions Engineer roles in the city starting Summer 2026.
            If you have an opportunity or want to chat about integrations, reach
            out.
          </p>
        </ScrollReveal>

        <ScrollReveal slideFrom={1}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Magnetic strength={0.3} radius={60}>
              <a
                href="mailto:bryce.rambach@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] active:scale-[0.98] shadow-lg"
              >
                <Mail className="w-4 h-4" />
                Email Me
              </a>
            </Magnetic>
            <Magnetic strength={0.3} radius={60}>
              <a
                href="https://www.linkedin.com/in/bryce-rambach/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-xl text-neutral-300 rounded-2xl font-medium hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] active:scale-[0.98] border border-white/10"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </Magnetic>
            <Magnetic strength={0.3} radius={60}>
              <a
                href="https://github.com/brambach"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-xl text-neutral-300 rounded-2xl font-medium hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] active:scale-[0.98] border border-white/10"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </Magnetic>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
