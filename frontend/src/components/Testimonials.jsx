import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

const AVATAR_CLASSES = ['ta-1','ta-2','ta-3']

export default function Testimonials() {
  const { t } = useApp()
  const ref = useRef(null)
  const testimonials = t('testimonials')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.15 }
    )
    ref.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="testimonials-section section" ref={ref} id="testimonials">
      <div className="container">
        <div className="testimonials-header reveal">
          <span className="section-label">{t('test_label')}</span>
          <h2 className="section-title">
            {t('test_title1')} <span className="gradient-text-warm">{t('test_title2')}</span>
          </h2>
          <p className="section-subtitle">{t('test_sub')}</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((item, i) => (
            <div className={`testimonial-card reveal reveal-delay-${i + 1}`} key={i}>
              <div className="testimonial-stars">
                {'★'.repeat(item.stars).split('').map((s, j) => <span key={j}>{s}</span>)}
              </div>
              <p className="testimonial-quote">{item.quote}</p>
              <div className="testimonial-author">
                <div className={`testimonial-avatar ${AVATAR_CLASSES[i]}`}>{item.initial}</div>
                <div>
                  <div className="testimonial-name">{item.name}</div>
                  <div className="testimonial-role">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
