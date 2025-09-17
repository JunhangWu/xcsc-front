<template>
  <div class="app-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">素材标注管理</div>
      </div>
      <div class="card-body">
        <!-- 搜索和筛选 -->
        <div class="search-filter">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入素材名称或标签"
            style="width: 300px; margin-right: 10px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="statusFilter" placeholder="标注状态" style="width: 150px; margin-right: 10px;">
            <el-option label="全部" value="" />
            <el-option label="待标注" value="pending" />
            <el-option label="自动标注中" value="auto_annotating" />
            <el-option label="待人工审核" value="manual_review" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-button type="primary" @click="searchMaterial" icon="Search">搜索</el-button>
        </div>
        
        <!-- 素材列表 -->
        <div class="material-list">
          <el-table v-loading="loading" :data="materialList" style="width: 100%">
            <el-table-column prop="id" label="素材ID" width="80" />
            <el-table-column label="素材预览" width="100">
              <template #default="scope">
                <img 
                  v-if="scope.row.type.includes('image')" 
                  :src="scope.row.url" 
                  class="thumbnail" 
                  @click="showMaterialDetail(scope.row)"
                  style="cursor: pointer;"
                />
                <div v-else-if="scope.row.type.includes('video')" class="video-icon" @click="showMaterialDetail(scope.row)" style="cursor: pointer;">
                  <el-icon><VideoCamera /></el-icon>
                </div>
                <div v-else class="file-icon" @click="showMaterialDetail(scope.row)" style="cursor: pointer;">
                  <el-icon><Document /></el-icon>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="素材名称" />
            <el-table-column prop="size" label="大小(KB)" width="100" />
            <el-table-column prop="type" label="类型" width="150" />
            <el-table-column prop="uploadTime" label="上传时间" width="180" />
            <el-table-column prop="status" label="标注状态" width="120">
              <template #default="scope">
                <el-tag 
                  :type="getStatusTagType(scope.row.status)"
                  size="small"
                >
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="showMaterialDetail(scope.row)"
                  icon="Edit"
                >
                  标注
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
    
    <!-- 素材详情和标注弹窗 -->
    <!-- <el-dialog
      v-model="dialogVisible"
      title="素材标注"
      width="80%"
      :before-close="handleClose"
    >
      <div class="annotation-dialog">
        <div class="annotation-content">
          <div class="material-preview">
            <img v-if="currentMaterial.type.includes('image')" :src="currentMaterial.url" class="preview-image" />
            <div v-else-if="currentMaterial.type.includes('video')" class="preview-video">
              <el-icon><VideoCamera /></el-icon>
              <span>视频预览区域</span>
            </div>
            <div v-else class="preview-file">
              <el-icon><Document /></el-icon>
              <span>文档预览区域</span>
            </div>
          </div>
          <div class="annotation-info">
            <h3>标注信息</h3>
            
            <div class="annotation-section">
              <h4>自动标注标签</h4>
              <div class="tag-list">
                <el-tag 
                  v-for="tag in autoTags" 
                  :key="tag.key"
                  size="small"
                  :type="tag.approved ? 'success' : ''"
                  closable
                  @close="removeAutoTag(tag.key)"
                >
                  {{ tag.value }}
                  <template #close>
                    <el-icon v-if="!tag.approved"><Check /></el-icon>
                  </template>
                </el-tag>
              </div>
            </div>
            
            <div class="annotation-section">
              <h4>人工标注标签</h4>
              <div class="tag-input-section">
                <el-input
                  v-model="newManualTag"
                  placeholder="输入新标签"
                  style="width: 200px; margin-right: 10px;"
                  @keyup.enter="addManualTag"
                />
                <el-button type="primary" size="small" @click="addManualTag">添加</el-button>
              </div>
              <div class="tag-list">
                <el-tag 
                  v-for="tag in manualTags" 
                  :key="tag"
                  size="small"
                  type="primary"
                  closable
                  @close="removeManualTag(tag)"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            <div class="annotation-section">
              <h4>标注分类</h4>
              <el-form :model="annotationForm" label-width="80px">
                <el-form-item label="场景分类">
                  <el-select v-model="annotationForm.scene" placeholder="请选择场景分类" multiple>
                    <el-option label="会议场景" value="meeting" />
                    <el-option label="活动现场" value="event" />
                    <el-option label="办公场景" value="office" />
                    <el-option label="户外场景" value="outdoor" />
                  </el-select>
                </el-form-item>
                <el-form-item label="人物行为">
                  <el-input v-model="annotationForm.behavior" placeholder="请输入人物行为描述" />
                </el-form-item>
                <el-form-item label="专有名词">
                  <el-input v-model="annotationForm.properNoun" placeholder="请输入专有名词" />
                </el-form-item>
                <el-form-item label="备注信息">
                  <el-input v-model="annotationForm.remark" type="textarea" placeholder="请输入备注信息" />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="handleClose">关闭</el-button>
            <el-button type="primary" @click="saveAnnotation">保存标注</el-button>
          </span>
        </template>
      </div>
    </el-dialog> -->
  </div>
</template>

<script setup name="MaterialAnnotation">
import { ref, reactive, onMounted } from 'vue'
import { Search, VideoCamera, Document, Check, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('')

// 素材列表
const loading = ref(false)
const materialList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 弹窗相关
const dialogVisible = ref(false)
const currentMaterial = ref({})

// 标注信息
const autoTags = ref([])
const manualTags = ref([])
const newManualTag = ref('')
const annotationForm = reactive({
  scene: [],
  behavior: '',
  properNoun: '',
  remark: ''
})

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'auto_annotating': 'info',
    'manual_review': 'primary',
    'completed': 'success'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待标注',
    'auto_annotating': '自动标注中',
    'manual_review': '待人工审核',
    'completed': '已完成'
  }
  return textMap[status] || status
}

// 搜索素材
const searchMaterial = () => {
  fetchMaterialList()
}

// 获取素材列表
const fetchMaterialList = () => {
  loading.value = true
  // 模拟API请求
  setTimeout(() => {
    materialList.value = [
      {
        id: '1',
        name: '活动现场照片1.jpg',
        url: 'https://picsum.photos/id/1/400/300',
        size: 245,
        type: 'image/jpeg',
        uploadTime: '2023-09-15 10:23',
        status: 'manual_review'
      },
      {
        id: '2',
        name: '产品宣传视频.mp4',
        url: '',
        size: 12540,
        type: 'video/mp4',
        uploadTime: '2023-09-14 15:36',
        status: 'pending'
      },
      {
        id: '3',
        name: '季度报告文档.docx',
        url: '',
        size: 356,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadTime: '2023-09-13 09:12',
        status: 'completed'
      },
      {
        id: '4',
        name: '团队合影.jpg',
        url: 'https://picsum.photos/id/1005/400/300',
        size: 320,
        type: 'image/jpeg',
        uploadTime: '2023-09-12 16:45',
        status: 'auto_annotating'
      }
    ]
    total.value = 24
    loading.value = false
  }, 500)
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchMaterialList()
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchMaterialList()
}

// 显示素材详情
const showMaterialDetail = (material) => {
  currentMaterial.value = { ...material }
  
  // 模拟加载标注数据
  if (material.status === 'manual_review') {
    autoTags.value = [
      { key: 'scene_meeting', value: '会议场景', approved: false },
      { key: 'object_chair', value: '椅子', approved: false },
      { key: 'object_screen', value: '屏幕', approved: false },
      { key: 'color_white', value: '白色', approved: false }
    ]
  } else if (material.status === 'completed') {
    autoTags.value = [
      { key: 'document_report', value: '报告文档', approved: true }
    ]
    manualTags.value = ['季度报告', '财务数据']
    annotationForm.scene = ['office']
    annotationForm.behavior = ''
    annotationForm.properNoun = '财务报表'
    annotationForm.remark = '2023年第三季度财务报告'
  } else {
    autoTags.value = []
    manualTags.value = []
    Object.keys(annotationForm).forEach(key => {
      annotationForm[key] = typeof annotationForm[key] === 'string' ? '' : []
    })
  }
  
  newManualTag.value = ''
  dialogVisible.value = true
}

// 添加人工标注标签
const addManualTag = () => {
  if (!newManualTag.value.trim()) {
    ElMessage.warning('请输入标签内容')
    return
  }
  
  if (manualTags.value.includes(newManualTag.value.trim())) {
    ElMessage.warning('该标签已存在')
    return
  }
  
  manualTags.value.push(newManualTag.value.trim())
  newManualTag.value = ''
}

// 移除自动标注标签
const removeAutoTag = (key) => {
  const index = autoTags.value.findIndex(tag => tag.key === key)
  if (index > -1) {
    autoTags.value.splice(index, 1)
  }
}

// 移除人工标注标签
const removeManualTag = (tag) => {
  const index = manualTags.value.indexOf(tag)
  if (index > -1) {
    manualTags.value.splice(index, 1)
  }
}

// 保存标注
const saveAnnotation = () => {
  // 模拟保存操作
  loading.value = true
  setTimeout(() => {
    loading.value = false
    dialogVisible.value = false
    ElMessage.success('标注信息保存成功')
    // 更新素材状态
    const material = materialList.value.find(item => item.id === currentMaterial.value.id)
    if (material) {
      material.status = 'completed'
    }
  }, 800)
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
}

// 组件挂载时获取素材列表
onMounted(() => {
  fetchMaterialList()
})
</script>

<style scoped lang="scss">
.search-filter {
  display: flex;
  margin-bottom: 20px;
  align-items: center;
}

.thumbnail {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.video-icon,
.file-icon {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}

.annotation-dialog {
  .annotation-content {
    display: flex;
    gap: 20px;
    max-height: 500px;
    overflow-y: auto;
    .material-preview {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      border-radius: 4px;
      min-height: 300px;
      .preview-image {
        max-width: 100%;
        max-height: 400px;
        object-fit: contain;
      }
      .preview-video,
      .preview-file {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #909399;
        span {
          font-size: 16px;
        }
      }
    }
    .annotation-info {
      flex: 1;
      .annotation-section {
        margin-bottom: 20px;
        h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }
        .tag-input-section {
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
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