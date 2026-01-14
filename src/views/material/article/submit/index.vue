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
      <h4 class="required-title">栏花：</h4>
      <!-- 栏花上传区域 - 改造核心 -->
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
            <div class="el-upload__tip"> 支持图片格式：jpeg / jpg / png，文件大小不超过10MB</div>
          </div>
        </div>
        <!-- 已上传时显示图片预览 -->
        <div v-else class="flower-preview">
          <img :src="fileList[0].url || URL.createObjectURL(fileList[0].raw)" alt="栏花预览" class="preview-img">
        </div>
      </el-upload>
    </div>

    <div class="editor-section">
      <!-- WangEditor 富文本编辑器 核心组件 -->
      <h4 class="required-title">正文：</h4>
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

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button type="primary" size="large" @click="handleSubmit">提交文章</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import FileUpload from '@/components/FileUpload/index.vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { getToken } from "@/utils/auth";
import { addArticle } from "@/api/xcsc/article"

// ========== 页面变量 ==========
const articleTitle = ref('')
const articleFlower = ref('')
const articleAuthor = ref('')
const articleAttachments = ref('')
const fileList = ref([]) // 栏花文件列表（改造：数组形式管理）

// ========== WangEditor 配置 ==========
const editorRef = shallowRef() 
const mode = ref('default')

// 工具栏配置：排除不需要的功能
const toolbarConfig = {
  excludeKeys: [
    'insertTable', 'deleteTable', 'insertVideo', 'codeBlock','uploadVideo',
    'insertFormula', 'fullScreen', 'divider', 'emotion'
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
      server: '/dev-api/article/uploadImage',
      // server: '/inspection-api/article/uploadImage',
      fieldName: 'file',
      maxFileSize: 20 * 1024 * 1024,
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

// ========== 功能方法 ==========
// 清空内容
const handleClear = () => {
  articleTitle.value = ''
  articleAuthor.value = ''
  // 清空栏花并释放URL
  if (fileList.value.length > 0) {
    fileList.value.forEach(file => {
      if (file.url) URL.revokeObjectURL(file.url)
    })
    fileList.value = []
  }
  if (editorRef.value) {
    editorRef.value.setHtml('') 
  }
  ElMessage.info('已清空所有内容')
}

// 提交文章
async function handleSubmit() {
  const trimTitle = articleTitle.value.trim()
  if (!trimTitle) {
    ElMessage.warning('请输入文章标题')
    return
  }

  if (fileList.value.length === 0) {
    ElMessage.warning('请上传栏花图片')
    return
  }

  const trimAuthor = articleAuthor.value.trim()
  // if (!trimAuthor) {
  //   ElMessage.warning('请输入作者姓名')
  //   return
  // }

  // 从编辑器实例获取 HTML 内容
  const contentHtml = editorRef.value?.getHtml() || ''
  const pureText = contentHtml.replace(/<[^>]+>/g, '').trim()
  if (pureText.length === 0) {
    ElMessage.warning('请输入文章正文内容，不能为空')
    return
  }

  // 创建 FormData 并填充数据
  const formData = new FormData();
  // 处理栏花文件
  if (fileList.value && fileList.value.length > 0) {
    formData.append("file", fileList.value[0].raw);
  }
  formData.append("title", articleTitle.value.trim());
  formData.append("authorName", articleAuthor.value.trim());
  formData.append("content", contentHtml);

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
})
</script>

<style scoped>
.article-submit-container {
  padding: 40px;
  background-color: #fff;
  width: 80%;
  border-radius: 4px;
  margin: 0 auto; 
}

.title-section {
  width: 80%;
  display: flex;
  align-items: center;
  gap: 15px;
}

.author-section {
  margin-bottom: 20px;
  width: 80%;
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-section h4,
.author-section h4 {
  white-space: nowrap;
}

.author-section .el-input {
  width: 300px;
}

.editor-section {
  position: relative;
  margin: 20px 0;
}

/* 栏花上传样式改造 */
.flower-upload {
  width: 100%;
}
.upload-tips {
  text-align: center;
  padding: 20px;
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

.common-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 10px;
  margin-bottom: 15px;
}
.required-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 10px;
  margin-bottom: 15px;
}
.required-title:before {
  /* color: #F56C6C;
  margin-left: 4px; */
  content: "*";
  color: #F56C6C;
  margin-right: 2px;
}

/* 提交按钮样式 */
.submit-section {
  margin-top: 30px;
  width:80%;
  padding: 20px 0;
  display: flex;
  justify-content: center;
}
</style>