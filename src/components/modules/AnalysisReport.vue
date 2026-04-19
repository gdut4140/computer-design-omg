<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Aim, Calendar, User, VideoCamera, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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
const patientGlobeRef = ref<HTMLDivElement | null>(null)
const baselineGlobeRef = ref<HTMLDivElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

let gaugeChart: echarts.ECharts | null = null
let middleTopChart: echarts.ECharts | null = null

interface GlobeInstance {
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    frameId: number
    resize: () => void
}

const globeInstances: GlobeInstance[] = []

const reportPayload = ref<AnalysisReportPayload | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const showPatientTags = ref(true)
const showBaselineTags = ref(true)

function toPercentValue(raw: unknown) {
    const value = Number(raw)
    if (Number.isNaN(value)) return 0
    const normalized = value >= 0 && value <= 1 ? value * 100 : value
    return Math.max(0, Math.min(100, normalized))
}

const abnormalProb = computed(() => toPercentValue(reportPayload.value?.result.abnormalProb))
const normalProb = computed(() => Math.max(0, 100 - abnormalProb.value))

const patientAoiStats = computed(() => {
    const social = Number((normalProb.value * 0.28 + 12).toFixed(1))
    const eyes = Number((normalProb.value * 0.22 + 10).toFixed(1))
    const mouth = Number((normalProb.value * 0.13 + 6).toFixed(1))
    const nose = Number((normalProb.value * 0.1 + 5).toFixed(1))
    const nonSocial = Number((100 - social - eyes - mouth - nose).toFixed(1))
    return [
        { name: '眼睛', value: eyes, color: '#f0bf57' },
        { name: '鼻子', value: nose, color: '#9fdc51' },
        { name: '嘴巴', value: mouth, color: '#ff7e66' },
        { name: '社交区', value: social, color: '#4ac8df' },
        { name: '非社交区', value: nonSocial, color: '#9ba4b0' },
    ]
})

const baselineAoiStats = computed(() => [
    { name: '眼睛', value: 24, color: '#f0bf57' },
    { name: '鼻子', value: 22, color: '#9fdc51' },
    { name: '嘴巴', value: 30, color: '#ff7e66' },
    { name: '社交区', value: 18, color: '#4ac8df' },
    { name: '非社交区', value: 6, color: '#9ba4b0' },
])

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

    const gaugeValue = Number(abnormalProb.value.toFixed(1))

    gaugeChart.setOption({
        backgroundColor: 'transparent',
        animationDuration: 1200,
        animationEasing: 'cubicOut',
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                min: 0,
                max: 100,
                splitNumber: 10,
                center: ['50%', '79%'],
                radius: '112%',
                axisLine: {
                    lineStyle: {
                        width: 34,
                        color: [[1, 'rgba(26, 53, 92, 0.78)']],
                    },
                },
                axisTick: {
                    distance: -42,
                    splitNumber: 4,
                    lineStyle: {
                        color: 'rgba(110, 183, 255, 0.36)',
                        width: 1,
                    },
                    length: 6,
                },
                splitLine: {
                    distance: -42,
                    length: 10,
                    lineStyle: {
                        color: 'rgba(126, 210, 255, 0.42)',
                        width: 1.5,
                    },
                },
                axisLabel: { show: false },
                pointer: { show: false },
                detail: { show: false },
            },
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
                progress: {
                    show: true,
                    width: 18,
                    roundCap: true,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#1ff4d0' },
                            { offset: 0.5, color: '#ffd15b' },
                            { offset: 1, color: '#ff4d46' },
                        ]),
                        shadowColor: 'rgba(60, 210, 255, 0.42)',
                        shadowBlur: 14,
                    },
                },
                detail: {
                    valueAnimation: true,
                    offsetCenter: [0, '-22%'],
                    fontSize: 56,
                    fontWeight: 800,
                    color: abnormalProbColor.value,
                    formatter: '{value}%',
                    textBorderColor: 'rgba(10, 20, 36, 0.88)',
                    textBorderWidth: 5,
                },
                data: [{ value: gaugeValue }],
                anchor: {
                    show: true,
                    size: 16,
                    itemStyle: { color: '#f2f8ff' },
                    offsetCenter: [0, '8%'],
                },
            },
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                min: 0,
                max: 100,
                center: ['50%', '79%'],
                radius: '118%',
                pointer: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                detail: { show: false },
                axisLine: {
                    lineStyle: {
                        width: 2,
                        color: [[1, 'rgba(100, 206, 255, 0.26)']],
                    },
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
        Number((15 + normalProb.value * 0.38).toFixed(1)),
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

    const categoryNames = ['眼睛', '鼻子', '嘴巴', '社交区', '非社交区']
    const categoryColors = ['#f0bf57', '#9fdc51', '#ff7e66', '#4ac8df', '#9ba4b0']

    const patientValues = [patientEyes, patientNose, patientMouth, patientSocial, patientNonSocial]
    const baselineValues = [baselineEyes, baselineNose, baselineMouth, baselineSocial, baselineNonSocial]

    const patientAoi = categoryNames.map((name, index) => ({
        name,
        value: patientValues[index] ?? 0,
        color: categoryColors[index] ?? '#9ba4b0',
    }))

    const baselineAoi = categoryNames.map((name, index) => ({
        name,
        value: baselineValues[index] ?? 0,
        color: categoryColors[index] ?? '#9ba4b0',
    }))

    disposeAoiGlobes()
    createAoiGlobe(patientGlobeRef.value, patientAoi, '#3ad8ff', 0.0046)
    createAoiGlobe(baselineGlobeRef.value, baselineAoi, '#ffd166', 0.0042)
}

function createAoiGlobe(
    container: HTMLDivElement | null,
    data: Array<{ name: string; value: number; color: string }>,
    glowColor: string,
    autoRotateSpeed: number,
) {
    if (!container) return

    const width = Math.max(240, container.clientWidth)
    const height = Math.max(220, container.clientHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 0.2, 5.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableZoom = false
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minPolarAngle = Math.PI * 0.28
    controls.maxPolarAngle = Math.PI * 0.72
    controls.autoRotate = true
    controls.autoRotateSpeed = autoRotateSpeed * 120

    const ambient = new THREE.AmbientLight('#8ad4ff', 0.9)
    scene.add(ambient)

    const rimLight = new THREE.DirectionalLight('#55f2ff', 1.42)
    rimLight.position.set(2.8, 2.6, 3.2)
    scene.add(rimLight)

    const fillLight = new THREE.DirectionalLight('#4f99ff', 0.78)
    fillLight.position.set(-2.2, -1.2, -2)
    scene.add(fillLight)

    const sphereGeometry = new THREE.SphereGeometry(1.35, 72, 72)

    const n = data.length
    const anchors = data.map((entry, index) => {
        const lat = 56 - index * 24
        const lon = (index / n) * 360 + 40
        return { ...entry, lat, lon }
    })

    function createAoiSurfaceTexture(points: Array<{ value: number; color: string; lat: number; lon: number }>) {
        const canvas = document.createElement('canvas')
        canvas.width = 1024
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            return null
        }

        const prepared = points.map((point) => {
            const c = new THREE.Color(point.color)
            const vivid = c.clone().offsetHSL(0, 0.42, 0.08)
            return {
                lat: point.lat,
                lonTex: (point.lon + 180) % 360,
                influence: 0.72 + Math.max(point.value, 0) / 100 * 1.28,
                r: Math.max(0, Math.min(255, Math.round(vivid.r * 255))),
                g: Math.max(0, Math.min(255, Math.round(vivid.g * 255))),
                b: Math.max(0, Math.min(255, Math.round(vivid.b * 255))),
            }
        })

        const image = ctx.createImageData(canvas.width, canvas.height)
        const pixels = image.data
        const regionMap = new Uint8Array(canvas.width * canvas.height)

        for (let y = 0; y < canvas.height; y += 1) {
            const lat = 90 - (y / (canvas.height - 1)) * 180
            for (let x = 0; x < canvas.width; x += 1) {
                const lon = (x / (canvas.width - 1)) * 360

                let bestIndex = 0
                let bestScore = Number.POSITIVE_INFINITY

                prepared.forEach((point, index) => {
                    const dLat = (lat - point.lat) / 42
                    const rawDLon = Math.abs(lon - point.lonTex)
                    const dLon = Math.min(rawDLon, 360 - rawDLon) / 88
                    const distance2 = dLat * dLat + dLon * dLon
                    const score = distance2 / point.influence

                    if (score < bestScore) {
                        bestScore = score
                        bestIndex = index
                    }
                })

                const idx = (y * canvas.width + x) * 4
                const selected = prepared[bestIndex] ?? prepared[0]
                regionMap[y * canvas.width + x] = bestIndex

                pixels[idx] = selected?.r ?? 18
                pixels[idx + 1] = selected?.g ?? 44
                pixels[idx + 2] = selected?.b ?? 72
                pixels[idx + 3] = 255
            }
        }

        // 绘制硬边界线，保证分区界线分明
        for (let y = 1; y < canvas.height - 1; y += 1) {
            for (let x = 1; x < canvas.width - 1; x += 1) {
                const idx = y * canvas.width + x
                const current = regionMap[idx]
                const left = regionMap[idx - 1]
                const right = regionMap[idx + 1]
                const up = regionMap[idx - canvas.width]
                const down = regionMap[idx + canvas.width]
                const boundary = current !== left || current !== right || current !== up || current !== down
                if (!boundary) continue

                const p = idx * 4
                pixels[p] = 6
                pixels[p + 1] = 12
                pixels[p + 2] = 26
                pixels[p + 3] = 255
            }
        }

        ctx.putImageData(image, 0, 0)

        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.needsUpdate = true
        return texture
    }

    const surfaceTexture = createAoiSurfaceTexture(anchors)
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        map: surfaceTexture ?? undefined,
        emissive: '#3d6f9c',
        emissiveMap: surfaceTexture ?? undefined,
        emissiveIntensity: 0.82,
        roughness: 0.24,
        metalness: 0.1,
        transparent: false,
        opacity: 1,
        clearcoat: 0.42,
        clearcoatRoughness: 0.24,
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    scene.add(sphere)

    const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.SphereGeometry(1.37, 22, 18)),
        new THREE.LineBasicMaterial({ color: '#1ed7ff', transparent: true, opacity: 0.14 }),
    )
    sphere.add(wire)

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.8, 0.02, 16, 120),
        new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.35,
        }),
    )
    ring.rotation.x = Math.PI * 0.34
    ring.position.y = -0.08
    scene.add(ring)

    const labelsGroup = new THREE.Group()
    sphere.add(labelsGroup)

    const markerGeometry = new THREE.SphereGeometry(0.06, 16, 16)

    function makePercentSprite(keyword: string, percent: number, accentColor: string) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const logicalWidth = 360
        const logicalHeight = 92
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(logicalWidth * dpr)
        canvas.height = Math.round(logicalHeight * dpr)
        canvas.style.width = `${logicalWidth}px`
        canvas.style.height = `${logicalHeight}px`
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            const fallback = new THREE.SpriteMaterial({ color: accentColor })
            return new THREE.Sprite(fallback)
        }
        ctx.scale(dpr, dpr)

        const accent = new THREE.Color(accentColor)
        const accentRgb = `${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)}`

        ctx.clearRect(0, 0, logicalWidth, logicalHeight)
        ctx.fillStyle = `rgba(${accentRgb}, 0.2)`
        ctx.strokeStyle = `rgba(${accentRgb}, 0.95)`
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.roundRect(2, 2, logicalWidth - 4, logicalHeight - 4, 14)
        ctx.fill()
        ctx.stroke()

        ctx.shadowColor = `rgba(${accentRgb}, 0.75)`
        ctx.shadowBlur = 12
        ctx.strokeStyle = 'rgba(5, 12, 26, 0.95)'
        ctx.lineWidth = 4
        ctx.fillStyle = `rgb(${accentRgb})`
        ctx.font = '700 36px "Segoe UI", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = `${keyword} ${percent.toFixed(1)}%`
        ctx.strokeText(label, logicalWidth / 2, logicalHeight / 2)
        ctx.fillText(label, logicalWidth / 2, logicalHeight / 2)

        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
        })
        const sprite = new THREE.Sprite(material)
        sprite.scale.set(1.58, 0.44, 1)
        return sprite
    }

    data.forEach((entry, index) => {
        const lat = 56 - index * 24
        const lon = (index / n) * 360 + 40
        const radius = 1.42 + Math.max(0, entry.value) / 100 * 0.42
        const phi = (90 - lat) * (Math.PI / 180)
        const theta = (lon + 180) * (Math.PI / 180)
        const x = -(radius * Math.sin(phi) * Math.cos(theta))
        const y = radius * Math.cos(phi)
        const z = radius * Math.sin(phi) * Math.sin(theta)

        const marker = new THREE.Mesh(
            markerGeometry,
            new THREE.MeshBasicMaterial({ color: entry.color }),
        )
        marker.position.set(x, y, z)
        labelsGroup.add(marker)

        const percentSprite = makePercentSprite(entry.name, entry.value, entry.color)
        percentSprite.position.set(x * 1.1, y * 1.1, z * 1.1)
        labelsGroup.add(percentSprite)

        const guideGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, y, z),
            new THREE.Vector3(x * 1.07, y * 1.07, z * 1.07),
        ])
        const guide = new THREE.Line(
            guideGeometry,
            new THREE.LineBasicMaterial({
                color: entry.color,
                transparent: true,
                opacity: 0.82,
            }),
        )
        labelsGroup.add(guide)

        const beamGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3((x * 1.35) / radius, (y * 1.35) / radius, (z * 1.35) / radius),
            new THREE.Vector3(x, y, z),
        ])
        const beam = new THREE.Line(
            beamGeometry,
            new THREE.LineBasicMaterial({
                color: entry.color,
                transparent: true,
                opacity: 0.72,
            }),
        )
        labelsGroup.add(beam)
    })

    const clock = new THREE.Clock()
    const animate = () => {
        const t = clock.getElapsedTime()
        sphere.rotation.y += autoRotateSpeed
        wire.rotation.y -= autoRotateSpeed * 1.6
        ring.rotation.z += autoRotateSpeed * 2.2
        ring.material.opacity = 0.25 + Math.sin(t * 1.4) * 0.1

        labelsGroup.children.forEach((obj: THREE.Object3D, idx: number) => {
            if (obj instanceof THREE.Mesh) {
                const pulse = 1 + Math.sin(t * 2.8 + idx * 0.9) * 0.18
                obj.scale.setScalar(pulse)
            }
            if (obj instanceof THREE.Sprite) {
                const scalePulse = 1 + Math.sin(t * 1.6 + idx * 0.45) * 0.03
                obj.scale.set(1.58 * scalePulse, 0.44 * scalePulse, 1)
            }
        })

        controls.update()
        renderer.render(scene, camera)
        frameId = window.requestAnimationFrame(animate)
    }

    const resize = () => {
        const nextW = Math.max(240, container.clientWidth)
        const nextH = Math.max(220, container.clientHeight)
        camera.aspect = nextW / nextH
        camera.updateProjectionMatrix()
        renderer.setSize(nextW, nextH)
    }

    let frameId = window.requestAnimationFrame(animate)

    globeInstances.push({ renderer, scene, camera, controls, frameId, resize })
}

function disposeAoiGlobes() {
    globeInstances.forEach((instance) => {
        window.cancelAnimationFrame(instance.frameId)
        instance.controls.dispose()
        instance.scene.traverse((obj: THREE.Object3D) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose()
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m: THREE.Material) => m.dispose())
                } else {
                    obj.material.dispose()
                }
            }
            if (obj instanceof THREE.Line) {
                obj.geometry.dispose()
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m: THREE.Material) => m.dispose())
                } else {
                    obj.material.dispose()
                }
            }
        })
        instance.renderer.dispose()
    })
    globeInstances.length = 0
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
    globeInstances.forEach((instance) => instance.resize())
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
    disposeAoiGlobes()
    gaugeChart?.dispose()
    middleTopChart?.dispose()
    gaugeChart = null
    middleTopChart = null
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
                        <small>医生建议</small>
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
                    <div class="middle-bottom-chart aoi-3d-wrap">
                        <div class="aoi-3d-grid">
                            <div class="aoi-3d-panel">
                                <h4>患儿 AOI 球体</h4>
                                <ul class="aoi-name-tags" :class="{ collapsed: !showPatientTags }"
                                    @click="showPatientTags = !showPatientTags">
                                    <li v-if="!showPatientTags" class="collapsed-title">
                                        <b>索引</b>
                                    </li>
                                    <li v-for="item in patientAoiStats" :key="`pt-tag-${item.name}`"
                                        v-show="showPatientTags" :style="{ '--tag-color': item.color }">
                                        <span class="dot" :style="{ backgroundColor: item.color }"></span>
                                        <b>{{ item.name }}</b>
                                    </li>
                                </ul>
                                <div ref="patientGlobeRef" class="aoi-3d-canvas"></div>
                            </div>
                            <div class="aoi-3d-panel">
                                <h4>常模 AOI 球体</h4>
                                <ul class="aoi-name-tags" :class="{ collapsed: !showBaselineTags }"
                                    @click="showBaselineTags = !showBaselineTags">
                                    <li v-if="!showBaselineTags" class="collapsed-title">
                                        <b>索引</b>
                                    </li>
                                    <li v-for="item in baselineAoiStats" :key="`bs-tag-${item.name}`"
                                        v-show="showBaselineTags" :style="{ '--tag-color': item.color }">
                                        <span class="dot" :style="{ backgroundColor: item.color }"></span>
                                        <b>{{ item.name }}</b>
                                    </li>
                                </ul>
                                <div ref="baselineGlobeRef" class="aoi-3d-canvas"></div>
                            </div>
                        </div>
                    </div>
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
    position: relative;
    width: 100%;
    height: 264px;
    margin-top: 8px;
    border-radius: 10px;
    background:
        radial-gradient(circle at 50% 84%, rgba(44, 132, 230, 0.3) 0%, rgba(11, 24, 45, 0) 66%),
        linear-gradient(180deg, rgba(12, 30, 58, 0.36), rgba(8, 17, 35, 0.15));
}

.risk-block {
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        left: -6%;
        right: -6%;
        bottom: -46%;
        height: 76%;
        background: radial-gradient(circle at 50% 0%, rgba(45, 182, 255, 0.28), rgba(45, 182, 255, 0));
        filter: blur(10px);
        pointer-events: none;
        z-index: 0;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg,
                rgba(56, 214, 255, 0) 0%,
                rgba(56, 214, 255, 0.18) 52%,
                rgba(56, 214, 255, 0) 100%);
        transform: translateY(-100%);
        animation: gauge-scan 6.2s ease-in-out infinite;
        pointer-events: none;
        mix-blend-mode: screen;
        z-index: 0;
    }

    >* {
        position: relative;
        z-index: 1;
    }
}

.legend-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: center;
    gap: 8px;
    color: #9ba8ca;
    font-size: 11px;

    span {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    span:nth-child(1) {
        justify-self: start;
    }

    span:nth-child(2) {
        justify-self: center;
    }

    span:nth-child(3) {
        justify-self: end;
    }

    i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        box-shadow: 0 0 10px currentColor;
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
    margin: 4px 0 0;
    text-align: center;
    color: #9ab9e6;
    font-size: 11px;
}

@keyframes gauge-scan {
    0% {
        transform: translateY(-100%);
        opacity: 0;
    }

    22% {
        opacity: 0.78;
    }

    50% {
        transform: translateY(0%);
        opacity: 0.45;
    }

    78% {
        opacity: 0.7;
    }

    100% {
        transform: translateY(100%);
        opacity: 0;
    }
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

.middle-bottom-chart {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    background:
        radial-gradient(circle at 50% 52%, rgba(34, 72, 132, 0.28) 0%, rgba(14, 24, 46, 0) 60%),
        linear-gradient(180deg, rgba(14, 30, 57, 0.3), rgba(7, 16, 33, 0.08));

    &::before {
        content: '';
        position: absolute;
        left: -8%;
        right: -8%;
        top: -20%;
        bottom: -20%;
        background: conic-gradient(from 0deg,
                rgba(26, 230, 255, 0) 0deg,
                rgba(26, 230, 255, 0.24) 80deg,
                rgba(26, 230, 255, 0) 160deg,
                rgba(255, 209, 102, 0.18) 230deg,
                rgba(255, 209, 102, 0) 300deg,
                rgba(26, 230, 255, 0) 360deg);
        filter: blur(18px);
        opacity: 0.42;
        animation: aoi-glow-spin 16s linear infinite;
        pointer-events: none;
        z-index: 0;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg,
                rgba(30, 242, 255, 0) 0%,
                rgba(30, 242, 255, 0.16) 48%,
                rgba(30, 242, 255, 0) 100%);
        transform: translateY(-100%);
        animation: aoi-scan 5.6s ease-in-out infinite;
        mix-blend-mode: screen;
        pointer-events: none;
        z-index: 1;
    }

    :deep(canvas) {
        position: relative;
        z-index: 2;
    }
}

.aoi-3d-wrap {
    padding: 10px;
}

.aoi-3d-grid {
    position: relative;
    z-index: 2;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.aoi-3d-panel {
    position: relative;
    border-radius: 10px;
    border: 1px solid rgba(92, 137, 189, 0.24);
    background: linear-gradient(180deg, rgba(20, 39, 70, 0.56), rgba(9, 20, 40, 0.45));
    padding: 8px 10px;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(180px, 1fr);
    box-shadow: inset 0 0 30px rgba(64, 145, 255, 0.08);

    h4 {
        margin: 0;
        color: #e6f2ff;
        font-size: 14px;
        font-weight: 700;
    }
}

.aoi-3d-canvas {
    width: 100%;
    height: clamp(180px, 21vh, 230px);
    touch-action: none;
    cursor: grab;
}

.aoi-3d-canvas:active {
    cursor: grabbing;
}

.aoi-name-tags {
    position: absolute;
    top: 40px;
    right: 10px;
    margin: 0;
    padding: 8px;
    width: 106px;
    list-style: none;
    display: grid;
    gap: 4px;
    border: 1px solid rgba(94, 145, 202, 0.24);
    border-radius: 8px;
    background: rgba(8, 18, 38, 0.68);
    backdrop-filter: blur(2px);
    z-index: 3;
    cursor: pointer;
    transition: opacity 0.18s ease, transform 0.18s ease;

    li {
        --tag-color: #d9e9ff;
        display: grid;
        grid-template-columns: 10px auto;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .collapsed-title {
        grid-template-columns: 1fr;

        b {
            color: #d2ecff;
            text-align: center;
        }
    }

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        box-shadow: 0 0 10px currentColor;
    }

    b {
        color: var(--tag-color);
        text-shadow: 0 0 10px color-mix(in srgb, var(--tag-color) 62%, transparent);
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
    }
}

.aoi-name-tags.collapsed {
    width: 62px;
    padding: 6px 8px;
    top: 10px;
    opacity: 0.92;
}

@keyframes aoi-glow-spin {
    from {
        transform: rotate(0deg) scale(1);
    }

    50% {
        transform: rotate(180deg) scale(1.05);
    }

    to {
        transform: rotate(360deg) scale(1);
    }
}

@keyframes aoi-scan {
    0% {
        transform: translateY(-100%);
        opacity: 0;
    }

    20% {
        opacity: 0.7;
    }

    50% {
        transform: translateY(0%);
        opacity: 0.4;
    }

    80% {
        opacity: 0.7;
    }

    100% {
        transform: translateY(100%);
        opacity: 0;
    }
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

    .aoi-3d-grid {
        grid-template-columns: 1fr;
        height: auto;
    }

    .aoi-3d-canvas {
        height: 190px;
    }

    .report-video {
        max-height: 360px;
    }
}
</style>
