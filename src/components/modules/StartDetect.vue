<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

type RiskLevel = 'low' | 'mid' | 'high'

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

const mockChildren: ChildDetectProfile[] = [
  {
    id: 'c-001',
    name: '张小萌',
    code: 'SE20240315001',
    age: 2,
    gender: '女',
    progress: 60,
    elapsed: '02:34',
    total: '05:00',
    histories: [
      { date: '2024.03.10', risk: '低风险', rate: '异常概率 12.1%', level: 'low' },
      { date: '2024.02.28', risk: '中风险', rate: '异常概率 45.2%', level: 'mid' },
    ],
  },
  {
    id: 'c-002',
    name: '李安安',
    code: 'SE20240402007',
    age: 4,
    gender: '男',
    progress: 34,
    elapsed: '01:42',
    total: '05:00',
    histories: [
      { date: '2024.03.29', risk: '中风险', rate: '异常概率 41.6%', level: 'mid' },
      { date: '2024.03.18', risk: '高风险', rate: '异常概率 72.4%', level: 'high' },
    ],
  },
  {
    id: 'c-003',
    name: '王星语',
    code: 'SE20240405003',
    age: 3,
    gender: '女',
    progress: 82,
    elapsed: '04:07',
    total: '05:00',
    histories: [
      { date: '2024.03.30', risk: '低风险', rate: '异常概率 9.3%', level: 'low' },
      { date: '2024.03.14', risk: '低风险', rate: '异常概率 14.7%', level: 'low' },
    ],
  },
]

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

const selectedChildId = ref(mockChildren[0]?.id ?? fallbackChild.id)
const selectedChild = computed<ChildDetectProfile>(() => {
  return mockChildren.find((item) => item.id === selectedChildId.value) ?? mockChildren[0] ?? fallbackChild
})

const router = useRouter()

function goAnalysisReport() {
  router.push({ name: 'analysis-report' })
}
</script>

<template>
  <section class="detect-page">
    <div class="detect-grid">
      <aside class="left-panel">
        <h3>患儿信息</h3>

        <div class="child-picker">
          <span>选择患儿</span>
          <el-select v-model="selectedChildId" placeholder="请选择患儿" size="large">
            <el-option
              v-for="child in mockChildren"
              :key="child.id"
              :label="`${child.name}（${child.age}岁 · ${child.gender}）`"
              :value="child.id"
            />
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
            <strong>{{ selectedChild.progress }}%</strong>
          </div>
          <div class="bar-wrap"><i :style="{ width: `${selectedChild.progress}%` }"></i></div>
        </div>

        <h4>历史记录</h4>
        <div class="history-list">
          <article v-for="item in selectedChild.histories" :key="`${item.date}-${item.risk}`" class="history-item">
            <div>
              <p>{{ item.date }}</p>
              <span>{{ item.rate }}</span>
            </div>
            <b :class="item.level">{{ item.risk }}</b>
          </article>
        </div>

        <button class="action-btn start" @click="goAnalysisReport">▶ 开始检测</button>
      </aside>

      <main class="center-panel">
        <div class="detect-meta">
          <span class="badge">● 检测中</span>
          <p><strong>{{ selectedChild.elapsed }}</strong> / {{ selectedChild.total }}</p>
        </div>

        <section class="viewer-box" aria-label="检测画面">
          <span class="crosshair"></span>
        </section>

        <button class="fullscreen-btn">⤢ 全屏查看</button>
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

  > div {
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
  }
}

.history-list {
  display: grid;
  gap: 8px;
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
    justify-content: space-between;
    margin-bottom: 12px;

    .badge {
      background: #f54a3e;
      color: #fff;
      padding: 8px 18px;
      border-radius: 22px;
      font-size: 16px;
      font-weight: 700;
    }

    p {
      margin: 0;
      color: #808ba8;
      font-size: 16px;
      font-weight: 700;
    }

    strong {
      color: #16e8d8;
      font-size: 44px;
      letter-spacing: 1px;
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

.fullscreen-btn {
  display: block;
  margin: 14px auto 0;
  min-width: 170px;
  height: 50px;
  border-radius: 10px;
  border: 1px solid rgba(69, 88, 129, 0.56);
  background: rgba(23, 33, 58, 0.6);
  color: #d5def3;
  font-size: 18px;
  cursor: pointer;
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
