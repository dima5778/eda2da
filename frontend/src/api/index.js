const BASE = '/api'

const headers = (auth = false) => {
  const h = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = localStorage.getItem('token')
    if (token) h['Authorization'] = `Bearer ${token}`
  }
  return h
}

export const api = {
  register: (data) =>
    fetch(`${BASE}/users/register/`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }),

  login: (data) =>
    fetch(`${BASE}/users/login/`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }),

  me: () =>
    fetch(`${BASE}/users/me/`, { headers: headers(true) }),

  recipes: (search = '') =>
    fetch(`${BASE}/recipes/recipes/${search ? `?search=${search}` : ''}`, { headers: headers(true) }),

  mealPlans: () =>
    fetch(`${BASE}/mealplan/plans/`, { headers: headers(true) }),
}
