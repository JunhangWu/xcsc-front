<template>
  <div class="app-container">
    <div class="annotation-layout">
      <div class="sidebar">
        <div class="sidebar-title">素材状态</div>
        <div class="sidebar-menu">
          <div
            v-for="status in statusList"
            :key="status.value"
            class="sidebar-item"
            :class="{ 'is-active': currentStatus === status.value }"
            @click="handleStatusChange(status.value)"
          >
            <el-icon class="sidebar-icon">
              <component :is="status.icon" />
            </el-icon>
            <span class="sidebar-label">{{ status.label }}</span>
            <span class="sidebar-count">{{ status.count }}</span>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="search-filter">
          <span class="search-filter-label">素材名：</span>
          <el-input v-model="searchKeyword" placeholder="请输入素材名称" style="width: 300px; margin-right: 10px;">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <span class="search-filter-label">素材标签：</span>
          <el-input
            v-model="searchTagKeywords"
            placeholder="请输入素材标签（支持多标签，用空格隔开）"
            clearable
            style="width: 550px; margin-right: 10px;"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch" icon="Search">搜索</el-button>
          <el-button @click="handleReset" icon="Close">重置</el-button>
        </div>

        <div class="card">
          <div class="pageTop">
            <div class="breadcrumbBox">
              <div class="search-result-info">
                  {{ getStatusTitle(currentStatus) }}：共 {{ total }} 个文件
                </div>
            </div>
            <div class="pageTopRight">
              <el-button type="primary" plain @click="refreshData" size="default">
                <el-icon style="margin-right: 6px;">
                  <Refresh />
                </el-icon>刷新
              </el-button>
              <el-dropdown trigger="click" @command="switchViewMode" popper-class="view-mode-dropdown">
                <el-button class="view-mode-trigger" text>
                  <el-icon>
                    <Grid />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="list">
                      <span class="view-mode-option">
                        <span class="view-mode-prefix">
                          <el-icon v-if="viewMode === 'list'" class="view-mode-check">
                            <Check />
                          </el-icon>
                        </span>
                        <span :class="{ 'is-active': viewMode === 'list' }">列表模式</span>
                      </span>
                    </el-dropdown-item>
                    <el-dropdown-item command="thumbnail">
                      <span class="view-mode-option">
                        <span class="view-mode-prefix">
                          <el-icon v-if="viewMode === 'thumbnail'" class="view-mode-check">
                            <Check />
                          </el-icon>
                        </span>
                        <span :class="{ 'is-active': viewMode === 'thumbnail' }">大图模式</span>
                      </span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="sort-controls" v-if="viewMode === 'thumbnail'">
            <span class="sort-label">排序方式：</span>
            <el-button :type="sortField === 'name' ? 'primary' : 'default'" @click="sortFiles('name')" size="small">
              名称
              <el-icon v-if="sortField === 'name'" :class="{ 'is-reverse': sortOrder === 'desc' }">
                <ArrowUp />
              </el-icon>
            </el-button>
            <el-button :type="sortField === 'size' ? 'primary' : 'default'" @click="sortFiles('size')" size="small">
              大小
              <el-icon v-if="sortField === 'size'" :class="{ 'is-reverse': sortOrder === 'desc' }">
                <ArrowUp />
              </el-icon>
            </el-button>
            <el-button :type="sortField === 'date' ? 'primary' : 'default'" @click="sortFiles('date')" size="small">
              创建日期
              <el-icon v-if="sortField === 'date'" :class="{ 'is-reverse': sortOrder === 'desc' }">
                <ArrowUp />
              </el-icon>
            </el-button>
            <el-button :type="sortField === 'type' ? 'primary' : 'default'" @click="sortFiles('type')" size="small">
              类型
              <el-icon v-if="sortField === 'type'" :class="{ 'is-reverse': sortOrder === 'desc' }">
                <ArrowUp />
              </el-icon>
            </el-button>
          </div>

          <div class="card-body">
            <div class="material-list">

              <div v-if="filteredFileList.length == 0" class="empty-state">
                <el-empty description="暂无素材" />
              </div>
              <div v-else-if="viewMode === 'thumbnail'" class="material-grid">
                <div v-for="material in filteredFileList" :key="material.id" class="material-item"
                  @mouseenter="onSubFolderMouseEnter(material)" @mouseleave="onSubFolderMouseLeave(material)">
                  <span class="subFolder-actions">
                    <el-icon class="action-icon" @click.stop="editFile(material)" title="重命名" v-show="material._hover" style="color: #409eff;">
                      <Edit />
                    </el-icon>
                    <el-icon class="action-icon" @click.stop="deleteFile(material)" title="删除" v-show="material._hover" style="color: #f56c6c;">
                      <Delete />
                    </el-icon>
                  </span>
                  <div class="material-thumb">
                    <img v-if="isImage(material.minioPath)" :src="getProxyPath(material.coverPath) || getProxyPath(material.minioPath)" :alt="material.fileName"
                      @click="previewImg(material)" />
                    <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="previewVideo(material)">
                      <el-icon class="file-icon">
                        <VideoPlay />
                      </el-icon>
                      <img :src="getProxyPath(material.coverPath)" :alt="material.fileName"/>
                    </div>
                    <el-icon v-else class="file-icon" @click="downloadFile(material)" style="cursor:pointer;">
                      <Document />
                    </el-icon>
                  </div>
                  
                  <div class="material-details">
                    <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
                    <div class="file-id">ID: {{ material.id }}</div>
                    <div class="file-id">大小: {{ formatFileSize(material.fileSize) }}</div>
                    <div class="file-status">
                      <el-tag :type="getStatusTagType(material.annotationStatus)" size="medium">
                        {{ getStatusText(material.annotationStatus) }}
                      </el-tag>
                    </div>
                  </div>
                  
                  <div class="material-actions">
                    <el-button type="primary" size="small" @click.stop="showMaterialDetail(material)" icon="Edit">
                      标注
                    </el-button>
                  </div>
                </div>
              </div>
              <div v-else class="material-table-wrapper">
                <el-table :data="filteredFileList" class="material-table" :row-key="getListRowKey">
                  <el-table-column min-width="360">
                    <template #header>
                      <div class="sortable-header" @click="sortFiles('name')">
                        文件名
                        <el-icon v-if="sortField === 'name'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                          <ArrowUp />
                        </el-icon>
                      </div>
                    </template>
                    <template #default="{ row }">
                      <div class="table-file-cell">
                        <img
                          v-if="isImage(row.minioPath)"
                          class="table-thumb"
                          :src="getProxyPath(row.coverPath) || getProxyPath(row.minioPath)"
                          :alt="row.fileName"
                          @click.stop="previewImg(row)"
                        />
                        <img
                          v-else-if="isVideo(row.minioPath) && row.coverPath"
                          class="table-thumb"
                          :src="getProxyPath(row.coverPath)"
                          :alt="row.fileName"
                          @click.stop="previewVideo(row)"
                        />
                        <span v-else-if="isVideo(row.minioPath)" class="table-type-icon" @click.stop="previewVideo(row)">
                          <el-icon>
                            <VideoPlay />
                          </el-icon>
                        </span>
                        <span v-else class="table-type-icon" @click.stop="downloadFile(row)">
                          <el-icon>
                            <Document />
                          </el-icon>
                        </span>
                        <span class="table-file-name-text" :title="row.fileName" @click="handleListNameClick(row)">
                          {{ row.fileName }}
                        </span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column width="160">
                    <template #header>
                      <div class="sortable-header" @click="sortFiles('size')">
                        大小
                        <el-icon v-if="sortField === 'size'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                          <ArrowUp />
                        </el-icon>
                      </div>
                    </template>
                    <template #default="{ row }">
                      {{ formatFileSize(row.fileSize) }}
                    </template>
                  </el-table-column>
                  <el-table-column width="160">
                    <template #header>
                      <div class="sortable-header" @click="sortFiles('type')">
                        类型
                        <el-icon v-if="sortField === 'type'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                          <ArrowUp />
                        </el-icon>
                      </div>
                    </template>
                    <template #default="{ row }">
                      {{ getFileType(row.minioPath) }}
                    </template>
                  </el-table-column>
                  <el-table-column width="200">
                    <template #header>
                      <div class="sortable-header" @click="sortFiles('date')">
                        修改时间
                        <el-icon v-if="sortField === 'date'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                          <ArrowUp />
                        </el-icon>
                      </div>
                    </template>
                    <template #default="{ row }">
                      {{ formatDateTime(row.updateTime || row.createTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="120">
                    <template #default="{ row }">
                      <el-tag :type="getStatusTagType(row.annotationStatus)" size="medium">
                        {{ getStatusText(row.annotationStatus) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="220">
                    <template #default="{ row }">
                      <div class="table-actions">
                        <el-button link type="primary" @click.stop="showMaterialDetail(row)">标注</el-button>
                        <el-button link type="primary" @click.stop="editFile(row)">重命名</el-button>
                        <el-button link type="danger" @click.stop="deleteFile(row)">删除</el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
            
            <!-- 分页组件 -->
            <div v-if="total > 0" class="pagination-container">
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
    </div>

    <!-- 预览视频 -->
    <el-dialog v-model="videoDialogVisible" :title="videoDialogTitle" width="50vw" :close-on-click-modal="false"
      style="margin-top: 15vh;">
      <video :src="videoFilePath" controls autoplay loop muted playsinline
        style="max-width: 100%; max-height: 50vh; width: auto; height: auto; display: block; object-fit: contain;margin: 0 auto;"></video>
    </el-dialog>

    <el-dialog v-model="addFolderDialogVisible" :title="getDialogTitle" width="500px" @close="handleAddFolderClose">
      <el-input v-model="editFileName" placeholder="请输入文件名称" />
      <template #footer>
        <div class="dialogFoot">
          <el-button @click="handleAddFolderClose">取消</el-button>
          <el-button type="primary" @click="handleAddFolderConfirm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <MarkDialog ref="markDialogRef" @updateFileList="refreshData" />
  </div>
</template>

<script setup name="MaterialAnnotation">
const router = useRouter()
const route = useRoute()
const { proxy } = getCurrentInstance();
import { ref, reactive, onMounted, computed } from 'vue'
import { api as viewerApi } from "v-viewer";
import { parseTime, } from '@/utils/common'
import { scrollPageTop } from '@/utils/scroll-to'
import { Search, VideoCamera, Document, Check, Edit, VideoPlay, VideoPause, Back, ArrowRight, ArrowUp, FolderAdd, FolderOpened, Upload, UploadFilled, Delete, Grid, Close, List, Files, DocumentCopy, Refresh, Clock, CircleCheck, CircleCheckFilled, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFolderList, addFolder, updateFolder, delFolder, uploadFiles, getFileListPage, delFile, updateFile, checkChunks, uploadFileChunk, mergeFileChunks,minioProxyUrl, getFileEditKey} from "@/api/xcsc/uploadFile"
import auth from '@/plugins/auth'
import useUserStore from '@/store/modules/user'
import MarkDialog from '../upload/components/markDialog.vue'
import download from '../../../plugins/download';

const userStore = useUserStore()

const loading = ref(false)
const searchKeyword = ref('')
const searchTagKeywords = ref('')
const currentStatus = ref('0')
const fileListData = ref([])

const sortField = ref('date')
const sortOrder = ref('desc')
const viewMode = ref('thumbnail')
const nameCollator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const statusList = ref([
  { label: '待标注', value: '0', icon: Clock, count: 0 },
  { label: '待审核', value: '1', icon: Edit, count: 0 },
  { label: '已审核', value: '2', icon: CircleCheckFilled, count: 0 },
  { label: '标注失败', value: '3', icon: Warning, count: 0 }
])

const filteredFileList = computed(() => {
  let result = [...fileListData.value]
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.fileName && item.fileName.toLowerCase().includes(keyword)
    )
  }
  
  return sortData(result)
})

function sortData(data) {
  return data.sort((a, b) => {
    let comparison = 0
    
    switch (sortField.value) {
      case 'name':
        comparison = nameCollator.compare(a.fileName || '', b.fileName || '')
        break
      case 'size':
        comparison = (a.fileSize || 0) - (b.fileSize || 0)
        break
      case 'date':
        comparison = new Date(a.createTime || 0) - new Date(b.createTime || 0)
        break
      case 'type':
        comparison = getFileType(a.minioPath || '').localeCompare(getFileType(b.minioPath || ''))
        break
    }
    
    return sortOrder.value === 'desc' ? -comparison : comparison
  })
}

function sortFiles(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

function switchViewMode(mode) {
  if (mode === 'thumbnail' || mode === 'list') {
    viewMode.value = mode
  }
}

function handleSearch() {
  currentPage.value = 1
  getFileListData()
}

function handleReset() {
  searchKeyword.value = ''
  searchTagKeywords.value = ''
  currentPage.value = 1
  getFileListData()
}

async function refreshData() {
  // currentPage.value = 1
  await getFileListData()
  await initStatusCounts() // 标注完成后更新状态计数
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  scrollPageTop()
  getFileListData()
}

function handleCurrentChange(page) {
  currentPage.value = page
  scrollPageTop()
  getFileListData()
}

async function getFileListData() {
  loading.value = true
  try {
    const params = {
      deptid: userStore.deptId,
      annotationStatus: Number(currentStatus.value),
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    if (searchKeyword.value.trim()) {
      params.fileName = searchKeyword.value.trim()
    }
    if (searchTagKeywords.value.trim()) {
      params.keyWords = searchTagKeywords.value.trim()
    }
    const res = await getFileListPage(params)
    fileListData.value = Array.isArray(res?.rows) ? res.rows : []
    total.value = Number(res?.total || 0)
    
    // 移除更新状态计数的代码，状态计数由initStatusCounts函数单独处理
  } finally {
    loading.value = false
  }
}

function handleStatusChange(status) {
  currentStatus.value = status
  currentPage.value = 1
  getFileListData()
}

function getStatusTitle(status) {
  const statusItem = statusList.value.find(s => s.value === status)
  return statusItem ? statusItem.label : '全部'
}

function isImage(path) {
  if (!path) return false
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
  const ext = path.toLowerCase().substring(path.lastIndexOf('.'))
  return imageExts.includes(ext)
}

function isVideo(path) {
  if (!path) return false
  const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm']
  const ext = path.toLowerCase().substring(path.lastIndexOf('.'))
  return videoExts.includes(ext)
}

function getFileType(path) {
  if (!path) return '未知'
  const ext = path.toLowerCase().substring(path.lastIndexOf('.'))
  const typeMap = {
    '.jpg': '图片', '.jpeg': '图片', '.png': '图片', '.gif': '图片', '.bmp': '图片', '.webp': '图片', '.svg': '图片',
    '.mp4': '视频', '.avi': '视频', '.mov': '视频', '.wmv': '视频', '.flv': '视频', '.mkv': '视频', '.webm': '视频',
    '.pdf': '文档', '.doc': '文档', '.docx': '文档', '.xls': '文档', '.xlsx': '文档', '.ppt': '文档', '.pptx': '文档', '.txt': '文档'
  }
  return typeMap[ext] || '其他'
}


//预览视频
const videoDialogVisible = ref(false)
const videoFilePath = ref('')
const videoDialogTitle = ref('')
function previewVideo(material) {
  videoDialogVisible.value = true
  videoFilePath.value = getProxyPath(material.minioPath)
  videoDialogTitle.value = material.fileName
}

function formatFileSize(bytes) {
  return bytes + ' MB';
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function getStatusText(status) {
  const statusMap = {
    '0': '待标注',
    '1': '待审核',
    '2': '已审核',
    '3': '标注失败'
  }
  return statusMap[status] || '未知'
}

function getStatusTagType(status) {
  const typeMap = {
    '0': 'warning',
    '1': 'primary',
    '2': 'success',
    '3': 'danger'
  }
  return typeMap[status] || 'info'
}

const getProxyPath = (url) => {
  if (!url) return ''
  const u = new URL(url)
  const parts = u.pathname.replace(/^\/+/, '').split('/')
  const bucket = parts.shift()
  const objectKey = parts.join('/')
// 自动获取当前环境的 API 前缀（例如 /dev-api）
  const baseApi = import.meta.env.VITE_APP_BASE_API || ''
  const params = new URLSearchParams({
    bucketName: bucket,
    filePath: objectKey
  })
  return `${baseApi}/minio/proxy?${params.toString()}`
}

function previewImg(material) {
  const images = [getProxyPath(material.minioPath)]
  viewerApi({
    images: images,
    options: {
      initialViewIndex: 0,
      toolbar: true,
      title: false,
      movable: true,
      zoomable: true,
      rotatable: true,
      scalable: true,
      transition: true,
      fullscreen: true,
      keyboard: true,
    }
  })
}


function downloadFile(material) {
  download.minio(material.minioPath, material.fileName)
}

function onSubFolderMouseEnter(item) {
  item._hover = true
}

function onSubFolderMouseLeave(item) {
  item._hover = false
}

function handleListNameClick(row) {
  if (isImage(row.minioPath)) {
    previewImg(row)
  } else if (isVideo(row.minioPath)) {
    previewVideo(row)
  } else {
    downloadFile(row)
  }
}

function getListRowKey(row) {
  return row.id || row.minioPath
}

const handleFolderType = ref('edit_file')
const addFolderDialogVisible = ref(false)
const editFileName = ref('')
const editFileObj = reactive({})
const tempFileKey = ref('')

const getDialogTitle = computed(() => {
  if (handleFolderType.value === 'edit_file') return '请输入文件名称'
  return '请输入名称'
})





function handleAddFolderClose() {
  editFileName.value = ''
  tempFileKey.value = ''
  addFolderDialogVisible.value = false
}

function editFile(item) {
  // 获取文件编辑Key
  getFileEditKey(item.id).then(res => {
    tempFileKey.value = res.data.fileKey
    addFolderDialogVisible.value = true
    handleFolderType.value = 'edit_file'
    editFileObj.id = item.id
    editFileObj.minioPath = item.minioPath
    const fileName = item.fileName
    editFileName.value = fileName
  }).catch(err => {
    ElMessage.error('获取文件密钥失败，请重试')
    console.error('获取文件密钥失败:', err)
  })
}

function handleAddFolderConfirm() {
  const inputValue = editFileName.value.trim()
  if (!inputValue) {
    ElMessage.warning('名称不能为空')
    return
  }
  
  addFolderDialogVisible.value = false
  
  const originalName = getFileName(editFileObj.minioPath || editFileName.value)
  const dotIndex = originalName.lastIndexOf('.')
  if (dotIndex > -1) {
    const ext = originalName.substring(dotIndex)
    if (!inputValue.endsWith(ext)) {
      editFileName.value = inputValue + ext
    }
  }
  
  const fileExists = fileListData.value.some(file => 
    file.fileName === editFileName.value.trim() && file.id !== editFileObj.id
  )
  
  if (fileExists) {
    ElMessage.error('已存在同名文件，请更换名称！')
    addFolderDialogVisible.value = true
    return
  }

  const params = {
    id: editFileObj.id,
    fileName: editFileName.value.trim(),
    localPath: editFileName.value.trim(),
  }
  
  updateFile(params, tempFileKey.value).then(res => {
    ElMessage.success('文件名修改成功')
    editFileName.value = ''
    tempFileKey.value = ''
    getFileListData()
    initStatusCounts() // 修改文件名后更新状态计数
  }).catch(err => {
    ElMessage.error('文件名修改失败')
    console.error('修改文件名失败:', err)
  })
}

function getFileName(path) {
  if (!path) return ''
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return path.substring(lastSlash + 1)
}

function deleteFile(item) {
  proxy.$modal.confirm('是否确认删除文件"' + item.fileName + '"?').then(function () {
    return delFile(item.id);
  }).then(() => {
    getFileListData()
    initStatusCounts() // 删除文件后更新状态计数
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

const markDialogRef = ref(null)

function showMaterialDetail(material) {
  if (markDialogRef.value) {
    markDialogRef.value.open(material)
  }
}

async function initStatusCounts() {
  try {
    await Promise.all(
      statusList.value.map(async (status) => {
        try {
          const params = {
            deptid: userStore.deptId,
            annotationStatus: Number(status.value),
            pageNum: 1,
            pageSize: 1
          }
          // 移除搜索关键词，获取所有文件的数量
          const res = await getFileListPage(params)
          status.count = Number(res?.total || 0)
        } catch (e) {
          status.count = 0
        }
      })
    )
  } catch (e) {
    console.error('初始化状态计数失败:', e)
  }
}

onMounted(async () => {
  await initStatusCounts()
  getFileListData()
})
</script>

<style scoped lang="scss">
.annotation-layout {
  display: flex;
  gap: 20px;
  height: calc(100vh - 120px);
}

.sidebar {
  width: 240px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar-title {
  padding: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background-color: #f5f7fa;
  }

  &.is-active {
    background-color: #ecf5ff;
    color: #409eff;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: #409eff;
    }
  }
}

.sidebar-icon {
  font-size: 18px;
  margin-right: 12px;
  color: #909399;
  flex-shrink: 0;

  .sidebar-item.is-active & {
    color: #409eff;
  }
}

.sidebar-label {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.sidebar-count {
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;

  .sidebar-item.is-active & {
    background-color: #409eff;
    color: #ffffff;
  }
}

/* 待标注和标注失败状态数量显示为红色 */
.sidebar-item:nth-child(1) .sidebar-count,
.sidebar-item:nth-child(4) .sidebar-count {
  color: #f56c6c;
  background-color: #fef0f0;
  
  .sidebar-item.is-active & {
    background-color: #f56c6c;
    color: #ffffff;
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.subFolder-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  gap: 4px;
}

.action-icon {
  font-size: 18px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.2s;
  background-color: #ffffff;
  border-radius: 50%;
  padding: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.material-item {
  position: relative;
}

.pageTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e4e7ed;
}

.breadcrumbBox {
  display: flex;
  align-items: center;
}

.search-result-info {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.pageTopRight {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-mode-trigger {
  font-size: 18px;
  color: #606266;
  padding: 6px;
  border-radius: 4px;
  border: none;

  &:hover,
  &:focus-visible {
    color: #409eff;
    background: #ecf5ff;
  }
}

:deep(.view-mode-dropdown .view-mode-option) {
  display: inline-flex;
  align-items: center;
  min-width: 72px;
}

:deep(.view-mode-dropdown .view-mode-prefix) {
  width: 16px;
  margin-right: 6px;
  flex: 0 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.view-mode-dropdown .view-mode-check) {
  color: #409eff;
}

:deep(.view-mode-dropdown .view-mode-option .is-active) {
  color: #409eff;
}

.search-filter {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 6px;
    transition: all 0.3s ease;
  }
}

.search-filter-label {
  color: #606266;
  font-size: 14px;
  margin-right: 8px;
  white-space: nowrap;
}

.sort-controls {
  padding: 8px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .sort-label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }
  
  :deep(.el-button) {
    margin-right: 8px;
    
    .el-icon {
      margin-left: 4px;
      transition: transform 0.3s ease;
      
      &.is-reverse {
        transform: rotate(180deg);
      }
    }
  }
}

.sort-arrow {
  margin-left: 4px;
  transition: transform 0.3s ease;
}

.sort-arrow.is-reverse {
  transform: rotate(180deg);
}

.sortable-header {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: #409eff;
  }
}

.material-table-wrapper {
  width: 100%;
}

.table-file-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.table-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f7fa;
  cursor: pointer;
  flex-shrink: 0;
}

.table-type-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #909399;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.table-file-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
  cursor: pointer;

  &:hover {
    color: #409eff;
  }
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-body {
  background: #ffffff;
  border-radius: 0 0 8px 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
  overflow-y: auto;
}

.material-list {
  min-height: 100%;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
  gap: 18px;
}

.material-item {
  margin: 0;
  position: relative;
  width: 100%;
  height: 255px;
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
    height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #f5f7fa;

    img {
      width: 95%;
      height: 95%;
      contain: content;
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

    .file-icon {
      font-size: 64px;
      color: #909399;
    }
  }

  .material-details {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .file-status {
    margin-bottom: 8px;
  }

  .fileName {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  
  .file-id {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .material-actions {
    position: absolute;
    bottom: 8px;
    right: 12px;
    margin-top: -4px;
  }

  :deep(.el-button) {
    padding: 6px 8px;
    font-size: 12px;
    height: 24px;
  }
}



.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  margin-top: 20px;
  background: #ffffff;
  border-radius: 0 0 8px 8px;
}

.pagination-container :deep(.el-pagination) {
  margin: 0;
}

.dialogFoot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-button) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-tag) {
  border-radius: 4px;
}

@media screen and (max-width: 1200px) {
  .material-item {
    width: 250px;
    height: 240px;
  }
}

@media screen and (max-width: 768px) {
  .annotation-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
  }

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

  .pageTopRight {
    width: 100%;
    justify-content: space-between;
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
<style>
.viewer-container {
  z-index: 9999 !important;
}

.view-mode-dropdown .view-mode-option {
  display: inline-flex;
  align-items: center;
  min-width: 72px;
}

.view-mode-dropdown .view-mode-prefix {
  width: 16px;
  margin-right: 6px;
  flex: 0 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.view-mode-dropdown .view-mode-check {
  color: #409eff;
}

.view-mode-dropdown .view-mode-option .is-active {
  color: #409eff;
}
</style>
