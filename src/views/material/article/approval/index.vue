<template>
  <div class="app-container">
    <div class="approval-layout">
      <div class="sidebar">
        <div class="sidebar-title">审批管理</div>
        <div class="sidebar-menu">
          <div 
            class="menu-item" 
            :class="{ active: activeTab === 'pending' }"
            @click="handleTabChange('pending')"
          >
            <el-icon><Clock /></el-icon>
            <span>待审批</span>
            <el-badge v-if="pendingCount > 0" :value="pendingCount" class="badge" />
          </div>
          <div 
            class="menu-item" 
            :class="{ active: activeTab === 'approved' }"
            @click="handleTabChange('approved')"
          >
            <el-icon><CircleCheck /></el-icon>
            <span>已审批</span>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="page-title">
          <span>{{ pageTitle }}</span>
        </div>

        <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form">
          <el-form-item>
            <el-input
              v-model="queryParams.title"
              placeholder="请输入标题"
              clearable
              style="width: 200px;"
            />
          </el-form-item>
          <el-form-item v-if="activeTab === 'approved'">
            <el-select v-model="queryParams.approvalStatus" placeholder="审批状态" clearable style="width: 150px;">
              <el-option label="通过" value=1 />
              <el-option label="不通过" value=2 />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="queryParams.authorName"
              placeholder="请输入作者姓名"
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

        <el-form :model="queryParams" ref="queryRef" :inline="true" class="advanced-search-form" v-if="showAdvancedSearch">
          <el-form-item label="提交时间">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 300px;"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="articleList" style="width: 100%;">
          <el-table-column prop="title" label="内容标题" min-width="200" show-overflow-tooltip>
            <template #default="scope">
              <el-link type="primary" :underline="false" @click="handleView(scope.row)">{{ scope.row.title }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="authorName" label="作者姓名" width="120" align="center" />
          <el-table-column prop="createTime" label="提交时间" width="180" align="center" />
          <el-table-column prop="approvalStatus" label="审批状态" width="120" align="center">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.approvalStatus)">
                {{ getStatusText(scope.row.approvalStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="approver" label="审批人" width="120" align="center" />
          <el-table-column prop="approvalTime" label="审批时间" width="180" align="center" />
          <el-table-column prop="approvalComments" label="审批意见" min-width="150" align="center" />
          <el-table-column label="操作" width="300" align="center" fixed="right">
            <template #default="scope">
              <el-button link type="primary" size="middle" @click="handleView(scope.row)">查看</el-button>
              <el-button link type="success" size="middle" @click="handleApprove(scope.row)" v-if="activeTab === 'pending' && scope.row.approvalStatus === 1">通过</el-button>
              <el-button link type="danger" size="middle" @click="handleReject(scope.row)" v-if="activeTab === 'pending' && scope.row.approvalStatus === 2">不通过</el-button>
              <el-button link type="primary" size="middle" @click="handleApproveAction(scope.row)" v-if="scope.row.approvalStatus === 0">审批</el-button>
              <el-button link type="primary" size="middle" @click="handleAttachments(scope.row)">附件</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </div>
    </div>

    <el-dialog
      v-model="viewDialogVisible"
      title="稿件详情"
      width="70%"
      :close-on-click-modal="false"
    >
      <div class="article-detail">
        <div class="detail-header">
          <div class="header-left">
            <h2 class="article-title">{{ currentArticle.title }}</h2>
            <div class="article-meta">
              <span>作者：{{ currentArticle.authorName }}</span>
              <span>提交时间：{{ currentArticle.createTime }}</span>
              <el-tag :type="getStatusTagType(currentArticle.approvalStatus)">
                {{ getStatusText(currentArticle.approvalStatus) }}
              </el-tag>
            </div>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="handleExport">导出</el-button>
          </div>
        </div>
        <!-- 栏花预览 -->
        <div v-if="currentArticle.columnOrnamentUrl" class="flower-preview">
          <h4 class="flower-title">栏花：</h4>
          <img :src="currentArticle.columnOrnamentUrl" alt="栏花" class="flower-image">
        </div>
        <div class="article-content" v-html="currentArticle.content"></div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button type="success" @click="handleApprove(currentArticle)" v-if="currentArticle.approvalStatus === 0">通过</el-button>
        <el-button type="danger" @click="handleReject(currentArticle)" v-if="currentArticle.approvalStatus === 0">不通过</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="approveDialogVisible"
      title="审批操作"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.approvalStatus">
            <el-radio :label="1">通过</el-radio>
            <el-radio :label="2">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" v-if="approveForm.approvalStatus === 2">
          <el-input
            v-model="approveForm.approvalComments"
            type="textarea"
            :rows="4"
            placeholder="请输入不通过的原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, useSSRContext } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowUp, Clock, CircleCheck } from '@element-plus/icons-vue'
import { listArticle, getArticle, updateArticle, exportHtmlToWord, approvalArticle} from "@/api/xcsc/article"
import { downloadFile } from "@/api/xcsc/uploadFile"
import useUserStore from '@/store/modules/user'
import { parseTime } from '@/utils/common'

const userStore = useUserStore()
const activeTab = ref('pending')
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: '',
  approvalStatus: '',
  authorName: '',
  startTime: '',
  endTime: ''
})

const dateRange = ref([])
const showAdvancedSearch = ref(false)
const articleList = ref([])
const loading = ref(false)
const total = ref(0)
const pendingCount = ref(0)

const viewDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const currentArticle = ref({})
const approveForm = reactive({
  id: null,
  approvalStatus: '',
  approvalComments: ''
})

const pageTitle = computed(() => {
  return activeTab.value === 'pending' ? '待审批稿件' : '已审批稿件'
})

const handleTabChange = (tab) => {
  activeTab.value = tab
  queryParams.pageNum = 1
  if (tab === 'pending') {
    queryParams.approvalStatus = 0
  } else {
    queryParams.approvalStatus = ''
  }
  getList()
}

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

const getStatusText = (status) => {
  switch (status) {
    case 1:
      return '通过'
    case 2:
      return '不通过'
    case 0:
      return '待审批'
    default:
      return '未知'
  }
}

const getList = async () => {
  loading.value = true
  try {
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.startTime = dateRange.value[0] + ' 00:00:00'
      queryParams.endTime = dateRange.value[1] + ' 23:59:59'
    } else {
      queryParams.startTime = ''
      queryParams.endTime = ''
    }
    
    if (activeTab.value === 'pending') {
      queryParams.approvalStatus = 0
    } else if (activeTab.value === 'approved') {
      queryParams.approvalStatus = ''
    }
    
    const response = await listArticle(queryParams)
    let filteredList = response.rows || []
    
    if (activeTab.value === 'approved') {
      filteredList = filteredList.filter(item => item.approvalStatus === 1 || item.approvalStatus === 2)
    }
    
    articleList.value = filteredList
    total.value = activeTab.value === 'approved' ? filteredList.length : (response.total || 0)
    
    if (activeTab.value === 'pending') {
      pendingCount.value = total.value
    } else {
      const pendingResponse = await listArticle({ ...queryParams, approvalStatus: 0, pageNum: 1, pageSize: 1 })
      pendingCount.value = pendingResponse.total || 0
    }
  } catch (error) {
    ElMessage.error('获取稿件列表失败')
    console.error('获取稿件列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  Object.assign(queryParams, {
    title: '',
    approvalStatus: '',
    authorName: '',
    startTime: '',
    endTime: ''
  })
  dateRange.value = []
  handleQuery()
}

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

const handleApproveAction = (row) => {
  approveForm.id = row.id
  approveForm.approvalStatus = 1
  approveForm.approvalComments = ''
  approveDialogVisible.value = true
}

const handleApprove = (row) => {
  approveForm.id = row.id
  approveForm.approvalStatus = 1
  approveForm.approvalComments = ''
  approveDialogVisible.value = true
}

const handleReject = (row) => {
  approveForm.id = row.id
  approveForm.approvalStatus = 2
  approveForm.approvalComments = ''
  approveDialogVisible.value = true
}

// 处理附件按钮点击事件 - 直接下载附件
const handleAttachments = async (row) => {
  try {
    // 直接从row中获取附件URL，避免重复请求
    const attachmentUrl = row.attachmentUrl
    
    // 检查是否有附件
    if (!attachmentUrl || attachmentUrl.length === 0) {
      ElMessage.info('无附件')
      return
    }
    
    // 直接下载附件
    const a = document.createElement('a')
    a.href = attachmentUrl
    a.download = row.title ? `${row.title}_attachment` : 'attachment'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    ElMessage.success('下载开始')
  } catch (error) {
    ElMessage.error('下载附件失败')
    console.error('下载附件失败:', error)
  }
}

const confirmApprove = async () => {
  if (approveForm.approvalStatus === 2 && !approveForm.approvalComments.trim()) {
    ElMessage.warning('请输入不通过的原因')
    return
  }

  try {
    const updateData = {
      id: approveForm.id,
      approvalStatus: approveForm.approvalStatus,
      approvalComments: approveForm.approvalComments,
      approvalTime: parseTime(new Date()),
      approver: userStore.name
    }
    await approvalArticle(updateData)
    ElMessage.success(approveForm.approvalStatus === 1 ? '审批通过' : '审批不通过')
    approveDialogVisible.value = false
    viewDialogVisible.value = false
    getList()
  } catch (error) {
    ElMessage.error('审批操作失败')
    console.error('审批操作失败:', error)
  }
}

// 导出功能
const handleExport = async () => {
  if (!currentArticle.value || !currentArticle.value.id) {
    ElMessage.warning('请选择要导出的稿件')
    return
  }
  
  try {
    const response = await exportHtmlToWord(currentArticle.value)
    
    // 处理文件流
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentArticle.value.title || 'article'}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('导出失败:', error)
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 0;
  background-color: #fff;
  min-height: calc(100vh - 60px);
}

.approval-layout {
  display: flex;
  min-height: calc(100vh - 60px);
}

.sidebar {
  width: 240px;
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-title {
  padding: 20px;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-menu {
  padding: 10px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s;
  position: relative;
}

.menu-item:hover {
  background-color: #e6f7ff;
  color: #1890ff;
}

.menu-item.active {
  background-color: #e6f7ff;
  color: #1890ff;
  font-weight: 500;
}

.menu-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

.menu-item span {
  flex: 1;
}

.badge {
  position: absolute;
  right: 20px;
}

.main-content {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.header-right {
  margin-left: 20px;
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

/* 栏花预览样式 */
.flower-preview {
  /* margin: 20px 0; */
  /* padding: 15px; */
  /* background-color: #f5f7fa; */
  border-radius: 4px;
}

.flower-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  /* margin-bottom: 10px; */
}

.flower-image {
  max-width: 400px;
  max-height: 300px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
