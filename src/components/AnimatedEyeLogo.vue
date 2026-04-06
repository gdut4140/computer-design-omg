<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 88,
  },
)
</script>

<template>
  <div class="animated-eye" :style="{ '--eye-size': `${props.size}px` }" aria-hidden="true">
    <div class="core-orb"></div>
    <div class="eye-mask">
      <div class="iris-track">
        <div class="iris">
          <div class="pupil"></div>
          <div class="shine"></div>
        </div>
      </div>
    </div>
    <div class="lid lid-top"></div>
    <div class="lid lid-bottom"></div>
    <div class="ring ring-a"></div>
    <div class="ring ring-b"></div>
  </div>
</template>

<style scoped lang="scss">
.animated-eye {
  --eye-size: 88px;
  position: relative;
  width: var(--eye-size);
  height: var(--eye-size);
  border-radius: 50%;
  isolation: isolate;
  background: radial-gradient(circle at 32% 26%, #34f1e2 0%, #14cbc4 58%, #0daab4 100%);
  box-shadow: 0 0 24px rgba(22, 233, 219, 0.35), 0 0 54px rgba(18, 166, 206, 0.3);
}

.core-orb {
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(210, 255, 255, 0.35), rgba(18, 136, 170, 0.14));
  animation: corePulse 3.4s ease-in-out infinite;
}

.eye-mask {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 63%;
  height: 37%;
  transform: translate(-50%, -50%);
  border-radius: 52% / 62%;
  background: #ebf9ff;
  clip-path: polygon(0 50%, 10% 24%, 28% 10%, 50% 6%, 72% 10%, 90% 24%, 100% 50%, 90% 76%, 72% 90%, 50% 94%, 28% 90%, 10% 76%);
  overflow: hidden;
}

.iris-track {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  animation: irisScan 4.2s ease-in-out infinite;
}

.iris {
  position: relative;
  width: calc(var(--eye-size) * 0.27);
  height: calc(var(--eye-size) * 0.27);
  border-radius: 50%;
  border: 4px solid #11b8be;
  background: radial-gradient(circle at 38% 34%, #74fbff 0%, #1ad8d8 55%, #11acbb 100%);
  box-shadow: 0 0 12px rgba(17, 199, 205, 0.35);
}

.pupil {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 42%;
  height: 42%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #0a4f67;
}

.shine {
  position: absolute;
  left: 56%;
  top: 22%;
  width: 18%;
  height: 18%;
  border-radius: 50%;
  background: rgba(237, 255, 255, 0.9);
}

.lid {
  position: absolute;
  left: 50%;
  width: 66%;
  height: 17%;
  transform: translateX(-50%);
  background: rgba(10, 142, 169, 0.62);
  z-index: 2;
}

.lid-top {
  top: 28%;
  border-radius: 60% 60% 34% 34%;
  transform-origin: center top;
  animation: blinkTop 5.8s infinite;
}

.lid-bottom {
  bottom: 28%;
  border-radius: 34% 34% 60% 60%;
  transform-origin: center bottom;
  animation: blinkBottom 5.8s infinite;
}

.ring {
  position: absolute;
  inset: -8%;
  border-radius: 50%;
  border: 1px dashed rgba(108, 238, 230, 0.45);
  pointer-events: none;
}

.ring-a {
  animation: spinCw 8s linear infinite;
}

.ring-b {
  inset: -15%;
  border-style: solid;
  border-color: rgba(104, 212, 255, 0.22);
  animation: spinCcw 10s linear infinite;
}

@keyframes irisScan {
  0%,
  100% {
    transform: translate(-50%, -50%) translateX(0);
  }
  25% {
    transform: translate(-50%, -50%) translateX(-12%);
  }
  55% {
    transform: translate(-50%, -50%) translateX(13%);
  }
  72% {
    transform: translate(-50%, -50%) translateX(-5%);
  }
}

@keyframes blinkTop {
  0%,
  44%,
  52%,
  100% {
    transform: translateX(-50%) scaleY(0.15);
    opacity: 0.2;
  }
  48% {
    transform: translateX(-50%) scaleY(1.35);
    opacity: 0.88;
  }
}

@keyframes blinkBottom {
  0%,
  44%,
  52%,
  100% {
    transform: translateX(-50%) scaleY(0.15);
    opacity: 0.2;
  }
  48% {
    transform: translateX(-50%) scaleY(1.35);
    opacity: 0.88;
  }
}

@keyframes corePulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.62;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.88;
  }
}

@keyframes spinCw {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinCcw {
  to {
    transform: rotate(-360deg);
  }
}
</style>
