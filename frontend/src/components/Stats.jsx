import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Stats() {
  const { t } = useApp()
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const stats = t('stats')

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.4 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="stats-section" ref={ref}>
      <div className="container">
        <div className="stats-inner">
          {stats.map(({ icon, value, label }, i) => (
            <div
              className="stat-item"
              key={i}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s ${i * 0.1}s ease, transform 0.6s ${i * 0.1}s ease`,
              }}
            >
              <span className="stat-icon">{icon}</span>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
