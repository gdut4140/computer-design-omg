<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'

const trendRef = ref<HTMLDivElement | null>(null)
const radarRef = ref<HTMLDivElement | null>(null)

let trendChart: echarts.ECharts | null = null
let radarChart: echarts.ECharts | null = null

function renderTrendChart() {
  if (!trendRef.value) return

  trendChart = echarts.init(trendRef.value)
  trendChart.setOption({
    grid: { left: 56, right: 24, top: 26, bottom: 36 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['02.28', '03.05', '03.10', '03.15'],
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
        data: [45, 39, 30, 72],
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

  radarChart = echarts.init(radarRef.value)
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
            value: [72, 78, 48, 66, 40],
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

        <h3>🔍 患儿筛查历史搜索</h3>
        <label>
          患儿姓名
          <input type="text" />
        </label>
        <label>
          身份证号
          <input type="text" />
        </label>

        <button class="search-btn" type="button">⌕ 查询</button>

        <h3>🕘 历史筛查记录</h3>
        <article class="record-card">
          <div class="record-row">
            <p>2026-03-15</p>
            <b>● 中度风险</b>
          </div>
          <button type="button">◼ 查看视频</button>
        </article>
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
  min-height: calc(100vh - 128px);
  display: flex;
}

.history-grid {
  display: grid;
  grid-template-columns: 390px minmax(0, 1fr);
  gap: 16px;
  width: 100%;
  flex: 1;
  align-items: stretch;
}

.left-panel {
  border-radius: 16px;
  border: 1px solid rgba(95, 118, 164, 0.2);
  background: rgba(33, 46, 77, 0.86);
  padding: 20px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;

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
}

.record-card {
  margin-top: 8px;
  border-radius: 12px;
  background: rgba(24, 36, 66, 0.76);
  border: 1px solid rgba(66, 86, 132, 0.35);
  padding: 12px;

  .record-row {
    margin-top: auto;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    p {
      margin: 0;
      color: #e2ecff;
      font-size: 14px;
    grid-template-rows: 1fr 1fr;
      font-weight: 700;
    height: 100%;
      line-height: 1.35;
    }

    b {
      color: #ffbe29;
      font-size: 14px;
      font-weight: 700;
    }
  }

  button {
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

.right-panel {
  display: grid;
  gap: 16px;
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
    min-height: auto;
    display: block;
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
