<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Aim, Calendar, User, VideoCamera, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EyeScreenResultVO } from '../../types/domain'

const ANALYSIS_REPORT_RESULT_KEY = 'analysis_report_result_payload'
const VIDEO_SRC = '/media/videos/video-pro.mp4'

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

const gaugeRef = ref<HTMLDivElement | null>(null)
const middleTopRef = ref<HTMLDivElement | null>(null)
const middleBottomRef = ref<HTMLDivElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

let gaugeChart: echarts.ECharts | null = null
let middleTopChart: echarts.ECharts | null = null
let middleBottomChart: echarts.ECharts | null = null

const reportPayload = ref<AnalysisReportPayload | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

function toPercentValue(raw: unknown) {
    const value = Number(raw)
    if (Number.isNaN(value)) return 0
    const normalized = value >= 0 && value <= 1 ? value * 100 : value
    return Math.max(0, Math.min(100, normalized))
}

const abnormalProb = computed(() => toPercentValue(reportPayload.value?.result.abnormalProb))
const normalProb = computed(() => Math.max(0, 100 - abnormalProb.value))

const abnormalProbColor = computed(() => {
    if (abnormalProb.value < 30) return '#0ad35d'
    if (abnormalProb.value <= 70) return '#f4b400'
    return '#ff4638'
})

const derivedRiskLevel = computed<'LOW' | 'MIDDLE' | 'HIGH'>(() => {
    if (abnormalProb.value >= 70) return 'HIGH'
    if (abnormalProb.value >= 30) return 'MIDDLE'
    return 'LOW'
})

const riskInfo = computed(() => {
    const upper = String(reportPayload.value?.result.riskLevel || derivedRiskLevel.value).toUpperCase()
    if (upper === 'HIGH') {
        return {
            label: '高风险',
            key: 'high',
            diagnose: '疑似孤独症谱系障碍，建议尽快专科复诊。',
            advice: '建议尽快预约专科医生进行进一步诊断。',
        }
    }

    if (upper === 'MIDDLE') {
        return {
            label: '中风险',
            key: 'mid',
            diagnose: '存在一定社交异常倾向，建议持续观察。',
            advice: '建议 1-2 周内复检，必要时咨询医生。',
        }
    }

    return {
        label: '低风险',
        key: 'low',
        diagnose: '当前未见明显异常特征。',
        advice: '建议保持规律观察，按计划进行后续筛查。',
    }
})

const accuracyText = computed(() => {
    const value = Number(reportPayload.value?.result.accuracy)
    if (Number.isNaN(value)) return '--'
    return `${toPercentValue(value).toFixed(1)}%`
})

const testTimeText = computed(() => {
    const testTime = reportPayload.value?.result.testTime
    if (!testTime) return '--'
    const date = new Date(testTime)
    if (Number.isNaN(date.getTime())) return String(testTime)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`
})

const childAgeText = computed(() => {
    const age = Number(reportPayload.value?.child.age)
    if (Number.isNaN(age) || age <= 0) return '--'
    return String(age)
})

const childGenderText = computed(() => {
    const gender = String(reportPayload.value?.child.gender || '').trim()
    return gender || '--'
})

const progress = computed(() => {
    if (!duration.value) return 0
    return Math.max(0, Math.min(100, (currentTime.value / duration.value) * 100))
})

const formattedCurrent = computed(() => formatDuration(currentTime.value))
const formattedDuration = computed(() => formatDuration(duration.value))

function formatDuration(value: number) {
    const sec = Math.max(0, Math.floor(value || 0))
    const mm = String(Math.floor(sec / 60)).padStart(2, '0')
    const ss = String(sec % 60).padStart(2, '0')
    return `${mm}:${ss}`
}

function readReportPayload() {
    const raw = sessionStorage.getItem(ANALYSIS_REPORT_RESULT_KEY)
    if (!raw) return
    try {
        reportPayload.value = JSON.parse(raw) as AnalysisReportPayload
    } catch {
        reportPayload.value = null
    }
}

function renderGaugeChart() {
    if (!gaugeRef.value) return
    if (!gaugeChart) {
        gaugeChart = echarts.init(gaugeRef.value)
    }

    gaugeChart.setOption({
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                min: 0,
                max: 100,
                splitNumber: 2,
                center: ['50%', '79%'],
                radius: '108%',
                axisLine: {
                    lineStyle: {
                        width: 30,
                        color: [
                            [0.3, '#0ad35d'],
                            [0.7, '#f4b400'],
                            [1, '#ff4638'],
                        ],
                    },
                },
                pointer: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                detail: {
                    valueAnimation: false,
                    offsetCenter: [0, '-24%'],
                    fontSize: 64,
                    fontWeight: 800,
                    color: abnormalProbColor.value,
                    formatter: '{value}%',
                },
                data: [{ value: Number(abnormalProb.value.toFixed(1)) }],
                anchor: {
                    show: true,
                    size: 16,
                    itemStyle: { color: '#f2f8ff' },
                    offsetCenter: [0, '8%'],
                },
            },
        ],
    })
}

function renderMiddleTopChart() {
    if (!middleTopRef.value) return
    if (!middleTopChart) {
        middleTopChart = echarts.init(middleTopRef.value)
    }

    const patient = [
        Number((60 - normalProb.value * 0.22).toFixed(1)),
        Number((40 + normalProb.value * 0.38).toFixed(1)),
        Number((32 + abnormalProb.value * 0.48).toFixed(1)),
        Number((35 + normalProb.value * 0.35).toFixed(1)),
        Number((48 + normalProb.value * 0.3).toFixed(1)),
    ]
    const baseline = [72, 76, 45, 66, 70]

    middleTopChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(10, 16, 32, 0.92)',
            borderColor: 'rgba(17, 223, 210, 0.5)',
            textStyle: { color: '#e7f1ff' },
        },
        legend: {
            top: 0,
            textStyle: { color: '#afbddc' },
            data: ['患儿轨迹分布', '常模基线'],
        },
        grid: { left: 42, right: 24, top: 42, bottom: 24 },
        xAxis: {
            type: 'category',
            data: ['注视时长', '社交注视', '眼跳频率', '瞳孔反应', '扫视速度'],
            axisLabel: { color: '#9ba9ca' },
            axisLine: { lineStyle: { color: '#3f5282' } },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            axisLabel: { color: '#9ba9ca', formatter: '{value}%' },
            splitLine: { lineStyle: { color: 'rgba(72, 90, 134, 0.4)' } },
        },
        series: [
            {
                name: '患儿轨迹分布',
                type: 'line',
                smooth: true,
                symbolSize: 8,
                data: patient,
                lineStyle: { width: 3, color: '#10dfd2' },
                itemStyle: { color: '#10dfd2' },
            },
            {
                name: '常模基线',
                type: 'line',
                smooth: true,
                symbolSize: 6,
                data: baseline,
                lineStyle: { width: 2, type: 'dashed', color: '#90a2cc' },
                itemStyle: { color: '#90a2cc' },
            },
        ],
    })
}

function renderMiddleBottomChart() {
    if (!middleBottomRef.value) return
    if (!middleBottomChart) {
        middleBottomChart = echarts.init(middleBottomRef.value)
    }

    const patientSocial = Number((normalProb.value * 0.28 + 12).toFixed(1))
    const patientEyes = Number((normalProb.value * 0.22 + 10).toFixed(1))
    const patientMouth = Number((normalProb.value * 0.13 + 6).toFixed(1))
    const patientNose = Number((normalProb.value * 0.1 + 5).toFixed(1))
    const patientNonSocial = Number((100 - patientSocial - patientEyes - patientMouth - patientNose).toFixed(1))

    const baselineEyes = 24
    const baselineNose = 22
    const baselineMouth = 30
    const baselineSocial = 18
    const baselineNonSocial = 6

    middleBottomChart.setOption({
        title: [
            {
                text: '患儿 AOI 分布',
                left: '25%',
                top: 6,
                textAlign: 'center',
                textStyle: { color: '#dde8ff', fontSize: 14, fontWeight: 700 },
            },
            {
                text: '常模 AOI 分布',
                left: '75%',
                top: 6,
                textAlign: 'center',
                textStyle: { color: '#dde8ff', fontSize: 14, fontWeight: 700 },
            },
        ],
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        color: ['#f0bf57', '#9fdc51', '#ff7e66', '#4ac8df', '#9ba4b0'],
        legend: {
            bottom: 2,
            textStyle: { color: '#9fb0d4', fontSize: 11 },
            itemWidth: 10,
            itemHeight: 10,
            data: ['眼睛', '鼻子', '嘴巴', '社交区', '非社交区'],
        },
        series: [
            {
                type: 'pie',
                center: ['25%', '50%'],
                radius: ['0%', '28%'],
                label: { color: '#d7e3ff', formatter: '{d}%', fontSize: 11 },
                labelLine: { length: 10, length2: 8 },
                data: [
                    { name: '眼睛', value: patientEyes },
                    { name: '鼻子', value: patientNose },
                    { name: '嘴巴', value: patientMouth },
                    { name: '社交区', value: patientSocial },
                    { name: '非社交区', value: patientNonSocial },
                ],
            },
            {
                type: 'pie',
                center: ['75%', '50%'],
                radius: ['0%', '28%'],
                label: { color: '#d7e3ff', formatter: '{d}%', fontSize: 11 },
                labelLine: { length: 10, length2: 8 },
                data: [
                    { name: '眼睛', value: baselineEyes },
                    { name: '鼻子', value: baselineNose },
                    { name: '嘴巴', value: baselineMouth },
                    { name: '社交区', value: baselineSocial },
                    { name: '非社交区', value: baselineNonSocial },
                ],
            },
        ],
    })
}

function onVideoLoadedMetadata() {
    if (!videoRef.value) return
    duration.value = videoRef.value.duration || 0
}

function onVideoTimeUpdate() {
    if (!videoRef.value) return
    currentTime.value = videoRef.value.currentTime || 0
}

function onVideoEnded() {
    isPlaying.value = false
}

async function togglePlay() {
    if (!videoRef.value) return
    if (isPlaying.value) {
        videoRef.value.pause()
        isPlaying.value = false
        return
    }
    try {
        await videoRef.value.play()
        isPlaying.value = true
    } catch {
        isPlaying.value = false
    }
}

function seekVideo(event: Event) {
    if (!videoRef.value) return
    const target = event.target as HTMLInputElement
    const next = Number(target.value)
    if (Number.isNaN(next)) return
    videoRef.value.currentTime = next
    currentTime.value = next
}

function resizeAll() {
    gaugeChart?.resize()
    middleTopChart?.resize()
    middleBottomChart?.resize()
}

onMounted(() => {
    readReportPayload()
    renderGaugeChart()
    renderMiddleTopChart()
    renderMiddleBottomChart()
    window.addEventListener('resize', resizeAll)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeAll)
    gaugeChart?.dispose()
    middleTopChart?.dispose()
    middleBottomChart?.dispose()
    gaugeChart = null
    middleTopChart = null
    middleBottomChart = null
})
</script>

<template>
    <section class="analysis-page">
        <div class="crumb-row">
            <RouterLink class="crumb-link" :to="{ name: 'start-detect' }">开始检测</RouterLink>
            <i>›</i>
            <strong>分析报告</strong>
        </div>

        <div class="summary-row">
            <div class="person-item">
                <el-icon>
                    <User />
                </el-icon>
                {{ reportPayload?.child.name ?? '--' }}
            </div>
            <div class="person-item">
                <el-icon>
                    <User />
                </el-icon>
                {{ childAgeText }}岁 · {{ childGenderText }}
            </div>
            <div class="person-item">
                <el-icon>
                    <Calendar />
                </el-icon>
                {{ testTimeText }}
            </div>
            <div class="person-item">
                <el-icon>
                    <Aim />
                </el-icon>
                模型准确率 {{ accuracyText }}
            </div>
        </div>

        <div class="content-grid">
            <article class="card left-combo-card">
                <section class="left-block risk-block">
                    <h3>筛查风险评估</h3>
                    <div ref="gaugeRef" class="gauge-chart"></div>
                    <div class="legend-row">
                        <span><i class="low"></i>低风险 &lt;30%</span>
                        <span><i class="mid"></i>当前概率</span>
                        <span><i class="high"></i>高风险 &gt;70%</span>
                    </div>
                    <p class="mid-tip">中风险 30-70%</p>
                </section>

                <section class="left-block result-block">
                    <b :class="['risk-tag', 'risk-corner', riskInfo.key]">{{ riskInfo.label }}</b>
                    <header>
                        <h3>筛查结果</h3>
                    </header>
                    <p class="diagnose">{{ riskInfo.diagnose }}</p>
                    <div class="advice-box">
                        <small>医生建议 · 模型准确率 {{ accuracyText }}</small>
                        <p>{{ riskInfo.advice }}</p>
                    </div>
                </section>
            </article>

            <article class="card middle-combo-card">
                <section class="middle-block">
                    <h3>眼动轨迹对比</h3>
                    <div ref="middleTopRef" class="middle-top-chart"></div>
                </section>

                <section class="middle-block">
                    <h3>兴趣区域 AOI 分布</h3>
                    <div ref="middleBottomRef" class="middle-bottom-chart"></div>
                </section>
            </article>

            <article class="card right-combo-card">
                <section class="right-block video-block">
                    <h3 class="title-with-icon">
                        <el-icon>
                            <VideoCamera />
                        </el-icon>
                        视频回放
                    </h3>
                    <div class="video-stage">
                        <video ref="videoRef" class="report-video" :src="VIDEO_SRC" preload="metadata" playsinline
                            @click="togglePlay" @loadedmetadata="onVideoLoadedMetadata" @timeupdate="onVideoTimeUpdate"
                            @ended="onVideoEnded"></video>
                    </div>
                    <div class="video-controls">
                        <button type="button" class="ctrl-btn" @click="togglePlay">
                            <el-icon class="inline-icon">
                                <VideoPause v-if="isPlaying" />
                                <VideoPlay v-else />
                            </el-icon>
                            {{ isPlaying ? '暂停' : '播放' }}
                        </button>
                        <input class="progress" type="range" min="0" :max="duration || 0" step="0.1"
                            :value="currentTime" @input="seekVideo" />
                        <span class="time">{{ formattedCurrent }} / {{ formattedDuration }}</span>
                    </div>
                </section>

                <section class="right-block explain-block">

                    <div class="explain-part">
                        <h4>什么是兴趣区域（AOI）？</h4>
                        <p>
                            指眼睛、鼻子、嘴巴等区域，正常孩子会多注视这里，
                            这是社交互动的重要指标
                        </p>
                    </div>

                    <div class="explain-part">
                        <h4>本次检测结果</h4>
                        <p>
                            本次模型判定异常风险概率为
                            <strong>{{ abnormalProb.toFixed(1) }}%</strong>
                            ，正常倾向概率为
                            <strong>{{ normalProb.toFixed(1) }}%</strong>

                        </p>
                        <p>
                            阈值规则：低风险 &lt;30%，中风险 30-70%，高风险 &gt;70%。
                        </p>
                    </div>
                </section>
            </article>
        </div>
    </section>
</template>

<style scoped lang="scss">
.analysis-page {
    margin-top: 6px;
    height: calc(100vh - 176px);
    min-height: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
}

.crumb-row {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #8f9cc0;
    font-size: 16px;
    margin-bottom: 12px;

    strong {
        color: #14e6d8;
        font-weight: 700;
    }

    i {
        color: #65b9ca;
        font-style: normal;
    }
}

.crumb-link {
    color: #8f9cc0;
    text-decoration: none;

    &:hover {
        color: #c7d3f0;
    }
}

.summary-row {
    display: flex;
    align-items: center;
    gap: 26px;
    border-radius: 12px;
    border: 1px solid rgba(86, 104, 147, 0.2);
    background: rgba(37, 48, 78, 0.72);
    color: #d8e3fb;
    padding: 8px 14px;
    margin-bottom: 14px;
    flex-wrap: nowrap;
    overflow: hidden;
}

.person-item {
    font-size: 14px;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    .el-icon {
        color: #8cc7db;
    }
}

.title-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.content-grid {
    display: grid;
    grid-template-columns: minmax(0, 25fr) minmax(0, 45fr) minmax(0, 30fr);
    gap: 14px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.left-combo-card,
.middle-combo-card,
.right-combo-card {
    min-width: 0;
    min-height: 0;
}

.left-combo-card {
    display: grid;
    grid-template-rows: minmax(0, 6fr) minmax(0, 4fr);
    gap: 14px;
}

.right-combo-card {
    display: grid;
    grid-template-rows: minmax(0, 6fr) minmax(0, 4fr);
    gap: 14px;
}

.middle-combo-card {
    display: grid;
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
}

.left-block,
.middle-block,
.right-block {
    min-height: 0;
    border-radius: 12px;
    border: 1px solid rgba(82, 106, 158, 0.24);
    background: rgba(27, 40, 72, 0.46);
    padding: 12px 14px;
    overflow: hidden;
}

.result-block {
    position: relative;
    margin-top: 8px;

    header {
        margin-bottom: 10px;
    }
}

.card {
    position: relative;
    z-index: 0;
    border-radius: 14px;
    border: 1px solid rgba(95, 118, 164, 0.2);
    background: rgba(35, 47, 79, 0.86);
    padding: 16px 18px;
    overflow: hidden;
    min-height: 0;

    h3 {
        margin: 0;
        color: #edf3ff;
        font-size: 16px;
    }
}

.gauge-chart {
    width: 100%;
    height: 264px;
    margin-top: 8px;
}

.legend-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: #9ba8ca;
    font-size: 11px;

    span {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }

    .low {
        background: #08d35d;
    }

    .mid {
        background: #f4b400;
    }

    .high {
        background: #ff4638;
    }
}

.mid-tip {
    margin: 6px 0 0;
    text-align: center;
    color: #8f9cc0;
    font-size: 11px;
}

.result-card {
    display: flex;
    flex-direction: column;

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }
}

.risk-tag {
    color: #fff;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 12px;

    &.low {
        background: #1fb86a;
    }

    &.mid {
        background: #e2a917;
    }

    &.high {
        background: #ff4638;
    }
}

.risk-corner {
    position: absolute;
    top: 12px;
    right: 14px;
}

.diagnose {
    margin: 0 0 10px;
    color: #d8e2fb;
    font-size: 14px;
}

.advice-box {
    border-radius: 10px;
    background: rgba(20, 31, 58, 0.82);
    padding: 10px 12px;

    small {
        color: #a3afcc;
        font-size: 12px;
    }

    p {
        margin: 6px 0 0;
        color: #f6b700;
        font-size: 14px;
        font-weight: 700;
    }
}

.middle-top-chart,
.middle-bottom-chart {
    margin-top: 8px;
    width: 100%;
    height: calc(100% - 26px);
    min-height: 220px;
}

.video-stage {
    margin-top: 10px;
    border-radius: 12px;
    border: 1px solid rgba(56, 78, 126, 0.45);
    background: rgba(8, 17, 37, 0.95);
    overflow: hidden;
    display: grid;
    place-items: center;
}

.report-video {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    max-height: 320px;
    object-fit: cover;
    object-position: center;
    background: #071429;
}

.report-video:fullscreen {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    aspect-ratio: auto !important;
    margin: 0 !important;
    object-fit: cover !important;
    object-position: center center !important;
    background: #000 !important;
}

.report-video:-webkit-full-screen {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    aspect-ratio: auto !important;
    margin: 0 !important;
    object-fit: cover !important;
    object-position: center center !important;
    background: #000 !important;
}

.video-controls {
    margin-top: 10px;
    border-radius: 12px;
    border: 1px solid rgba(59, 84, 131, 0.45);
    background: rgba(10, 19, 40, 0.82);
    padding: 10px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 8px 10px;
    align-items: center;

    .ctrl-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 34px;
        border-radius: 8px;
        border: 1px solid rgba(36, 210, 199, 0.55);
        background: linear-gradient(180deg, #20ddd2, #14bfb7);
        color: #042433;
        font-size: 13px;
        font-weight: 700;
        padding: 0 12px;
        cursor: pointer;
    }

    .inline-icon {
        font-size: 15px;
    }

    .progress {
        width: 100%;
        accent-color: #19cbc1;
    }

    .time {
        color: #c8d6f2;
        font-size: 12px;
        font-weight: 700;
    }
}

.explain-block {
    .explain-part+.explain-part {
        margin-top: 12px;
    }

    h4 {
        margin: 10px 0 4px;
        color: #1ce2d7;
        font-size: 18px;
        font-weight: 700;
    }

    p {
        margin: 6px 0 0;
        color: #a5b1cc;
        font-size: 14px;
        line-height: 1.75;
    }

    strong {
        color: #ff5a4c;
        font-size: 20px;
    }
}

@media (max-width: 1400px) {
    .analysis-page {
        height: auto;
        overflow: visible;
    }

    .summary-row {
        flex-wrap: wrap;
    }

    .content-grid {
        grid-template-columns: 1fr;
        overflow: visible;
    }

    .left-combo-card,
    .middle-combo-card,
    .right-combo-card {
        grid-template-rows: initial;
    }

    .middle-top-chart,
    .middle-bottom-chart {
        height: 280px;
        min-height: 280px;
    }

    .report-video {
        max-height: 360px;
    }
}
</style>
