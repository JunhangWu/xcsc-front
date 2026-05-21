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
              <el-form-item label="分镜个数">
                <el-input-number v-model="form.targetShotCount" :min="1" :max="20" controls-position="right" />
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

          <el-button
            type="primary"
            class="compose-btn"
            :loading="composeSubmitting"
            :disabled="!allShotsSelected || composeRunning"
            @click="handleComposeVideo"
          >
            <el-icon><VideoPlay /></el-icon>
            生成视频
          </el-button>

          <div v-if="composeTask" class="task-card">
            <div class="task-title">
              <span>{{ composeTaskTitle }}</span>
              <el-tag size="small" :type="composeTaskTagType" effect="plain">{{ composeTask.status }}</el-tag>
            </div>
            <el-progress :percentage="composeProgress" :status="composeProgressStatus" />
            <p>{{ composeTask.errorMessage || composeTask.message || '等待任务更新' }}</p>
            <div class="task-meta">
              <span>任务 ID</span>
              <strong>{{ composeTask.taskId }}</strong>
            </div>
          </div>

          <div v-if="composeResultUrl" class="result-card">
            <video :src="composePreviewUrl" controls preload="metadata" />
            <div class="result-meta">
              <span>成片结果 ID</span>
              <strong>{{ composeTask.outputMaterialId || '保存中' }}</strong>
            </div>
            <div class="result-actions">
              <el-link :href="composePreviewUrl" target="_blank" type="primary">预览成片</el-link>
              <el-button size="small" :disabled="!composePreviewUrl" @click="handleDownloadResult">
                下载成片
              </el-button>
            </div>
          </div>
        </section>
      </aside>

      <main class="storyboard-pane">
        <div class="storyboard-header">
          <div>
            <h2>分镜工作台</h2>
            <p>{{ shots.length }} 个分镜，{{ selectedShots.length }} 个已选素材</p>
          </div>
          <el-tag v-if="shots.length > 0" type="success" effect="plain">
            {{ allShotsSelected ? '素材已就绪' : '待选择素材' }}
          </el-tag>
        </div>

        <el-empty v-if="shots.length === 0" :image-size="120" description="先生成分镜" />

        <div v-else class="shot-list">
          <article v-for="shot in shots" :key="shot.shotNo" class="shot-card">
            <div class="shot-main">
              <div class="shot-index">{{ shot.shotNo }}</div>
              <div class="shot-copy">
                <div class="shot-title">
                  <h3>{{ shot.text || `分镜 ${shot.shotNo}` }}</h3>
                </div>
                <p v-if="shot.visualDescription" class="shot-visual">{{ shot.visualDescription }}</p>
                <div class="shot-tag-panel">
                  <div class="shot-tags-header">
                    <span>检索标签</span>
                    <em>已选 {{ selectedTagCount(shot) }} / {{ tagCount(shot) }}</em>
                  </div>
                  <div v-if="shot.tags && shot.tags.length > 0" class="shot-tags">
                    <el-check-tag
                      v-for="tag in shot.tags"
                      :key="tag"
                      :class="[
                        isCustomShotTag(shot, tag) ? 'custom-tag' : 'generated-tag',
                        isShotTagSelected(shot, tag) ? 'is-selected-tag' : 'is-unselected-tag'
                      ]"
                      :checked="isShotTagSelected(shot, tag)"
                      :disabled="composeRunning || isShotMatching(shot) || isShotTagExtracting(shot)"
                      @change="checked => toggleShotTag(shot, tag, checked)"
                    >
                      <span>{{ tag }}</span>
                      <el-icon
                        v-if="isShotTagSelected(shot, tag)"
                        class="shot-tag-check"
                      >
                        <Check />
                      </el-icon>
                      <el-icon
                        v-if="isCustomShotTag(shot, tag)"
                        class="shot-tag-remove"
                        @click.stop="removeShotTag(shot, tag)"
                      >
                        <Close />
                      </el-icon>
                    </el-check-tag>
                  </div>
                </div>
                <div class="shot-tag-add">
                  <div class="shot-tag-inputs">
                    <el-input
                      v-model="shot.tagDraft"
                      size="small"
                      maxlength="20"
                      clearable
                      placeholder="新增检索标签"
                      :disabled="composeRunning || isShotMatching(shot) || isShotTagExtracting(shot)"
                      @keyup.enter="addShotTag(shot)"
                    />
                    <el-button
                      size="small"
                      type="primary"
                      plain
                      :disabled="composeRunning || isShotMatching(shot) || isShotTagExtracting(shot) || !normalizeTag(shot.tagDraft)"
                      @click="addShotTag(shot)"
                    >
                      添加
                    </el-button>
                  </div>
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    :loading="isShotTagExtracting(shot)"
                    :disabled="composeRunning || isShotMatching(shot) || !shot.text"
                    @click="handleExtractShotTags(shot)"
                  >
                    <el-icon><Tickets /></el-icon>
                    提取 tag
                  </el-button>
                </div>
                <div class="shot-scope">
                  <label class="scope-field scope-folder">
                    <span>文件夹</span>
                    <el-select
                      v-model="shot.folderId"
                      class="shot-folder-select"
                      size="small"
                      filterable
                      clearable
                      placeholder="选择一级文件夹"
                      :loading="folderOptionsLoading"
                      :disabled="composeRunning || isShotMatching(shot) || isShotTagExtracting(shot)"
                      @change="handleShotSearchScopeChange(shot)"
                    >
                      <el-option
                        v-for="folder in rootFolderOptions"
                        :key="folder.value"
                        :label="folder.label"
                        :value="folder.value"
                      />
                    </el-select>
                  </label>
                  <label class="scope-field scope-date">
                    <span>开始日期</span>
                    <el-date-picker
                      v-model="shot.dateRange[0]"
                      class="shot-date-input"
                      size="small"
                      type="date"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      placeholder="开始日期"
                      clearable
                      :disabled="composeRunning || isShotMatching(shot) || isShotTagExtracting(shot)"
                      @change="handleShotSearchScopeChange(shot)"
                    />
                  </label>
                  <label class="scope-field scope-date">
                    <span>结束日期</span>
                    <el-date-picker
                      v-model="shot.dateRange[1]"
                      class="shot-date-input"
                      size="small"
                      type="date"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      placeholder="结束日期"
                      clearable
                      :disabled="composeRunning || isShotMatching(shot) || isShotTagExtracting(shot)"
                      @change="handleShotSearchScopeChange(shot)"
                    />
                  </label>
                  <label class="scope-field scope-mode">
                    <span>匹配方式</span>
                    <el-select
                      v-model="shot.searchMode"
                      class="shot-match-mode-select"
                      size="small"
                      :disabled="composeRunning || isShotMatching(shot) || isShotTagExtracting(shot)"
                      @change="handleShotSearchModeChange(shot)"
                    >
                      <el-option
                        v-for="mode in MATCH_MODE_OPTIONS"
                        :key="mode.value"
                        :label="mode.label"
                        :value="mode.value"
                      />
                    </el-select>
                  </label>
                  <div class="scope-action">
                    <el-tooltip
                      content="请至少选择一个检索标签"
                      placement="top"
                      :disabled="hasSelectedTags(shot)"
                    >
                      <span class="match-tooltip-wrap">
                        <el-button
                          type="primary"
                          size="small"
                          class="match-btn"
                          :loading="isShotMatching(shot)"
                          :disabled="composeRunning || isShotTagExtracting(shot) || !hasSelectedTags(shot)"
                          @click="handleSearchShotAssets(shot)"
                        >
                          <el-icon><Search /></el-icon>
                          匹配素材
                        </el-button>
                      </span>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="shot.candidates && shot.candidates.length > 0" class="candidate-grid">
              <div
                v-for="candidate in shot.candidates"
                :key="candidate.id"
                class="candidate-card"
                :class="{ selected: candidate.id === shot.selectedMaterialId, disabled: composeRunning }"
                role="button"
                tabindex="0"
                @click="selectCandidate(shot, candidate)"
                @keydown.enter.prevent="selectCandidate(shot, candidate)"
              >
                <div class="candidate-preview">
                  <img
                    v-if="candidateCoverUrl(candidate)"
                    :src="candidateCoverUrl(candidate)"
                    alt=""
                    @error="handleCandidatePreviewError(candidate, 'cover')"
                  />
                  <video
                    v-else-if="candidateVideoUrl(candidate)"
                    :src="candidateVideoUrl(candidate)"
                    muted
                    preload="metadata"
                    playsinline
                    @loadedmetadata="handleCandidateDurationLoaded(candidate, $event)"
                    @error="handleCandidatePreviewError(candidate, 'video')"
                  />
                  <div v-else class="empty-thumb">
                    <el-icon><VideoCamera /></el-icon>
                  </div>
                  <video
                    v-if="candidateCoverUrl(candidate) && candidateVideoUrl(candidate) && !candidate.durationLoaded"
                    class="metadata-probe"
                    :src="candidateVideoUrl(candidate)"
                    preload="metadata"
                    aria-hidden="true"
                    @loadedmetadata="handleCandidateDurationLoaded(candidate, $event)"
                    @error="handleCandidatePreviewError(candidate, 'video')"
                  />
                  <span v-if="candidate.id === shot.selectedMaterialId" class="selected-mark">
                    <el-icon><Check /></el-icon>
                  </span>
                </div>
                <div class="candidate-info">
                  <strong>{{ candidate.fileName || `素材 ${candidate.id}` }}</strong>
                  <div class="candidate-meta">
                    <span>大小 {{ formatCandidateSize(candidate.fileSize) }}</span>
                    <span>格式 {{ candidate.fileType || candidateFileType(candidate) }}</span>
                    <span>时长 {{ formatCandidateDuration(candidate.durationSeconds) }}</span>
                  </div>
                  <div class="candidate-actions">
                    <el-button size="small" text type="primary" @click.stop="previewCandidate(candidate)">
                      <el-icon><View /></el-icon>
                      预览
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="candidate-empty">
              <el-icon><Warning /></el-icon>
              <span>{{ shot.assetSearched ? '当前分镜暂无视频候选' : '尚未匹配素材' }}</span>
            </div>
          </article>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup name="AICreationVideo">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Close, Film, RefreshRight, Search, Tickets, VideoCamera, VideoPlay, View, Warning } from '@element-plus/icons-vue'
import { getDeptCategoryList } from '@/api/xcsc/uploadFile'
import {
  composeVideo,
  extractShotTags,
  generateStoryboard,
  getVideoComposeTask,
  searchShotAssets
} from '@/api/xcsc/videoCreation'
import useUserStore from '@/store/modules/user'

const LAST_TASK_KEY = 'xcsc_video_creation_last_task_id'

const router = useRouter()
const userStore = useUserStore()
const storyboardLoading = ref(false)
const composeSubmitting = ref(false)
const shotMatchLoading = reactive({})
const shotTagLoading = reactive({})
const shots = ref([])
const composeTask = ref(null)
const composeTimer = ref(null)
const rootFolderOptions = ref([])
const folderOptionsLoading = ref(false)

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'webm', 'm4v']
const DEFAULT_SEARCH_MODE = 'keyword'
const MATCH_MODE_OPTIONS = [
  { label: '标签匹配', value: DEFAULT_SEARCH_MODE },
  { label: 'Milvus检索', value: 'milvus' }
]

const form = reactive({
  script: '',
  targetShotCount: 2,
  topK: 5,
  resolution: 'original'
})

const composeRunning = computed(() => {
  return ['PENDING', 'RUNNING'].includes(composeTask.value?.status)
})

const busy = computed(() => {
  return storyboardLoading.value || anyShotMatching.value || anyShotTagExtracting.value || composeSubmitting.value || composeRunning.value
})

const anyShotMatching = computed(() => {
  return Object.values(shotMatchLoading).some(Boolean)
})

const anyShotTagExtracting = computed(() => {
  return Object.values(shotTagLoading).some(Boolean)
})

const isAdmin = computed(() => {
  const user = userStore.user
  const objectRoles = user?.roles?.some(role => role.roleKey === 'admin' || role.roleKey === 'studio')
  const stringRoles = userStore.roles?.some(role => role === 'admin' || role === 'studio')
  return objectRoles || stringRoles
})

const selectedShots = computed(() => {
  return shots.value.filter(shot => shot.selectedMaterialId)
})

const allShotsSelected = computed(() => {
  return shots.value.length > 0 && selectedShots.value.length === shots.value.length
})

const composeResultUrl = computed(() => {
  return composeTask.value?.status === 'SUCCESS' ? composeTask.value.outputUrl : ''
})

const composePreviewUrl = computed(() => {
  return composeResultUrl.value ? getProxyPath(composeResultUrl.value) : ''
})

const composeProgress = computed(() => {
  const progress = Number(composeTask.value?.progress || 0)
  return Math.max(0, Math.min(100, progress))
})

const composeProgressStatus = computed(() => {
  if (composeTask.value?.status === 'SUCCESS') return 'success'
  if (composeTask.value?.status === 'FAILED') return 'exception'
  return undefined
})

const composeTaskTagType = computed(() => {
  if (composeTask.value?.status === 'SUCCESS') return 'success'
  if (composeTask.value?.status === 'FAILED') return 'danger'
  return 'warning'
})

const composeTaskTitle = computed(() => {
  if (composeTask.value?.status === 'SUCCESS') return '成片已生成'
  if (composeTask.value?.status === 'FAILED') return '合成失败'
  return '视频合成中'
})

const composeDownloadName = computed(() => {
  const taskId = composeTask.value?.taskId || Date.now()
  return `video-creation-${taskId}.mp4`
})

const handleGenerateStoryboard = async () => {
  if (!form.script.trim()) {
    ElMessage.warning('请输入文案内容')
    return
  }

  clearComposeState()
  clearShotMatchLoading()
  clearShotTagLoading()
  storyboardLoading.value = true
  try {
    const res = await generateStoryboard({
      script: form.script.trim(),
      targetShotCount: form.targetShotCount
    })
    const nextShots = Array.isArray(res?.data?.shots) ? res.data.shots : []
    shots.value = normalizeStoryboardShots(nextShots)

    if (shots.value.length === 0) {
      ElMessage.warning('未生成有效分镜')
      return
    }
    ElMessage.success('分镜生成完成')
  } catch (error) {
    console.error('生成分镜失败:', error)
    ElMessage.error(error?.message || error?.msg || '生成分镜失败')
  } finally {
    storyboardLoading.value = false
  }
}

const handleSearchShotAssets = async (shot) => {
  if (!shot) return
  if (!hasSelectedTags(shot)) {
    ElMessage.warning('请先选择用于检索的标签')
    return
  }
  if (!shot.folderId) {
    ElMessage.warning('请先选择素材文件夹')
    return
  }

  clearComposeState()
  shotMatchLoading[shot.shotNo] = true
  try {
    const [createStartTime, createEndTime] = shotDateRangeParams(shot)
    const res = await searchShotAssets({
      topK: form.topK,
      searchMode: shot.searchMode || DEFAULT_SEARCH_MODE,
      shots: [{
        shotNo: shot.shotNo,
        text: shot.text,
        visualDescription: shot.visualDescription,
        tags: shot.selectedTags,
        folderId: shot.folderId,
        createStartTime,
        createEndTime
      }]
    })
    const matchedShot = Array.isArray(res?.data?.shots) ? res.data.shots[0] : null
    const candidates = normalizeCandidates(matchedShot?.candidates || [])
    shot.candidates = candidates
    shot.selectedMaterialId = matchedShot?.selectedMaterialId || candidates[0]?.id || null
    shot.assetSearched = true
    ElMessage.success(`分镜 ${shot.shotNo} 素材匹配完成`)
  } catch (error) {
    console.error('匹配素材失败:', error)
    ElMessage.error(error?.message || error?.msg || '匹配素材失败')
  } finally {
    shotMatchLoading[shot.shotNo] = false
  }
}

const handleExtractShotTags = async (shot) => {
  if (!shot?.text) {
    ElMessage.warning('当前分镜文案为空，无法提取 tag')
    return
  }

  clearComposeState()
  shotTagLoading[shot.shotNo] = true
  try {
    const res = await extractShotTags({
      shotNo: shot.shotNo,
      text: shot.text
    })
    const tags = uniqueTags(res?.data?.tags || [])
    shot.generatedTags = tags
    shot.customTags = uniqueTags(shot.customTags).filter(tag => !tags.includes(tag))
    shot.tags = mergeShotTags(shot.generatedTags, shot.customTags)
    shot.selectedTags = uniqueTags(shot.selectedTags).filter(tag => shot.tags.includes(tag))
    resetShotAssets(shot)
    if (tags.length === 0) {
      ElMessage.warning(`分镜 ${shot.shotNo} 未提取到有效 tag`)
      return
    }
    ElMessage.success(`分镜 ${shot.shotNo} tag 提取完成`)
  } catch (error) {
    console.error('提取 tag 失败:', error)
    ElMessage.error(error?.message || error?.msg || '提取 tag 失败')
  } finally {
    shotTagLoading[shot.shotNo] = false
  }
}

const handleComposeVideo = async () => {
  if (!allShotsSelected.value) {
    ElMessage.warning('请为每个分镜选择视频素材')
    return
  }
  const unsupportedShot = shots.value.find(shot => {
    const material = (shot.candidates || []).find(item => item.id === shot.selectedMaterialId)
    return material && !isVideoCandidate(material)
  })
  if (unsupportedShot) {
    ElMessage.warning(`分镜 ${unsupportedShot.shotNo} 当前选择的素材不是视频，暂不能合成`)
    return
  }

  clearComposeState()
  composeSubmitting.value = true
  try {
    const res = await composeVideo({
      title: form.script.trim().slice(0, 40) || '视频创作',
      resolution: form.resolution,
      shots: shots.value.map(shot => ({
        shotNo: shot.shotNo,
        text: shot.text,
        materialId: shot.selectedMaterialId
      }))
    })
    const task = res?.data?.task
    if (!task?.taskId) {
      ElMessage.error('合成任务提交失败')
      return
    }
    composeTask.value = task
    saveLastTask(task.taskId)
    startComposePolling(task.taskId)
    ElMessage.success('视频合成任务已提交')
  } catch (error) {
    console.error('提交合成任务失败:', error)
    ElMessage.error(error?.message || error?.msg || '提交合成任务失败')
  } finally {
    composeSubmitting.value = false
  }
}

const startComposePolling = (taskId) => {
  clearComposeTimer()
  composeTimer.value = window.setInterval(() => {
    refreshComposeTask(taskId)
  }, 2000)
  refreshComposeTask(taskId, false)
}

const refreshComposeTask = async (taskId, showToast = true) => {
  try {
    const res = await getVideoComposeTask(taskId)
    const task = res?.data?.task
    if (!task) return
    composeTask.value = task
    saveLastTask(task.taskId)
    if (task.status === 'SUCCESS') {
      clearComposeTimer()
      if (showToast) ElMessage.success('视频合成完成')
    } else if (task.status === 'FAILED') {
      clearComposeTimer()
      if (showToast) ElMessage.error(task.errorMessage || '视频合成失败')
    }
  } catch (error) {
    console.error('查询合成任务失败:', error)
  }
}

const restoreLastTask = async () => {
  const taskId = window.localStorage.getItem(LAST_TASK_KEY)
  if (!taskId) return
  await refreshComposeTask(taskId, false)
  if (composeRunning.value) {
    startComposePolling(taskId)
  }
}

const clearComposeTimer = () => {
  if (composeTimer.value) {
    window.clearInterval(composeTimer.value)
    composeTimer.value = null
  }
}

const clearComposeState = () => {
  clearComposeTimer()
  composeTask.value = null
  window.localStorage.removeItem(LAST_TASK_KEY)
}

const saveLastTask = (taskId) => {
  if (taskId) {
    window.localStorage.setItem(LAST_TASK_KEY, taskId)
  }
}

const normalizeCandidates = (candidates = []) => {
  return Array.isArray(candidates)
    ? candidates.map(candidate => ({
      ...candidate,
      durationSeconds: Number.isFinite(Number(candidate.durationSeconds ?? candidate.duration))
        ? Number(candidate.durationSeconds ?? candidate.duration)
        : null,
      durationLoaded: false,
      coverLoadFailed: false,
      videoLoadFailed: false
    }))
    : []
}

const normalizeTag = (tag = '') => String(tag ?? '').trim()

const uniqueTags = (tags = []) => {
  const seen = new Set()
  return (Array.isArray(tags) ? tags : [])
    .map(normalizeTag)
    .filter(tag => {
      if (!tag || seen.has(tag)) return false
      seen.add(tag)
      return true
    })
}

const mergeShotTags = (generatedTags = [], customTags = []) => {
  return uniqueTags([...generatedTags, ...customTags])
}

const resetShotAssets = (shot) => {
  shot.candidates = []
  shot.selectedMaterialId = null
  shot.assetSearched = false
  clearComposeState()
}

const normalizeStoryboardShots = (nextShots = []) => {
  return nextShots.map((shot, index) => {
    const candidates = normalizeCandidates(shot.candidates)
    return {
      shotNo: shot.shotNo || index + 1,
      text: shot.text || '',
      visualDescription: shot.visualDescription || '',
      generatedTags: [],
      customTags: [],
      tags: [],
      selectedTags: [],
      tagDraft: shot.tagDraft || '',
      folderId: shot.folderId || '',
      dateRange: Array.isArray(shot.dateRange) ? shot.dateRange : [],
      searchMode: shot.searchMode || DEFAULT_SEARCH_MODE,
      assetSearched: Boolean(shot.assetSearched || candidates.length > 0),
      selectedMaterialId: shot.selectedMaterialId || null,
      candidates
    }
  })
}

const isShotMatching = (shot) => {
  return Boolean(shot && shotMatchLoading[shot.shotNo])
}

const isShotTagExtracting = (shot) => {
  return Boolean(shot && shotTagLoading[shot.shotNo])
}

const hasSelectedTags = (shot) => {
  return Array.isArray(shot?.selectedTags) && shot.selectedTags.length > 0
}

const selectedTagCount = (shot) => {
  return Array.isArray(shot?.selectedTags) ? shot.selectedTags.length : 0
}

const tagCount = (shot) => {
  return Array.isArray(shot?.tags) ? shot.tags.length : 0
}

const isShotTagSelected = (shot, tag) => {
  return Array.isArray(shot?.selectedTags) && shot.selectedTags.includes(tag)
}

const isCustomShotTag = (shot, tag) => {
  return Array.isArray(shot?.customTags) && shot.customTags.includes(tag)
}

const toggleShotTag = (shot, tag, checked) => {
  if (!shot || composeRunning.value || isShotMatching(shot) || isShotTagExtracting(shot)) return
  const selected = new Set(Array.isArray(shot.selectedTags) ? shot.selectedTags : [])
  if (checked) {
    selected.add(tag)
  } else {
    selected.delete(tag)
  }
  shot.selectedTags = (shot.tags || []).filter(item => selected.has(item))
  resetShotAssets(shot)
}

const addShotTag = (shot) => {
  if (!shot || composeRunning.value || isShotMatching(shot) || isShotTagExtracting(shot)) return
  const tag = normalizeTag(shot.tagDraft)
  if (!tag) return

  const tags = Array.isArray(shot.tags) ? shot.tags : []
  if (tags.includes(tag)) {
    const wasSelected = isShotTagSelected(shot, tag)
    shot.selectedTags = uniqueTags([...(shot.selectedTags || []), tag]).filter(item => tags.includes(item))
    shot.tagDraft = ''
    if (!wasSelected) resetShotAssets(shot)
    ElMessage.warning('标签已存在，已为你选中')
    return
  }

  shot.customTags = uniqueTags([...(shot.customTags || []), tag])
  shot.tags = mergeShotTags(shot.generatedTags || [], shot.customTags)
  shot.selectedTags = uniqueTags([...(shot.selectedTags || []), tag]).filter(item => shot.tags.includes(item))
  shot.tagDraft = ''
  resetShotAssets(shot)
}

const removeShotTag = (shot, tag) => {
  if (!shot || composeRunning.value || isShotMatching(shot) || isShotTagExtracting(shot) || !isCustomShotTag(shot, tag)) return
  shot.customTags = (shot.customTags || []).filter(item => item !== tag)
  shot.tags = mergeShotTags(shot.generatedTags || [], shot.customTags)
  shot.selectedTags = (shot.selectedTags || []).filter(item => item !== tag && shot.tags.includes(item))
  resetShotAssets(shot)
}

const handleShotSearchScopeChange = (shot) => {
  if (!shot || isShotMatching(shot)) return
  resetShotAssets(shot)
}

const handleShotSearchModeChange = (shot) => {
  if (!shot || isShotMatching(shot)) return
  resetShotAssets(shot)
}

const shotDateRangeParams = (shot = {}) => {
  const range = Array.isArray(shot.dateRange) ? shot.dateRange : []
  const start = range[0] ? `${range[0]} 00:00:00` : null
  const end = range[1] ? `${range[1]} 23:59:59` : null
  return [start, end]
}

const canUseFolderOption = (dept = {}) => {
  if (!dept.rootFolderId) return false
  if (isAdmin.value) return true
  return Number(dept.deptId) === Number(userStore.deptId) || dept.leader === 'all'
}

const loadRootFolderOptions = async () => {
  folderOptionsLoading.value = true
  try {
    const res = await getDeptCategoryList()
    const list = Array.isArray(res?.data) ? res.data : []
    rootFolderOptions.value = list
      .filter(canUseFolderOption)
      .map(dept => ({
        label: dept.deptName || dept.folderName || dept.rootFolderId,
        value: dept.rootFolderId
      }))
  } catch (error) {
    console.error('加载素材文件夹失败:', error)
    ElMessage.error('加载素材文件夹失败')
  } finally {
    folderOptionsLoading.value = false
  }
}

const clearShotMatchLoading = () => {
  Object.keys(shotMatchLoading).forEach(key => {
    delete shotMatchLoading[key]
  })
}

const clearShotTagLoading = () => {
  Object.keys(shotTagLoading).forEach(key => {
    delete shotTagLoading[key]
  })
}

const selectCandidate = (shot, candidate) => {
  if (composeRunning.value) return
  shot.selectedMaterialId = candidate.id
  clearComposeState()
}

const selectedMaterialName = (shot) => {
  const material = (shot.candidates || []).find(item => item.id === shot.selectedMaterialId)
  return material?.fileName || `素材 ${shot.selectedMaterialId}`
}

const handleDownloadResult = async () => {
  const url = composePreviewUrl.value
  if (!url) return
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })
    if (!response.ok) {
      throw new Error(`server responded ${response.status}`)
    }
    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = composeDownloadName.value
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(objectUrl)
    ElMessage.success('成片下载已开始')
  } catch (error) {
    console.error('下载成片失败:', error)
    ElMessage.error('下载成片失败，请稍后重试')
  }
}

const resetWorkspace = () => {
  clearComposeState()
  clearShotMatchLoading()
  clearShotTagLoading()
  form.script = ''
  form.targetShotCount = 2
  form.topK = 5
  form.resolution = 'original'
  shots.value = []
}

const getProxyPath = (url = '') => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.replace(/^\/+/, '').split('/')
    let bucket = parts.shift()
    if (bucket && bucket.toLowerCase().includes('minio') && parts.length > 1) {
      bucket = parts.shift()
    }
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

const candidateCoverUrl = (candidate = {}) => {
  if (!candidate.coverPath || candidate.coverLoadFailed) return ''
  return getProxyPath(candidate.coverPath)
}

const candidateVideoUrl = (candidate = {}) => {
  if (!candidate.minioPath || candidate.videoLoadFailed) return ''
  return getProxyPath(candidate.minioPath)
}

const handleCandidatePreviewError = (candidate = {}, type = 'cover') => {
  if (type === 'video') {
    candidate.videoLoadFailed = true
    return
  }
  candidate.coverLoadFailed = true
}

const handleCandidateDurationLoaded = (candidate = {}, event) => {
  const duration = Number(event?.target?.duration)
  if (!Number.isFinite(duration) || duration <= 0) return
  candidate.durationSeconds = duration
  candidate.durationLoaded = true
}

const candidateFileType = (candidate = {}) => {
  const sourcePath = candidate.minioPath || candidate.coverPath || candidate.fileName || ''
  const cleanPath = String(sourcePath).split('?')[0].split('#')[0]
  const dotIndex = cleanPath.lastIndexOf('.')
  return dotIndex > -1 ? cleanPath.slice(dotIndex + 1).toUpperCase() : '视频'
}

const formatCandidateSize = (value) => {
  if (value === null || value === undefined || value === '') return '未知大小'
  const text = String(value).trim()
  if (/([kmgt]?b|bytes?|字节|mb|m)$/i.test(text)) return text
  const size = Number(text)
  if (!Number.isFinite(size)) return text
  return `${Number.isInteger(size) ? size : size.toFixed(2)} MB`
}

const formatCandidateDuration = (value) => {
  const seconds = Number(value)
  if (!Number.isFinite(seconds) || seconds <= 0) return '读取中'
  const totalSeconds = Math.round(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const restSeconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(restSeconds).padStart(2, '0')}`
}

const previewCandidate = (candidate = {}) => {
  if (!candidate.id) {
    ElMessage.warning('当前素材缺少预览 ID')
    return
  }
  const route = router.resolve({
    name: 'MaterialPreview',
    params: { id: candidate.id }
  })
  window.open(route.href, '_blank', 'noopener,noreferrer')
}

const candidateExtension = (candidate = {}) => {
  const sourcePath = candidate.minioPath || candidate.localPath || candidate.fileName || candidate.coverPath || ''
  const cleanPath = String(sourcePath).split('?')[0].split('#')[0]
  const dotIndex = cleanPath.lastIndexOf('.')
  return dotIndex > -1 ? cleanPath.slice(dotIndex + 1).toLowerCase() : ''
}

const isVideoCandidate = (candidate = {}) => {
  const type = String(candidate.fileType || '').trim().toLowerCase()
  return type.includes('video') || type === '视频' || VIDEO_EXTENSIONS.includes(type) || VIDEO_EXTENSIONS.includes(candidateExtension(candidate))
}

onMounted(() => {
  restoreLastTask()
  loadRootFolderOptions()
})

onUnmounted(() => {
  clearComposeTimer()
})
</script>

<style scoped lang="scss">
.app-container {
  min-height: calc(100vh - 84px);
  padding: 16px;
  background: #f3f6fb;
}

.video-creation {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.control-pane,
.storyboard-pane {
  min-width: 0;
}

.control-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel,
.storyboard-pane,
.shot-card {
  background: #fff;
  border: 1px solid #e6eaf0;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
}

.panel {
  padding: 18px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;

  .el-icon {
    color: #2563eb;
  }
}

.full-width {
  width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  :deep(.el-input-number) {
    width: 100%;
  }
}

:deep(.el-form-item) {
  margin-bottom: 14px;
}

:deep(.el-form-item__label) {
  padding-bottom: 6px;
  color: #334155;
  font-weight: 600;
}

:deep(.el-button) {
  height: 32px;
  border-radius: 6px;
}

:deep(.el-button--small) {
  height: 28px;
  padding: 0 12px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-textarea__inner) {
  min-height: 180px !important;
  padding: 10px 12px;
  line-height: 1.6;
}

:deep(.el-input__count) {
  right: 10px;
  color: #94a3b8;
}

.action-stack {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 4px;

  .el-button {
    width: 100%;
    margin-left: 0;
  }

  .el-button.is-plain {
    color: #475569;
    background: #f8fafc;
    border-color: #d8e0ea;

    &:hover {
      color: #2563eb;
      border-color: #9ec5fe;
      background: #f5f9ff;
    }
  }
}

.summary-panel {
  position: sticky;
  top: 12px;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 260px;
  overflow: auto;
}

.selected-row {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e8eef7;
  border-radius: 8px;
  background: #f8fbff;

  strong {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
  }

  p {
    display: -webkit-box;
    margin: 4px 0 0;
    min-width: 0;
    overflow: hidden;
    font-size: 12px;
    line-height: 1.45;
    color: #64748b;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

.selected-index {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eaf3ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.compose-btn {
  width: 100%;
  margin-top: 14px;
}

.task-card,
.result-card {
  margin-top: 12px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.task-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
}

.task-card p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.task-meta,
.result-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;

  strong {
    min-width: 0;
    color: #111827;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.result-card {
  video {
    width: 100%;
    display: block;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    background: #0f172a;
  }
}

.result-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;

  .el-button {
    margin-left: 0;
  }
}

.storyboard-pane {
  padding: 18px;
}

.storyboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #eef2f7;

  h2 {
    margin: 0;
    font-size: 20px;
    line-height: 1.3;
    font-weight: 700;
    color: #111827;
  }

  p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
  }
}

.shot-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shot-card {
  padding: 16px;
  transition: box-shadow 0.16s ease, border-color 0.16s ease;

  &:hover {
    border-color: #d6e3f5;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
  }
}

.shot-main {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.shot-index {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eaf3ff;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px #bfdbfe;
}

.shot-copy {
  min-width: 0;

  p {
    margin: 0;
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
    line-height: 1.7;
    font-weight: 700;
    color: #172033;
  }
}

.shot-visual {
  margin-top: 6px !important;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.shot-tag-panel {
  margin-top: 12px;
}

.shot-tags-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  span {
    color: #334155;
    font-size: 14px;
    font-weight: 700;
  }

  em {
    color: #64748b;
    font-size: 12px;
    font-style: normal;
  }
}

.shot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;

  :deep(.el-check-tag) {
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 26px;
    padding: 5px 9px;
    border: 1px solid #dbe4f0;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.2;
    transition: color 0.16s ease, border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
  }

  :deep(.el-check-tag.is-unselected-tag) {
    color: #606266;
    background: #f5f7fa;
    border-color: #dcdfe6;

    &:hover {
      color: #1677ff;
      border-color: #91caff;
      background: #f8fbff;
    }
  }

  :deep(.el-check-tag.is-selected-tag),
  :deep(.el-check-tag.is-selected-tag.is-checked) {
    color: #1677ff;
    background: #e6f4ff;
    border-color: #1677ff;
    box-shadow: inset 0 0 0 1px rgba(22, 119, 255, 0.12);

    &:hover {
      color: #1677ff;
      background: #e6f4ff;
      border-color: #1677ff;
    }
  }

  :deep(.el-check-tag.is-disabled) {
    opacity: 0.68;
  }
}

.shot-tag-check {
  color: #1677ff;
  font-size: 13px;
}

.shot-tag-remove {
  margin-right: -2px;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    color: #ef4444;
  }
}

.shot-tag-add {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;

  .el-button {
    margin-left: 0;
  }
}

.shot-tag-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 280px;
  min-width: 240px;

  :deep(.el-input) {
    max-width: 240px;
  }
}

.shot-scope {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin: 12px 0 4px;
  padding-top: 2px;

  .scope-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    > span {
      color: #334155;
      font-size: 13px;
      font-weight: 600;
      line-height: 1;
    }
  }

  .scope-folder {
    flex: 0 1 220px;
  }

  .scope-date {
    flex: 0 0 160px;
  }

  .scope-mode {
    flex: 0 0 140px;
  }

  .shot-folder-select {
    width: 100%;
  }

  .shot-date-input {
    width: 100%;
  }

  .shot-match-mode-select {
    width: 100%;
  }

  :deep(.el-select),
  :deep(.el-date-editor) {
    width: 100%;
  }
}

.scope-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1 1 120px;

  .match-btn {
    min-width: 104px;
  }
}

.match-tooltip-wrap {
  display: inline-flex;
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
}

.candidate-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;

  &:hover {
    border-color: #b9d7ff;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.09);
  }

  &.selected {
    border-color: #409eff;
    background: #f5f9ff;
    box-shadow: 0 10px 24px rgba(64, 158, 255, 0.16);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.72;
  }
}

.candidate-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  flex: 0 0 auto;
  overflow: hidden;
  background: #0f172a;

  img,
  video {
    width: 100%;
    height: 100%;
    min-width: 100%;
    min-height: 100%;
    max-width: none;
    display: block;
    object-fit: cover;
    object-position: center;
  }
}

.metadata-probe {
  display: none;
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
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.28);
}

.candidate-info {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  padding: 10px 11px;

  strong {
    order: 0;
    display: -webkit-box;
    min-height: 38px;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.45;
    font-weight: 700;
    color: #1f2937;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  > span {
    display: none;
  }
}

.candidate-meta {
  order: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 3px 8px;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    line-height: 1.45;
    color: #7a8798;
  }
}

.candidate-actions {
  order: 2;
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 4px;

  .el-button {
    padding: 0 4px;
  }
}

.candidate-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px dashed #c8d5e6;
  border-radius: 8px;
  color: #64748b;
  background: #f7faff;
  font-size: 13px;
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

  .shot-main {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .shot-tag-add {
    align-items: stretch;
  }

  .shot-tag-inputs {
    min-width: 0;
    width: 100%;

    :deep(.el-input) {
      max-width: none;
    }
  }

  .shot-scope {
    gap: 8px;

    .scope-field {
      flex: 1 1 100%;
    }

    .scope-action {
      flex: 1 1 100%;
      justify-content: flex-end;
    }
  }
}
</style>
