import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Magnetic } from "./Magnetic";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between">
        <Magnetic strength={0.3} radius={40}>
          <a href="#" className="text-lg font-semibold tracking-tight text-white">
            BR.
          </a>
        </Magnetic>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-500">
          {['About', 'Skills', 'Work', 'Portfolio', 'Contact'].map((item) => (
            <div key={item}>
              <Magnetic strength={0.4} radius={40}>
                <a
                  href={`#${item.toLowerCase()}`}
                  className="hover:text-white transition-colors relative group py-1"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-white transition-all duration-200 ease-in-out group-hover:w-full rounded-full"></span>
                </a>
              </Magnetic>
            </div>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}
