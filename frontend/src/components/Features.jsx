import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

const ICON_CLASSES = ['fi-cyan','fi-purple','fi-green','fi-orange','fi-pink','fi-blue']

export default function Features() {
  const { t } = useApp()
  const ref = useRef(null)
  const features = t('features')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.15 }
    )
    ref.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="features-section section" id="features" ref={ref}>
      <div className="container">
        <div className="features-header reveal">
          <span className="section-label">{t('features_label')}</span>
          <h2 className="section-title">
            {t('features_title')} <span className="gradient-text">{t('features_title2')}</span>
          </h2>
          <p className="section-subtitle">{t('features_sub')}</p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div className={`feature-card reveal reveal-delay-${(i % 3) + 1}`} key={i}>
              <div className={`feature-icon ${ICON_CLASSES[i]}`}>{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <span className="feature-tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
