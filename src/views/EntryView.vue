<script setup lang="ts">
import { useRouter } from 'vue-router'
import AnimatedEyeLogo from '../components/AnimatedEyeLogo.vue'

const router = useRouter()

function goLogin() {
  router.push({ name: 'login' })
}
</script>

<template>
  <section class="space-screen">
    <div class="stars-layer"></div>
    <div class="curve curve-left" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <div class="curve curve-right" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>

    <div class="entry-panel">
      <div class="logo-wrap">
        <AnimatedEyeLogo :size="96" />
      </div>
      <h1 class="entry-title">星眸筛查系统</h1>

      <button class="primary-button" type="button" @click="goLogin">安全登录</button>

      <p class="entry-footer">© 2024 星眸医疗科技 | 专业 · 精准 · 关怀</p>
    </div>
  </section>
</template>
