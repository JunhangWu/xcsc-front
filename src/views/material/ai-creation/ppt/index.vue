<template>
  <div class="app-container">
    <div class="workspace">
      <div class="left-pane">
        <div class="pane-card">
          <h3>主题与目标</h3>
          <el-input v-model="form.topic" placeholder="例如：2026年渠道增长策略复盘" />
          <el-input v-model="form.audience" class="mt-12" placeholder="受众：管理层 / 客户提案 / 培训分享" />
        </div>
        <div class="pane-card">
          <h3>版式偏好</h3>
          <el-form label-position="top">
            <el-form-item label="主题风格">
              <el-select v-model="form.theme" class="full-width">
                <el-option label="商务极简" value="business" />
                <el-option label="科技深色" value="tech" />
                <el-option label="品牌宣传" value="brand" />
              </el-select>
            </el-form-item>
            <div class="inline-fields mt-12">
              <el-form-item label="页数">
                <el-slider v-model="form.pages" :min="6" :max="40" :step="1" show-input />
              </el-form-item>
            </div>
          </el-form>
        </div>
        <el-button type="primary" size="large" :loading="creating" @click="generatePPT">生成PPT大纲</el-button>
      </div>
      <div class="right-pane">
        <div class="pane-card result-card">
          <div class="result-header">
            <h3>结构预览</h3>
            <el-text type="info">最近一次任务：{{ latestTask || '暂无' }}</el-text>
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
  </div>
</template>

<script setup name="AICreationPPT">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const creating = ref(false)
const latestTask = ref('季度经营复盘（24分钟前）')

const form = reactive({
  topic: '',
  audience: '',
  theme: 'business',
  pages: 12
})

const pptOutline = ref([
  '行业趋势与机会窗口',
  '目标拆解与关键指标',
  '执行路径与资源规划',
  '风险与备选方案',
  '结论与下一步行动'
])

const generatePPT = () => {
  creating.value = true
  setTimeout(() => {
    latestTask.value = `${new Date().toLocaleTimeString()} 生成`
    pptOutline.value = [
      `主题：${form.topic || '未命名演示'}`,
      '现状分析与痛点识别',
      '解决方案与实施步骤',
      '数据支撑与ROI预测',
      '收尾总结与Q&A'
    ]
    creating.value = false
    ElMessage.success('任务已提交，正在生成内容')
  }, 900)
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

.result-card {
  min-height: 420px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mt-12 {
  margin-top: 12px;
}

.full-width {
  width: 100%;
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
}
</style>
