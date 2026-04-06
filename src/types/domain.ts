import type { ApiResult } from './auth'

export interface ChildAddDTO {
    name: string
    gender: 1 | 2
    age: number
    birthDate: string
    idCard: string
}

export interface ChildUpdateDTO extends ChildAddDTO {
    id: number
}

export interface ChildInfo {
    id: number
    parentId: number
    name: string
    age: number
    gender: 1 | 2
    birthDate: string
    idCard: string
}

export interface ChildNameIdDTO {
    name: string
    idCard: string
}

export interface EyeScreenResultVO {
    childId: number
    abnormalProb: number
    riskLevel: 'LOW' | 'MIDDLE' | 'HIGH' | string
    accuracy: number
    testTime: string
}

export interface ScreenRecordVO {
    id: number
    childId: number
    childName: string
    parentId: number
    doctorId: number
    abnormalProb: number
    riskLevel: 'LOW' | 'MIDDLE' | 'HIGH' | string
    accuracy: number
    modelResult: string
    testTime: string
}

export type ResultVoid = ApiResult<null>
export type ResultChildInfo = ApiResult<ChildInfo>
export type ResultListChildInfo = ApiResult<ChildInfo[]>
export type ResultEyeScreenResultVO = ApiResult<EyeScreenResultVO>
export type ResultListScreenRecordVO = ApiResult<ScreenRecordVO[]>
