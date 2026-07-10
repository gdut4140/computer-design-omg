# 🌌 星眸筛查系统 · StarEye Screening System

> 基于眼动追踪技术的儿童孤独症谱系障碍早期智能筛查平台

星眸筛查系统是一套面向医疗机构和家庭的儿童自闭症早期筛查工具。通过采集和分析儿童的眼动追踪数据，结合深度学习模型，系统能够自动评估儿童的社交注意力异常风险，为医生和家长提供科学的筛查参考依据。

---

## ✨ 核心功能

| 模块 | 说明 |
|------|------|
| 🔐 **多角色登录** | 支持医生、家长、管理员三种角色，按角色鉴权并校验身份匹配 |
| 👶 **患儿信息管理** | 新增 / 编辑 / 删除患儿档案，包含姓名、性别、年龄、出生日期、身份证号 |
| 🎯 **眼动筛查检测** | 播放标准化检测视频，采集注视行为数据，自动分析异常概率 |
| 📊 **综合分析报告** | 异常概率仪表盘、眼动轨迹对比折线图、AOI 兴趣区域 3D 分布球体 |
| 📋 **历史筛查记录** | 按姓名 + 身份证号查询历史记录，历次异常概率趋势图与雷达图对比 |
| 👤 **个人中心** | 账号管理、审查日志时间线、医生咨询列表、患儿资料总览 |

---

## 🧠 筛查原理

系统通过播放标准化的视觉刺激视频，追踪被测儿童的眼动轨迹，分析其在**眼睛、鼻子、嘴巴、社交区域、非社交区域**五个兴趣区域（AOI）的注视分布情况，与正常发育儿童的常模基线进行对比，综合评估以下眼动指标：

- **注视时长** — 对视听刺激的整体注视专注程度
- **社交注视** — 对人脸社交区域的偏好程度
- **眼跳频率** — 视线切换的规律性
- **瞳孔反应** — 对视觉刺激的生理唤醒水平
- **扫视速度** — 视觉搜索和信息加工效率

根据模型输出的异常概率，划分三级风险：

| 风险等级 | 概率范围 | 建议措施 |
|---------|---------|---------|
| 🟢 低风险 | < 30% | 保持规律观察，按计划后续筛查 |
| 🟡 中风险 | 30% – 70% | 1–2 周内复检，必要时咨询医生 |
| 🔴 高风险 | > 70% | 疑似孤独症谱系障碍，建议尽快专科复诊 |

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3（Composition API + `<script setup>`） |
| 语言 | TypeScript |
| 构建工具 | Vite 8 |
| 路由 | Vue Router 5 |
| 状态管理 | Pinia 3 |
| UI 组件库 | Element Plus |
| 图表可视化 | ECharts 6（仪表盘、折线图、雷达图） |
| 3D 渲染 | Three.js（AOI 球体 3D 可视化） |
| 动画引擎 | Lottie Web |
| HTTP 客户端 | Axios |
| 样式方案 | SCSS |
| 包管理 | npm |

---

## 📁 项目结构

```
starEye-screening-system/
├── public/
│   ├── favicon.ico
│   ├── datasets/                  # 固定数据集文件
│   └── media/videos/              # 检测视频素材
├── src/
│   ├── api/                       # API 接口层
│   │   ├── auth.ts                #   登录 / 注册 / 登出
│   │   ├── child.ts               #   患儿 CRUD
│   │   └── record.ts              #   筛查记录查询与分析
│   ├── assets/animations/         # Lottie 动画配置
│   ├── components/
│   │   ├── modules/               # 页面级业务模块
│   │   │   ├── InfoComplete.vue   #   患儿信息录入
│   │   │   ├── StartDetect.vue    #   开始筛查检测
│   │   │   ├── AnalysisReport.vue #   分析报告（核心）
│   │   │   ├── HistoryReport.vue  #   历史筛查查询
│   │   │   └── ProfileCenter.vue  #   个人中心
│   │   ├── AnimatedEyeLogo.vue    # 动态 Logo 组件
│   │   ├── FloatingNavMenu.vue    # 浮动导航菜单
│   │   ├── SciFiLottieOrb.vue     # 科幻风格 Lottie 球体
│   │   └── header.vue             # 顶栏导航
│   ├── router/index.ts            # 路由配置 + 导航守卫
│   ├── stores/                    # Pinia 状态管理
│   │   ├── auth.ts                #   认证状态
│   │   ├── counter.ts             #   计数器示例
│   │   └── ui.ts                  #   全局 UI 状态
│   ├── types/                     # TypeScript 类型定义
│   │   ├── auth.ts                #   认证相关接口
│   │   └── domain.ts              #   业务领域模型
│   ├── views/                     # 视图页面
│   │   ├── EntryView.vue          #   入口欢迎页
│   │   ├── LoginView.vue          #   登录注册页
│   │   └── layout.vue             #   主布局（齿轮装饰 + 模块路由）
│   ├── App.vue                    # 根组件
│   ├── http.ts                    # Axios 实例 + 拦截器
│   ├── main.ts                    # 应用入口
│   └── styles.scss                # 全局样式（科幻主题）
├── index.html
├── package.json
├── tsconfig.json                  # TypeScript 项目引用
├── tsconfig.app.json              # 应用 TS 配置
├── tsconfig.node.json             # Node 端 TS 配置
└── vite.config.ts                 # Vite 配置
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: `^20.19.0` 或 `>=22.12.0`
- **包管理器**: npm

### 安装依赖

```sh
npm install
```

### 启动开发服务器

```sh
npm run dev
```

默认在 `http://localhost:5173` 启动，支持热重载。

### 构建生产版本

```sh
npm run build
```

产物输出至 `dist/` 目录。

### 预览生产构建

```sh
npm run preview
```

---

## 🔧 开发指南

### 类型检查

```sh
npm run type-check
```

使用 `vue-tsc` 对 `.vue` 文件进行完整的 TypeScript 类型检查。

### 后端 API 对接

- 前端开发服务器默认将 `/api` 请求代理到后端服务（在 `vite.config.ts` 中配置 `server.proxy`）
- API 基地址在 `src/http.ts` 中配置为 `/api`
- 鉴权 Token 存储在 `localStorage` 中，Key 为 `stareye_token`
- Token 通过请求拦截器自动附加到三个请求头：`Authorization`、`token`、`satoken`（兼容不同后端鉴权中间件）

### 推荐的 IDE 配置

- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 插件
- 请禁用 Vetur 以避免冲突

### 浏览器支持

推荐使用 Chromium 内核浏览器（Chrome / Edge / Brave），建议安装 [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 插件辅助调试。

---

## 🎨 UI 设计

系统采用**深空科幻主题**设计：

- 深蓝紫色调背景，配合动态星空粒子层
- 齿轮机械装饰动画（左右侧边栏）
- 半透明毛玻璃卡片与霓虹色边框
- 检测模式下自动进入全屏沉浸式界面
- 3D 交互式 AOI 球体，支持拖拽旋转

---

## 🏗 系统架构

```
                      ┌──────────────────┐
                      │   Vue Router     │
                      │  (导航守卫鉴权)    │
                      └────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        EntryView        LoginView          LayoutView
     (入口欢迎页)      (登录/注册)     (齿轮装饰 + 模块路由)
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                     InfoComplete         StartDetect         AnalysisReport
                   (患儿信息录入)        (筛查检测)          (分析报告)
                          │                    │                    │
                          └────────────────────┼────────────────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                     HistoryReport        ProfileCenter         (更多...)
                   (历史筛查查询)        (个人中心)
                               │
                      ┌────────┴─────────┐
                      ▼                  ▼
                  Pinia Store         Axios HTTP
               (auth / ui 状态)    (/api 代理 → 后端)
```

---

## 📄 路由表

| 路径 | 名称 | 说明 | 需认证 |
|------|------|------|:---:|
| `/` | — | 重定向至 `/entry` | |
| `/entry` | entry | 欢迎入口页 | |
| `/login` | login | 登录注册页 | |
| `/patient-info` | patient-info | 患儿信息录入 | ✅ |
| `/start-detect` | start-detect | 开始筛查检测 | ✅ |
| `/start-detect/report` | analysis-report | 分析报告 | ✅ |
| `/history-report` | history-report | 历史筛查 | ✅ |
| `/profile` | profile | 个人中心 | ✅ |

---

## ⚙️ 配置说明

### Vite 配置

参考 [Vite 配置文档](https://vite.dev/config/)，主要涉及：

- `server.proxy` — 开发环境 API 代理
- `resolve.alias` — 路径别名

### TypeScript 配置

- `tsconfig.json` — 项目引用入口
- `tsconfig.app.json` — 应用代码 TS 配置
- `tsconfig.node.json` — Vite / Node 端 TS 配置

---

## 📝 License

本项目仅用于学术研究与教学演示目的。

---

<p align="center">
  <sub>© 2026 StarEye | 专业 · 精准 · 关怀</sub>
</p>
