<template>
  <div class="app-container ai-creation-page">
    <section class="hero">
      <div>
        <h1>AI 创作工作台</h1>
        <p>统一管理图片、视频、PPT、文档四类内容生成任务，支持模板化快速创作。</p>
      </div>
      <div class="hero-meta">
        <el-tag type="success" effect="light">在线模型：4</el-tag>
        <el-tag effect="light">今日生成：{{ stats.todayCount }}</el-tag>
        <el-tag effect="light">成功率：{{ stats.successRate }}%</el-tag>
      </div>
    </section>

    <section class="module-grid">
      <article
        v-for="item in moduleCards"
        :key="item.key"
        class="module-card"
        :class="`module-${item.key}`"
      >
        <header>
          <h3>{{ item.title }}</h3>
          <span>{{ item.subtitle }}</span>
        </header>
        <p>{{ item.desc }}</p>
        <el-button type="primary" plain @click="activeTab = item.key">进入创作</el-button>
      </article>
    </section>

    <section class="workspace-card">
      <el-tabs v-model="activeTab" class="creation-tabs">
        <el-tab-pane label="图片创作" name="image">
          <div class="workspace">
            <div class="left-pane">
              <div class="pane-card prompt-pane-card">
                <h3>图片提示词</h3>
                <el-input
                  v-model="forms.image.prompt"
                  type="textarea"
                  :rows="5"
                  placeholder="描述画面主体、场景、光线和风格，例如：赛博城市夜景，电影感，广角，4K"
                />
                <div class="prompt-ref-wrap">
                  <div class="ref-upload-item">
                    <div class="ref-title">参考图</div>
                    <el-upload
                      :auto-upload="false"
                      :show-file-list="false"
                      accept="image/*"
                      :on-change="onRefImageChange"
                    >
                      <div class="upload-box">
                        <img v-if="referenceImages.url" :src="referenceImages.url" alt="参考图" />
                        <span v-else>点击上传</span>
                      </div>
                    </el-upload>
                  </div>
                </div>
              </div>
              <div class="pane-card">
                <h3>参数设置</h3>
                <el-form label-position="top">
                  <el-form-item label="模型">
                    <el-select v-model="forms.image.model">
                      <el-option label="Flux Pro" value="flux-pro" />
                      <el-option label="SDXL" value="sdxl" />
                      <el-option label="Midjourney 风格" value="mj-style" />
                    </el-select>
                  </el-form-item>
                  <div class="inline-fields">
                    <el-form-item label="比例">
                      <el-select v-model="forms.image.aspectRatio">
                        <el-option label="1:1" value="1:1" />
                        <el-option label="3:4" value="3:4" />
                        <el-option label="16:9" value="16:9" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="数量">
                      <el-input-number v-model="forms.image.count" :min="1" :max="8" />
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
                    @click="forms.image.prompt = tpl"
                  >
                    {{ tpl }}
                  </button>
                </div>
              </div>
              <el-button type="primary" size="large" :loading="creating" @click="generate('image')">
                立即生成图片
              </el-button>
            </div>
            <div class="right-pane">
              <div class="pane-card result-card">
                <div class="result-header">
                  <h3>结果预览</h3>
                  <el-text type="info">最近一次任务：{{ latestTask.image || '暂无' }}</el-text>
                </div>
                <div class="image-grid">
                  <div v-for="(img, index) in imageResults" :key="img + index" class="image-item">
                    <img :src="img" alt="生成结果" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="视频创作" name="video">
          <div class="workspace">
            <div class="left-pane">
              <div class="pane-card">
                <h3>视频脚本</h3>
                <el-input
                  v-model="forms.video.prompt"
                  type="textarea"
                  :rows="6"
                  placeholder="请输入视频脚本"
                />
              </div>
              <div class="pane-card">
                <h3>生成配置</h3>
                <el-form label-position="top">
                  <div class="inline-fields">
                    <el-form-item label="时长">
                      <el-select v-model="forms.video.duration">
                        <el-option label="15s" value="15" />
                        <el-option label="30s" value="30" />
                        <el-option label="60s" value="60" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="分辨率">
                      <el-select v-model="forms.video.resolution">
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
                    <el-select
                      v-model="forms.video.voice"
                      placeholder="请选择旁白音色"
                      :disabled="!videoMatched"
                    >
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
                    :disabled="!videoMatched || !forms.video.voice"
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
                  <el-text type="info">最近一次任务：{{ latestTask.video || '暂无' }}</el-text>
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
                  <el-text type="info"> </el-text>
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
        </el-tab-pane>

        <el-tab-pane label="PPT创作" name="ppt">
          <div class="workspace">
            <div class="left-pane">
              <div class="pane-card">
                <h3>主题与目标</h3>
                <el-input v-model="forms.ppt.topic" placeholder="例如：2026年渠道增长策略复盘" />
                <el-input
                  v-model="forms.ppt.audience"
                  class="mt-12"
                  placeholder="受众：管理层 / 客户提案 / 培训分享"
                />
              </div>
              <div class="pane-card">
                <h3>版式偏好</h3>
                <el-form label-position="top">
                  <el-form-item label="主题风格">
                    <el-select v-model="forms.ppt.theme" class="full-width">
                      <el-option label="商务极简" value="business" />
                      <el-option label="科技深色" value="tech" />
                      <el-option label="品牌宣传" value="brand" />
                    </el-select>
                  </el-form-item>
                  <div class="inline-fields mt-12">
                    <el-form-item label="页数">
                      <el-slider v-model="forms.ppt.pages" :min="6" :max="40" :step="1" show-input />
                    </el-form-item>
                  </div>
                </el-form>
              </div>
              <el-button type="primary" size="large" :loading="creating" @click="generate('ppt')">
                生成PPT大纲
              </el-button>
            </div>
            <div class="right-pane">
              <div class="pane-card result-card">
                <div class="result-header">
                  <h3>结构预览</h3>
                  <el-text type="info">最近一次任务：{{ latestTask.ppt || '暂无' }}</el-text>
                </div>
                <el-timeline>
                  <el-timeline-item
                    v-for="(chapter, index) in pptOutline"
                    :key="chapter + index"
                    :timestamp="`第${index + 1}章`"
                  >
                    {{ chapter }}
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="文档创作" name="doc">
          <div class="workspace">
            <div class="left-pane">
              <div class="pane-card">
                <h3>写作目标</h3>
                <el-input
                  v-model="forms.doc.prompt"
                  type="textarea"
                  :rows="6"
                  placeholder="输入文档用途、语气、关键观点。例如：面向客户的产品方案，专业但易读，包含预算与里程碑"
                />
              </div>
              <div class="pane-card">
                <h3>文档参数</h3>
                <el-form label-position="top">
                  <div class="inline-fields">
                    <el-form-item label="文档类型">
                      <el-select v-model="forms.doc.type">
                        <el-option label="方案" value="proposal" />
                        <el-option label="会议纪要" value="minutes" />
                        <el-option label="需求文档" value="prd" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="篇幅">
                      <el-select v-model="forms.doc.length">
                        <el-option label="短" value="short" />
                        <el-option label="中" value="medium" />
                        <el-option label="长" value="long" />
                      </el-select>
                    </el-form-item>
                  </div>
                </el-form>
              </div>
              <el-button type="primary" size="large" :loading="creating" @click="generate('doc')">
                生成文档草稿
              </el-button>
            </div>
            <div class="right-pane">
              <div class="pane-card result-card">
                <div class="result-header">
                  <h3>文档草稿</h3>
                  <el-text type="info">最近一次任务：{{ latestTask.doc || '暂无' }}</el-text>
                </div>
                <div class="doc-result">{{ docResult }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>
</template>

<script setup name="AICreation">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoCamera } from '@element-plus/icons-vue'

const activeTab = ref('image')
const creating = ref(false)
const videoMatching = ref(false)
const videoGenerating = ref(false)

const stats = reactive({
  todayCount: 28,
  successRate: 96
})

const moduleCards = [
  {
    key: 'image',
    title: '图片创作',
    subtitle: 'Image Studio',
    desc: '面向海报、电商图、社媒封面的一站式文生图工作区。'
  },
  {
    key: 'video',
    title: '视频创作',
    subtitle: 'Video Lab',
    desc: '支持脚本到短视频生成，适配宣传片和新媒体投放场景。'
  },
  {
    key: 'ppt',
    title: 'PPT创作',
    subtitle: 'Slide Builder',
    desc: '自动生成演示结构与页面内容，提升汇报准备效率。'
  },
  {
    key: 'doc',
    title: '文档创作',
    subtitle: 'Document Writer',
    desc: '快速生成方案、纪要、PRD 等常见业务文档初稿。'
  }
]

const forms = reactive({
  image: {
    prompt: '',
    model: 'flux-pro',
    aspectRatio: '1:1',
    count: 4
  },
  video: {
    prompt: '',
    duration: '30',
    resolution: '1080p',
    voice: ''
  },
  ppt: {
    topic: '',
    audience: '',
    theme: 'business',
    pages: 12
  },
  doc: {
    prompt: '',
    type: 'proposal',
    length: 'medium'
  }
})

const imageTemplates = [
  '极简产品海报，纯色背景，柔和光影，商业摄影风格',
  '国潮插画，节日促销主题，高饱和配色',
  '写实人像，城市夜景，电影级布光，浅景深',
  '3D 等距场景，科技办公空间，未来感 UI 元素'
]

const imageResults = ref([
  'https://picsum.photos/id/1015/720/480',
  'https://picsum.photos/id/1025/720/480',
  'https://picsum.photos/id/1035/720/480',
  'https://picsum.photos/id/1045/720/480'
])

const referenceImages = reactive({
  name: '',
  url: ''
})

const latestTask = reactive({
  image: '商品主图优化（3分钟前）',
  video: '素材匹配任务（10分钟前）',
  ppt: '季度经营复盘（24分钟前）',
  doc: '客户方案初稿（40分钟前）'
})

const videoVoices = ['知性女声', '青年男声', '活力女声', '沉稳男声']
const videoMatched = ref(false)
const activeReplaceIndex = ref(-1)
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

const pptOutline = ref([
  '行业趋势与机会窗口',
  '目标拆解与关键指标',
  '执行路径与资源规划',
  '风险与备选方案',
  '结论与下一步行动'
])

const docResult = ref(
  '系统将基于你的写作目标自动生成结构化草稿，包含摘要、正文和行动项，支持继续润色与多轮改写。'
)

const onRefImageChange = (file) => {
  const rawFile = file?.raw
  if (!rawFile) return
  referenceImages.name = file.name || rawFile.name
  referenceImages.url = URL.createObjectURL(rawFile)
}

const matchVideoAssets = () => {
  if (!forms.video.prompt.trim()) {
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
    latestTask.video = `${new Date().toLocaleTimeString()} 素材匹配`
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
  if (!forms.video.voice) {
    ElMessage.warning('请选择旁白音色')
    return
  }

  videoGenerating.value = true
  setTimeout(() => {
    videoPreview.ready = true
    videoPreview.url = 'https://www.w3schools.com/html/mov_bbb.mp4'
    videoPreview.jianyingLink = `https://www.capcut.cn/template/${Date.now()}`
    latestTask.video = `${new Date().toLocaleTimeString()} 视频生成`
    videoGenerating.value = false
    ElMessage.success('视频已生成，可点击剪映链接继续编辑')
  }, 1200)
}

const generate = (type) => {
  creating.value = true

  setTimeout(() => {
    const nowText = `${new Date().toLocaleTimeString()} 生成`
    latestTask[type] = nowText

    if (type === 'image') {
      imageResults.value = [
        'https://picsum.photos/id/1060/720/480',
        'https://picsum.photos/id/1069/720/480',
        'https://picsum.photos/id/1074/720/480',
        'https://picsum.photos/id/1082/720/480'
      ]
    }

    if (type === 'ppt') {
      pptOutline.value = [
        `主题：${forms.ppt.topic || '未命名演示'}`,
        '现状分析与痛点识别',
        '解决方案与实施步骤',
        '数据支撑与ROI预测',
        '收尾总结与Q&A'
      ]
    }

    if (type === 'doc') {
      docResult.value = `【${forms.doc.type}】草稿已生成，篇幅：${forms.doc.length}。\n\n${forms.doc.prompt || '请补充写作目标以获得更精准内容。'}`
    }

    creating.value = false
    ElMessage.success('任务已提交，正在生成内容')
  }, 900)
}
</script>

<style scoped lang="scss">
.ai-creation-page {
  color: #1f2937;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ecfeff 0%, #f0f9ff 48%, #eef2ff 100%);
  margin-bottom: 18px;

  h1 {
    margin: 0 0 10px;
    font-size: 28px;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: #4b5563;
  }
}

.hero-meta {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.module-card {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  h3 {
    margin: 0;
    font-size: 18px;
  }

  span {
    font-size: 12px;
    color: #6b7280;
  }

  p {
    min-height: 42px;
    margin: 0 0 12px;
    color: #4b5563;
  }
}

.module-image {
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.35);
}

.module-video {
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.35);
}

.module-ppt {
  box-shadow: inset 0 0 0 1px rgba(251, 146, 60, 0.35);
}

.module-doc {
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.35);
}

.workspace-card {
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 8px 18px 18px;
}

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
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  border-radius: 10px;
  width: 88px;
  height: 88px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #64748b;
  cursor: pointer;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
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
  min-height: 420px;
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
  border-radius: 10px;
  overflow: hidden;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;

  img {
    width: 100%;
    height: 176px;
    object-fit: cover;
    display: block;
  }
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

.task-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
    padding: 10px 0;
    color: #334155;
  }
}

.doc-result {
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.mt-12 {
  margin-top: 12px;
}

.full-width {
  width: 100%;
}

:deep(.creation-tabs .el-tabs__item) {
  font-size: 15px;
  font-weight: 600;
}

:deep(.el-form-item) {
  margin-bottom: 10px;
}

@media (max-width: 1280px) {
  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
  }

  .module-grid {
    grid-template-columns: 1fr;
  }

  .inline-fields {
    grid-template-columns: 1fr;
  }

  .image-grid {
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
