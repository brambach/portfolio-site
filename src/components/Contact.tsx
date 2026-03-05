import { ScrollReveal } from "./ScrollReveal";
import { ArrowUpRight } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="relative py-32 md:py-40">
      <div className="relative max-w-5xl mx-auto px-6 md:px-12 text-center">
        <ScrollReveal>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-display text-white tracking-tight mb-8">
            Let's connect.
          </h2>
        </ScrollReveal>

        <ScrollReveal slideFrom={1}>
          <p className="text-xl md:text-2xl font-light text-neutral-400 mb-16 max-w-2xl mx-auto">
            Targeting Solutions Engineer roles in the city, Summer 2026. Got an
            opportunity? Want to nerd out about integrations? I'm all ears.
          </p>
        </ScrollReveal>

        <ScrollReveal slideFrom={1}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
            <a
              href="mailto:bryce.rambach@gmail.com"
              className="group inline-flex items-center gap-2 text-white font-medium transition-colors"
            >
              <span className="relative">
                Email
                <span className="absolute -bottom-1 left-0 w-full h-px bg-white/30 group-hover:bg-white transition-colors duration-200" />
              </span>
              <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <a
              href="https://www.linkedin.com/in/bryce-rambach/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-neutral-400 hover:text-white font-medium transition-colors"
            >
              <span className="relative">
                LinkedIn
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-200" />
              </span>
              <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <a
              href="https://github.com/brambach"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-neutral-400 hover:text-white font-medium transition-colors"
            >
              <span className="relative">
                GitHub
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-200" />
              </span>
              <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
