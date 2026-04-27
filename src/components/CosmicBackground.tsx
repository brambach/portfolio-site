export function CosmicBackground() {
  return (
    <div className="cosmic-bg fixed inset-0 -z-0 pointer-events-none" aria-hidden="true">
      <div className="cosmic-bloom absolute inset-0" />
      <div className="cosmic-grid absolute inset-0" />
      <div className="cosmic-noise absolute inset-0" />
    </div>
  );
}
