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
            <!-- <span class="space-name">{{ item.name }}</span> -->
            <!-- <span class="file-count">{{ item.id === 'all' ? totalAllFiles : totalFavoriteFiles }}</span> -->
          </div>
        </div>
      </div>

      <!-- 板块分类模块 -->
      <div class="category-list">
        <div
            v-for="dept in sortedCategoriesByDept"
            :key="dept.deptId"
            :class="[
        'category-item',
        {
          active: activeDeptId === dept.deptId,
          disabled: !canClickDept(dept)
        }
      ]"
            @click="handleDeptClickIfAllowed(dept)"
        >
          <span class="category-name">{{ dept.deptName }}</span>
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
                  <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath" :alt="getFileName(material.minioPath)"
                    @click="handleMaterialClick(material)" />
                  <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="handleMaterialClick(material)">
                    <el-icon class="file-icon">
                      <VideoPlay />
                    </el-icon>
                    <img :src="material.coverPath" :alt="material.fileName"/>
                    <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                      style="max-width: 90%; max-height: 90%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                  </div>
                  <el-icon v-else :src="material.minioPath" :alt="getFileName(material.minioPath)" class="file-icon"
                    @click="handleMaterialClick(material)" style="cursor:pointer;">
                    <Document />
                  </el-icon>
                </div>
                <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
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

        <!-- 文件数量信息 -->
        <div class="file-info" v-if="!showSearchResults">
          <template v-if="activeSpace === 'all'">
            共<span class="file-count-text">&nbsp;{{ totalAllFiles }}&nbsp;</span>个文件
          </template>
          <template v-else-if="activeSpace === 'favorite'">
            共<span class="file-count-text">&nbsp;{{ fileListData.length }}&nbsp;</span>个文件
          </template>
          <template v-else-if="activeCategory">
            共<span class="file-count-text">&nbsp;{{ fileListData.length }}&nbsp;</span>个文件
          </template>
        </div>
        
      <!-- 素材列表区 -->
        <div class="material-list">
          <div v-if="loading" class="loading-container">
            <el-loading-text>正在加载素材...</el-loading-text>
          </div>
          <div v-else-if="activeSpace == 'all' && Object.keys(allFileListData).length == 0"
            class="empty-state">
            <el-empty description="暂无内容" />
          </div>
          <div v-else-if="activeSpace == '' && folderData.length == 0 && fileListData == 0"
            class="empty-state">
            <el-empty description="暂无内容" />
          </div>
          <div v-else-if="activeSpace == 'favorite' && folderData.length == 0 && fileListData == 0"
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

            <!-- 文件列表 -->
            <div v-for="material in fileListData" :key="material.id" class="material-item">
              <div class="material-thumb">
                <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath" :alt="getFileName(material.minioPath)"
                  @click="handleMaterialClick(material)" />
                <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="handleMaterialClick(material)">
                  <el-icon class="file-icon">
                    <VideoPlay />
                  </el-icon>
                  <img :src="material.coverPath" :alt="material.fileName"/>
                  <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                    style="max-width: 90%; max-height: 90%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                </div>
                <el-icon v-else :src="material.minioPath" :alt="getFileName(material.minioPath)" class="file-icon"
                  @click="handleMaterialClick(material)" style="cursor:pointer;">
                  <Document />
                </el-icon>
              </div>
              <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
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
          <div class="allFileList" v-if="activeSpace == 'all'">
            <div class="everydayBox" v-for="(everydayData, index) in getSortedDates()" :key="index">
              <div class="date" style=" font-size: 16px;font-weight: 600;color: #303133;padding: 10px 0;border-bottom: 1px solid #ebeef5;width: 100%; margin-bottom: 16px;">{{ everydayData }}</div>
              <div class="material-grid">
                <div v-for="material in allFileListData[everydayData]" :key="material.id" class="material-item">
                  <div class="material-thumb">
                    <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath"
                      :alt="getFileName(material.minioPath)" @click="handleMaterialClick(material)" />
                    <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="handleMaterialClick(material)">
                      <el-icon class="file-icon">
                        <VideoPlay />
                      </el-icon>
                      <img :src="material.coverPath" :alt="material.fileName"/>
                      <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                        style="max-width: 90%; max-height: 90%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                    </div>
                    <el-icon v-else :src="material.minioPath" :alt="getFileName(material.minioPath)" class="file-icon"
                      @click="handleMaterialClick(material)" style="cursor:pointer;">
                      <Document />
                    </el-icon>
                  </div>
                  <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
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
    </div>
  </div>
</template>

<script setup name="Index">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFolderList, getFileList, getFileIndexList, getCollectionList, addCollection, delCollection,  getDeptCategoryList } from "@/api/xcsc/uploadFile"
import useUserStore from '@/store/modules/user'

const router = useRouter()
const route = useRoute()
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
  bizId: [],
  filePath: [],
})
// 存储分类名称到bizId的映射
const categoryMap = ref({})

// 获取左侧板块列表
function getCategoriesByDeptList() {
  return getDeptCategoryList().then(response => {
    const list = response.data || []

    // 直接赋值数组
    categoriesByDept.value = list

    // 默认选中第一个
    // if (list.length > 0) {
    //   activeDeptId.value = list[0].deptId
    // }
  })
}

// 页面加载时调用
// getCategories(0)
getCategoriesByDeptList()

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

function getFolderData(folderBizId) {
  let params = {
    pid: folderBizId,
  }
  console.log('===folderBizId===', folderBizId);
  console.log('===params===', params);

  getFolderList(params).then(res => {
    folderData.value = res.data
    console.log('===folderData.value===', folderData.value)
  })

  if (folderBizId !== 0) {
    let param = {
      folderId: folderBizId,
      fileTypeList: fileTypeObj[filterForm.fileType] || null,
      createStartTime: filterForm.dateRange[0]
          ? filterForm.dateRange[0] + ' 00:00:00'
          : null,
      createEndTime: filterForm.dateRange[0]
          ? filterForm.dateRange[1] + ' 23:59:59'
          : null,
      createBy: filterForm.createBy,
      annotationContent: filterForm.annotationContent,
      fileName: filterForm.fileName
    }

    getFileList(param).then(res => {
      fileListData.value = res.data
      // 获取当前用户收藏列表并设置文件收藏状态
      getCollectionData().then(() => {
        const favoriteFileIds = collectionList.value.map(item => item.fileId);
        fileListData.value.forEach(file => {
          file.isFavorite = favoriteFileIds.includes(file.id);
        });
      });
      console.log('===fileListData.value===', fileListData.value)
    })
  }
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
// const totalFiles = computed(() => materials.value.length)
// 计算所有文件的总数
const totalAllFiles = computed(() => {
  let count = 0;
  for (const dateKey in allFileListData) {
    if (allFileListData[dateKey] && Array.isArray(allFileListData[dateKey])) {
      count += allFileListData[dateKey].length;
    }
  }
  return count;
});

// 计算收藏文件的总数
const totalFavoriteFiles = computed(() => {
  if (activeSpace.value === 'favorite') {
    return fileListData.value.length;
  }
  return collectionList.value.length;
});

// 存储各板块的文件数量 todo 通过sql查count
// const categoryFileCounts = ref({});

// 获取指定板块的文件数量
const getCategoryFileCount = (category) => {
  return categoryFileCounts.value[category] || 0;
};


//收藏列表
const collectionList = ref([])

function getCollectionData(){
    return getCollectionList().then(res => {
      collectionList.value = res.data
      console.log('collectionList.value', collectionList.value)
      return res.data;
    })
}
// 在组件挂载时获取收藏列表，确保页面初始加载时所有文件的收藏状态正确
onMounted(() => {
  if (userStore.id) {
    getCollectionData()
  }
  // 初始化板块文件数量
  // initCategoryFileCounts();
})

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

// 当前选中的部门
const activeDeptId = ref(null)

// 所有部门列表
const categoriesByDept = ref([])

const isAdmin = computed(() => {
  const user = userStore.user;

  // 对象数组 roles
  const objectRoles = user?.roles?.some(
      role => role.roleKey === 'admin' || role.roleKey === 'studio'
  );

  // 顶层字符串数组 roles
  const stringRoles = userStore.roles?.some(
      role => role === 'admin' || role === 'studio'
  );

  return objectRoles || stringRoles;
});

// 判断部门是否可点击
const canClickDept = (dept) => {
  if (isAdmin.value) return true
  return Number(dept.deptId) === Number(userStore.deptId)
}

// 点击部门处理（真正业务逻辑）
const handleDeptClick = (dept) => {
  activeDeptId.value = dept.deptId
  console.log('选中部门：', dept.deptName)
  // TODO: 根据 deptId 拉取文件列表等逻辑
  // 板块/公司  有一个主文件夹（pid = 0）；dept."foldid"
  handleCategoryClick(dept)
}

// 包装点击：不可点击时直接 return
const handleDeptClickIfAllowed = (dept) => {
  if (!canClickDept(dept)) return
  handleDeptClick(dept)
}

// 排序：可点击部门排前面
const sortedCategoriesByDept = computed(() => {
  return [...categoriesByDept.value].sort((a, b) => {
    const aCan = canClickDept(a) ? 0 : 1
    const bCan = canClickDept(b) ? 0 : 1
    return aCan - bCan
  })
})

// 收藏操作
const toggleFavorite = (event, material) => {
    event.stopPropagation() // 阻止事件冒泡，避免触发素材点击事件

    if(material.isFavorite){
      // 取消收藏 - 显示确认对话框
      ElMessageBox.confirm(
        '确定要取消收藏该素材吗？',
        '取消收藏确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 用户确认取消收藏
        material.isFavorite = false
        let params = {
          fileId: material.id
        }
        console.log('===params===', params)
        delCollection(params).then(res => {
          // 取消收藏成功后，更新收藏列表
          getCollectionData().then(() => {
            // 更新当前文件列表中的收藏状态
            updateFileFavoriteStatus();
          })
          
          console.log('===res===', res)
          
          // 显示操作反馈
          ElMessage.success('取消收藏')
          
          // 如果当前在"我的收藏"页面，取消收藏后需要更新显示的文件列表
          if (activeSpace.value === 'favorite') {
              // 从显示的文件列表中移除该文件
              const index = fileListData.value.findIndex(file => file.id === material.id)
              if (index !== -1) {
                  fileListData.value.splice(index, 1)
              }
          }
        })
      }).catch(() => {
        // 用户取消操作，不做任何处理
        console.log('用户取消了取消收藏操作')
      })
    } else {
      // 收藏
      material.isFavorite = true
      let params = {
        fileId: material.id
      }
      addCollection(params).then(res => {
        // 收藏成功后，更新收藏列表
        getCollectionData().then(() => {
          // 更新当前文件列表中的收藏状态
          updateFileFavoriteStatus();
        })
        
        console.log('===res===', res)
        
        // 显示操作反馈
        ElMessage.success('收藏成功')
      })
    }
    console.log('===material.isFavorite===', material.isFavorite)
    console.log('===material===', material)
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
    getCollectionData().then(() => {
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
    // activeCategory.value = '' // 清空板块分类选中状态
    folderData.value = [] // 不展示文件夹
    showSearchResults.value = false // 确保显示文件夹视图而不是搜索结果
    
    if (activeSpace.value == 'all') {
        fileListData.value = []
        getAllFileListData()
    } else if (activeSpace.value == 'favorite') {
        // 显示我的收藏
        // breadcrumbData.value = [{ filePath: '我的收藏', bizId: 'favorite' }]
        breadcrumbData.value = []
        getFavoriteFiles()
    }
    
    // 如果切换到板块分类视图，更新板块文件数量
    // if (!spaceId) {
    //     updateCategoryFileCounts();
    // }
}

// 获取当前用户能接触的所有文件（n天m个文件，后端有个数限制）
const allFileListData = reactive({}) // 文件列表
const fileTypeObj = {
  image: ['jpg','jpeg','png','bmp','gif','webp','svg','heic'],
  video: ['mp4','mov','avi','mkv','flv','wmv','webm','m4v'],
  document: ['doc','docx','xls','xlsx','pdf','pptx','zip','rar','7z','tar','gz','txt','md','csv','json','xml'],
}

function getAllFileListData() {
  const params = {
    fileTypeList: fileTypeObj[filterForm.fileType] || null,
    createStartTime: filterForm.dateRange?.[0] ? filterForm.dateRange[0] + ' 00:00:00' : null,
    createEndTime: filterForm.dateRange?.[1] ? filterForm.dateRange[1] + ' 23:59:59' : null,
    createBy: filterForm.createBy,
    keyWords: filterForm.annotationContent,
    fileName: filterForm.fileName
  }

  getFileIndexList(params).then(res => {
    Object.assign(allFileListData, res.data) // 直接覆盖，不用先删
    // 设置收藏状态
    getCollectionData().then(() => {
      const favoriteFileIds = collectionList.value.map(item => item.fileId)
      for (const dateKey in allFileListData) {
        allFileListData[dateKey].forEach(file => {
          file.isFavorite = favoriteFileIds.includes(file.id)
        })
      }
    })
  })
}

// 点击板块分类（统一接收 dept 对象）
const handleCategoryClick = (dept) => {
  // 1. 重置搜索栏
  Object.assign(filterForm, {
    fileType: '',
    dateRange: [],
    createBy: '',
    annotationContent: '',
    fileName: ''
  })

  // 2. 设置当前选中状态
  activeCategory.value = dept.deptName
  activeDeptId.value = dept.deptId
  activeSpace.value = ''

  console.log('===activeCategory===', dept)

  // 3. 拉取数据
  getFolderData(dept.rootFolderId)

  // 4. 面包屑
  breadcrumbData.value = [
    {
      filePath: dept.deptName,
      bizId: pid
    }
  ]

  // 5. 当前文件夹对象
  Object.assign(curFolderObj, {
    filePath: dept.deptName,
    bizId: pid
  })
}

// 查询处理
const handleQuery = () => {
  showSearchResults.value = false; // 确保在收藏模块中不进入搜索结果视图
  if (activeSpace.value == 'all') {
    folderData.value = [] // 不展示文件夹
    getAllFileListData()
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
      getCollectionData().then(() => {
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
  Object.assign(filterForm, {
    fileType: '',
    dateRange: [],
    createBy: '',
    annotationContent: '',
    fileName: ''
  })
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
  video: ['mp4', 'mov', 'avi', 'mkv', 'flv','m4v'],
  document: ['docx', 'pdf', 'pptx']
}

function isImage(path) {
  return ['jpg', 'jpeg', 'png', 'bmp', 'gif'].some(ext => path.toLowerCase().includes(ext));
}

function isVideo(path) {
  return ['mp4', 'mov', 'avi', 'mkv', 'flv','m4v'].some(ext => path.toLowerCase().includes(ext));
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

// 获取按日期倒序排序的日期键数组
const getSortedDates = () => {
  return Object.keys(allFileListData).sort((a, b) => {
    // 将日期字符串转换为Date对象进行比较，确保最新的日期排在前面
    return new Date(b) - new Date(a);
  });
}


// 定时检查同步（每5秒）
let syncInterval = null

onMounted(async () => {
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

/* sidebar.scss */
.sidebar {
  width: 280px;
  height: 100vh;
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  display: flex;
  flex-direction: column;

  /* 每个板块间隔 */
  .sidebar-section {
    &:not(:last-child) {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #606266;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
    }
  }

  /* 个人空间列表 */
  .space-list {
    max-height: 120px;       // 固定高度，超出滚动
    overflow-y: auto;

    .space-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      color: #303133;
      background: #fff;

      &:hover {
        background: #ecf5ff;
        color: #409eff;
      }

      &.active {
        background: #409eff;
        color: #fff;
        font-weight: 500;
      }

      .space-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-count {
        font-size: 12px;
        color: #909399;
        background: #f0f2f5;
        padding: 2px 8px;
        border-radius: 10px;
        margin-left: auto;

        .space-item:hover & {
          background: #e6f7ff;
          color: #409eff;
        }

        .space-item.active & {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
      }
    }
  }

  .category-list {
    flex: 1;                // 占满剩余高度
    overflow-y: auto;       // 开启垂直滚动
    padding-right: 4px;     // 防止滚动条遮挡内容
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
      background: #fff;

      .category-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-count {
        font-size: 12px;
        color: #909399;
        background: #f0f2f5;
        padding: 2px 8px;
        border-radius: 10px;
        margin-left: 8px;
        flex-shrink: 0;
      }

      // hover 样式：只有可点击的才生效
      &:not(.disabled):hover {
        background: #ecf5ff;
        color: #409eff;

        .category-name,
        .file-count {
          color: #409eff;
        }
        .file-count {
          background: #e6f7ff;
        }
      }

      &.active {
        background: #409eff;
        color: #fff;

        .category-name,
        .file-count {
          color: #fff;
        }
        .file-count {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      &.disabled {
        cursor: not-allowed;
        color: #aaa;
        background: #f5f5f5;

        .file-count {
          background: #eee;
          color: #aaa;
        }
      }
    }
  }
}

// 右侧内容区
.content-area {
  flex: 1;
  width: 100%;
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
    // margin-bottom: 20px;
    font-size: 14px;
    color: #606266;
    display: flex;
    align-items: center;
    padding: 10px 16px;
    // background: #f8f9fa;
    border-radius: 4px;
    
    .file-count-text {
      font-weight: 500;
      // color: #409eff;
    }
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
  width: 100%;
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
  display: grid;
  // flex-wrap: wrap;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 18px;
  margin-top: 16px;
}

.allFileList {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
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

  .everydayBox {
    // display: flex;
    // flex-wrap: wrap;
    // gap: 16px;
    max-height: calc(100% - 130px);
    height: calc(100% - 130px);
    overflow-y: auto;
    margin-top: 16px;
    width: 100%; 
  }
}

.material-item {
    margin: 0;
    position: relative;
    // width: 255px;
    width: 100%;
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
      // background-color: #e6f7ff;
      // border-color: #91d5ff;
      // color: #1890ff;
      background-color: #fff7e6;
      border-color: #ffd591;
      color: #fa8c16;
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
  height: 50px;
  margin-top: 8px;
  margin-bottom: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 12px;
  /* 隐藏溢出内容 */
  overflow: hidden;
  
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