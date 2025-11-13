<template>
  <div class="app-container">
    <div class="main-content">
      <!-- 左侧搜索历史 -->
      <div class="sidebar">
        <div class="history-section">
          <h3>最近搜索</h3>
          <div class="history-list" v-if="searchHistory.length > 0">
            <div 
              v-for="(item, index) in searchHistory" 
              :key="item.id || index" 
              class="history-item"
            >
              <div class="history-content" @click="searchWithHistory(item.query)">
                <div class="history-info">
                  <div class="history-keyword">{{ item.query }}</div>
                  <div class="history-time">{{ parseTime(item.createTime) }}</div>
                </div>
                <div class="history-result">
                  <span>{{ item.resultCount }}个结果</span>
                </div>
              </div>
              <div class="history-delete" @click.stop="deleteSingleHistory(item.id)">
                <el-icon class="delete-icon"><Delete /></el-icon>
              </div>
            </div>
          </div>
          <div v-else class="no-history">
            <div class="no-history-icon">
              <el-icon><Search /></el-icon>
            </div>
            <p>暂无搜索记录</p>
          </div>
          <div class="history-actions">
            <el-button 
              v-if="searchHistory.length > 0"
              type="text" 
              size="small" 
              @click="clearHistory"
            >
              <el-icon><RefreshRight /></el-icon>
              清空全部历史
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧主内容 -->
      <div class="search-content">
        <!-- 页面标题和描述 -->
        <div class="header-section">
          <h1 class="page-title">AI智能搜索</h1>
          <p class="page-description">使用AI技术快速查找和分析宣传素材，支持自然语言查询和智能推荐。</p>
        </div>

        <!-- 搜索框 -->
        <div class="search-box-container">
          <div class="search-input-wrapper">
            <el-input
              v-model="searchKeyword"
              placeholder="请输入搜索关键词或问题..."
              style="width: 100%;"
              @keyup.enter="searchMaterials"
            >
              <template #append>
                <el-button type="primary" @click="searchMaterials" class="ai-search-button">
                  <el-icon><Search /></el-icon> AI搜索
                </el-button>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 搜索示例 -->
        <div class="examples-section" v-if="showExamples">
          <h3>搜索示例:</h3>
          <div class="examples-list">
            <el-tag 
              v-for="example in searchExamples" 
              :key="example.id" 
              class="example-tag"
              @click="searchWithExample(example.text)"
            >
              {{ example.text }}
            </el-tag>
          </div>
        </div>

        <!-- 搜索结果区域 -->
        <div v-if="showResults" class="search-results">
          <div class="search-result-stats">
            <span>找到 <strong>{{ total }}</strong> 条相关素材</span>
          </div>
          
          <!-- 素材网格 -->
          <div class="material-grid" v-loading="loading">
            <div 
              v-for="material in materialList" 
              :key="material.id" 
              class="material-card"
            >
              <!-- 素材预览 -->
              <div class="material-preview-container" @click="previewMaterial(material)" style="cursor: pointer;">
                <img 
                  v-if="material.type.includes('image')" 
                  :src="material.url" 
                  class="material-thumbnail" 
                />
                <div v-else-if="material.type.includes('video')" class="video-placeholder">
                  <el-icon><VideoCamera /></el-icon>
                </div>
                <div v-else class="document-placeholder">
                  <el-icon><Document /></el-icon>
                </div>
              </div>
              
              <!-- 素材信息 -->
              <div class="material-info">
                <div class="material-name" :title="material.name">{{ material.name }}</div>
                <div class="material-meta">
                  <span class="material-size">{{ material.size }} KB</span>
                  <span class="material-type">{{ material.type.split('/')[1].toUpperCase() }}</span>
                </div>
                <div class="material-tags">
                  <el-tag 
                    v-for="tag in material.tags.slice(0, 3)"
                    :key="tag"
                    size="small"
                    v-if="tag"
                  >
                    {{ tag }}
                  </el-tag>
                  <el-tag 
                    v-if="material.tags.length > 3"
                    size="small"
                    type="info"
                  >
                    +{{ material.tags.length - 3 }}
                  </el-tag>
                </div>
                <div class="material-upload-time">{{ material.uploadTime }}</div>
                
                <!-- 操作按钮 -->
                <div class="material-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click.stop="previewMaterial(material)"
                    icon="View"
                  >
                    预览
                  </el-button>
                  <el-button 
                    type="default" 
                    size="small" 
                    @click.stop="downloadMaterial(material)"
                    icon="Download"
                  >
                    下载
                  </el-button>
                </div>
              </div>
            </div>
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

        <!-- 初始状态提示 -->
        <div v-if="!showResults && !showExamples" class="search-suggestion">
          <div class="suggestion-icon">
            <el-icon><Search /></el-icon>
          </div>
          <p class="suggestion-text">输入关键词开始AI搜索</p>
        </div>
      </div>
    </div>
    
    <!-- 素材预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="素材预览"
      width="80%"
      :before-close="handleClose"
    >
      <div class="preview-dialog">
        <div class="preview-content">
          <div v-if="selectedMaterial.type?.includes('image')" class="image-preview">
            <img :src="selectedMaterial.url" class="full-image" />
          </div>
          <div v-else-if="selectedMaterial.type?.includes('video')" class="video-preview">
            <div class="video-placeholder">
              <el-icon><VideoCamera /></el-icon>
              <span>视频预览区域</span>
            </div>
          </div>
          <div v-else class="document-preview">
            <div class="document-placeholder">
              <el-icon><Document /></el-icon>
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
        
        <!-- <template #footer> -->
          <span class="dialog-footer">
            <el-button @click="handleClose">关闭</el-button>
            <el-button type="primary" @click="downloadMaterial(selectedMaterial)">下载素材</el-button>
          </span>
        <!-- </template> -->
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="MaterialSearch">
import { ref, reactive, onMounted } from 'vue'
import { Search, VideoCamera, Document, View, Download, RefreshRight, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getSearchList, addSearch, delSearch } from "@/api/xcsc/search"
import useUserStore from '@/store/modules/user'
//当前用户
const userStore = useUserStore()
// 搜索关键词
const searchKeyword = ref('')

// 素材列表
const loading = ref(false)
const materialList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 预览弹窗
const previewVisible = ref(false)
const selectedMaterial = ref({})

// 界面状态控制
const showExamples = ref(true)
const showResults = ref(false)

// 搜索历史
const searchHistory = ref([])

// 搜索示例
const searchExamples = ref([
  {
    id: 1,
    text: '查找所有2024年的产品宣传图片'
  },
  {
    id: 2,
    text: '哪些素材适合用于季度销售报告'
  },
  {
    id: 3,
    text: '查找包含"新产品发布"关键词的图片'
  },
  {
    id: 4,
    text: '查找最近上传的视频素材'
  }
])

// 搜索素材
const searchMaterials = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  fetchMaterialList()
  
  // 保存到搜索历史
  saveToSearchHistory(searchKeyword.value.trim())
}

// 保存搜索历史
const saveToSearchHistory = async (keyword) => {
  // debugger
  try {
    // 调用API保存搜索记录
    const data = {
      query: keyword,
      userId: userStore.id,
      // searchResult: searchResult,
    }
    await addSearch(data)
    
    // 重新获取搜索历史列表
    await fetchSearchHistory(userStore.id)
  } catch (error) {
    console.error('保存搜索历史失败:', error)
    ElMessage.error('保存搜索历史失败')
  }
}

// 从历史记录搜索
const searchWithHistory = (keyword) => {
  searchKeyword.value = keyword
  fetchMaterialList()
}

// 使用搜索示例
const searchWithExample = (text) => {
  searchKeyword.value = text
  fetchMaterialList()
  saveToSearchHistory(text)
}

// 删除单条搜索历史
const deleteSingleHistory = async (id) => {
  // debugger
  try {
    await delSearch({ id })
    // 重新获取搜索历史列表
    await fetchSearchHistory(userStore.id)
    ElMessage.success('搜索记录已删除')
  } catch (error) {
    console.error('删除搜索记录失败:', error)
    ElMessage.error('删除搜索记录失败')
  }
}

// 清空搜索历史
const clearHistory = async () => {
  try {
    await delSearch({})
    searchHistory.value = []
    ElMessage.success('搜索历史已清空')
  } catch (error) {
    console.error('清空搜索历史失败:', error)
    ElMessage.error('清空搜索历史失败')
  }
}

// 获取搜索历史
const fetchSearchHistory = async () => {
  try {
    let params = {
        userId: userStore.id,
    }
    console.log('userStore.id', userStore.id)
    const response = await getSearchList(params)
    // getSearchList(params).then(res => {
    //   searchHistory.value = res.data || []

    // })
    // 假设API返回的数据格式需要转换为组件需要的格式
    searchHistory.value = response.data || []
    console.log('response',response)
  } catch (error) {
    console.log('暂无搜索历史')
    // ElMessage.error('获取搜索历史失败')
  }
}

// 获取素材列表
const fetchMaterialList = () => {
  loading.value = true
  showExamples.value = false
  showResults.value = true
  
  // 模拟API请求 - 注意：这里需要根据实际的素材搜索API进行修改
  // 由于没有看到素材搜索的API，暂时保留模拟数据逻辑
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

// 组件挂载时初始化
onMounted(() => {
  // 获取搜索历史
  fetchSearchHistory()
})
</script>

<style scoped lang="scss">
.main-content {
  display: flex;
  gap: 20px;
  width: 100%;
}

/* 左侧搜索历史样式 */
.sidebar {
  width: 300px;
  flex-shrink: 0;
  .history-section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }
    .history-list {
      .history-item {
          padding: 12px;
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s;
          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
          }
          .history-content {
            flex: 1;
            cursor: pointer;
          }
          .history-delete {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 4px;
            margin-left: 8px;
            cursor: pointer;
            opacity: 0;
            transition: all 0.3s;
            .delete-icon {
              color: #909399;
              font-size: 16px;
            }
          }
          &:hover .history-delete {
            opacity: 1;
          }
          .history-delete:hover {
            background-color: #f56c6c;
            .delete-icon {
              color: white;
            }
          }
        .history-info {
          .history-keyword {
            font-size: 14px;
            color: #303133;
            margin-bottom: 4px;
          }
          .history-time {
            font-size: 12px;
            color: #909399;
          }
        }
        .history-result {
          font-size: 12px;
          color: #606266;
          margin-top: 8px;
        }
      }
    }
    .no-history {
      text-align: center;
      padding: 40px 20px;
      color: #909399;
      .no-history-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: #c0c4cc;
      }
      p {
        margin: 0;
        font-size: 14px;
      }
    }
    .history-actions {
      margin-top: 16px;
      text-align: center;
    }
  }
}

/* 右侧主内容样式 */
.search-content {
  flex: 1;
  .header-section {
    margin-bottom: 24px;
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }
    .page-description {
      font-size: 14px;
      color: #606266;
      margin: 0;
    }
  }
  .search-box-container {
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    .search-input-wrapper {
      width: 100%;
      max-width: 800px;
      .ai-search-button {
        background-color: #409eff;
        border-color: #409eff;
        color: white;
        &:hover {
          background-color: #66b1ff;
          border-color: #66b1ff;
          color: white;
        }
      }
    }
  }
  .examples-section {
    margin-bottom: 24px;
    h3 {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin: 0 0 12px 0;
    }
    .examples-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .example-tag {
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
      }
    }
  }
  .search-results {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .search-suggestion {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #909399;
  }
  .suggestion-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #c0c4cc;
  }
  .suggestion-text {
    font-size: 16px;
    margin: 0;
  }
}

.search-result-stats {
  margin-bottom: 20px;
  font-size: 14px;
  color: #606266;
}

/* 网格布局样式 */
.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.material-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  background: white;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.material-preview-container {
  height: 180px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.material-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder,
.document-placeholder {
  font-size: 48px;
  color: #909399;
}

.material-info {
  padding: 16px;
}

.material-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.material-tags {
  margin-bottom: 12px;
}

.material-upload-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 16px;
}

.material-actions {
  display: flex;
  gap: 8px;
}

.thumbnail {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
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