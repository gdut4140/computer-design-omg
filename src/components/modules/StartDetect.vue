<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { FullScreen, Loading, ScaleToOriginal, VideoPlay } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getChildList } from '../../api/child'
import { analyzeChildData, getRecordHistory } from '../../api/record'
import type { ChildInfo, EyeScreenResultVO, ScreenRecordVO } from '../../types/domain'

const ANALYSIS_REPORT_RESULT_KEY = 'analysis_report_result_payload'
const FIXED_DATASET_FILE_NAME = 'participant102003_fixation_data.xlsx'
const FIXED_DATASET_URL = `/datasets/autism/participants/${FIXED_DATASET_FILE_NAME}`

type RiskLevel = 'low' | 'mid' | 'high'

interface AnalysisReportPayload {
    child: {
        id: number
        name: string
        age: number
        gender: '男' | '女'
        code: string
    }
    result: EyeScreenResultVO
    datasetLabel: string
}

interface DetectHistory {
    date: string
    risk: string
    rate: string
    level: RiskLevel
}

interface ChildDetectProfile {
    id: string
    name: string
    code: string
    age: number
    gender: '男' | '女'
    progress: number
    elapsed: string
    total: string
    histories: DetectHistory[]
}

const childOptions = ref<ChildDetectProfile[]>([])
const loadingChildren = ref(false)
const analyzing = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const hasStartedVideo = ref(false)
const isVideoPlaying = ref(false)
const videoFinished = ref(false)
const analysisFinished = ref(false)
const reportPayload = ref<AnalysisReportPayload | null>(null)
const videoCurrentTime = ref(0)
const videoDuration = ref(300)
const isExpandedMode = ref(false)
const PREFERRED_CHILD_HINT_KEY = 'preferred_new_child_hint'
const DETECT_VIDEO_SRC = '/media/videos/video.mp4'

const fallbackChild: ChildDetectProfile = {
    id: 'fallback',
    name: '-',
    code: '-',
    age: 0,
    gender: '男',
    progress: 0,
    elapsed: '00:00',
    total: '05:00',
    histories: [],
}

const selectedChildId = ref(fallbackChild.id)
const selectedChild = computed<ChildDetectProfile>(() => {
    return childOptions.value.find((item) => item.id === selectedChildId.value) ?? childOptions.value[0] ?? fallbackChild
})

const detectProgress = computed(() => {
    if (!hasStartedVideo.value) return 0
    if (videoFinished.value) return 100
    if (!videoDuration.value) return 0

    const percent = (videoCurrentTime.value / videoDuration.value) * 100
    return Math.max(0, Math.min(100, percent))
})

const screenToggleIcon = computed(() => (isExpandedMode.value ? ScaleToOriginal : FullScreen))

const router = useRouter()

function mapRiskLevel(level: string): RiskLevel {
    const upper = String(level || '').toUpperCase()
    if (upper === 'HIGH') return 'high'
    if (upper === 'MIDDLE') return 'mid'
    return 'low'
}

function toChildProfile(item: ChildInfo): ChildDetectProfile {
    const childId = Number(item.id)
    return {
        id: String(item.id),
        name: item.name,
        code: `SE${String(childId).padStart(8, '0')}`,
        age: Number(item.age) || 0,
        gender: item.gender === 1 ? '男' : '女',
        progress: 0,
        elapsed: '00:00',
        total: '05:00',
        histories: [],
    }
}

function toHistoryItem(record: ScreenRecordVO): DetectHistory {
    const riskLabelMap: Record<string, string> = {
        LOW: '低风险',
        MIDDLE: '中风险',
        HIGH: '高风险',
    }
    const abnormalPercent = Number(record.abnormalProb) * 100

    return {
        date: record.testTime ? record.testTime.slice(0, 10).replace(/-/g, '.') : '-',
        risk: riskLabelMap[String(record.riskLevel).toUpperCase()] ?? String(record.riskLevel || '-'),
        rate: `异常概率 ${Number.isFinite(abnormalPercent) ? abnormalPercent.toFixed(1) : '0.0'}%`,
        level: mapRiskLevel(record.riskLevel),
    }
}

async function loadChildList() {
    loadingChildren.value = true
    try {
        const list = await getChildList()
        childOptions.value = list.map(toChildProfile)

        const rawHint = sessionStorage.getItem(PREFERRED_CHILD_HINT_KEY)
        let preferredId = ''
        if (rawHint) {
            try {
                const hint = JSON.parse(rawHint) as { name?: string; idCard?: string; birthDate?: string }
                const matched = list.find(
                    (item) =>
                        item.name === hint.name &&
                        item.idCard === hint.idCard &&
                        item.birthDate === hint.birthDate,
                )
                preferredId = matched ? String(matched.id) : ''
            } catch {
                // ignore invalid session cache
            } finally {
                sessionStorage.removeItem(PREFERRED_CHILD_HINT_KEY)
            }
        }

        selectedChildId.value = preferredId || childOptions.value[0]?.id || fallbackChild.id
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '患儿列表加载失败')
    } finally {
        loadingChildren.value = false
    }
}

async function loadChildHistory(childId: string) {
    if (!childId || childId === fallbackChild.id) {
        return
    }

    try {
        const history = await getRecordHistory(Number(childId))
        const sortedHistory = history
            .slice()
            .sort((a, b) => new Date(b.testTime).getTime() - new Date(a.testTime).getTime())

        const target = childOptions.value.find((item) => item.id === childId)
        if (!target) {
            return
        }

        target.histories = sortedHistory.map(toHistoryItem)

        const latest = sortedHistory[0]
        if (latest) {
            target.progress = Math.max(0, Math.min(100, Number(latest.abnormalProb) || 0))
            target.elapsed = latest.testTime ? latest.testTime.slice(11, 16) : '00:00'
        } else {
            target.progress = 0
            target.elapsed = '00:00'
        }
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '筛查历史加载失败')
    }
}

watch(selectedChildId, (childId) => {
    if (!childId || childId === fallbackChild.id) return
    loadChildHistory(childId)
})

onMounted(() => {
    loadChildList()
})

function tryNavigateToReport() {
    if (!analysisFinished.value || !videoFinished.value || !reportPayload.value) {
        return
    }

    sessionStorage.setItem(ANALYSIS_REPORT_RESULT_KEY, JSON.stringify(reportPayload.value))
    router.push({ name: 'analysis-report' })
}

function onVideoTimeUpdate() {
    if (!videoRef.value) return
    videoCurrentTime.value = videoRef.value.currentTime || 0
}

function onVideoLoadedMetadata() {
    if (!videoRef.value) return
    const duration = Number(videoRef.value.duration)
    if (!Number.isNaN(duration) && Number.isFinite(duration) && duration > 0) {
        videoDuration.value = duration
    }
}

function onVideoEnded() {
    isVideoPlaying.value = false
    videoCurrentTime.value = videoDuration.value
    videoFinished.value = true
    tryNavigateToReport()
}

function toggleScreenMode() {
    isExpandedMode.value = !isExpandedMode.value
}

async function startVideoPlayback() {
    if (!videoRef.value) {
        throw new Error('未找到检测视频')
    }

    videoRef.value.currentTime = 0
    videoCurrentTime.value = 0
    videoFinished.value = false
    await videoRef.value.play()
    isVideoPlaying.value = true
}

async function loadDatasetFile() {
    const response = await fetch(FIXED_DATASET_URL)
    if (!response.ok) {
        throw new Error(`固定数据集文件读取失败：${FIXED_DATASET_FILE_NAME}`)
    }

    const blob = await response.blob()
    return new File([blob], FIXED_DATASET_FILE_NAME, {
        type:
            blob.type ||
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
}

async function goAnalysisReport() {
    if (!selectedChildId.value || selectedChildId.value === fallbackChild.id) {
        ElMessage.warning('请先选择患儿')
        return
    }

    analyzing.value = true
    analysisFinished.value = false
    reportPayload.value = null
    hasStartedVideo.value = true
    isExpandedMode.value = true

    try {
        // Wait for v-if video node mount before accessing videoRef.
        await nextTick()
        await startVideoPlayback()

        const file = await loadDatasetFile()
        const result = await analyzeChildData(Number(selectedChildId.value), file)

        reportPayload.value = {
            child: {
                id: Number(selectedChild.value.id),
                name: selectedChild.value.name,
                age: selectedChild.value.age,
                gender: selectedChild.value.gender,
                code: selectedChild.value.code,
            },
            result,
            datasetLabel: FIXED_DATASET_FILE_NAME,
        }

        analysisFinished.value = true
        tryNavigateToReport()
    } catch (error) {
        isVideoPlaying.value = false
        hasStartedVideo.value = false
        ElMessage.error(error instanceof Error ? error.message : '分析失败，请稍后重试')
    } finally {
        analyzing.value = false
    }
}
</script>

<template>
    <section class="detect-page">
        <div class="detect-grid" :class="{ expanded: isExpandedMode }">
            <aside v-show="!isExpandedMode" class="left-panel">
                <h3>患儿信息</h3>

                <div class="child-picker">
                    <span>选择患儿</span>
                    <el-select v-model="selectedChildId" placeholder="请选择患儿" size="large" :loading="loadingChildren">
                        <el-option v-for="child in childOptions" :key="child.id"
                            :label="`${child.name}（${child.age}岁 · ${child.gender}）`" :value="child.id" />
                    </el-select>
                </div>

                <dl class="base-info">
                    <div>
                        <dt>患儿姓名</dt>
                        <dd>{{ selectedChild.name }}</dd>
                    </div>
                    <div>
                        <dt>检测编号</dt>
                        <dd class="accent">{{ selectedChild.code }}</dd>
                    </div>
                    <div>
                        <dt>年龄 · 性别</dt>
                        <dd>{{ selectedChild.age }}岁 · {{ selectedChild.gender }}</dd>
                    </div>
                </dl>

                <div class="progress-block">
                    <div class="line-title">
                        <span>检测进度</span>
                        <strong>{{ detectProgress.toFixed(0) }}%</strong>
                    </div>
                    <div class="bar-wrap"><i :style="{ width: `${detectProgress}%` }"></i></div>
                </div>

                <h4>历史记录</h4>
                <div class="history-list">
                    <article v-for="item in selectedChild.histories" :key="`${item.date}-${item.risk}`"
                        class="history-item">
                        <div>
                            <p>{{ item.date }}</p>
                            <span>{{ item.rate }}</span>
                        </div>
                        <b :class="item.level">{{ item.risk }}</b>
                    </article>
                </div>

                <button class="action-btn start" :disabled="analyzing" @click="goAnalysisReport">
                    <template v-if="analyzing">检测中...</template>
                    <template v-else>
                        <el-icon class="inline-icon">
                            <VideoPlay />
                        </el-icon>
                        开始检测
                    </template>
                </button>
            </aside>

            <main class="center-panel">
                <div class="detect-meta">
                    <div class="meta-left">
                        <span class="badge">
                            <el-icon class="inline-icon">
                                <Loading />
                            </el-icon>
                            {{ isVideoPlaying || analyzing ? '检测中' : '待开始' }}
                        </span>
                        <button class="view-toggle-btn" @click="toggleScreenMode">
                            <el-icon class="inline-icon">
                                <component :is="screenToggleIcon" />
                            </el-icon>
                            {{ isExpandedMode ? '小屏查看' : '全屏查看' }}
                        </button>
                    </div>
                </div>

                <section class="viewer-box" aria-label="检测画面">
                    <video v-if="hasStartedVideo" ref="videoRef" class="detect-video" :src="DETECT_VIDEO_SRC"
                        preload="metadata" playsinline @timeupdate="onVideoTimeUpdate"
                        @loadedmetadata="onVideoLoadedMetadata" @ended="onVideoEnded"></video>
                    <span v-if="!hasStartedVideo || !isVideoPlaying" class="crosshair"></span>
                </section>

            </main>
        </div>
    </section>
</template>

<style scoped lang="scss">
.detect-page {
    margin-top: 8px;
    height: calc(100vh - 176px);
    display: flex;
    overflow: hidden;
}

.detect-grid {
    display: grid;
    grid-template-columns: 408px minmax(0, 1fr);
    gap: 28px;
    align-items: stretch;
    justify-content: initial;
    width: 100%;
    flex: 1;

    &.expanded {
        grid-template-columns: minmax(0, 1fr);
        gap: 0;

        .center-panel {
            padding-bottom: 10px;
        }

        .viewer-box {
            flex: 1;
            height: 100%;
            min-height: 0;
        }

        .detect-video {
            object-fit: cover;
        }
    }
}

.left-panel {
    border-radius: 14px;
    border: 1px solid rgba(95, 118, 164, 0.2);
    background: rgba(35, 47, 79, 0.84);
    padding: 26px;
}

.left-panel {
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;

    h3 {
        margin: 0 0 16px;
        font-size: 24px;
        color: #eef4ff;
    }

    h4 {
        margin: 18px 0 12px;
        font-size: 18px;
        color: #aab6d5;
    }
}

.child-picker {
    display: grid;
    gap: 10px;
    margin-bottom: 16px;

    span {
        color: #9aa8c9;
        font-size: 14px;
    }

    :deep(.el-select) {
        width: 100%;
    }

    :deep(.el-select__wrapper) {
        min-height: 46px;
        border-radius: 10px;
        background: rgba(20, 31, 57, 0.94);
        border: 1px solid rgba(53, 74, 120, 0.72);
        box-shadow: none;
    }

    :deep(.el-select__selected-item) {
        color: #e6eeff;
        font-size: 15px;
    }

    :deep(.el-select__placeholder) {
        color: #7382a7;
    }

    :deep(.el-select__caret) {
        color: #8ca0c8;
    }
}

.base-info {
    margin: 0;
    display: grid;
    gap: 12px;

    >div {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
    }

    dt {
        margin: 0;
        color: #9aa8c9;
        font-size: 17px;
    }

    dd {
        margin: 0;
        color: #f2f7ff;
        font-size: 18px;
        font-weight: 600;
    }

    .accent {
        color: #11dfd2;
        font-size: 18px;
    }
}

.progress-block {
    margin-top: 18px;
}

.line-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    span {
        color: #9aa8c9;
        font-size: 17px;
    }

    strong {
        color: #11dfd2;
        font-size: 16px;
        min-width: 56px;
        text-align: right;
    }
}

.bar-wrap {
    width: 100%;
    height: 14px;
    border-radius: 999px;
    background: rgba(22, 30, 56, 0.9);
    overflow: hidden;

    i {
        display: block;
        width: 60%;
        height: 100%;
        background: linear-gradient(90deg, #22ddd2, #13bea8);
        border-radius: 999px;
        transition: width 0.2s linear;
    }
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: rgba(27, 209, 199, 0.82) rgba(18, 30, 56, 0.92);

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        border-radius: 999px;
        background: rgba(18, 30, 56, 0.92);
        border: 1px solid rgba(60, 86, 132, 0.28);
    }

    &::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(27, 209, 199, 0.92), rgba(18, 170, 160, 0.9));
    }

    &::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(44, 229, 218, 0.95), rgba(27, 209, 199, 0.95));
    }
}

.history-item {
    border-radius: 10px;
    background: rgba(26, 36, 65, 0.8);
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    p {
        margin: 0;
        color: #e9f0ff;
        font-size: 16px;
    }

    span {
        color: #7d8cad;
        font-size: 12px;
    }

    b {
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 13px;
    }

    .low {
        background: #0fd670;
        color: #022613;
    }

    .mid {
        background: #ffd52f;
        color: #332500;
    }

    .high {
        background: #ff6d5f;
        color: #3e0b06;
    }
}

.action-btn {
    width: 100%;
    border-radius: 10px;
    height: 46px;
    border: 1px solid transparent;
    margin-top: 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
}

.left-panel .action-btn.start {
    margin-top: auto;
}

.action-btn.start {
    background: linear-gradient(180deg, #21dfd3, #14bfb8);
    color: #031b24;

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
}

.center-panel {
    min-width: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .detect-meta {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        margin-bottom: 12px;

        .meta-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #f54a3e;
            color: #fff;
            padding: 8px 18px;
            border-radius: 22px;
            font-size: 16px;
            font-weight: 700;
        }
    }
}

.viewer-box {
    flex: 1;
    min-height: 432px;
    border-radius: 12px;
    background: rgba(4, 11, 27, 0.95);
    border: 1px solid rgba(42, 57, 94, 0.8);
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
}

.detect-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #010a22;
}

.crosshair {
    position: relative;
    width: 188px;
    height: 188px;

    &::before,
    &::after {
        content: '';
        position: absolute;
        background: rgba(19, 229, 217, 0.48);
    }

    &::before {
        width: 1px;
        height: 170px;
        left: calc(50% - 0.5px);
        top: 9px;
    }

    &::after {
        width: 170px;
        height: 1px;
        left: 9px;
        top: calc(50% - 0.5px);
    }
}

.view-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    min-width: 118px;
    border-radius: 999px;
    border: 1px solid rgba(69, 88, 129, 0.56);
    background: rgba(23, 33, 58, 0.6);
    color: #d5def3;
    font-size: 14px;
    font-weight: 700;
    padding: 0 12px;
    cursor: pointer;
}

.inline-icon {
    font-size: 15px;
}

@media (max-width: 1320px) {
    .detect-page {
        height: auto;
        overflow: visible;
    }

    .detect-grid {
        grid-template-columns: 1fr;
        justify-content: initial;
        align-items: start;
    }

    .viewer-box {
        height: 360px;
        min-height: 360px;
    }
}
</style>
