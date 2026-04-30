<template>
  <div class="app-container">
    <div class="video-creation">
      <aside class="control-pane">
        <section class="panel">
          <div class="panel-title">
            <el-icon><Film /></el-icon>
            <span>视频创作</span>
          </div>

          <el-form label-position="top">
            <el-form-item label="文案内容">
              <el-input
                v-model="form.script"
                type="textarea"
                :rows="10"
                maxlength="5000"
                show-word-limit
                placeholder="请输入需要生成视频的长文案"
              />
            </el-form-item>

            <div class="form-grid">
              <el-form-item label="目标分镜">
                <el-input-number v-model="form.targetShotCount" :min="0" :max="20" controls-position="right" />
              </el-form-item>
              <el-form-item label="镜头秒数">
                <el-input-number v-model="form.defaultDuration" :min="1" :max="30" controls-position="right" />
              </el-form-item>
              <el-form-item label="候选数量">
                <el-input-number v-model="form.topK" :min="1" :max="20" controls-position="right" />
              </el-form-item>
            </div>
          </el-form>

          <div class="action-stack">
            <el-button type="primary" :loading="storyboardLoading" @click="handleGenerateStoryboard">
              <el-icon><Tickets /></el-icon>
              生成分镜
            </el-button>
            <el-button :loading="assetLoading" :disabled="shots.length === 0" @click="handleSearchAssets">
              <el-icon><Search /></el-icon>
              匹配素材
            </el-button>
            <el-button plain :disabled="busy" @click="resetWorkspace">
              <el-icon><RefreshRight /></el-icon>
              清空
            </el-button>
          </div>
        </section>

        <section class="panel summary-panel">
          <div class="panel-title">
            <el-icon><VideoCamera /></el-icon>
            <span>已选素材</span>
          </div>

          <el-empty v-if="selectedShots.length === 0" :image-size="80" description="暂无已选素材" />
          <div v-else class="selected-list">
            <div v-for="shot in selectedShots" :key="shot.shotNo" class="selected-row">
              <span class="selected-index">{{ shot.shotNo }}</span>
              <div>
                <strong>{{ selectedMaterialName(shot) }}</strong>
                <p>{{ shot.text }}</p>
              </div>
            </div>
          </div>

          <el-button type="success" disabled class="compose-btn">
            <el-icon><VideoPlay /></el-icon>
            生成视频
          </el-button>
        </section>
      </aside>

      <main class="storyboard-pane">
        <div class="storyboard-header">
          <div>
            <h2>分镜工作台</h2>
            <p>{{ shots.length }} 个分镜，{{ selectedShots.length }} 个已选素材</p>
          </div>
          <el-tag v-if="shots.length > 0" type="success" effect="plain">{{ allShotsSelected ? '素材已就绪' : '待选择素材' }}</el-tag>
        </div>

        <el-empty v-if="shots.length === 0" :image-size="120" description="先生成分镜" />

        <div v-else class="shot-list">
          <article v-for="shot in shots" :key="shot.shotNo" class="shot-card">
            <div class="shot-main">
              <div class="shot-index">{{ shot.shotNo }}</div>
              <div class="shot-copy">
                <div class="shot-title">
                  <h3>{{ shot.text || `分镜 ${shot.shotNo}` }}</h3>
                  <el-tag size="small" effect="plain">{{ shot.duration || form.defaultDuration }}s</el-tag>
                </div>
                <p v-if="shot.visualDescription">{{ shot.visualDescription }}</p>
                <el-input v-model="shot.searchQuery" size="small" placeholder="检索词" />
              </div>
            </div>

            <div v-if="shot.candidates && shot.candidates.length > 0" class="candidate-grid">
              <button
                v-for="candidate in shot.candidates"
                :key="candidate.id"
                class="candidate-card"
                :class="{ selected: candidate.id === shot.selectedMaterialId }"
                @click="selectCandidate(shot, candidate)"
              >
                <div class="candidate-preview">
                  <img
                    v-if="candidate.coverPath"
                    :src="getProxyPath(candidate.coverPath)"
                    :alt="candidate.fileName"
                  />
                  <video
                    v-else-if="candidate.minioPath"
                    :src="getProxyPath(candidate.minioPath)"
                    muted
                    preload="metadata"
                  />
                  <div v-else class="empty-thumb">
                    <el-icon><VideoCamera /></el-icon>
                  </div>
                  <span v-if="candidate.id === shot.selectedMaterialId" class="selected-mark">
                    <el-icon><Check /></el-icon>
                  </span>
                </div>
                <div class="candidate-info">
                  <strong>{{ candidate.fileName || `素材 ${candidate.id}` }}</strong>
                  <span>{{ candidate.fileResolution || '未知分辨率' }}</span>
                </div>
              </button>
            </div>

            <div v-else class="candidate-empty">
              <el-icon><Warning /></el-icon>
              <span>{{ assetSearched ? '当前分镜暂无视频候选' : '尚未匹配素材' }}</span>
            </div>
          </article>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup name="AICreationVideo">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Film, RefreshRight, Search, Tickets, VideoCamera, VideoPlay, Warning } from '@element-plus/icons-vue'
import { generateStoryboard, searchShotAssets } from '@/api/xcsc/videoCreation'

const storyboardLoading = ref(false)
const assetLoading = ref(false)
const assetSearched = ref(false)
const shots = ref([])

const form = reactive({
  script: '',
  targetShotCount: 0,
  defaultDuration: 5,
  topK: 5
})

const busy = computed(() => storyboardLoading.value || assetLoading.value)

const selectedShots = computed(() => {
  return shots.value.filter(shot => shot.selectedMaterialId)
})

const allShotsSelected = computed(() => {
  return shots.value.length > 0 && selectedShots.value.length === shots.value.length
})

const handleGenerateStoryboard = async () => {
  if (!form.script.trim()) {
    ElMessage.warning('请输入文案内容')
    return
  }

  storyboardLoading.value = true
  assetSearched.value = false
  try {
    const res = await generateStoryboard({
      script: form.script.trim(),
      targetShotCount: form.targetShotCount || null,
      defaultDuration: form.defaultDuration
    })
    const nextShots = Array.isArray(res?.data?.shots) ? res.data.shots : []
    shots.value = nextShots.map((shot, index) => ({
      shotNo: shot.shotNo || index + 1,
      text: shot.text || '',
      visualDescription: shot.visualDescription || '',
      searchQuery: shot.searchQuery || shot.visualDescription || shot.text || '',
      duration: shot.duration || form.defaultDuration,
      selectedMaterialId: shot.selectedMaterialId || null,
      candidates: Array.isArray(shot.candidates) ? shot.candidates : []
    }))

    if (shots.value.length === 0) {
      ElMessage.warning('未生成有效分镜')
      return
    }
    ElMessage.success('分镜生成完成')
  } catch (error) {
    console.error('生成分镜失败:', error)
    ElMessage.error('生成分镜失败')
  } finally {
    storyboardLoading.value = false
  }
}

const handleSearchAssets = async () => {
  if (shots.value.length === 0) {
    ElMessage.warning('请先生成分镜')
    return
  }

  assetLoading.value = true
  try {
    const res = await searchShotAssets({
      topK: form.topK,
      shots: shots.value.map(shot => ({
        shotNo: shot.shotNo,
        text: shot.text,
        visualDescription: shot.visualDescription,
        searchQuery: shot.searchQuery,
        duration: shot.duration
      }))
    })
    const nextShots = Array.isArray(res?.data?.shots) ? res.data.shots : []
    shots.value = nextShots.map((shot, index) => ({
      shotNo: shot.shotNo || index + 1,
      text: shot.text || '',
      visualDescription: shot.visualDescription || '',
      searchQuery: shot.searchQuery || '',
      duration: shot.duration || form.defaultDuration,
      selectedMaterialId: shot.selectedMaterialId || null,
      candidates: Array.isArray(shot.candidates) ? shot.candidates : []
    }))
    assetSearched.value = true
    ElMessage.success('素材匹配完成')
  } catch (error) {
    console.error('匹配素材失败:', error)
    ElMessage.error('匹配素材失败')
  } finally {
    assetLoading.value = false
  }
}

const selectCandidate = (shot, candidate) => {
  shot.selectedMaterialId = candidate.id
}

const selectedMaterialName = (shot) => {
  const material = (shot.candidates || []).find(item => item.id === shot.selectedMaterialId)
  return material?.fileName || `素材 ${shot.selectedMaterialId}`
}

const resetWorkspace = () => {
  form.script = ''
  form.targetShotCount = 0
  form.defaultDuration = 5
  form.topK = 5
  shots.value = []
  assetSearched.value = false
}

const getProxyPath = (url = '') => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.replace(/^\/+/, '').split('/')
    const bucket = parts.shift()
    const objectKey = parts.join('/')
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
</script>

<style scoped lang="scss">
.video-creation {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.control-pane,
.storyboard-pane {
  min-width: 0;
}

.control-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel,
.storyboard-pane,
.shot-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.panel {
  padding: 14px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  :deep(.el-input-number) {
    width: 100%;
  }
}

.action-stack {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;

  .el-button {
    width: 100%;
    margin-left: 0;
  }
}

.summary-panel {
  position: sticky;
  top: 12px;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
}

.selected-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
  padding: 8px;
  border: 1px solid #eef2f7;
  border-radius: 6px;
  background: #f8fafc;

  strong,
  p {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 13px;
    color: #111827;
  }

  p {
    margin: 3px 0 0;
    font-size: 12px;
    color: #64748b;
  }
}

.selected-index {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ecfdf5;
  color: #047857;
  font-size: 12px;
  font-weight: 700;
}

.compose-btn {
  width: 100%;
  margin-top: 12px;
}

.storyboard-pane {
  padding: 16px;
}

.storyboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h2 {
    margin: 0;
    font-size: 18px;
    color: #111827;
  }

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 13px;
  }
}

.shot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shot-card {
  padding: 14px;
}

.shot-main {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.shot-index {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
}

.shot-copy {
  min-width: 0;

  p {
    margin: 6px 0 10px;
    color: #475569;
    font-size: 13px;
    line-height: 1.6;
  }
}

.shot-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: #1f2937;
  }
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 10px;
}

.candidate-card {
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;

  &:hover,
  &.selected {
    border-color: #409eff;
    box-shadow: 0 8px 20px rgba(64, 158, 255, 0.12);
  }
}

.candidate-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0f172a;

  img,
  video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
}

.empty-thumb {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 34px;
}

.selected-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
}

.candidate-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;

  strong,
  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 13px;
    color: #1f2937;
  }

  span {
    font-size: 12px;
    color: #64748b;
  }
}

.candidate-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  background: #f8fafc;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

@media (max-width: 1180px) {
  .video-creation {
    grid-template-columns: 1fr;
  }

  .summary-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .form-grid,
  .candidate-grid {
    grid-template-columns: 1fr;
  }

  .storyboard-header,
  .shot-title {
    flex-direction: column;
  }
}
</style>
