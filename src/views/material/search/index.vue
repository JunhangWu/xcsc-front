<template>
  <div class="app-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">素材检索</div>
      </div>
      <div class="card-body">
        <!-- 搜索和筛选面板 -->
        <div class="search-panel">
          <div class="search-row">
            <el-input
              v-model="searchKeyword"
              placeholder="请输入素材名称、标签或描述内容"
              style="width: 400px; margin-right: 10px;"
              @keyup.enter="searchMaterials"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="searchMaterials" icon="Search">搜索</el-button>
            <el-button @click="resetSearch" icon="RefreshRight">重置</el-button>
          </div>
          
          <!-- 高级筛选 -->
          <el-collapse v-model="activeFilterNames">
            <el-collapse-item title="高级筛选" name="filter">
              <div class="filter-content">
                <div class="filter-row">
                  <el-form :model="filterForm" label-width="80px" inline>
                    <el-form-item label="素材类型">
                      <el-select v-model="filterForm.type" placeholder="请选择素材类型" multiple>
                        <el-option label="图片" value="image" />
                        <el-option label="视频" value="video" />
                        <el-option label="文档" value="document" />
                        <el-option label="音频" value="audio" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="上传时间">
                      <el-date-picker
                        v-model="filterForm.uploadTimeRange"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        :default-time="['00:00:00', '23:59:59']"
                      />
                    </el-form-item>
                    
                    <el-form-item label="大小范围">
                      <el-input-number
                        v-model="filterForm.minSize"
                        placeholder="最小值(KB)"
                        :min="0"
                        style="width: 100px;"
                      />
                      <span style="margin: 0 10px;">-</span>
                      <el-input-number
                        v-model="filterForm.maxSize"
                        placeholder="最大值(KB)"
                        :min="0"
                        style="width: 100px;"
                      />
                    </el-form-item>
                  </el-form>
                </div>
                
                <div class="filter-row">
                  <el-form :model="filterForm" label-width="80px" inline>
                    <el-form-item label="场景分类">
                      <el-select v-model="filterForm.scene" placeholder="请选择场景分类" multiple>
                        <el-option label="会议场景" value="meeting" />
                        <el-option label="活动现场" value="event" />
                        <el-option label="办公场景" value="office" />
                        <el-option label="户外场景" value="outdoor" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="标签筛选">
                      <el-select v-model="filterForm.tags" placeholder="请选择标签" multiple filterable>
                        <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="标注状态">
                      <el-select v-model="filterForm.annotationStatus" placeholder="请选择标注状态">
                        <el-option label="全部" value="" />
                        <el-option label="未标注" value="unannotated" />
                        <el-option label="已标注" value="annotated" />
                      </el-select>
                    </el-form-item>
                  </el-form>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
        
        <!-- 搜索结果统计 -->
        <div class="search-result-stats">
          <span>找到 <strong>{{ total }}</strong> 条相关素材</span>
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
                  @click="previewMaterial(scope.row)"
                  style="cursor: pointer;"
                />
                <div v-else-if="scope.row.type.includes('video')" class="video-icon" @click="previewMaterial(scope.row)" style="cursor: pointer;">
                  <el-icon><video-camera /></el-icon>
                </div>
                <div v-else class="file-icon" @click="previewMaterial(scope.row)" style="cursor: pointer;">
                  <el-icon><document /></el-icon>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="素材名称" />
            <el-table-column prop="size" label="大小(KB)" width="100" />
            <el-table-column prop="type" label="类型" width="150" />
            <el-table-column prop="uploadTime" label="上传时间" width="180" />
            <el-table-column label="标签" width="200">
              <template #default="scope">
                <div class="tag-list">
                  <el-tag 
                    v-for="tag in scope.row.tags"
                    :key="tag"
                    size="small"
                    v-if="tag"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="previewMaterial(scope.row)"
                    icon="View"
                  >
                    预览
                  </el-button>
                  <el-button 
                    type="default" 
                    size="small" 
                    @click="downloadMaterial(scope.row)"
                    icon="Download"
                  >
                    下载
                  </el-button>
                </div>
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
    
    <!-- 素材预览弹窗 -->
    <!-- <el-dialog
      v-model="previewVisible"
      title="素材预览"
      width="80%"
      :before-close="handleClose"
    >
      <div class="preview-dialog">
        <div class="preview-content">
          <div v-if="selectedMaterial.type.includes('image')" class="image-preview">
            <img :src="selectedMaterial.url" class="full-image" />
          </div>
          <div v-else-if="selectedMaterial.type.includes('video')" class="video-preview">
            <div class="video-placeholder">
              <el-icon><video-camera /></el-icon>
              <span>视频预览区域</span>
            </div>
          </div>
          <div v-else class="document-preview">
            <div class="document-placeholder">
              <el-icon><document /></el-icon>
              <span>文档预览区域</span>
            </div>
          </div>
          
          <div class="material-info">
            <h3>{{ selectedMaterial.name }}</h3>
            <div class="info-row">
              <span class="info-label">素材ID:</span>
              <span class="info-value">{{ selectedMaterial.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">大小:</span>
              <span class="info-value">{{ selectedMaterial.size }} KB</span>
            </div>
            <div class="info-row">
              <span class="info-label">类型:</span>
              <span class="info-value">{{ selectedMaterial.type }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">上传时间:</span>
              <span class="info-value">{{ selectedMaterial.uploadTime }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">标签:</span>
              <div class="tag-list">
                <el-tag 
                  v-for="tag in selectedMaterial.tags"
                  :key="tag"
                  size="small"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <span class="info-label">描述:</span>
              <span class="info-value">{{ selectedMaterial.description || '无' }}</span>
            </div>
          </div>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="handleClose">关闭</el-button>
            <el-button type="primary" @click="downloadMaterial(selectedMaterial)">下载素材</el-button>
          </span>
        </template>
      </div>
    </el-dialog> -->
  </div>
</template>

<script setup name="MaterialSearch">
import { ref, reactive, onMounted } from 'vue'
import { Search, VideoCamera, Document, View, Download, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 搜索关键词
const searchKeyword = ref('')

// 高级筛选
const activeFilterNames = ref([])
const filterForm = reactive({
  type: [],
  uploadTimeRange: [],
  minSize: null,
  maxSize: null,
  scene: [],
  tags: [],
  annotationStatus: ''
})

// 可用标签列表
const availableTags = ref([
  '会议', '活动', '报告', '产品', '团队', '办公', '户外', '文档', '照片', '视频'
])

// 素材列表
const loading = ref(false)
const materialList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 预览弹窗
const previewVisible = ref(false)
const selectedMaterial = ref({})

// 搜索素材
const searchMaterials = () => {
  fetchMaterialList()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  Object.keys(filterForm).forEach(key => {
    filterForm[key] = typeof filterForm[key] === 'string' ? '' : []
    if (key === 'minSize' || key === 'maxSize') {
      filterForm[key] = null
    }
  })
  currentPage.value = 1
  fetchMaterialList()
}

// 获取素材列表
const fetchMaterialList = () => {
  loading.value = true
  // 模拟API请求
  setTimeout(() => {
    const mockData = [
      {
        id: '1',
        name: '活动现场照片1.jpg',
        url: 'https://picsum.photos/id/1/400/300',
        size: 245,
        type: 'image/jpeg',
        uploadTime: '2023-09-15 10:23',
        tags: ['活动', '照片', '场景'],
        description: '公司年度活动现场照片'
      },
      {
        id: '2',
        name: '产品宣传视频.mp4',
        url: '',
        size: 12540,
        type: 'video/mp4',
        uploadTime: '2023-09-14 15:36',
        tags: ['产品', '视频', '宣传'],
        description: '新产品宣传视频'
      },
      {
        id: '3',
        name: '季度报告文档.docx',
        url: '',
        size: 356,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadTime: '2023-09-13 09:12',
        tags: ['报告', '文档', '财务'],
        description: '2023年第三季度财务报告'
      },
      {
        id: '4',
        name: '团队合影.jpg',
        url: 'https://picsum.photos/id/1005/400/300',
        size: 320,
        type: 'image/jpeg',
        uploadTime: '2023-09-12 16:45',
        tags: ['团队', '照片', '合影'],
        description: '市场部团队合影'
      },
      {
        id: '5',
        name: '会议记录.pdf',
        url: '',
        size: 180,
        type: 'application/pdf',
        uploadTime: '2023-09-10 14:30',
        tags: ['会议', '记录', '文档'],
        description: '项目启动会议记录'
      }
    ]
    
    // 模拟搜索过滤
    let filteredData = [...mockData]
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.toLowerCase().trim()
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(keyword) ||
        item.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
        (item.description && item.description.toLowerCase().includes(keyword))
      )
    }
    
    // 模拟高级筛选
    if (filterForm.type.length > 0) {
      filteredData = filteredData.filter(item => {
        for (const type of filterForm.type) {
          if (item.type.includes(type)) {
            return true
          }
        }
        return false
      })
    }
    
    // 这里可以添加更多筛选逻辑
    
    // 模拟分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    materialList.value = filteredData.slice(start, end)
    total.value = filteredData.length
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

// 预览素材
const previewMaterial = (material) => {
  selectedMaterial.value = { ...material }
  previewVisible.value = true
}

// 下载素材
const downloadMaterial = (material) => {
  // 模拟下载操作
  ElMessage.success(`正在下载素材: ${material.name}`)
}

// 关闭弹窗
const handleClose = () => {
  previewVisible.value = false
}

// 组件挂载时获取素材列表
onMounted(() => {
  fetchMaterialList()
})
</script>

<style scoped lang="scss">
.search-panel {
  margin-bottom: 20px;
  .search-row {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }
  .filter-content {
    .filter-row {
      margin-bottom: 15px;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.search-result-stats {
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
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

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.preview-dialog {
  .preview-content {
    display: flex;
    gap: 20px;
    max-height: 600px;
    overflow-y: auto;
    .image-preview,
    .video-preview,
    .document-preview {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      border-radius: 4px;
      min-height: 400px;
      .full-image {
        max-width: 100%;
        max-height: 500px;
        object-fit: contain;
      }
      .video-placeholder,
      .document-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #909399;
        & > span {
          font-size: 16px;
        }
      }
    }
    .material-info {
      flex: 1;
      min-width: 300px;
      h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 500;
        color: #303133;
      }
      .info-row {
        margin-bottom: 15px;
        display: flex;
        align-items: flex-start;
        .info-label {
          width: 80px;
          font-weight: 500;
          color: #606266;
        }
        .info-value {
          flex: 1;
          color: #303133;
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

.operation-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>