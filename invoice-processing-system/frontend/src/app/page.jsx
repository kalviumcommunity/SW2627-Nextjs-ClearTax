import ScrollAnimation from "../components/landing/ScrollAnimation";

export default function Home() {
  return (
    <main className="landing-page">
      {/* Fullscreen Scroll Storyteller (combines background animation & text card fading) */}
      <ScrollAnimation />

      {/* Centered cards that scroll into view afterwards */}
      <div className="landing-content-wrapper">
        <section className="foundation-grid" aria-label="Foundation overview">
          <article className="foundation-card hover:scale-[1.02] transition-transform duration-300">
            <span>Layout</span>
            <h2>Shared shell</h2>
            <p>Common surfaces, spacing, and action styles now connect the screens.</p>
          </article>

          <article className="foundation-card hover:scale-[1.02] transition-transform duration-300">
            <span>Page</span>
            <h2>Landing Page</h2>
            <p>The home page now routes cleanly into the operational dashboard and upload flow.</p>
          </article>

          <article className="foundation-card hover:scale-[1.02] transition-transform duration-300">
            <span>Styles</span>
            <h2>Global design tokens</h2>
            <p>Colors, spacing, typography, buttons, metrics, and panels are aligned.</p>
          </article>
        </section>
      </div>
    </main>
  );
}


