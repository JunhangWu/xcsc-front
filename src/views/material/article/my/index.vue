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
      <el-form-item label="复审人（部门负责人）">
        <el-input
          v-model="queryParams.reviewer"
          placeholder="请输入复审人"
          clearable
          style="width: 200px;"
        />
      </el-form-item>
      <el-form-item label="终审人（分管领导）">
        <el-input
          v-model="queryParams.finalReviewer"
          placeholder="请输入终审人"
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
      <el-table-column label="复审人（部门负责人）" width="170" align="center">
        <template #default="scope">
          {{ scope.row.reviewer || scope.row.approver || '--' }}
        </template>
      </el-table-column>
      <el-table-column label="终审人（分管领导）" width="170" align="center">
        <template #default="scope">
          {{ scope.row.finalReviewer || '--' }}
        </template>
      </el-table-column>
      <!-- 审核凭证 -->
      <el-table-column label="审核凭证" width="120" align="center">
        <template #default="scope">
          <el-button v-if="scope.row.auditVoucherUrl" link type="primary" size="middle" @click="handleAuditVoucherPreview(scope.row.auditVoucherUrl)">在线预览</el-button>
          <span v-else>--</span>
        </template>
      </el-table-column>
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
              <span>复审人：{{ currentArticle.reviewer || currentArticle.approver || '--' }}</span>
              <span>终审人：{{ currentArticle.finalReviewer || '--' }}</span>
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
          <img :src="getProxyPath(currentArticle.columnOrnamentUrl)" alt="封面图" class="flower-image">
        </div>
        <!-- 正文内容或附件链接 -->
        <div v-if="currentArticle.content && currentArticle.content.replace(/<[^>]+>/g, '').trim()" class="article-content" v-html="currentArticle.content"></div>
        <div v-else-if="currentArticle.attachmentUrl" class="attachment-link-section">
          <h4 class="attachment-title">附件：</h4>
          <el-link type="primary" :underline="true" @click="handleAttachments(currentArticle)">{{ currentArticle.attachmentName || getAttachmentName(currentArticle.attachmentUrl) }}</el-link>
        </div>
        <div v-else class="empty-content">
          <p>暂无正文内容</p>
        </div>
        <div v-if="currentArticle.auditVoucherUrl" class="attachment-link-section">
          <h4 class="attachment-title">审核凭证：</h4>
          <el-link type="primary" :underline="true" @click="handleAuditVoucherPreview(currentArticle.auditVoucherUrl)">
            {{ currentArticle.auditVoucherName || getAttachmentName(currentArticle.auditVoucherUrl) }}
          </el-link>
        </div>
        <div v-if="resolveBatchImageUrls(currentArticle).length" class="flower-preview">
          <h4 class="flower-title">批量图片：</h4>
          <div class="batch-image-grid">
            <img v-for="(url, idx) in resolveBatchImageUrls(currentArticle)" :key="`${url}-${idx}`" :src="getProxyPath(url)" class="flower-image" alt="批量图片">
          </div>
        </div>
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
        <el-form-item label="复审人：">
          <el-input
            v-model="editArticleForm.reviewer"
            placeholder="请输入复审人（部门负责人）"
            maxlength="30"
            style="width: 100%;"
            show-word-limit
            clearable
          />
        </el-form-item>
        <el-form-item label="终审人：">
          <el-input
            v-model="editArticleForm.finalReviewer"
            placeholder="请输入终审人（分管领导）"
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
        <el-form-item label="审核凭证：">
          <el-upload
            v-model:file-list="auditVoucherList"
            class="upload-demo attachment-upload"
            drag
            :multiple="false"
            action=""
            accept=".pdf,.jpg,.jpeg,.png"
            :on-change="handleAuditVoucherChange"
            :on-remove="handleAuditVoucherRemove"
            :auto-upload="false"
            :limit="1"
          >
            <div v-if="!auditVoucherList.length" class="upload-tips">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                点击或拖拽文件到此处上传
                <div class="el-upload__tip"> 支持文件格式：pdf / jpg / jpeg / png</div>
              </div>
            </div>
            <div v-else class="attachment-info">
              <el-icon class="el-icon-document"><document /></el-icon>
              <span class="file-name">{{ auditVoucherList[0].name }}</span>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="批量图片：">
          <el-upload
            v-model:file-list="batchImageList"
            class="upload-demo attachment-upload"
            drag
            :multiple="true"
            action=""
            accept=".jpg,.jpeg,.png"
            :on-change="handleBatchImageChange"
            :on-remove="handleBatchImageRemove"
            :auto-upload="false"
          >
            <div v-if="!batchImageList.length" class="upload-tips">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                点击或拖拽文件到此处上传
                <div class="el-upload__tip"> 支持批量上传图片：jpeg / jpg / png</div>
              </div>
            </div>
            <div v-else class="attachment-info">
              <el-icon class="el-icon-document"><document /></el-icon>
              <span class="file-name">已选择 {{ batchImageList.length }} 张图片</span>
            </div>
          </el-upload>
          <div v-if="batchImageList.length > 0" class="batch-image-preview-grid">
            <div v-for="img in batchImageList" :key="img.uid" class="batch-image-card">
              <img :src="getBatchImagePreviewUrl(img)" alt="正文图片" class="batch-preview-img">
              <el-button size="small" type="danger" text @click="handleBatchImageRemove(img, batchImageList.filter(item => item.uid !== img.uid))">删除</el-button>
            </div>
          </div>
          <div v-if="batchImageList.length > 0" class="upload-actions">
            <el-button
              type="primary"
              @click="handleBatchImageUpload"
              :loading="uploadingImages"
              :disabled="!(editArticleForm.title || '').trim() || !hasPendingBatchImages()"
            >
              {{ uploadingImages ? '上传中...' : hasPendingBatchImages() ? '上传' : '已上传' }}
            </el-button>
            <div v-if="uploadingImages" class="upload-progress-info">
              <el-progress :percentage="uploadProgress" :stroke-width="8"></el-progress>
              <div class="upload-speed">上传速度: {{ uploadSpeed }}</div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit" :loading="editLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览组件 -->
    <el-image-viewer
      v-if="imageViewerVisible"
      :url-list="[previewImageUrl]"
      @close="imageViewerVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue'
import { listArticle, getArticle, updateArticle, exportHtmlToWord} from "@/api/xcsc/article"
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { getToken } from "@/utils/auth"
import { openPdfPreview } from '@/utils/filePreview'
import { uploadFileWithChunk } from '@/utils/chunkUpload'
import { getFolderList, getFolderListWithoutPremission, addFolder, delFile, getFileList } from '@/api/xcsc/uploadFile'
import useUserStore from '@/store/modules/user'
import { parseTime } from '@/utils/common'
import { normalizeEditorHtmlImageSrcToAbsolute } from '@/utils/richText'

const getProxyPath = (url) => {
  if (!url) return ''
  const u = new URL(url)
  const parts = u.pathname.replace(/^\/+/, '').split('/')
  const bucket = parts.shift()
  const objectKey = parts.join('/')
// 自动获取当前环境的 API 前缀（例如 /dev-api）
  const baseApi = import.meta.env.VITE_APP_BASE_API || ''
  const params = new URLSearchParams({
    bucketName: bucket,
    filePath: objectKey
  })
  return `${baseApi}/minio/proxy?${params.toString()}`
}

const resolveEditorUploadUrl = (res) => {
  const data = res?.data
  if (typeof data === 'string') return data
  if (Array.isArray(data)) {
    if (typeof data[0] === 'string') return data[0]
    if (data[0] && typeof data[0] === 'object') {
      return data[0].url || data[0].src || data[0].path || ''
    }
  }
  if (data && typeof data === 'object') {
    return data.url || data.src || data.path || ''
  }
  return res?.url || res?.src || res?.path || ''
}

// 搜索参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: '',
  approvalStatus: '',
  approver: '',
  reviewer: '',
  finalReviewer: '',
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
const auditVoucherList = ref([]) // 审核凭证文件列表
const batchImageList = ref([]) // 批量图片文件列表
const uploadingImages = ref(false)
const uploadProgress = ref(0)
const uploadSpeed = ref('0 B/s')
const uploadedImageUrls = ref([])
const imagesUploaded = ref(false)
const articleFolderId = ref(null)
const userStore = useUserStore()

// 图片预览相关
const imageViewerVisible = ref(false)
const previewImageUrl = ref('')

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
      customInsert(res, insertFn) {
        const rawUrl = resolveEditorUploadUrl(res)
        const proxyUrl = getProxyPath(rawUrl)
        if (!proxyUrl) return
        insertFn(proxyUrl, '', '')
      },
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

const handleAuditVoucherChange = (file, fileLists) => {
  const isAllowedType = file.raw && [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf'
  ].includes(file.raw.type)
  const isAllowedExt = file.name && /\.(doc|docx|pdf)$/i.test(file.name)

  if (!isAllowedType || !isAllowedExt) {
    ElMessage.error('仅支持doc、docx、pdf格式的文件')
    auditVoucherList.value = fileLists.filter(f => {
      const typeValid = f.raw && [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
      ].includes(f.raw.type)
      const extValid = f.name && /\.(doc|docx|pdf)$/i.test(f.name)
      return typeValid && extValid
    })
    return
  }

  if (fileLists.length > 1) {
    auditVoucherList.value = [file]
    ElMessage.info('审核凭证仅支持上传一个文件，已自动替换原有文件')
  }
}

const handleAuditVoucherRemove = (file, fileLists) => {
  auditVoucherList.value = fileLists
}

const handleBatchImageChange = (file, fileLists) => {
  const invalidFiles = fileLists.filter(f => {
    if (!f.raw) return false
    const isImage = ['image/jpeg', 'image/jpg', 'image/png'].includes(f.raw.type)
    const isAllowedExt = f.name && /\.(jpg|jpeg|png)$/i.test(f.name)
    return !(isImage && isAllowedExt)
  })
  if (invalidFiles.length > 0) {
    ElMessage.error('批量图片仅支持jpg、jpeg、png格式')
    batchImageList.value = fileLists.filter(f => {
      if (!f.raw) return true
      const isImage = ['image/jpeg', 'image/jpg', 'image/png'].includes(f.raw.type)
      const isAllowedExt = f.name && /\.(jpg|jpeg|png)$/i.test(f.name)
      return isImage && isAllowedExt
    })
    return
  }
  batchImageList.value = fileLists
  imagesUploaded.value = !hasPendingBatchImages()
}

const hasPendingBatchImages = () => batchImageList.value.some(item => item.raw && !item.fileHash)

const getFileHashFromUrl = (url = '') => {
  if (!url) return ''
  try {
    const pureUrl = url.split('?')[0]
    const name = decodeURIComponent(pureUrl.substring(pureUrl.lastIndexOf('/') + 1))
    return name.split('.')[0] || ''
  } catch (error) {
    return ''
  }
}

const syncUploadedImageUrls = () => {
  uploadedImageUrls.value = batchImageList.value
    .map(item => item.fileHash || getFileHashFromUrl(item.url))
    .filter(Boolean)
}

const getBatchImagePreviewUrl = (file) => file.url || (file.raw ? URL.createObjectURL(file.raw) : '')

const isImageFile = (file = {}) => {
  const fileName = (file.fileName || file.name || file.minioPath || '').toLowerCase()
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName)
}

const deleteBatchImageFromServer = async (file) => {
  const fileId = file?.id || file?.bizId || file?.fileId || file?.fileHash || getFileHashFromUrl(file?.url)
  if (!fileId) {
    throw new Error('未获取到可删除的文件标识')
  }
  await delFile(fileId)
}

const handleBatchImageRemove = async (file, fileLists) => {
  const isLocalOnly = !!file.raw && !file.fileHash && (!file.url || file.url.startsWith('blob:'))
  if (!isLocalOnly) {
    try {
      await deleteBatchImageFromServer(file)
      ElMessage.success('批量图片删除成功')
    } catch (error) {
      batchImageList.value = [...fileLists, file]
      ElMessage.error('批量图片删除失败')
      return
    }
  }
  batchImageList.value = fileLists
  syncUploadedImageUrls()
  imagesUploaded.value = batchImageList.value.length > 0 && batchImageList.value.every(item => !item.raw || !!item.fileHash)
}

const formatSpeed = (speedBps) => {
  if (!Number.isFinite(speedBps) || speedBps <= 0) return '0 B/s'
  if (speedBps < 1024) return `${speedBps.toFixed(2)} B/s`
  if (speedBps < 1024 * 1024) return `${(speedBps / 1024).toFixed(2)} KB/s`
  return `${(speedBps / (1024 * 1024)).toFixed(2)} MB/s`
}

async function getOrCreateArticleFolder(articleTitle) {
  const deptId = userStore.deptId
  if (!deptId) {
    throw new Error('无法获取部门信息')
  }

  const companyRes = await getFolderList({
    pid: 0,
    companyId: deptId
  })
  const companyFolder = (companyRes?.data || [])[0]
  if (!companyFolder) {
    throw new Error('未找到公司文件夹')
  }

  const myDraftRes = await getFolderListWithoutPremission({
    companyId: deptId,
    filePath: '我的稿件'
  })
  const myDraftFolder = (myDraftRes?.data || [])[0]
  const myDraftPid = myDraftFolder?.bizId
  if (!myDraftPid) {
    throw new Error('未找到“我的稿件”文件夹')
  }

  let articleFolder = (await getFolderList({
    pid: myDraftPid,
    filePath: articleTitle
  }))?.data?.[0]

  if (!articleFolder) {
    await addFolder({
      filePath: articleTitle,
      pid: myDraftPid
    })
    articleFolder = (await getFolderList({
      pid: myDraftPid,
      filePath: articleTitle
    }))?.data?.[0]
  }

  const folderId = articleFolder?.bizId
  if (!folderId) {
    throw new Error('创建文章文件夹失败')
  }

  return {
    folderId,
    folderPath: `${companyFolder.filePath}/我的稿件/${articleTitle}`
  }
}

async function getArticleFolderByTitle(articleTitle) {
  const deptId = userStore.deptId
  if (!deptId) {
    throw new Error('无法获取部门信息')
  }

  const companyRes = await getFolderList({
    pid: 0,
    companyId: deptId
  })
  const companyFolder = (companyRes?.data || [])[0]
  if (!companyFolder) {
    throw new Error('未找到公司文件夹')
  }

  const myDraftRes = await getFolderListWithoutPremission({
    companyId: deptId,
    filePath: '我的稿件'
  })
  const myDraftFolder = (myDraftRes?.data || [])[0]
  const myDraftPid = myDraftFolder?.bizId
  if (!myDraftPid) {
    throw new Error('未找到“我的稿件”文件夹')
  }

  const articleFolder = (await getFolderList({
    pid: myDraftPid,
    filePath: articleTitle
  }))?.data?.[0]

  if (!articleFolder?.bizId) {
    return null
  }

  return {
    folderId: articleFolder.bizId,
    folderPath: `${companyFolder.filePath}/我的稿件/${articleTitle}`
  }
}

async function loadBatchImagesFromArticleFolder(articleTitle) {
  const title = (articleTitle || '').trim()
  if (!title) return []

  const folderInfo = await getArticleFolderByTitle(title)
  if (!folderInfo?.folderId) return []

  const res = await getFileList({ folderId: folderInfo.folderId })
  const files = res?.data || []
  articleFolderId.value = folderInfo.folderId

  return files
    .filter(isImageFile)
    .map((item, index) => {
      const url = item.minioPath || item.url || ''
      return {
        id: item.id,
        bizId: item.bizId,
        fileId: item.id,
        name: item.fileName || `batch-image-${index + 1}.jpg`,
        url,
        uid: `existing-folder-batch-${item.id || index}`,
        fileHash: getFileHashFromUrl(url)
      }
    })
}

async function handleBatchImageUpload() {
  if (batchImageList.value.length === 0) return
  const title = (editArticleForm.value.title || '').trim()
  if (!title) {
    ElMessage.warning('请先输入文章标题')
    return
  }

  const pendingFiles = batchImageList.value.filter(item => item.raw && !item.fileHash)
  if (pendingFiles.length === 0) {
    ElMessage.info('没有待上传的正文图片')
    return
  }

  uploadingImages.value = true
  uploadProgress.value = 0
  uploadSpeed.value = '0 B/s'

  try {
    const { folderId, folderPath } = await getOrCreateArticleFolder(title)
    articleFolderId.value = folderId

    let totalUploadedBytes = 0
    const totalBytes = pendingFiles.reduce((sum, item) => sum + (item.raw?.size || 0), 0)
    const startTime = Date.now()

    for (const item of pendingFiles) {
      const file = item.raw
      if (!file) continue
      const baseUploadedBytes = totalUploadedBytes
      const result = await uploadFileWithChunk(file, folderId, folderPath, {
        onProgress: (progress) => {
          const currentFileUploaded = (file.size * progress) / 100
          const mergedUploaded = baseUploadedBytes + currentFileUploaded
          const percent = totalBytes > 0 ? Math.round((mergedUploaded / totalBytes) * 100) : 0
          uploadProgress.value = Math.min(percent, 100)
          const elapsedSeconds = (Date.now() - startTime) / 1000
          if (elapsedSeconds > 0) {
            uploadSpeed.value = formatSpeed(mergedUploaded / elapsedSeconds)
          }
        },
        fileLastModified: parseTime(file.lastModifiedDate || new Date(file.lastModified)),
        contentType: file.type
      })

      if (!result.success) {
        throw new Error(`图片 ${file.name} 上传失败`)
      }

      item.fileHash = result.fileHash
      totalUploadedBytes += file.size
    }

    syncUploadedImageUrls()
    imagesUploaded.value = true
    ElMessage.success('正文图片上传完成')
  } catch (error) {
    ElMessage.error('正文图片上传失败: ' + (error?.message || '未知错误'))
  } finally {
    uploadingImages.value = false
  }
}

const resolveBatchImageUrls = (article) => {
  const urls = article?.batchImageUrls
  if (!urls) return []
  if (Array.isArray(urls)) return urls.filter(Boolean)
  if (typeof urls === 'string') return urls.split(',').map(item => item.trim()).filter(Boolean)
  return []
}

const downloadByUrl = (url, fileName = 'download') => {
  if (!url) {
    ElMessage.info('无可下载文件')
    return
  }
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 处理审核凭证预览
const handleAuditVoucherPreview = (url) => {
  if (!url) {
    ElMessage.info('无预览文件')
    return
  }
  
  // 获取文件扩展名
  const ext = url.split('.').pop().toLowerCase()
  
  // 图片类型
  if (['jpg', 'jpeg', 'png'].includes(ext)) {
    previewImageUrl.value = getProxyPath(url)
    imageViewerVisible.value = true
  } 
  // PDF类型
  else if (ext === 'pdf') {
    openPdfPreview(getProxyPath(url))
  } 
  // 其他类型
  else {
    ElMessage.info('不支持的文件类型')
  }
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

// 从附件URL中提取文件名
const getAttachmentName = (url) => {
  if (!url) return '附件'
  try {
    // 从URL中提取文件名
    const parts = url.split('/')
    const fileName = parts[parts.length - 1]
    // 解码URL编码的文件名
    return decodeURIComponent(fileName)
  } catch (error) {
    console.error('提取附件名失败:', error)
    return '附件'
  }
}

const getFileNameFromUrl = (url, fallbackName = 'file') => {
  if (!url) return fallbackName
  try {
    const pureUrl = url.split('?')[0]
    const encodedName = pureUrl.substring(pureUrl.lastIndexOf('/') + 1)
    return decodeURIComponent(encodedName) || fallbackName
  } catch (error) {
    return fallbackName
  }
}

const fileFromUrl = async (url, fallbackName = 'file') => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载文件失败: ${response.status}`)
  }
  const blob = await response.blob()
  const fileName = getFileNameFromUrl(url, fallbackName)
  return new File([blob], fileName, {
    type: blob.type || 'application/octet-stream'
  })
}

// 查询数据
const getList = async () => {
  loading.value = true
  try {
    queryParams.approver = queryParams.reviewer
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
    reviewer: '',
    finalReviewer: '',
    authorName: ''
  })
  handleQuery()
}

// 重新编辑
const handleReedit = async (row) => {
  try {
    const response = await getArticle(row.id)
    editArticleForm.value = { ...response.data }
    articleFolderId.value = null
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
    if (editArticleForm.value.auditVoucherUrl) {
      auditVoucherList.value = [{
        name: editArticleForm.value.auditVoucherName || 'audit-voucher',
        url: editArticleForm.value.auditVoucherUrl,
        uid: 'existing-audit-voucher'
      }]
    } else {
      auditVoucherList.value = []
    }
    const folderBatchImages = await loadBatchImagesFromArticleFolder(editArticleForm.value.title)
    if (folderBatchImages.length > 0) {
      batchImageList.value = folderBatchImages
    } else {
      const batchUrls = resolveBatchImageUrls(editArticleForm.value)
      batchImageList.value = batchUrls.map((url, index) => ({
        name: `batch-image-${index + 1}.jpg`,
        url,
        uid: `existing-batch-${index}`,
        fileHash: getFileHashFromUrl(url)
      }))
    }
    syncUploadedImageUrls()
    imagesUploaded.value = batchImageList.value.length > 0
    uploadProgress.value = 0
    uploadSpeed.value = '0 B/s'
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
    const hasPendingBatchImages = batchImageList.value.some(item => item.raw && !item.fileHash)
    if (hasPendingBatchImages) {
      ElMessage.warning('您有正文图片未上传，请先点击“上传”')
      return
    }
    await editFormRef.value.validate()
    editLoading.value = true

    const formData = new FormData()
    // 把所有字段都 append 到 FormData 里
    formData.append('id', editArticleForm.value.id)
    formData.append('title', editArticleForm.value.title)
    formData.append('authorName', editArticleForm.value.authorName)
    formData.append('reviewer', editArticleForm.value.reviewer || '')
    formData.append('finalReviewer', editArticleForm.value.finalReviewer || '')
    const normalizedContent = normalizeEditorHtmlImageSrcToAbsolute(editArticleForm.value.content)
    formData.append('content', normalizedContent)
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
    if (auditVoucherList.value.length > 0 && auditVoucherList.value[0].raw) {
      formData.append('auditVoucher', auditVoucherList.value[0].raw)
    } else if (auditVoucherList.value.length > 0 && auditVoucherList.value[0].url) {
      try {
        const auditVoucherFile = await fileFromUrl(auditVoucherList.value[0].url, auditVoucherList.value[0].name || 'audit-voucher')
        formData.append('auditVoucher', auditVoucherFile)
      } catch (error) {
        ElMessage.error('审核凭证处理失败，请重新上传审核凭证后再保存')
        editLoading.value = false
        return
      }
    } else {
      ElMessage.warning('请上传审核凭证')
      editLoading.value = false
      return
    }
    if (uploadedImageUrls.value.length > 0) {
      uploadedImageUrls.value.forEach((url, index) => {
        formData.append(`imageUrls[${index}]`, url)
      })
    }
    if (articleFolderId.value) {
      formData.append('folderId', articleFolderId.value)
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

.batch-image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

.batch-image-preview-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.batch-image-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background-color: #fff;
}

.batch-preview-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
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

.upload-actions {
  width: 100%;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-progress-info {
  width: 100%;
}

.upload-speed {
  margin-top: 6px;
  color: #606266;
  font-size: 12px;
}

.header-left {
  flex: 1;
}

.header-right {
  margin-left: 20px;
}

/* 附件链接部分样式 */
.attachment-link-section {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.attachment-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

/* 空内容部分样式 */
.empty-content {
  margin: 20px 0;
  padding: 40px;
  background-color: #f9f9f9;
  border-radius: 4px;
  text-align: center;
  color: #909399;
}
</style>
