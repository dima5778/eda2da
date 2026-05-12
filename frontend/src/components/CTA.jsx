import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function CTA() {
  const navigate = useNavigate()
  const { t } = useApp()

  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-inner">
          <div className="cta-grid-overlay" />
          <div className="cta-content">
            <h2 className="cta-title">
              {t('cta_title1')} <span className="gradient-text">{t('cta_title2')}</span>
            </h2>
            <p className="cta-subtitle">{t('cta_sub')}</p>
            <div className="cta-actions">
              <button className="btn btn-primary" onClick={() => navigate('/register')}>
                {t('cta_btn1')} <span className="btn-arrow">→</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/register')}>
                {t('cta_btn2')}
              </button>
            </div>
            <p className="cta-note">
              {t('cta_note').map((note, i) => <span key={i}>{note}</span>)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
