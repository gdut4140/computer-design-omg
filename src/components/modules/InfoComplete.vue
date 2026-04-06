<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance } from 'element-plus'

const saving = ref(false)
const message = ref('')
const formRef = ref<FormInstance>()

const form = reactive({
  childName: '',
  gender: '',
  age: '',
  birthday: '',
  idNumber: '',
  agreed: false,
})

async function saveForm() {
  message.value = ''

  if (!form.childName.trim()) {
    message.value = '请填写患儿姓名'
    return
  }
  if (!form.gender) {
    message.value = '请选择性别'
    return
  }
  if (!form.age && !form.birthday) {
    message.value = '请填写年龄或出生日期'
    return
  }
  if (!form.agreed) {
    message.value = '请先同意相关协议'
    return
  }

  await formRef.value?.validate().catch(() => {
    throw new Error('表单校验失败')
  })

  saving.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 450))
    message.value = '保存成功'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="info-complete-shell">
    <article class="module-card">
      <el-form
        ref="formRef"
        class="profile-form"
        :model="form"
        label-position="top"
        :hide-required-asterisk="true"
        @submit.prevent
      >
        <div class="field-group two-col">
          <el-form-item class="form-item" prop="childName" required>
            <template #label>
              <span>患儿姓名 <em>*</em></span>
            </template>
            <el-input v-model.trim="form.childName" maxlength="20" />
          </el-form-item>

          <el-form-item class="form-item" prop="gender" required>
            <template #label>
              <span>性别 <em>*</em></span>
            </template>
            <el-radio-group v-model="form.gender" class="sex-group">
              <el-radio value="male">男</el-radio>
              <el-radio value="female">女</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <div class="field-group two-col">
          <el-form-item class="form-item" prop="age">
            <template #label>
              <span>年龄 <em>*</em></span>
            </template>
            <el-input v-model.trim="form.age" type="number" min="0" max="18" />
          </el-form-item>

          <el-form-item class="form-item" prop="birthday">
            <template #label>
              <span>出生日期 <em>*</em></span>
            </template>
            <el-date-picker
              v-model="form.birthday"
              type="date"
              format="YYYY/MM/DD"
              value-format="YYYY-MM-DD"
              placeholder="请选择出生日期"
              class="birth-picker"
            />
          </el-form-item>
        </div>

        <el-form-item class="form-item" prop="idNumber">
          <template #label>
            <span>身份证号 <em>*</em></span>
          </template>
          <el-input v-model.trim="form.idNumber" maxlength="18" />
        </el-form-item>

        <el-checkbox v-model="form.agreed" class="agreement">
          <span>
            我已阅读并同意
            <a href="javascript:void(0)">《隐私保护协议》</a>
            和
            <a href="javascript:void(0)">《数据使用条款》</a>
          </span>
        </el-checkbox>

        <el-button class="primary-button wide save-btn" native-type="submit" :loading="saving" @click="saveForm">
          {{ saving ? '新增中...' : '新增' }}
        </el-button>

        <p class="save-message" :class="{ ok: message === '保存成功' }">{{ message }}</p>
      </el-form>
    </article>
  </section>
</template>

<style scoped lang="scss">
.info-complete-shell {
  width: min(960px, 100%);
  margin: 0 auto;
}

.module-card {
  border-radius: 18px;
  border: 1px solid rgba(98, 119, 164, 0.22);
  background: rgba(35, 47, 79, 0.86);
  min-height: 700px;
  padding: 48px 36px 42px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 30px;

  em {
    font-style: normal;
    color: #ff6155;
  }
}

.field-group {
  display: grid;
  gap: 22px;

  &.two-col {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

.age-inline {
  display: grid;
  grid-template-columns: 1fr 66px;
  gap: 8px;
}

.birth-inline {
  display: grid;
  grid-template-columns: 1fr 80px 80px;
  gap: 14px;
}

.birth-picker {
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  color: rgba(161, 173, 199, 0.92);
  font-size: 15px;
  font-weight: 600;
  padding-bottom: 10px;
  line-height: 1.2;
}

:deep(.el-input__wrapper) {
  height: 58px;
  background: rgba(19, 29, 57, 0.86);
  border: 1px solid rgba(56, 78, 126, 0.72);
  border-radius: 12px;
  box-shadow: none;
}

:deep(.el-input__inner) {
  color: #e4ecff;
  font-size: 15px;
}

:deep(.el-input__prefix),
:deep(.el-input__suffix) {
  color: #89a0c8;
}

:deep(.el-input.is-focus .el-input__wrapper) {
  border-color: rgba(36, 222, 211, 0.6);
  box-shadow: 0 0 0 2px rgba(36, 222, 211, 0.12);
}

:deep(.birth-picker .el-input__wrapper) {
  padding-right: 10px;
}

:deep(.birth-picker .el-input__inner) {
  text-align: left;
}

:deep(.sex-group .el-radio) {
  margin-right: 22px;
  color: #c8d3ef;
  font-size: 15px;
}

:deep(.sex-group .el-radio__label) {
  color: #c8d3ef;
  font-size: 15px;
}

:deep(.sex-group .el-radio__inner) {
  background: rgba(20, 31, 58, 0.92);
  border-color: rgba(64, 85, 131, 0.88);
}

:deep(.sex-group .el-radio__input.is-checked .el-radio__inner) {
  border-color: rgba(24, 220, 210, 0.9);
  background: rgba(24, 220, 210, 0.9);
}

:deep(.sex-group .el-radio__input.is-checked + .el-radio__label) {
  color: #e7f1ff;
}

.agreement {
  margin-top: 2px;
  align-items: center;

  :deep(.el-checkbox__label) {
    color: rgba(161, 173, 199, 0.92);
    font-size: 15px;
  }

  :deep(.el-checkbox__inner) {
    width: 18px;
    height: 18px;
    border-radius: 2px;
    border-color: rgba(64, 85, 131, 0.88);
    background: rgba(20, 31, 58, 0.92);
  }

  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    border-color: rgba(24, 220, 210, 0.9);
    background: rgba(24, 220, 210, 0.9);
  }

  a {
    color: #13dfd0;
    text-decoration: none;
  }
}

.save-btn {
  margin-top: 16px;
  height: 68px;
  font-size: 16px;
  border: 0;
}

.save-message {
  margin: 0;
  min-height: 20px;
  color: #ff9c9c;
  font-size: 14px;

  &.ok {
    color: #7af0b1;
  }
}

@media (max-width: 1100px) {
  .module-card {
    padding: 18px 14px;
    min-height: auto;
  }

  .field-group.two-col {
    grid-template-columns: 1fr;
  }

}
</style>
