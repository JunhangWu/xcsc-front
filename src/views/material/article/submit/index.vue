<template>
  <div class="article-submit-container">
    <div class="title-section">
      <h4 class="common-title">文章标题：</h4>
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

    <div class="editor-section">
      <!-- WangEditor 富文本编辑器 核心组件 -->
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

    <!-- 附件上传区域 -->
    <!-- <div class="attachment-section">
      <h3 class="section-title">附件上传</h3>
      <FileUpload
        v-model="articleAttachments"
        :limit="5"
        :file-size="20"
        :file-type="['doc', 'docx', 'pdf', 'txt']"
      />
    </div> -->

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button type="primary" size="large" @click="handleSubmit">提交文章</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import FileUpload from '@/components/FileUpload/index.vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { getToken } from "@/utils/auth";
import { addArticle } from "@/api/xcsc/article"

// ========== 页面变量 ==========
const articleTitle = ref('')
const articleAuthor = ref('')
const articleAttachments = ref('')

// ========== WangEditor 配置（核心修复） ==========
const editorRef = shallowRef() // 编辑器实例（必须用 shallowRef）
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

// 编辑器创建成功后执行（修复 disableXSS 时机）
const handleCreated = (editor) => {
  editorRef.value = editor
  editor.disableXSS = true // 在这里执行，确保 editor 已存在
}

// ========== 功能方法 ==========
// 清空内容
const handleClear = () => {
  articleTitle.value = ''
  articleAuthor.value = ''
  articleAttachments.value = ''
  if (editorRef.value) {
    editorRef.value.setHtml('') // 用编辑器 API 清空，而非绑定变量
  }
}

// 提交文章
const handleSubmit = () => {
  const trimTitle = articleTitle.value.trim()
  if (!trimTitle) {
    ElMessage.warning('请输入文章标题')
    return
  }

  const trimAuthor = articleAuthor.value.trim()
  if (!trimAuthor) {
    ElMessage.warning('请输入作者姓名')
    return
  }

  // 从编辑器实例获取 HTML 内容
  const contentHtml = editorRef.value?.getHtml() || ''
  const pureText = contentHtml.replace(/<[^>]+>/g, '').trim()
  if (pureText.length === 0) {
    ElMessage.warning('请输入文章正文内容，不能为空')
    return
  }

  const submitData = {
    title: trimTitle,
    authorName: trimAuthor,
    content: contentHtml // 直接用编辑器的 HTML
  }

  addArticle(submitData)
    .then(res => {
      ElMessage.success('文章提交成功')
      handleClear()
    })
    .catch(error => {
      console.error('文章提交失败:', error)
      ElMessage.error('文章提交失败，请稍后重试')
    })
}

// 销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
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
  /* margin-bottom: 20px; */
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

.clear-btn {
  font-size: 16px;
}

/* 附件上传区域样式 */
.attachment-section {
  /* padding: 20px; */
  border-radius: 4px;
}

.section-title {
  font-size: 16px;
	font-weight: 600;
	color: #303133;
	padding-bottom: 10px;
	border-bottom: 1px solid #e4e7ed;
	margin-bottom: 15px;
}

.common-title {
  font-size: 16px;
	font-weight: 600;
	color: #303133;
	padding-bottom: 10px;
	/* border-bottom: 1px solid #e4e7ed; */
	margin-bottom: 15px;
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