<template>
  <div class="article-submit-container">
    <div class="title-section">
      <h4 class="required-title">文章标题：</h4>
      <el-input
        v-model="articleTitle"
        placeholder="请输入文章标题，长度不超过100个字"
        maxlength="100"
        show-word-limit
        clearable
      />
      <el-button type="primary" size="middle" @click="handleClear">一键清除</el-button>
    </div>

    <div class="author-section">
      <h4 class="common-title">作者姓名：</h4>
      <el-input
        v-model="articleAuthor"
        placeholder="请输入作者姓名"
        maxlength="30"
        show-word-limit
        clearable
      />
    </div>

    <div class="author-section">
      <h4 class="common-title">复审人（部门负责人）：</h4>
      <el-input
        v-model="articleReviewer"
        placeholder="请输入复审人姓名"
        maxlength="30"
        show-word-limit
        clearable
      />
    </div>

    <div class="author-section">
      <h4 class="common-title">终审人（分管领导）：</h4>
      <el-input
        v-model="articleFinalReviewer"
        placeholder="请输入终审人姓名"
        maxlength="30"
        show-word-limit
        clearable
      />
    </div>
        <div class="author-section">
      <h4 class="required-title">审核凭证：</h4>
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
          <span class="file-size">({{ formatFileSize(auditVoucherList[0].size) }})</span>
        </div>
      </el-upload>
    </div>

    <div class="author-section">
      <h4 class="common-title">封面图片：</h4>
      <!-- 栏花上传区域 -->
      <el-upload 
        v-model:file-list="fileList" 
        class="upload-demo flower-upload" 
        drag 
        :multiple="true"
        action=""
        accept=".jpg,.jpeg,.png"
        :on-change="handleFileChange" 
        :on-remove="handleFileRemove" 
        :auto-upload="false" 
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
    </div>
        <div class="author-section">
      <h4 class="common-title">正文图片：</h4>
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
      <div v-if="batchImageList.length > 0" class="upload-actions">
        <el-button 
          type="primary" 
          @click="handleBatchImageUpload" 
          :loading="uploadingImages" 
          :disabled="!articleTitle.trim() || imagesUploaded"
          :class="{ 'is-disabled': imagesUploaded }"
        >
          {{ uploadingImages ? '上传中...' : imagesUploaded ? '已上传' : '上传' }}
        </el-button>
        <div v-if="uploadingImages" class="upload-progress-info">
          <el-progress :percentage="uploadProgress" :stroke-width="8"></el-progress>
          <div class="upload-speed">上传速度: {{ uploadSpeed }}</div>
        </div>
      </div>
    </div>

    <div class="editor-section">
      <!-- WangEditor 富文本编辑器 核心组件 -->
      <h4 class="common-title">正文：</h4>
      <div style="border: 1px solid #ccc; border-radius: 4px;">
        <Toolbar
          style="border-bottom: 1px solid #ccc; padding: 6px 10px"
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          :mode="mode"
        />
        <Editor
          style="height: 500px; overflow-y: auto;"
          v-model="articleContent"
          :defaultConfig="editorConfig"
          :mode="mode"
          @onCreated="handleCreated"
        />
      </div>
    </div>


    <div class="author-section">
      <h4 class="common-title">附件：</h4>
      <!-- 附件上传区域 -->
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
            <div class="el-upload__tip"> 可上传word格式稿件附件，支持文档格式：doc / docx</div>
          </div>
        </div>
        <!-- 已上传时显示文件信息 -->
        <div v-else class="attachment-info">
          <el-icon class="el-icon-document"><document /></el-icon>
          <span class="file-name">{{ attachmentList[0].name }}</span>
          <span class="file-size">({{ formatFileSize(attachmentList[0].size) }})</span>
        </div>
      </el-upload>
    </div>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button type="primary" size="large" @click="handleSubmit">提交文章</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { getToken } from "@/utils/auth";
import { addArticle } from "@/api/xcsc/article"
import { uploadFileWithChunk } from "@/utils/chunkUpload"
import { getFolderList, getFolderListWithoutPremission, addFolder } from "@/api/xcsc/uploadFile"
import useUserStore from "@/store/modules/user"
import { parseTime } from "@/utils/common"

// ========== 页面变量 ==========
const articleTitle = ref('')
const articleFlower = ref('')
const articleAuthor = ref('')
const articleReviewer = ref('') // 审核人
const articleFinalReviewer = ref('')
const articleAttachments = ref('')
const fileList = ref([]) // 栏花文件列表
const auditVoucherList = ref([]) // 审核凭证文件列表
const userStore = useUserStore()
const batchImageList = ref([]) // 批量图片文件列表
const attachmentList = ref([]) // 附件文件列表
const uploadingImages = ref(false)
const uploadProgress = ref(0)
const uploadSpeed = ref('0 B/s')
const uploadedImageUrls = ref([])
const imagesUploaded = ref(false) // 正文图片是否上传成功
const articleFolderId = ref(null)

// ========== WangEditor 配置 ==========
const editorRef = shallowRef() 
const mode = ref('default')

// 工具栏配置：排除不需要的功能
const toolbarConfig = {
  excludeKeys: [
    'insertTable', 'deleteTable', 'insertVideo', 'codeBlock','uploadVideo',
    'insertFormula', 'fullScreen', 'divider', 'emotion','insertLink','todo'
  ]
}
// 获取当前页面的基础网址（协议+域名+端口）
const currentOrigin = window.location.origin;
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
const handleCreated = (editor) => {
  editorRef.value = editor
  editor.disableXSS = true 
}

// ========== 栏花上传/删除逻辑 ==========
// 文件选择/上传变化
const handleFileChange = (file, fileLists) => {
  // 验证文件类型
  const isImage = file.raw && ['image/jpeg', 'image/jpg', 'image/png'].includes(file.raw.type)
  const isAllowedExt = file.name && /\.(jpg|jpeg|png)$/i.test(file.name)
  
  if (!isImage || !isAllowedExt) {
    ElMessage.error('仅支持jpg、jpeg、png格式的图片')
    // 移除不合法的文件
    const validFiles = fileLists.filter(f => {
      const fIsImage = f.raw && ['image/jpeg', 'image/jpg', 'image/png'].includes(f.raw.type)
      const fIsAllowedExt = f.name && /\.(jpg|jpeg|png)$/i.test(f.name)
      return fIsImage && fIsAllowedExt
    })
    fileList.value = validFiles
    return
  }
  
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
  if (file.url) {
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
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ].includes(file.raw.type)
  const isAllowedExt = file.name && /\.(pdf|jpg|jpeg|png)$/i.test(file.name)

  if (!isAllowedType || !isAllowedExt) {
    ElMessage.error('仅支持pdf、jpg、jpeg、png格式的文件')
    auditVoucherList.value = fileLists.filter(f => {
      const typeValid = f.raw && [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ].includes(f.raw.type)
      const extValid = f.name && /\.(pdf|jpg|jpeg|png)$/i.test(f.name)
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
  ElMessage.info('已删除审核凭证')
}

async function getOrCreateArticleFolder(articleTitle) {
  debugger
  const deptId = userStore.deptId;
  
  if (!deptId) {
    throw new Error('无法获取部门信息');
  }

  try {
    const companyRes = await getFolderList({ 
      pid: 0, 
      companyId: deptId 
    });
    const companyFolders = companyRes?.data || [];
    const companyFolder = companyFolders[0];

    if (!companyFolder) {
      throw new Error('未找到公司文件夹');
    }

    //查询“我的稿件”目录
    const myDraftRes = await getFolderListWithoutPremission({
      companyId: deptId,
      filePath: '我的稿件'
    });
    console.log("myDraftRes",myDraftRes)
    const myDraftFolders = myDraftRes?.data || [];
    const myDraftFolder = myDraftFolders[0];
    const myDraftPid = myDraftFolder.bizId

    if (!myDraftPid) {
      throw new Error('未找到“我的稿件”文件夹');
    }

    const existedRes = await getFolderList({
      pid: myDraftPid,
      filePath: articleTitle
    });
    const existedFolders = existedRes?.data || [];
    let articleFolder = existedFolders[0];

    if (!articleFolder) {
      await addFolder({
        filePath: articleTitle,
        pid: myDraftPid
      });

      const createdRes = await getFolderList({
        pid: myDraftPid,
        filePath: articleTitle
      });
      const createdFolders = createdRes?.data || [];
      articleFolder = createdFolders[0];
    }

    const articleFolderId = articleFolder.bizId
    if (!articleFolderId) {
      throw new Error('创建文章文件夹失败');
    }

    return {
      folderId: articleFolderId,
      folderPath: `${companyFolder.filePath}/我的稿件/${articleTitle}`
    };
  } catch (error) {
    console.error('获取或创建文章文件夹失败:', error);
    throw error;
  }
}

async function handleBatchImageUpload() {
  if (batchImageList.value.length === 0) {
    return;
  }
  const title = articleTitle.value.trim();
  if (!title) {
    ElMessage.warning('请先输入文章标题');
    return;
  }
  uploadingImages.value = true;
  uploadProgress.value = 0;
  uploadSpeed.value = '0 B/s';
  uploadedImageUrls.value = [];

  try {
    const { folderId, folderPath } = await getOrCreateArticleFolder(title);
    articleFolderId.value = folderId;

    for (let i = 0; i < batchImageList.value.length; i++) {
      const file = batchImageList.value[i].raw;
      if (!file) continue;

      const result = await uploadFileWithChunk(file, folderId, folderPath, {
        onProgress: (progress) => {
          const totalProgress = ((i + progress / 100) / batchImageList.value.length) * 100;
          uploadProgress.value = Math.round(totalProgress);
        },
        onSpeedUpdate: (speed) => {
          uploadSpeed.value = speed;
        },
        fileLastModified: parseTime(file.lastModifiedDate),
        contentType: file.type
      });

      if (result.success) {
        uploadedImageUrls.value.push(result.fileHash);
      } else {
        throw new Error(`图片 ${file.name} 上传失败`);
      }
    }

    ElMessage.success('正文图片上传完成')
    imagesUploaded.value = true;

  } catch (error) {
    console.error('正文图片上传失败:', error);
    ElMessage.error('正文图片上传失败: ' + error.message);
  } finally {
    uploadingImages.value = false;
  }
}

const handleBatchImageChange = (file, fileLists) => {
  const invalidFiles = fileLists.filter(f => {
    const isImage = f.raw && ['image/jpeg', 'image/jpg', 'image/png'].includes(f.raw.type)
    const isAllowedExt = f.name && /\.(jpg|jpeg|png)$/i.test(f.name)
    return !isImage || !isAllowedExt
  })
  if (invalidFiles.length > 0) {
    ElMessage.error('批量图片仅支持jpg、jpeg、png格式')
    batchImageList.value = fileLists.filter(f => {
      const isImage = f.raw && ['image/jpeg', 'image/jpg', 'image/png'].includes(f.raw.type)
      const isAllowedExt = f.name && /\.(jpg|jpeg|png)$/i.test(f.name)
      return isImage && isAllowedExt
    })
    return
  }
  batchImageList.value = fileLists
}

const handleBatchImageRemove = (file, fileLists) => {
  batchImageList.value = fileLists
  imagesUploaded.value = false
  uploadedImageUrls.value = []
}

// ========== 功能方法 ==========
// 清空内容
const handleClear = () => {
  articleTitle.value = ''
  articleAuthor.value = ''
  articleReviewer.value = ''
  articleFinalReviewer.value = ''
  // 清空栏花并释放URL
  if (fileList.value.length > 0) {
    fileList.value.forEach(file => {
      if (file.url) URL.revokeObjectURL(file.url)
    })
    fileList.value = []
  }
  // 清空附件
  if (attachmentList.value.length > 0) {
    attachmentList.value = []
  }
  if (auditVoucherList.value.length > 0) {
    auditVoucherList.value = []
  }
  if (batchImageList.value.length > 0) {
    batchImageList.value = []
  }
  uploadingImages.value = false
  uploadProgress.value = 0
  uploadSpeed.value = '0 B/s'
  uploadedImageUrls.value = []
  imagesUploaded.value = false
  articleFolderId.value = null
  if (editorRef.value) {
    editorRef.value.setHtml('') 
  }
  // ElMessage.info('已清空所有内容')
}

// 提交文章
async function handleSubmit() {
  const trimTitle = articleTitle.value.trim()
  if (!trimTitle) {
    ElMessage.warning('请输入文章标题')
    return
  }

  if (auditVoucherList.value.length === 0) {
    ElMessage.warning('请上传审核凭证')
    return
  }

  // 检查正文图片是否已上传
  if (batchImageList.value.length > 0 && !imagesUploaded.value) {
    ElMessage.warning('您还未上传正文图片！')
    return
  }

  // if (fileList.value.length === 0) {
  //   ElMessage.warning('请上传栏花图片')
  //   return
  // }

  const trimAuthor = articleAuthor.value.trim()
  // if (!trimAuthor) {
  //   ElMessage.warning('请输入作者姓名')
  //   return
  // }

  // 从编辑器实例获取 HTML 内容
  const contentHtml = editorRef.value?.getHtml() || ''

  // 创建 FormData 并填充数据
  const formData = new FormData();
  // 处理栏花文件
  if (fileList.value && fileList.value.length > 0) {
    formData.append("file", fileList.value[0].raw);
  }
  // 处理附件文件
  if (attachmentList.value && attachmentList.value.length > 0) {
    formData.append("attachment", attachmentList.value[0].raw);
  }
  // 处理审核凭证文件
  if (auditVoucherList.value && auditVoucherList.value.length > 0) {
    formData.append("auditVoucher", auditVoucherList.value[0].raw);
  }
  // 处理批量图片
  if (batchImageList.value && batchImageList.value.length > 0) {
    batchImageList.value.forEach(file => {
      if (file.raw) {
        formData.append("batchImages", file.raw);
      }
    })
  }
  formData.append("title", articleTitle.value.trim());
  formData.append("authorName", articleAuthor.value.trim());
  formData.append("reviewer", articleReviewer.value.trim());
  formData.append("finalReviewer", articleFinalReviewer.value.trim());
  formData.append("content", contentHtml);
  
  if (uploadedImageUrls.value.length > 0) {
    uploadedImageUrls.value.forEach((url, index) => {
      formData.append(`imageUrls[${index}]`, url);
    });
  }
  
  if (articleFolderId.value) {
    formData.append("folderId", articleFolderId.value);
  }

  try {
    const res = await addArticle(formData)
    
    ElMessage.success('文章提交成功')
    handleClear()
  } catch (error) {
    console.error('文章提交失败:', error)
    ElMessage.error('文章提交失败，请稍后重试')
  }
}

// 销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
  // 组件销毁时释放图片URL
  fileList.value.forEach(file => {
    if (file.url) URL.revokeObjectURL(file.url)
  })
  // 清空附件列表
  attachmentList.value = []
  auditVoucherList.value = []
  batchImageList.value = []
})
</script>

<style scoped>
.article-submit-container {
  --content-width: 80%;
  --font-size-base: 14px;
  --font-size-title: 16px;
  --font-size-small: 12px;
  --line-height-base: 1.6;
  --line-height-title: 1.4;
  --section-gap: 20px;
  --inline-gap: 15px;
  --text-primary: #303133;
  --text-secondary: #606266;
  --text-placeholder: #909399;

  padding: 40px;
  background-color: #fff;
  width: var(--content-width);
  border-radius: 4px;
  margin: 0 auto; 
  color: var(--text-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

.title-section {
  width: var(--content-width);
  display: flex;
  align-items: center;
  gap: var(--inline-gap);
  margin-bottom: var(--section-gap);
}

.author-section {
  margin-bottom: var(--section-gap);
  width: var(--content-width);
  display: flex;
  align-items: center;
  gap: var(--inline-gap);
}

.title-section h4,
.author-section h4 {
  white-space: nowrap;
  margin: 0;
  line-height: var(--line-height-title);
}

.author-section .el-input {
  width: 300px;
}

.editor-section {
  position: relative;
  margin: var(--section-gap) 0;
}

/* 栏花上传样式改造 */
.flower-upload {
  width: 100%;
}
.upload-tips {
  text-align: center;
  padding: 10px;
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  color: var(--text-secondary);
}

.upload-tips .el-icon--upload {
  font-size: 24px;
  margin-bottom: 5px;
}
.flower-preview {
  width: 100%;
  text-align: center;
  padding: 10px;
}
.preview-img {
  max-width: 400px;
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
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
  line-height: var(--line-height-base);
}

.file-size {
  font-size: var(--font-size-small);
  color: var(--text-placeholder);
  line-height: var(--line-height-base);
}

.common-title,
.required-title {
  font-size: var(--font-size-title);
  font-weight: 600;
  color: var(--text-primary);
  line-height: var(--line-height-title);
}
.required-title:before {
  content: "*";
  color: #F56C6C;
  margin-right: 2px;
}

/* 提交按钮样式 */
.submit-section {
  margin-top: 30px;
  width: var(--content-width);
  padding: 20px 0;
  display: flex;
  justify-content: center;
}

/* 上传操作区域样式 */
.upload-actions {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-progress-info {
  width: 100%;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.upload-speed {
  margin-top: 8px;
  font-size: var(--font-size-small);
  color: var(--text-placeholder);
  line-height: var(--line-height-base);
  text-align: right;
}
</style>
