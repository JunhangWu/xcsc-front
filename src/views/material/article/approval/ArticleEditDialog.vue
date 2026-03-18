<template>
  <el-dialog
    v-model="visible"
    title="修改正文"
    width="70%"
    :close-on-click-modal="false"
  >
    <el-form label-width="80px">
      <el-form-item label="标题">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="正文">
        <div class="editor-wrapper">
          <Toolbar
            class="editor-toolbar"
            :editor="editorRef"
            :defaultConfig="toolbarConfig"
            :mode="mode"
          />
          <Editor
            class="editor-content"
            v-model="form.content"
            :defaultConfig="editorConfig"
            :mode="mode"
            @onCreated="handleEditorCreated"
          />
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      <el-button type="success" @click="handleExport" :loading="exporting">导出</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, shallowRef, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { getArticle, exportHtmlToWord, updateArticleContent } from '@/api/xcsc/article'
import { getToken } from '@/utils/auth'
import { normalizeEditorHtmlImageSrcToAbsolute } from '@/utils/richText'

const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const exporting = ref(false)
const editorRef = shallowRef()
const mode = ref('default')

const form = reactive({
  id: null,
  rowId: null,
  title: '',
  content: '',
  authorName: '',
  reviewer: '',
  finalReviewer: '',
  attachmentUrl: '',
  attachmentName: '',
  columnOrnamentUrl: '',
  approvalStatus: 0,
  approvalComments: ''
})

const toolbarConfig = {
  excludeKeys: [
    'insertTable', 'deleteTable', 'insertVideo', 'codeBlock', 'uploadVideo',
    'insertFormula', 'fullScreen', 'divider', 'emotion', 'insertLink', 'todo'
  ]
}

const getProxyPath = (url) => {
  if (!url) return ''
  try {
    if (url.includes('/minio/proxy?')) return url
    const u = new URL(url, window.location.origin)
    const parts = u.pathname.replace(/^\/+/, '').split('/')
    const bucket = parts.shift()
    const objectKey = parts.join('/')
    if (!bucket || !objectKey) return url
    const baseApi = import.meta.env.VITE_APP_BASE_API || ''
    const params = new URLSearchParams({
      bucketName: bucket,
      filePath: objectKey
    })
    return `${baseApi}/minio/proxy?${params.toString()}`
  } catch (error) {
    return url
  }
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

const editorConfig = {
  placeholder: '请输入文章正文内容...',
  pasteFilterStyle: false,
  pasteIgnoreImg: false,
  uploadImgByBlob: true,
  MENU_CONF: {
    uploadImage: {
      server: import.meta.env.VITE_APP_BASE_API + '/article/uploadImage',
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
      }
    }
  }
}

const handleEditorCreated = (editor) => {
  editorRef.value = editor
  editor.disableXSS = true
}

const open = async (row) => {
  if (!row?.id) {
    ElMessage.warning('缺少稿件ID')
    return
  }
  try {
    const res = await getArticle(row.id)
    const data = res?.data || {}
    Object.assign(form, {
      id: data.id || row.id,
      rowId: row.id,
      title: data.title || '',
      content: data.content || '',
      authorName: data.authorName || '',
      reviewer: data.reviewer || data.approver || '',
      finalReviewer: data.finalReviewer || '',
      attachmentUrl: data.attachmentUrl || '',
      attachmentName: data.attachmentName || '',
      columnOrnamentUrl: data.columnOrnamentUrl || '',
      approvalStatus: data.approvalStatus,
      approvalComments: data.approvalComments || ''
    })
    visible.value = true
  } catch (error) {
    ElMessage.error('获取稿件详情失败')
    console.error('获取稿件详情失败:', error)
  }
}

const handleSave = async () => {
  const plainText = (form.content || '').replace(/<[^>]+>/g, '').trim()
  if (!plainText) {
    ElMessage.warning('正文不能为空')
    return
  }

  try {
    saving.value = true
    const articleId = form.id || form.rowId
    if (!articleId) {
      ElMessage.warning('缺少稿件ID')
      saving.value = false
      return
    }
    const normalizedContent = normalizeEditorHtmlImageSrcToAbsolute(form.content || '')
    await updateArticleContent({
      id: articleId,
      title: form.title || '',
      content: normalizedContent
    })
    ElMessage.success('保存成功')
    emit('saved')
    visible.value = false
  } catch (error) {
    ElMessage.error('保存失败')
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const handleExport = async () => {
  if (!form.id) {
    ElMessage.warning('请选择要导出的稿件')
    return
  }

  try {
    exporting.value = true
    const response = await exportHtmlToWord({
      id: form.id,
      title: form.title,
      content: form.content,
      authorName: form.authorName,
      reviewer: form.reviewer,
      finalReviewer: form.finalReviewer
    })

    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.title || 'article'}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('导出失败:', error)
  } finally {
    exporting.value = false
  }
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
})

defineExpose({
  open
})
</script>

<style scoped>
.editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  width: 100%;
}

.editor-toolbar {
  border-bottom: 1px solid #dcdfe6;
  padding: 6px 10px;
}

.editor-content {
  height: 500px;
  overflow-y: auto;
}
</style>
