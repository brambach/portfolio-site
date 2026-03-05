export function Footer() {
  return (
    <footer className="py-12 border-t border-white/5 mt-24">
      <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-neutral-600">
          &copy; {new Date().getFullYear()} Bryce Rambach. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-sm font-medium text-neutral-600">
          <a href="https://linkedin.com/in/brycerambach" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          <a href="https://github.com/brycerambach" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
