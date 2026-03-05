import { ScrollReveal, Parallax } from "./ScrollReveal";
import { Mail, Linkedin, Github } from "lucide-react";
import { Magnetic } from "./Magnetic";
import { TextScramble } from "./TextScramble";

export function Contact() {
  return (
    <section id="contact" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
        <div className="md:col-span-4">
          <Parallax offset={-30}>
            <ScrollReveal>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
                <TextScramble text="Contact" />
              </h3>
            </ScrollReveal>
          </Parallax>
        </div>
        <div className="md:col-span-8">
          <ScrollReveal slideFrom={1}>
            <div className="bg-white/3 backdrop-blur-xl border border-white/6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-4xl p-8 md:p-12 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-8">
                Let's build something together.
              </h2>
              <p className="text-xl font-light text-neutral-400 mb-12 max-w-2xl">
                I'm currently looking for Solutions Engineer roles in the city starting in Summer 2026. If you have an opportunity or just want to chat about integrations, feel free to reach out.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Magnetic strength={0.3} radius={60}>
                  <a
                    href="mailto:bryce.rambach@gmail.com"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-[#0A0A0B] rounded-2xl font-medium hover:bg-neutral-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(255,255,255,0.1)] active:scale-[0.98] shadow-lg"
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
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/5 backdrop-blur-xl text-neutral-300 rounded-2xl font-medium hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] active:scale-[0.98] border border-white/10"
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
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/5 backdrop-blur-xl text-neutral-300 rounded-2xl font-medium hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] active:scale-[0.98] border border-white/10"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                </Magnetic>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
