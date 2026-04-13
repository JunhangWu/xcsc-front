<template>
  <el-dialog
    v-model="dialogVisible"
    title="素材预览"
    width="85%"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="preview-dialog">
      <div class="preview-content">
        <!-- 左侧预览区 -->
        <div class="preview-area">
          <div v-if="!previewReady" class="file-preview">加载中...</div>
          <div v-else-if="getFileType(previewMaterial.minioPath) === 'image'" class="image-preview">
            <img
              :key="previewMaterial.minioPath || previewMaterial.id || previewMaterial.fileName"
              :src="getProxyPath(previewMaterial.minioPath)"
              :alt="previewMaterial.fileName"
              class="preview-image"
            />
          </div>
          <div v-else-if="getFileType(previewMaterial.minioPath) === 'video'" class="video-preview">
            <video
              :key="previewMaterial.minioPath || previewMaterial.id || previewMaterial.fileName"
              :src="getProxyPath(previewMaterial.minioPath)"
              controls autoplay loop muted playsinline
              style="max-width: 100%; max-height: 500px; width: auto; height: auto; display: block; object-fit: contain;"></video>
          </div>
          <div v-else class="file-preview">
            <el-link type="primary" :href="getProxyPath(previewMaterial.minioPath)" target="_blank">{{ previewMaterial.fileName}}</el-link>
          </div>
        </div>

        <!-- 右侧信息区 -->
        <div class="info-area">
          <!-- 文件名称 -->
          <div class="name-section">
            <h2 class="material-name">{{ material.fileName }}</h2>
          </div>

          <!-- 元数据信息 -->
          <div class="metadata-section">
            <h3 class="section-title">文件信息</h3>
            <div class="metadata-grid">
              <div class="metadata-item">
                <span class="metadata-label">文件类型：</span>
                <span class="metadata-value">{{ getFileTypeText(material.minioPath) }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">上传时间：</span>
                <span class="metadata-value">{{ parseTime(material.createTime) }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">上传者：</span>
                <span class="metadata-value">{{ material.createBy || '未知' }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">所属路径：</span>
                <span class="metadata-value">{{ buildDisplayLocalPath(material.localPath, material.fileName) || '未分类' }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">文件大小：</span>
                <span class="metadata-value">{{ material.fileSize }}M</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">分辨率：</span>
                <span class="metadata-value">{{ material.resolution || '不适用' }}</span>
              </div>
            </div>
          </div>

          <!-- 标签信息 -->
          <h3 class="section-title">标签信息</h3>
          <div class="tags-section">
            <!-- 智能标签 -->
            <div v-if="material.annotationTags && material.annotationTags.length > 0" class="tag-category">
              <h3 class="section-title2">智能标签</h3>
              <div class="tag-items">
                <div class="tag-dimension">
                  <span class="dimension-label">场景分类：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in material.sceneCategory" :key="tag + index" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
                    <el-tag v-if="!(material.sceneCategory && material.sceneCategory.length > 0)" size="small" type="primary" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">人物行为：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in material.characterBehavior || []" :key="tag + index" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
                    <el-tag v-if="!(material.characterBehavior && material.characterBehavior.length > 0)" size="small" type="primary" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">核心物体：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in material.coreObjects || []" :key="tag + index" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
                    <el-tag v-if="!(material.coreObjects && material.coreObjects.length > 0)" size="small" type="primary" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">活动事件：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in material.activityEvent || []" :key="tag + index" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
                    <el-tag v-if="!(material.activityEvent && material.activityEvent.length > 0)" size="small" type="primary" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">文本信息：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in material.textInfo || []" :key="tag + index" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
                    <el-tag v-if="!(material.textInfo && material.textInfo.length > 0)" size="small" type="primary" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">颜色色调：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in material.colorTone || []" :key="tag + index" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
                    <el-tag v-if="!(material.colorTone && material.colorTone.length > 0)" size="small" type="primary" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">拍摄角度：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in material.shootingAngle || []" :key="tag + index" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
                    <el-tag v-if="!(material.shootingAngle && material.shootingAngle.length > 0)" size="small" type="primary" effect="plain">无</el-tag>
                  </div>
                </div>
                <div v-if="material.annotationDescription" class="tag-dimension">
                  <span class="dimension-label">素材描述：</span>
                  <div class="dimension-values">
                    <el-tag size="small" type="primary" effect="plain">
                      {{ material.annotationDescription }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- 基础标签 -->
            <div class="tag-category">
              <h3 class="section-title2">基础标签</h3>
              <div class="tag-items">
                <div class="tag-dimension">
                  <span class="dimension-label">时间信息：</span>
                  <div class="dimension-values">
                    <el-tag v-if="material.timeInfo" size="small" type="success" effect="plain">{{ material.timeInfo }}</el-tag>
                    <el-tag v-else size="small" type="success" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">地点信息：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in (material.locationInfo || '').split(',')" v-if="tag && tag.trim()" :key="index" size="small" type="success" effect="plain">{{ tag.trim() }}</el-tag>
                    <el-tag v-if="!(material.locationInfo && material.locationInfo.trim())" size="small" type="success" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">人物姓名：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in (material.personNames || '').split(',')" v-if="tag && tag.trim()" :key="index" size="small" type="success" effect="plain">{{ tag.trim() }}</el-tag>
                    <el-tag v-if="!(material.personNames && material.personNames.trim())" size="small" type="success" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">建筑名称：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in (material.buildingNames || '').split(',')" v-if="tag && tag.trim()" :key="index" size="small" type="success" effect="plain">{{ tag.trim() }}</el-tag>
                    <el-tag v-if="!(material.buildingNames && material.buildingNames.trim())" size="small" type="success" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">相关主题：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in (material.relatedThemes || '').split(',')" v-if="tag && tag.trim()" :key="index" size="small" type="success" effect="plain">{{ tag.trim() }}</el-tag>
                    <el-tag v-if="!(material.relatedThemes && material.relatedThemes.trim())" size="small" type="success" effect="plain">无</el-tag>
                  </div>
                </div>
                <div class="tag-dimension">
                  <span class="dimension-label">事件信息：</span>
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in (material.eventInfo || '').split(',')" v-if="tag && tag.trim()" :key="index" size="small" type="success" effect="plain">{{ tag.trim() }}</el-tag>
                    <el-tag v-if="!(material.eventInfo && material.eventInfo.trim())" size="small" type="success" effect="plain">无</el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- 补充标签 -->
            <div class="tag-category">
              <h3 class="section-title2">补充标签</h3>
              <div class="tag-items">
                <div class="tag-dimension">
                  <div class="dimension-values">
                    <el-tag v-for="(tag, index) in (material.supplementAnnotation || '').split(',')" v-if="tag && tag.trim()" :key="index" size="small" type="success" effect="plain">{{ tag.trim() }}</el-tag>
                    <el-tag v-if="!(material.supplementAnnotation && material.supplementAnnotation.trim())" size="small" type="success" effect="plain">无</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleDownload">下载素材</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { parseTime } from '@/utils/common'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  material: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'download'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})
const previewReady = ref(false)
const previewMaterial = ref({})

function syncPreviewMaterial() {
  previewMaterial.value = { ...(props.material || {}) }
  previewReady.value = !!previewMaterial.value.minioPath
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      previewReady.value = false
      previewMaterial.value = {}
      return
    }
    previewReady.value = false
    nextTick(() => {
      requestAnimationFrame(() => {
        syncPreviewMaterial()
      })
    })
  }
)

watch(
  () => [props.material?.id, props.material?.minioPath, props.material?.fileName],
  () => {
    if (!props.visible) return
    syncPreviewMaterial()
  }
)

const getProxyPath = (url) => {
  if (!url) return ''
  const u = new URL(url)
  const parts = u.pathname.replace(/^\/+/, '').split('/')
  const bucket = parts.shift()
  const objectKey = parts.join('/')
  const baseApi = import.meta.env.VITE_APP_BASE_API || ''
  const params = new URLSearchParams({
    bucketName: bucket,
    filePath: objectKey
  })
  return `${baseApi}/minio/proxy?${params.toString()}`
}

// 根据文件路径判断文件类型
function getFileType(filePath) {
  if (!filePath) return 'other'
  const lowerPath = filePath.toLowerCase()
  if (/(\.jpg|\.jpeg|\.png|\.gif|\.bmp)$/.test(lowerPath)) {
    return 'image'
  } else if (/(\.mp4|\.avi|\.mov|\.wmv|\.flv|\.m4v)$/.test(lowerPath)) {
    return 'video'
  } else if (/(\.doc|\.docx|\.pdf|\.txt)$/.test(lowerPath)) {
    return 'document'
  } else if (/(\.ppt|\.pptx)$/.test(lowerPath)) {
    return 'ppt'
  }
  return 'other'
}

// 获取文件类型文本
const getFileTypeText = (filePath) => {
  if (!filePath) return '未知类型'

  const dotIndex = filePath.lastIndexOf('.')
  if (dotIndex === -1) return '其他'
  const ext = filePath.substring(dotIndex + 1)
  const typeMap = {
    '图片': ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp', 'svg', 'heic'],
    '视频': ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'webm','m4v'],
    '音频': ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
    'PDF文档': ['pdf'],
    'Word文档': ['doc', 'docx'],
    'Excel文档': ['xls', 'xlsx'],
    'PPT文档': ['ppt', 'pptx'],
    '压缩文件': ['zip', 'rar', '7z', 'tar', 'gz'],
    '文本': ['txt', 'md', 'csv', 'json', 'xml']
  }
  for (const [type, exts] of Object.entries(typeMap)) {
    if (exts.includes(ext.toLowerCase())) {
      return type
    }
  }
  return '其他'
}

// 展示用路径：localPath 最后一个 "/" 前的目录 + fileName
function buildDisplayLocalPath(localPath, fileName) {
  if (!fileName) return localPath || ''
  if (!localPath) return fileName
  const idx = localPath.lastIndexOf('/')
  if (idx === -1) return fileName
  const dir = localPath.substring(0, idx)
  return dir ? `${dir}/${fileName}` : fileName
}

function handleClose() {
  dialogVisible.value = false
}

function handleDownload() {
  emit('download', props.material)
}
</script>

<style scoped lang="scss">
.preview-dialog {
  .preview-content {
    display: flex;
    gap: 24px;
    max-height: 750px;
    overflow-y: auto;
  }
}

.preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-height: 400px;
  padding: 24px;
}

.image-preview,
.video-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #606266;
}

.info-area {
  width: 360px;
  display: flex;
  flex-direction: column;
}

.name-section {
  margin-bottom: 22px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.material-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  word-break: break-all;
}

.metadata-section {
  margin-bottom: 16px;
}

.tags-section {
  margin-bottom: 24px;
  max-height: 550px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c0c4cc #f0f2f5;
}

.section-title {
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.section-title2 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.metadata-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
}

.metadata-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.metadata-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  word-break: break-all;
}

.tag-category {
  margin-bottom: 24px;
}

.tag-items {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.tag-dimension {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.tag-dimension:last-child {
  margin-bottom: 0;
}

.dimension-values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  padding-right: 4px;
}

.dimension-values .el-tag {
  max-width: 100%;
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
  padding: 6px 8px;
  box-sizing: border-box;
  height: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.dimension-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

/* WebKit浏览器滚动条样式 */
.tags-section::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.tags-section::-webkit-scrollbar-track {
  background: #f0f2f5;
  border-radius: 3px;
}

.tags-section::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.tags-section::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .preview-content {
    flex-direction: column;
  }
  
  .info-area {
    width: 100%;
  }
  
  .preview-area {
    min-height: 300px;
  }
}
</style>
