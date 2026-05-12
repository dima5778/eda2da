import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../context/AppContext'
import logoUrl from '/logo.png'

export default function Dashboard() {
  const navigate = useNavigate()
  const { t, thm, theme, toggleTheme, lang, toggleLang } = useApp()
  const isDark = theme === 'dark'

  const [activeTab,   setActiveTab]   = useState('dash_home')
  const [user,        setUser]        = useState(null)
  const [recipes,     setRecipes]     = useState([])
  const [plans,       setPlans]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [shopping,    setShopping]    = useState([])
  const [shopLoading, setShopLoading] = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [pending,     setPending]     = useState([])

  const isAdmin = user?.is_staff

  const NAV = [
    { icon: '🏠', key: 'dash_home',      label: t('dash_home') },
    { icon: '🍽️', key: 'dash_recipes',   label: t('dash_recipes') },
    { icon: '📅', key: 'dash_mealplans', label: t('dash_mealplans') },
    { icon: '🛒', key: 'dash_shopping',  label: t('dash_shopping') },
    { icon: '📊', key: 'dash_nutrition', label: t('dash_nutrition') },
    { icon: '👤', key: 'dash_profile',   label: t('dash_profile') },
  ]

  useEffect(() => {
    Promise.all([api.me(), api.recipes(), api.mealPlans()])
      .then(async ([uRes, rRes, pRes]) => {
        if (!uRes.ok) { navigate('/login'); return }
        const [u, r, p] = await Promise.all([uRes.json(), rRes.json(), pRes.json()])
        setUser(u)
        setRecipes(Array.isArray(r) ? r : r.results ?? [])
        setPlans(Array.isArray(p) ? p : p.results ?? [])
      })
      .finally(() => setLoading(false))
  }, [navigate])

  // Загружаем очередь модерации когда открывается вкладка админа
  useEffect(() => {
    if (activeTab === 'dash_admin' && isAdmin) {
      fetchPending()
    }
  }, [activeTab, isAdmin])

  const fetchPending = () => {
    fetch('/api/recipes/recipes/pending/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.ok ? r.json() : []).then(setPending)
  }

  useEffect(() => {
    if (activeTab === 'dash_shopping' && shopping.length === 0 && plans.length > 0) {
      setShopLoading(true)
      Promise.all(
        plans.map(p =>
          fetch(`/api/mealplan/plans/${p.id}/shopping_list/`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }).then(r => r.ok ? r.json() : [])
        )
      ).then(results => setShopping(results.flat()))
        .finally(() => setShopLoading(false))
    }
  }, [activeTab, plans])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh')
    navigate('/')
  }

  const toggleFavorite = async (id) => {
    // optimistic update
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, is_favorite: !r.is_favorite } : r))
    await fetch(`/api/recipes/recipes/${id}/favorite/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
  }

  const rateRecipe = async (id, score) => {
    const res = await fetch(`/api/recipes/recipes/${id}/rate/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    })
    if (res.ok) {
      const data = await res.json()
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, avg_rating: data.avg_rating, ratings_count: data.ratings_count, user_rating: data.user_rating } : r))
    }
  }

  const onRecipeAdded = (newRecipe) => {
    setRecipes(prev => [newRecipe, ...prev])
    setShowForm(false)
  }

  const approveRecipe = async (id) => {
    await fetch(`/api/recipes/recipes/${id}/approve/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    setPending(prev => prev.filter(r => r.id !== id))
    // Добавляем одобренный рецепт в общий список
    const res = await fetch(`/api/recipes/recipes/${id}/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    if (res.ok) {
      const data = await res.json()
      setRecipes(prev => prev.find(r => r.id === id) ? prev.map(r => r.id === id ? data : r) : [data, ...prev])
    }
  }

  const deleteRecipe = async (id, fromPending = false) => {
    if (!window.confirm(t('admin_confirm_delete'))) return
    const res = await fetch(`/api/recipes/recipes/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    if (res.ok || res.status === 204) {
      if (fromPending) setPending(prev => prev.filter(r => r.id !== id))
      setRecipes(prev => prev.filter(r => r.id !== id))
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: thm.bg, alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
      <div style={spinnerStyle} />
    </div>
  )

  const updateUser = (updated) => setUser(u => ({ ...u, ...updated }))

  const st = makeStyles(thm)
  const activeNav = [...NAV, { icon: '🛡️', key: 'dash_admin', label: t('dash_admin') }].find(n => n.key === activeTab)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', height: '100vh', overflow: 'hidden', background: thm.bg, fontFamily: "'Inter', sans-serif", color: thm.text, transition: 'background .3s, color .3s' }}>
      {/* Sidebar */}
      <aside style={st.sidebar}>
        <Link to="/" style={st.logoWrap}>
          <img src={logoUrl} alt="EDA2DA" style={st.logoImg} />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.03em', color: thm.text }}>
            <span style={gradStyle}>EDA</span>2DA
          </span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map(({ icon, key, label }) => (
            <div key={key} onClick={() => setActiveTab(key)}
              style={activeTab === key ? st.navItemActive : st.navItem}>
              <span>{icon}</span> {label}
            </div>
          ))}

          {/* Разделитель + вкладка Админ (только для is_staff) */}
          {isAdmin && (
            <>
              <div style={{ height: 1, background: thm.border, margin: '8px 0' }} />
              <div onClick={() => setActiveTab('dash_admin')}
                style={{
                  ...(activeTab === 'dash_admin' ? st.navItemActive : st.navItem),
                  color: activeTab === 'dash_admin' ? '#FF9F43' : '#FF9F43',
                  background: activeTab === 'dash_admin' ? 'rgba(255,159,67,.12)' : 'transparent',
                  border: activeTab === 'dash_admin' ? '1px solid rgba(255,159,67,.25)' : '1px solid transparent',
                }}>
                <span>🛡️</span>
                {t('dash_admin')}
                {pending.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 100, background: '#FF9F43', color: '#0A1428' }}>
                    {pending.length}
                  </span>
                )}
              </div>
            </>
          )}
        </nav>

        {/* Sidebar plan badge */}
        {user && (
          <div style={{ padding: '8px 12px', marginBottom: 8, borderRadius: 10, background: user.role === 'pro' ? 'rgba(0,200,215,.1)' : user.role === 'family' ? 'rgba(123,94,255,.1)' : 'rgba(255,255,255,.04)', border: `1px solid ${thm.border}`, fontSize: 12, fontWeight: 700, color: user.role === 'pro' ? '#00C8D7' : user.role === 'family' ? '#7B5EFF' : thm.textSec, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setActiveTab('dash_profile')}>
            {user.role === 'pro' ? '⚡ Pro' : user.role === 'family' ? '👨‍👩‍👧 Family' : '🆓 Free'}
          </div>
        )}

        <div style={st.settingsBar}>
          <button onClick={toggleLang} style={st.toggleBtn} title={lang === 'en' ? 'Switch to Russian' : 'На английский'}>
            {lang === 'en' ? '🇷🇺 RU' : '🇬🇧 EN'}
          </button>
          <button onClick={toggleTheme} style={st.toggleBtn} title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        <button onClick={logout} style={st.logoutBtn}>{t('dash_signout')}</button>
      </aside>

      {/* Main content */}
      <main style={st.main}>
        <div style={st.header}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: thm.text }}>
              {activeTab === 'dash_home'
                ? t('greeting', user?.username)
                : `${activeNav?.icon} ${activeNav?.label}`}
            </h1>
            <p style={{ fontSize: 14, color: thm.textSec, marginTop: 4 }}>
              {activeTab === 'dash_admin'
                ? t('dash_sub_admin')
                : activeTab === 'dash_profile'
                  ? t('dash_sub_profile')
                  : t(`dash_sub_${activeTab.replace('dash_', '')}`)}
            </p>
          </div>
        </div>

        {activeTab === 'dash_home'      && <TabDashboard recipes={recipes} plans={plans} thm={thm} t={t} st={st} />}
        {activeTab === 'dash_recipes'   && (
          <TabRecipes
            recipes={recipes} search={search} setSearch={setSearch}
            thm={thm} t={t} st={st}
            onAddClick={() => setShowForm(true)}
            isAdmin={isAdmin} onDelete={(id) => deleteRecipe(id)}
            onFavoriteToggle={toggleFavorite} onRate={rateRecipe}
            user={user}
            excludedIds={user?.excluded_ingredient_ids || []}
            onGoToProfile={() => setActiveTab('dash_profile')}
          />
        )}
        {activeTab === 'dash_mealplans' && <TabMealPlans plans={plans} setPlans={setPlans} recipes={recipes} thm={thm} t={t} st={st} user={user} onGoToProfile={() => setActiveTab('dash_profile')} />}
        {activeTab === 'dash_shopping'  && <TabShopping plans={plans} thm={thm} t={t} st={st} />}
        {activeTab === 'dash_nutrition' && <TabNutrition recipes={recipes} thm={thm} t={t} st={st} />}
        {activeTab === 'dash_admin'   && isAdmin && (
          <TabAdmin
            pending={pending} recipes={recipes}
            thm={thm} t={t} st={st}
            onApprove={approveRecipe}
            onDelete={(id, fromPending) => deleteRecipe(id, fromPending)}
          />
        )}
        {activeTab === 'dash_profile' && (
          <TabProfile user={user} thm={thm} t={t} st={st} onUpdate={updateUser} />
        )}
      </main>

      {/* Add Recipe Modal */}
      {showForm && (
        <RecipeFormModal
          thm={thm} t={t}
          onClose={() => setShowForm(false)}
          onAdded={onRecipeAdded}
        />
      )}
    </div>
  )
}

/* ─── Add Recipe Modal ─── */
const UNITS = ['г','мл','шт','кг','л','ч.л.','ст.л.','щепотка']
const emptyIngredient = () => ({ name: '', qty: '', unit: 'г' })

const STEP_NAMES = (t) => [t('recipe_form_step1_name'), t('recipe_form_step2_name'), t('recipe_form_step3_name')]

function RecipeFormModal({ thm, t, onClose, onAdded }) {
  const [form, setForm] = useState({
    title: '', instructions: '',
    cooking_time: 30, difficulty: 'Easy',
    calories: '', protein: '', carbs: '', fat: '',
  })
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [imageFile,    setImageFile]   = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [dragOver,     setDragOver]    = useState(false)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [step,   setStep]   = useState(1)
  const fileRef = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Ингредиенты
  const setIng = (i, field, val) =>
    setIngredients(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  const addIng    = () => setIngredients(prev => [...prev, emptyIngredient()])
  const removeIng = (i) => setIngredients(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i))

  // Обработка выбора файла
  const applyFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const onFileChange = (e) => applyFile(e.target.files[0])
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); applyFile(e.dataTransfer.files[0]) }
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)

  // Сериализуем ингредиенты в description
  const buildDescription = () =>
    ingredients
      .filter(r => r.name.trim())
      .map(r => `${r.name.trim()}${r.qty ? ' — ' + r.qty + ' ' + r.unit : ''}`)
      .join('\n')

  // Отправка через FormData (поддерживает файл)
  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Название обязательно'); return }
    setSaving(true); setError('')
    try {
      const fd = new FormData()
      fd.append('title',        form.title)
      fd.append('description',  buildDescription())
      fd.append('instructions', form.instructions)
      fd.append('cooking_time', parseInt(form.cooking_time) || 30)
      fd.append('difficulty',   form.difficulty)
      fd.append('calories',     parseFloat(form.calories) || 0)
      fd.append('protein',      parseFloat(form.protein)  || 0)
      fd.append('carbs',        parseFloat(form.carbs)    || 0)
      fd.append('fat',          parseFloat(form.fat)      || 0)
      if (imageFile) fd.append('image', imageFile)

      const res = await fetch('/api/recipes/recipes/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) { setError(Object.values(data).flat().join(' ') || 'Ошибка сохранения'); return }
      onAdded(data)
    } catch { setError('Ошибка сети. Попробуйте ещё раз.')
    } finally { setSaving(false) }
  }

  const inp = {
    padding: '10px 12px', borderRadius: 10,
    border: `1px solid ${thm.inputBorder}`,
    background: thm.input, color: thm.inputText,
    fontSize: 14, outline: 'none',
    fontFamily: "'Inter', sans-serif", transition: 'border-color .2s',
  }
  const lbl = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: thm.textSec }
  const stepNames = STEP_NAMES(t)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 580,
        background: thm.bg, border: `1px solid ${thm.border}`,
        borderRadius: 20, padding: '32px 36px',
        boxShadow: thm.shadow, maxHeight: '90vh', overflowY: 'auto',
        transition: 'background .3s',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ flex: 1, marginRight: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: thm.text }}>🍽️ {t('recipe_form_title')}</h2>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{
                  height: 4, borderRadius: 100, flex: 1,
                  background: step >= n ? 'linear-gradient(90deg,#00F0FF,#7B5EFF)' : thm.barBg,
                  transition: 'background .3s',
                }} />
              ))}
            </div>
            <p style={{ fontSize: 12, color: thm.textSec, marginTop: 6 }}>
              {t('recipe_form_step')} {step}/3 — {stepNames[step - 1]}
            </p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: thm.textSec }}>✕</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,94,94,.1)', border: '1px solid rgba(255,94,94,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF6B6B', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          {/* ── Шаг 1: Основная инфо ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Название */}
              <label style={lbl}>
                {t('recipe_field_title')} *
                <input style={{ ...inp, width: '100%' }} type="text" value={form.title}
                  onChange={set('title')} placeholder={t('recipe_field_title_ph')} autoFocus />
              </label>

              {/* Ингредиенты */}
              <div>
                <p style={{ ...lbl, marginBottom: 10 }}>{t('recipe_field_ingredients')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ingredients.map((row, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: 8, alignItems: 'center' }}>
                      <input style={{ ...inp }} type="text" placeholder={t('recipe_ing_name_ph')}
                        value={row.name} onChange={e => setIng(i, 'name', e.target.value)} />
                      <input style={{ ...inp, textAlign: 'center' }} type="number" min="0" step="0.1"
                        placeholder="100" value={row.qty} onChange={e => setIng(i, 'qty', e.target.value)} />
                      <select style={{ ...inp, cursor: 'pointer', paddingLeft: 8 }}
                        value={row.unit} onChange={e => setIng(i, 'unit', e.target.value)}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <button type="button" onClick={() => removeIng(i)} style={{
                        width: 32, height: 32, borderRadius: 8, border: `1px solid ${thm.border}`,
                        background: 'transparent', color: thm.textSec, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        opacity: ingredients.length === 1 ? 0.3 : 1,
                      }}>×</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addIng} style={{
                  marginTop: 10, width: '100%', padding: '9px',
                  borderRadius: 10, border: `1px dashed ${thm.border}`,
                  background: 'transparent', color: thm.textSec,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all .2s', fontFamily: "'Inter', sans-serif",
                }}>
                  + {t('recipe_ing_add')}
                </button>
              </div>

              {/* Время + Сложность */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={lbl}>
                  {t('recipe_field_time')} (мин)
                  <input style={{ ...inp }} type="number" min="1" max="480"
                    value={form.cooking_time} onChange={set('cooking_time')} />
                </label>
                <label style={lbl}>
                  {t('recipe_field_diff')}
                  <select style={{ ...inp, cursor: 'pointer' }} value={form.difficulty} onChange={set('difficulty')}>
                    <option value="Easy">{t('diff_easy')}</option>
                    <option value="Medium">{t('diff_medium')}</option>
                    <option value="Hard">{t('diff_hard')}</option>
                  </select>
                </label>
              </div>

              {/* КБЖУ */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[
                  { key: 'calories', label: t('mac_calories'), color: '#FF9F43', unit: 'ккал' },
                  { key: 'protein',  label: t('mac_protein'),  color: '#00D68F', unit: 'г' },
                  { key: 'carbs',    label: t('mac_carbs'),    color: '#7B5EFF', unit: 'г' },
                  { key: 'fat',      label: t('mac_fat'),      color: '#00C8D7', unit: 'г' },
                ].map(({ key, label, color, unit }) => (
                  <label key={key} style={lbl}>
                    <span style={{ color }}>{label}</span>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inp, paddingRight: 28 }} type="number" min="0" step="0.1"
                        value={form[key]} onChange={set(key)} placeholder="0" />
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: thm.textMuted }}>{unit}</span>
                    </div>
                  </label>
                ))}
              </div>

              <button type="button"
                onClick={() => { if (!form.title.trim()) { setError('Введите название'); return } setError(''); setStep(2) }}
                style={{ marginTop: 4, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00F0FF,#7B5EFF)', color: '#0A1428', fontSize: 15, fontWeight: 700 }}>
                {t('recipe_form_next')} →
              </button>
            </div>
          )}

          {/* ── Шаг 2: Приготовление ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Превью рецепта */}
              <div style={{ padding: '14px 16px', borderRadius: 12, background: thm.bgCard, border: `1px solid ${thm.border}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: thm.text, marginBottom: 4 }}>📌 {form.title}</p>
                <p style={{ fontSize: 12, color: thm.textSec, marginBottom: 6 }}>
                  ⏱ {form.cooking_time} мин · {form.difficulty} · {form.calories || 0} ккал
                </p>
                {ingredients.filter(r => r.name.trim()).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ingredients.filter(r => r.name.trim()).map((r, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: thm.shopBg, border: `1px solid ${thm.border}`, color: thm.textSec }}>
                        {r.name}{r.qty ? ` ${r.qty}${r.unit}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <label style={lbl}>
                {t('recipe_field_instructions')}
                <textarea style={{ ...inp, width: '100%', resize: 'vertical', minHeight: 200, lineHeight: 1.7, padding: '12px 14px' }}
                  value={form.instructions} onChange={set('instructions')}
                  placeholder={t('recipe_field_instructions_ph')} autoFocus />
              </label>

              <p style={{ fontSize: 12, color: thm.textSec, lineHeight: 1.6, padding: '10px 14px', borderRadius: 10, background: thm.bgCard, border: `1px solid ${thm.border}` }}>
                💡 {t('recipe_form_tip')}
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  ← {t('recipe_form_back')}
                </button>
                <button type="button" onClick={() => { setError(''); setStep(3) }}
                  style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00F0FF,#7B5EFF)', color: '#0A1428', fontSize: 15, fontWeight: 700 }}>
                  {t('recipe_form_next')} →
                </button>
              </div>
            </div>
          )}

          {/* ── Шаг 3: Фото ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Зона загрузки */}
              <div
                onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                onClick={() => document.getElementById('recipe-img-input').click()}
                style={{
                  position: 'relative', borderRadius: 16, overflow: 'hidden',
                  border: `2px dashed ${dragOver ? '#00F0FF' : imagePreview ? 'transparent' : thm.borderBright}`,
                  background: dragOver ? 'rgba(0,240,255,.05)' : thm.bgCard,
                  cursor: 'pointer', transition: 'all .25s',
                  minHeight: imagePreview ? 'auto' : 220,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="preview"
                      style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block', borderRadius: 14 }} />
                    <div style={{
                      position: 'absolute', bottom: 10, right: 10,
                      padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: 'rgba(0,0,0,.55)', color: '#fff', backdropFilter: 'blur(6px)',
                    }}>
                      ✏️ {t('recipe_photo_change')}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                    <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>📸</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: thm.text, marginBottom: 6 }}>
                      {t('recipe_photo_title')}
                    </p>
                    <p style={{ fontSize: 13, color: thm.textSec }}>
                      {t('recipe_photo_sub')}
                    </p>
                    <div style={{ marginTop: 16, display: 'inline-block', padding: '8px 20px', borderRadius: 10, border: `1px solid rgba(0,240,255,.35)`, color: '#00C8D7', fontSize: 13, fontWeight: 600 }}>
                      {t('recipe_photo_browse')}
                    </div>
                  </div>
                )}
                <input id="recipe-img-input" type="file" accept="image/*"
                  onChange={onFileChange} style={{ display: 'none' }} />
              </div>

              {/* Название файла */}
              {imageFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,214,143,.08)', border: '1px solid rgba(0,214,143,.2)' }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <span style={{ fontSize: 13, color: '#00D68F', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imageFile.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                    style={{ background: 'none', border: 'none', color: thm.textSec, cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(2)}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  ← {t('recipe_form_back')}
                </button>
                <button type="submit" disabled={saving} style={{
                  flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  background: saving ? thm.bgCard : 'linear-gradient(135deg,#00F0FF,#7B5EFF)',
                  color: saving ? thm.textSec : '#0A1428',
                  fontSize: 15, fontWeight: 700,
                  boxShadow: saving ? 'none' : '0 0 30px rgba(0,240,255,.2)',
                }}>
                  {saving ? t('recipe_form_saving') : `✓ ${t('recipe_form_save')}`}
                </button>
              </div>

              {/* Пропустить */}
              {!imageFile && (
                <button type="submit" disabled={saving} style={{
                  width: '100%', padding: '10px', borderRadius: 12, border: `1px solid ${thm.border}`,
                  background: 'transparent', color: thm.textMuted, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {t('recipe_photo_skip')} →
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

/* ─── Tab: Profile ─── */
function TabProfile({ user, thm, t, st, onUpdate }) {
  const { lang } = useApp()
  const [form, setForm]         = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '', bio: user?.bio || '' })
  const [avatarFile,    setAvatarFile]    = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [saveMsg,  setSaveMsg]  = useState('')
  const [saveErr,  setSaveErr]  = useState('')
  const [pwForm,   setPwForm]   = useState({ old_password: '', new_password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg,    setPwMsg]    = useState('')
  const [pwErr,    setPwErr]    = useState('')
  const [subSaving, setSubSaving] = useState(false)
  const [subMsg,    setSubMsg]    = useState('')
  const [exclusions,     setExclusions]     = useState([])
  const [exclSearch,     setExclSearch]     = useState('')
  const [exclSearchRes,  setExclSearchRes]  = useState([])
  const [exclLoading,    setExclLoading]    = useState(false)

  useEffect(() => {
    fetch('/api/users/me/exclusions/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.ok ? r.json() : []).then(setExclusions)
  }, [])

  useEffect(() => {
    if (!exclSearch.trim()) { setExclSearchRes([]); return }
    const timer = setTimeout(() => {
      fetch(`/api/recipes/ingredients/?search=${encodeURIComponent(exclSearch)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.ok ? r.json() : []).then(data => setExclSearchRes(Array.isArray(data) ? data : data.results || []))
    }, 300)
    return () => clearTimeout(timer)
  }, [exclSearch])

  const addExclusion = async (ing) => {
    const res = await fetch('/api/users/me/exclusions/add/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient_id: ing.id }),
    })
    if (res.ok) {
      const next = [...exclusions, ing]
      setExclusions(next)
      onUpdate({ excluded_ingredient_ids: next.map(e => e.id) })
      setExclSearch('')
      setExclSearchRes([])
    }
  }

  const removeExclusion = async (ingId) => {
    await fetch(`/api/users/me/exclusions/${ingId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const next = exclusions.filter(e => e.id !== ingId)
    setExclusions(next)
    onUpdate({ excluded_ingredient_ids: next.map(e => e.id) })
  }

  const planRole = user?.role
  const planBadge = planRole === 'pro' ? t('sub_badge_pro') : planRole === 'family' ? t('sub_badge_family') : t('sub_badge_free')

  const PLAN_CARDS = [
    { key: 'free',   name: lang === 'ru' ? 'Бесплатно' : 'Free',   price: '0',  color: '#00D68F',
      features: lang === 'ru' ? ['До 50 рецептов','Базовое планирование','Список покупок','Доступ к сообществу'] : ['Up to 50 recipes','Basic planning','Shopping list','Community access'] },
    { key: 'pro',    name: 'Pro',                                    price: '9',  color: '#00C8D7',
      features: lang === 'ru' ? ['Неограниченно рецептов','Расширенное планирование','Нутриенты','AI-рекомендации','Приоритетная поддержка'] : ['Unlimited recipes','Advanced planning','Nutrition tracking','AI suggestions','Priority support'] },
    { key: 'family', name: lang === 'ru' ? 'Семейный' : 'Family',   price: '19', color: '#7B5EFF',
      features: lang === 'ru' ? ['Всё из Pro','До 5 членов семьи','Совместные планы','Коллаборативные покупки','Онбординг'] : ['Everything in Pro','Up to 5 family','Shared meal plans','Collaborative shopping','Onboarding'] },
  ]

  const switchPlan = async (plan) => {
    setSubSaving(true); setSubMsg('')
    const res = await fetch('/api/users/me/subscribe/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    if (res.ok) {
      const data = await res.json()
      onUpdate(data)
      setSubMsg(t('sub_switch_success'))
      setTimeout(() => setSubMsg(''), 3000)
    }
    setSubSaving(false)
  }

  const set  = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setPw = k => e => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const avatarUrl = avatarPreview || (user?.avatar ? user.avatar : null)
  const initials  = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')) || user?.username?.[0]?.toUpperCase() || '?'

  const onAvatarChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const saveProfile = async () => {
    setSaving(true); setSaveMsg(''); setSaveErr('')
    try {
      const fd = new FormData()
      fd.append('first_name', form.first_name)
      fd.append('last_name',  form.last_name)
      fd.append('email',      form.email)
      fd.append('bio',        form.bio)
      if (avatarFile) fd.append('avatar', avatarFile)

      const res = await fetch('/api/users/me/', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) { setSaveErr(Object.values(data).flat().join(' ')); return }
      onUpdate(data)
      setAvatarFile(null)
      setSaveMsg(t('profile_saved'))
      setTimeout(() => setSaveMsg(''), 3000)
    } catch { setSaveErr(t('profile_save_err'))
    } finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm) { setPwErr(t('profile_pw_mismatch')); return }
    setPwSaving(true); setPwMsg(''); setPwErr('')
    try {
      const res = await fetch('/api/users/me/password/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: pwForm.old_password, new_password: pwForm.new_password }),
      })
      const data = await res.json()
      if (!res.ok) { setPwErr(Object.values(data).flat().join(' ')); return }
      setPwMsg(t('profile_pw_changed'))
      setPwForm({ old_password: '', new_password: '', confirm: '' })
      setTimeout(() => setPwMsg(''), 3000)
    } catch { setPwErr(t('profile_save_err'))
    } finally { setPwSaving(false) }
  }

  const inp = {
    padding: '10px 14px', borderRadius: 10,
    border: `1px solid ${thm.inputBorder}`,
    background: thm.input, color: thm.inputText,
    fontSize: 14, outline: 'none', width: '100%',
    fontFamily: "'Inter', sans-serif",
  }
  const lbl = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: thm.textSec }

  const memberSince = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 720 }}>

      {/* ── Шапка профиля ── */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: '28px 32px', background: thm.bgCard, border: `1px solid ${thm.border}`, borderRadius: 20 }}>
        {/* Аватар */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#00F0FF,#7B5EFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: '#fff', border: `3px solid ${thm.border}` }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>
          <label htmlFor="avatar-input" style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#00C8D7', border: `2px solid ${thm.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
            📷
          </label>
          <input id="avatar-input" type="file" accept="image/*" onChange={onAvatarChange} style={{ display: 'none' }} />
        </div>

        {/* Имя и мета */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: thm.text, marginBottom: 4 }}>
            {(user?.first_name || user?.last_name)
              ? `${user.first_name} ${user.last_name}`.trim()
              : user?.username}
          </h2>
          <p style={{ fontSize: 13, color: thm.textSec, marginBottom: 12 }}>@{user?.username} · {t('profile_member_since')} {memberSince}</p>
          {/* Статистика */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { value: user?.recipes_count ?? 0,   label: t('stat_recipes'),   color: '#00C8D7' },
              { value: user?.favorites_count ?? 0,  label: t('stat_favorites'), color: '#FF6B6B' },
              { value: user?.ratings_count ?? 0,    label: t('profile_ratings'), color: '#FFD700' },
            ].map(({ value, label, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 11, color: thm.textMuted, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan badge in header */}
        {(() => {
          const pr = user?.role
          const c = pr === 'pro' ? { label: t('sub_badge_pro'), bg: 'rgba(0,200,215,.12)', border: '1px solid rgba(0,200,215,.3)', color: '#00C8D7' }
                  : pr === 'family' ? { label: t('sub_badge_family'), bg: 'rgba(123,94,255,.12)', border: '1px solid rgba(123,94,255,.3)', color: '#7B5EFF' }
                  : { label: t('sub_badge_free'), bg: 'rgba(255,255,255,.05)', border: `1px solid ${thm.border}`, color: thm.textSec }
          return <div style={{ padding: '6px 14px', borderRadius: 100, background: c.bg, border: c.border, color: c.color, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.label}</div>
        })()}

        {/* Бейдж */}
        {user?.is_staff && (
          <div style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(255,159,67,.12)', border: '1px solid rgba(255,159,67,.3)', color: '#FF9F43', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            🛡️ Admin
          </div>
        )}
      </div>

      {/* ── Личные данные ── */}
      <div style={{ padding: '28px 32px', background: thm.bgCard, border: `1px solid ${thm.border}`, borderRadius: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: thm.text, marginBottom: 20 }}>✏️ {t('profile_section_info')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label style={lbl}>
              {t('profile_first_name')}
              <input style={inp} value={form.first_name} onChange={set('first_name')} placeholder={t('profile_first_name_ph')} />
            </label>
            <label style={lbl}>
              {t('profile_last_name')}
              <input style={inp} value={form.last_name} onChange={set('last_name')} placeholder={t('profile_last_name_ph')} />
            </label>
          </div>
          <label style={lbl}>
            {t('profile_email')}
            <input style={inp} type="email" value={form.email} onChange={set('email')} placeholder="example@mail.com" />
          </label>
          <label style={lbl}>
            {t('profile_bio')}
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
              value={form.bio} onChange={set('bio')} placeholder={t('profile_bio_ph')} />
          </label>

          {saveErr && <div style={{ fontSize: 13, color: '#FF6B6B', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,107,107,.08)', border: '1px solid rgba(255,107,107,.2)' }}>{saveErr}</div>}
          {saveMsg && <div style={{ fontSize: 13, color: '#00D68F', padding: '8px 12px', borderRadius: 8, background: 'rgba(0,214,143,.08)', border: '1px solid rgba(0,214,143,.2)' }}>✅ {saveMsg}</div>}

          <button onClick={saveProfile} disabled={saving} style={{ alignSelf: 'flex-start', padding: '11px 28px', borderRadius: 12, border: 'none', background: saving ? thm.bgCard : 'linear-gradient(135deg,#00F0FF,#7B5EFF)', color: saving ? thm.textSec : '#0A1428', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif" }}>
            {saving ? t('profile_saving') : t('profile_save')}
          </button>
        </div>
      </div>

      {/* ── Смена пароля ── */}
      <div style={{ padding: '28px 32px', background: thm.bgCard, border: `1px solid ${thm.border}`, borderRadius: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: thm.text, marginBottom: 20 }}>🔒 {t('profile_section_password')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
          <label style={lbl}>
            {t('profile_pw_current')}
            <input style={inp} type="password" value={pwForm.old_password} onChange={setPw('old_password')} autoComplete="current-password" />
          </label>
          <label style={lbl}>
            {t('profile_pw_new')}
            <input style={inp} type="password" value={pwForm.new_password} onChange={setPw('new_password')} autoComplete="new-password" />
          </label>
          <label style={lbl}>
            {t('profile_pw_confirm')}
            <input style={inp} type="password" value={pwForm.confirm} onChange={setPw('confirm')} autoComplete="new-password" />
          </label>

          {pwErr && <div style={{ fontSize: 13, color: '#FF6B6B', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,107,107,.08)', border: '1px solid rgba(255,107,107,.2)' }}>{pwErr}</div>}
          {pwMsg && <div style={{ fontSize: 13, color: '#00D68F', padding: '8px 12px', borderRadius: 8, background: 'rgba(0,214,143,.08)', border: '1px solid rgba(0,214,143,.2)' }}>✅ {pwMsg}</div>}

          <button onClick={changePassword} disabled={pwSaving} style={{ alignSelf: 'flex-start', padding: '11px 28px', borderRadius: 12, border: 'none', background: pwSaving ? thm.bgCard : 'rgba(255,107,107,.12)', color: pwSaving ? thm.textSec : '#FF6B6B', border: '1px solid rgba(255,107,107,.25)', fontSize: 14, fontWeight: 700, cursor: pwSaving ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif" }}>
            {pwSaving ? t('profile_saving') : t('profile_pw_save')}
          </button>
        </div>
      </div>

      {/* ── Подписка ── */}
      <div style={{ padding: '28px 32px', background: thm.bgCard, border: `1px solid ${thm.border}`, borderRadius: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: thm.text, marginBottom: 6 }}>💳 {t('sub_manage')}</h3>
        <p style={{ fontSize: 13, color: thm.textSec, marginBottom: 24 }}>{t('sub_your_plan')}: <strong style={{ color: thm.text }}>{planBadge}</strong></p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {PLAN_CARDS.map(({ key, name, price, features, color }) => {
            const isCurrent = planRole === key || (key === 'free' && (!planRole || planRole === 'USER'))
            return (
              <div key={key} style={{ padding: '20px 20px 24px', borderRadius: 16, border: isCurrent ? `2px solid ${color}` : `1px solid ${thm.border}`, background: isCurrent ? `${color}18` : thm.bg, position: 'relative', transition: 'all .2s' }}>
                {isCurrent && (
                  <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: color, color: '#0A1428', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                    {t('sub_current')}
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 800, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>{name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: thm.textSec }}>$</span>
                  <span style={{ fontSize: 30, fontWeight: 900, color: thm.text, lineHeight: 1 }}>{price}</span>
                  <span style={{ fontSize: 11, color: thm.textSec }}>/мес</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: thm.text, alignItems: 'flex-start', lineHeight: 1.4 }}>
                      <span style={{ color, fontWeight: 800, flexShrink: 0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <button onClick={() => switchPlan(key)} disabled={subSaving}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: color, color: '#0A1428', fontSize: 13, fontWeight: 700, cursor: subSaving ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", opacity: subSaving ? 0.6 : 1 }}>
                    {t('sub_switch_to', name)}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {subMsg && <div style={{ marginTop: 16, fontSize: 13, color: '#00D68F', padding: '8px 12px', borderRadius: 8, background: 'rgba(0,214,143,.08)', border: '1px solid rgba(0,214,143,.2)' }}>✅ {subMsg}</div>}
      </div>

      {/* ── Исключения аллергенов ── */}
      <div style={{ padding: '28px 32px', background: thm.bgCard, border: `1px solid ${thm.border}`, borderRadius: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: thm.text, marginBottom: 6 }}>🚫 Исключить ингредиенты</h3>
        <p style={{ fontSize: 13, color: thm.textSec, marginBottom: 20 }}>Рецепты с этими ингредиентами не будут показываться в поиске</p>

        {/* Current exclusions */}
        {exclusions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {exclusions.map(ing => (
              <div key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', borderRadius: 100, background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.25)', color: '#FF6B6B', fontSize: 12, fontWeight: 600 }}>
                {ing.is_allergen && '⚠️ '}{ing.name}
                <button onClick={() => removeExclusion(ing.id)} style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
              </div>
            ))}
          </div>
        )}
        {exclusions.length === 0 && <p style={{ fontSize: 12, color: thm.textMuted, marginBottom: 16 }}>Нет исключённых ингредиентов</p>}

        {/* Search to add */}
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <input
            value={exclSearch}
            onChange={e => setExclSearch(e.target.value)}
            placeholder="Найти ингредиент для исключения..."
            style={{ ...inp, width: '100%' }}
          />
          {exclSearchRes.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: thm.bg, border: `1px solid ${thm.border}`, borderRadius: 10, marginTop: 4, overflow: 'hidden', boxShadow: thm.shadow }}>
              {exclSearchRes.slice(0, 8).map(ing => (
                <div key={ing.id}
                  onClick={() => exclusions.find(e => e.id === ing.id) ? null : addExclusion(ing)}
                  style={{ padding: '9px 14px', cursor: exclusions.find(e => e.id === ing.id) ? 'default' : 'pointer', fontSize: 13, color: exclusions.find(e => e.id === ing.id) ? thm.textMuted : thm.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${thm.border}` }}
                  onMouseEnter={e => { if (!exclusions.find(ex => ex.id === ing.id)) e.currentTarget.style.background = thm.bgCard }}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{ing.is_allergen && '⚠️ '}{ing.name}</span>
                  {exclusions.find(e => e.id === ing.id) ? <span style={{ fontSize: 11, color: thm.textMuted }}>уже исключён</span> : <span style={{ fontSize: 11, color: '#FF6B6B' }}>+ исключить</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

/* ─── Tab: Admin ─── */
function TabAdmin({ pending, recipes, thm, t, st, onApprove, onDelete }) {
  const [view, setView] = useState('pending') // 'pending' | 'all' | 'comments'
  const [reviews, setReviews] = useState([])

  const fetchReviews = () => {
    fetch('/api/recipes/recipes/all_reviews/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.ok ? r.json() : []).then(data => setReviews(Array.isArray(data) ? data : []))
  }

  useEffect(() => { fetchReviews() }, [])

  const handleHideReview = async (id) => {
    await fetch(`/api/recipes/recipes/reviews/${id}/hide/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    fetchReviews()
  }

  const handleApproveReview = async (id) => {
    await fetch(`/api/recipes/recipes/reviews/${id}/approve/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    fetchReviews()
  }

  const handleDeleteReview = async (id) => {
    await fetch(`/api/recipes/recipes/reviews/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    fetchReviews()
  }

  const tabBtn = (key, label, count) => (
    <button onClick={() => setView(key)} style={{
      padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
      border: `1px solid ${view === key ? 'rgba(255,159,67,.4)' : thm.border}`,
      background: view === key ? 'rgba(255,159,67,.1)' : thm.bgCard,
      color: view === key ? '#FF9F43' : thm.textSec,
      fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 7,
    }}>
      {label}
      {count > 0 && (
        <span style={{ padding: '1px 7px', borderRadius: 100, background: '#FF9F43', color: '#0A1428', fontSize: 10, fontWeight: 800 }}>
          {count}
        </span>
      )}
    </button>
  )

  function AdminCard({ r, fromPending, onApprove, onDelete }) {
    const [showReject, setShowReject] = useState(false)
    const [rejectReason, setRejectReason] = useState('')

    return (
      <div style={{
        display: 'flex', gap: 14, padding: '16px 18px', borderRadius: 14,
        background: thm.bgCard, border: `1px solid ${fromPending ? 'rgba(255,159,67,.2)' : thm.border}`,
        alignItems: 'flex-start',
      }}>
        {/* Фото или эмодзи */}
        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: thm.shopBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {r.image
            ? <img src={r.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 24 }}>{RECIPE_EMOJIS[r.id % 8]}</span>
          }
        </div>

        {/* Инфо */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: thm.text }}>{r.title}</span>
            {!r.is_moderated && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,159,67,.15)', color: '#FF9F43' }}>
                ⏳ {t('admin_pending')}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: thm.textSec, marginBottom: 6 }}>
            👤 {r.author_name} · ⏱ {r.cooking_time} мин · 🔥 {r.calories} ккал
          </p>
          <p style={{ fontSize: 12, color: thm.textMuted, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>
            {r.description?.slice(0, 100)}
          </p>
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'flex-start' }}>
          {fromPending && (
            <button onClick={() => onApprove(r.id)} style={{
              padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(0,214,143,.3)',
              background: 'rgba(0,214,143,.1)', color: '#00D68F',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>
              ✅ {t('admin_approve')}
            </button>
          )}
          {fromPending && (
            <>
              {!showReject ? (
                <button onClick={() => setShowReject(true)} style={{
                  padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,107,107,.3)',
                  background: 'rgba(255,107,107,.08)', color: '#FF6B6B',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}>
                  ✕ Отклонить
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Причина отклонения..."
                    rows={2}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,.3)', background: 'rgba(255,107,107,.06)', color: thm.text, fontSize: 12, outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif", width: 200 }}
                    onClick={e => e.stopPropagation()}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShowReject(false)} style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.textSec, fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Отмена</button>
                    <button onClick={async () => {
                      await fetch(`/api/recipes/recipes/${r.id}/reject/`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason: rejectReason }),
                      })
                      onDelete(r.id, true)
                    }} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#FF6B6B', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Отклонить</button>
                  </div>
                </div>
              )}
            </>
          )}
          <button onClick={() => onDelete(r.id, fromPending)} style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,107,107,.3)',
            background: 'rgba(255,107,107,.08)', color: '#FF6B6B',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}>
            🗑 {t('admin_delete')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Переключатель вкладок */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabBtn('pending',  t('admin_tab_pending'),  pending.length)}
        {tabBtn('all',      t('admin_tab_all'),      recipes.length)}
        {tabBtn('comments', '💬 Комментарии',        reviews.filter(r => !r.is_approved).length)}
      </div>

      {/* Очередь на модерацию */}
      {view === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pending.length === 0 ? (
            <div style={{ ...st.empty, textAlign: 'center' }}>
              <span style={{ fontSize: 48 }}>✅</span>
              <p style={{ color: thm.textSec, marginTop: 12 }}>{t('admin_empty_pending')}</p>
            </div>
          ) : pending.map(r => <AdminCard key={r.id} r={r} fromPending={true} onApprove={onApprove} onDelete={onDelete} />)}
        </div>
      )}

      {/* Все рецепты */}
      {view === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recipes.length === 0 ? (
            <div style={{ ...st.empty, textAlign: 'center' }}>
              <span style={{ fontSize: 48 }}>🍳</span>
              <p style={{ color: thm.textSec, marginTop: 12 }}>{t('empty_recipes')}</p>
            </div>
          ) : recipes.map(r => <AdminCard key={r.id} r={r} fromPending={false} onApprove={onApprove} onDelete={onDelete} />)}
        </div>
      )}

      {/* Комментарии */}
      {view === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.length === 0 ? (
            <div style={{ ...st.empty, textAlign: 'center' }}>
              <span style={{ fontSize: 48 }}>💬</span>
              <p style={{ color: thm.textSec, marginTop: 12 }}>Нет комментариев</p>
            </div>
          ) : reviews.map(rv => (
            <div key={rv.id} style={{
              padding: '14px 18px', borderRadius: 14,
              background: thm.bgCard,
              border: `1px solid ${!rv.is_approved ? 'rgba(255,107,107,.3)' : thm.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Контент */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: thm.text }}>👤 {rv.username}</span>
                    <span style={{ fontSize: 12, color: thm.textSec }}>→</span>
                    <span style={{ fontSize: 13, color: thm.textSec }}>🍽 {rv.recipe_title}</span>
                    <span style={{ fontSize: 11, color: thm.textMuted, marginLeft: 'auto' }}>
                      {rv.created_at ? new Date(rv.created_at).toLocaleDateString('ru-RU') : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: thm.text, lineHeight: 1.5, marginBottom: 8 }}>{rv.text}</p>
                  {!rv.is_approved && (
                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,107,107,.15)', color: '#FF6B6B' }}>
                      🚫 Скрыт
                    </span>
                  )}
                  {rv.is_approved && (
                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(0,214,143,.12)', color: '#00D68F' }}>
                      ✅ Виден
                    </span>
                  )}
                </div>

                {/* Кнопки */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {rv.is_approved ? (
                    <button onClick={() => handleHideReview(rv.id)} style={{
                      padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(255,159,67,.3)',
                      background: 'rgba(255,159,67,.08)', color: '#FF9F43',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}>
                      🙈 Скрыть
                    </button>
                  ) : (
                    <button onClick={() => handleApproveReview(rv.id)} style={{
                      padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(0,214,143,.3)',
                      background: 'rgba(0,214,143,.1)', color: '#00D68F',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}>
                      ✅ Показать
                    </button>
                  )}
                  <button onClick={() => handleDeleteReview(rv.id)} style={{
                    padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(255,107,107,.3)',
                    background: 'rgba(255,107,107,.08)', color: '#FF6B6B',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}>
                    🗑 Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Tab: Dashboard ─── */
function TabDashboard({ recipes, plans, thm, t, st }) {
  const favorites = recipes.filter(r => r.is_favorite)
  const [recs, setRecs] = useState([])
  useEffect(() => {
    fetch('/api/recipes/recipes/recommendations/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.ok ? r.json() : []).then(data => setRecs(Array.isArray(data) ? data : []))
  }, [])

  return (
    <>
      <div style={st.statsRow}>
        {[
          { icon: '🍽️', value: recipes.length,   label: t('stat_recipes') },
          { icon: '❤️',  value: favorites.length,  label: t('stat_favorites') },
          { icon: '📅',  value: plans.length,      label: t('stat_plans') },
          { icon: '🔥',  value: recipes.length > 0
              ? (recipes.reduce((s, r) => s + (r.calories || 0), 0) / recipes.length | 0) + ' ккал'
              : '—',
            label: t('stat_avg_cal') },
        ].map(({ icon, value, label }) => (
          <div key={label} style={st.statCard}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.03em', background: thm.statGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</span>
            <span style={{ fontSize: 12, color: thm.textSec, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={st.sectionHeader}>
        <h2 style={st.sectionTitle}>
          {favorites.length > 0 ? `❤️ ${t('sec_favorites')}` : t('sec_recent_recipes')}
        </h2>
        {favorites.length > 0 && (
          <span style={{ fontSize: 12, color: thm.textSec }}>{favorites.length} {t('stat_favorites').toLowerCase()}</span>
        )}
      </div>
      <RecipeGrid
        recipes={favorites.length > 0 ? favorites : recipes.slice(0, 6)}
        thm={thm} t={t} st={st}
        emptyIcon="❤️"
        emptyText={t('empty_favorites')}
      />
      <div style={{ ...st.sectionHeader, marginTop: 40 }}>
        <h2 style={st.sectionTitle}>{t('sec_upcoming_plans')}</h2>
      </div>
      <PlanList plans={plans.slice(0, 3)} thm={thm} t={t} st={st} />
      {recs.length > 0 && (
        <>
          <div style={{ ...st.sectionHeader, marginTop: 40 }}>
            <h2 style={st.sectionTitle}>✨ Рекомендации для вас</h2>
            <span style={{ fontSize: 12, color: thm.textSec }}>На основе ваших предпочтений</span>
          </div>
          <RecipeGrid recipes={recs.slice(0, 6)} thm={thm} t={t} st={st} emptyIcon="✨" emptyText="" />
        </>
      )}
    </>
  )
}

/* ─── Tab: Recipes ─── */
const CATEGORIES = ['all', 'soup', 'main', 'salad', 'vegan', 'breakfast', 'dessert']

function TabRecipes({ recipes, search, setSearch, thm, t, st, onAddClick, isAdmin, onDelete, onFavoriteToggle, onRate, user, excludedIds, onGoToProfile }) {
  const [modalRecipe, setModalRecipe] = useState(null)
  const [category,   setCategory]    = useState('all')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [calMin, setCalMin] = useState('')
  const [calMax, setCalMax] = useState('')
  const [protMin, setProtMin] = useState('')
  const [fatMax, setFatMax] = useState('')
  const [carbsMax, setCarbsMax] = useState('')

  const isFree   = !user?.role || user.role === 'USER' || user.role === 'free'
  const myCount  = recipes.filter(r => r.author_name === user?.username).length
  const atLimit  = isFree && myCount >= 50

  const handleAdd = () => {
    if (atLimit) { setShowUpgrade(true); return }
    onAddClick()
  }

  const filtered = recipes.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || r.title.toLowerCase().includes(q)
      || (r.ingredients || []).some(ing => ing.ingredient_name?.toLowerCase().includes(q))
    const matchCat = category === 'all' || r.category === category
    if (!matchSearch || !matchCat) return false
    if (calMin && (r.calories || 0) < parseFloat(calMin)) return false
    if (calMax && (r.calories || 0) > parseFloat(calMax)) return false
    if (protMin && (r.protein || 0) < parseFloat(protMin)) return false
    if (fatMax && (r.fat || 0) > parseFloat(fatMax)) return false
    if (carbsMax && (r.carbs || 0) > parseFloat(carbsMax)) return false
    return true
  })

  return (
    <>
      <div style={st.sectionHeader}>
        <h2 style={st.sectionTitle}>{t('sec_recipes_count', filtered.length)}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Счётчик лимита для Free */}
          {isFree && (
            <div style={{ fontSize: 12, color: myCount >= 45 ? '#FF9F43' : thm.textSec, fontWeight: 600, padding: '6px 12px', borderRadius: 100, background: myCount >= 45 ? 'rgba(255,159,67,.1)' : thm.bgCard, border: `1px solid ${myCount >= 45 ? 'rgba(255,159,67,.3)' : thm.border}` }}>
              {myCount}/50
            </div>
          )}
          <input
            style={{ ...st.searchInput, background: thm.input, border: `1px solid ${thm.inputBorder}`, color: thm.inputText }}
            type="text" placeholder={t('search_placeholder')}
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <button onClick={() => setShowFilters(s => !s)} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${showFilters ? 'rgba(123,94,255,.4)' : thm.border}`, background: showFilters ? 'rgba(123,94,255,.1)' : thm.bgCard, color: showFilters ? '#7B5EFF' : thm.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            ⚖️ КБЖУ
          </button>
          <button onClick={handleAdd} style={st.addBtn}>
            + {t('recipe_add_btn')}
          </button>
        </div>
      </div>

      {/* Баннер лимита */}
      {isFree && myCount >= 45 && (
        <div style={{ padding: '14px 20px', borderRadius: 14, marginBottom: 16, background: 'rgba(255,159,67,.08)', border: '1px solid rgba(255,159,67,.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#FF9F43', marginBottom: 2 }}>
              {atLimit ? '🚫 Лимит рецептов достигнут' : `⚠️ Осталось ${50 - myCount} рецепта из 50`}
            </p>
            <p style={{ fontSize: 12, color: thm.textSec }}>Перейдите на Pro для неограниченного количества рецептов</p>
          </div>
          <button onClick={() => setShowUpgrade(true)} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#00C8D7,#7B5EFF)', color: '#0A1428', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
            ⚡ Перейти на Pro
          </button>
        </div>
      )}

      {showFilters && (
        <div style={{ padding: '16px 20px', borderRadius: 14, marginBottom: 16, background: thm.bgCard, border: `1px solid rgba(123,94,255,.2)`, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: '🔥 Ккал от', value: calMin, set: setCalMin, placeholder: '0' },
            { label: '🔥 Ккал до', value: calMax, set: setCalMax, placeholder: '800' },
            { label: '💪 Белки от (г)', value: protMin, set: setProtMin, placeholder: '0' },
            { label: '🧈 Жиры до (г)', value: fatMax, set: setFatMax, placeholder: '50' },
            { label: '🌾 Углев. до (г)', value: carbsMax, set: setCarbsMax, placeholder: '100' },
          ].map(({label, value, set, placeholder}) => (
            <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11, fontWeight: 600, color: thm.textSec }}>
              {label}
              <input
                type="number" min="0" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${thm.inputBorder}`, background: thm.input, color: thm.inputText, fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }}
              />
            </label>
          ))}
        </div>
      )}

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            border: `1px solid ${category === cat ? 'rgba(0,200,215,.4)' : thm.border}`,
            background: category === cat ? 'rgba(0,200,215,.1)' : 'transparent',
            color: category === cat ? '#00C8D7' : thm.textSec,
            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}>
            {t(`filter_${cat}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={st.empty}>
          <span style={{ fontSize: 48 }}>🍳</span>
          <p style={{ color: thm.textSec, marginTop: 12 }}>{t('empty_recipes')}</p>
          <button onClick={handleAdd} style={{ ...st.addBtn, marginTop: 16 }}>+ {t('recipe_add_btn')}</button>
        </div>
      ) : (
        <div style={st.recipeGrid}>
          {filtered.map(r => (
            <RecipeCard
              key={r.id}
              r={r}
              thm={thm} t={t} st={st}
              onToggle={() => setModalRecipe(r)}
              isAdmin={isAdmin}
              onDelete={onDelete}
              onFavoriteToggle={onFavoriteToggle}
              excludedIds={excludedIds}
            />
          ))}
        </div>
      )}

      {/* Модал рецепта */}
      {modalRecipe && (
        <RecipeModal
          r={modalRecipe}
          thm={thm} t={t}
          onClose={() => setModalRecipe(null)}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onFavoriteToggle={onFavoriteToggle}
          onRate={onRate}
          excludedIds={excludedIds}
        />
      )}

      {/* Модал апгрейда */}
      {showUpgrade && <UpgradeModal thm={thm} t={t} onClose={() => setShowUpgrade(false)} reason="recipes" onGoToProfile={onGoToProfile} />}
    </>
  )
}

/* ─── Upgrade Modal ─── */
function UpgradeModal({ thm, t, onClose, reason, onGoToProfile }) {
  const { lang } = useApp()

  const heading = reason === 'recipes'
    ? (lang === 'ru' ? '🚫 Лимит рецептов достигнут' : '🚫 Recipe Limit Reached')
    : (lang === 'ru' ? '🔒 Функция Pro' : '🔒 Pro Feature')

  const subheading = reason === 'recipes'
    ? (lang === 'ru' ? 'На Free-тарифе можно хранить до 50 рецептов. Перейдите на Pro для неограниченного количества.' : 'Free plan allows up to 50 recipes. Upgrade to Pro for unlimited.')
    : (lang === 'ru' ? 'Печать и экспорт планов питания доступны на тарифах Pro и Family.' : 'Printing and exporting meal plans requires a Pro or Family plan.')

  const CARDS = [
    { key: 'free',   name: lang === 'ru' ? 'Бесплатно' : 'Free',   price: '0',  color: '#00D68F',
      features: lang === 'ru' ? ['До 50 рецептов','Базовое планирование','Список покупок'] : ['Up to 50 recipes','Basic planning','Shopping list'] },
    { key: 'pro',    name: 'Pro',                                    price: '9',  color: '#00C8D7',
      features: lang === 'ru' ? ['Неограниченно рецептов','Расширенный план питания','Нутриенты','Печать и экспорт'] : ['Unlimited recipes','Advanced meal planning','Nutrition tracking','Print & export'] },
    { key: 'family', name: lang === 'ru' ? 'Семейный' : 'Family',   price: '19', color: '#7B5EFF',
      features: lang === 'ru' ? ['Всё из Pro','До 5 участников','Совместные планы'] : ['Everything in Pro','Up to 5 members','Shared plans'] },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: 700, background: thm.bg, border: `1px solid ${thm.border}`, borderRadius: 24, padding: '36px 40px', boxShadow: thm.shadow, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div style={{ flex: 1, marginRight: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: thm.text, marginBottom: 8 }}>{heading}</h2>
            <p style={{ fontSize: 14, color: thm.textSec, lineHeight: 1.6 }}>{subheading}</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: thm.textSec, flexShrink: 0 }}>✕</button>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {CARDS.map(({ key, name, price, features, color }) => (
            <div key={key} style={{ padding: '18px 18px 22px', borderRadius: 16, border: key === 'pro' ? `2px solid ${color}` : `1px solid ${thm.border}`, background: key === 'pro' ? `${color}18` : thm.bgCard, position: 'relative', transition: 'transform .15s' }}>
              {key === 'pro' && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: color, color: '#0A1428', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                  ⭐ {lang === 'ru' ? 'Рекомендуем' : 'Recommended'}
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 800, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>{name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: thm.textSec }}>$</span>
                <span style={{ fontSize: 30, fontWeight: 900, color: thm.text, lineHeight: 1 }}>{price}</span>
                <span style={{ fontSize: 11, color: thm.textSec }}>/мес</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: thm.text, alignItems: 'flex-start', lineHeight: 1.4 }}>
                    <span style={{ color, fontWeight: 800, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '11px 24px', borderRadius: 12, border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            {lang === 'ru' ? 'Позже' : 'Maybe later'}
          </button>
          <button
            onClick={() => { onClose(); if (onGoToProfile) onGoToProfile() }}
            style={{ padding: '11px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00C8D7,#7B5EFF)', color: '#0A1428', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 0 24px rgba(0,200,215,.25)' }}
          >
            ⚡ {lang === 'ru' ? 'Управлять подпиской' : 'Manage subscription'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Recipe Card ─── */
const RECIPE_EMOJIS = ['🥗','🍝','🥩','🫕','🐟','🍜','🥘','🍲']
const DIFF_COLORS = { Easy: { bg: 'rgba(0,214,143,.12)',  text: '#00D68F' },
                      Medium:{ bg: 'rgba(255,159,67,.12)', text: '#FF9F43' },
                      Hard:  { bg: 'rgba(255,107,107,.12)',text: '#FF6B6B' } }

function RecipeCard({ r, thm, t, st, onToggle, isAdmin, onDelete, onFavoriteToggle, excludedIds }) {
  const ings = r.ingredients || []
  const SHOW = 5
  const diff = DIFF_COLORS[r.difficulty] || DIFF_COLORS.Easy

  return (
    <div
      style={{
        ...st.recipeCard,
        cursor: 'pointer',
        position: 'relative',
        transition: 'box-shadow .2s, border-color .2s',
      }}
      onClick={onToggle}
    >
      {/* ── Favorite button ── */}
      {onFavoriteToggle && (
        <button
          onClick={e => { e.stopPropagation(); onFavoriteToggle(r.id) }}
          title={r.is_favorite ? t('fav_remove') : t('fav_add')}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, lineHeight: 1, padding: 4, zIndex: 2,
            color: r.is_favorite ? '#FF6B6B' : thm.textMuted,
            filter: r.is_favorite ? 'none' : 'grayscale(1) opacity(0.5)',
            transition: 'all .2s',
          }}
        >
          {r.is_favorite ? '❤️' : '🤍'}
        </button>
      )}

      {/* ── Шапка (по центру) ── */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        {r.image ? (
          <div style={{ width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <img
              src={r.image}
              alt={r.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ) : (
          <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 10 }}>
            {RECIPE_EMOJIS[r.id % 8]}
          </div>
        )}
        <h3 style={{ fontSize: 16, fontWeight: 800, color: thm.text, lineHeight: 1.3, marginBottom: 6 }}>
          {r.title}
        </h3>

        {/* Avg rating badge */}
        {r.avg_rating != null && (
          <div style={{ fontSize: 12, color: '#FFD700', fontWeight: 700, marginBottom: 8 }}>
            {t('rating_avg', r.avg_rating, r.ratings_count)}
          </div>
        )}

        {/* Бейджи */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: diff.bg, color: diff.text }}>
            {r.difficulty || 'Easy'}
          </span>
          {r.cooking_time > 0 && (
            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 100, background: thm.shopBg, border: `1px solid ${thm.border}`, color: thm.textSec }}>
              ⏱ {r.cooking_time} мин
            </span>
          )}
          {r.calories > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,159,67,.10)', color: '#FF9F43' }}>
              🔥 {r.calories} ккал
            </span>
          )}
          {!r.is_moderated && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,159,67,.12)', color: '#FF9F43' }}>
              ⏳ {t('admin_pending')}
            </span>
          )}
        </div>

        {/* Кнопка удаления для админа */}
        {isAdmin && onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(r.id) }}
            style={{ marginTop: 8, padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(255,107,107,.3)', background: 'rgba(255,107,107,.07)', color: '#FF6B6B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
          >
            🗑 {t('admin_delete')}
          </button>
        )}
      </div>

      {/* ── Мини КБЖУ ── */}
      {(r.protein > 0 || r.carbs > 0 || r.fat > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, borderRadius: 12, overflow: 'hidden', border: `1px solid ${thm.border}`, marginBottom: 14 }}>
          {[
            { label: 'Белки', value: r.protein, color: '#00D68F' },
            { label: 'Углев.', value: r.carbs,  color: '#7B5EFF' },
            { label: 'Жиры',  value: r.fat,     color: '#00C8D7' },
          ].map(({ label, value, color }, i) => (
            <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: thm.shopBg, borderRight: i < 2 ? `1px solid ${thm.border}` : 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{value}<span style={{ fontSize: 9, fontWeight: 600, opacity: .7 }}>г</span></div>
              <div style={{ fontSize: 9, color: thm.textMuted, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Ингредиенты (превью) ── */}
      {ings.length > 0 && (
        <div onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.07em' }}>
              🥕 {t('recipe_field_ingredients')}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {(excludedIds || []).some(id => ings.some(i => i.ingredient_id === id)) && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,107,107,.12)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,.2)' }}>
                  ⚠️ {ings.filter(i => (excludedIds || []).includes(i.ingredient_id)).length} искл.
                </span>
              )}
              <span style={{ fontSize: 10, color: thm.textMuted, fontWeight: 600 }}>{ings.length} шт.</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {ings.slice(0, SHOW).map((ing, i) => {
              const isExcluded = (excludedIds || []).includes(ing.ingredient_id)
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: 7, background: isExcluded ? 'rgba(255,107,107,.08)' : thm.shopBg, border: `1px solid ${isExcluded ? 'rgba(255,107,107,.25)' : thm.border}` }}>
                  <span style={{ fontSize: 12, color: isExcluded ? '#FF6B6B' : thm.text, fontWeight: isExcluded ? 700 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isExcluded && <span style={{ fontSize: 10 }}>⚠️</span>}
                    {ing.ingredient_name}
                  </span>
                  {ing.quantity > 0 && (
                    <span style={{ fontSize: 11, color: isExcluded ? '#FF6B6B' : '#00C8D7', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                      {ing.quantity} {ing.unit}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {ings.length > SHOW && (
            <p style={{ fontSize: 11, color: thm.textMuted, marginTop: 4, textAlign: 'center' }}>
              +{ings.length - SHOW} ещё · нажмите для деталей
            </p>
          )}
        </div>
      )}

      {/* Подсказка открытия */}
      <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: thm.textMuted, opacity: .6 }}>
        👆 Нажмите для полного рецепта
      </div>
    </div>
  )
}

/* ─── Recipe Modal (overlay) ─── */
function RecipeModal({ r, thm, t, onClose, isAdmin, onDelete, onFavoriteToggle, onRate, excludedIds }) {
  const [showAllIngs, setShowAllIngs] = useState(false)
  const [servings, setServings]       = useState(1)
  const [reviews, setReviews]         = useState(r.reviews || [])
  const [reviewText, setReviewText]   = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)

  const ings  = r.ingredients || []
  const SHOW  = 6
  const diff  = DIFF_COLORS[r.difficulty] || DIFF_COLORS.Easy
  const steps = r.instructions
    ? r.instructions.split('\n').map(l => l.trim()).filter(Boolean)
    : []
  const visibleIngs = showAllIngs ? ings : ings.slice(0, SHOW)

  // Сплошные цвета для модального окна (thm.bgCard — полупрозрачный, плохо выглядит)
  const isDark   = thm.bg === '#0A1428'
  const modalBg  = isDark ? '#0F1D36'               : '#FFFFFF'
  const rowBg    = isDark ? '#132038'               : '#F4F7FC'
  const rowBgEx  = isDark ? 'rgba(255,107,107,.12)' : 'rgba(255,107,107,.07)'
  const bdr      = isDark ? 'rgba(255,255,255,.09)'  : 'rgba(0,0,0,.08)'
  const bdrEx    = 'rgba(255,107,107,.28)'
  const inputBg  = isDark ? '#162240'               : '#F0F4FA'

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: isDark ? 'rgba(0,0,0,.80)' : 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px 60px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 700,
          background: modalBg,
          borderRadius: 22,
          border: `1px solid ${bdr}`,
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,.7)'
            : '0 24px 80px rgba(0,0,0,.18)',
          position: 'relative',
          padding: '28px 28px 36px',
          animation: 'modalIn .18s ease',
        }}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>

        {/* Закрыть */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: thm.textMuted, padding: '4px 8px', lineHeight: 1, borderRadius: 8 }}>✕</button>

        {/* Изображение */}
        {r.image ? (
          <div style={{ width: '100%', height: 240, borderRadius: 16, overflow: 'hidden', marginBottom: 22 }}>
            <img src={r.image} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 64, marginBottom: 16, lineHeight: 1 }}>{RECIPE_EMOJIS[r.id % 8]}</div>
        )}

        {/* Заголовок */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: thm.text, marginBottom: 8, lineHeight: 1.25 }}>{r.title}</h2>

        {/* Рейтинг */}
        {r.avg_rating != null && (
          <div style={{ fontSize: 14, color: '#FFD700', fontWeight: 700, marginBottom: 12 }}>
            {t('rating_avg', r.avg_rating, r.ratings_count)}
          </div>
        )}

        {/* Бейджи */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: diff.bg, color: diff.text }}>{r.difficulty || 'Easy'}</span>
          {r.cooking_time > 0 && <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, background: rowBg, border: `1px solid ${bdr}`, color: thm.textSec }}>⏱ {r.cooking_time} мин</span>}
          {r.calories > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,159,67,.15)', color: '#FF9F43' }}>🔥 {r.calories} ккал</span>}
          {!r.is_moderated && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,159,67,.15)', color: '#FF9F43' }}>⏳ {t('admin_pending')}</span>}
          <span style={{ fontSize: 11, color: thm.textMuted, padding: '4px 8px' }}>👤 {r.author_name}</span>
        </div>

        {/* Описание */}
        {r.description && (
          <p style={{ fontSize: 14, color: thm.textSec, lineHeight: 1.7, marginBottom: 22 }}>{r.description}</p>
        )}

        {/* КБЖУ */}
        {(r.calories > 0 || r.protein > 0 || r.carbs > 0 || r.fat > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderRadius: 14, overflow: 'hidden', border: `1px solid ${bdr}`, marginBottom: 22 }}>
            {[
              { label: 'Ккал',   value: Math.round(r.calories * servings),            color: '#FF9F43', unit: '' },
              { label: 'Белки',  value: Math.round(r.protein  * servings * 10) / 10,  color: '#00D68F', unit: 'г' },
              { label: 'Углев.', value: Math.round(r.carbs    * servings * 10) / 10,  color: '#7B5EFF', unit: 'г' },
              { label: 'Жиры',   value: Math.round(r.fat      * servings * 10) / 10,  color: '#00C8D7', unit: 'г' },
            ].map(({ label, value, color, unit }, i) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px 4px', background: rowBg, borderRight: i < 3 ? `1px solid ${bdr}` : 'none' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1 }}>{value}<span style={{ fontSize: 10, opacity: .7 }}>{unit}</span></div>
                <div style={{ fontSize: 9, color: thm.textMuted, fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Порции */}
        <div style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>🍽️ Порций</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[0.5, 1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setServings(n)} style={{
                padding: '6px 16px', borderRadius: 8,
                border: `1px solid ${servings === n ? 'rgba(0,200,215,.5)' : bdr}`,
                background: servings === n ? 'rgba(0,200,215,.18)' : rowBg,
                color: servings === n ? '#00C8D7' : thm.textSec,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}>
                {n === 0.5 ? '½' : `×${n}`}
              </button>
            ))}
          </div>
        </div>

        {/* Ингредиенты */}
        {ings.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.07em' }}>🥕 {t('recipe_field_ingredients')}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {(excludedIds || []).some(id => ings.some(i => i.ingredient_id === id)) && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,107,107,.15)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,.3)' }}>
                    ⚠️ {ings.filter(i => (excludedIds || []).includes(i.ingredient_id)).length} искл.
                  </span>
                )}
                <span style={{ fontSize: 10, color: thm.textMuted, fontWeight: 600 }}>{ings.length} шт.</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {visibleIngs.map((ing, i) => {
                const isExcluded = (excludedIds || []).includes(ing.ingredient_id)
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 9, background: isExcluded ? rowBgEx : rowBg, border: `1px solid ${isExcluded ? bdrEx : bdr}` }}>
                    <span style={{ fontSize: 13, color: isExcluded ? '#FF6B6B' : thm.text, fontWeight: isExcluded ? 700 : 400, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {isExcluded && <span>⚠️</span>}
                      {ing.ingredient_name}
                    </span>
                    {ing.quantity > 0 && (
                      <span style={{ fontSize: 12, color: isExcluded ? '#FF6B6B' : '#00C8D7', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                        {servings !== 1 ? Math.round(ing.quantity * servings * 10) / 10 : ing.quantity} {ing.unit}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            {ings.length > SHOW && (
              <button onClick={() => setShowAllIngs(s => !s)} style={{ marginTop: 8, width: '100%', padding: '7px', borderRadius: 9, border: `1px dashed ${bdr}`, background: 'transparent', color: thm.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {showAllIngs ? '▲ Свернуть' : `▼ Ещё ${ings.length - SHOW} ингредиентов`}
              </button>
            )}
          </div>
        )}

        {/* Инструкция */}
        <div style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 14 }}>📋 {t('recipe_instructions_label')}</p>
          {steps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {steps.map((line, i) => {
                const m = line.match(/^(Шаг\s*\d+)[.:\s]*(.*)$/i)
                return m ? (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 7, background: isDark ? 'rgba(0,200,215,.15)' : 'rgba(0,200,215,.12)', color: '#00C8D7', flexShrink: 0, whiteSpace: 'nowrap', marginTop: 2 }}>{m[1]}</span>
                    <p style={{ fontSize: 14, color: thm.text, lineHeight: 1.7, margin: 0 }}>{m[2]}</p>
                  </div>
                ) : (
                  <p key={i} style={{ fontSize: 14, color: thm.text, lineHeight: 1.7, margin: 0 }}>{line}</p>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: thm.textSec, fontStyle: 'italic' }}>{t('recipe_no_instructions')}</p>
          )}
        </div>

        {/* Рейтинг (звёзды) */}
        {onRate && (
          <div style={{ marginBottom: 22, paddingTop: 18, borderTop: `1px solid ${bdr}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>⭐ {t('rating_your')}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => onRate(r.id, star)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                  fontSize: 28, lineHeight: 1,
                  color: (r.user_rating != null && star <= r.user_rating) ? '#FFD700' : thm.textMuted,
                  filter: (r.user_rating != null && star <= r.user_rating) ? 'none' : 'grayscale(1) opacity(0.35)',
                  transition: 'all .15s',
                }}>★</button>
              ))}
            </div>
          </div>
        )}

        {/* Отзывы */}
        <div style={{ paddingTop: 18, borderTop: `1px solid ${bdr}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
            💬 Отзывы {reviews.length > 0 ? `(${reviews.length})` : ''}
          </p>
          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {reviews.map(rev => (
                <div key={rev.id} style={{ padding: '10px 14px', borderRadius: 10, background: rowBg, border: `1px solid ${bdr}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#00C8D7' }}>@{rev.username}</span>
                    <span style={{ fontSize: 11, color: thm.textMuted }}>{new Date(rev.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <p style={{ fontSize: 13, color: thm.text, lineHeight: 1.55, margin: 0 }}>{rev.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: thm.textMuted, marginBottom: 12 }}>Отзывов пока нет. Оставьте первый!</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Напишите отзыв..."
              rows={2}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1px solid ${bdr}`, background: inputBg, color: thm.inputText, fontSize: 13, outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif" }}
            />
            <button
              onClick={async () => {
                if (!reviewText.trim() || reviewSaving) return
                setReviewSaving(true)
                const res = await fetch(`/api/recipes/recipes/${r.id}/reviews/`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: reviewText.trim() }),
                })
                if (res.ok) {
                  const data = await res.json()
                  setReviews(prev => [data, ...prev])
                  setReviewText('')
                }
                setReviewSaving(false)
              }}
              disabled={reviewSaving || !reviewText.trim()}
              style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: reviewText.trim() ? 'linear-gradient(135deg,#00C8D7,#7B5EFF)' : rowBg, color: reviewText.trim() ? '#fff' : thm.textMuted, fontSize: 14, fontWeight: 700, cursor: reviewText.trim() ? 'pointer' : 'default', fontFamily: "'Inter', sans-serif" }}>
              {reviewSaving ? '...' : '→'}
            </button>
          </div>
        </div>

        {/* Избранное / удалить */}
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#FF6B6B' }}>
            {r.rejection_reason ? `❌ Причина отклонения: ${r.rejection_reason}` : ''}
          </span>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {onFavoriteToggle && (
              <button onClick={() => onFavoriteToggle(r.id)} style={{
                padding: '9px 18px', borderRadius: 11,
                border: `1px solid ${r.is_favorite ? 'rgba(255,107,107,.35)' : bdr}`,
                background: r.is_favorite ? 'rgba(255,107,107,.15)' : rowBg,
                color: r.is_favorite ? '#FF6B6B' : thm.textSec,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}>
                {r.is_favorite ? '❤️ В избранном' : '🤍 В избранное'}
              </button>
            )}
            {isAdmin && onDelete && (
              <button onClick={() => { onDelete(r.id); onClose() }} style={{ padding: '9px 18px', borderRadius: 11, border: '1px solid rgba(255,107,107,.3)', background: 'rgba(255,107,107,.12)', color: '#FF6B6B', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                🗑 {t('admin_delete')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Форматирует Date в локальную строку YYYY-MM-DD (без UTC-сдвига)
function toLocalISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Парсит строку 'YYYY-MM-DD' как локальную дату (без UTC-сдвига)
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getWeekDays(startDate) {
  const [y, m, d] = startDate.split('-').map(Number)
  return Array.from({ length: 7 }, (_, i) => toLocalISO(new Date(y, m - 1, d + i)))
}

function formatDayHeader(dateStr, lang) {
  const date = parseLocalDate(dateStr)
  const dayNames = lang === 'ru'
    ? ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const monthNames = lang === 'ru'
    ? ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return {
    day:   dayNames[date.getDay()],
    date:  date.getDate(),
    month: monthNames[date.getMonth()],
  }
}

function getMondayOfWeek() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return toLocalISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff))
}

/* ─── Tab: Meal Plans ─── */
function TabMealPlans({ plans, setPlans, recipes, thm, t, st, user, onGoToProfile }) {
  const { lang } = useApp()
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSlot, setPickerSlot] = useState(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [createStart, setCreateStart] = useState(getMondayOfWeek)
  const [createError,  setCreateError]  = useState('')
  const [showUpgrade,  setShowUpgrade]  = useState(false)
  const [createEnd, setCreateEnd]   = useState(() => {
    const monday = getMondayOfWeek()
    const [y, m, d] = monday.split('-').map(Number)
    return toLocalISO(new Date(y, m - 1, d + 6))
  })

  const isFree = !user?.role || user.role === 'USER' || user.role === 'free'

  const MEAL_TYPES = [
    { key: 'Breakfast', label: t('plan_meal_breakfast'), rowBg: 'rgba(255,159,67,.04)' },
    { key: 'Lunch',     label: t('plan_meal_lunch'),     rowBg: 'rgba(0,200,215,.04)'  },
    { key: 'Dinner',    label: t('plan_meal_dinner'),    rowBg: 'rgba(123,94,255,.04)' },
  ]

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' })

  const createPlan = async () => {
    setCreateError('')
    // Клиентская проверка лимита 1 неделя для Free
    if (isFree) {
      const [sy, sm, sd] = createStart.split('-').map(Number)
      const [ey, em, ed] = createEnd.split('-').map(Number)
      const diffDays = Math.round((new Date(ey, em-1, ed) - new Date(sy, sm-1, sd)) / 86400000)
      if (diffDays > 6) {
        setCreateError('FREE_PLAN_WEEK_LIMIT')
        return
      }
    }
    const res = await fetch('/api/mealplan/plans/', {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ start_date: createStart, end_date: createEnd }),
    })
    if (res.ok) {
      const data = await res.json()
      setPlans(prev => [data, ...prev])
      setSelectedPlanId(data.id)
      setShowCreateForm(false)
    } else {
      const err = await res.json()
      if (JSON.stringify(err).includes('FREE_PLAN_WEEK_LIMIT')) setCreateError('FREE_PLAN_WEEK_LIMIT')
    }
  }

  const addRecipeToSlot = async (planId, recipeId, date, mealType) => {
    const res = await fetch(`/api/mealplan/plans/${planId}/add_recipe/`, {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ recipe_id: recipeId, date, meal_type: mealType }),
    })
    if (res.ok) {
      const slot = await res.json()
      setPlans(prev => prev.map(p => p.id === planId
        ? { ...p, recipes: [...(p.recipes || []), slot] } : p
      ))
    }
  }

  const removeFromSlot = async (planId, slotId) => {
    await fetch(`/api/mealplan/plans/${planId}/remove_recipe/${slotId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    setPlans(prev => prev.map(p => p.id === planId
      ? { ...p, recipes: (p.recipes || []).filter(r => r.id !== slotId) } : p
    ))
  }

  const deletePlan = async (planId) => {
    if (!window.confirm(t('plan_confirm_delete'))) return
    await fetch(`/api/mealplan/plans/${planId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    setPlans(prev => prev.filter(p => p.id !== planId))
    if (selectedPlanId === planId) setSelectedPlanId(null)
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  const inp = {
    padding: '10px 12px', borderRadius: 10,
    border: `1px solid ${thm.inputBorder}`,
    background: thm.input, color: thm.inputText,
    fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif",
  }

  /* ── Create Plan Modal ── */
  if (showCreateForm) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && setShowCreateForm(false)}>
      <div style={{ width: '100%', maxWidth: 440, background: thm.bg, border: `1px solid ${thm.border}`, borderRadius: 20, padding: '32px 36px', boxShadow: thm.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: thm.text }}>📅 {t('plan_create')}</h2>
          <button onClick={() => setShowCreateForm(false)} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: thm.textSec }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: thm.textSec }}>
            {t('plan_new_start')}
            <input type="date" style={inp} value={createStart} onChange={e => setCreateStart(e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: thm.textSec }}>
            {t('plan_new_end')}
            <input type="date" style={inp} value={createEnd} onChange={e => setCreateEnd(e.target.value)} />
          </label>
          {/* Free plan hint */}
          {isFree && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,159,67,.08)', border: '1px solid rgba(255,159,67,.2)', fontSize: 12, color: '#FF9F43', fontWeight: 600 }}>
              🆓 Бесплатный тариф: только 1 неделя (7 дней)
            </div>
          )}
          {createError === 'FREE_PLAN_WEEK_LIMIT' && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,107,107,.08)', border: '1px solid rgba(255,107,107,.25)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#FF6B6B', marginBottom: 4 }}>🚫 Превышен лимит бесплатного тарифа</p>
              <p style={{ fontSize: 12, color: thm.textSec, marginBottom: 10 }}>На тарифе Free можно создавать планы только на 1 неделю (7 дней).</p>
              <button onClick={() => { setShowCreateForm(false); setShowUpgrade(true) }} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#00C8D7,#7B5EFF)', color: '#0A1428', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                ⚡ Перейти на Pro
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => { setShowCreateForm(false); setCreateError('') }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>{t('plan_new_cancel')}</button>
            <button onClick={createPlan} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00C8D7,#7B5EFF)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>{t('plan_new_save')}</button>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── Recipe Picker Modal ── */
  if (showPicker && pickerSlot) {
    const filteredPicker = recipes.filter(r => r.title.toLowerCase().includes(pickerSearch.toLowerCase()))
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        onClick={e => e.target === e.currentTarget && setShowPicker(false)}>
        <div style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', background: thm.bg, border: `1px solid ${thm.border}`, borderRadius: 20, display: 'flex', flexDirection: 'column', boxShadow: thm.shadow, overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px 16px', borderBottom: `1px solid ${thm.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: thm.text }}>🍴 {t('plan_picker_title')}</h2>
              <button onClick={() => setShowPicker(false)} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: thm.textSec }}>✕</button>
            </div>
            <input type="text" placeholder={t('plan_picker_search')} value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus style={{ ...inp, width: '100%' }} />
          </div>
          <div style={{ overflowY: 'auto', padding: '16px 28px 24px' }}>
            {filteredPicker.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: thm.textSec }}><span style={{ fontSize: 40 }}>🔍</span><p style={{ marginTop: 12 }}>{t('empty_recipes')}</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {filteredPicker.map(r => (
                  <div key={r.id}
                    onClick={() => { addRecipeToSlot(selectedPlanId, r.id, pickerSlot.date, pickerSlot.meal_type); setShowPicker(false); setPickerSearch('') }}
                    style={{ padding: 12, borderRadius: 12, cursor: 'pointer', background: thm.bgCard, border: `1px solid ${thm.border}`, transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#00C8D7'; e.currentTarget.style.background = thm.bgCardHover }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = thm.border; e.currentTarget.style.background = thm.bgCard }}
                  >
                    {r.image
                      ? <div style={{ width: '100%', height: 80, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}><img src={r.image} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                      : <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8, lineHeight: 1 }}>{RECIPE_EMOJIS[r.id % 8]}</div>
                    }
                    <p style={{ fontSize: 13, fontWeight: 700, color: thm.text, lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.title}</p>
                    {r.calories > 0 && <p style={{ fontSize: 11, color: '#FF9F43', fontWeight: 600 }}>🔥 {r.calories} {t('plan_kcal')}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Calendar View ── */
  if (selectedPlan) {
    const weekDays = getWeekDays(selectedPlan.start_date)
    const planRecipes = selectedPlan.recipes || []
    const getSlots = (date, mealType) => planRecipes.filter(r => r.date === date && r.meal_type === mealType)
    const getDayCalories = (date) => planRecipes.filter(r => r.date === date).reduce((s, r) => s + (r.recipe_calories || 0), 0)
    const totalWeekCal = planRecipes.reduce((s, r) => s + (r.recipe_calories || 0), 0)

    const printPlan = () => {
      const MEAL_LABELS = { Breakfast: lang === 'ru' ? 'Завтрак' : 'Breakfast', Lunch: lang === 'ru' ? 'Обед' : 'Lunch', Dinner: lang === 'ru' ? 'Ужин' : 'Dinner' }
      const DAY_NAMES = lang === 'ru' ? ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      const MONTH_NAMES = lang === 'ru' ? ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const rows = ['Breakfast','Lunch','Dinner'].map(mt => {
        const cols = weekDays.map(date => {
          const slots = planRecipes.filter(r => r.date === date && r.meal_type === mt)
          return `<td style="border:1px solid #ddd;padding:8px;vertical-align:top;min-width:100px">${slots.map(s => `<div style="font-size:12px;margin-bottom:4px">🍽 ${s.recipe_title}${s.recipe_calories ? `<br><span style="color:#888;font-size:11px">🔥${s.recipe_calories} ккал</span>` : ''}</div>`).join('') || '<span style="color:#ccc;font-size:11px">—</span>'}</td>`
        }).join('')
        return `<tr><td style="border:1px solid #ddd;padding:8px;font-weight:700;background:#f9f9f9;white-space:nowrap">${MEAL_LABELS[mt]}</td>${cols}</tr>`
      }).join('')
      const headers = weekDays.map(date => {
        const d = parseLocalDate(date)
        return `<th style="border:1px solid #ddd;padding:8px;text-align:center;background:#f0f0f0">${DAY_NAMES[d.getDay()]}<br><strong>${d.getDate()}</strong><br><span style="font-size:11px">${MONTH_NAMES[d.getMonth()]}</span></th>`
      }).join('')
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>EDA2DA — ${selectedPlan.start_date}</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{font-size:20px;margin-bottom:4px}p{color:#666;font-size:13px;margin-bottom:16px}table{border-collapse:collapse;width:100%}@media print{body{padding:0}}</style></head><body><h1>📅 ${lang === 'ru' ? 'План питания' : 'Meal Plan'}: ${selectedPlan.start_date} — ${selectedPlan.end_date}</h1><p>${lang === 'ru' ? 'Итого за неделю' : 'Weekly total'}: 🔥 ${totalWeekCal} ${lang === 'ru' ? 'ккал' : 'kcal'}</p><table><thead><tr><th style="border:1px solid #ddd;padding:8px;background:#f0f0f0"></th>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`
      const w = window.open('', '_blank')
      w.document.write(html)
      w.document.close()
      w.print()
    }

    return (
      <>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <button onClick={() => setSelectedPlanId(null)} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>{t('plan_back')}</button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: thm.text }}>{t('plan_week_of', selectedPlan.start_date)}</h2>
            <p style={{ fontSize: 13, color: thm.textSec, marginTop: 2 }}>{selectedPlan.start_date} — {selectedPlan.end_date}</p>
          </div>
          {/* Кнопка печати — только Pro/Family */}
          {!isFree ? (
            <button onClick={printPlan} style={{ padding: '8px 18px', borderRadius: 10, border: `1px solid rgba(0,200,215,.3)`, background: 'rgba(0,200,215,.1)', color: '#00C8D7', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              🖨️ {lang === 'ru' ? 'Печать плана' : 'Print Plan'}
            </button>
          ) : (
            <button onClick={() => setShowUpgrade(true)} style={{ padding: '8px 18px', borderRadius: 10, border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6, opacity: 0.6 }}>
              🔒 {lang === 'ru' ? 'Печать (Pro)' : 'Print (Pro)'}
            </button>
          )}
        </div>

        {/* Week summary */}
        <div style={{ padding: '16px 24px', borderRadius: 14, marginBottom: 24, background: 'linear-gradient(135deg,rgba(0,200,215,.08),rgba(123,94,255,.08))', border: '1px solid rgba(0,200,215,.2)', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{t('plan_week_total')}</p>
            <p style={{ fontSize: 26, fontWeight: 900, background: 'linear-gradient(135deg,#00C8D7,#7B5EFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{totalWeekCal} {t('plan_kcal')}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{t('plan_recipes_count', planRecipes.length)}</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: thm.text }}>{planRecipes.length}</p>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ overflowX: 'auto', borderRadius: 16, border: `1px solid ${thm.border}`, background: thm.bgCard }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 980, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 100, padding: '14px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: thm.textSec, textTransform: 'uppercase', letterSpacing: '.07em', borderBottom: `1px solid ${thm.border}`, background: thm.bgCard }}></th>
                {weekDays.map(date => {
                  const hdr = formatDayHeader(date, lang)
                  const cal = getDayCalories(date)
                  return (
                    <th key={date} style={{ minWidth: 140, padding: '12px 8px', borderBottom: `1px solid ${thm.border}`, borderLeft: `1px solid ${thm.border}`, textAlign: 'center', background: thm.bgCard }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: thm.text }}>{hdr.day}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: thm.text, lineHeight: 1.1 }}>{hdr.date}</div>
                      <div style={{ fontSize: 11, color: thm.textSec }}>{hdr.month}</div>
                      {cal > 0 && <div style={{ marginTop: 4, display: 'inline-block', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: 'rgba(255,159,67,.12)', color: '#FF9F43' }}>🔥 {cal}</div>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map(({ key, label, rowBg }) => (
                <tr key={key}>
                  <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: thm.textSec, borderBottom: `1px solid ${thm.border}`, background: rowBg, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{label}</td>
                  {weekDays.map(date => {
                    const slots = getSlots(date, key)
                    return (
                      <td key={date} style={{ padding: 6, borderBottom: `1px solid ${thm.border}`, borderLeft: `1px solid ${thm.border}`, background: rowBg, verticalAlign: 'top' }}>
                        <div style={{ minHeight: 88, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {slots.map(slot => (
                            <div key={slot.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: thm.bg, border: `1px solid ${thm.borderBright}`, padding: '6px 8px' }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                {slot.recipe_image
                                  ? <img src={slot.recipe_image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                                  : <div style={{ width: 36, height: 36, borderRadius: 6, background: thm.shopBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🍽️</div>
                                }
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 11, fontWeight: 700, color: thm.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.recipe_title}</p>
                                  {slot.recipe_calories > 0 && <p style={{ fontSize: 10, color: '#FF9F43', fontWeight: 600 }}>🔥 {slot.recipe_calories}</p>}
                                </div>
                              </div>
                              <button onClick={() => removeFromSlot(selectedPlan.id, slot.id)}
                                style={{ position: 'absolute', top: 3, right: 4, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(255,107,107,.2)', color: '#FF6B6B', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: "'Inter', sans-serif" }}
                              >×</button>
                            </div>
                          ))}
                          <button
                            onClick={() => { setPickerSlot({ date, meal_type: key }); setShowPicker(true) }}
                            style={{ width: '100%', minHeight: slots.length > 0 ? 28 : 72, borderRadius: 10, border: `1.5px dashed ${thm.borderBright}`, background: 'transparent', color: thm.textMuted, fontSize: slots.length > 0 ? 12 : 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', fontFamily: "'Inter', sans-serif" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00C8D7'; e.currentTarget.style.color = '#00C8D7' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = thm.borderBright; e.currentTarget.style.color = thm.textMuted }}
                          >
                            {slots.length > 0 ? `+ ${t('plan_slot_add')}` : '+'}
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUpgrade && <UpgradeModal thm={thm} t={t} onClose={() => setShowUpgrade(false)} reason="plans" onGoToProfile={onGoToProfile} />}
      </>
    )
  }

  /* ── Plan List View ── */
  return (
    <div>
      <div style={st.sectionHeader}>
        <h2 style={st.sectionTitle}>{t('sec_plans_count', plans.length)}</h2>
        <button style={st.addBtn} onClick={() => setShowCreateForm(true)}>{t('plan_create_btn')}</button>
      </div>
      {plans.length === 0 ? (
        <div style={{ ...st.empty, padding: '64px 24px' }}>
          <span style={{ fontSize: 56 }}>📅</span>
          <p style={{ color: thm.text, fontWeight: 700, fontSize: 18, marginTop: 16 }}>{t('plan_no_plans')}</p>
          <p style={{ color: thm.textSec, marginTop: 8, marginBottom: 24 }}>{t('plan_no_plans_sub')}</p>
          <button onClick={() => setShowCreateForm(true)} style={st.addBtn}>{t('plan_create_btn')}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plans.map(p => {
            const recipeCount = (p.recipes || []).length
            const totalCal = (p.recipes || []).reduce((s, r) => s + (r.recipe_calories || 0), 0)
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', background: thm.bgCard, border: `1px solid ${thm.border}`, borderRadius: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: 'linear-gradient(135deg,rgba(0,200,215,.15),rgba(123,94,255,.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📅</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: thm.text }}>{t('plan_week_of', p.start_date)}</p>
                  <p style={{ fontSize: 13, color: thm.textSec, marginTop: 2 }}>{p.start_date} — {p.end_date}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(0,200,215,.1)', color: '#00C8D7', fontWeight: 600 }}>{t('plan_recipes_count', recipeCount)}</span>
                    {totalCal > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,159,67,.1)', color: '#FF9F43', fontWeight: 600 }}>🔥 {totalCal} {t('plan_kcal')}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setSelectedPlanId(p.id)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(0,200,215,.3)', background: 'rgba(0,200,215,.08)', color: '#00C8D7', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>{t('plan_open')}</button>
                  <button onClick={() => deletePlan(p.id)} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,107,107,.25)', background: 'rgba(255,107,107,.06)', color: '#FF6B6B', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showUpgrade && <UpgradeModal thm={thm} t={t} onClose={() => setShowUpgrade(false)} reason="plans" onGoToProfile={onGoToProfile} />}
    </div>
  )
}

/* ─── Tab: Shopping ─── */
function TabShopping({ plans, thm, t, st }) {
  const [selectedPlanId, setSelectedPlanId] = useState('all')
  const [items,    setItems]    = useState([])
  const [checked,  setChecked]  = useState({})   // key: item index → bool
  const [loading,  setLoading]  = useState(false)
  const [customInput, setCustomInput] = useState('')

  const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

  // Загружаем список при смене выбранного плана
  useEffect(() => {
    if (plans.length === 0) return
    setLoading(true)
    setChecked({})

    const fetchPlan = (id) =>
      fetch(`/api/mealplan/plans/${id}/shopping_list/`, { headers: authH() })
        .then(r => r.ok ? r.json() : [])

    const promise = selectedPlanId === 'all'
      ? Promise.all(plans.map(p => fetchPlan(p.id))).then(results => {
          // Объединяем и суммируем одинаковые ингредиенты
          const agg = {}
          results.flat().forEach(item => {
            const key = `${item.name}|${item.unit}`
            if (!agg[key]) agg[key] = { ...item }
            else agg[key].quantity = Math.round((agg[key].quantity + item.quantity) * 100) / 100
          })
          return Object.values(agg).sort((a, b) => a.name.localeCompare(b.name))
        })
      : fetchPlan(Number(selectedPlanId))

    promise.then(data => setItems(Array.isArray(data) ? data : []))
           .finally(() => setLoading(false))
  }, [selectedPlanId, plans.length])

  const toggleCheck = (i) => setChecked(c => ({ ...c, [i]: !c[i] }))
  const checkedCount = Object.values(checked).filter(Boolean).length
  const uncheckAll   = () => setChecked({})
  const checkAll     = () => {
    const all = {}
    items.forEach((_, i) => { all[i] = true })
    setChecked(all)
  }

  const addCustom = () => {
    const name = customInput.trim()
    if (!name) return
    setItems(prev => [...prev, { name, unit: '', quantity: null, _custom: true }])
    setCustomInput('')
  }

  const removeCustom = (i) => {
    setItems(prev => prev.filter((_, idx) => idx !== i))
    setChecked(c => { const n = { ...c }; delete n[i]; return n })
  }

  if (plans.length === 0) return (
    <div style={st.empty}>
      <span style={{ fontSize: 48 }}>🛒</span>
      <p style={{ color: thm.text, fontWeight: 700, fontSize: 16, marginTop: 16 }}>{t('shop_no_plans')}</p>
      <p style={{ color: thm.textSec, marginTop: 8 }}>{t('shop_no_plans_sub')}</p>
    </div>
  )

  const progressPct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0

  return (
    <div style={{ maxWidth: 700 }}>

      {/* ── Селектор плана ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button onClick={() => setSelectedPlanId('all')} style={{
          padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          border: `1px solid ${selectedPlanId === 'all' ? 'rgba(0,200,215,.4)' : thm.border}`,
          background: selectedPlanId === 'all' ? 'rgba(0,200,215,.1)' : 'transparent',
          color: selectedPlanId === 'all' ? '#00C8D7' : thm.textSec,
          fontFamily: "'Inter', sans-serif",
        }}>{t('shop_all_plans')}</button>
        {plans.map(p => (
          <button key={p.id} onClick={() => setSelectedPlanId(String(p.id))} style={{
            padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${selectedPlanId === String(p.id) ? 'rgba(0,200,215,.4)' : thm.border}`,
            background: selectedPlanId === String(p.id) ? 'rgba(0,200,215,.1)' : 'transparent',
            color: selectedPlanId === String(p.id) ? '#00C8D7' : thm.textSec,
            fontFamily: "'Inter', sans-serif",
          }}>📅 {p.start_date}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div style={spinnerStyle} /></div>
      ) : items.length === 0 ? (
        <div style={st.empty}>
          <span style={{ fontSize: 48 }}>🛒</span>
          <p style={{ color: thm.textSec, marginTop: 12 }}>{t('shop_empty')}</p>
        </div>
      ) : (
        <>
          {/* ── Прогресс ── */}
          <div style={{ padding: '18px 22px', borderRadius: 16, background: thm.bgCard, border: `1px solid ${thm.border}`, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: thm.text }}>
                {t('shop_progress', checkedCount, items.length)}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={checkAll} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, border: `1px solid ${thm.border}`, background: 'transparent', color: thm.textSec, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  {t('shop_check_all')}
                </button>
                <button onClick={uncheckAll} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, border: `1px solid ${thm.border}`, background: 'transparent', color: thm.textSec, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  {t('shop_uncheck_all')}
                </button>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 100, background: thm.barBg, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 100, width: `${progressPct}%`, background: 'linear-gradient(90deg,#00C8D7,#00D68F)', transition: 'width .4s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: thm.textMuted, marginTop: 6 }}>{progressPct}% {t('shop_done')}</div>
          </div>

          {/* ── Список ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {items.map((item, i) => (
              <div key={i}
                onClick={() => toggleCheck(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
                  borderRadius: 12, cursor: 'pointer',
                  background: checked[i] ? 'transparent' : thm.bgCard,
                  border: `1px solid ${checked[i] ? thm.border : thm.shopBorder}`,
                  opacity: checked[i] ? 0.45 : 1,
                  transition: 'all .2s',
                }}
              >
                {/* Чекбокс */}
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${checked[i] ? '#00D68F' : thm.borderBright}`,
                  background: checked[i] ? '#00D68F' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}>
                  {checked[i] && <span style={{ color: '#fff', fontSize: 13, lineHeight: 1 }}>✓</span>}
                </div>

                {/* Название */}
                <span style={{
                  fontSize: 14, fontWeight: 500, flex: 1, color: thm.text,
                  textDecoration: checked[i] ? 'line-through' : 'none',
                  transition: 'all .2s',
                }}>
                  {item.name}
                </span>

                {/* Количество */}
                {item.quantity != null && item.quantity > 0 && (
                  <span style={{ fontSize: 13, color: '#00C8D7', fontWeight: 700, flexShrink: 0 }}>
                    {item.quantity} {item.unit}
                  </span>
                )}

                {/* Удалить кастомный */}
                {item._custom && (
                  <button onClick={e => { e.stopPropagation(); removeCustom(i) }} style={{ background: 'none', border: 'none', color: thm.textMuted, cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                )}
              </div>
            ))}
          </div>

          {/* ── Добавить своё ── */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder={t('shop_add_custom_ph')}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${thm.inputBorder}`, background: thm.input, color: thm.inputText, fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif" }}
            />
            <button onClick={addCustom} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(0,200,215,.3)', background: 'rgba(0,200,215,.08)', color: '#00C8D7', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              + {t('shop_add_custom')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Tab: Nutrition ─── */
function TabNutrition({ recipes, thm, t, st }) {
  const n = Math.max(recipes.length, 1)
  const withCal = recipes.filter(r => r.calories)
  const avg = withCal.length ? Math.round(withCal.reduce((s,r)=>s+r.calories,0)/withCal.length) : 0
  const bars = [
    { label: t('mac_calories'), value: avg, max: 800, color: '#FF9F43', unit: 'kcal' },
    { label: t('mac_protein'),  value: recipes.reduce((s,r)=>s+(r.protein||0),0)/n|0, max: 50,  color: '#00D68F', unit: 'g' },
    { label: t('mac_carbs'),    value: recipes.reduce((s,r)=>s+(r.carbs||0),0)/n|0,   max: 120, color: '#7B5EFF', unit: 'g' },
    { label: t('mac_fat'),      value: recipes.reduce((s,r)=>s+(r.fat||0),0)/n|0,     max: 40,  color: '#00C8D7', unit: 'g' },
  ]
  return (
    <div>
      <div style={st.statsRow}>
        {[
          { icon: '🔥', value: `${avg} kcal`, label: t('stat_avg_per') },
          { icon: '💪', value: `${bars[1].value}g`, label: t('stat_protein') },
          { icon: '🌾', value: `${bars[2].value}g`, label: t('stat_carbs') },
          { icon: '🧈', value: `${bars[3].value}g`, label: t('stat_fat') },
        ].map(({ icon, value, label }) => (
          <div key={label} style={st.statCard}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-.03em', background: thm.statGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</span>
            <span style={{ fontSize: 12, color: thm.textSec, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ ...st.sectionHeader, marginTop: 32 }}>
        <h2 style={st.sectionTitle}>{t('sec_macros')}</h2>
        <span style={{ fontSize: 12, color: thm.textSec }}>{t('sec_macros_sub', withCal.length)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
        {bars.map(({ label, value, max, color, unit }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: thm.text }}>{label}</span>
              <span style={{ fontSize: 14, color, fontWeight: 700 }}>{value} {unit}</span>
            </div>
            <div style={{ height: 10, borderRadius: 100, background: thm.barBg, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 100, background: `linear-gradient(90deg,${color},${color}88)`, width: `${Math.min((value/max)*100,100)}%`, transition: 'width .8s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Shared ─── */
function RecipeGrid({ recipes, thm, t, st, emptyIcon = '🍳', emptyText }) {
  const [modalRecipe, setModalRecipe] = useState(null)

  if (recipes.length === 0) return (
    <div style={st.empty}>
      <span style={{ fontSize: 48 }}>{emptyIcon}</span>
      <p style={{ color: thm.textSec, marginTop: 12 }}>{emptyText || t('empty_recipes')}</p>
    </div>
  )
  return (
    <>
      <div style={st.recipeGrid}>
        {recipes.map(r => (
          <RecipeCard key={r.id} r={r} thm={thm} t={t} st={st} onToggle={() => setModalRecipe(r)} />
        ))}
      </div>
      {modalRecipe && (
        <RecipeModal r={modalRecipe} thm={thm} t={t} onClose={() => setModalRecipe(null)} />
      )}
    </>
  )
}

function PlanList({ plans, thm, t, st }) {
  if (plans.length === 0) return (
    <div style={st.empty}><span style={{ fontSize: 48 }}>📅</span><p style={{ color: thm.textSec, marginTop: 12 }}>{t('empty_plans')}</p></div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {plans.map(p => (
        <div key={p.id} style={st.planCard}>
          <div style={{ fontSize: 28 }}>📅</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: thm.text }}>{p.start_date} → {p.end_date}</p>
            <p style={{ fontSize: 12, color: thm.textSec, marginTop: 2 }}>Meal Plan #{p.id}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Стили ─── */
const spinnerStyle = {
  width: 40, height: 40, borderRadius: '50%',
  border: '3px solid rgba(128,128,128,.2)',
  borderTopColor: '#00C8D7', animation: 'spin 0.8s linear infinite',
}
const gradStyle = {
  background: 'linear-gradient(135deg,#00F0FF,#7B5EFF)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
}

function makeStyles(thm) {
  return {
    sidebar: {
      width: 240, minWidth: 240, maxWidth: 240, flexShrink: 0, flexGrow: 0,
      background: thm.sidebar,
      borderRight: `1px solid ${thm.sidebarBorder}`,
      display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 8,
      transition: 'background .3s',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    },
    logoWrap: { display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 24, textDecoration: 'none' },
    logoImg:  { width: 32, height: 36, objectFit: 'contain' },
    navItem: {
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      borderRadius: 10, fontSize: 14, fontWeight: 500, color: thm.navText, cursor: 'pointer', transition: 'all .2s',
    },
    navItemActive: {
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      borderRadius: 10, fontSize: 14, fontWeight: 600, color: thm.navActiveText, cursor: 'pointer',
      background: thm.navActive, border: `1px solid ${thm.navActiveBorder}`,
    },
    settingsBar: { display: 'flex', gap: 6, marginTop: 8, marginBottom: 4 },
    toggleBtn: {
      flex: 1, padding: '8px 6px', borderRadius: 10,
      border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.textSec,
      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
      fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    logoutBtn: {
      padding: '10px 12px', borderRadius: 10, border: `1px solid ${thm.logoutBorder}`,
      background: 'transparent', color: thm.logoutColor, fontSize: 13, cursor: 'pointer',
      transition: 'all .2s', textAlign: 'left', fontFamily: "'Inter', sans-serif",
    },
    main:   { flex: 1, minWidth: 0, padding: '36px 40px', overflowY: 'auto', height: '100vh' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 },
    statCard: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px',
      background: thm.bgCard, border: `1px solid ${thm.border}`, borderRadius: 16, textAlign: 'center', gap: 6,
      transition: 'background .3s',
    },
    sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    sectionTitle:  { fontSize: 20, fontWeight: 700, color: thm.text },
    searchInput: {
      padding: '9px 14px', borderRadius: 10, fontSize: 14, outline: 'none',
      fontFamily: "'Inter', sans-serif", width: 200, transition: 'background .3s',
    },
    searchBtn: { padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14, transition: 'background .3s' },
    addBtn: {
      padding: '9px 16px', borderRadius: 10,
      border: '1px solid rgba(0,200,215,.3)',
      background: 'rgba(0,200,215,.08)', color: '#00C8D7',
      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
    },
    recipeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
    recipeCard: {
      padding: 20, background: thm.bgCard, border: `1px solid ${thm.border}`,
      borderRadius: 16, cursor: 'pointer', transition: 'all .2s',
    },
    planCard: {
      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
      background: thm.bgCard, border: `1px solid ${thm.border}`, borderRadius: 14, transition: 'background .3s',
    },
    shopItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10 },
    empty: {
      padding: '48px 24px', textAlign: 'center',
      background: thm.bgCard, border: `1px dashed ${thm.emptyBorder}`, borderRadius: 16,
    },
  }
}
