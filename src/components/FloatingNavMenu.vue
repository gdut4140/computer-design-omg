<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

type NavItem = {
  name: string
  label: string
  icon: string
}

const items: NavItem[] = [
  { name: 'patient-info', label: '信息完善', icon: '✎' },
  { name: 'start-detect', label: '开始检测', icon: '▶' },
  { name: 'history-report', label: '历史报告', icon: '↺' },
  { name: 'profile', label: '个人中心', icon: '◉' },
]

const route = useRoute()
const isOpen = ref(true)

const currentName = computed(() => String(route.name ?? ''))

function toggleMenu() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="floating-nav">
    <button
      type="button"
      class="hamburger"
      aria-label="打开导航菜单"
      :aria-expanded="isOpen"
      @click="toggleMenu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <transition name="fade-slide">
      <nav v-if="isOpen" class="menu-panel" aria-label="功能导航">
        <RouterLink
          v-for="item in items"
          :key="item.name"
          class="menu-item"
          :class="{ active: currentName === item.name }"
          :to="{ name: item.name }"
        >
          <span class="icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.floating-nav {
  position: fixed;
  top: 48px;
  right: 44px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}

.hamburger {
  width: 42px;
  height: 38px;
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 0;

  span {
    width: 24px;
    height: 3px;
    border-radius: 20px;
    background: rgba(225, 231, 246, 0.92);
  }
}

.menu-panel {
  width: 208px;
  border-radius: 14px;
  border: 1px solid rgba(118, 141, 187, 0.18);
  background: linear-gradient(180deg, rgba(31, 44, 78, 0.96) 0%, rgba(24, 36, 67, 0.9) 100%);
  box-shadow: inset 0 1px 0 rgba(129, 150, 190, 0.12);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  color: #94a0be;
  text-decoration: none;
  font-size: 18px;
  font-weight: 600;
  border-left: 4px solid transparent;
  transition: background-color 0.18s ease, color 0.18s ease;

  &:hover {
    background: rgba(51, 67, 109, 0.4);
  }

  &.active {
    color: #1ae8d8;
    background: rgba(22, 37, 69, 0.72);
    border-left-color: #1ae8d8;
  }
}

.icon {
  width: 18px;
  text-align: center;
  font-size: 17px;
  line-height: 1;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 900px) {
  .floating-nav {
    right: 12px;
    top: 16px;
  }

  .menu-item {
    font-size: 16px;
  }
}
</style>
