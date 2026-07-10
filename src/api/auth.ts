import axios from 'axios'
import http from '../http'
import type { ApiResult, LoginDTO, LoginVO, RegisterDTO } from '../types/auth'

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'stareye_token'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export function login(payload: LoginDTO) {
    return http.post<ApiResult<LoginVO>>('/user/login', payload).then((res) => res.data.data)
}

export function register(payload: RegisterDTO) {
    return http.post<ApiResult<null>>('/user/register', payload).then((res) => res.data.data)
}

export function logout() {
    return http
        .post<ApiResult<null>>('/user/logout', {})
        .then((res) => res.data.data)
        .catch(async (error) => {
            const msg = error instanceof Error ? error.message : ''
            const token = localStorage.getItem(TOKEN_KEY)

            // 兼容后端仅识别纯 token 头的场景
            if (!token || !msg.includes('请先登录')) {
                throw error
            }

            const pureToken = token.replace(/^Bearer\s+/i, '')
            const retry = await axios.post<ApiResult<null>>(
                `${API_BASE_URL}/user/logout`,
                {},
                {
                    headers: {
                        Authorization: pureToken,
                        token: pureToken,
                        satoken: pureToken,
                    },
                    timeout: 15000,
                },
            )

            const payload = retry.data
            const code = Number(payload?.code)
            if (payload && (code === 0 || code === 200)) {
                return payload.data
            }
            throw new Error(payload?.msg || '退出登录失败')
        })
}
