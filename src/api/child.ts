import http from '../http'
import type { ApiResult } from '../types/auth'
import type { ChildAddDTO, ChildInfo, ChildUpdateDTO } from '../types/domain'

export function addChild(payload: ChildAddDTO) {
    return http.post<ApiResult<null>>('/child/add', payload).then((res) => res.data.data)
}

export function getChildList() {
    return http.get<ApiResult<ChildInfo[]>>('/child/getlist').then((res) => res.data.data)
}

export function updateChild(payload: ChildUpdateDTO) {
    return http.put<ApiResult<null>>('/child/update', payload).then((res) => res.data.data)
}

export function getChildById(childId: number) {
    return http.get<ApiResult<ChildInfo>>(`/child/get/${childId}`).then((res) => res.data.data)
}

export function deleteChild(childId: number) {
    return http.delete<ApiResult<null>>(`/child/delete/${childId}`).then((res) => res.data.data)
}
