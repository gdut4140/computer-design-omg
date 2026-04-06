import type { ApiResult, LoginDTO, LoginVO, RegisterDTO } from '../types/auth'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers ?? {}),
        },
        ...options,
    })

    if (!response.ok) {
        throw new Error(`网络错误: ${response.status}`)
    }

    const payload = (await response.json()) as ApiResult<T>

    if (payload.code !== 0) {
        throw new Error(payload.msg || '请求失败')
    }

    return payload.data
}

export function login(payload: LoginDTO) {
    return request<LoginVO>('/api/user/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function register(payload: RegisterDTO) {
    return request<null>('/api/user/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function logout(token?: string) {
    return request<null>('/api/user/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
}
