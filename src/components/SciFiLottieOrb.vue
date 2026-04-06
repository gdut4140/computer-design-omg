<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import lottie from 'lottie-web'
import sciFiOrb from '../assets/animations/sciFiOrb'

const props = withDefaults(
  defineProps<{
    size?: number
    speed?: number
    opacity?: number
  }>(),
  {
    size: 220,
    speed: 1,
    opacity: 0.68,
  },
)

const host = ref<HTMLDivElement | null>(null)
let instance: ReturnType<typeof lottie.loadAnimation> | null = null

onMounted(() => {
  if (!host.value) return
  instance = lottie.loadAnimation({
    container: host.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: sciFiOrb,
  })
  instance.setSpeed(props.speed)
})

onBeforeUnmount(() => {
  instance?.destroy()
  instance = null
})
</script>

<template>
  <div
    ref="host"
    class="sci-lottie-orb"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      opacity,
    }"
    aria-hidden="true"
  ></div>
</template>

<style scoped lang="scss">
.sci-lottie-orb {
  pointer-events: none;
  filter: drop-shadow(0 0 20px rgba(38, 230, 220, 0.35));
}
</style>
