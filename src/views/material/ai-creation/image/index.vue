﻿<template>
  <div class="app-container ai-creation-page">
    <div class="workspace">
      <div class="left-pane">
        <div class="pane-card">
          <h3>图片提示词</h3>
          <el-input
            v-model="form.prompt"
            type="textarea"
            :rows="5"
            placeholder="请描述你想生成的图片"
          />
          <div class="prompt-ref-wrap">
            <div class="ref-upload-item">
              <div class="ref-title">参考图（最多10张）</div>
              <div class="ref-picker-row">
                <div v-for="(img, index) in referenceImages" :key="img.uid || img.url" class="ref-tile">
                  <img :src="img.url" alt="参考图" />
                  <button class="ref-remove-btn" type="button" @click="removeReferenceImage(index)">×</button>
                </div>
                <el-upload
                  v-if="referenceImages.length < maxReferenceCount"
                  ref="referenceUploadRef"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  multiple
                  :limit="maxReferenceCount"
                  :on-change="onRefImageChange"
                  :on-exceed="onRefImageExceed"
                  :file-list="referenceUploadList"
                  class="ref-upload-trigger"
                >
                  <div class="upload-box">
                    <span class="upload-plus">+</span>
                  </div>
                </el-upload>
              </div>
              <div class="ref-count">
                {{ referenceImages.length }}/{{ maxReferenceCount }}
              </div>
            </div>
          </div>
        </div>
        <div class="pane-card">
          <h3>参数设置</h3>
          <el-form label-position="top">
            <el-form-item label="模型">
              <el-select v-model="form.model">
                <el-option label="Seedream4.5" value="seedream-4.5" />
              </el-select>
            </el-form-item>
            <div class="inline-fields">
              <el-form-item label="比例">
                <el-select v-model="form.aspectRatio">
                  <el-option label="1:1" value="1:1" />
                  <el-option label="4:3" value="4:3" />
                  <el-option label="3:4" value="3:4" />
                  <el-option label="16:9" value="16:9" />
                  <el-option label="9:16" value="9:16" />
                  <el-option label="3:2" value="3:2" />
                  <el-option label="2:3" value="2:3" />
                  <el-option label="21:9" value="21:9" />
                </el-select>
              </el-form-item>
              <el-form-item label="数量">
                <el-input-number v-model="form.count" :min="1" :max="8" />
              </el-form-item>
            </div>
          </el-form>
        </div>
        <div class="pane-card templates">
          <h3>灵感模板</h3>
          <div class="template-list">
            <button
              v-for="tpl in imageTemplates"
              :key="tpl"
              class="template-chip"
              @click="form.prompt = tpl"
            >
              {{ tpl }}
            </button>
          </div>
        </div>
        <el-button type="primary" size="large" :loading="creating" @click="generateImage">
          立即生成图片
        </el-button>
      </div>
      <div class="right-pane">
        <div class="pane-card result-card">
          <div class="result-header">
            <h3>结果预览</h3>
            <el-text type="info">最近一次任务：{{ latestTask }}</el-text>
          </div>
          <div class="image-grid">
            <div v-for="(img, index) in imageResults" :key="img + index" class="image-item">
              <el-image
                :src="img"
                :preview-src-list="imageResults"
                fit="cover"
                preview-teleported
              >
                <template #error>
                    <div class="image-slot">
                      <el-icon><PictureFilled /></el-icon>
                    </div>
                  </template>
              </el-image>
              <button class="image-download-btn" type="button" @click="downloadImage(img, index)">下载</button>
            </div>
          </div>
        </div>
        <div class="pane-card history-card">
          <div class="result-header">
            <h3>历史记录</h3>
            <el-button link type="primary" @click="clearHistory">清空</el-button>
          </div>
          <div v-if="historyTasks.length" class="history-list">
            <div v-for="task in historyTasks" :key="task.id" class="history-item">
              <div class="history-head">
                <span class="history-time">{{ task.time }}</span>
                <el-button link type="primary" @click="previewHistoryTask(task)">查看</el-button>
              </div>
              <div class="history-meta">
            <span>比例：{{ task.aspectRatio }}</span>
            <span>数量：{{ task.count }}</span>
          </div>
          <div class="history-prompt" v-if="task.prompt">
            <span class="prompt-label">提示词：</span>
            <span class="prompt-text">{{ task.prompt }}</span>
          </div>
              <div class="history-grid">
                <div v-for="(img, idx) in task.images" :key="img + idx" class="history-thumb">
                  <el-image
                    :src="img"
                    :preview-src-list="task.images"
                    fit="cover"
                    preview-teleported
                  >
                    <template #error>
                      <div class="image-slot">
                        <el-icon><picture-filled /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <button class="image-download-btn" type="button" @click="downloadImage(img, idx)">下载</button>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无历史生图" :image-size="88" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="AICreationImage">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PictureFilled } from '@element-plus/icons-vue'
import { generateImage as generateImageApi, uploadImage as uploadImageApi } from '@/api/xcsc/imageGenerate'

const creating = ref(false)
const latestTask = ref('暂无')

const form = reactive({
  prompt: '',
  model: 'seedream-4.5',
  aspectRatio: '16:9',
  count: 1
})

const imageTemplates = [
  '把参考图变成卡通/3D/剪纸风格',
  '柔光，使用柔和的光线对图片重新照明',
  '中秋节日祝福海报，中国传统风格，金色桂花+圆月元素，红金渐变主色调，简约大气，无文字',
  '李白乘舟将欲行，忽闻岸上踏歌声。桃花潭水深千尺，不及汪伦送我情。',
]

const imageResults = ref([])
const historyTasks = ref([])
const historyStorageKey = 'xcsc_ai_image_history'
const maxHistoryCount = 20
const maxReferenceCount = 10
const maxReferenceSizeMB = 10
const maxReferenceSizeBytes = maxReferenceSizeMB * 1024 * 1024
const referenceUploadRef = ref()
const referenceUploadList = ref([])

const referenceImages = ref([])

const revokeBlobUrl = (url) => {
  if (typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

const syncReferenceImages = (uploadFiles = []) => {
  const prevMap = new Map(referenceImages.value.map((item) => [item.uid, item]))
  const nextImages = uploadFiles.slice(0, maxReferenceCount).map((file) => {
    const prev = prevMap.get(file.uid)
    if (prev && prev.rawFile === file.raw) {
      return prev
    }
    return {
      uid: file.uid,
      name: file.name || file.raw?.name || '',
      url: URL.createObjectURL(file.raw),
      rawFile: file.raw,
      uploadedUrl: ''
    }
  })

  const nextUidSet = new Set(nextImages.map((item) => item.uid))
  referenceImages.value.forEach((item) => {
    if (!nextUidSet.has(item.uid)) {
      revokeBlobUrl(item.url)
    }
  })

  referenceImages.value = nextImages
}

const onRefImageChange = (_file, fileList) => {
  const validFiles = (fileList || []).filter((file) => {
    const isImage = !!file?.raw?.type && file.raw.type.startsWith('image/')
    if (!isImage) {
      ElMessage.warning('参考图仅支持图片格式')
      return false
    }

    const size = file?.raw?.size || 0
    const withinLimit = size <= maxReferenceSizeBytes
    if (!withinLimit) {
      ElMessage.warning(`参考图大小不能超过 ${maxReferenceSizeMB}MB`)
      return false
    }
    return true
  })

  referenceUploadList.value = validFiles.slice(0, maxReferenceCount)
  syncReferenceImages(referenceUploadList.value)
}

const onRefImageExceed = () => {
  ElMessage.warning(`最多上传 ${maxReferenceCount} 张参考图`)
}

const removeReferenceImage = (index) => {
  const removed = referenceImages.value[index]
  if (removed) {
    revokeBlobUrl(removed.url)
  }
  referenceUploadList.value.splice(index, 1)
  syncReferenceImages(referenceUploadList.value)
}

const aspectRatioSizeMap = {
  '1:1': '2048x2048',
  '4:3': '2304x1728',
  '3:4': '1728x2304',
  '16:9': '2848x1600',
  '9:16': '1600x2848',
  '3:2': '2496x1664',
  '2:3': '1664x2496',
  '21:9': '3136x1344'
}

const normalizeResult = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const code = raw.code
  const ok = code === 0 || code === 200
  if (!ok) return null
  const imageUrl = raw.image_url || raw.url
  if (!imageUrl) return null
  return imageUrl
}

const uploadSingleReferenceImage = async (refImage) => {
  if (!refImage?.rawFile) return ''
  if (refImage.uploadedUrl) return refImage.uploadedUrl
  const formData = new FormData()
  formData.append('file', refImage.rawFile)

  const res = await uploadImageApi(formData, 'reference')

  const raw = res || {}
  const ok = raw.code === 200 || raw.code === 0
  if (!ok) {
    throw new Error(raw?.msg || raw?.message || '参考图上传失败')
  }

  const uploadedUrl = raw?.data?.url || raw?.url || ''
  if (!uploadedUrl) {
    throw new Error('参考图上传成功，但未返回可用地址')
  }
  refImage.uploadedUrl = uploadedUrl
  return uploadedUrl
}

const uploadReferenceImagesIfNeeded = async () => {
  if (!referenceImages.value.length) return ''
  const urls = await Promise.all(referenceImages.value.map((item) => uploadSingleReferenceImage(item)))
  return urls.filter(Boolean).join(',')
}

const requestGenerateOne = async (prompt, size, image) => {
  const params = { prompt, size }
  if (image) {
    params.image = image
  }
  const res = await generateImageApi(params)
  return normalizeResult(res)
}

const generateImage = async () => {
  if (!form.prompt?.trim()) {
    ElMessage.warning('请先输入提示词')
    return
  }

  creating.value = true
  try {
    const size = aspectRatioSizeMap[form.aspectRatio] || '2048x2048'
    const requestCount = Number(form.count) || 1
    const refImageUrl = await uploadReferenceImagesIfNeeded()
    const tasks = Array.from({ length: requestCount }).map(() =>
      requestGenerateOne(form.prompt.trim(), size, refImageUrl)
    )
    const urls = (await Promise.all(tasks)).filter(Boolean)

    if (!urls.length) {
      ElMessage.error('图片生成失败，请稍后重试')
      return
    }

    imageResults.value = urls
    latestTask.value = `${new Date().toLocaleString()} 生成`
    pushHistoryTask({
      images: urls,
      count: urls.length,
      aspectRatio: form.aspectRatio,
      prompt: form.prompt.trim()
    })
    ElMessage.success(`生成完成，共 ${urls.length} 张`)
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || error?.response?.data?.message || '图片生成失败')
  } finally {
    creating.value = false
  }
}

const downloadImage = async (url, index) => {
  if (!url) return
  const fileName = `ai-image-${Date.now()}-${index + 1}.png`
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const saveHistory = () => {
  localStorage.setItem(historyStorageKey, JSON.stringify(historyTasks.value))
}

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(historyStorageKey)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    historyTasks.value = parsed
  } catch {
    historyTasks.value = []
  }
}

const pushHistoryTask = ({ images, count, aspectRatio, prompt }) => {
  const task = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: new Date().toLocaleString(),
    images: images || [],
    count: count || 0,
    aspectRatio: aspectRatio || '1:1',
    prompt: prompt || ''
  }
  historyTasks.value = [task, ...historyTasks.value].slice(0, maxHistoryCount)
  saveHistory()
}

const previewHistoryTask = (task) => {
  imageResults.value = task.images || []
  latestTask.value = `${task.time} 历史记录`
}

const clearHistory = () => {
  historyTasks.value = []
  localStorage.removeItem(historyStorageKey)
}

onMounted(() => {
  loadHistory()
})

onBeforeUnmount(() => {
  referenceImages.value.forEach((item) => revokeBlobUrl(item.url))
})
</script>

<style scoped lang="scss">
.ai-creation-page {
  height: calc(100vh - 110px);
  display: flex;
  flex-direction: column;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(340px, 1fr) minmax(380px, 1fr);
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.left-pane,
.right-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pane-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px;
  background: #fff;

  h3 {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
  }
}

.inline-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.prompt-ref-wrap {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #dbe3ee;
}

.ref-title {
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
}

.upload-box {
  border: 1px dashed #d6d9df;
  background: #fafbfc;
  border-radius: 12px;
  width: 92px;
  height: 92px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #8a94a6;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s, background-color 0.2s;
}

.upload-box:hover {
  border-color: #b8c0ce;
  background: #f4f6fa;
}

.upload-plus {
  font-size: 28px;
  line-height: 1;
  font-weight: 400;
  color: #495264;
}

.ref-picker-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.ref-tile {
  position: relative;
  border: 1px solid #e6e9ef;
  border-radius: 12px;
  overflow: hidden;
  width: 92px;
  height: 92px;
  background: #f5f7fb;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.ref-remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  cursor: pointer;
  padding: 0;
}

.ref-count {
  margin-top: 10px;
  color: #7b8596;
  font-size: 12px;
}

.ref-tip {
  margin-top: 2px;
  color: #9aa3b2;
  font-size: 12px;
}

.templates .template-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-chip {
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #374151;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  transition: 0.2s;
}

.template-chip:hover {
  border-color: #60a5fa;
  color: #1d4ed8;
  background: #eff6ff;
}

.result-card {
  min-height: 340px;
}

.history-card {
  min-height: 360px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.image-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;

  img {
    width: 100%;
    height: auto;
    object-fit: contain;
    display: block;
  }
}

.image-download-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  border: 0;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 480px;
  overflow-y: auto;
  padding-right: 4px;
}

.history-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-time {
  font-size: 13px;
  color: #334155;
}

.history-meta {
  margin-top: 6px;
  display: flex;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
}

.history-prompt {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
  color: #374151;
  font-size: 13px;
  line-height: 1.5;
}

.prompt-label {
  font-weight: 500;
  color: #64748b;
}

.prompt-text {
  word-break: break-all;
  color: #374151;
}

.history-grid {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.history-thumb {
  position: relative;

  img {
    width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    display: block;
  }
}

:deep(.el-form-item) {
  margin-bottom: 10px;
}

@media (max-width: 1280px) {
  .ai-creation-page {
    height: auto;
  }

  .workspace {
    grid-template-columns: 1fr;
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .inline-fields {
    grid-template-columns: 1fr;
  }

  .ref-picker-row {
    gap: 10px;
  }

  .image-grid {
    grid-template-columns: 1fr;
  }

  .history-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
