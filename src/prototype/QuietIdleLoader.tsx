import "./quiet-idle-loader.css";

export function QuietIdleLoader({ ready = false }: { ready?: boolean }) {
  return (
    <div className={`quiet-idle ${ready ? "quiet-idle--ready" : ""}`} aria-hidden={ready} inert={ready}>
      <span className="quiet-idle__name">Bryce Rambach</span>
      <div className="quiet-idle__centre">
        <div className="quiet-idle__car" aria-hidden="true">
          <div className="quiet-idle__exhaust">
            <i /><i /><i /><i /><i />
            <svg viewBox="0 0 100 150" fill="none">
              <path d="M54 4C42 22 62 34 47 54S20 74 37 96S62 127 35 146" />
              <path d="M54 4C66 25 40 38 49 61S72 87 46 108S20 131 30 147" />
              <path d="M54 4C48 28 32 30 39 52S65 83 38 104S16 129 25 146" />
            </svg>
          </div>
          <img src="/images/entrance/porsche-idle.webp" alt="" width="720" height="1080" fetchPriority="high" />
        </div>
        <span className="quiet-idle__label" role="status">
          Loading
        </span>
      </div>
      <a className="quiet-idle__skip" href="/projects">View projects <span aria-hidden="true">↗</span></a>
    </div>
  );
}
