<template>
  <div class="app-container home">
    <!-- 顶部功能入口 -->
    <div class="top-nav">
      <el-button 
        v-for="module in topModules" 
        :key="module.name"
        type="primary" 
        link
        @click="navigateToModule(module.path)"
        class="nav-btn"
      >
        <el-icon class="nav-icon">
          <component :is="module.icon" />
        </el-icon>
        {{ module.title }}
      </el-button>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧边栏 -->
      <div class="sidebar">
        <!-- 个人空间模块 -->
        <div class="sidebar-section">
          <h3 class="section-title">个人空间</h3>
          <div class="space-list">
            <div 
              v-for="item in personalSpace" 
              :key="item.id"
              :class="['space-item', { active: activeSpace === item.id }]"
              @click="handleSpaceClick(item.id)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.name }}</span>
            </div>
          </div>
        </div>

        <!-- 板块分类模块 -->
        <div class="sidebar-section">
          <h3 class="section-title">板块分类</h3>
          <div class="category-list">
            <div 
              v-for="category in categories" 
              :key="category"
              :class="['category-item', { active: activeCategory === category }]"
              @click="handleCategoryClick(category)"
            >
              {{ category }}
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="content-area">
        <!-- 筛选搜索栏 -->
        <div class="filter-bar">
          <el-form :model="filterForm" inline>
            <el-form-item label="素材类型：">
              <el-select v-model="filterForm.type" placeholder="请选择" clearable>
                <el-option label="图片" value="image" />
                <el-option label="视频" value="video" />
                <el-option label="文档" value="document" />
                <el-option label="PPT" value="ppt" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="日期范围：">
              <el-date-picker
                v-model="filterForm.dateRange"
                type="daterange"
                format="YYYY/MM/DD"
                value-format="YYYY/MM/DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>
            
            <el-form-item label="上传者：">
              <el-input v-model="filterForm.uploader" placeholder="请输入上传者" clearable />
            </el-form-item>
            
            <el-form-item label="素材标签：">
              <el-input v-model="filterForm.tags" placeholder="请输入素材标签" clearable />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="handleQuery">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 文件信息区 -->
        <div class="file-info">
          <span>共 {{ filteredFiles }} 个文件</span>
        </div>

        <!-- 素材列表区 -->
        <div class="material-list">
          <!-- 当有文件需要显示时 -->
          <template v-if="filteredFiles > 0">
            <div v-for="(group, date) in groupedMaterials" :key="date" class="date-group">
              <h4 class="group-title">{{ date }}</h4>
              <div class="material-grid">
                <div 
                  v-for="material in group" 
                  :key="material.id"
                  class="material-item"
                  @click="handleMaterialClick(material)"
                >
                  <div class="material-thumb">
                    <img v-if="material.type === 'image'" :src="material.thumbnail" :alt="material.name" />
                    <el-icon v-else class="file-icon">
                      <VideoPlay v-if="material.type === 'video'" />
                      <Document v-else-if="material.type === 'document'" />
                      <Collection v-else-if="material.type === 'ppt'" />
                    </el-icon>
                  </div>
                  <div class="material-name">{{ material.name }}</div>
          <div class="material-tags">
            <template v-for="(tagArray, tagType) in material.tags" :key="tagType">
              <el-tag 
                v-for="tag in tagArray"
                :key="tag"
                size="small"
                type="primary"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </template>
          </div>
          <div class="material-actions">
            <el-button 
              :type="material.isFavorite ? 'warning' : 'default'"
              size="small"
              @click="toggleFavorite($event, material)"
              :icon="material.isFavorite ? 'StarFilled' : 'Star'"
              class="favorite-btn"
            >
              {{ material.isFavorite ? '取消收藏' : '收藏' }}
            </el-button>
            <el-button 
              type="primary"
              size="small"
              @click="handleDownload($event, material)"
              icon="Download"
              class="download-btn"
            >
              下载
            </el-button>
          </div>
            </div>
              </div>
            </div>
          </template>
          <!-- 无文件时显示空状态 -->
          <div v-else class="empty-state">
            <el-empty description="暂无内容" />
          </div>
        </div>

        <!-- 分页栏 -->
        <div class="pagination">
          <span class="pagination-info">显示 {{ pagination.start }} - {{ pagination.end }} 共 {{ filteredFiles }} 个文件</span>
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredFiles"
            layout="prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="Index">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, onBeforeRouteUpdate } from 'vue-router'
import { 
  UploadFilled, 
  Tools, 
  MagicStick, 
  VideoPlay, 
  Document, 
  Collection,
  Folder,
  Star,
  Download,
  Search
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 顶部功能模块
const topModules = ref([
  {    
    name: 'archive',
    title: '素材上传',
    path: '/archive',
    icon: UploadFilled
  },
  {
    name: 'annotation',
    title: '素材标注',
    path: '/annotation',
    icon: Tools
  },
  {
    name: 'ai-creation',
    title: 'AI创作',
    path: '/ai-creation',
    icon: MagicStick
  },
  {
    name: 'ai-search',
    title: 'AI搜索',
    path: '/search',
    icon: Search
  }
])

// 个人空间
const personalSpace = ref([
  { id: 'all', name: '所有文件', icon: Folder },
  { id: 'favorite', name: '我的收藏', icon: Star }
])

// 板块分类
const categories = ref([
  '高速公路建设', '高速公路营运', '设计咨询', '地产酒店', '建筑施工',
  '广告传媒', '服务区', '加油站', '金融资本', '物流运输', '资源板块',
  '深化改革', '党的建设', '群团工作', '企业文化', '科技创新', '其他'
])

// 筛选表单
const filterForm = reactive({
  type: '',
  dateRange: [],
  uploader: '',
  tags: ''
})

// 分页配置
const pagination = reactive({
  current: 1,
  size: 10,
  start: computed(() => (pagination.current - 1) * pagination.size + 1),
  end: computed(() => Math.min(pagination.current * pagination.size, totalFiles.value))
})

// 素材数据，从localStorage获取已标注的素材
const materials = ref([])

// 获取已标注的素材
const fetchCompletedMaterials = () => {
  try {
    // 从localStorage获取素材标注界面的数据
    const annotationMaterials = JSON.parse(localStorage.getItem('annotationMaterials') || '[]')
    
    // 只获取状态为completed(已标注)的素材
    materials.value = annotationMaterials
      .filter(material => material.status === 'completed')
      .map(material => {
        // 转换数据格式，使其符合首页要求
        return {
          id: material.id,
          name: material.name,
          type: material.type.includes('image') ? 'image' : 
                material.type.includes('video') ? 'video' : 
                material.type.includes('word') ? 'document' : 'other',
          thumbnail: material.url || '',
          uploadTime: material.uploadTime.split(' ')[0].replace(/-/g, '/'),
          uploader: material.uploader || 'admin',
          tags: material.tags || {
            scene: [],
            behavior: [],
            objects: [],
            text: [],
            events: [],
            color: [],
            angle: []
          },
          category: material.category || '未分类',
          fileSize: material.size * 1024, // 转换为字节
          resolution: material.resolution || '不适用',
          isFavorite: false // 默认为未收藏
        }
      })
    
    // 同时获取收藏状态
    try {
      const storedFavorites = JSON.parse(localStorage.getItem('globalMaterials') || '[]')
      materials.value.forEach(material => {
        const storedMaterial = storedFavorites.find(m => m.id === material.id)
        if (storedMaterial) {
          material.isFavorite = storedMaterial.isFavorite || false
        }
      })
    } catch (error) {
      console.error('加载收藏状态失败:', error)
    }
  } catch (error) {
    console.error('获取已标注素材失败:', error)
    // 出错时使用备用数据
    materials.value = [
      {
        id: 'backup-1',
        name: '芜湖二桥.jpg',
        type: 'image',
        thumbnail: '/images/芜湖二桥.jpg',
        uploadTime: '2025/09/04',
        uploader: 'admin',
        tags: {
          scene: ['桥梁', '江面'],
          behavior: [],
          objects: ['大桥', '船只'],
          text: [],
          events: [],
          color: ['冷色调', '蓝紫色'],
          angle: ['航拍']
        },
        category: '建筑施工',
        fileSize: 2456800,
        resolution: '3264x2448',
        isFavorite: false
      }
    ]
  }
}

// 组件挂载时获取素材数据
onMounted(() => {
  fetchCompletedMaterials()
})

// 当前选中的个人空间
const activeSpace = ref('all')

// 当前选中的板块分类
const activeCategory = ref('')

// 总文件数
const totalFiles = computed(() => materials.value.length)

// 收藏操作
const toggleFavorite = (event, material) => {
  event.stopPropagation() // 阻止事件冒泡，避免触发素材点击事件
  
  // 切换收藏状态
  const materialIndex = materials.value.findIndex(m => m.id === material.id)
  if (materialIndex !== -1) {
    materials.value[materialIndex].isFavorite = !materials.value[materialIndex].isFavorite
    
    // 保存到localStorage
    try {
      localStorage.setItem('globalMaterials', JSON.stringify(materials.value))
    } catch (error) {
      console.error('保存收藏状态失败:', error)
    }
  }
}

// 下载素材
const handleDownload = (event, material) => {
  event.stopPropagation() // 阻止事件冒泡，避免触发素材点击事件
  
  try {
    // 检查素材是否有thumbnail属性作为下载路径
    if (material.thumbnail) {
      // 创建下载链接
      const link = document.createElement('a')
      
      // 对于本地开发环境，直接使用素材路径
      if (material.thumbnail.startsWith('/')) {
        // 对于以/开头的路径，我们需要考虑实际部署的情况
        // 在模拟环境中，我们使用相对路径
        link.href = material.thumbnail
      } else {
        link.href = material.thumbnail
      }
      
      // 设置下载属性
      link.download = material.name
      
      // 添加到文档并触发点击
      document.body.appendChild(link)
      link.click()
      
      // 清理
      document.body.removeChild(link)
      
      // 显示下载成功提示
      ElMessage.success(`开始下载: ${material.name}`)
      console.log('下载素材:', material.name, '路径:', material.thumbnail)
    } else {
      // 如果没有可下载的路径
      ElMessage.error('该素材没有可下载的路径')
    }
  } catch (error) {
    console.error('下载素材失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 获取过滤后的素材列表
const getFilteredMaterials = () => {
  let filtered = [...materials.value]
  
  // 1. 应用个人空间和分类筛选
  if (activeSpace.value === 'favorite') {
    // 只显示收藏的素材
    filtered = filtered.filter(m => m.isFavorite)
  } else if (activeCategory.value) {
    // 应用分类筛选
    filtered = filtered.filter(m => m.category === activeCategory.value)
  }
  
  // 2. 应用搜索表单筛选条件
  if (filterForm.type) {
    filtered = filtered.filter(m => m.type === filterForm.type)
  }
  
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const startDate = new Date(filterForm.dateRange[0])
    const endDate = new Date(filterForm.dateRange[1])
    filtered = filtered.filter(m => {
      const materialDate = new Date(m.uploadTime.replace(/\//g, '-'))
      return materialDate >= startDate && materialDate <= endDate
    })
  }
  
  if (filterForm.uploader) {
    const uploaderLower = filterForm.uploader.toLowerCase()
    filtered = filtered.filter(m => 
      m.uploader.toLowerCase().includes(uploaderLower)
    )
  }
  
  if (filterForm.tags) {
    const tagsLower = filterForm.tags.toLowerCase()
    filtered = filtered.filter(m => {
      // 检查所有标签类别中的所有标签
      for (const tagType in m.tags) {
        if (m.tags[tagType].some(tag => tag.toLowerCase().includes(tagsLower))) {
          return true
        }
      }
      return false
    })
  }
  
  return filtered
}

// 筛选后的文件数
const filteredFiles = computed(() => {
  return getFilteredMaterials().length
})

// 按日期分组的素材
const groupedMaterials = computed(() => {
  const groups = {}  
  
  // 使用统一的过滤方法获取过滤后的素材列表
  const filteredMaterials = getFilteredMaterials()
  
  filteredMaterials.forEach(material => {
    if (!groups[material.uploadTime]) {
      groups[material.uploadTime] = []
    }
    groups[material.uploadTime].push(material)
  })
  
  // 按日期由近到远排序
  const sortedGroups = {}  
  const dates = Object.keys(groups)
  // 日期排序（由近到远）
  dates.sort((a, b) => {
    // 将日期字符串转换为Date对象进行比较
    const dateA = new Date(a.replace(/\//g, '-'))
    const dateB = new Date(b.replace(/\//g, '-'))
    // 降序排序（新日期在前）
    return dateB - dateA
  })
  
  // 根据排序后的日期重新构建groups对象
  dates.forEach(date => {
    sortedGroups[date] = groups[date]
  })
  
  return sortedGroups
})

// 点击个人空间
const handleSpaceClick = (spaceId) => {
  activeSpace.value = spaceId
  activeCategory.value = '' // 清空板块分类选中状态
}

// 点击板块分类
const handleCategoryClick = (category) => {
  activeCategory.value = category
  activeSpace.value = '' // 清空个人空间选中状态
}

// 查询处理
const handleQuery = () => {
  pagination.current = 1
  // 这里可以添加实际的查询逻辑
  console.log('执行查询:', filterForm)
}

// 重置表单
const handleReset = () => {
  Object.assign(filterForm, {
    type: '',
    dateRange: [],
    uploader: '',
    tags: ''
  })
}

// AI搜索
const handleAISearch = () => {
  console.log('执行AI搜索')
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.current = 1
}

// 当前页变化
const handleCurrentChange = (current) => {
  pagination.current = current
}

// 跳转到模块
const navigateToModule = (path) => {
  router.push(path)
}

// 点击素材项
const handleMaterialClick = (material) => {
  // 跳转到预览界面
  router.push({ name: 'MaterialPreview', params: { id: material.id } })
  
  // 将素材数据存储到localStorage，供预览页面使用
  try {
    const globalMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')
    // 检查是否已存在该素材
    const exists = globalMaterials.some(m => m.id === material.id)
    if (!exists) {
      globalMaterials.push(material)
      localStorage.setItem('globalMaterials', JSON.stringify(globalMaterials))
      console.log('素材数据已保存到localStorage:', material.name)
    }
  } catch (error) {
    console.error('保存素材数据失败:', error)
  }
}

//同步素材数据
const syncMaterials = () => {
  try {
    console.log('执行素材同步...')
    
    // 检查是否有待同步的素材
    const needSync = localStorage.getItem('materialsNeedSync') === 'true'
    console.log('是否需要同步:', needSync)
    
    // 双向同步: 从localStorage获取数据并更新到本地，同时将本地数据保存到localStorage
    // 1. 从localStorage获取数据更新到本地
    if (needSync || true) { // 暂时强制同步，便于调试
      // 从本地存储获取全局素材数据
      const globalMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')
      console.log('从localStorage获取的素材数量:', globalMaterials.length)
      
      if (globalMaterials && globalMaterials.length > 0) {
        // 更新现有素材的状态并添加新素材
        globalMaterials.forEach(material => {
          const existingIndex = materials.value.findIndex(m => m.id === material.id)
          if (existingIndex !== -1) {
            // 更新现有素材的所有属性
            materials.value[existingIndex] = { ...materials.value[existingIndex], ...material }
            console.log('更新素材数据:', material.name)
          } else {
            // 添加新素材
            materials.value.push(material)
            console.log('添加新素材:', material.name, '分类:', material.category)
          }
        })
        // 清除同步标记
        localStorage.removeItem('materialsNeedSync')
        console.log('从localStorage同步完成，当前素材总数:', materials.value.length)
      }
    }
    
    // 2. 将本地数据保存到localStorage
    // localStorage.setItem('globalMaterials', JSON.stringify(materials.value))
    // console.log('本地素材数据已同步到localStorage')
    
  } catch (error) {
    console.error('同步素材数据失败:', error)
  }
}

// 定时检查同步（每5秒）
let syncInterval = null

onMounted(() => {
  console.log('首页加载完成')
  
  
  
  // 从localStorage获取已标注的素材
  fetchCompletedMaterials()
  
  // 初始同步
  syncMaterials()
  
  // 设置定时同步（每2秒一次）
  syncInterval = setInterval(syncMaterials, 2000000)
})

// 路由更新时同步
onBeforeRouteUpdate(() => {
  syncMaterials()
})

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (syncInterval) {
    clearInterval(syncInterval)
  }
})
</script>

<style scoped lang="scss">
.home {
  padding: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

// 顶部导航
.top-nav {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  gap: 20px;
  
  .nav-btn {
    font-size: 16px;
    font-weight: 500;
    padding: 8px 16px;
    
    .nav-icon {
      margin-right: 8px;
      font-size: 18px;
    }
    
    &:hover {
      color: #409eff;
      background: #ecf5ff;
      border-radius: 4px;
    }
  }
}

// 主内容区
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// 左侧边栏
.sidebar {
  width: 280px;
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  overflow-y: auto;
  
  .sidebar-section {
    margin-bottom: 24px;
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #606266;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
    }
  }
  
  .space-list {
    .space-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin-bottom: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      
      .el-icon {
        margin-right: 8px;
        font-size: 16px;
        color: #909399;
      }
      
      span {
        font-size: 14px;
        color: #606266;
      }
      
      &:hover {
        background: #ecf5ff;
        color: #409eff;
        
        .el-icon,
        span {
          color: #409eff;
        }
      }
      
      &.active {
        background: #409eff;
        color: #fff;
        
        .el-icon,
        span {
          color: #fff;
        }
      }
    }
  }
  
  .category-list {
    max-height: 500px;
    overflow-y: auto;
    
    .category-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin-bottom: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      color: #606266;
      background: transparent;
      
      &:hover {
        background: #ecf5ff;
        color: #409eff;
      }
      
      // 确保分类项垂直排列，不换行
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      // 选中状态样式
      &.active {
        background: #409eff;
        color: #fff;
      }
    }
  }
}

// 右侧内容区
.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #fff;
  
  .filter-bar {
    margin-bottom: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    
    .el-form-item {
      margin-bottom: 16px;
      margin-right: 20px;
      
      &:last-child {
        margin-right: 0;
      }
    }
  }
  
  .file-info {
    margin-bottom: 20px;
    font-size: 14px;
    color: #606266;
  }
  
  .material-list {
    .date-group {
      margin-bottom: 32px;
      
      .group-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #e4e7ed;
      }
    }
    
    .material-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .material-item {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s;
      cursor: pointer;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #409eff;
      }
      
      .material-thumb {
        height: 180px;
        background: #f5f7fa;
        display: flex;
        align-items: center;
        justify-content: center;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .file-icon {
          font-size: 32px;
          color: #909399;
        }
      }
      
      .material-name {
        padding: 12px;
        font-size: 13px;
        color: #606266;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
  
  .pagination {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .pagination-info {
    font-size: 14px;
    color: #606266;
  }
}

/* 素材标签样式 */
.material-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 12px;
}

/* 素材操作区样式 */
.material-actions {
  padding: 0 12px 12px;
  display: flex;
  gap: 10px;
}

.favorite-btn,
.download-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
}
</style>

