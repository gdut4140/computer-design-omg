import http from '../http'
import type { ApiResult } from '../types/auth'
import type { ChildNameIdDTO, EyeScreenResultVO, ScreenRecordVO } from '../types/domain'

export function analyzeChildData(childId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return http
        .post<ApiResult<EyeScreenResultVO>>('/record/analyze', formData, {
            params: { childId },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        .then((res) => res.data.data)
}

export function getRecordHistory(childId: number) {
    return http.get<ApiResult<ScreenRecordVO[]>>(`/record/history/${childId}`).then((res) => res.data.data)
}

export function queryRecordByNameId(payload: ChildNameIdDTO) {
    const normalized = {
        name: String(payload.name || '').trim(),
        idCard: String(payload.idCard || '').trim(),
    }

    const asPostBody = () =>
        http.post<ApiResult<ScreenRecordVO[]>>('/record/query', normalized).then((res) => res.data.data)

    const asGetParams = () =>
        http
            .get<ApiResult<ScreenRecordVO[]>>('/record/query', {
                params: normalized,
            })
            .then((res) => res.data.data)

    // Backend implementations may bind this endpoint as GET+params or JSON body.
    // Try body first, then fallback to query params for compatibility.
    return asPostBody().catch(() => asGetParams())
}

export function queryRecordsByUserId() {
    return http.get<ApiResult<ScreenRecordVO[]>>('/record/queryByUserId').then((res) => res.data.data)
}
