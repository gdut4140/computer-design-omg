<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import AnimatedEyeLogo from '../components/AnimatedEyeLogo.vue'
import type { AppRole } from '../types/auth'

type LoginTab = {
  key: 'doctor' | 'parent' | 'admin'
  label: string
  role: AppRole
}

const tabs: LoginTab[] = [
  { key: 'doctor', label: '医生登录', role: 1 },
  { key: 'parent', label: '家长登录', role: 2 },
  { key: 'admin', label: '管理员', role: 3 },
]

const activeTab = ref<LoginTab['key']>('doctor')
const loading = ref(false)
const registerMode = ref(false)

const form = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
})

const authStore = useAuthStore()
const router = useRouter()

const roleLabelMap: Record<AppRole, string> = {
  1: '医生',
  2: '家长',
  3: '管理员',
}

const activeRole = computed<AppRole>(() => {
  return tabs.find((item) => item.key === activeTab.value)?.role ?? 1
})

function validatePhone(phone: string) {
  return /^1\d{10}$/.test(phone)
}

function validateForm() {
  if (!validatePhone(form.phone)) {
    throw new Error('请输入正确的11位手机号')
  }
  if (form.password.length < 6) {
    throw new Error('密码至少6位')
  }
  if (registerMode.value && form.password !== form.confirmPassword) {
    throw new Error('两次密码输入不一致')
  }
}

function notify(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
  ElMessage({
    message,
    type,
    duration: 2200,
    showClose: true,
    offset: 72,
  })
}

async function submit() {
  loading.value = true
  try {
    validateForm()

    if (registerMode.value) {
      await authStore.register(form.phone, form.password, activeRole.value)
      notify('注册成功，请使用新账号登录', 'success')
      registerMode.value = false
      form.confirmPassword = ''
      return
    }

    const user = await authStore.login(form.phone, form.password)

    if (user.role !== activeRole.value) {
      authStore.clearAuth()
      const actualRole = roleLabelMap[user.role] ?? '未知角色'
      const currentRole = roleLabelMap[activeRole.value] ?? '当前入口'
      throw new Error(`角色不匹配：该账号为${actualRole}账号，当前是${currentRole}入口，请切换后重试`)
    }

    notify('登录成功，正在进入系统...', 'success')
    router.push({ name: 'patient-info', query: { role: String(user.role) } })
  } catch (error) {
    notify(error instanceof Error ? error.message : '操作失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="space-screen">
    <div class="stars-layer"></div>
    <div class="form-stars" aria-hidden="true"></div>

    <div class="login-panel">
      <header class="brand-header">
        <AnimatedEyeLogo :size="88" />
        <h1>星眸筛查系统</h1>
      </header>

      <nav class="role-tabs" aria-label="登录端口选择">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          手机号/账号
          <input v-model.trim="form.phone" type="text" inputmode="numeric" maxlength="11" />
        </label>

        <label>
          密码
          <input v-model="form.password" type="password" maxlength="32" />
        </label>

        <label v-if="registerMode">
          确认密码
          <input v-model="form.confirmPassword" type="password" maxlength="32" />
        </label>

        <button class="primary-button wide" type="submit" :disabled="loading">
          {{ loading ? '处理中...' : registerMode ? '完成注册' : '安全登录' }}
        </button>
      </form>

      <div class="form-actions">
        <button type="button" class="text-link" @click="notify('请联系管理员重置密码', 'warning')">忘记密码?</button>
        <button
          type="button"
          class="text-link bright"
          @click="registerMode = !registerMode"
        >
          {{ registerMode ? '返回登录' : '新用户注册' }}
        </button>
      </div>
    </div>
  </section>
</template>
