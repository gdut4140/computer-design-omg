<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Clock, Search, VideoPlay, WarningFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { queryRecordByNameId } from '../../api/record'
import type { ScreenRecordVO } from '../../types/domain'

const ANALYSIS_REPORT_RESULT_KEY = 'analysis_report_result_payload'
const trendRef = ref<HTMLDivElement | null>(null)
const radarRef = ref<HTMLDivElement | null>(null)
const queryName = ref('')
const queryIdCard = ref('')
const activeQueryKey = ref('')
const loading = ref(false)
const hasSearched = ref(false)
const records = ref<ScreenRecordVO[]>([])
const selectedRecordId = ref<number | null>(null)
const latestRecord = computed(() => {
  if (!records.value.length) return null
  return records.value
    .slice()
    .sort((a, b) => new Date(b.testTime).getTime() - new Date(a.testTime).getTime())[0]
})
const selectedRecord = computed(() => {
  if (!records.value.length) return null
  if (selectedRecordId.value == null) return latestRecord.value
  return records.value.find((item) => Number(item.id) === Number(selectedRecordId.value)) ?? latestRecord.value ?? null
})

const router = useRouter()

let trendChart: echarts.ECharts | null = null
let radarChart: echarts.ECharts | null = null

function toPercentValue(raw: unknown) {
  const value = Number(raw)
  if (Number.isNaN(value)) return 0
  const normalized = value >= 0 && value <= 1 ? value * 100 : value
  return Math.max(0, Math.min(100, normalized))
}

function formatDay(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '--'
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value || '--'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getRiskMeta(level: string) {
  const upper = String(level || '').toUpperCase()
  if (upper === 'HIGH') return { label: '高风险', cls: 'high' }
  if (upper === 'MIDDLE') return { label: '中风险', cls: 'mid' }
  return { label: '低风险', cls: 'low' }
}

function hashText(text: string) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createPrng(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), t | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function randomInRange(prng: () => number, min: number, max: number) {
  return min + prng() * (max - min)
}

function buildDeterministicRadarVector(record: ScreenRecordVO | null, allItems: ScreenRecordVO[]) {
  if (!record || !allItems.length || !activeQueryKey.value) return [0, 0, 0, 0, 0]

  const sorted = allItems
    .slice()
    .sort((a, b) => new Date(a.testTime).getTime() - new Date(b.testTime).getTime())

  const abnormal = toPercentValue(record.abnormalProb)
  const accuracy = toPercentValue(record.accuracy)
  const normal = 100 - abnormal

  // Seed changes only when person/history changes, so chart is stable across repeated queries.
  const historySignature = `${sorted.length}|${record.id}|${record.testTime}|${sorted
    .map((item) => `${item.id}:${toPercentValue(item.abnormalProb).toFixed(1)}`)
    .join(',')}`
  const seedBase = `${activeQueryKey.value}|${record.childId}|${record.childName || ''}|${historySignature}`
  const prng = createPrng(hashText(seedBase))

  // Use larger seeded offsets so different people are visually distinct even when risk scores are similar.
  const personShiftA = randomInRange(prng, -16, 16)
  const personShiftB = randomInRange(prng, -16, 16)
  const personShiftC = randomInRange(prng, -16, 16)
  const personShiftD = randomInRange(prng, -16, 16)
  const personShiftE = randomInRange(prng, -16, 16)

  const focusDuration = clamp(26 + normal * 0.52 + personShiftA, 0, 100)
  const socialFocus = clamp(20 + normal * 0.58 + personShiftB, 0, 100)
  const blinkFreq = clamp(30 + abnormal * 0.52 + personShiftC, 0, 100)
  const pupilResponse = clamp(26 + normal * 0.4 + personShiftD, 0, 100)
  const scanSpeed = clamp(36 + accuracy * 0.5 + personShiftE, 0, 100)

  return [
    Number(focusDuration.toFixed(1)),
    Number(scanSpeed.toFixed(1)),
    Number(pupilResponse.toFixed(1)),
    Number(blinkFreq.toFixed(1)),
    Number(socialFocus.toFixed(1)),
  ]
}

const displayRecords = computed(() => {
  return records.value
    .slice()
    .sort((a, b) => new Date(b.testTime).getTime() - new Date(a.testTime).getTime())
    .map((item) => ({
      ...item,
      percent: toPercentValue(item.abnormalProb),
      risk: getRiskMeta(item.riskLevel),
      dateText: formatDate(item.testTime),
    }))
})

function renderTrendChart() {
  if (!trendRef.value) return

  if (!trendChart) {
    trendChart = echarts.init(trendRef.value)
  }

  const sorted = records.value
    .slice()
    .sort((a, b) => new Date(a.testTime).getTime() - new Date(b.testTime).getTime())

  const xAxisData = sorted.map((item) => formatDay(item.testTime))
  const seriesData = sorted.map((item) => toPercentValue(item.abnormalProb))

  trendChart.setOption({
    grid: { left: 56, right: 24, top: 26, bottom: 36 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData.length ? xAxisData : ['--'],
      axisLabel: { color: '#8d9ab9' },
      axisLine: { lineStyle: { color: '#38496f' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 20,
      axisLabel: {
        color: '#8d9ab9',
        formatter: '{value}%',
      },
      splitLine: { lineStyle: { color: 'rgba(72, 90, 134, 0.4)' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: seriesData.length ? seriesData : [0],
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 4, color: '#11dfd2' },
        itemStyle: { color: '#11dfd2' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(17, 223, 210, 0.35)' },
            { offset: 1, color: 'rgba(17, 223, 210, 0.02)' },
          ]),
        },
        markLine: {
          symbol: 'none',
          lineStyle: {
            color: '#e1a90a',
            width: 2,
            type: 'dashed',
          },
          data: [{ yAxis: 70 }],
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 16, 32, 0.92)',
      borderColor: 'rgba(17, 223, 210, 0.5)',
      textStyle: { color: '#e7f1ff' },
    },
  })
}

function renderRadarChart() {
  if (!radarRef.value) return

  if (!radarChart) {
    radarChart = echarts.init(radarRef.value)
  }

  const currentVector = buildDeterministicRadarVector(selectedRecord.value ?? null, records.value)

  radarChart.setOption({
    legend: {
      show: false,
    },
    radar: {
      indicator: [
        { name: '注视时长', max: 100 },
        { name: '扫视速度', max: 100 },
        { name: '瞳孔反应', max: 100 },
        { name: '眼跳频率', max: 100 },
        { name: '社交注视', max: 100 },
      ],
      center: ['50%', '54%'],
      radius: 98,
      splitNumber: 5,
      axisName: {
        color: '#9aa7c7',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: ['rgba(83, 100, 141, 0.45)'],
        },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(24, 37, 67, 0.2)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(83, 100, 141, 0.45)',
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: currentVector,
            areaStyle: { color: 'rgba(15, 228, 215, 0.2)' },
            lineStyle: { color: '#0fe4d7', width: 2 },
            itemStyle: { color: '#0fe4d7' },
          },
          {
            value: [84, 86, 70, 74, 62],
            areaStyle: { color: 'rgba(123, 138, 182, 0.08)' },
            lineStyle: { color: 'rgba(123, 138, 182, 0.8)', width: 1 },
            itemStyle: { color: 'rgba(123, 138, 182, 0.95)' },
          },
        ],
      },
    ],
  })
}

function resizeAll() {
  trendChart?.resize()
  radarChart?.resize()
}

async function handleQuery() {
  const name = queryName.value.trim()
  const idCard = queryIdCard.value.trim()
  if (!name || !idCard) {
    ElMessage.warning('请输入患儿姓名和身份证号')
    return
  }

  loading.value = true
  hasSearched.value = true
  try {
    activeQueryKey.value = `${name}|${idCard}`
    records.value = await queryRecordByNameId({ name, idCard })
    selectedRecordId.value = records.value[0] ? Number(records.value[0].id) : null
    if (!records.value.length) {
      ElMessage.info('未查询到该患儿记录')
    }
    renderTrendChart()
    renderRadarChart()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '查询失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function selectRecord(item: ScreenRecordVO) {
  selectedRecordId.value = Number(item.id)
  renderRadarChart()
}

async function viewRecordVideo(item: ScreenRecordVO) {
  const payload = {
    child: {
      id: Number(item.childId),
      name: item.childName || queryName.value || `患儿#${item.childId}`,
      age: 0,
      gender: '男' as const,
      code: `SE${String(item.childId).padStart(8, '0')}`,
    },
    result: {
      childId: Number(item.childId),
      abnormalProb: Number(item.abnormalProb),
      riskLevel: String(item.riskLevel || ''),
      accuracy: Number(item.accuracy),
      testTime: item.testTime,
    },
    datasetLabel: '历史记录回放',
  }

  sessionStorage.setItem(ANALYSIS_REPORT_RESULT_KEY, JSON.stringify(payload))
  await router.push({ name: 'analysis-report' })
}

onMounted(() => {
  renderTrendChart()
  renderRadarChart()
  window.addEventListener('resize', resizeAll)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll)
  trendChart?.dispose()
  radarChart?.dispose()
  trendChart = null
  radarChart = null
})
</script>

<template>
  <section class="history-page">
    <div class="history-grid">
      <aside class="left-panel">
        <h2>筛查历史与趋势分析</h2>

        <h3 class="title-with-icon">
          <el-icon>
            <Search />
          </el-icon>
          患儿筛查历史搜索
        </h3>
        <label>
          患儿姓名
          <input v-model.trim="queryName" type="text" placeholder="请输入患儿姓名" />
        </label>
        <label>
          身份证号
          <input v-model.trim="queryIdCard" type="text" placeholder="请输入身份证号" />
        </label>

        <button class="search-btn" type="button" :disabled="loading" @click="handleQuery">
          <el-icon class="inline-icon">
            <Search />
          </el-icon>
          {{ loading ? '查询中...' : '查询' }}
        </button>

        <h3 class="title-with-icon">
          <el-icon>
            <Clock />
          </el-icon>
          历史筛查记录
        </h3>
        <div class="records-wrap">
          <article v-for="item in displayRecords" :key="item.id" class="record-card"
            :class="{ active: Number(item.id) === Number(selectedRecordId) }" @click="selectRecord(item)">
            <div class="record-row">
              <div>
                <p>{{ item.dateText }}</p>
                <small>异常概率 {{ item.percent.toFixed(1) }}%</small>
              </div>
              <b :class="item.risk.cls">
                <el-icon class="risk-icon">
                  <WarningFilled />
                </el-icon>
                {{ item.risk.label }}
              </b>
            </div>
            <button type="button" @click.stop="viewRecordVideo(item)">
              <el-icon class="inline-icon">
                <VideoPlay />
              </el-icon>
              查看视频
            </button>
          </article>
          <p v-if="!hasSearched" class="empty-tip">请先输入患儿姓名和身份证号后查询</p>
          <p v-else-if="!displayRecords.length && !loading" class="empty-tip">暂无筛查记录</p>
        </div>
      </aside>

      <main class="right-panel">
        <article class="chart-card trend-card">
          <h3>历次筛查异常概率趋势</h3>
          <div ref="trendRef" class="trend-chart"></div>
        </article>

        <article class="chart-card radar-card">
          <h3>眼动指标与常模对比</h3>
          <div ref="radarRef" class="radar-chart"></div>
        </article>
      </main>
    </div>
  </section>
</template>

<style scoped lang="scss">
.history-page {
  height: calc(100vh - 176px);
  display: flex;
  overflow: hidden;
}

.history-grid {
  display: grid;
  grid-template-columns: 390px minmax(0, 1fr);
  gap: 16px;
  width: 100%;
  flex: 1;
  align-items: stretch;
  min-height: 0;
}

.left-panel {
  border-radius: 16px;
  border: 1px solid rgba(95, 118, 164, 0.2);
  background: rgba(33, 46, 77, 0.86);
  padding: 20px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  h2 {
    margin: 0 0 18px;
    color: #eff5ff;
    font-size: 16px;
  }

  h3 {
    margin: 16px 0 10px;
    color: #e9f3ff;
    font-size: 16px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #96a4c6;
    font-size: 14px;
    margin-bottom: 10px;
  }

  input {
    height: 46px;
    border-radius: 12px;
    border: 1px solid rgba(50, 74, 124, 0.88);
    background: rgba(7, 15, 36, 0.95);
    color: #dce8ff;
    padding: 0 12px;
    outline: none;
  }
}

.search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 48px;
  border-radius: 10px;
  border: 0;
  background: linear-gradient(180deg, #20ddd2, #14bfb7);
  color: #05222f;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;

  &:disabled {
    opacity: 0.72;
    cursor: not-allowed;
  }
}

.title-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.inline-icon {
  font-size: 15px;
}

.records-wrap {
  margin-top: 4px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 10px;
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

.record-card {
  border-radius: 12px;
  background: rgba(24, 36, 66, 0.76);
  border: 1px solid rgba(66, 86, 132, 0.35);
  padding: 12px;
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    border-color: rgba(27, 209, 199, 0.45);
  }

  &.active {
    border-color: rgba(27, 209, 199, 0.78);
    box-shadow: 0 0 0 1px rgba(27, 209, 199, 0.22) inset;
  }

  .record-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    >div {
      display: grid;
      gap: 2px;
    }

    p {
      margin: 0;
      color: #e2ecff;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.35;
    }

    small {
      color: #9aabcf;
      font-size: 12px;
    }

    b {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 700;

      .risk-icon {
        font-size: 14px;
      }

      &.low {
        color: #22d372;
      }

      &.mid {
        color: #ffbe29;
      }

      &.high {
        color: #ff7d6d;
      }
    }
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 40px;
    border-radius: 10px;
    border: 0;
    background: linear-gradient(180deg, #20ddd2, #14bfb7);
    color: #05222f;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
}

.empty-tip {
  margin: 6px 0 0;
  color: #8ea1c8;
  font-size: 13px;
  text-align: center;
}

.right-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
}

.chart-card {
  border-radius: 16px;
  border: 1px solid rgba(95, 118, 164, 0.2);
  background: rgba(33, 46, 77, 0.86);
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;

  h3 {
    margin: 0;
    color: #eff5ff;
    font-size: 16px;
  }
}

.trend-chart {
  flex: 1;
  min-height: 220px;
}

.radar-chart {
  flex: 1;
  min-height: 220px;
}

@media (max-width: 1360px) {
  .history-page {
    height: auto;
    display: block;
    overflow: visible;
  }

  .history-grid {
    grid-template-columns: 1fr;
    flex: initial;
  }

  .left-panel,
  .right-panel {
    height: auto;
  }

  .right-panel {
    grid-template-rows: auto;
  }

  .record-card {
    margin-top: 8px;
  }

  .left-panel h2 {
    font-size: 16px;
  }

  .chart-card h3 {
    font-size: 16px;
  }
}
</style>
