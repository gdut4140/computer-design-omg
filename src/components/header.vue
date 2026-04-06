<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { DataAnalysis, EditPen, UserFilled, VideoPlay } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import AnimatedEyeLogo from './AnimatedEyeLogo.vue'

type NavItem = {
    name: string
    label: string
    icon: unknown
}

const items: NavItem[] = [
    { name: 'patient-info', label: '信息完善', icon: EditPen },
    { name: 'start-detect', label: '开始检测', icon: VideoPlay },
    { name: 'history-report', label: '历史报告', icon: DataAnalysis },
    { name: 'profile', label: '个人中心', icon: UserFilled },
]

const route = useRoute()
const isOpen = ref(false)
const menuWrapRef = ref<HTMLElement | null>(null)
const currentName = computed(() => String(route.name ?? ''))
const activeMenuName = computed(() => {
    if (currentName.value === 'analysis-report') {
        return 'start-detect'
    }
    return currentName.value
})

function toggleMenu() {
    isOpen.value = !isOpen.value
}

function handleDocumentClick(event: MouseEvent) {
    if (!isOpen.value) {
        return
    }

    const target = event.target as Node | null
    if (!target) {
        return
    }

    if (menuWrapRef.value?.contains(target)) {
        return
    }

    isOpen.value = false
}

onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
    <header class="app-header">
        <div class="brand">
            <AnimatedEyeLogo :size="42" />
            <h1>星眸筛查系统</h1>
        </div>

        <div ref="menuWrapRef" class="menu-wrap">
            <button type="button" class="hamburger" aria-label="打开导航菜单" :aria-expanded="isOpen" @click="toggleMenu">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <transition name="fade-slide">
                <nav v-if="isOpen" class="menu-panel" aria-label="功能导航">
                    <RouterLink v-for="item in items" :key="item.name" class="menu-item"
                        :class="{ active: activeMenuName === item.name }" :to="{ name: item.name }">
                        <el-icon class="icon">
                            <component :is="item.icon" />
                        </el-icon>
                        <span>{{ item.label }}</span>
                    </RouterLink>
                </nav>
            </transition>
        </div>
    </header>
</template>

<style scoped lang="scss">
.app-header {
    position: fixed;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    z-index: 60;
}

.brand {
    display: flex;
    align-items: center;
    gap: 12px;

    h1 {
        margin: 0;
        color: #10e6d7;
        font-size: 22px;
        letter-spacing: 0.5px;
    }
}

.menu-wrap {
    position: relative;
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
    position: absolute;
    top: 46px;
    right: 0;
    width: 208px;
    border-radius: 14px;
    border: 1px solid rgba(118, 141, 187, 0.18);
    background: linear-gradient(180deg, rgba(31, 44, 78, 0.96) 0%, rgba(24, 36, 67, 0.9) 100%);
    box-shadow: inset 0 1px 0 rgba(129, 150, 190, 0.12);
    overflow: hidden;
    z-index: 50;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px;
    color: #94a0be;
    text-decoration: none;
    font-size: 16px;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
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
    .app-header {
        left: 8px;
        right: 8px;
        top: 8px;
    }

    .brand h1 {
        font-size: 26px;
    }

    .menu-item {
        font-size: 16px;
    }
}
</style>
