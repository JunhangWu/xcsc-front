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
            <el-select v-model="filterForm.fileType" placeholder="请选择" clearable style="width: 150px;">
              <el-option label="图片" value="image" />
              <el-option label="视频" value="video" />
              <el-option label="文档" value="document" />
            </el-select>
          </el-form-item>

          <el-form-item label="日期范围：">
            <el-date-picker v-model="filterForm.dateRange" type="daterange" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
          </el-form-item>

          <el-form-item label="上传人：">
            <el-input v-model="filterForm.createBy" placeholder="请输入上传人" clearable style="width: 150px;" />
          </el-form-item>

          <el-form-item label="素材标签：">
            <el-input v-model="filterForm.annotationContent" placeholder="请输入素材标签" clearable style="width: 150px;" />
          </el-form-item>

          <el-form-item label="文件名：">
            <el-input v-model="filterForm.fileName" placeholder="请输入文件名" clearable style="width: 150px;" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <!-- 搜索结果展示区域 -->
      <div class="card" v-if="showSearchResults">
        <div class="pageTop">
          <div class="breadcrumbBox">
            <el-button type="primary" plain @click="resetSearch" size="default" style="margin-right: 20px;">
              <el-icon style="margin-right: 6px;">
                <Back />
              </el-icon>返回文件夹视图
            </el-button>
            <div class="search-result-info">
              搜索结果：共 {{ queryfileListData.length }} 个文件
            </div>
          </div>
        </div>

        <div class="card-body">
          <!-- 搜索结果 - 网格视图 -->
          <div class="material-list">
            <div v-if="loading" class="loading-container">
              <el-loading-text>正在加载搜索结果...</el-loading-text>
            </div>
            <div v-else-if="queryfileListData.length == 0" class="empty-state">
              <el-empty description="未找到匹配的文件" />
            </div>
            <div v-else class="material-grid">
              <!-- 搜索结果文件列表 -->
              <div v-for="material in queryfileListData" :key="material.id" class="material-item">
                <div class="material-thumb">
                  <img v-if="isImage(material.minioPath)" :src="material.minioPath" :alt="getFileName(material.minioPath)"
                    @click="handleMaterialClick(material)" />
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
                </div>
                <div class="fileName" :title="getFileName(material.minioPath)">{{ getFileName(material.minioPath) }}</div>
                <div class="material-tags" v-if="material.annotationContent !== null">
                  <el-tag v-for="tag in JSON.parse(material.annotationContent).sceneCategory" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                  <el-tag v-for="tag in JSON.parse(material.annotationContent).activityEvent" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                </div>
                <div class="material-actions">
                  <el-button size="small" @click.stop="toggleFavorite($event, material)" 
                    :class="['favorite-btn', { favorited: material.isFavorite }]"
                    :icon="material.isFavorite ? StarFilled : Star">
                    {{ material.isFavorite ? '已收藏' : '收藏' }}
                  </el-button>
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
      <!-- 文件信息区 -->
      <div class="card" v-else-if="!showSearchResults">
        <div class="pageTop" v-if="activeSpace !== 'all'">
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
          <!-- <div v-else-if="folderData.length == 0 && fileListData.length == 0 && Object.keys(allFileListData).length == 0"
            class="empty-state">
            <el-empty description="暂无内容" />
          </div> -->
          <div v-else-if="activeSpace == 'all' && Object.keys(allFileListData).length == 0"
            class="empty-state">
            <el-empty description="暂无内容" />
          </div>
          <div v-else-if="activeSpace == '' && folderData.length == 0 && fileListData == 0"
            class="empty-state">
            <el-empty description="暂无内容" />
          </div>
          <div v-else class="material-grid">
            <!-- 文件夹列表 -->
            <div class="subFolder" v-for="(item, index) in folderData" :key="index"
              @mouseenter="onSubFolderMouseEnter(item)" @mouseleave="onSubFolderMouseLeave(item)">
              <el-icon @click="selectFolder(item)">
                <FolderOpened />
              </el-icon>
              <div class="subFolderName">{{ item.filePath }}</div>
            </div>
            <!-- 文件列表 -所有文件 -->
            <div class="allFileList" v-if="activeSpace == 'all'">
              <div class="everydayBox" v-for="(everydayData, index) in Object.keys(allFileListData)" :key="index">
                <div class="date" style=" font-size: 16px;font-weight: 600;color: #303133;padding: 10px 0;border-bottom: 1px solid #ebeef5;width: 100%; margin-bottom: 16px;
                ">{{ everydayData }}</div>
                <div v-for="material in allFileListData[everydayData]" :key="material.id" class="material-item">
                  <div class="material-thumb">
                    <img v-if="isImage(material.minioPath)" :src="material.minioPath"
                      :alt="getFileName(material.minioPath)" @click="handleMaterialClick(material)" />
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
                  </div>
                  <div class="fileName" :title="getFileName(material.minioPath)">{{ getFileName(material.minioPath) }}</div>
                  <div class="material-tags" v-if="material.annotationContent !== null">
                    <el-tag v-for="tag in JSON.parse(material.annotationContent).sceneCategory" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                    <el-tag v-for="tag in JSON.parse(material.annotationContent).activityEvent" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                  </div>
                  <div class="material-actions">
                    <el-button size="small" @click.stop="toggleFavorite($event, material)" 
                      :class="['favorite-btn', { favorited: material.isFavorite }]"
                      :icon="material.isFavorite ? StarFilled : Star">
                      {{ material.isFavorite ? '已收藏' : '收藏' }}
                    </el-button>
                    <el-button type="primary" size="small" @click.stop="handleDownload(material)" class="download-btn"
                      :icon="Download">
                      下载
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <!-- 文件列表 -->
            <div v-for="material in fileListData" :key="material.id" class="material-item" v-else>
              <div class="material-thumb">
                <img v-if="isImage(material.minioPath)" :src="material.minioPath" :alt="getFileName(material.minioPath)"
                  @click="handleMaterialClick(material)" />
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
              </div>
              <div class="fileName" :title="getFileName(material.minioPath)">{{ getFileName(material.minioPath) }}</div>
              <div class="material-tags" v-if="material.annotationContent !== null">
                <el-tag v-for="tag in JSON.parse(material.annotationContent).sceneCategory" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                <el-tag v-for="tag in JSON.parse(material.annotationContent).activityEvent" :key="tag" type="success" size="small">{{ tag }}</el-tag>
              </div>
              <div class="material-actions">
                <el-button size="small" @click.stop="toggleFavorite($event, material)" 
                  :class="['favorite-btn', { favorited: material.isFavorite }]"
                  :icon="material.isFavorite ? StarFilled : Star">
                  {{ material.isFavorite ? '已收藏' : '收藏' }}
                </el-button>
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
  StarFilled,
  Download,
  Search,
  FolderOpened
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFolderList, getFileList, getFileIndexList, getCollectionList, addCollection, delCollection } from "@/api/xcsc/uploadFile"
import useUserStore from '@/store/modules/user'

const router = useRouter()
const showSearchResults = ref(false) // 控制是否显示搜索结果
const userStore = useUserStore()
// const isFavorite = ref(false) // 收藏状态
// 文件夹悬浮控制
function onSubFolderMouseEnter(item) {
    item._hover = true
}
function onSubFolderMouseLeave(item) {
    item._hover = false
}


// 当前选中的板块分类
const activeCategory = ref('')
// 板块分类
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
    let params = {
        pid: pid,
    }
    console.log('===pid===', pid);
    console.log('===params===', params);
    getFolderList(params).then(res => {
        folderData.value = res.data
        console.log('===folderData.value===', folderData.value)
    }) 
    if (pid !== 0) {
        let param = {
            folderId: pid,
            fileTypeList: fileTypeObj[filterForm.fileType] || null,
            createStartTime: filterForm.dateRange[0] ? filterForm.dateRange[0] + ' 00:00:00' : null,
            createEndTime: filterForm.dateRange[0] ? filterForm.dateRange[1] + ' 23:59:59' : null,
            createBy: filterForm.createBy,
            annotationContent: filterForm.annotationContent,
            fileName: filterForm.fileName
        }
        getFileList(param).then(res => {
            fileListData.value = res.data
            // 获取当前用户收藏列表并设置文件收藏状态
            getCollectionData(userStore.id).then(() => {
                // 提取收藏列表中的文件id
                const favoriteFileIds = collectionList.value.map(item => item.fileId);
                // 遍历文件列表，设置收藏状态
                fileListData.value.forEach(file => {
                    file.isFavorite = favoriteFileIds.includes(file.id);
                });
            });
            console.log('===fileListData.value===', fileListData.value)
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
    console.log('===item===', item);
    Object.assign(curFolderObj, item)
    
    // 特殊处理"我的收藏"的面包屑点击
    if (item.bizId === 'favorite') {
        activeSpace.value = 'favorite'
        activeCategory.value = ''
        folderData.value = [] // 不展示文件夹
        showSearchResults.value = false // 确保显示文件夹视图
        getFavoriteFiles() // 获取收藏文件并应用筛选条件
    } else {
        // 正常文件夹处理
        getFolderData(item.bizId)
    }
    
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
        // getFolderData(0)
        return
    } else {
        Object.assign(curFolderObj, {
            filePath: breadcrumbData.value[breadcrumbData.value.length - 2].filePath,
            bizId: breadcrumbData.value[breadcrumbData.value.length - 2].bizId,
            id: breadcrumbData.value[breadcrumbData.value.length - 2].id
        });
        getFolderData(breadcrumbData.value[breadcrumbData.value.length - 2].bizId) //获取上一级文件夹的bizId
        breadcrumbData.value.pop()
    }
    console.log('===breadcrumbData.value===', breadcrumbData.value);
}


// 筛选表单
const filterForm = reactive({
  fileType: '',
  dateRange: [],
  createBy: '',
  annotationContent: '',
  fileName: ''
})


// 素材数据
const materials = ref([])

// 预览图片
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

// 当前选中的个人空间
const activeSpace = ref('all')

// 总文件数
const totalFiles = computed(() => materials.value.length)

//收藏列表
const collectionList = ref([])
//获取当前用户收藏列表
function getCollectionData(userId){
  // collectionList.value = [];
  let params = {
        userId: userId
    }
    return getCollectionList(params).then(res => {
      collectionList.value = res.data
      console.log('===params===', params)
      console.log('collectionList.value', collectionList.value)
      return res.data;
    })
}
// 在组件挂载时获取收藏列表，确保页面初始加载时所有文件的收藏状态正确
onMounted(() => {
  if (userStore.id) {
    getCollectionData(userStore.id)
  }
})

// 获取当前登录用户的id
function getCurrentUserId() {
  return userStore.id
}

// 更新文件列表中的收藏状态
function updateFileFavoriteStatus() {
  // 提取收藏列表中的文件id
  const favoriteFileIds = collectionList.value.map(item => item.fileId);
  
  // 更新fileListData中的收藏状态
  if (fileListData.value && fileListData.value.length > 0) {
    fileListData.value.forEach(file => {
      file.isFavorite = favoriteFileIds.includes(file.id);
    });
  }
  
  // 同时更新查询结果列表中的收藏状态
  if (queryfileListData.value && queryfileListData.value.length > 0) {
    queryfileListData.value.forEach(file => {
      file.isFavorite = favoriteFileIds.includes(file.id);
    });
  }
  
  // 更新所有文件列表中的收藏状态
  for (const dateKey in allFileListData) {
    const dailyFiles = allFileListData[dateKey];
    dailyFiles.forEach(file => {
      file.isFavorite = favoriteFileIds.includes(file.id);
    });
  }
}

// 收藏操作
const toggleFavorite = (event, material) => {
    event.stopPropagation() // 阻止事件冒泡，避免触发素材点击事件

    // 切换收藏状态
    material.isFavorite = !material.isFavorite
    if(material.isFavorite){
      // 收藏
      let params = {
        userId: userStore.id,
        fileId: material.id
      }
      addCollection(params).then(res => {
        // 收藏成功后，更新收藏列表
        getCollectionData(userStore.id).then(() => {
          // 更新当前文件列表中的收藏状态
          updateFileFavoriteStatus();
        })
        
        console.log('===res===', res)
      })
    }
    else{
      // 取消收藏
      let params = {
        userId: userStore.id,
        fileId: material.id
      }
      console.log('===params===', params)
      delCollection(params).then(res => {
        // 取消收藏成功后，更新收藏列表
        getCollectionData(userStore.id).then(() => {
          // 更新当前文件列表中的收藏状态
          updateFileFavoriteStatus();
        })
        
        console.log('===res===', res)
      })
    }
    console.log('===material.isFavorite===', material.isFavorite)
    console.log('===material===', material)
    // // 查找并更新queryfileListData中的素材
    // const queryIndex = queryfileListData.value.findIndex(m => m.id === material.id)
    // if (queryIndex !== -1) {
    //     queryfileListData.value[queryIndex].isFavorite = material.isFavorite
    // }
    

    // // 查找并更新fileListData中的素材
    // const fileIndex = fileListData.value.findIndex(m => m.id === material.id)
    // console.log('===fileIndex===', fileIndex)
    // if (fileIndex !== -1) {
    //     fileListData.value[fileIndex].isFavorite = material.isFavorite
    //     console.log('===fileListData.value[fileIndex]===', fileListData.value[fileIndex])
    // }
    // console.log('fileListData.value', fileListData.value)
    // const target = fileListData.value.find(m => m.id === material.id);
    // if (target) {
    //   // 动态添加 isFavorite 属性并赋值
    //   target.isFavorite = material.isFavorite; 
    // }
    // console.log('===target===', target)
    // // 查找并更新allFileListData中的素材（按日期分组）
    // for (const dateKey in allFileListData) {
    //     const dailyFiles = allFileListData[dateKey]
    //     const dailyIndex = dailyFiles.findIndex(m => m.id === material.id)
    //     if (dailyIndex !== -1) {
    //         dailyFiles[dailyIndex].isFavorite = material.isFavorite
    //         break
    //     }
    // }

    // 显示操作反馈
    ElMessage.success(material.isFavorite ? '收藏成功' : '取消收藏')
    
    // 如果当前在"我的收藏"页面，取消收藏后需要更新显示的文件列表
    if (activeSpace.value === 'favorite' && !material.isFavorite) {
        // 从显示的文件列表中移除该文件
        const index = fileListData.value.findIndex(file => file.id === material.id)
        if (index !== -1) {
            fileListData.value.splice(index, 1)
        }
    }

    // 保存到localStorage用于持久化
    // try {
    //     let favorites = JSON.parse(localStorage.getItem('favoriteMaterials') || '[]')
    //     if (material.isFavorite) {
    //         // 添加收藏（避免重复）
    //         if (!favorites.find(f => f.id === material.id)) {
    //             favorites.push({ id: material.id, fileName: material.fileName })
    //         }
    //     } else {
    //         // 移除收藏
    //         favorites = favorites.filter(f => f.id !== material.id)
    //     }
    //     localStorage.setItem('favoriteMaterials', JSON.stringify(favorites))
    // } catch (error) {
    //     console.error('保存收藏状态失败:', error)
    // }
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

// 个人空间
const personalSpace = ref([
  { id: 'all', name: '所有文件', icon: Folder },
  { id: 'favorite', name: '我的收藏', icon: Star }
])

// 获取收藏文件的详细信息 - 重写版本
const getFavoriteFiles = () => {
    loading.value = true
    // 清空当前文件列表
    fileListData.value = []
    
    // 确保已加载收藏列表
    getCollectionData(userStore.id).then(() => {
        if (collectionList.value.length > 0) {
            // 构建查询参数，模仿getALlFileListData的结构
            let params = {
                fileTypeList: fileTypeObj[filterForm.fileType] || null,
                createStartTime: filterForm.dateRange[0] ? filterForm.dateRange[0] + ' 00:00:00' : null,
                createEndTime: filterForm.dateRange[0] ? filterForm.dateRange[1] + ' 23:59:59' : null,
                createBy: filterForm.createBy,
                keyWords: filterForm.annotationContent,
                fileName: filterForm.fileName
            }
            
            // 如果filterForm.dateRange是空的，默认获取近30天的开始时间和结束时间
            if (!filterForm.dateRange || filterForm.dateRange.length === 0) {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 30);
                const formatDate = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };
                filterForm.dateRange = [formatDate(startDate), formatDate(endDate)];
                params.createStartTime = filterForm.dateRange[0] + ' 00:00:00';
                params.createEndTime = filterForm.dateRange[1] + ' 23:59:59';
            }
            
            console.log('执行收藏文件查询:', params)
            
            // 调用getFileIndexList获取所有文件，然后根据收藏状态过滤
            getFileIndexList(params).then(res => {
                const allFilesData = res.data;
                const favoriteFileIds = new Set(collectionList.value.map(item => item.fileId));
                
                // 按日期组织收藏文件
                const favoriteFilesByDate = {};
                
                // 遍历所有文件，过滤出收藏的文件并按日期分组
                for (const dateKey in allFilesData) {
                    const dailyFiles = allFilesData[dateKey];
                    const favoriteDailyFiles = dailyFiles.filter(file => {
                        const isFavorite = favoriteFileIds.has(file.id);
                        file.isFavorite = isFavorite;
                        return isFavorite;
                    });
                    
                    if (favoriteDailyFiles.length > 0) {
                        favoriteFilesByDate[dateKey] = favoriteDailyFiles;
                    }
                }
                
                // 转换为平面数组用于显示
                const favoriteFiles = [];
                for (const dateKey in favoriteFilesByDate) {
                    favoriteFilesByDate[dateKey].forEach(file => {
                        favoriteFiles.push(file);
                    });
                }
                
                // 设置文件列表数据
                fileListData.value = favoriteFiles;
                console.log('显示的收藏文件:', favoriteFiles);
                loading.value = false;
            }).catch(error => {
                console.error('获取文件列表失败:', error);
                loading.value = false;
            });
        } else {
            loading.value = false;
        }
    }).catch(error => {
        console.error('获取收藏文件失败:', error);
        loading.value = false;
    });
}

// 点击个人空间
const handleSpaceClick = (spaceId) => {
    // 重置搜索栏
    Object.assign(filterForm, {
      fileType: '',
      dateRange: [],
      createBy: '',
      annotationContent: '',
      fileName: ''
    })
    activeSpace.value = spaceId
    activeCategory.value = '' // 清空板块分类选中状态
    folderData.value = [] // 不展示文件夹
    showSearchResults.value = false // 确保显示文件夹视图而不是搜索结果
    
    if (activeSpace.value == 'all') {
        getALlFileListData()
    } else if (activeSpace.value == 'favorite') {
        // 显示我的收藏
        // breadcrumbData.value = [{ filePath: '我的收藏', bizId: 'favorite' }]
        breadcrumbData.value = []
        
        // 确保已经加载了所有文件数据，以便能够应用筛选条件
        // 如果allFileListData为空，先加载所有文件
        // if (Object.keys(allFileListData).length === 0) {
        //     // 使用当前的筛选条件加载所有文件
        //     getALlFileListData().then(() => {
        //         // 然后获取收藏文件并应用筛选
        //         getFavoriteFiles()
        //     })
        // } else {
        //     // 直接获取收藏文件并应用筛选
        //     getFavoriteFiles()
        // }
        getFavoriteFiles()
    }
}

// 获取所有文件
const allFileListData = reactive({})//文件列表
let fileTypeObj = {
    'image': ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp', 'svg', 'heic'],
    'video': ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'webm'],
    'document': ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'pptx', 'zip', 'rar', '7z', 'tar', 'gz', 'txt', 'md', 'csv', 'json', 'xml'],
}
function getALlFileListData() {
    let params = {
        fileTypeList: fileTypeObj[filterForm.fileType] || null,
        createStartTime: filterForm.dateRange[0] ? filterForm.dateRange[0] + ' 00:00:00' : null,
        createEndTime: filterForm.dateRange[0] ? filterForm.dateRange[1] + ' 23:59:59' : null,
        // createStartTime: filterForm.dateRange && filterForm.dateRange.length === 2 ? filterForm.dateRange[0] + ' 00:00:00' : null,
        // createEndTime: filterForm.dateRange && filterForm.dateRange.length === 2 ? filterForm.dateRange[1] + ' 23:59:59' : null,
        createBy: filterForm.createBy,
        keyWords: filterForm.annotationContent,
        fileName: filterForm.fileName
    }
    // 如果filterForm.dateRange是空的，默认获取近30天的开始时间和结束时间
    if (filterForm.dateRange.length === 0) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        filterForm.dateRange = [formatDate(startDate), formatDate(endDate)];
    }

    console.log('执行查询:', params)
    getFileIndexList(params).then(res => {
        // 删除所有 key
        Object.keys(allFileListData).forEach(key => {
            delete allFileListData[key];
        });
        Object.assign(allFileListData, res.data)
        console.log("===allFileListData===",allFileListData)
        
        // 获取当前用户收藏列表并设置文件收藏状态
        getCollectionData(userStore.id).then(() => {
            // 提取收藏列表中的文件id
            const favoriteFileIds = collectionList.value.map(item => item.fileId);
            // 遍历所有文件列表，设置收藏状态
            for (const dateKey in allFileListData) {
                const dailyFiles = allFileListData[dateKey];
                dailyFiles.forEach(file => {
                    file.isFavorite = favoriteFileIds.includes(file.id);
                });
            }
        });
    })
}

// 点击板块分类
const handleCategoryClick = (category) => {
    // 重置搜索栏
    Object.assign(filterForm, {
      fileType: '',
      dateRange: [],
      createBy: '',
      annotationContent: '',
      fileName: ''
    })
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
    }
}

// 查询处理
const handleQuery = () => {
  showSearchResults.value = false; // 确保在收藏模块中不进入搜索结果视图
  if (activeSpace.value == 'all') {
    folderData.value = [] // 不展示文件夹
    getALlFileListData()
  } else if (activeSpace.value == 'favorite') {
    // 处理收藏模块的查询
    folderData.value = [] // 不展示文件夹
    getFavoriteFiles() // 重新获取并应用筛选条件
  } else {
    const pid = getCategoryPid(activeCategory.value)
    // getFolderData(pid)
    getQueryData(pid)
  }
}

// 获取文件列表数据
const queryfileListData = ref([])//文件列表
function getQueryData(pid) {

  if (pid !== 0) {
  let currentFilePath = "";
  for (let i = 0; i < breadcrumbData.value.length; i++) {
    // 避免开头出现多余的"/"
    currentFilePath += i === 0 ? breadcrumbData.value[i].filePath : "/" + breadcrumbData.value[i].filePath;
  }
    let param = {
      localPath: currentFilePath,
      // folderId: pid,
      fileTypeList: fileTypeObj[filterForm.fileType] || null,
      createStartTime: filterForm.dateRange[0] ? filterForm.dateRange[0] + ' 00:00:00' : null,
      createEndTime: filterForm.dateRange[0] ? filterForm.dateRange[1] + ' 23:59:59' : null,
      createBy: filterForm.createBy,
      keyWords: filterForm.annotationContent,
      fileName: filterForm.fileName
      
    }
    // console.log('localPath:', curFolderObj.filePath)
    console.log('breadcrumbData:', currentFilePath)
    getFileList(param).then(res => {
      queryfileListData.value = res.data
      showSearchResults.value = true
      // 获取当前用户收藏列表并设置文件收藏状态
      getCollectionData(userStore.id).then(() => {
          // 提取收藏列表中的文件id
          const favoriteFileIds = collectionList.value.map(item => item.fileId);
          // 遍历文件列表，设置收藏状态
          queryfileListData.value.forEach(file => {
              file.isFavorite = favoriteFileIds.includes(file.id);
          });
      });
    })
  }
}
// 重置搜索，返回文件夹视图
function resetSearch() {
  showSearchResults.value = false
  if(curFolderObj.bizId == 0){
    showFolder.value = true // 确保显示文件夹视图
  }
  
  // searchKeyword.value = ''
  // statusFilter.value = ''
  // breadcrumbData.value = [] // 清空面包屑数据
  // Object.assign(curFolderObj, {
  //   filePath: '',
  //   bizId: '',
  //   id: ''
  // }) // 重置当前文件夹对象
  Object.assign(filterForm, {
    fileType: '',
    dateRange: [],
    createBy: '',
    annotationContent: '',
    fileName: ''
  })
  // if (activeSpace.value == 'all') {
  //   folderData.value = [] // 不展示文件夹
  //   // getALlFileListData()
  // } else {
  //   const pid = getCategoryPid(activeCategory.value)
  //   getFolderData(pid)
  // }
  console.log(curFolderObj)
  getFolderData(curFolderObj.bizId) // 获取根文件夹数据
}
// 重置表单
const handleReset = () => {
  Object.assign(filterForm, {
    fileType: '',
    dateRange: [],
    createBy: '',
    annotationContent: '',
    fileName: ''
  })
  if (activeSpace.value == 'all') {
    folderData.value = [] // 不展示文件夹
    getALlFileListData()
  } else if (activeSpace.value == 'favorite') {
    // 处理收藏模块的重置
    folderData.value = [] // 不展示文件夹
    getFavoriteFiles() // 重新获取所有收藏文件（无筛选）
  } else {
    const pid = getCategoryPid(activeCategory.value)
    getFolderData(pid)
  }
}

// AI搜索
const handleAISearch = () => {
  console.log('执行AI搜索')
}

// 点击素材项
const handleMaterialClick = (material) => {
  console.log('点击素材:', material)
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


// 定时检查同步（每5秒）
let syncInterval = null

onMounted(() => {
  console.log('首页加载完成')
  handleSpaceClick('all')
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
  overflow-y: auto;
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

  // .favorite-btn {
  //   flex: 1;
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  // }

  // .download-btn {
  //   width: 80px !important;
  //   height: 28px !important;
  //   padding: 0 !important;
  //   font-size: 12px !important;
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   margin: 0 auto;
  // }
}

.subFolder {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 255px;
  height: 305px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  background: #fafafa;

  :deep(.el-icon) {
    font-size: 100px;
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
    font-size: 15px;
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

.allFileList {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  .everydayBox {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 16px;
    width: 1386px;

    .date {
      font-size: 14px;
      color: #606266;
      padding: 0 8px;
      margin-bottom: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
  }
}

.material-item {
    margin: 0;
    position: relative;
    width: 255px;
    height: 305px;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #ebeef5;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;

    &:hover {
      border-color: #409eff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

  .material-thumb {
    width: 100%;
    height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #f5f7fa;

    img {
      width: 95%;
      height: 95%;
      object-fit: fill;
      transition: transform 0.3s;
      cursor: pointer;
    }

    .videoBox {
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      video {
        width: 100%;
        height: 100%;
        object-fit: fill;
      }

      .file-icon {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        font-size: 48px;
        color: #ffffff;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        padding: 8px;
      }
    }

    .video-icon {
      font-size: 48px;
      color: #409eff;
    }

    .file-icon {
      font-size: 64px;
      color: #909399;
    }
  }

  // .material-details {
  //     padding: 8px 12px;
  //     display: flex;
  //     flex-direction: column;
  //     justify-content: space-between;
  //     // flex: 1;
  //   }

  .fileName {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    margin-top: 6px;
    margin-bottom: 4px;
    margin-left: 6px;
    margin-right: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    text-align: center
  }

  // .material-actions {
  //   display: flex;
  //   justify-content: space-between;
  //   padding: 0 12px 12px;
  //   // margin-top: auto;
  // }

  .download-btn {
    width: 45%;
    background-color: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 24px;

    &:hover {
      background-color: #66b1ff;
    }
  }
  

  .favorite-btn {
    width: 48%;
    background-color: #f0f2f5;
    color: #606266;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 24px;

    &:hover {
      background-color: #e6f7ff;
      border-color: #91d5ff;
      color: #1890ff;
      // background-color: #fff7e6;
      // border-color: #ffd591;
      // color: #fa8c16;
    }
    
    &.favorited {
      // background-color: #fff2e8;
      // border-color: #ffbb96;
      // color: #fa541c;
      background-color: #fff7e6;
      border-color: #ffd591;
      color: #fa8c16;
    }
  }
  
  :deep(.el-button) {
    padding: 6px 8px;
    font-size: 12px;
    height: 24px;
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
  height: 60px;
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 12px;
  
  :deep(.el-tag) {
    background-color: #ffffff;
    border-color: #67c23a;
    color: #67c23a;
  }
}

/* 素材操作区样式 */
.material-actions {
  padding: 0 12px 12px;
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.favorite-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-result-info {
  margin-left: 20px;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
  color: #909399;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

/* 适配不同屏幕尺寸 */
@media screen and (max-width: 1200px) {
  .subFolder {
    width: 120px;
    height: 120px;
  }
  
  .material-item {
    width: 250px;
    height: 240px;
  }
}

@media screen and (max-width: 768px) {
  .search-filter {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-filter>* {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .pageTop {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .btnList {
    justify-content: center;
  }

  .folderItem,
  .subFolder {
    width: 100px;
    height: 100px;
  }
  
  .material-item {
    width: 100%;
    max-width: 280px;
    height: 260px;
    margin: 0 auto;
  }

  :deep(.el-icon) {
    font-size: 32px !important;
  }
}
</style>