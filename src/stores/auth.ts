import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, register as registerApi } from '../api/auth'
import type { AppRole, LoginVO } from '../types/auth'

const TOKEN_KEY = 'stareye_token'
const USER_KEY = 'stareye_user'

function getInitialUser(): LoginVO | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) {
        return null
    }
    try {
        return JSON.parse(raw) as LoginVO
    } catch {
        localStorage.removeItem(USER_KEY)
        return null
    }
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem(TOKEN_KEY) ?? '')
    const user = ref<LoginVO | null>(getInitialUser())

    const isLoggedIn = computed(() => Boolean(token.value))

    async function login(phone: string, password: string) {
        const loginData = await loginApi({ phone, password })
        token.value = loginData.token
        user.value = loginData
        localStorage.setItem(TOKEN_KEY, loginData.token)
        localStorage.setItem(USER_KEY, JSON.stringify(loginData))
        return loginData
    }

    async function register(phone: string, password: string, role: AppRole) {
        await registerApi({ phone, password, role })
    }

    async function logout() {
        try {
            await logoutApi(token.value)
        } finally {
            token.value = ''
            user.value = null
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
        }
    }

    return {
        token,
        user,
        isLoggedIn,
        login,
        register,
        logout,
    }
})
