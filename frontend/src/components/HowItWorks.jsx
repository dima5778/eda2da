import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

const NUM_CLASSES = ['sn-1','sn-2','sn-3']

export default function HowItWorks() {
  const { t } = useApp()
  const ref = useRef(null)
  const steps = t('steps')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.2 }
    )
    ref.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="howitworks-section section" id="how-it-works" ref={ref}>
      <div className="container">
        <div className="howitworks-header reveal">
          <span className="section-label">{t('how_label')}</span>
          <h2 className="section-title">
            {t('how_title1')} <span className="gradient-text">{t('how_title2')}</span>
          </h2>
          <p className="section-subtitle">{t('how_sub')}</p>
        </div>

        <div className="steps-grid">
          {steps.map((step, i) => (
            <div className={`step-card reveal reveal-delay-${i + 1}`} key={i}>
              <div className={`step-number ${NUM_CLASSES[i]}`}>{step.number}</div>
              <span className="step-emoji">{step.emoji}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
