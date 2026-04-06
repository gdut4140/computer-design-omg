<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
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
const message = ref('')
const registerMode = ref(false)

const form = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
})

const authStore = useAuthStore()
const router = useRouter()

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

function clearMessage() {
  message.value = ''
}

async function submit() {
  clearMessage()
  loading.value = true
  try {
    validateForm()

    if (registerMode.value) {
      await authStore.register(form.phone, form.password, activeRole.value)
      message.value = '注册成功，请使用新账号登录'
      registerMode.value = false
      form.confirmPassword = ''
      return
    }

    const user = await authStore.login(form.phone, form.password)

    if (user.role !== activeRole.value) {
      await authStore.logout()
      throw new Error('账号角色与当前端口不匹配，请切换登录端口')
    }

    message.value = '登录成功，正在进入系统...'
    setTimeout(() => {
      router.push({ name: 'patient-info', query: { role: String(user.role) } })
    }, 450)
  } catch (error) {
    message.value = error instanceof Error ? error.message : '操作失败，请稍后重试'
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

      <p class="form-message" :class="{ success: message.includes('成功') }">{{ message }}</p>

      <div class="form-actions">
        <button type="button" class="text-link" @click="message = '请联系管理员重置密码'">忘记密码?</button>
        <button
          type="button"
          class="text-link bright"
          @click="registerMode = !registerMode; clearMessage()"
        >
          {{ registerMode ? '返回登录' : '新用户注册' }}
        </button>
      </div>
    </div>
  </section>
</template>
