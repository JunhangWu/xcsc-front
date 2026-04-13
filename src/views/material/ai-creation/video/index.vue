<template>
  <div class="app-container">
    <div class="workspace">
      <div class="left-pane">
        <div class="pane-card">
          <h3>视频脚本</h3>
          <el-input v-model="form.prompt" type="textarea" :rows="6" placeholder="请输入视频脚本" />
        </div>
        <div class="pane-card">
          <h3>生成配置</h3>
          <el-form label-position="top">
            <div class="inline-fields">
              <el-form-item label="时长">
                <el-select v-model="form.duration">
                  <el-option label="15s" value="15" />
                  <el-option label="30s" value="30" />
                  <el-option label="60s" value="60" />
                </el-select>
              </el-form-item>
              <el-form-item label="分辨率">
                <el-select v-model="form.resolution">
                  <el-option label="720P" value="720p" />
                  <el-option label="1080P" value="1080p" />
                  <el-option label="2K" value="2k" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>
        </div>
        <div class="pane-card">
          <h3><span class="step-badge">步骤1</span>第一步：匹配素材</h3>
          <el-text type="info">先写脚本并配置参数，再匹配素材；不满意可在右侧逐项替换。</el-text>
          <div class="step-action">
            <el-button type="primary" size="large" :loading="videoMatching" @click="matchVideoAssets">
              立即匹配素材
            </el-button>
          </div>
        </div>
        <div class="pane-card">
          <h3><span class="step-badge">步骤2</span>第二步：生成视频</h3>
          <el-form label-position="top">
            <el-form-item label="旁白音色">
              <el-select v-model="form.voice" placeholder="请选择旁白音色" :disabled="!videoMatched">
                <el-option v-for="voice in videoVoices" :key="voice" :label="voice" :value="voice" />
              </el-select>
            </el-form-item>
          </el-form>
          <el-text v-if="!videoMatched" type="info">请先完成第一步素材匹配，再选择音色并生成。</el-text>
          <div class="step-action">
            <el-button
              type="primary"
              size="large"
              :loading="videoGenerating"
              :disabled="!videoMatched || !form.voice"
              @click="generateVideoWithSelectedAssets"
            >
              立即生成视频
            </el-button>
          </div>
        </div>
      </div>
      <div class="right-pane">
        <div class="pane-card result-card">
          <div class="result-header">
            <h3>素材匹配结果</h3>
            <el-text type="info">最近一次任务：{{ latestTask || '暂无' }}</el-text>
          </div>
          <div v-if="!videoMatched" class="video-preview">
            <el-icon><VideoCamera /></el-icon>
            <p>点击“立即匹配素材”后，在这里查看匹配结果。</p>
          </div>
          <div v-else class="asset-grid">
            <div v-for="(asset, index) in matchedAssets" :key="asset.id" class="asset-item">
              <div class="asset-thumb-wrap clickable" @click="openReplacePanel(index)">
                <img :src="asset.thumb" :alt="asset.name" class="asset-thumb" />
                <el-tag size="small" class="asset-type" :type="asset.type === 'video' ? 'success' : 'info'">
                  {{ asset.type === 'video' ? '视频' : '图片' }}
                </el-tag>
                <div class="asset-replace-tip">点击图片替换</div>
              </div>
              <div class="asset-meta">
                <span>{{ asset.name }}</span>
                <el-button type="primary" link @click="openReplacePanel(index)">展开备选</el-button>
              </div>
            </div>
          </div>
          <div v-if="activeReplaceIndex > -1" class="candidate-panel">
            <div class="candidate-header">
              <h4>备选素材（镜头{{ activeReplaceIndex + 1 }}）</h4>
              <el-button type="primary" link @click="activeReplaceIndex = -1">收起</el-button>
            </div>
            <div class="candidate-grid">
              <button
                v-for="item in candidateAssets"
                :key="item.id"
                class="candidate-item"
                @click="replaceWithCandidate(item)"
              >
                <img :src="item.thumb" :alt="item.name" />
                <span>{{ item.name }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="pane-card">
          <div class="result-header">
            <h3>视频预览</h3>
            <el-text type="info"></el-text>
          </div>
          <div v-if="!videoPreview.ready" class="video-preview">
            <el-icon><VideoCamera /></el-icon>
            <p>完成第二步后，这里展示生成视频预览。</p>
          </div>
          <div v-else class="video-result-block">
            <video class="video-player" controls :src="videoPreview.url"></video>
            <div class="jianying-link">
              <span>剪映编辑链接：</span>
              <el-link :href="videoPreview.jianyingLink" type="primary" target="_blank">
                打开剪映继续编辑
              </el-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="AICreationVideo">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoCamera } from '@element-plus/icons-vue'

const videoMatching = ref(false)
const videoGenerating = ref(false)
const videoMatched = ref(false)
const activeReplaceIndex = ref(-1)
const latestTask = ref('素材匹配任务（10分钟前）')

const form = reactive({
  prompt: '',
  duration: '30',
  resolution: '1080p',
  voice: ''
})

const videoVoices = ['知性女声', '青年男声', '活力女声', '沉稳男声']
const matchedAssets = ref([])
const candidateAssetPool = [
  { id: 'c1', type: 'video', name: '城市街景镜头', thumb: 'https://picsum.photos/id/501/640/360' },
  { id: 'c2', type: 'image', name: '产品特写图', thumb: 'https://picsum.photos/id/502/640/360' },
  { id: 'c3', type: 'video', name: '办公场景素材', thumb: 'https://picsum.photos/id/503/640/360' },
  { id: 'c4', type: 'image', name: '品牌KV海报', thumb: 'https://picsum.photos/id/504/640/360' },
  { id: 'c5', type: 'video', name: '人物口播镜头', thumb: 'https://picsum.photos/id/505/640/360' },
  { id: 'c6', type: 'image', name: '氛围背景图', thumb: 'https://picsum.photos/id/506/640/360' }
]
const candidateAssets = ref([])
const videoPreview = reactive({
  ready: false,
  url: '',
  jianyingLink: ''
})

const matchVideoAssets = () => {
  if (!form.prompt.trim()) {
    ElMessage.warning('请先填写视频脚本，再匹配素材')
    return
  }

  videoMatching.value = true
  setTimeout(() => {
    matchedAssets.value = [
      { id: 'm1', type: 'video', name: '开场全景', thumb: 'https://picsum.photos/id/520/640/360' },
      { id: 'm2', type: 'image', name: '产品展示', thumb: 'https://picsum.photos/id/521/640/360' },
      { id: 'm3', type: 'video', name: '功能特写', thumb: 'https://picsum.photos/id/522/640/360' },
      { id: 'm4', type: 'video', name: '结尾品牌镜头', thumb: 'https://picsum.photos/id/523/640/360' }
    ]
    videoMatched.value = true
    videoPreview.ready = false
    activeReplaceIndex.value = -1
    candidateAssets.value = []
    latestTask.value = `${new Date().toLocaleTimeString()} 素材匹配`
    videoMatching.value = false
    ElMessage.success('素材匹配完成，可在右侧替换不满意素材')
  }, 900)
}

const openReplacePanel = (index) => {
  activeReplaceIndex.value = index
  const current = matchedAssets.value[index]
  candidateAssets.value = candidateAssetPool.filter(item => item.type === current.type)
}

const replaceWithCandidate = (candidate) => {
  if (activeReplaceIndex.value < 0) return
  matchedAssets.value[activeReplaceIndex.value] = {
    ...candidate,
    id: `m${Date.now()}`
  }
  activeReplaceIndex.value = -1
  ElMessage.success('已替换为选中素材')
}

const generateVideoWithSelectedAssets = () => {
  if (!videoMatched.value || matchedAssets.value.length === 0) {
    ElMessage.warning('请先完成第一步素材匹配')
    return
  }
  if (!form.voice) {
    ElMessage.warning('请选择旁白音色')
    return
  }

  videoGenerating.value = true
  setTimeout(() => {
    videoPreview.ready = true
    videoPreview.url = 'https://www.w3schools.com/html/mov_bbb.mp4'
    videoPreview.jianyingLink = `https://www.capcut.cn/template/${Date.now()}`
    latestTask.value = `${new Date().toLocaleTimeString()} 视频生成`
    videoGenerating.value = false
    ElMessage.success('视频已生成，可点击剪映链接继续编辑')
  }, 1200)
}
</script>

<style scoped lang="scss">
.workspace {
  display: grid;
  grid-template-columns: minmax(340px, 1fr) minmax(380px, 1fr);
  gap: 16px;
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

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 22px;
  margin-right: 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0c4a6e;
  font-size: 12px;
  font-weight: 600;
}

.result-card {
  min-height: 420px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.video-preview {
  height: 220px;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  background: linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .el-icon {
    font-size: 44px;
    color: #64748b;
    margin-bottom: 10px;
  }

  p {
    margin: 0;
    color: #475569;
  }
}

.step-action {
  margin-top: 12px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.asset-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #f8fafc;
}

.asset-thumb-wrap {
  position: relative;
}

.asset-thumb-wrap.clickable {
  cursor: pointer;
}

.asset-thumb {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.asset-type {
  position: absolute;
  top: 8px;
  right: 8px;
}

.asset-replace-tip {
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  font-size: 12px;
}

.asset-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 13px;
  color: #334155;
}

.candidate-panel {
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
}

.candidate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  h4 {
    margin: 0;
    font-size: 14px;
    color: #334155;
  }
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.candidate-item {
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #eff6ff;
  padding: 4px;
  cursor: pointer;
  text-align: left;

  img {
    width: 100%;
    height: 72px;
    border-radius: 6px;
    object-fit: cover;
    display: block;
    margin-bottom: 6px;
  }

  span {
    display: block;
    font-size: 12px;
    color: #1e3a8a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.video-result-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-player {
  width: 100%;
  border-radius: 10px;
  background: #111827;
}

.jianying-link {
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 10px;
}

@media (max-width: 1280px) {
  .workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .inline-fields {
    grid-template-columns: 1fr;
  }

  .asset-grid {
    grid-template-columns: 1fr;
  }

  .candidate-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
