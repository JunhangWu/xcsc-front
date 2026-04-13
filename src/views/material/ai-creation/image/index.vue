<template>
  <div class="app-container ai-creation-page">
    <div class="workspace">
      <div class="left-pane">
        <div class="pane-card">
          <h3>图片提示词</h3>
          <el-input
            v-model="form.prompt"
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
                  <img v-if="referenceImage.url" :src="referenceImage.url" alt="参考图" />
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
              <el-select v-model="form.model">
                <el-option label="Flux Pro" value="flux-pro" />
                <el-option label="SDXL" value="sdxl" />
                <el-option label="Midjourney 风格" value="mj-style" />
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
              <img :src="img" alt="生成结果" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="AICreationImage">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { getToken } from '@/utils/auth'

const creating = ref(false)
const latestTask = ref('暂无')

const form = reactive({
  prompt: '',
  model: 'flux-pro',
  aspectRatio: '1:1',
  count: 4
})

const imageTemplates = [
  '极简产品海报，纯色背景，柔和光影，商业摄影风格',
  '国潮插画，节日促销主题，高饱和配色',
  '写实人像，城市夜景，电影级布光，浅景深',
  '3D 等距场景，科技办公空间，未来感 UI 元素'
]

const imageResults = ref([])

const referenceImage = reactive({
  name: '',
  url: ''
})

const onRefImageChange = (file) => {
  const rawFile = file?.raw
  if (!rawFile) return
  referenceImage.name = file.name || rawFile.name
  referenceImage.url = URL.createObjectURL(rawFile)
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

const requestGenerateOne = async (prompt, size) => {
  const token = getToken()
  const res = await axios.get(`${import.meta.env.VITE_APP_BASE_API}/api/generate-image`, {
    params: { prompt, size },
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  return normalizeResult(res?.data)
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
    const tasks = Array.from({ length: requestCount }).map(() =>
      requestGenerateOne(form.prompt.trim(), size)
    )
    const urls = (await Promise.all(tasks)).filter(Boolean)

    if (!urls.length) {
      ElMessage.error('图片生成失败，请稍后重试')
      return
    }

    imageResults.value = urls
    latestTask.value = `${new Date().toLocaleString()} 生成`
    ElMessage.success(`生成完成，共 ${urls.length} 张`)
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || error?.response?.data?.message || '图片生成失败')
  } finally {
    creating.value = false
  }
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

  .image-grid {
    grid-template-columns: 1fr;
  }
}
</style>
