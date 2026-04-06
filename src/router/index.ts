import { createRouter, createWebHistory } from 'vue-router'
import EntryView from '../views/EntryView.vue'
import LoginView from '../views/LoginView.vue'
import LayoutView from '../views/layout.vue'

const TOKEN_KEY = 'stareye_token'
const PUBLIC_PATHS = new Set(['/entry', '/login'])

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/entry',
    },
    {
      path: '/entry',
      name: 'entry',
      component: EntryView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/patient-info',
      name: 'patient-info',
      component: LayoutView,
    },
    {
      path: '/start-detect',
      name: 'start-detect',
      component: LayoutView,
    },
    {
      path: '/start-detect/report',
      name: 'analysis-report',
      component: LayoutView,
    },
    {
      path: '/history-report',
      name: 'history-report',
      component: LayoutView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: LayoutView,
    },
  ],
})

router.beforeEach((to) => {
  if (PUBLIC_PATHS.has(to.path)) {
    return true
  }

  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    return true
  }

  return {
    path: '/login',
    query: { redirect: to.fullPath },
  }
})

export default router
