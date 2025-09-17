<template>

  <div class="app-container">

    <div class="card">
      <div class="card-header">
        <div class="card-title">AI创作管理</div>
      </div>
      <div class="card-body">
        <div class="creation-settings">
          <el-form :model="creationForm" label-width="120px" :inline="false">
            <div class="form-row">
              <el-form-item label="创作类型" prop="creationType">
                <el-select v-model="creationForm.creationType" placeholder="请选择创作类型" style="width: 300px;">
                  <el-option label="图片生成" value="image_generation" />
                  <el-option label="视频剪辑" value="video_editing" />
                  <el-option label="文案生成" value="copywriting" />
                  <el-option label="PPT制作" value="ppt_creation" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="创作风格" prop="style">
                <el-select v-model="creationForm.style" placeholder="请选择创作风格" style="width: 300px;">
                  <el-option label="简约现代" value="modern" />
                  <el-option label="科技感" value="tech" />
                  <el-option label="艺术创意" value="artistic" />
                  <el-option label="商务正式" value="business" />
                  <el-option label="温暖治愈" value="warm" />
                </el-select>
              </el-form-item>
            </div>
            
            <div class="form-row">
              <el-form-item label="关联素材" prop="materials">
                <el-select v-model="creationForm.materials" placeholder="请选择要关联的素材" multiple filterable style="width: 615px;">
                  <el-option 
                    v-for="material in availableMaterials" 
                    :key="material.id" 
                    :label="material.name" 
                    :value="material.id"
                  />
                </el-select>
              </el-form-item>
            </div>
            
            <div class="form-row">
              <el-form-item label="创作描述" prop="description">
                <el-input
                  v-model="creationForm.description"
                  type="textarea"
                  placeholder="请详细描述您想要创作的内容，越详细效果越好"
                  :rows="4"
                  style="width: 615px;"
                />
              </el-form-item>
            </div>
            
            <div class="form-row">
              <el-form-item label="高级参数">
                <el-button type="text" @click="toggleAdvancedParams">
                  {{ showAdvancedParams ? '收起' : '展开' }}高级参数
                  <el-icon><ArrowRight v-if="!showAdvancedParams" /><ArrowUp v-else /></el-icon>
                </el-button>
              </el-form-item>
            </div>
    
            <div v-if="showAdvancedParams" class="advanced-params">
              <div class="form-row">
                <el-form-item label="生成数量" prop="generationCount">
                  <el-input-number
                    v-model="creationForm.generationCount"
                    :min="1"
                    :max="10"
                    style="width: 300px;"
                  />
                </el-form-item>
                
                <el-form-item label="质量偏好" prop="qualityPreference">
                  <el-select v-model="creationForm.qualityPreference" placeholder="请选择质量偏好" style="width: 300px;">
                    <el-option label="标准" value="standard" />
                    <el-option label="高质量" value="high" />
                    <el-option label="高速度" value="fast" />
                  </el-select>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="自定义参数">
                  <el-input
                    v-model="creationForm.customParams"
                    type="textarea"
                    placeholder="请输入JSON格式的自定义参数"
                    :rows="3"
                    style="width: 615px;"
                  />
                </el-form-item>
              </div>
            </div>
            
            <div class="form-row">
              <el-form-item>
                <el-button type="primary" @click="createContent" :loading="creating" icon="Plus">
                  开始创作
                </el-button>
                <el-button @click="resetForm">重置</el-button>
              </el-form-item>
            </div>
          </el-form>
        </div>
        
        <div class="creation-tasks">
          <h3>创作任务列表</h3>
          <div class="task-list">
            <el-table v-loading="loading" :data="taskList" style="width: 100%">
              <el-table-column prop="id" label="任务ID" width="120" />
              <el-table-column prop="name" label="任务名称" />
              <el-table-column prop="type" label="创作类型" width="120">
                <template #default="scope">
                  {{ getCreationTypeText(scope.row.type) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="任务状态" width="100">
                <template #default="scope">
                  <el-tag 
                    :type="getStatusTagType(scope.row.status)"
                    size="small"
                  >
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度" width="150">
                <template #default="scope">
                  <el-progress :percentage="scope.row.progress" :status="getStatusProgressType(scope.row.status)" />
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="180" />
              <el-table-column prop="updateTime" label="更新时间" width="180" />
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="scope">
                  <el-button 
                    v-if="scope.row.status === 'completed'"
                    type="primary" 
                    size="small" 
                    @click="viewResult(scope.row)"
                    icon="View"
                  >
                    查看结果
                  </el-button>
                  <el-button 
                    v-else-if="scope.row.status === 'pending' || scope.row.status === 'running'"
                    type="default" 
                    size="small" 
                    @click="cancelTask(scope.row)"
                    icon="Delete"
                    :disabled="scope.row.status === 'running'"
                  >
                    {{ scope.row.status === 'running' ? '处理中' : '取消' }}
                  </el-button>
                  <el-button 
                    v-else-if="scope.row.status === 'failed'"
                    type="primary" 
                    size="small" 
                    @click="retryTask(scope.row)"
                    icon="RefreshLeft"
                  >
                    重试
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- 创作结果预览弹窗 -->
    <!-- <el-dialog
      v-model="resultVisible"
      title="创作结果预览"
      width="90%"
      :before-close="handleClose"
    >
      <div class="result-dialog">
        <div v-if="currentTask.type === 'image_generation'" class="image-results">
          <div class="result-grid">
            <div v-for="(image, index) in currentTask.results" :key="index" class="result-item">
              <img :src="image.url" class="result-image" />
              <div class="result-actions">
                <el-button type="primary" size="small" @click="downloadResult(image)">下载</el-button>
                <el-button type="default" size="small" @click="likeResult(image)">收藏</el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="currentTask.type === 'video_editing'" class="video-result">
          <div class="video-placeholder">
            <el-icon><VideoCamera /></el-icon>
            <span>视频播放区域</span>
          </div>
          <div class="result-info">
            <h4>视频信息</h4>
            <p>视频标题: {{ currentTask.name }}</p>
            <p>视频时长: {{ currentTask.videoDuration || '30秒' }}</p>
            <p>视频质量: {{ currentTask.videoQuality || '1080P' }}</p>
          </div>
          <div class="result-actions">
            <el-button type="primary" size="small" @click="downloadResult(currentTask)">下载视频</el-button>
            <el-button type="default" size="small" @click="likeResult(currentTask)">收藏</el-button>
          </div>
        </div>
        
        <div v-else-if="currentTask.type === 'copywriting'" class="copywriting-result">
          <div class="result-text">
            <h4>生成文案</h4>
            <pre>{{ currentTask.results || '暂无文案内容' }}</pre>
          </div>
          <div class="result-actions">
            <el-button type="primary" size="small" @click="copyToClipboard(currentTask.results)">复制文本</el-button>
            <el-button type="default" size="small" @click="likeResult(currentTask)">收藏</el-button>
          </div>
        </div>
        
        <div v-else-if="currentTask.type === 'ppt_creation'" class="ppt-result">
          <div class="ppt-placeholder">
            <el-icon><Document /></el-icon>
            <span>PPT预览区域</span>
          </div>
          <div class="result-info">
            <h4>PPT信息</h4>
            <p>PPT标题: {{ currentTask.name }}</p>
            <p>页数: {{ currentTask.pptPages || '10页' }}</p>
          </div>
          <div class="result-actions">
            <el-button type="primary" size="small" @click="downloadResult(currentTask)">下载PPT</el-button>
            <el-button type="default" size="small" @click="likeResult(currentTask)">收藏</el-button>
          </div>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="handleClose">关闭</el-button>
          </span>
        </template>
      </div>
    </el-dialog> -->
  </div>
</template>

<script setup name="AICreation">
import { ref, reactive, onMounted } from 'vue'
import { Plus, ArrowRight, ArrowUp, View, Delete, RefreshLeft, VideoCamera, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 创作表单
const creationForm = reactive({
  creationType: 'image_generation',
  style: 'modern',
  materials: [],
  description: '',
  generationCount: 1,
  qualityPreference: 'standard',
  customParams: ''
})

// 高级参数显示控制
const showAdvancedParams = ref(false)

// 可用素材列表
const availableMaterials = ref([
  { id: '1', name: '活动现场照片1.jpg' },
  { id: '2', name: '产品宣传视频.mp4' },
  { id: '3', name: '季度报告文档.docx' },
  { id: '4', name: '团队合影.jpg' },
  { id: '5', name: '会议记录.pdf' }
])

// 任务列表
const loading = ref(false)
const creating = ref(false)
const taskList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 结果预览弹窗
const resultVisible = ref(false)
const currentTask = ref({})

// 切换高级参数显示
const toggleAdvancedParams = () => {
  showAdvancedParams.value = !showAdvancedParams.value
}

// 创建内容
const createContent = () => {
  if (!creationForm.description.trim()) {
    ElMessage.warning('请输入创作描述')
    return
  }
  
  creating.value = true
  
  // 模拟创建任务
  setTimeout(() => {
    const newTask = {
      id: `task_${Date.now()}`,
      name: `创作任务_${new Date().toLocaleString()}`,
      type: creationForm.creationType,
      status: 'pending',
      progress: 0,
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
      materials: creationForm.materials,
      description: creationForm.description
    }
    
    taskList.value.unshift(newTask)
    total.value++
    
    // 模拟任务处理
    simulateTaskProcess(newTask)
    
    ElMessage.success('创作任务已创建')
    creating.value = false
  }, 1000)
}

// 模拟任务处理过程
const simulateTaskProcess = (task) => {
  setTimeout(() => {
    task.status = 'running'
    task.updateTime = new Date().toLocaleString()
    
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (task.progress >= 100) {
        clearInterval(progressInterval)
        task.status = 'completed'
        task.updateTime = new Date().toLocaleString()
        
        // 根据任务类型生成模拟结果
        if (task.type === 'image_generation') {
          task.results = [
            { url: 'https://picsum.photos/id/20/600/400', id: 'res1' },
            { url: 'https://picsum.photos/id/21/600/400', id: 'res2' }
          ]
        } else if (task.type === 'video_editing') {
          task.videoDuration = '60秒'
          task.videoQuality = '1080P'
        } else if (task.type === 'copywriting') {
          task.results = '这是一段根据您的需求生成的文案内容。本文案结合了现代简约风格，适合用于产品宣传和品牌推广。通过简洁明了的语言，突出产品的核心优势和价值主张，吸引目标客户的关注和兴趣。'
        } else if (task.type === 'ppt_creation') {
          task.pptPages = '12页'
        }
        
        ElMessage.success(`任务 ${task.name} 已完成`)
      } else {
        task.progress += Math.floor(Math.random() * 20) + 5
        if (task.progress > 100) task.progress = 100
        task.updateTime = new Date().toLocaleString()
      }
    }, 1000)
  }, 2000)
}

// 重置表单
const resetForm = () => {
  Object.keys(creationForm).forEach(key => {
    if (key === 'creationType') creationForm[key] = 'image_generation'
    else if (key === 'style') creationForm[key] = 'modern'
    else if (key === 'generationCount') creationForm[key] = 1
    else if (key === 'qualityPreference') creationForm[key] = 'standard'
    else if (Array.isArray(creationForm[key])) creationForm[key] = []
    else creationForm[key] = ''
  })
}

// 获取创作类型文本
const getCreationTypeText = (type) => {
  const typeMap = {
    'image_generation': '图片生成',
    'video_editing': '视频剪辑',
    'copywriting': '文案生成',
    'ppt_creation': 'PPT制作'
  }
  return typeMap[type] || type
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'running': 'info',
    'completed': 'success',
    'failed': 'danger'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '等待中',
    'running': '处理中',
    'completed': '已完成',
    'failed': '失败'
  }
  return textMap[status] || status
}

// 获取进度条状态
const getStatusProgressType = (status) => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'exception'
  if (status === 'running') return 'active'
  return ''
}

// 获取任务列表
const fetchTaskList = () => {
  loading.value = true
  // 模拟API请求
  setTimeout(() => {
    taskList.value = [
      {
        id: 'task_1694736000000',
        name: '产品宣传图片生成',
        type: 'image_generation',
        status: 'completed',
        progress: 100,
        createTime: '2023-09-15 09:00',
        updateTime: '2023-09-15 09:05',
        results: [
          { url: 'https://picsum.photos/id/20/600/400', id: 'res1' },
          { url: 'https://picsum.photos/id/21/600/400', id: 'res2' }
        ]
      },
      {
        id: 'task_1694732400000',
        name: '活动回顾视频剪辑',
        type: 'video_editing',
        status: 'completed',
        progress: 100,
        createTime: '2023-09-14 16:00',
        updateTime: '2023-09-14 16:30',
        videoDuration: '90秒',
        videoQuality: '1080P'
      },
      {
        id: 'task_1694728800000',
        name: '产品介绍文案',
        type: 'copywriting',
        status: 'completed',
        progress: 100,
        createTime: '2023-09-14 10:00',
        updateTime: '2023-09-14 10:05',
        results: '这是一段根据您的需求生成的产品介绍文案。我们的新产品采用了最先进的技术，具有高效、节能、环保等多项优势。它不仅能满足您的基本需求，还能为您带来全新的使用体验。欢迎了解更多产品详情。'
      },
      {
        id: 'task_1694725200000',
        name: '季度报告PPT',
        type: 'ppt_creation',
        status: 'failed',
        progress: 60,
        createTime: '2023-09-14 09:00',
        updateTime: '2023-09-14 09:15'
      }
    ]
    total.value = taskList.value.length
    loading.value = false
  }, 500)
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchTaskList()
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchTaskList()
}

// 查看结果
const viewResult = (task) => {
  currentTask.value = { ...task }
  resultVisible.value = true
}

// 取消任务
const cancelTask = (task) => {
  task.status = 'canceled'
  task.updateTime = new Date().toLocaleString()
  ElMessage.success(`任务 ${task.name} 已取消`)
}

// 重试任务
const retryTask = (task) => {
  task.status = 'pending'
  task.progress = 0
  task.updateTime = new Date().toLocaleString()
  simulateTaskProcess(task)
  ElMessage.success(`任务 ${task.name} 已重新开始`)
}

// 下载结果
const downloadResult = (result) => {
  ElMessage.success('正在下载结果')
}

// 收藏结果
const likeResult = (result) => {
  ElMessage.success('已收藏该结果')
}

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('文本已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 关闭弹窗
const handleClose = () => {
  resultVisible.value = false
}

// 组件挂载时获取任务列表
onMounted(() => {
  fetchTaskList()
})
</script>

<style scoped lang="scss">
.creation-settings {
  margin-bottom: 30px;
  .form-row {
    margin-bottom: 15px;
    display: flex;
    align-items: flex-start;
  }
  .advanced-params {
    margin-top: 15px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }
}

.creation-tasks {
  h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }
}

.result-dialog {
  .image-results {
    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .result-item {
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      overflow: hidden;
      .result-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
      }
      .result-actions {
        padding: 10px;
        display: flex;
        gap: 10px;
      }
    }
  }
  
  .video-result,
  .ppt-result {
    .video-placeholder,
    .ppt-placeholder {
      width: 100%;
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 20px;
      el-icon {
        font-size: 64px;
        color: #909399;
        margin-bottom: 10px;
      }
      span {
        font-size: 16px;
        color: #909399;
      }
    }
    .result-info {
      margin-bottom: 20px;
      h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
      }
      p {
        margin: 5px 0;
        color: #606266;
      }
    }
  }
  
  .copywriting-result {
    .result-text {
      margin-bottom: 20px;
      h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
      }
      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        background-color: #f5f7fa;
        padding: 15px;
        border-radius: 4px;
        color: #303133;
        max-height: 400px;
        overflow-y: auto;
      }
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>