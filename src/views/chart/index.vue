<template>
  <div class="app-container chart-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">统计分析看板</h2>
        <p class="page-subtitle">统计周期：{{ rangeLabel }}</p>
      </div>
      <div class="header-actions">
        <el-tag type="info" effect="plain">{{ todayLabel }}</el-tag>
        <el-button type="primary" :loading="loading" @click="loadData">刷新数据</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="metric-row">
      <el-col v-for="item in metricCards" :key="item.label" :xs="12" :sm="12" :md="6">
        <el-card class="metric-card" shadow="hover">
          <div class="metric-title">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
          <div class="metric-desc">{{ item.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>近12个月上传趋势（折线图）</template>
          <div ref="trendChartRef" class="chart-panel chart-panel-lg"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>内容类型占比（环形图）</template>
          <div ref="pieChartRef" class="chart-panel chart-panel-md"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>本月人员贡献 Top10（柱状图）</template>
          <div ref="rankChartRef" class="chart-panel chart-panel-md"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>各子公司素材与稿件数量对比（柱状图）</template>
          <div ref="monthlyChartRef" class="chart-panel chart-panel-md"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>各公司稿件通过/不通过比例（100%堆叠柱状图）</template>
          <div ref="approvalRatioChartRef" class="chart-panel chart-panel-md"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card" shadow="hover">
      <template #header>人员贡献明细（表格）</template>
      <el-table :data="tableData" stripe border height="420">
        <el-table-column prop="rank" label="排名" width="76" align="center" />
        <el-table-column prop="name" label="人员" min-width="180" />
        <el-table-column prop="materialCount" label="素材上传数" width="120" align="center" />
        <el-table-column prop="articleCount" label="稿件上传数" width="120" align="center" />
        <el-table-column prop="totalCount" label="总贡献数" width="120" align="center" />
        <el-table-column prop="ratio" label="贡献占比" width="120" align="center" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import * as echarts from "echarts"
import { ElMessage } from "element-plus"
import { listMaterial } from "@/api/xcsc/material"
import { listAllArticle } from "@/api/xcsc/article"
import { listDept } from "@/api/system/dept"

const loading = ref(false)
const trendChartRef = ref(null)
const pieChartRef = ref(null)
const rankChartRef = ref(null)
const monthlyChartRef = ref(null)
const approvalRatioChartRef = ref(null)
let trendChartInstance = null
let pieChartInstance = null
let rankChartInstance = null
let monthlyChartInstance = null
let approvalRatioChartInstance = null

const summary = ref({
  materialTotal: 0,
  articleTotal: 0,
  activeUsers: 0,
  monthTotal: 0,
  monthMaterial: 0,
  monthArticle: 0,
  dailyAvg: 0
})
const tableData = ref([])

const now = new Date()
const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
const todayLabel = computed(() => {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `数据日期：${y}-${m}-${d}`
})
const rangeLabel = computed(() => {
  const [start] = getRecentMonthKeys(12)
  return `${start} 至 ${monthKey}`
})

const metricCards = computed(() => [
  {
    label: "素材总量",
    value: formatNumber(summary.value.materialTotal),
    desc: `本月新增 ${formatNumber(summary.value.monthMaterial)}`
  },
  {
    label: "稿件总量",
    value: formatNumber(summary.value.articleTotal),
    desc: `本月新增 ${formatNumber(summary.value.monthArticle)}`
  },
  {
    label: "活跃上传人员",
    value: formatNumber(summary.value.activeUsers),
    desc: "按近12个月统计"
  },
  {
    label: "本月总贡献",
    value: formatNumber(summary.value.monthTotal),
    desc: `日均 ${summary.value.dailyAvg.toFixed(1)}`
  }
])

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(Number(value || 0))
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toMonthKey(dateValue) {
  const date = parseDate(dateValue)
  if (!date) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getRecentMonthKeys(total = 12) {
  const keys = []
  const base = new Date(now.getFullYear(), now.getMonth(), 1)
  for (let i = total - 1; i >= 0; i -= 1) {
    const temp = new Date(base)
    temp.setMonth(base.getMonth() - i)
    keys.push(`${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, "0")}`)
  }
  return keys
}

function getUserName(row, source) {
  if (source === "material") {
    return row.uploadUser || row.createBy || row.userName || "未知用户"
  }
  return row.authorName || row.createBy || row.submitter || row.userName || "未知用户"
}

function normalizeApprovalStatus(value) {
  const num = Number(value)
  return Number.isNaN(num) ? -1 : num
}

function buildDeptNameMap(deptRows) {
  const deptNameMap = new Map()
  const queue = Array.isArray(deptRows) ? [...deptRows] : []
  while (queue.length) {
    const item = queue.shift()
    if (!item || typeof item !== "object") continue
    if (item.deptId !== undefined && item.deptId !== null && item.deptName) {
      deptNameMap.set(String(item.deptId), item.deptName)
    }
    if (Array.isArray(item.children) && item.children.length) {
      queue.push(...item.children)
    }
  }
  return deptNameMap
}

function getCompanyName(row, deptNameMap) {
  const directName =
    row.companyName || row.deptName || row.company || row.organizationName || row.orgName
  if (typeof directName === "string" && directName.trim()) {
    return directName.trim()
  }
  const deptId = row.deptId ?? row.companyId ?? row.orgId
  if (deptId !== undefined && deptId !== null) {
    const mappedName = deptNameMap.get(String(deptId))
    if (mappedName) return mappedName
  }
  return "未知公司"
}

async function fetchAllRows(apiFn, baseQuery = {}) {
  const pageSize = 200
  const maxPages = 100
  const allRows = []

  for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
    const resp = await apiFn({
      ...baseQuery,
      pageNum,
      pageSize
    })
    const rows = Array.isArray(resp?.rows) ? resp.rows : []
    const total = Number(resp?.total || 0)
    allRows.push(...rows)

    if (rows.length < pageSize || allRows.length >= total) {
      break
    }
  }
  return allRows
}

function buildStats(materialRows, articleRows, deptRows = []) {
  const monthKeys = getRecentMonthKeys(12)
  const trendMap = new Map(monthKeys.map((k) => [k, { material: 0, article: 0 }]))
  const userMap = new Map()
  const monthUserMap = new Map()
  const deptNameMap = buildDeptNameMap(deptRows)
  const companyApprovalMap = new Map()

  materialRows.forEach((row) => {
    const key = toMonthKey(row.uploadTime || row.createTime)
    const user = getUserName(row, "material")
    if (trendMap.has(key)) {
      trendMap.get(key).material += 1
      userMap.set(user, (userMap.get(user) || 0) + 1)
    }
    if (key === monthKey) {
      const curr = monthUserMap.get(user) || { material: 0, article: 0, total: 0 }
      curr.material += 1
      curr.total += 1
      monthUserMap.set(user, curr)
    }
  })

  articleRows.forEach((row) => {
    const key = toMonthKey(row.createTime || row.submitTime)
    const user = getUserName(row, "article")
    const approvalStatus = normalizeApprovalStatus(row.approvalStatus)
    const companyName = getCompanyName(row, deptNameMap)
    if (trendMap.has(key)) {
      trendMap.get(key).article += 1
      userMap.set(user, (userMap.get(user) || 0) + 1)
    }
    if (approvalStatus === 1 || approvalStatus === 2) {
      const curr = companyApprovalMap.get(companyName) || { pass: 0, reject: 0 }
      if (approvalStatus === 1) curr.pass += 1
      if (approvalStatus === 2) curr.reject += 1
      companyApprovalMap.set(companyName, curr)
    }
    if (key === monthKey) {
      const curr = monthUserMap.get(user) || { material: 0, article: 0, total: 0 }
      curr.article += 1
      curr.total += 1
      monthUserMap.set(user, curr)
    }
  })

  const monthTrend = monthKeys.map((k) => ({
    month: k,
    material: trendMap.get(k).material,
    article: trendMap.get(k).article
  }))
  const monthMaterial = monthTrend[monthTrend.length - 1]?.material || 0
  const monthArticle = monthTrend[monthTrend.length - 1]?.article || 0
  const monthTotal = monthMaterial + monthArticle
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  const rankList = Array.from(monthUserMap.entries())
    .map(([name, info]) => ({
      name,
      material: info.material,
      article: info.article,
      total: info.total
    }))
    .sort((a, b) => b.total - a.total)

  const top10 = rankList.slice(0, 10)
  const companyApprovalRatio = Array.from(companyApprovalMap.entries())
    .map(([name, info]) => {
      const total = info.pass + info.reject
      const passRate = total ? Number(((info.pass / total) * 100).toFixed(1)) : 0
      const rejectRate = total ? Number(((info.reject / total) * 100).toFixed(1)) : 0
      return {
        name,
        pass: info.pass,
        reject: info.reject,
        total,
        passRate,
        rejectRate
      }
    })
    .sort((a, b) => b.total - a.total)
  const table = rankList.slice(0, 50).map((item, index) => ({
    rank: index + 1,
    name: item.name,
    materialCount: item.material,
    articleCount: item.article,
    totalCount: item.total,
    ratio: `${monthTotal ? ((item.total / monthTotal) * 100).toFixed(1) : 0}%`
  }))

  return {
    monthTrend,
    top10,
    companyCompare: [],
    companyApprovalRatio,
    table,
    summary: {
      materialTotal: materialRows.length,
      articleTotal: articleRows.length,
      activeUsers: userMap.size,
      monthTotal,
      monthMaterial,
      monthArticle,
      dailyAvg: monthTotal / daysInMonth
    }
  }
}

function buildCompanyCompareMockData(deptRows) {
  const deptNames = []
  const queue = Array.isArray(deptRows) ? [...deptRows] : []
  while (queue.length) {
    const item = queue.shift()
    if (!item || typeof item !== "object") continue
    const name = item.deptName
    if (typeof name === "string" && name.trim().length > 0) {
      deptNames.push(name.trim())
    }
    if (Array.isArray(item.children) && item.children.length) {
      queue.push(...item.children)
    }
  }

  const names = deptNames.length ? deptNames : ["综合管理部", "运营中心", "内容中心", "技术中心", "市场部"]

  return names.map((name, index) => {
    const material = 36 + ((index * 17 + 9) % 95)
    const article = 24 + ((index * 11 + 7) % 82)
    return {
      name,
      material,
      article
    }
  })
}

function buildCompanyApprovalRatioMockData(deptRows) {
  const deptNames = []
  const queue = Array.isArray(deptRows) ? [...deptRows] : []
  while (queue.length) {
    const item = queue.shift()
    if (!item || typeof item !== "object") continue
    const name = item.deptName
    if (typeof name === "string" && name.trim().length > 0) {
      deptNames.push(name.trim())
    }
    if (Array.isArray(item.children) && item.children.length) {
      queue.push(...item.children)
    }
  }

  const names = deptNames.length ? deptNames : ["综合管理部", "运营中心", "内容中心", "技术中心", "市场部"]

  return names.map((name, index) => {
    const pass = 22 + ((index * 13 + 5) % 61)
    const reject = 6 + ((index * 7 + 3) % 21)
    const total = pass + reject
    const passRate = Number(((pass / total) * 100).toFixed(1))
    const rejectRate = Number(((reject / total) * 100).toFixed(1))
    return {
      name,
      pass,
      reject,
      total,
      passRate,
      rejectRate
    }
  })
}

function createTrendOption(monthTrend) {
  return {
    color: ["#3c8cff", "#36b37e"],
    tooltip: { trigger: "axis" },
    legend: {
      top: 10,
      data: ["素材上传量", "稿件上传量"]
    },
    grid: {
      left: "4%",
      right: "4%",
      bottom: "7%",
      top: 50,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: monthTrend.map((item) => item.month),
      boundaryGap: false
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed" } }
    },
    series: [
      {
        name: "素材上传量",
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.16 },
        data: monthTrend.map((item) => item.material)
      },
      {
        name: "稿件上传量",
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.12 },
        data: monthTrend.map((item) => item.article)
      }
    ]
  }
}

function createPieOption(materialTotal, articleTotal) {
  return {
    color: ["#3c8cff", "#36b37e"],
    tooltip: { trigger: "item" },
    legend: {
      orient: "vertical",
      right: 8,
      top: "middle"
    },
    series: [
      {
        name: "内容占比",
        type: "pie",
        radius: ["45%", "70%"],
        center: ["35%", "50%"],
        label: {
          formatter: "{b}\n{d}%"
        },
        data: [
          { name: "素材", value: materialTotal },
          { name: "稿件", value: articleTotal }
        ]
      }
    ]
  }
}

function createRankOption(rankData) {
  return {
    color: ["#ff9f43", "#3c8cff"],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" }
    },
    legend: {
      top: 10,
      data: ["素材", "稿件"]
    },
    grid: {
      left: "5%",
      right: "4%",
      bottom: "6%",
      top: 50,
      containLabel: true
    },
    xAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed" } }
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: rankData.map((item) => item.name)
    },
    series: [
      {
        name: "素材",
        type: "bar",
        stack: "total",
        barMaxWidth: 22,
        data: rankData.map((item) => item.material)
      },
      {
        name: "稿件",
        type: "bar",
        stack: "total",
        barMaxWidth: 22,
        data: rankData.map((item) => item.article)
      }
    ],
    graphic: rankData.length
      ? []
      : [
          {
            type: "text",
            left: "center",
            top: "middle",
            style: {
              text: "本月暂无数据",
              fill: "#909399",
              fontSize: 14
            }
          }
        ]
  }
}

function createMonthlyCompareOption(compareData) {
  const enableZoom = compareData.length > 8
  return {
    color: ["#2563eb", "#f97316"],
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: {
      top: 10,
      data: ["素材数量", "稿件数量"]
    },
    grid: {
      left: "4%",
      right: "4%",
      bottom: enableZoom ? 52 : "7%",
      top: 50,
      containLabel: true
    },
    xAxis: {
      type: "category",
      axisLabel: { interval: 0, rotate: compareData.length > 10 ? 30 : 0 },
      data: compareData.map((item) => item.name)
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed" } }
    },
    dataZoom: enableZoom
      ? [
          {
            type: "inside",
            start: 0,
            end: Math.max(20, (8 / compareData.length) * 100)
          },
          {
            type: "slider",
            height: 16,
            bottom: 16,
            start: 0,
            end: Math.max(20, (8 / compareData.length) * 100)
          }
        ]
      : [],
    series: [
      {
        name: "素材数量",
        type: "bar",
        barMaxWidth: 28,
        data: compareData.map((item) => item.material)
      },
      {
        name: "稿件数量",
        type: "bar",
        barMaxWidth: 28,
        data: compareData.map((item) => item.article)
      }
    ]
  }
}

function createCompanyApprovalRatioOption(ratioData) {
  const enableZoom = ratioData.length > 8
  return {
    color: ["#16a34a", "#ef4444"],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter(params) {
        const passItem = params.find((item) => item.seriesName === "通过占比")
        const rejectItem = params.find((item) => item.seriesName === "不通过占比")
        if (!passItem && !rejectItem) return ""
        const data = passItem?.data?.dataRef || rejectItem?.data?.dataRef || {}
        const passRate = passItem?.value ?? 0
        const rejectRate = rejectItem?.value ?? 0
        return [
          `${passItem?.name || rejectItem?.name}`,
          `通过占比：${passRate}%（${data.pass ?? 0}）`,
          `不通过占比：${rejectRate}%（${data.reject ?? 0}）`
        ].join("<br/>")
      }
    },
    legend: {
      top: 10,
      data: ["通过占比", "不通过占比"]
    },
    grid: {
      left: "4%",
      right: "4%",
      bottom: enableZoom ? 78 : 56,
      top: 50,
      containLabel: true
    },
    xAxis: {
      type: "category",
      axisLabel: {
        interval: 0,
        rotate: ratioData.length > 10 ? 35 : 0
      },
      data: ratioData.map((item) => item.name)
    },
    yAxis: {
      type: "value",
      max: 100,
      axisLabel: {
        formatter: "{value}%"
      },
      splitLine: { lineStyle: { type: "dashed" } }
    },
    dataZoom: enableZoom
      ? [
          {
            type: "inside",
            start: 0,
            end: Math.max(20, (8 / ratioData.length) * 100)
          },
          {
            type: "slider",
            height: 16,
            bottom: 16,
            start: 0,
            end: Math.max(20, (8 / ratioData.length) * 100)
          }
        ]
      : [],
    series: [
      {
        name: "通过占比",
        type: "bar",
        stack: "ratio",
        barMaxWidth: 36,
        label: {
          show: true,
          position: "inside",
          formatter: ({ value }) => (value > 10 ? `${value}%` : "")
        },
        data: ratioData.map((item) => ({
          value: item.passRate,
          dataRef: item
        }))
      },
      {
        name: "不通过占比",
        type: "bar",
        stack: "ratio",
        barMaxWidth: 36,
        label: {
          show: true,
          position: "inside",
          formatter: ({ value }) => (value > 10 ? `${value}%` : "")
        },
        data: ratioData.map((item) => ({
          value: item.rejectRate,
          dataRef: item
        }))
      }
    ],
    graphic: ratioData.length
      ? []
      : [
          {
            type: "text",
            left: "center",
            top: "middle",
            style: {
              text: "暂无审批完成数据",
              fill: "#909399",
              fontSize: 14
            }
          }
        ]
  }
}

function initChartsIfNeeded() {
  if (!trendChartInstance && trendChartRef.value) {
    trendChartInstance = echarts.init(trendChartRef.value)
  }
  if (!pieChartInstance && pieChartRef.value) {
    pieChartInstance = echarts.init(pieChartRef.value)
  }
  if (!rankChartInstance && rankChartRef.value) {
    rankChartInstance = echarts.init(rankChartRef.value)
  }
  if (!monthlyChartInstance && monthlyChartRef.value) {
    monthlyChartInstance = echarts.init(monthlyChartRef.value)
  }
  if (!approvalRatioChartInstance && approvalRatioChartRef.value) {
    approvalRatioChartInstance = echarts.init(approvalRatioChartRef.value)
  }
}

function renderCharts(stats) {
  initChartsIfNeeded()
  trendChartInstance?.setOption(createTrendOption(stats.monthTrend), true)
  pieChartInstance?.setOption(
    createPieOption(stats.summary.materialTotal, stats.summary.articleTotal),
    true
  )
  rankChartInstance?.setOption(createRankOption(stats.top10), true)
  monthlyChartInstance?.setOption(createMonthlyCompareOption(stats.companyCompare), true)
  approvalRatioChartInstance?.setOption(
    createCompanyApprovalRatioOption(stats.companyApprovalRatio),
    true
  )
}

function resizeCharts() {
  trendChartInstance?.resize()
  pieChartInstance?.resize()
  rankChartInstance?.resize()
  monthlyChartInstance?.resize()
  approvalRatioChartInstance?.resize()
}

async function loadData() {
  loading.value = true
  try {
    const [materialRows, articleRows, deptResp] = await Promise.all([
      fetchAllRows(listMaterial),
      fetchAllRows(listAllArticle),
      listDept()
    ])

    const stats = buildStats(materialRows, articleRows, deptResp?.data)
    stats.companyCompare = buildCompanyCompareMockData(deptResp?.data)
    stats.companyApprovalRatio = buildCompanyApprovalRatioMockData(deptResp?.data)
    summary.value = stats.summary
    tableData.value = stats.table

    await nextTick()
    renderCharts(stats)
  } catch (error) {
    console.error("加载统计数据失败:", error)
    ElMessage.error("加载统计数据失败，请稍后重试")
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
  window.addEventListener("resize", resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCharts)
  trendChartInstance?.dispose()
  pieChartInstance?.dispose()
  rankChartInstance?.dispose()
  monthlyChartInstance?.dispose()
  approvalRatioChartInstance?.dispose()
  trendChartInstance = null
  pieChartInstance = null
  rankChartInstance = null
  monthlyChartInstance = null
  approvalRatioChartInstance = null
})
</script>

<style scoped>
.chart-page {
  padding: 16px;
  background: linear-gradient(180deg, #f5f8ff 0%, #f8fbff 220px, #f7f8fa 100%);
  min-height: calc(100vh - 84px);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  color: #1f2d3d;
  font-weight: 700;
}

.page-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #6c7a89;
}

.metric-row {
  margin-bottom: 4px;
}

.metric-card {
  margin-bottom: 12px;
  border-radius: 10px;
}

.metric-title {
  font-size: 13px;
  color: #6c7a89;
}

.metric-value {
  margin-top: 8px;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 700;
  color: #1f2d3d;
}

.metric-desc {
  margin-top: 8px;
  font-size: 12px;
  color: #8b99aa;
}

.chart-card {
  margin-bottom: 16px;
  border-radius: 10px;
}

.table-card {
  border-radius: 10px;
}

.chart-panel {
  width: 100%;
}

.chart-panel-lg {
  height: 380px;
}

.chart-panel-md {
  height: 320px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: space-between;
  }

  .metric-value {
    font-size: 24px;
  }
}
</style>
