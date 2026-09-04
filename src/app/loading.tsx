export default function Loading() {
  return (
    <main className="nsx-loading" aria-busy="true" aria-live="polite">
      <span className="loading-status">Loading UtiliTech…</span>
      <header>
        <span className="loading-brand">U</span>
        <span className="loading-pill" />
      </header>
      <section>
        <div>
          <span className="loading-line loading-line-short" />
          <span className="loading-title" />
          <span className="loading-title loading-title-small" />
          <span className="loading-line" />
          <span className="loading-line loading-line-medium" />
        </div>
        <span className="loading-panel" />
      </section>
    </main>
  );
}
