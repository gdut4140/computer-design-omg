<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { ChatDotRound, CircleCheckFilled, Document, InfoFilled, UserFilled, WarningFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { deleteChild, getChildList, updateChild } from '../../api/child'
import { queryRecordsByUserId } from '../../api/record'
import { useAuthStore } from '../../stores/auth'
import type { ChildInfo, ScreenRecordVO } from '../../types/domain'

type FeatureKey = 'report' | 'consult' | 'basic'

interface ChildProfile {
    id: string
    name: string
    age: number
    gender: '男' | '女'
    birthday: string
    idNumber: string
    latestDate: string
    latestRisk: string
    latestRate: string
    riskLevel: 'high' | 'low'
}

interface HistoryItem {
    id: string
    childName: string
    dateText: string
    timeText: string
    modeText: string
    riskText: string
    rateText: string
    level: 'high' | 'low'
}

interface DoctorConsultItem {
    id: string
    name: string
    title: string
    hospital: string
    skill: string
    status: '在线' | '离线'
}

const activeFeature = ref<FeatureKey>('basic')
const authStore = useAuthStore()
const router = useRouter()
const logoutPending = ref(false)
const mockUser = {
    name: '张医生',
    roleText: '医生账号',
}

const userInitial = computed(() => {
    return mockUser.name.slice(0, 1)
})

const loadingChildren = ref(false)
const loadingHistories = ref(false)

const children = ref<ChildProfile[]>([
    {
        id: 'c-001',
        name: '张小萌',
        age: 2,
        gender: '女',
        birthday: '2022-01-01',
        idNumber: '320102202201011428',
        latestDate: '2024.03.15',
        latestRisk: '高风险',
        latestRate: '85.3%',
        riskLevel: 'high',
    },
    {
        id: 'c-002',
        name: '李安安',
        age: 4,
        gender: '男',
        birthday: '2020-06-19',
        idNumber: '320102202001011217',
        latestDate: '2024.03.10',
        latestRisk: '低风险',
        latestRate: '12.1%',
        riskLevel: 'low',
    },
    {
        id: 'c-003',
        name: '王星语',
        age: 3,
        gender: '女',
        birthday: '2021-09-08',
        idNumber: '320102202101012126',
        latestDate: '2024.03.08',
        latestRisk: '低风险',
        latestRate: '10.6%',
        riskLevel: 'low',
    },
    {
        id: 'c-004',
        name: '陈可欣',
        age: 5,
        gender: '女',
        birthday: '2019-11-23',
        idNumber: '320102201911231426',
        latestDate: '2024.03.02',
        latestRisk: '中风险',
        latestRate: '46.8%',
        riskLevel: 'high',
    },
    {
        id: 'c-005',
        name: '刘嘉禾',
        age: 6,
        gender: '男',
        birthday: '2018-04-16',
        idNumber: '320102201804161218',
        latestDate: '2024.02.26',
        latestRisk: '低风险',
        latestRate: '19.3%',
        riskLevel: 'low',
    },
    {
        id: 'c-006',
        name: '周一诺',
        age: 3,
        gender: '女',
        birthday: '2021-12-05',
        idNumber: '320102202112051245',
        latestDate: '2024.03.20',
        latestRisk: '高风险',
        latestRate: '79.1%',
        riskLevel: 'high',
    },
    {
        id: 'c-007',
        name: '赵明哲',
        age: 7,
        gender: '男',
        birthday: '2017-08-30',
        idNumber: '320102201708301213',
        latestDate: '2024.01.18',
        latestRisk: '低风险',
        latestRate: '11.4%',
        riskLevel: 'low',
    },
    {
        id: 'c-008',
        name: '孙雨桐',
        age: 4,
        gender: '女',
        birthday: '2020-09-14',
        idNumber: '320102202009141425',
        latestDate: '2024.03.12',
        latestRisk: '中风险',
        latestRate: '51.2%',
        riskLevel: 'high',
    },
])

const histories = ref<HistoryItem[]>([
    {
        id: 'h-001',
        childName: '张小萌',
        dateText: '2024年3月15日',
        timeText: '14:32',
        modeText: '完整筛查',
        riskText: '高风险',
        rateText: '异常概率 85.3%',
        level: 'high',
    },
    {
        id: 'h-002',
        childName: '李安安',
        dateText: '2024年3月10日',
        timeText: '10:15',
        modeText: '快速筛查',
        riskText: '低风险',
        rateText: '异常概率 12.1%',
        level: 'low',
    },
    {
        id: 'h-003',
        childName: '王星语',
        dateText: '2024年3月08日',
        timeText: '16:47',
        modeText: '完整筛查',
        riskText: '中风险',
        rateText: '异常概率 47.6%',
        level: 'high',
    },
    {
        id: 'h-004',
        childName: '刘嘉禾',
        dateText: '2024年2月26日',
        timeText: '09:22',
        modeText: '快速筛查',
        riskText: '低风险',
        rateText: '异常概率 18.5%',
        level: 'low',
    },
    {
        id: 'h-005',
        childName: '周一诺',
        dateText: '2024年2月13日',
        timeText: '14:09',
        modeText: '完整筛查',
        riskText: '高风险',
        rateText: '异常概率 76.2%',
        level: 'high',
    },
    {
        id: 'h-006',
        childName: '赵明哲',
        dateText: '2024年1月30日',
        timeText: '11:38',
        modeText: '快速筛查',
        riskText: '低风险',
        rateText: '异常概率 15.4%',
        level: 'low',
    },
    {
        id: 'h-007',
        childName: '孙雨桐',
        dateText: '2024年1月12日',
        timeText: '10:03',
        modeText: '完整筛查',
        riskText: '中风险',
        rateText: '异常概率 42.8%',
        level: 'high',
    },
    {
        id: 'h-008',
        childName: '陈可欣',
        dateText: '2023年12月20日',
        timeText: '15:56',
        modeText: '快速筛查',
        riskText: '低风险',
        rateText: '异常概率 13.6%',
        level: 'low',
    },
])

const consultDoctors = ref<DoctorConsultItem[]>([
    { id: 'd-001', name: '王雅宁', title: '副主任医师', hospital: '市儿童医院', skill: '孤独谱系早筛', status: '在线' },
    { id: 'd-002', name: '周晨', title: '主治医师', hospital: '省妇幼保健院', skill: '儿童行为发育', status: '在线' },
    { id: 'd-003', name: '刘思远', title: '主任医师', hospital: '市第一人民医院', skill: '神经发育障碍评估', status: '离线' },
    { id: 'd-004', name: '陈雪', title: '副主任医师', hospital: '康复中心', skill: '语言与社交训练', status: '在线' },
    { id: 'd-005', name: '李可', title: '主治医师', hospital: '儿童专科门诊', skill: '早期干预方案', status: '离线' },
    { id: 'd-006', name: '赵辰', title: '主任医师', hospital: '省儿童医学中心', skill: '复杂病例会诊', status: '在线' },
])

const currentChildId = ref(children.value[0]?.id ?? '')
const currentChild = computed(() => {
    return children.value.find((item) => item.id === currentChildId.value) ?? children.value[0]
})

const editVisible = ref(false)
const editTargetId = ref('')
const editForm = reactive({
    name: '',
    age: 0,
    gender: '男' as '男' | '女',
    birthday: '',
    idNumber: '',
})

function toPercentValue(raw: unknown) {
    const value = Number(raw)
    if (Number.isNaN(value)) return 0
    const normalized = value >= 0 && value <= 1 ? value * 100 : value
    return Math.max(0, Math.min(100, normalized))
}

function toRiskLabel(level: string) {
    const upper = String(level || '').toUpperCase()
    if (upper === 'HIGH') return '高风险'
    if (upper === 'MIDDLE') return '中风险'
    if (upper === 'LOW') return '低风险'
    return level || '-'
}

function openEdit(child: ChildProfile) {
    editTargetId.value = child.id
    editForm.name = child.name
    editForm.age = child.age
    editForm.gender = child.gender
    editForm.birthday = child.birthday
    editForm.idNumber = child.idNumber
    editVisible.value = true
}

async function saveEdit() {
    const target = children.value.find((item) => item.id === editTargetId.value)
    if (!target) {
        editVisible.value = false
        return
    }

    const nextName = editForm.name.trim() || target.name
    const nextAge = Number(editForm.age) || target.age
    const nextGender = editForm.gender
    const nextBirthday = editForm.birthday || target.birthday
    const nextIdNumber = editForm.idNumber.trim() || target.idNumber

    try {
        await updateChild({
            id: Number(target.id),
            name: nextName,
            gender: nextGender === '男' ? 1 : 2,
            age: nextAge,
            birthDate: nextBirthday,
            idCard: nextIdNumber,
        })

        target.name = nextName
        target.age = nextAge
        target.gender = nextGender
        target.birthday = nextBirthday
        target.idNumber = nextIdNumber
        ElMessage.success('患儿信息已更新')
        editVisible.value = false
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '更新失败')
    }
}

async function handleDeleteChild(childId: string) {
    try {
        await ElMessageBox.confirm('删除后不可恢复，确认删除该患儿信息吗？', '删除确认', {
            confirmButtonText: '确认删除',
            cancelButtonText: '取消',
            type: 'warning',
        })

        await deleteChild(Number(childId))

        const nextChildren = children.value.filter((item) => item.id !== childId)
        children.value = nextChildren

        if (currentChildId.value === childId) {
            currentChildId.value = nextChildren[0]?.id ?? ''
        }

        ElMessage.success('患儿信息已删除')
    } catch (error) {
        if (error === 'cancel' || error === 'close') {
            return
        }
        ElMessage.error(error instanceof Error ? error.message : '删除失败')
    }
}

async function handleLogout() {
    if (logoutPending.value) {
        return
    }

    logoutPending.value = true
    try {
        await authStore.logout()
        router.replace({ name: 'login' })
    } finally {
        logoutPending.value = false
    }
}

function toChildProfile(item: ChildInfo, records: ScreenRecordVO[]): ChildProfile {
    const latest = records
        .filter((record) => Number(record.childId) === Number(item.id))
        .sort((a, b) => new Date(b.testTime).getTime() - new Date(a.testTime).getTime())[0]

    const riskLevel = (latest?.riskLevel ?? '').toUpperCase()
    const isHigh = riskLevel === 'HIGH' || riskLevel === 'MIDDLE'

    return {
        id: String(item.id),
        name: item.name,
        age: Number(item.age) || 0,
        gender: item.gender === 1 ? '男' : '女',
        birthday: item.birthDate,
        idNumber: item.idCard,
        latestDate: latest?.testTime ? latest.testTime.slice(0, 10) : '-',
        latestRisk: latest ? toRiskLabel(latest.riskLevel) : '-',
        latestRate: latest ? `${toPercentValue(latest.abnormalProb).toFixed(1)}%` : '-',
        riskLevel: isHigh ? 'high' : 'low',
    }
}

function toHistoryItem(record: ScreenRecordVO, childNameMap: Map<number, string>): HistoryItem {
    const risk = (record.riskLevel ?? '').toUpperCase()
    const isHigh = risk === 'HIGH' || risk === 'MIDDLE'

    return {
        id: String(record.id),
        childName: record.childName || childNameMap.get(Number(record.childId)) || `患儿#${record.childId}`,
        dateText: record.testTime ? record.testTime.slice(0, 10).replace(/-/g, '年').replace(/年(\d{2})$/, '月$1日') : '-',
        timeText: record.testTime ? record.testTime.slice(11, 16) : '--:--',
        modeText: '完整筛查',
        riskText: toRiskLabel(record.riskLevel),
        rateText: `异常概率 ${toPercentValue(record.abnormalProb).toFixed(1)}%`,
        level: isHigh ? 'high' : 'low',
    }
}

async function loadChildAndHistory() {
    loadingChildren.value = true
    loadingHistories.value = true
    try {
        const [childList, records] = await Promise.all([getChildList(), queryRecordsByUserId()])

        if (childList.length > 0) {
            children.value = childList.map((item) => toChildProfile(item, records))
            currentChildId.value = children.value[0]?.id ?? ''
        }

        if (records.length > 0) {
            const childNameMap = new Map<number, string>(
                childList.map((item) => [Number(item.id), item.name]),
            )

            histories.value = records
                .slice()
                .sort((a, b) => new Date(b.testTime).getTime() - new Date(a.testTime).getTime())
                .map((item) => toHistoryItem(item, childNameMap))
        }
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '数据加载失败')
    } finally {
        loadingChildren.value = false
        loadingHistories.value = false
    }
}

onMounted(() => {
    loadChildAndHistory()
})
</script>

<template>
    <section class="profile-page">
        <article class="account-card">
            <div class="account-main">
                <div class="account-avatar">{{ userInitial }}</div>
                <div class="account-meta">
                    <strong>{{ mockUser.name }}</strong>
                    <span>{{ mockUser.roleText }}</span>
                </div>
            </div>
            <button class="logout-btn" type="button" :disabled="logoutPending" @click="handleLogout">
                {{ logoutPending ? '退出中...' : '退出登录' }}
            </button>
        </article>

        <article class="profile-header-card">
            <div class="avatar-wrap">
                <div class="avatar"><el-icon class="avatar-icon">
                        <UserFilled />
                    </el-icon></div>
            </div>

            <div v-if="currentChild" class="profile-meta">
                <h2>{{ currentChild.name }}</h2>
                <p class="sub">{{ currentChild.age }}岁 · {{ currentChild.gender }}</p>
                <p class="latest">
                    <span>最新结果：</span>
                    <span>{{ currentChild.latestDate }}</span>
                    <b :class="{ safe: currentChild.riskLevel === 'low' }">{{ currentChild.latestRisk }} {{
                        currentChild.latestRate }}</b>
                </p>
            </div>
        </article>

        <div class="feature-row">
            <button type="button" class="feature-btn" :class="{ active: activeFeature === 'report' }"
                @click="activeFeature = 'report'">
                <el-icon class="feature-icon">
                    <Document />
                </el-icon>
                审查日志
            </button>
            <button type="button" class="feature-btn" :class="{ active: activeFeature === 'consult' }"
                @click="activeFeature = 'consult'">
                <el-icon class="feature-icon">
                    <ChatDotRound />
                </el-icon>
                咨询医生
            </button>
            <button type="button" class="feature-btn" :class="{ active: activeFeature === 'basic' }"
                @click="activeFeature = 'basic'">
                <el-icon class="feature-icon">
                    <InfoFilled />
                </el-icon>
                患儿基本信息
            </button>
        </div>

        <article v-if="activeFeature === 'report'" class="history-panel report-panel">
            <h3>筛查历史</h3>

            <div class="report-scroll-wrap">
                <div class="timeline">
                    <section v-for="(item, index) in histories" :key="item.id" class="history-item" :class="item.level">
                        <div class="axis">
                            <div class="dot">
                                <el-icon class="dot-icon">
                                    <WarningFilled v-if="item.level === 'high'" />
                                    <CircleCheckFilled v-else />
                                </el-icon>
                            </div>
                            <div v-if="index !== histories.length - 1" class="axis-line"></div>
                        </div>
                        <article class="item-card">
                            <p class="child-name">{{ item.childName }}</p>
                            <div class="row-head">
                                <strong>{{ item.dateText }}</strong>
                                <b class="tag" :class="item.level === 'high' ? 'danger' : 'safe'">{{ item.riskText
                                    }}</b>
                            </div>
                            <p class="time">{{ item.timeText }} · {{ item.modeText }}</p>
                            <p class="value" :class="item.level === 'high' ? 'danger-text' : 'safe-text'">{{
                                item.rateText }}</p>
                        </article>
                    </section>
                </div>
            </div>
        </article>

        <article v-else-if="activeFeature === 'basic'" class="history-panel basic-panel">
            <div class="basic-head">
                <h3>患儿基本信息</h3>
            </div>

            <div class="child-scroll-wrap">
                <div class="child-card-grid">
                    <article v-for="child in children" :key="child.id" class="child-card"
                        :class="{ active: currentChildId === child.id }" @click="currentChildId = child.id">
                        <div class="top-row">
                            <div class="name-block">
                                <strong>{{ child.name }}</strong>
                                <small>{{ child.age }}岁 · {{ child.gender }}</small>
                            </div>
                            <button class="delete-corner-btn" type="button" title="删除患儿"
                                @click.stop="handleDeleteChild(child.id)">
                                删除
                            </button>
                        </div>

                        <div class="info-grid">
                            <p><span>患儿姓名</span>{{ child.name }}</p>
                            <p><span>性别</span>{{ child.gender }}</p>
                            <p><span>年龄</span>{{ child.age }}岁</p>
                            <p><span>出生日期</span>{{ child.birthday }}</p>
                            <p class="full"><span>身份证号</span>{{ child.idNumber }}</p>
                        </div>

                        <button class="edit-btn" type="button" @click.stop="openEdit(child)">修改信息</button>
                    </article>
                </div>
            </div>
        </article>

        <article v-else class="history-panel consult-panel">
            <h3>咨询医生</h3>

            <div class="consult-scroll-wrap">
                <div class="doctor-list">
                    <article v-for="doctor in consultDoctors" :key="doctor.id" class="doctor-item">
                        <div class="doctor-head">
                            <strong>{{ doctor.name }}</strong>
                            <span class="status" :class="{ offline: doctor.status === '离线' }">{{ doctor.status }}</span>
                        </div>
                        <p>{{ doctor.title }} · {{ doctor.hospital }}</p>
                        <small>擅长：{{ doctor.skill }}</small>
                        <button type="button">发起咨询</button>
                    </article>
                </div>
            </div>
        </article>

        <el-dialog v-model="editVisible" class="profile-edit-dialog" modal-class="profile-edit-overlay" title="修改患儿信息"
            width="500px" append-to-body>
            <el-form label-position="top" class="edit-form">
                <el-form-item label="患儿姓名">
                    <el-input v-model="editForm.name" maxlength="20" />
                </el-form-item>
                <div class="edit-grid">
                    <el-form-item label="年龄">
                        <el-input v-model.number="editForm.age" type="number" min="0" max="18" />
                    </el-form-item>
                    <el-form-item label="性别">
                        <el-select v-model="editForm.gender" popper-class="profile-theme-popper">
                            <el-option label="男" value="男" />
                            <el-option label="女" value="女" />
                        </el-select>
                    </el-form-item>
                </div>
                <el-form-item label="出生日期">
                    <el-date-picker v-model="editForm.birthday" type="date" format="YYYY/MM/DD"
                        value-format="YYYY-MM-DD" placeholder="请选择出生日期" class="dialog-date"
                        popper-class="profile-theme-popper" />
                </el-form-item>
                <el-form-item label="身份证号">
                    <el-input v-model="editForm.idNumber" maxlength="18" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="editVisible = false">取消</el-button>
                <el-button type="primary" @click="saveEdit">保存修改</el-button>
            </template>
        </el-dialog>
    </section>
</template>

<style scoped lang="scss">
.profile-page {
    height: calc(100vh - 128px);
    min-height: calc(100vh - 128px);
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
}

.account-card {
    border-radius: 14px;
    border: 1px solid rgba(73, 97, 151, 0.36);
    background:
        radial-gradient(circle at 92% -50%, rgba(35, 220, 210, 0.24), transparent 40%),
        linear-gradient(160deg, rgba(26, 39, 71, 0.95), rgba(18, 29, 57, 0.95));
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
}

.account-main {
    display: flex;
    align-items: center;
    gap: 12px;
}

.account-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 20px;
    font-weight: 800;
    color: #052832;
    background: linear-gradient(180deg, #2ae8dc, #16c8bf);
    box-shadow: 0 6px 18px rgba(20, 210, 201, 0.28);
}

.account-meta {
    display: grid;
    gap: 2px;

    strong {
        color: #eaf2ff;
        font-size: 18px;
        font-weight: 700;
    }

    span {
        color: #95a8ce;
        font-size: 13px;
    }
}

.logout-btn {
    height: 40px;
    border-radius: 10px;
    border: 1px solid rgba(255, 112, 112, 0.74);
    background: linear-gradient(180deg, #ff6156, #e13c37);
    color: #fff2f2;
    padding: 0 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s ease;
    box-shadow: 0 10px 22px rgba(221, 59, 59, 0.24);

    &:hover:not(:disabled) {
        background: linear-gradient(180deg, #ff7468, #ec4b44);
        border-color: rgba(255, 140, 140, 0.84);
    }

    &:disabled {
        opacity: 0.66;
        cursor: not-allowed;
    }
}

.profile-header-card {
    border-radius: 16px;
    border: 1px solid rgba(98, 119, 164, 0.22);
    background: rgba(35, 47, 79, 0.86);
    padding: 18px 26px;
    display: flex;
    align-items: center;
    gap: 20px;
}

.avatar-wrap {
    flex-shrink: 0;
}

.avatar {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 28%, #22ead9, #12c7be);
    display: grid;
    place-items: center;
    color: #e8f9ff;
    font-size: 26px;
    box-shadow: 0 0 22px rgba(19, 227, 214, 0.3);
}

.avatar-icon {
    font-size: 30px;
}

.profile-meta {
    h2 {
        margin: 0;
        color: #eef4ff;
        font-size: 20px;
    }

    .sub {
        margin: 6px 0 10px;
        color: #9eabc9;
        font-size: 16px;
    }

    .latest {
        margin: 0;
        color: #b6c2dc;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;

        b {
            border-radius: 8px;
            background: #ff5142;
            color: #fff;
            font-size: 16px;
            padding: 4px 10px;
            font-weight: 700;

            &.safe {
                background: #14d76f;
                color: #043a1d;
            }
        }
    }
}

.feature-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}

.feature-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 76px;
    border-radius: 12px;
    border: 1px solid rgba(71, 92, 140, 0.42);
    background: rgba(25, 37, 66, 0.65);
    color: #c6d2ec;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;

    &.active {
        border-color: rgba(20, 221, 209, 0.55);
        background: linear-gradient(180deg, #21dfd3, #14bfb7);
        color: #03232f;
        box-shadow: 0 10px 28px rgba(18, 215, 205, 0.24);
    }
}

.feature-icon {
    font-size: 18px;
}

.history-panel {
    position: relative;
    overflow: hidden;
    flex: 1;
    border-radius: 16px;
    border: 1px solid rgba(98, 119, 164, 0.22);
    background: rgba(35, 47, 79, 0.86);
    padding: 18px 20px;
    min-height: 0;

    &::before {
        content: '';
        position: absolute;
        right: -80px;
        bottom: -80px;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(26, 220, 207, 0.2), transparent 70%);
        opacity: 0.45;
        pointer-events: none;
        animation: pulseAura 6.2s ease-in-out infinite;
    }

    &::after {
        content: '';
        position: absolute;
        left: 24px;
        right: 24px;
        bottom: 0;
        height: 110px;
        background: linear-gradient(180deg, rgba(23, 38, 69, 0), rgba(17, 29, 54, 0.44));
        pointer-events: none;
    }

    h3 {
        margin: 0 0 14px;
        color: #f0f5ff;
        font-size: 16px;
    }
}

.history-panel.basic-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .basic-head {
        flex-shrink: 0;
    }

    .child-scroll-wrap {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding-right: 4px;
        scrollbar-width: thin;
        scrollbar-color: rgba(40, 225, 214, 0.55) rgba(13, 24, 49, 0.28);

        &::-webkit-scrollbar {
            width: 8px;
        }

        &::-webkit-scrollbar-track {
            background: rgba(13, 24, 49, 0.26);
            border-radius: 999px;
        }

        &::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, rgba(39, 231, 218, 0.68), rgba(21, 173, 191, 0.58));
            border-radius: 999px;
        }

        .child-card-grid {
            align-content: start;
            padding-bottom: 8px;
        }
    }
}

.history-panel.report-panel,
.history-panel.consult-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.report-scroll-wrap,
.consult-scroll-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: rgba(40, 225, 214, 0.55) rgba(13, 24, 49, 0.28);

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(13, 24, 49, 0.26);
        border-radius: 999px;
    }

    &::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(39, 231, 218, 0.68), rgba(21, 173, 191, 0.58));
        border-radius: 999px;
    }
}

@keyframes pulseAura {

    0%,
    100% {
        transform: scale(1);
        opacity: 0.25;
    }

    50% {
        transform: scale(1.12);
        opacity: 0.5;
    }
}

.basic-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.child-card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.child-card {
    position: relative;
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid rgba(27, 209, 199, 0.48);
    background:
        radial-gradient(circle at 100% -14%, rgba(27, 209, 199, 0.26), transparent 34%),
        linear-gradient(165deg, rgba(27, 44, 76, 0.96), rgba(18, 30, 58, 0.92));
    padding: 16px;
    cursor: pointer;
    transition: 0.24s ease;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, rgba(27, 209, 199, 0.95), rgba(27, 209, 199, 0.42));
        opacity: 0.72;
    }

    &:hover {
        border-color: rgba(27, 209, 199, 0.78);
        transform: translateY(-2px);
        box-shadow: 0 14px 30px rgba(5, 13, 31, 0.36), 0 0 0 1px rgba(27, 209, 199, 0.22) inset;
    }

    &.active {
        border-color: #1bd1c7;
        box-shadow:
            0 0 0 1px rgba(27, 209, 199, 0.28) inset,
            0 14px 32px rgba(8, 20, 44, 0.46),
            0 0 22px rgba(27, 209, 199, 0.22);

        &::before {
            opacity: 1;
        }
    }

    .top-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;

        .name-block {
            display: grid;
            gap: 2px;

            strong {
                color: #ebf1ff;
                font-size: 18px;
            }

            small {
                color: #9fb0d1;
                font-size: 13px;
            }
        }

        .delete-corner-btn {
            height: 30px;
            min-width: 60px;
            border-radius: 999px;
            border: 1px solid rgba(255, 126, 126, 0.56);
            background: rgba(92, 30, 40, 0.46);
            color: #ffd4d4;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: 0.2s ease;

            &:hover {
                background: rgba(118, 38, 51, 0.62);
                border-color: rgba(255, 146, 146, 0.8);
            }
        }

    }

    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 12px;

        p {
            margin: 0;
            padding: 8px 10px;
            border-radius: 9px;
            background: rgba(13, 22, 44, 0.42);
            color: #d9e3f8;
            font-size: 13px;
            word-break: break-all;
            display: grid;
            gap: 4px;

            span {
                color: #8f9dbc;
                font-size: 12px;
            }

            &.full {
                grid-column: 1 / -1;
            }
        }
    }
}

.edit-btn {
    margin-top: 14px;
    width: 100%;
    height: 40px;
    border-radius: 10px;
    border: 1px solid rgba(62, 86, 136, 0.58);
    background: linear-gradient(180deg, rgba(25, 41, 74, 0.95), rgba(18, 30, 57, 0.95));
    color: #d9e5ff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s ease;

    &:hover {
        border-color: rgba(33, 219, 209, 0.62);
        color: #ebf6ff;
    }
}

.consult-panel {
    .doctor-list {
        display: grid;
        gap: 12px;
        padding-bottom: 8px;
    }

    .doctor-item {
        border-radius: 12px;
        border: 1px solid rgba(67, 90, 138, 0.36);
        background: rgba(18, 29, 54, 0.78);
        padding: 12px 14px;
        display: grid;
        gap: 6px;

        .doctor-head {
            display: flex;
            align-items: center;
            justify-content: space-between;

            strong {
                color: #e8f0ff;
                font-size: 16px;
            }
        }

        .status {
            border-radius: 999px;
            padding: 3px 10px;
            background: rgba(26, 219, 171, 0.2);
            color: #43efbf;
            font-size: 12px;
            font-weight: 700;

            &.offline {
                background: rgba(122, 137, 171, 0.22);
                color: #a9b7d5;
            }
        }

        p {
            margin: 0;
            color: #a7b4d3;
            font-size: 14px;
        }

        small {
            color: #8ea3cc;
            font-size: 13px;
        }

        button {
            margin-top: 4px;
            height: 34px;
            border-radius: 8px;
            border: 1px solid rgba(52, 216, 205, 0.45);
            background: rgba(17, 36, 63, 0.88);
            color: #cde7ff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }
    }
}

.edit-form {
    .edit-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
}

:deep(.el-dialog) {
    border-radius: 14px;
    background: #1d2a4d;
    border: 1px solid rgba(84, 106, 154, 0.4);
}

:deep(.profile-edit-dialog.el-dialog) {
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(34, 47, 82, 0.98), rgba(24, 36, 66, 0.98));
    border: 1px solid rgba(73, 97, 151, 0.52);
    box-shadow: 0 18px 48px rgba(6, 12, 28, 0.55);
}

:deep(.profile-edit-dialog .el-dialog__header) {
    margin-right: 0;
    padding: 18px 22px 12px;
    border-bottom: 1px solid rgba(73, 97, 151, 0.28);
}

:deep(.profile-edit-dialog .el-dialog__body) {
    padding: 16px 22px 8px;
}

:deep(.profile-edit-dialog .el-dialog__footer) {
    padding: 12px 22px 18px;
    border-top: 1px solid rgba(73, 97, 151, 0.2);
}

:deep(.profile-edit-dialog .el-dialog__headerbtn .el-dialog__close) {
    color: #9cb1d8;
}

:deep(.profile-edit-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
    color: #d8e8ff;
}

:deep(.el-dialog__title) {
    color: #e8f0ff;
}

:deep(.el-form-item__label) {
    color: #a7b4d3;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
    background: rgba(14, 23, 46, 0.92);
    border: 1px solid rgba(57, 79, 127, 0.72);
    box-shadow: none;
}

:deep(.profile-edit-dialog .el-input__wrapper),
:deep(.profile-edit-dialog .el-select__wrapper) {
    min-height: 42px;
}

:deep(.profile-edit-dialog .el-input.is-focus .el-input__wrapper),
:deep(.profile-edit-dialog .el-select .is-focus.el-select__wrapper) {
    border-color: rgba(35, 220, 210, 0.7);
    box-shadow: 0 0 0 2px rgba(35, 220, 210, 0.12);
}

:deep(.dialog-date .el-input__wrapper) {
    background: rgba(14, 23, 46, 0.92);
    border: 1px solid rgba(57, 79, 127, 0.72);
    box-shadow: none;
}

:deep(.profile-edit-dialog .el-button) {
    height: 36px;
    border-radius: 8px;
}

:deep(.profile-edit-dialog .el-dialog__footer .el-button:not(.el-button--primary)) {
    background: rgba(22, 32, 58, 0.9);
    border-color: rgba(74, 96, 147, 0.5);
    color: #c2d2f1;
}

:deep(.el-input__inner),
:deep(.el-select__selected-item) {
    color: #e6eeff;
}

:deep(.el-dialog__footer .el-button--primary) {
    background: linear-gradient(180deg, #21dfd3, #14bfb7);
    border: 0;
    color: #03232f;
}

.timeline {
    display: grid;
    gap: 12px;
}

.history-item {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 10px;

    .axis {
        display: grid;
        grid-template-rows: 36px 1fr;
        justify-items: center;
        min-height: 100%;
    }

    .dot {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-size: 18px;
        font-weight: 800;
        border: 2px solid transparent;
        box-shadow: 0 0 0 4px rgba(16, 27, 54, 0.62);
    }

    .dot-icon {
        font-size: 18px;
    }

    .axis-line {
        width: 2px;
        margin-top: 5px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(92, 110, 153, 0.7), rgba(62, 77, 114, 0.38));
        min-height: 52px;
    }

    &.high .dot {
        background: #ff4c3f;
        border-color: rgba(255, 173, 165, 0.6);
        color: #fff;
    }

    &.low .dot {
        background: #0fd66c;
        border-color: rgba(138, 255, 190, 0.6);
        color: #05331a;
    }
}

.item-card {
    border-radius: 12px;
    background: rgba(23, 34, 61, 0.82);
    border: 1px solid rgba(71, 92, 140, 0.28);
    padding: 14px 16px;
}

.child-name {
    margin: 0 0 6px;
    color: #19cbc1;
    font-size: 30px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: 0.6px;
}

.row-head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    strong {
        color: #ebf1ff;
        font-size: 16px;
    }
}

.tag {
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    padding: 4px 10px;
}

.tag.danger {
    background: #ff5142;
    color: #fff;
}

.tag.safe {
    background: #14d76f;
    color: #043a1d;
}

.time {
    margin: 6px 0;
    color: #8f9dbc;
    font-size: 14px;
}

.value {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.danger-text {
    color: #ff5748;
}

.safe-text {
    color: #1be37c;
}

@media (max-width: 1200px) {
    .profile-page {
        height: auto;
        min-height: auto;
        overflow: visible;
    }

    .feature-row {
        grid-template-columns: 1fr;
    }

    .account-card {
        flex-direction: column;
        align-items: stretch;
    }

    .logout-btn {
        width: 100%;
    }

    .child-card-grid {
        grid-template-columns: 1fr;
    }

    .edit-form .edit-grid {
        grid-template-columns: 1fr;
    }

    .profile-page {
        min-height: auto;
    }
}
</style>

<style lang="scss">
.profile-edit-overlay {
    background: rgba(8, 15, 33, 0.62) !important;
    backdrop-filter: blur(2px);
}

.profile-edit-dialog {
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(34, 47, 82, 0.98), rgba(24, 36, 66, 0.98));
    border: 1px solid rgba(73, 97, 151, 0.52);
    box-shadow: 0 18px 48px rgba(6, 12, 28, 0.55);
}

.profile-edit-dialog .el-dialog__header {
    margin-right: 0;
    padding: 18px 22px 12px;
    border-bottom: 1px solid rgba(73, 97, 151, 0.28);
}

.profile-edit-dialog .el-dialog__body {
    padding: 16px 22px 8px;
}

.profile-edit-dialog .el-dialog__footer {
    padding: 12px 22px 18px;
    border-top: 1px solid rgba(73, 97, 151, 0.2);
}

.profile-edit-dialog .el-dialog__title {
    color: #e8f0ff;
}

.profile-edit-dialog .el-dialog__headerbtn .el-dialog__close {
    color: #9cb1d8;
}

.profile-edit-dialog .el-dialog__headerbtn:hover .el-dialog__close {
    color: #d8e8ff;
}

.profile-theme-popper.el-select__popper,
.profile-theme-popper.el-picker__popper {
    border-radius: 10px;
    border: 1px solid rgba(74, 96, 147, 0.58);
    background: #1a284a;
    box-shadow: 0 12px 30px rgba(6, 12, 28, 0.45);
}

.profile-theme-popper .el-popper__arrow::before {
    background: #1a284a;
    border-color: rgba(74, 96, 147, 0.58);
}

.profile-theme-popper .el-select-dropdown__item {
    color: #d8e6ff;
}

.profile-theme-popper .el-select-dropdown__item.is-hovering,
.profile-theme-popper .el-select-dropdown__item:hover {
    background: rgba(29, 170, 197, 0.16);
}

.profile-theme-popper .el-select-dropdown__item.is-selected {
    color: #29dfd4;
    font-weight: 700;
}

.profile-theme-popper .el-date-table td .el-date-table-cell__text,
.profile-theme-popper .el-picker-panel__icon-btn,
.profile-theme-popper .el-date-picker__header-label {
    color: #d8e6ff;
}

.profile-theme-popper .el-date-table td.current:not(.disabled) .el-date-table-cell__text,
.profile-theme-popper .el-date-table td.today .el-date-table-cell__text {
    color: #102838;
    background: #29dfd4;
}

.profile-theme-popper .el-picker-panel {
    background: #1a284a;
}

.profile-edit-dialog .el-dialog__footer .el-button {
    height: 36px;
    border-radius: 8px;
    font-weight: 600;
}

.profile-edit-dialog .el-dialog__footer .el-button:not(.el-button--primary) {
    background: rgba(22, 32, 58, 0.94);
    border: 1px solid rgba(74, 96, 147, 0.56);
    color: #c2d2f1;
}

.profile-edit-dialog .el-dialog__footer .el-button:not(.el-button--primary):hover {
    background: rgba(29, 43, 77, 0.98);
    border-color: rgba(98, 123, 181, 0.7);
    color: #dce8ff;
}

.profile-edit-dialog .el-dialog__footer .el-button.el-button--primary {
    background: linear-gradient(180deg, #21dfd3, #14bfb7);
    border-color: transparent;
    color: #03232f;
}

.profile-edit-dialog .el-dialog__footer .el-button.el-button--primary:hover {
    background: linear-gradient(180deg, #34e7db, #1acdc3);
}
</style>
