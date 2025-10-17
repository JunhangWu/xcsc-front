<template>
  <div class="main-content">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 个人空间模块 -->
      <div class="sidebar-section">
        <h3 class="section-title">个人空间</h3>
        <div class="space-list">
          <div v-for="item in personalSpace" :key="item.id" :class="['space-item', { active: activeSpace === item.id }]"
            @click="handleSpaceClick(item.id)">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- 板块分类模块 -->
      <div class="sidebar-section">
        <h3 class="section-title">板块分类</h3>
        <div class="category-list">
          <div v-for="category in categories.filePath" :key="category"
            :class="['category-item', { active: activeCategory === category }]" @click="handleCategoryClick(category)">
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
            <el-select v-model="filterForm.type" placeholder="请选择" clearable style="width: 150px;">
              <el-option label="图片" value="image" />
              <el-option label="视频" value="video" />
              <el-option label="文档" value="document" />
              <el-option label="PPT" value="ppt" />
            </el-select>
          </el-form-item>

          <el-form-item label="日期范围：">
            <el-date-picker v-model="filterForm.dateRange" type="daterange" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
          </el-form-item>

          <el-form-item label="上传人：">
            <el-input v-model="filterForm.uploader" placeholder="请输入上传人" clearable style="width: 150px;" />
          </el-form-item>

          <el-form-item label="素材标签：">
            <el-input v-model="filterForm.tags" placeholder="请输入素材标签" clearable style="width: 150px;" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 文件信息区 -->
      <!-- <div class="file-info">
          <span>共 {{ filteredFiles }} 个文件</span>
        </div> -->
      <div class="pageTop">
        <div class="breadcrumbBox">
          <!-- 返回到上一级 - 当不在'所有文件'或'我的收藏'界面时显示 -->
          <el-icon
            v-if="breadcrumbData.length > 1 || (breadcrumbData.length === 1 && breadcrumbData[0].bizId !== 'all' && breadcrumbData[0].bizId !== 'favorite')"
            @click="backFolder" class="backBtn">
            <Back />
          </el-icon>
          <div class="breadcrumb">
            <!-- 文件夹面包屑 -->
            <div class="breadcrumbItem" v-for="(item, index) in breadcrumbData" :key="index">
              <div class="breadcrumbName" @click="clickBreadcrumb(item, index)"> {{ item.filePath }}</div>
              <div class="breadcrumbArrow" v-if="index < breadcrumbData.length - 1">
                <el-icon>
                  <ArrowRight />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 素材列表区 -->
      <div class="material-list">
        <div v-if="loading" class="loading-container">
          <el-loading-text>正在加载素材...</el-loading-text>
        </div>
        <div v-else-if="folderData.length == 0 && fileListData.length == 0" class="empty-state">
          <el-empty description="暂无内容" />
        </div>
        <div v-else class="material-grid">
          <!-- 文件夹列表 -->
          <div class="subFolder" v-for="(item, index) in folderData" :key="index"
            @mouseenter="onSubFolderMouseEnter(item)" @mouseleave="onSubFolderMouseLeave(item)">
            <!-- <span class="subFolder-actions">
                <el-icon class="action-icon" @click.stop="editFolder(item)" v-show="item._hover"
                  style="color: #409eff;">
                  <Edit />
                </el-icon>
                <el-icon class="action-icon" @click.stop="deleteFolder(item)" v-show="item._hover"
                  style="color: #f56c6c;">
                  <Delete />
                </el-icon>
              </span> -->
            <el-icon @click="selectFolder(item)">
              <FolderOpened />
            </el-icon>
            <div class="subFolderName">{{ item.filePath }}</div>
          </div>
          <!-- 文件列表 -->
          <div v-for="material in fileListData" :key="material.id" class="material-item">
            <!-- <div class="material-info"> -->
            <!-- <div class="material-status">
                  <el-tag :type="getStatusTagType(material.annotationStatus)" size="small">
                    {{ getStatusText(material.annotationStatus) }}
                  </el-tag>
                </div> -->
            <!-- <div class="material-actions">
                  <el-button type="primary" size="small" @click.stop="showMaterialDetail(material)" icon="Edit">
                    标注
                  </el-button>
                </div>
                <div class="material-actions">
                  <el-button type="danger" size="small" @click.stop="deleteFile(material)" icon="Delete">
                  </el-button>
                </div> -->
            <!-- </div> -->

            <div class="material-thumb">
              <img v-if="isImage(material.minioPath)" :src="material.minioPath" :alt="getFileName(material.minioPath)"
                @click="handleMaterialClick(material)" />
              <!-- <el-icon v-else-if="isVideo(material.minioPath)" :src="material.minioPath" :alt="getFileName(material.minioPath)" class="file-icon" @click="handleMaterialClick(material)" style="cursor:pointer;">
                  <VideoPlay />
                </el-icon> -->
              <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="handleMaterialClick(material)">
                <el-icon class="file-icon">
                  <VideoPlay />
                </el-icon>
                <video :src="material.minioPath" playsinline muted preload="metadata"
                  style="max-width: 90%; max-height: 90%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video>
              </div>
              <el-icon v-else :src="material.minioPath" :alt="getFileName(material.minioPath)" class="file-icon"
                @click="handleMaterialClick(material)" style="cursor:pointer;">
                <Document />
              </el-icon>
              <div class="fileName">{{ getFileName(material.minioPath) }}</div>
              <el-button type="primary" size="small" @click.stop="handleDownload(material)" class="download-btn"
                :icon="Download">
                下载
              </el-button>
            </div>
          </div>
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
import { getFolderList, addFolder, updateFolder, delFolder, uploadFiles, getFileList, delFile } from "@/api/xcsc/uploadFile"

const router = useRouter()


// 文件夹悬浮控制
function onSubFolderMouseEnter(item) {
  item._hover = true
}
function onSubFolderMouseLeave(item) {
  item._hover = false
}
// 个人空间
const personalSpace = ref([
  { id: 'all', name: '所有文件', icon: Folder },
  // { id: 'favorite', name: '我的收藏', icon: Star }
])

// 当前选中的板块分类
const activeCategory = ref('')
// const categories = ref([
//   '高速公路建设', '高速公路营运', '设计咨询', '地产酒店', '建筑施工',
//   '广告传媒', '服务区', '加油站', '金融资本', '物流运输', '资源板块',
//   '深化改革', '党的建设', '群团工作', '企业文化', '科技创新', '其他'
// ])
// 板块分类
// const categories = ref([])
const categories = reactive({
  bizId: '',
  filePath: '',
})
// 存储分类名称到bizId的映射
const categoryMap = ref({})

// 获取左侧板块列表
function getCategories(pid) {
  let params = {
    pid: pid,
  }
  getFolderList(params).then(response => {
    categories.filePath = response.data.map(item => item.filePath)
    categories.bizId = response.data.map(item => item.bizId)
    // 构建分类名称到bizId的映射
    response.data.forEach(item => {
      categoryMap.value[item.filePath] = item.bizId
    })
  })
}
getCategories(0)

// 素材列表
const loading = ref(false)
const showFolder = ref(true)
const curFolderObj = reactive({
  filePath: '',
  bizId: '',
  id: '',
})
const breadcrumbData = ref([])
// 获取文件夹及文件列表数据
const folderData = ref([]) //文件夹列表
const fileListData = ref([])//文件列表
function getFolderData(pid) {
  // debugger
  let params = {
    pid: pid,
  }
  console.log('===pid===', pid);
  console.log('===params===', params);
  getFolderList(params).then(res => {
    folderData.value = res.data
  })
  console.log('===folderData.value===', folderData.value)
  if (pid !== 0) {
    let param = {
      folderId: pid,
    }
    console.log('===params===', params);
    getFileList(param).then(res => {
      fileListData.value = res.data
    })
  }
}

// 根据分类名称获取对应的bizId
function getCategoryPid(category) {
  return categoryMap.value[category] || 0
}

//点击子文件展示相关文件夹及文件
function selectFolder(item, type) {
  console.log('====item==', item);
  Object.assign(curFolderObj, item)
  if (type == 'isRootFolder') {
    //根文件夹
    showFolder.value = false
    breadcrumbData.value = [{
      filePath: item.filePath,
      bizId: item.bizId,
    }]
  } else {
    breadcrumbData.value.push({
      filePath: item.filePath,
      bizId: item.bizId,
    })
  }
  getFolderData(item.bizId)
  console.log('=== breadcrumbData.value===', breadcrumbData.value);

}
//点击面包屑
function clickBreadcrumb(item, index) {
  getFolderData(item.bizId)
  console.log('===item===', item);
  Object.assign(curFolderObj, item)
  if (index == 0) {
    breadcrumbData.value = [{
      filePath: item.filePath,
      bizId: item.bizId,
    }]
  }
  // 判断item的filePath在breadcrumbData的哪一个对象中，删除breadcrumbData的后面部分
  const idx = breadcrumbData.value.findIndex(b => b.filePath === item.filePath)
  if (idx !== -1) {
    breadcrumbData.value = breadcrumbData.value.slice(0, idx + 1)
  }
}
//返回按钮
const backFolder = () => {

  if (breadcrumbData.value.length == 1) {
    // showFolder.value = true
    // getFolderData(0)
    return
  } else {
    Object.assign(curFolderObj, {
      filePath: breadcrumbData.value[breadcrumbData.value.length - 2].filePath,
      bizId: breadcrumbData.value[breadcrumbData.value.length - 2].bizId,
      id: breadcrumbData.value[breadcrumbData.value.length - 2].id
    });
    // curFolderObj.filePath = breadcrumbData.value[breadcrumbData.value.length - 2].filePath
    // curFolderObj.bizId = breadcrumbData.value[breadcrumbData.value.length - 2].bizId
    // curFolderObj.id = breadcrumbData.value[breadcrumbData.value.length - 2].id
    getFolderData(breadcrumbData.value[breadcrumbData.value.length - 2].bizId) //获取上一级文件夹的bizId
    breadcrumbData.value.pop()
  }
  console.log('===breadcrumbData.value===', breadcrumbData.value);
}

// 获取文件列表数据
const queryfileListData = ref([])//文件列表
function getQueryData() {
  loading.value = true
  let params = {
    fileName: searchKeyword.value,
    annotationStatus: statusFilter.value,
  }
  getFileList(params).then(res => {
    queryfileListData.value = res.data
    showSearchResults.value = true // 显示搜索结果
    showFolder.value = false // 隐藏文件夹模式
  }).finally(() => {
    loading.value = false
  })
}

// 筛选表单
const filterForm = reactive({
  type: '',
  dateRange: [],
  uploader: '',
  tags: ''
})


// 素材数据
const materials = ref([])
//预览图片
function previewImg(material) {
  const $viewer = viewerApi({
    options: {
      toolbar: true,
      initialViewIndex: 0,
    },
    images: [material.minioPath],
  });
}

//下载文件
function downloadFile(material) {
  if (material && material.minioPath) {
    window.open(material.minioPath, '_blank');
  }
}
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
// 处理下载
const handleDownload = async (material) => {
  if (!material.minioPath) {
    ElMessage.warning('文件路径不存在，无法下载')
    return
  }
  console.log('下载文件:', material.fileName)
  try {
    // 使用fetch API获取文件内容
    const response = await fetch(material.minioPath, {
      method: 'GET',
      credentials: 'include' // 包含cookies等认证信息
    })
    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status}`)
    }
    // 获取文件内容并创建Blob对象
    const blob = await response.blob()
    // 创建下载链接
    const link = document.createElement('a')
    // 创建指向Blob的URL
    const url = window.URL.createObjectURL(blob)
    // 设置下载属性
    link.href = url
    link.download = material.fileName || getFileNameFromUrl(material.minioPath) || 'download_file'
    // 隐藏链接
    link.style.display = 'none'
    // 添加到文档并触发点击
    document.body.appendChild(link)
    link.click()
    // 延迟清理
    setTimeout(() => {
      // 移除链接
      document.body.removeChild(link)
      // 释放Blob URL
      window.URL.revokeObjectURL(url)
    }, 100)
    ElMessage.success('文件下载已开始')
  } catch (error) {
    console.error('文件下载失败:', error)
    ElMessage.error('文件下载失败，请稍后重试')
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
  //禁用文件夹
  showFolder.value = false
  getFileList().then(res => {
    fileListData.value = res.data
  })
}

// 点击板块分类
const handleCategoryClick = (category) => {
  activeCategory.value = category // 设置当前选中的分类
  activeSpace.value = '' // 清空个人空间选中状态
  console.log('===activeCategory===', category)
  const pid = getCategoryPid(category)
  if (pid) {
    getFolderData(pid)
    // 更新面包屑数据
    breadcrumbData.value = [{
      filePath: category,
      bizId: pid,
    }]
    // 更新当前文件夹对象
    Object.assign(curFolderObj, {
      filePath: category,
      bizId: pid,
    })
    // 隐藏根文件夹视图
    showFolder.value = false
  }
}
// 查询处理
const handleQuery = () => {
  // 这里可以添加实际的查询逻辑
  let params = {
    spaceId: activeSpace.value,
    category: activeCategory.value,
    ...filterForm
  }
  console.log('执行查询:', params)
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

// 点击素材项
const handleMaterialClick = (material) => {
  // 跳转到预览界面
  router.push({ name: 'MaterialPreview', params: { id: material.id } })
}
// 支持的文件格式
const supportedFormats = {
  image: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'flv'],
  document: ['docx', 'pdf', 'pptx']
}
function isImage(path) {
  return ['jpg', 'jpeg', 'png', 'bmp', 'gif'].some(ext => path.toLowerCase().includes(ext));
}
function isVideo(path) {
  return ['mp4', 'mov', 'avi', 'mkv', 'flv'].some(ext => path.toLowerCase().includes(ext));
}
//获取文件名
function getFileName(path) {
  if (!path) return '';
  const idx = path.lastIndexOf('/');
  return idx !== -1 ? path.substring(idx + 1) : path;
}
// 检查文件格式是否支持
const isSupportedFormat = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  return Object.values(supportedFormats).flat().includes(ext)
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

  handleSpaceClick('all')
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
// 主内容区
.main-content {
  display: flex;
  overflow: hidden;
  max-height: calc(100vh - 84px);
  height: calc(100vh - 84px);
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

// 左侧边栏
.sidebar {
  width: 280px;
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  height: 100%;

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
    height: calc(100vh - 270px);
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
  overflow-y: hidden;
  background: #fff;
  height: 100%;

  .filter-bar {
    // margin-bottom: 20px;
    padding: 10px;
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
    max-height: calc(100% - 130px);
    height: calc(100% - 130px);
    overflow-y: auto;
  }

  /* 素材标签样式 */
  .material-tags {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 12px 12px;
  }

  .favorite-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .download-btn {
    width: 80px !important;
    height: 28px !important;
    padding: 0 !important;
    font-size: 12px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
}

.subFolder {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 260px;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  background: #fafafa;

  :deep(.el-icon) {
    font-size: 80px;
    font-weight: 500;
    color: #ffd45e;
    margin-bottom: 8px;
    cursor: pointer;
  }

  &:hover {
    background-color: #ecf5ff;
    border-color: #c6e2ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .subFolder-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .subFolder-actions {
    opacity: 1;
  }

  .action-icon {
    font-size: 18px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    padding: 2px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: scale(1.1);
    }
  }

  .subFolderName {
    text-align: center;
    font-size: 14px;
    color: #303133;
    padding: 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
}

.material-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.material-item {
  margin: 0;
  position: relative;
  width: 260px;
  height: 220px;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: block;
  background: #ffffff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #409eff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .material-thumb {
    width: 100%;
    height: calc(100% - 16px);
    margin-top: 6px;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex: 1;

    img {
      width: 90%;
      height: 70%;
      object-fit: contain;
      transition: transform 0.3s;
      cursor: pointer;
      margin-bottom: 8px;
    }

    .videoBox {
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 0;

      .file-icon {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        font-size: 36px;
        color: #ffffff;
        pointer-events: none;
      }
    }

    .file-icon {
      font-size: 36px;
      color: #909399;
      margin-bottom: 8px;
    }

    .fileName {
      text-align: center;
      font-size: 12px;
      color: #606266;
      padding: 0 8px;
      margin-bottom: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      // display: -webkit-box;
      // -webkit-line-clamp: 2;
      // -webkit-box-orient: vertical;
      // line-height: 1.3;
      // height: 30px;
      max-width: 100%;
    }

    .download-btn {
      width: 80px !important;
      height: 28px !important;
      padding: 0 !important;
      font-size: 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 auto;
    }
  }
}

.material-info {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 36px;
  z-index: 2;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid #ebeef5;
  border-radius: 8px 8px 0 0;

  .material-status {
    display: flex;
    align-items: center;
  }

  .material-actions {
    display: flex;
    align-items: center;
  }

  .material-del {
    display: flex;
    align-items: center;
  }

  :deep(.el-button) {
    padding: 4px 10px;
    font-size: 12px;
    height: 24px;
  }
}

//面包屑
.pageTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e4e7ed;
  // margin-top: 16px;

  .breadcrumbBox {
    display: flex;
    align-items: center;

    .backBtn {
      font-size: 36px;
      cursor: pointer;
      color: #606266;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        color: #409eff;
        background-color: #ecf5ff;
      }
    }

    .breadcrumb {
      display: flex;
      margin-left: 16px;
      align-items: center;

      .breadcrumbItem {
        display: flex;
        align-items: center;

        .breadcrumbName {
          line-height: 28px;
          padding: 0 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          color: #606266;
          transition: all 0.2s ease;

          &:hover {
            color: #409eff;
            background-color: #ecf5ff;
          }
        }

        .breadcrumbArrow {
          margin: 0 4px;
          color: #c0c4cc;
        }
      }
    }
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

.favorite-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
