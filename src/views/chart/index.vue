<template>
  <div class="app-container chart-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">统计分析看板</h2>
        <p class="page-subtitle">统计周期：{{ rangeLabel }}</p>
      </div>
      <div class="header-actions">
        <el-tag type="info" effect="plain">{{ todayLabel }}</el-tag>
        <el-button type="primary" :loading="loading" @click="loadMaterialCount">刷新数据</el-button>
      </div>
    </div>

    <!-- 加载中覆盖层 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <el-loading-spinner></el-loading-spinner>
        <div class="loading-text">正在加载统计数据...</div>
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
          <template #header>近30天素材与稿件每日上传趋势（折线图）</template>
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
          <template #header>本月素材贡献 Top10（柱状图）</template>
          <div ref="rankChartRef" class="chart-panel chart-panel-md"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>本月稿件贡献 Top10（柱状图）</template>
          <div ref="articleRankChartRef" class="chart-panel chart-panel-md"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24">
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
      <template #header>本月人员贡献明细</template>
      <el-table :data="contributionDetails" stripe border height="420">
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import * as echarts from "echarts"
import { countAllFile } from "@/api/xcsc/uploadFile"
import { getArticleTotal, getMaterialIncreaseRecent30Days, getMaterialIncreaseCurrentMonth, getArticleIncreaseCurrentMonth, getArticleIncreaseRecent30Days as getArticleDailyTrend, getMaterialTop10ByUser, getArticleTop10ByUser, getMaterialTotalByDept, getArticleTotalByDept, getArticleStatusByDept } from "@/api/xcsc/statistics"
import { listDept } from "@/api/system/dept"



const loading = ref(false)
const trendChartRef = ref(null)
const pieChartRef = ref(null)
const rankChartRef = ref(null)
const articleRankChartRef = ref(null)
const monthlyChartRef = ref(null)
const approvalRatioChartRef = ref(null)
let trendChartInstance = null
let pieChartInstance = null
let rankChartInstance = null
let articleRankChartInstance = null
let monthlyChartInstance = null
let approvalRatioChartInstance = null
let previousBodyOverflow = ""

function setPageScrollLocked(locked) {
  if (typeof document === "undefined") return
  if (locked) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return
  }
  document.body.style.overflow = previousBodyOverflow || ""
}

// 部门映射，用于存储部门id和部门名称的对应关系
const deptMap = ref(new Map())
const EXCLUDED_DEPT_NAMES = new Set(["共享文件夹", "安徽交控集团"])

// 人员贡献明细数据
const contributionDetails = ref([])

const summary = ref({
  materialTotal: 0,
  articleTotal: 0,
  activeUsers: 0,
  monthTotal: 0,
  monthMaterial: 0,
  monthArticle: 0,
  dailyAvg: 0
})

const now = new Date()
const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
const todayLabel = computed(() => {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `数据日期：${y}-${m}-${d}`
})
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
    label: "本月活跃用户",
    value: formatNumber(summary.value.activeUsers),
    desc: "本月有上传行为的用户"
  },
  {
    label: "本月总贡献",
    value: formatNumber(summary.value.monthMaterial + summary.value.monthArticle),
    desc: `日均 ${((summary.value.monthMaterial + summary.value.monthArticle) / new Date().getDate()).toFixed(1)}`
  }
])

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(Number(value || 0))
}

function getRecentDayKeys(total = 30) {
  const keys = []
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = total - 1; i >= 0; i -= 1) {
    const temp = new Date(base)
    temp.setDate(base.getDate() - i)
    keys.push(
      `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, "0")}-${String(
        temp.getDate()
      ).padStart(2, "0")}`
    )
  }
  return keys
}

function createTrendOption(dailyTrend) {
  return {
    color: ["#3c8cff", "#36b37e"],
    tooltip: { trigger: "axis" },
    legend: {
      top: 10,
      data: ["素材每日上传量", "稿件每日上传量"]
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
      data: dailyTrend.map((item) => item.day),
      boundaryGap: false
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed" } }
    },
    series: [
      {
        name: "素材每日上传量",
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.16 },
        data: dailyTrend.map((item) => item.material)
      },
      {
        name: "稿件每日上传量",
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.12 },
        data: dailyTrend.map((item) => item.article)
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

function createRankOption(rankData, color = "#ff9f43") {
  return {
    color: [color],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" }
    },
    legend: {
      top: 10,
      data: ["贡献数"]
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
        name: "贡献数",
        type: "bar",
        barMaxWidth: 22,
        data: rankData.map((item) => item.total)
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
  console.log("createMonthlyCompareOption 数据:", compareData)
  const enableZoom = compareData.length > 8
  
  // 如果没有数据，添加空数据提示
  const graphic = compareData.length
    ? []
    : [
        {
          type: "text",
          left: "center",
          top: "middle",
          style: {
            text: "暂无数据",
            fill: "#909399",
            fontSize: 14
          }
        }
      ]
  
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
    ],
    graphic: graphic
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
  if (!articleRankChartInstance && articleRankChartRef.value) {
    articleRankChartInstance = echarts.init(articleRankChartRef.value)
  }
  if (!monthlyChartInstance && monthlyChartRef.value) {
    monthlyChartInstance = echarts.init(monthlyChartRef.value)
  }
  if (!approvalRatioChartInstance && approvalRatioChartRef.value) {
    approvalRatioChartInstance = echarts.init(approvalRatioChartRef.value)
  }
}

async function loadMaterialCount() {
  loading.value = true
  try {
    // 获取素材总量
    const materialResponse = await countAllFile()
    if (materialResponse?.data) {
      summary.value.materialTotal = materialResponse.data
    }
    
    // 获取稿件总量
    const articleResponse = await getArticleTotal({})
    if (articleResponse?.data) {
      summary.value.articleTotal = articleResponse.data
    }
    
    // 获取近30天每日素材上传量
    const dailyMaterialResponse = await getMaterialIncreaseRecent30Days()
    if (dailyMaterialResponse?.data) {
      summary.value.dailyMaterialTrend = dailyMaterialResponse.data
    }
    
    // 获取近30天每日新增稿件数量
    const dailyArticleResponse = await getArticleDailyTrend()
    if (dailyArticleResponse?.data) {
      summary.value.dailyArticleTrend = dailyArticleResponse.data
    }
    
    // 获取本月新增素材量
    const currentMonthMaterialResponse = await getMaterialIncreaseCurrentMonth()
    if (currentMonthMaterialResponse?.data) {
      summary.value.monthMaterial = currentMonthMaterialResponse.data.count
    }
    
    // 获取本月新增稿件量
    const currentMonthArticleResponse = await getArticleIncreaseCurrentMonth()
    if (currentMonthArticleResponse?.data) {
      summary.value.monthArticle = currentMonthArticleResponse.data.count
    }
    
    // 获取本月素材上传量前十名（按创建人）
    const materialTop10Response = await getMaterialTop10ByUser()
    if (materialTop10Response?.data) {
      summary.value.top10Material = materialTop10Response.data.top10List
    }
    
    // 获取本月稿件上传量前十名（按创建人）
    const articleTop10Response = await getArticleTop10ByUser()
    if (articleTop10Response?.data) {
      summary.value.top10Article = articleTop10Response.data.top10List
    }
    
    // 获取各子公司素材和稿件数量
    const deptMaterialList = []
    console.log("部门映射大小:", deptMap.value.size)
    for (const [deptId, deptName] of deptMap.value) {
      try {
        console.log(`获取部门 ${deptName} (${deptId}) 的统计数据`)
        // 获取部门素材数量
        const deptMaterialResponse = await getMaterialTotalByDept(deptId)
        console.log(`部门 ${deptName} 素材响应:`, deptMaterialResponse)
        const materialCount = deptMaterialResponse?.data?.total || 0
        
        // 获取部门稿件数量
        const deptArticleResponse = await getArticleTotalByDept(deptId)
        console.log(`部门 ${deptName} 稿件响应:`, deptArticleResponse)
        const articleCount = deptArticleResponse?.data?.total || 0
        
        const deptData = {
          name: deptName,
          material: materialCount,
          article: articleCount
        }
        console.log(`部门 ${deptName} 数据:`, deptData)
        deptMaterialList.push(deptData)
      } catch (error) {
        console.error(`获取部门 ${deptName} 的统计数据失败:`, error)
      }
    }
    console.log("各子公司统计数据:", deptMaterialList)
    summary.value.companyCompare = deptMaterialList
    
    // 获取各部门稿件通过/不通过数量
    try {
      const articleStatusResponse = await getArticleStatusByDept()
      console.log("各部门稿件状态响应:", articleStatusResponse)
      
      // 创建部门状态映射（兼容后端返回字段：passedCount/notPassedCount）
      const statusMap = new Map()
      if (articleStatusResponse?.data) {
        articleStatusResponse.data.forEach(item => {
          statusMap.set(Number(item.deptId), item)
        })
      }
      
      // 确保所有部门都显示在图表中，即使没有稿件
      const statusData = []
      for (const [deptId, deptName] of deptMap.value) {
        const item = statusMap.get(Number(deptId)) || {}
        const passCount = Number(item.passedCount ?? item.pass ?? 0)
        const rejectCount = Number(item.notPassedCount ?? item.reject ?? 0)
        const total = passCount + rejectCount
        const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0
        const rejectRate = total > 0 ? Math.round((rejectCount / total) * 100) : 0
        
        statusData.push({
          name: deptName,
          pass: passCount,
          reject: rejectCount,
          passRate: passRate,
          rejectRate: rejectRate
        })
      }
      
      console.log("处理后的稿件状态数据:", statusData)
      summary.value.companyApprovalRatio = statusData
    } catch (error) {
      console.error("获取各部门稿件状态失败:", error)
      // 即使获取失败，也要显示所有部门
      const statusData = []
      for (const [deptId, deptName] of deptMap.value) {
        statusData.push({
          name: deptName,
          pass: 0,
          reject: 0,
          passRate: 0,
          rejectRate: 0
        })
      }
      summary.value.companyApprovalRatio = statusData
    }
    
    // 构建人员贡献明细数据
    try {
      // 创建人员贡献映射
      const contributionMap = new Map()
      
      // 处理素材贡献数据
      if (summary.value.top10Material && summary.value.top10Material.length > 0) {
        summary.value.top10Material.forEach(item => {
          const name = item.createBy || '未知用户'
          if (!contributionMap.has(name)) {
            contributionMap.set(name, {
              name: name,
              materialCount: 0,
              articleCount: 0
            })
          }
          const userData = contributionMap.get(name)
          userData.materialCount = item.count || 0
          contributionMap.set(name, userData)
        })
      }
      
      // 处理稿件贡献数据
      if (summary.value.top10Article && summary.value.top10Article.length > 0) {
        summary.value.top10Article.forEach(item => {
          const name = item.createBy || '未知用户'
          if (!contributionMap.has(name)) {
            contributionMap.set(name, {
              name: name,
              materialCount: 0,
              articleCount: 0
            })
          }
          const userData = contributionMap.get(name)
          userData.articleCount = item.count || 0
          contributionMap.set(name, userData)
        })
      }
      
      // 计算本月活跃用户数
      summary.value.activeUsers = contributionMap.size
      console.log("本月活跃用户数:", summary.value.activeUsers)
      
      // 转换为数组并计算总贡献数
      const contributionArray = Array.from(contributionMap.values()).map(item => {
        const totalCount = item.materialCount + item.articleCount
        return {
          ...item,
          totalCount: totalCount
        }
      })
      
      // 计算总贡献数总和
      const totalSum = contributionArray.reduce((sum, item) => sum + item.totalCount, 0)
      
      // 计算贡献占比并排序
      const sortedContributions = contributionArray
        .map(item => {
          const ratio = totalSum > 0 ? ((item.totalCount / totalSum) * 100).toFixed(2) + '%' : '0%'
          return {
            ...item,
            ratio: ratio
          }
        })
        .sort((a, b) => b.totalCount - a.totalCount)
        .map((item, index) => {
          return {
            ...item,
            rank: index + 1
          }
        })
      
      console.log("人员贡献明细数据:", sortedContributions)
      contributionDetails.value = sortedContributions
    } catch (error) {
      console.error("构建人员贡献明细失败:", error)
    }
  } catch (error) {
    console.error("获取统计数据失败:", error)
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  initChartsIfNeeded()
  
  // 准备近30天数据
  const recentDays = getRecentDayKeys(30)
  
  // 处理近30天每日素材和稿件上传量数据
  const dailyTrend = recentDays.map(day => {
    // 从dailyMaterialTrend对象中获取对应日期的素材值
    const materialCount = summary.value.dailyMaterialTrend?.dailyIncrease?.[day] || 0
    // 从dailyArticleTrend对象中获取对应日期的稿件值
    const articleCount = summary.value.dailyArticleTrend?.dailyIncrease?.[day] || 0
    return {
      day,
      material: materialCount,
      article: articleCount
    }
  })
  
  // 处理top10数据格式，确保与createRankOption函数期望的格式匹配
  const processedTop10Material = (summary.value.top10Material || []).map(item => ({
    name: item.createBy || '未知用户',
    total: item.count || 0
  }))
  
  const processedTop10Article = (summary.value.top10Article || []).map(item => ({
    name: item.createBy || '未知用户',
    total: item.count || 0
  }))
  
  const companyCompareData = summary.value.companyCompare || []
  console.log("传递给图表的公司对比数据:", companyCompareData)
  
  const companyApprovalRatioData = summary.value.companyApprovalRatio || []
  console.log("传递给图表的审批比例数据:", companyApprovalRatioData)
  
  const defaultStats = {
    dailyTrend: dailyTrend,
    summary: {
      materialTotal: summary.value.materialTotal,
      articleTotal: summary.value.articleTotal
    },
    top10Material: processedTop10Material,
    top10Article: processedTop10Article,
    companyCompare: companyCompareData,
    companyApprovalRatio: companyApprovalRatioData
  }
  
  trendChartInstance?.setOption(createTrendOption(defaultStats.dailyTrend), true)
  pieChartInstance?.setOption(
    createPieOption(defaultStats.summary.materialTotal, defaultStats.summary.articleTotal),
    true
  )
  rankChartInstance?.setOption(createRankOption(defaultStats.top10Material, "#3c8cff"), true)
  articleRankChartInstance?.setOption(createRankOption(defaultStats.top10Article, "#36b37e"), true)
  monthlyChartInstance?.setOption(createMonthlyCompareOption(companyCompareData), true)
  approvalRatioChartInstance?.setOption(
    createCompanyApprovalRatioOption(companyApprovalRatioData),
    true
  )
}

function resizeCharts() {
  trendChartInstance?.resize()
  pieChartInstance?.resize()
  rankChartInstance?.resize()
  articleRankChartInstance?.resize()
  monthlyChartInstance?.resize()
  approvalRatioChartInstance?.resize()
}

// 获取部门列表并构建部门映射
async function loadDeptMap() {
  try {
    const response = await listDept({})
    console.log("部门列表响应:", response)
    // request 拦截器已返回 res.data，这里优先兼容标准 { code, msg, data: [] }
    const depts = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.rows)
        ? response.rows
        : Array.isArray(response?.data?.rows)
          ? response.data.rows
          : []

    console.log("部门列表:", depts)
    const newDeptMap = new Map()
    depts.forEach((dept) => {
      if (
        dept?.deptId != null &&
        dept?.deptName &&
        !EXCLUDED_DEPT_NAMES.has(dept.deptName)
      ) {
        newDeptMap.set(dept.deptId, dept.deptName)
      }
    })
    deptMap.value = newDeptMap
    console.log("部门映射:", deptMap.value)
  } catch (error) {
    console.error("获取部门列表失败:", error)
  }
}

onMounted(async () => {
  await loadDeptMap()
  await loadMaterialCount()
  renderCharts()
  window.addEventListener("resize", resizeCharts)
})

watch(
  loading,
  (isLoading) => {
    setPageScrollLocked(isLoading)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCharts)
  setPageScrollLocked(false)
  trendChartInstance?.dispose()
  pieChartInstance?.dispose()
  rankChartInstance?.dispose()
  articleRankChartInstance?.dispose()
  monthlyChartInstance?.dispose()
  approvalRatioChartInstance?.dispose()
  trendChartInstance = null
  pieChartInstance = null
  rankChartInstance = null
  articleRankChartInstance = null
  monthlyChartInstance = null
  approvalRatioChartInstance = null
})
</script>

<style scoped>
.chart-page {
  padding: 16px;
  background: linear-gradient(180deg, #f5f8ff 0%, #f8fbff 220px, #f7f8fa 100%);
  min-height: calc(100vh - 84px);
  position: relative;
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

/* 加载中样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #606266;
}

.el-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
