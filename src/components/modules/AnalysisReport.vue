<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function renderChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption({
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
            width: 32,
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
        progress: { show: false },
        detail: {
          valueAnimation: false,
          offsetCenter: [0, '-26%'],
          fontSize: 52,
          fontWeight: 700,
          color: '#ff5549',
          formatter: '{value}%',
        },
        data: [{ value: 85.3 }],
        anchor: {
          show: true,
          showAbove: true,
          size: 18,
          itemStyle: {
            color: '#f4f8ff',
          },
          offsetCenter: [0, '8%'],
        },
      },
    ],
  })
}

function resizeChart() {
  chart?.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
  chart = null
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
      <div class="person-item">👤 张小萌</div>
      <div class="person-item">🎂 2岁 · 女</div>
      <div class="person-item">📅 2024.03.15 14:32</div>
    </div>

    <div class="content-grid">
      <div class="left-col">
        <article class="report-card gauge-card">
          <h3>筛查风险评估</h3>
          <div ref="chartRef" class="gauge-chart"></div>

          <div class="legend-row">
            <span><i class="low"></i>低风险 &lt;30%</span>
            <span><i class="mid"></i>当前概率</span>
            <span><i class="high"></i>高风险 &gt;70%</span>
          </div>
          <p class="mid-tip">中风险 30-70%</p>
        </article>

        <article class="report-card analysis-result-card">
          <header>
            <h3>筛查结果</h3>
            <b>高风险</b>
          </header>

          <p class="diagnose">疑似自闭症谱系障碍</p>

          <div class="advice-box">
            <small>医生建议</small>
            <p>建议立即预约专科医生进行进一步诊断</p>
          </div>
        </article>
      </div>

      <article class="report-card video-card">
        <h3>📹 视频回放</h3>

        <div class="video-stage">
          <button type="button" aria-label="播放视频">▶</button>
          <span class="duration">03:45</span>
        </div>

        <div class="video-footer">
          <span>眼动轨迹已叠加</span>
          <button type="button" class="download-btn">⇩ 下载视频</button>
        </div>
      </article>

      <article class="explain-card">
        <h3>ℹ 结果说明</h3>

        <div class="explain-block">
          <h4>什么是兴趣区域（AOI）？</h4>
          <p>
            指眼睛、鼻子、嘴巴等区域，正常孩子会多注视这里，
            这是社交互动的重要指标。
          </p>
        </div>

        <div class="explain-block result">
          <h4>本次检测结果</h4>
          <p>
            孩子在社交区注视时间较短（仅
            <strong>15%</strong>
            ），背景非社交区注视时间过长（
            <strong>85%</strong>
            ），存在社交回避倾向。
          </p>
        </div>
      </article>

    </div>
  </section>
</template>

<style scoped lang="scss">
.analysis-page {
  margin-top: 6px;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  width: 100%;
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
  gap: 34px;
  border-radius: 12px;
  border: 1px solid rgba(86, 104, 147, 0.2);
  background: rgba(37, 48, 78, 0.72);
  color: #d8e3fb;
  padding: 8px 14px;
  margin-bottom: 18px;
}

.person-item {
  font-size: 14px;
  letter-spacing: 0.2px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(390px, 460px) minmax(0, 1fr) minmax(340px, 380px);
  grid-template-areas: 'left video explain';
  gap: 18px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

.left-col {
  grid-area: left;
  display: grid;
  grid-template-rows: minmax(360px, 1fr) minmax(196px, auto);
  gap: 16px;
  min-width: 0;
  min-height: 0;
}

.report-card {
  border-radius: 14px;
  border: 1px solid rgba(95, 118, 164, 0.2);
  background: rgba(35, 47, 79, 0.86);
  padding: 18px 22px;
  overflow: hidden;

  h3 {
    margin: 0;
    color: #edf3ff;
    font-size: 16px;
  }
}

.gauge-card {
  min-height: 360px;

  .gauge-chart {
    height: 264px;
    margin-top: 8px;
  }
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #9ba8ca;
  font-size: 11px;

  span {
    display: flex;
    align-items: center;
    gap: 5px;
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

.analysis-result-card {
  min-height: 196px;
  display: flex;
  flex-direction: column;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  b {
    background: #ff4638;
    color: #fff;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
  }

  .diagnose {
    margin: 0 0 10px;
    color: #d8e2fb;
    font-size: 14px;
    flex: 1;
  }
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
    font-weight: 600;
    word-break: break-all;
  }
}

.video-card {
  grid-area: video;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;

  h3 {
    margin-bottom: 14px;
  }
}

.explain-card {
  grid-area: explain;
  border-radius: 14px;
  border: 1px solid rgba(95, 118, 164, 0.2);
  background: rgba(20, 30, 58, 0.72);
  padding: 20px 16px 14px;
  min-height: 0;
  height: 100%;

  h3 {
    margin: 0 0 12px;
    color: #edf3ff;
    font-size: 18px;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.explain-block {
  margin-top: 8px;

  h4 {
    margin: 0 0 8px;
    color: #16dfd2;
    font-size: 20px;
    line-height: 1.25;
  }

  p {
    margin: 0;
    color: #a5b1cc;
    font-size: 13px;
    line-height: 1.75;
    word-break: break-word;
  }

  strong {
    color: #ff4d41;
    font-size: 22px;
    line-height: 1;
    display: inline;
  }

  &.result {
    margin-top: 14px;
  }
}

.video-stage {
  flex: 1;
  min-height: 500px;
  border-radius: 12px;
  background: rgba(16, 27, 54, 0.78);
  border: 1px solid rgba(56, 78, 126, 0.45);
  display: grid;
  place-items: center;
  position: relative;

  button {
    width: 52px;
    height: 52px;
    border: 0;
    border-radius: 50%;
    background: #12cfc2;
    color: #052235;
    font-size: 22px;
    cursor: pointer;
  }

  .duration {
    position: absolute;
    right: 12px;
    bottom: 12px;
    background: rgba(8, 13, 27, 0.88);
    color: #cbd7f2;
    font-size: 14px;
    border-radius: 8px;
    padding: 4px 8px;
  }
}

.video-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #9eabc9;
  font-size: 13px;
}

.download-btn {
  border-radius: 12px;
  border: 1px solid rgba(36, 210, 199, 0.6);
  background: transparent;
  color: #dbebff;
  padding: 6px 12px;
  cursor: pointer;
}

@media (max-width: 1300px) {
  .analysis-page {
    min-height: auto;
  }

  .content-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'left'
      'video'
      'explain';
    flex: initial;
  }

  .left-col {
    grid-template-rows: initial;
  }

  .video-stage {
    min-height: 360px;
  }
}
</style>
