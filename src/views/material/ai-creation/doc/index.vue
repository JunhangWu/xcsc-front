<template>
  <div class="app-container">
    <div class="workspace">
      <div class="left-pane">
        <div class="pane-card">
          <h3>写作目标</h3>
          <el-input
            v-model="form.prompt"
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
                <el-select v-model="form.type">
                  <el-option label="方案" value="proposal" />
                  <el-option label="会议纪要" value="minutes" />
                  <el-option label="需求文档" value="prd" />
                </el-select>
              </el-form-item>
              <el-form-item label="篇幅">
                <el-select v-model="form.length">
                  <el-option label="短" value="short" />
                  <el-option label="中" value="medium" />
                  <el-option label="长" value="long" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>
        </div>
        <el-button type="primary" size="large" :loading="creating" @click="generateDoc">生成文档草稿</el-button>
      </div>
      <div class="right-pane">
        <div class="pane-card result-card">
          <div class="result-header">
            <h3>文档草稿</h3>
            <el-text type="info">最近一次任务：{{ latestTask || '暂无' }}</el-text>
          </div>
          <div class="doc-result">{{ docResult }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="AICreationDoc">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const creating = ref(false)
const latestTask = ref('客户方案初稿（40分钟前）')

const form = reactive({
  prompt: '',
  type: 'proposal',
  length: 'medium'
})

const docResult = ref(
  '系统将基于你的写作目标自动生成结构化草稿，包含摘要、正文和行动项，支持继续润色与多轮改写。'
)

const generateDoc = () => {
  creating.value = true
  setTimeout(() => {
    latestTask.value = `${new Date().toLocaleTimeString()} 生成`
    docResult.value = `【${form.type}】草稿已生成，篇幅：${form.length}。\n\n${form.prompt || '请补充写作目标以获得更精准内容。'}`
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

.doc-result {
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
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
