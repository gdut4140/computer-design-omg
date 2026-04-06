<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '../components/header.vue'
import InfoComplete from '../components/modules/InfoComplete.vue'
import StartDetect from '../components/modules/StartDetect.vue'
import AnalysisReport from '../components/modules/AnalysisReport.vue'
import HistoryReport from '../components/modules/HistoryReport.vue'
import ProfileCenter from '../components/modules/ProfileCenter.vue'

const route = useRoute()

const modules = {
  'patient-info': InfoComplete,
  'start-detect': StartDetect,
  'analysis-report': AnalysisReport,
  'history-report': HistoryReport,
  profile: ProfileCenter,
}

const currentModule = computed(() => {
  const name = String(route.name ?? 'patient-info') as keyof typeof modules
  return modules[name] ?? InfoComplete
})
</script>

<template>
  <section class="space-screen module-screen">
    <div class="stars-layer"></div>
    <aside class="gear-rail gear-rail-left" aria-hidden="true">
      <div class="rail-core"></div>
      <div class="gear gear-xl spin-cw"></div>
      <div class="gear gear-md spin-ccw"></div>
      <div class="gear gear-sm spin-cw"></div>
      <div class="joint joint-a"></div>
      <div class="joint joint-b"></div>
    </aside>

    <aside class="gear-rail gear-rail-right" aria-hidden="true">
      <div class="rail-core"></div>
      <div class="gear gear-lg spin-ccw"></div>
      <div class="gear gear-md spin-cw"></div>
      <div class="gear gear-sm spin-ccw"></div>
      <div class="joint joint-a"></div>
      <div class="joint joint-b"></div>
    </aside>

    <div class="module-container">
      <Header />
      <component :is="currentModule" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.module-screen {
  display: block;
  min-height: 100vh;
  padding: 18px 108px 20px;
}

.gear-rail {
  position: absolute;
  top: 106px;
  bottom: 24px;
  width: 96px;
  z-index: 1;
  pointer-events: none;
  border-radius: 16px;
  border: 1px solid rgba(47, 92, 150, 0.36);
  background: linear-gradient(180deg, rgba(22, 39, 72, 0.78), rgba(15, 28, 54, 0.72));
  box-shadow: inset 0 0 28px rgba(12, 25, 51, 0.62);
  overflow: hidden;
}

.gear-rail-left {
  left: 10px;
}

.gear-rail-right {
  right: 10px;
}

.rail-core {
  position: absolute;
  left: 44px;
  top: 0;
  bottom: 0;
  width: 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(36, 87, 144, 0.2), rgba(36, 217, 208, 0.65), rgba(36, 87, 144, 0.2));
}

.gear {
  position: absolute;
  border-radius: 50%;
  background:
    repeating-conic-gradient(
      from 0deg,
      rgba(36, 211, 207, 0.9) 0deg 10deg,
      rgba(31, 79, 128, 0.98) 10deg 20deg
    );
  border: 2px solid rgba(89, 164, 208, 0.5);
  box-shadow: 0 0 20px rgba(20, 219, 208, 0.24);

  &::before {
    content: '';
    position: absolute;
    inset: 22%;
    border-radius: 50%;
    background: rgba(11, 28, 56, 0.95);
    border: 2px solid rgba(66, 117, 169, 0.58);
  }

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 8px;
    height: 8px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: #35dfd8;
    box-shadow: 0 0 10px rgba(32, 231, 217, 0.7);
  }
}

.gear-xl {
  width: 66px;
  height: 66px;
  left: 14px;
  top: 60px;
}

.gear-lg {
  width: 58px;
  height: 58px;
  left: 20px;
  top: 74px;
}

.gear-md {
  width: 48px;
  height: 48px;
  left: 38px;
  top: 184px;
}

.gear-sm {
  width: 36px;
  height: 36px;
  left: 18px;
  top: 280px;
}

.gear-rail-right .gear-md {
  left: 14px;
  top: 194px;
}

.gear-rail-right .gear-sm {
  left: 46px;
  top: 286px;
}

.joint {
  position: absolute;
  left: 42px;
  width: 12px;
  border-radius: 999px;
  background: rgba(48, 210, 206, 0.32);
}

.joint-a {
  top: 128px;
  height: 56px;
}

.joint-b {
  top: 232px;
  height: 56px;
}

.spin-cw {
  animation: spinClockwise 7.2s linear infinite;
}

.spin-ccw {
  animation: spinCounter 8.4s linear infinite;
}

.module-container {
  position: relative;
  z-index: 2;
  width: 100%;
  margin: 0;
  padding-top: 84px;
}

@keyframes spinClockwise {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinCounter {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@media (max-width: 1100px) {
  .module-screen {
    padding: 14px 10px 18px;
  }

  .module-container {
    width: 100%;
    padding-top: 68px;
  }

  .gear-rail {
    display: none;
  }
}
</style>
