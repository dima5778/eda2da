import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Hero() {
  const navigate = useNavigate()
  const { t } = useApp()

  const days = t('days')
  const shopItems = t('shop_items')
  const macros = t('hero_macros')
  const dayFills = [85, 70, 90, 60, 75]
  const dayEmojis = ['🥗','🍝','🥩','🫕','🐟']

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
        <div className="hero-grid" />
      </div>

      <div className="container">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge animate-fade-up">
              <div className="badge">
                <span className="badge-dot" />
                {t('hero_badge')}
              </div>
            </div>

            <h1 className="hero-title animate-fade-up-delay-1">
              {t('hero_title1')}
              <span className="line-2">
                <span className="gradient-text">{t('hero_title2')}</span>
              </span>
            </h1>

            <p className="hero-subtitle animate-fade-up-delay-2">
              {t('hero_sub')}
            </p>

            <div className="hero-cta animate-fade-up-delay-3">
              <button className="btn btn-primary" onClick={() => navigate('/register')}>
                {t('hero_cta1')} <span className="btn-arrow">→</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/register')}>
                {t('hero_cta2')}
              </button>
            </div>

            <div className="hero-social-proof animate-fade-up-delay-4">
              <div className="avatar-stack">
                {['A','M','K','J','S'].map((initial, i) => (
                  <div className="avatar-item" key={i}>{initial}</div>
                ))}
              </div>
              <div>
                <p className="proof-text"><strong>10,000+</strong> {t('hero_proof').replace('10,000+','').replace('10 000+','').trim()}</p>
                <div className="proof-stars">
                  {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                  <span style={{ marginLeft: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>4.9/5</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-mockup-bg" />

            <div className="floating-card fc-recipe">
              <div className="fc-recipe-img">🥗</div>
              <div className="fc-recipe-name">{t('hero_recipe_name')}</div>
              <div className="fc-recipe-meta">
                <span>⏱ {t('hero_recipe_time')}</span>
                <span>👥 {t('hero_recipe_srv')}</span>
              </div>
              <div className="fc-recipe-footer">
                <span className="fc-difficulty">{t('hero_recipe_diff')}</span>
                <span className="fc-calories">320 kcal</span>
              </div>
            </div>

            <div className="floating-card fc-mealplan">
              <div className="fc-card-header">
                <span className="fc-card-title">{t('hero_card_title')}</span>
                <span className="fc-tag fc-tag-active">{t('hero_card_active')}</span>
              </div>
              {days.map((day, i) => (
                <div className="fc-day-row" key={day}>
                  <span className="fc-day-label">{day}</span>
                  <div className="fc-day-bar"><div className="fc-day-fill" style={{ width: `${dayFills[i]}%` }} /></div>
                  <span className="fc-day-icon">{dayEmojis[i]}</span>
                </div>
              ))}
            </div>

            <div className="floating-card fc-nutrition">
              <div className="fc-nutrition-top">
                <div className="fc-kcal-ring">
                  <div className="fc-kcal-inner"><span className="fc-kcal-value">75%</span></div>
                </div>
                <div className="fc-kcal-text">
                  <strong>2,140 kcal</strong>
                  <span>{t('hero_of_daily')}</span>
                </div>
              </div>
              {[
                { label: macros[0], fill: 65, g: '85g',  cls: 'protein' },
                { label: macros[1], fill: 78, g: '210g', cls: 'carbs' },
                { label: macros[2], fill: 48, g: '78g',  cls: 'fat' },
              ].map(({ label, fill, g, cls }) => (
                <div className="fc-macro-row" key={label}>
                  <span className="fc-macro-label">{label}</span>
                  <div className="fc-macro-bar"><div className={`fc-macro-fill ${cls}`} style={{ width: `${fill}%` }} /></div>
                  <span className="fc-macro-value">{g}</span>
                </div>
              ))}
            </div>

            <div className="floating-card fc-shopping">
              <div className="fc-shopping-title">{t('hero_shopping')}</div>
              {shopItems.map((item, i) => {
                const done = i < 2
                return (
                  <div className="fc-shopping-item" key={item}>
                    <div className={`fc-check ${done ? 'done' : 'pending'}`}>{done ? '✓' : ''}</div>
                    <span className={`fc-item-text${done ? ' done' : ''}`}>{item}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
