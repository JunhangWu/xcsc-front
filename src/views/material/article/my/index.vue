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
      <el-form-item label="审批状态">
        <el-select v-model="queryParams.approvalStatus" placeholder="请选择" clearable style="width: 150px;">
          <el-option label="通过" value=1 />
          <el-option label="不通过" value=2 />
          <el-option label="待审核" value=0 />
        </el-select>
      </el-form-item>
      <el-form-item label="核稿人">
        <el-input
          v-model="queryParams.approver"
          placeholder="请输入核稿人"
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
      <!-- 核稿人 -->
      <el-table-column prop="approver" label="核稿人" width="120" align="center" />
      <!-- 审核状态 -->
      <el-table-column prop="approvalStatus" label="审批状态" width="180" align="center">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.approvalStatus)">
            {{ scope.row.approvalStatus === 1 ? '通过' : scope.row.approvalStatus === 2 ? '不通过' : '待审批' }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- 审批时间 -->
      <el-table-column prop="approvalTime" label="审批时间" width="180" align="center" />
      <!-- 审批意见 -->
      <el-table-column prop="approvalComment" label="审批意见" width="180" align="center" />
      <!-- 作者姓名 -->
      <el-table-column prop="authorName" label="作者姓名" width="180" align="center" />
      <!-- 操作列 -->
      <el-table-column label="操作" width="280" align="center" fixed="right">
        <template #default="scope">
          <el-button link type="primary" size="middle" @click="handleReedit(scope.row)" :disabled="scope.row.approvalStatus !== 0">重新编辑</el-button>
          <el-button link type="primary" size="middle" @click="handleView(scope.row)">查看</el-button>
          <el-button link type="primary" size="middle" @click="handleAttachments(scope.row)">附件</el-button>
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
          <h4 class="flower-title">封面图：</h4>
          <img :src="currentArticle.columnOrnamentUrl" alt="封面图" class="flower-image">
        </div>
        <div class="article-content" v-html="currentArticle.content"></div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <!-- <el-button type="success" @click="handleApprove(currentArticle)" v-if="currentArticle.approvalStatus === 0">通过</el-button>
        <el-button type="danger" @click="handleReject(currentArticle)" v-if="currentArticle.approvalStatus === 0">不通过</el-button> -->
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="重新编辑稿件"
      width="70%"
      :close-on-click-modal="false"
    >
      <el-form :model="editArticleForm" ref="editFormRef" label-width="80px" class="edit-form">
        <el-form-item label="标题：" required>
          <el-input
            v-model="editArticleForm.title"
            placeholder="请输入标题"
            maxlength="100"
            style="width: 100%;"
            show-word-limit
            clearable
          />
        </el-form-item>
        <el-form-item label="作者：">
          <el-input
            v-model="editArticleForm.authorName"
            placeholder="请输入作者姓名"
            maxlength="30"
            style="width: 100%;"
            show-word-limit
            clearable
          />
        </el-form-item>
        <el-form-item label="正文：" required>
          <div style="border: 1px solid #ccc; border-radius: 4px;">
            <Toolbar
              style="border-bottom: 1px solid #ccc; padding: 6px 10px"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              :mode="mode"
            />
            <Editor
              style="height: 500px; overflow-y: auto;"
              v-model="editArticleForm.content"
              :defaultConfig="editorConfig"
              :mode="mode"
              @onCreated="handleEditorCreated"
            />
          </div>
        </el-form-item>
        <!-- 栏花上传 -->
        <el-form-item label="封面图：">
          <el-upload 
            v-model:file-list="fileList" 
            class="upload-demo flower-upload" 
            drag 
            :multiple="false"  
            action=""
            accept=".jpg,.jpeg,.png"
            :on-change="handleFileChange" 
            :on-remove="handleFileRemove" 
            :auto-upload="false"
            :limit="1"  
          >
            <!-- 未上传时显示上传提示 -->
            <div v-if="!fileList.length" class="upload-tips">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                点击或拖拽文件到此处上传
                <div class="el-upload__tip"> 支持图片格式：jpeg / jpg / png</div>
              </div>
            </div>
            <!-- 已上传时显示图片预览 -->
            <div v-else class="flower-preview">
              <img :src="fileList[0].url || URL.createObjectURL(fileList[0].raw)" alt="栏花预览" class="preview-img">
            </div>
          </el-upload>
        </el-form-item>
        <!-- 附件上传 -->
        <el-form-item label="附件：">
          <el-upload 
            v-model:file-list="attachmentList" 
            class="upload-demo attachment-upload" 
            drag 
            :multiple="false"  
            action=""
            accept=".doc,.docx"
            :on-change="handleAttachmentChange" 
            :on-remove="handleAttachmentRemove" 
            :auto-upload="false"
            :limit="1"  
          >
            <!-- 未上传时显示上传提示 -->
            <div v-if="!attachmentList.length" class="upload-tips">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                点击或拖拽文件到此处上传
                <div class="el-upload__tip"> 可上传新闻稿件附件，支持文档格式：doc / docx</div>
              </div>
            </div>
            <!-- 已上传时显示文件信息 -->
            <div v-else class="attachment-info">
              <el-icon class="el-icon-document"><document /></el-icon>
              <span class="file-name">{{ attachmentList[0].name }}</span>
              <!-- <span class="file-size">({{ formatFileSize(attachmentList[0].size) }})</span> -->
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit" :loading="editLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue'
import { addArticle, listArticle, getArticle, updateArticle, exportHtmlToWord} from "@/api/xcsc/article"
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { getToken } from "@/utils/auth"

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
// 编辑弹窗
const editDialogVisible = ref(false)
const editArticleForm = ref({})
const editLoading = ref(false)
const editFormRef = ref(null)
const fileList = ref([]) // 栏花文件列表
const attachmentList = ref([]) // 附件文件列表

// 富文本编辑器配置
const editorRef = shallowRef()
const mode = ref('default')

// 工具栏配置：排除不需要的功能
const toolbarConfig = {
  excludeKeys: [
    'insertTable', 'deleteTable', 'insertVideo', 'codeBlock','uploadVideo',
    'insertFormula', 'fullScreen', 'divider', 'emotion','insertLink','todo'
  ]
}

// 编辑器配置
const editorConfig = {
  placeholder: '请输入文章正文内容...',
  pasteFilterStyle: false,
  pasteIgnoreImg: false,
  uploadImgByBlob: true,
  MENU_CONF: {
    uploadImage: {
      server: import.meta.env.VITE_APP_BASE_API + '/article/uploadImage',
      // server: '/inspection-api/article/uploadImage',
      fieldName: 'file',
      maxFileSize: 200 * 1024 * 1024,
      allowedFileTypes: ['image/jpg', 'image/png', 'image/jpeg'],
      headers: {
        Authorization: 'Bearer ' + getToken()
      },
      onBeforeUpload(file) { return file },
      onProgress(progress) { console.log('progress', progress) },
      onSuccess(file, res) { console.log(`${file.name} 上传成功`, res) },
      onFailed(file, res) { console.log(`${file.name} 上传失败`, res) },
      onError(file, err, res) { console.log(`${file.name} 上传出错`, err, res) },
    }
  }
}

// 编辑器创建成功后执行
const handleEditorCreated = (editor) => {
  editorRef.value = editor
  editor.disableXSS = true 
}

// 销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
})

// ========== 栏花上传/删除逻辑 ==========
// 文件选择/上传变化
const handleFileChange = (file, fileLists) => {
  // 限制只能上传一张，自动覆盖原有文件
  if (fileLists.length > 1) {
    fileList.value = [file] // 只保留最新选择的文件
    ElMessage.info('栏花仅支持上传一张图片，已自动替换原有文件')
  }
  // 生成预览URL
  if (file.raw) {
    file.url = URL.createObjectURL(file.raw)
  }
}

// 文件删除
const handleFileRemove = (file, fileLists) => {
  // 释放URL对象，避免内存泄漏
  if (file.url && !file.url.startsWith('http')) {
    URL.revokeObjectURL(file.url)
  }
  fileList.value = fileLists
  ElMessage.info('已删除栏花图片')
}

// ========== 附件上传/删除逻辑 ==========
// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + ' B'
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB'
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }
}

// 附件选择/上传变化
const handleAttachmentChange = (file, fileLists) => {
  // 验证文件类型
  const isDoc = file.raw && ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.raw.type)
  const isAllowedExt = file.name && /\.(doc|docx)$/i.test(file.name)
  
  if (!isDoc || !isAllowedExt) {
    ElMessage.error('仅支持doc、docx格式的文档')
    // 移除不合法的文件
    const validFiles = fileLists.filter(f => {
      const fIsDoc = f.raw && ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.raw.type)
      const fIsAllowedExt = f.name && /\.(doc|docx)$/i.test(f.name)
      return fIsDoc && fIsAllowedExt
    })
    attachmentList.value = validFiles
    return
  }
  
  // 限制只能上传一个附件
  if (fileLists.length > 1) {
    attachmentList.value = [file] // 只保留最新选择的文件
    ElMessage.info('附件仅支持上传一个文档，已自动替换原有文件')
  }
}

// 附件删除
const handleAttachmentRemove = (file, fileLists) => {
  attachmentList.value = fileLists
  ElMessage.info('已删除附件文档')
}


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
const handleReedit = async (row) => {
  try {
    const response = await getArticle(row.id)
    editArticleForm.value = { ...response.data }
    // 初始化栏花文件列表
    if (editArticleForm.value.columnOrnamentUrl) {
      fileList.value = [{
        name: 'column-ornament.jpg',
        url: editArticleForm.value.columnOrnamentUrl,
        uid: 'existing-ornament'
      }]
    } else {
      fileList.value = []
    }
    // 初始化附件文件列表
    if (editArticleForm.value.attachmentUrl) {
      attachmentList.value = [{
        name: editArticleForm.value.attachmentName || 'attachment.docx',
        url: editArticleForm.value.attachmentUrl,
        uid: 'existing-attachment'
      }]
    } else {
      attachmentList.value = []
    }
    editDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取稿件详情失败')
    console.error('获取稿件详情失败:', error)
  }
}

//保存编辑
const handleSaveEdit = async () => {
  try {
    if (!editArticleForm.value.title.trim()) {
      ElMessage.warning('请输入文章标题')
      return
    }
    if (!editArticleForm.value.content.replace(/<[^>]+>/g, '').trim()) {
      ElMessage.warning('请输入文章正文内容，不能为空')
      return
    }
    await editFormRef.value.validate()
    editLoading.value = true

    const formData = new FormData()
    // 把所有字段都 append 到 FormData 里
    formData.append('id', editArticleForm.value.id)
    formData.append('title', editArticleForm.value.title)
    formData.append('authorName', editArticleForm.value.authorName)
    formData.append('content', editArticleForm.value.content)
    // 有图片时才 append file
    if (fileList.value.length > 0 && fileList.value[0].raw) {
      formData.append('file', fileList.value[0].raw)
    }
    // 有附件时才 append attachment
    if (attachmentList.value.length > 0 && attachmentList.value[0].raw) {
      formData.append('attachment', attachmentList.value[0].raw)
    }
    else{
      formData.append('attachment', '')
    }

    await updateArticle(formData) // 统一传 FormData
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    getList()
  } catch (error) {
    if (error.message !== 'Validation failed') {
      ElMessage.error('保存失败')
      console.error('保存稿件失败:', error)
    }
  } finally {
    editLoading.value = false
  }
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

/* 编辑弹窗栏花预览样式 */
.preview-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 附件上传样式 */
.attachment-upload {
  width: 100%;
}

.attachment-info {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.attachment-info .el-icon-document {
  font-size: 24px;
  color: #409eff;
}

.file-name {
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.header-left {
  flex: 1;
}

.header-right {
  margin-left: 20px;
}
</style>