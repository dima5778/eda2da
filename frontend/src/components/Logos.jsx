const LOGOS = ['TechCrunch', 'Product Hunt', 'Forbes', 'YCombinator', 'The Verge', 'Wired']

export default function Logos() {
  return (
    <section className="logos-section">
      <div className="container">
        <p className="logos-label">As seen in</p>
        <div className="logos-grid">
          {LOGOS.map((name) => (
            <span key={name} className="logo-item">{name}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
