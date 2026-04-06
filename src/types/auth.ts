export type AppRole = 1 | 2 | 3

export interface ApiResult<T> {
    code: number
    msg: string
    data: T
}

export interface LoginDTO {
    phone: string
    password: string
}

export interface RegisterDTO {
    phone: string
    password: string
    role: AppRole
}

export interface LoginVO {
    id: number
    username: string
    role: AppRole
    token: string
}
