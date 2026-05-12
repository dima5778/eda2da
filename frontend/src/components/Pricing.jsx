import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const CHECK_CLASSES = ['fc-green','fc-cyan','fc-purple']
const BTN_CLASSES   = ['btn-secondary','btn-primary','btn-secondary']

export default function Pricing() {
  const { t } = useApp()
  const navigate = useNavigate()
  const ref = useRef(null)
  const plans = t('plans')

  const handleCta = (i) => {
    if (i === 0) {
      navigate('/register')
    } else if (i === 1) {
      navigate('/register?plan=pro')
    } else {
      window.location.href = 'mailto:sales@eda2da.com'
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    ref.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="pricing-section section" id="pricing" ref={ref}>
      <div className="container">
        <div className="pricing-header reveal">
          <span className="section-label">{t('pricing_label')}</span>
          <h2 className="section-title">
            {t('pricing_title1')} <span className="gradient-text">{t('pricing_title2')}</span>
          </h2>
          <p className="section-subtitle">{t('pricing_sub')}</p>
        </div>

        <div className="pricing-grid reveal reveal-delay-1">
          {plans.map((plan, i) => {
            const featured = i === 1
            return (
              <div className={`pricing-card${featured ? ' featured' : ''}`} key={i}>
                {featured && <div className="pricing-popular">{t('pricing_popular')}</div>}
                <div className="pricing-plan-name">{plan.name}</div>
                <div className="pricing-price">
                  <span className="pricing-currency">$</span>
                  <span className="pricing-amount">{plan.price}</span>
                  <span className="pricing-period">{t('pricing_per_mo')}</span>
                </div>
                <p className="pricing-desc">{plan.desc}</p>
                <div className="pricing-divider" />
                <ul className="pricing-features">
                  {plan.features.map((f, j) => (
                    <li className="pricing-feature" key={j}>
                      <span className={`pricing-feature-check ${CHECK_CLASSES[i]}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`btn ${BTN_CLASSES[i]} pricing-cta`} onClick={() => handleCta(i)}>
                  {plan.cta}
                  {featured && <span className="btn-arrow">→</span>}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
