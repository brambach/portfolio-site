import { FadeIn } from "./FadeIn";
import { Mail, Linkedin, Github } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="py-24 md:py-32 border-t border-neutral-100">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
        <div className="md:col-span-4">
          <FadeIn>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Contact
            </h3>
          </FadeIn>
        </div>
        <div className="md:col-span-8">
          <FadeIn delay={0.1}>
            <div className="bg-white/25 bg-gradient-to-br from-white/40 to-white/5 backdrop-blur-3xl border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] p-8 md:p-12 transition-all duration-300 hover:-translate-y-1 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_16px_48px_rgba(0,0,0,0.08)]">
              <h2 className="text-3xl md:text-5xl font-medium text-neutral-900 tracking-tight mb-8">
                Let's build something together.
              </h2>
              <p className="text-xl font-light text-neutral-600 mb-12 max-w-2xl">
                I'm currently looking for Solutions Engineer roles in the city starting in Summer 2026. If you have an opportunity or just want to chat about integrations, feel free to reach out.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:bryce.rambach@gmail.com"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-neutral-900/90 backdrop-blur-xl text-white rounded-2xl font-medium hover:bg-neutral-900 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-xl active:scale-[0.98] border border-neutral-800 shadow-lg"
                >
                  <Mail className="w-4 h-4" />
                  Email Me
                </a>
                <a
                  href="https://www.linkedin.com/in/bryce-rambach/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/30 bg-gradient-to-br from-white/40 to-white/5 backdrop-blur-3xl text-neutral-900 rounded-2xl font-medium hover:bg-white/40 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98] border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.05)]"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
                <a
                  href="https://github.com/brambach"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/30 bg-gradient-to-br from-white/40 to-white/5 backdrop-blur-3xl text-neutral-900 rounded-2xl font-medium hover:bg-white/40 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98] border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.05)]"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
