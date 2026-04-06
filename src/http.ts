import axios from 'axios'
import type { ApiResult } from './types/auth'

const TOKEN_KEY = 'stareye_token'

function isBusinessSuccess(code: unknown) {
    return code === 0 || code === 200 || code === '0' || code === '200'
}

const http = axios.create({
    baseURL: '/api',
    timeout: 15000,
})

http.interceptors.request.use((config) => {
    const rawToken = localStorage.getItem(TOKEN_KEY)
    if (rawToken) {
        const pureToken = rawToken.replace(/^Bearer\s+/i, '')
        const bearerToken = `${pureToken}`

        // 兼容不同后端鉴权方案：有些只认 Authorization，有些只认 token/satoken
        config.headers.Authorization = bearerToken
        config.headers.token = pureToken
        config.headers.satoken = pureToken
    }
    return config
})

http.interceptors.response.use(
    (response) => {
        const payload = response.data as ApiResult<unknown>

        if (payload && 'code' in payload && !isBusinessSuccess(payload.code)) {
            throw new Error(payload.msg || '请求失败')
        }

        return response
    },
    (error) => {
        const apiMsg = error?.response?.data?.msg
        const netMsg = error?.message
        throw new Error(apiMsg || netMsg || '网络异常，请稍后重试')
    },
)

export default http
