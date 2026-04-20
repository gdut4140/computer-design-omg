import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 全局 UI 状态：控制检测全屏模式 */
export const useUiStore = defineStore('ui', () => {
    /** 是否处于检测全屏模式（隐藏 header 和齿轮动画） */
    const detectFullscreen = ref(false)

    function enterDetectFullscreen() {
        detectFullscreen.value = true
    }

    function exitDetectFullscreen() {
        detectFullscreen.value = false
    }

    return { detectFullscreen, enterDetectFullscreen, exitDetectFullscreen }
})
