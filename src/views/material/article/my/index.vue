<template>
  <div class="app-container">
    <!-- 页面标题 -->
    <div class="page-title">
      <span>我的投稿</span>
    </div>

    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form">
      <el-form-item>
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          style="width: 200px;"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button type="text" @click="showAdvancedSearch = !showAdvancedSearch">
          {{ showAdvancedSearch ? '收起' : '高级筛选' }}<el-icon class="el-icon--right"><arrow-down v-if="!showAdvancedSearch" /><arrow-up v-else /></el-icon>
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 高级搜索区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" class="advanced-search-form" v-if="showAdvancedSearch">
      <el-form-item label="审核状态">
        <el-select v-model="queryParams.approvalStatus" placeholder="请选择" clearable style="width: 150px;">
          <el-option label="通过" value=1 />
          <el-option label="不通过" value=2 />
          <el-option label="待审核" value=0 />
        </el-select>
      </el-form-item>
      <el-form-item label="审批人">
        <el-input
          v-model="queryParams.approver"
          placeholder="请输入审批人"
          clearable
          style="width: 200px;"
        />
      </el-form-item>
      <el-form-item label="作者姓名">
        <el-input
          v-model="queryParams.authorName"
          placeholder="请输入作者姓名"
          clearable
          style="width: 200px;"
        />
      </el-form-item>
      <!-- <el-form-item label="内容类型">
        <el-select v-model="queryParams.contentType" placeholder="请选择" clearable style="width: 150px;">
          <el-option label="图文" value="imageText" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容分类">
        <el-select v-model="queryParams.contentCategory" placeholder="请选择" clearable style="width: 150px;">
          <el-option label="其他" value="other" />
          <el-option label="经济" value="economy" />
        </el-select>
      </el-form-item> -->
      <el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="articleList" style="width: 100%;">
      <!-- 内容标题 -->
      <el-table-column prop="title" label="内容标题" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="handleView(scope.row)">{{ scope.row.title }}</el-link>
        </template>
      </el-table-column>
      <!-- 提交时间 -->
      <el-table-column prop="createTime" label="提交时间" width="180" align="center" />
      <!-- 审核状态 -->
      <el-table-column prop="approvalStatus" label="审批状态" width="180" align="center">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.approvalStatus)">
            {{ scope.row.approvalStatus === 1 ? '通过' : scope.row.approvalStatus === 2 ? '不通过' : '待审批' }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- 审批人 -->
      <el-table-column prop="approver" label="审批人" width="120" align="center" />
      <!-- 审批时间 -->
      <el-table-column prop="approvalTime" label="审批时间" width="180" align="center" />
      <!-- 审批意见 -->
      <el-table-column prop="approvalComment" label="审批意见" width="180" align="center" />

      <!-- 内容类型 -->
      <!-- <el-table-column prop="contentType" label="内容类型" width="100" align="center" /> -->
      <!-- 内容分类 -->
      <!-- <el-table-column prop="contentCategory" label="内容分类" width="100" align="center" /> -->
      <!-- 标签 -->
      <!-- <el-table-column prop="tags" label="标签" min-width="150" show-overflow-tooltip /> -->
      <!-- 操作时间 -->
      <!-- <el-table-column prop="operationTime" label="操作时间" width="180" align="center" /> -->
      <!-- 海投主题 -->
      <!-- <el-table-column prop="theme" label="海投主题" width="100" align="center" /> -->
      <!-- 质量评级 -->
      <!-- <el-table-column prop="qualityRating" label="质量评级" width="100" align="center" /> -->
      <!-- 作者姓名 -->
      <el-table-column prop="authorName" label="作者姓名" width="180" align="center" />
      <!-- 供稿渠道 -->
      <!-- <el-table-column prop="contributionChannel" label="供稿渠道" width="120" align="center" /> -->
      <!-- 操作列 -->
      <el-table-column label="操作" width="280" align="center">
        <template #default="scope">
          <el-button link type="primary" size="middle" @click="handleReedit(scope.row)">重新编辑</el-button>
          <el-button link type="primary" size="middle" @click="handleView(scope.row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="稿件详情"
      width="70%"
      :close-on-click-modal="false"
    >
      <div class="article-detail">
        <div class="detail-header">
          <h2 class="article-title">{{ currentArticle.title }}</h2>
          <div class="article-meta">
            <span>作者：{{ currentArticle.authorName }}</span>
            <span>提交时间：{{ currentArticle.createTime }}</span>
            <el-tag :type="getStatusTagType(currentArticle.approvalStatus)">
              {{ currentArticle.approvalStatus === 1 ? '通过' : currentArticle.approvalStatus === 2 ? '不通过' : '待审批' }}
            </el-tag>
          </div>
        </div>
        <div class="article-content" v-html="currentArticle.content"></div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { addArticle, listArticle, getArticle } from "@/api/xcsc/article"

// 搜索参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: '',
  approvalStatus: '',
  approver: '',
  authorName: '',
})

// 高级搜索开关
const showAdvancedSearch = ref(false)

// 表格数据
const articleList = ref([])
const loading = ref(false)
const total = ref(0)
const viewDialogVisible = ref(false)
const currentArticle = ref({})

// 模拟数据
// const mockData = [
//   {
//     id: 1,
//     title: '品质皖道通四海 铺展山水新动脉',
//     submitTime: '2025-12-17 10:35',
//     auditStatus: 'passed',
//     contentType: '图文',
//     contentCategory: '其他',
//     tags: '安徽交控高速公路、高速公路、德上高速公路',
//     operationTime: '2025-12-17 15:19',
//     theme: '',
//     qualityRating: '无',
//     authorName: '',
//     contributionChannel: '手动创建'
//   },
//   {
//     id: 2,
//     title: '通过交工验收！安徽这两条高速公路通车在即',
//     submitTime: '2025-12-03 08:29',
//     auditStatus: 'rejected',
//     contentType: '图文',
//     contentCategory: '其他',
//     tags: '安徽交控高速公路建设、长三角一体化、亳州',
//     operationTime: '2025-12-17 14:51',
//     theme: '',
//     qualityRating: '无',
//     authorName: '',
//     contributionChannel: '手动创建'
//   },
//   {
//     id: 3,
//     title: '获批！50亿元',
//     submitTime: '2025-12-03 08:23',
//     auditStatus: 'passed',
//     contentType: '图文',
//     contentCategory: '经济',
//     tags: '上市公司、国有企业、债券融资、2016',
//     operationTime: '2025-12-03 14:51',
//     theme: '',
//     qualityRating: '无',
//     authorName: '',
//     contributionChannel: '手动创建'
//   },
//   {
//     id: 4,
//     title: '这条串联四省的交通大动脉即将全线贯通已持续',
//     submitTime: '2025-12-03 08:19',
//     auditStatus: 'passed',
//     contentType: '图文',
//     contentCategory: '其他',
//     tags: '黄山、德上高速、德上高速、安徽交控高速公路',
//     operationTime: '2025-12-03 14:51',
//     theme: '',
//     qualityRating: '无',
//     authorName: '',
//     contributionChannel: '手动创建'
//   },
//   {
//     id: 5,
//     title: '年底前正式通车！徐淮阜高速亳州段通过交工验收',
//     submitTime: '2025-11-19 12:05',
//     auditStatus: 'passed',
//     contentType: '图文',
//     contentCategory: '其他',
//     tags: '皖北、阜阳、亳州、高速公路、安徽交控高速公路',
//     operationTime: '2025-11-19 18:12',
//     theme: '',
//     qualityRating: '无',
//     authorName: '',
//     contributionChannel: '手动创建'
//   },
//   {
//     id: 6,
//     title: '皖鄂新通道 山乡幸福路',
//     submitTime: '2025-11-18 10:16',
//     auditStatus: 'passed',
//     contentType: '图文',
//     contentCategory: '其他',
//     tags: '蕲春、安徽交控高速公路、大别山革命老区、乡村振兴',
//     operationTime: '2025-11-18 15:15',
//     theme: '',
//     qualityRating: '无',
//     authorName: '',
//     contributionChannel: '手动创建'
//   }
// ]

// 获取审核状态标签类型
const getStatusTagType = (status) => {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'danger'
    case 0:
      return 'warning'
    default:
      return ''
  }
}

// 查询数据
const getList = async () => {
  loading.value = true
  try {
    const response = await listArticle(queryParams)
    articleList.value = response.rows || []
    total.value = response.total || 0
    console.log('获取到的文章列表:', response.rows)
    // 过滤出当前用户的文章
    // articleList.value = articleList.value.filter(item => item.authorId === getUserId())
  } catch (error) {
    ElMessage.error('获取文章列表失败')
    console.error('获取文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置
const resetQuery = () => {
  Object.assign(queryParams, {
    title: '',
    approvalStatus: '',
    contentType: '',
    contentCategory: '',
    approver: '',
    authorName: ''
  })
  handleQuery()
}

// 重新编辑
const handleReedit = (row) => {
  ElMessage.success('重新编辑功能待实现')
}

// 查看
// const handleHistory = (row) => {
//   ElMessage.success('查看功能待实现')
// }
const handleView = async (row) => {
  try {
    const response = await getArticle(row.id)
    currentArticle.value = response.data
    viewDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取稿件详情失败')
    console.error('获取稿件详情失败:', error)
  }
}
// 页面加载时获取数据
onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 40px;
  background-color: #fff;
  min-height: calc(100vh - 60px);
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.search-form {
  margin-bottom: 15px;
}

.advanced-search-form {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.article-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.article-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 15px 0;
  color: #303133;
}

.article-meta {
  display: flex;
  gap: 20px;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.article-content {
  line-height: 1.8;
  color: #303133;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.article-content :deep(p) {
  margin: 10px 0;
}
</style>