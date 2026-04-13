<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="550px"
    :close-on-click-modal="false"
    custom-class="move-dialog"
    :before-close="handleBeforeClose"
  >
    <div class="move-dialog-content">
      <!-- 文件夹树选择器 -->
      <el-tree
        v-if="!loading"
        ref="folderTree"
        :data="folderTreeData"
        :props="treeProps"
        node-key="id"
        @node-click="handleNodeClick"
        :current-node-key="selectedFolderId"
        class="folder-tree"
        :expand-on-click-node="false"
        lazy
        :load="loadNode"
      >
        <template #default="{ node, data }">
          <div class="tree-node-content">
            <el-icon class="folder-icon">
              <Folder />
            </el-icon>
            <span :class="{ 'selected': selectedFolderId === data.id }">{{ data.label }}</span>
          </div>
        </template>
      </el-tree>
      <div v-else class="loading-container">
        <el-loading-spinner class="loading-spinner"></el-loading-spinner>
        <el-loading-text class="loading-text">正在加载文件夹列表...</el-loading-text>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" class="cancel-button">取消</el-button>
        <el-button type="primary" @click="handleMove" :loading="moving" class="confirm-button">
          {{ moving ? '移动中...' : '确定' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Folder } from '@element-plus/icons-vue'
import { getFolderList, moveFolder, moveFile, getFilesByFolderId } from '@/api/xcsc/uploadFile'

// Props
const props = defineProps({
  showSearchResults: {
    type: Boolean,
    default: false
  },
  folderData: {
    type: Array,
    default: () => []
  },
  fileListData: {
    type: Array,
    default: () => []
  },
  breadcrumbData: {
    type: Array,
    default: () => []
  },
  curFolderObj: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['refresh-folder', 'refresh-query'])

// State
const dialogVisible = ref(false)
const dialogTitle = ref('移动到')
const loading = ref(false)
const moving = ref(false)
const folderTreeData = ref([])
const selectedFolderId = ref(null)
const itemToMove = ref(null)
const itemType = ref('') // 'file' or 'folder' or 'mixed'
const folderCache = ref(new Map()) // 文件夹缓存
const requestQueue = ref([]) // 请求队列
const MAX_CONCURRENT_REQUESTS = 3 // 最大并发请求数
const activeRequests = ref(0) // 当前活跃请求数

// Tree props
const treeProps = {
  children: 'children',
  label: 'label',
  isLeaf: 'isLeaf'
}

function normalizeId(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  return String(value)
}

function getFolderBizId(folder) {
  return folder?.bizId ?? folder?.id ?? null
}

function getFolderRecordId(folder) {
  return folder?.id ?? folder?.bizId ?? null
}

function getFileId(file) {
  return file?.id ?? file?.fileId ?? null
}

function getMoveBatches() {
  if (Array.isArray(itemToMove.value)) {
    if (itemType.value === 'file') {
      return { files: itemToMove.value, folders: [] }
    }
    if (itemType.value === 'folder') {
      return { files: [], folders: itemToMove.value }
    }
    const files = itemToMove.value.filter(item => item?._rowType === 'file')
    const folders = itemToMove.value.filter(item => item?._rowType === 'folder')
    return { files, folders }
  }
  if (itemType.value === 'folder') {
    return { files: [], folders: itemToMove.value ? [itemToMove.value] : [] }
  }
  if (itemType.value === 'file') {
    return { files: itemToMove.value ? [itemToMove.value] : [], folders: [] }
  }
  return { files: [], folders: [] }
}

// Methods
function open(item, type) {
  itemToMove.value = item
  itemType.value = type
  if (type === 'mixed') {
    dialogTitle.value = '批量移动项目'
  } else if (type === 'file') {
    dialogTitle.value = Array.isArray(item) ? '批量移动文件' : '移动文件'
  } else if (type === 'folder') {
    dialogTitle.value = Array.isArray(item) ? '批量移动文件夹' : '移动文件夹'
  } else {
    dialogTitle.value = '移动到'
  }
  dialogVisible.value = true
  selectedFolderId.value = null
  loadFolderTree()
}

async function loadFolderTree() {
  loading.value = true
  try {
    // 清空缓存
    folderCache.value.clear()
    // 加载根文件夹
    const rootResponse = await getFolderList({ pid: 0 })
    const rootFolders = rootResponse.data || []
    
    // 构建根文件夹树，过滤掉共享文件夹
    const treeData = rootFolders.filter(folder => !folder.isShared).map(rootFolder => {
      return {
        id: normalizeId(rootFolder.bizId),
        label: rootFolder.filePath,
        isLeaf: false
      }
    })
    
    folderTreeData.value = treeData
  } catch (error) {
    ElMessage.error('加载文件夹列表失败')
    console.error('Error loading folder tree:', error)
  } finally {
    loading.value = false
  }
}

async function loadNode(node, resolve) {
  const nodeId = normalizeId(node.level === 0 ? 0 : (node?.data?.id ?? node?.key))
  if (node.level !== 0 && !nodeId) {
    resolve([])
    return
  }
  
  // 检查缓存
  if (folderCache.value.has(nodeId)) {
    const cachedChildren = folderCache.value.get(nodeId)
    resolve(cachedChildren)
    return
  }
  
  // 添加到请求队列
  requestQueue.value.push({ nodeId, resolve })
  processRequestQueue()
}

async function processRequestQueue() {
  if (requestQueue.value.length === 0 || activeRequests.value >= MAX_CONCURRENT_REQUESTS) {
    return
  }
  
  const request = requestQueue.value.shift()
  activeRequests.value++
  
  try {
    const response = await getFolderList({ pid: request.nodeId })
    const childFolders = response.data || []
    
    // 过滤掉共享文件夹
    const nonSharedFolders = childFolders.filter(folder => !folder.isShared)
    
    const children = nonSharedFolders.map(folder => {
      return {
        id: normalizeId(folder.bizId),
        label: folder.filePath,
        isLeaf: false
      }
    })
    
    // 缓存结果
    folderCache.value.set(request.nodeId, children)
    request.resolve(children)
  } catch (error) {
    console.error(`Error loading child folders for node ${request.nodeId}:`, error)
    request.resolve([])
  } finally {
    activeRequests.value--
    // 处理下一个请求
    processRequestQueue()
  }
}

function handleNodeClick(data) {
  selectedFolderId.value = normalizeId(data.id)
}

async function handleMove() {
  if (moving.value) {
    return
  }

  if (!selectedFolderId.value) {
    ElMessage.warning('请选择目标文件夹')
    return
  }

  const targetFolderId = normalizeId(selectedFolderId.value)
  if (!targetFolderId) {
    ElMessage.warning('请选择有效的目标文件夹')
    return
  }
  
  const { files: filesToMove, folders: foldersToMove } = getMoveBatches()
  if (filesToMove.length === 0 && foldersToMove.length === 0) {
    ElMessage.warning('未选择可移动的项目')
    return
  }

  // 检查文件夹移动限制（自身/子级/同级）
  if (foldersToMove.length > 0) {
    for (const folder of foldersToMove) {
      if (isMovingToSelfOrChild(folder, targetFolderId)) {
        ElMessage.warning(`文件夹「${folder.filePath || folder.id}」不能移动到自身或其子文件夹`)
        return
      }
      const sourceParentId = normalizeId(folder?.pid)
      if (sourceParentId && sourceParentId === targetFolderId) {
        ElMessage.warning(`文件夹「${folder.filePath || folder.id}」已在目标目录下，无需移动`)
        return
      }
    }

    const targetFolderNode = findNodeById(targetFolderId, folderTreeData.value)
    if (targetFolderNode && targetFolderNode.children) {
      const existsFolderNames = new Set(targetFolderNode.children.map(child => child.label))
      const conflictFolder = foldersToMove.find(folder => existsFolderNames.has(folder.filePath))
      if (conflictFolder) {
        ElMessage.warning(`目标路径中已存在同名文件夹：${conflictFolder.filePath}`)
        return
      }
    }
  }

  // 检查目标路径是否已存在同名文件（仅单文件时前置检查，批量依赖服务端校验）
  if (filesToMove.length === 1) {
    try {
      const response = await getFilesByFolderId(targetFolderId)
      const targetFiles = response.data || []
      const fileName = filesToMove[0]?.fileName
      const hasSameNameFile = targetFiles.some(file => 
        file.fileName === fileName
      )
      if (hasSameNameFile) {
        ElMessage.warning('目标路径中已存在同名文件，请修改文件名后再移动！')
        return
      }
    } catch (error) {
      console.error('Error checking for same name file:', error)
      // 如果获取文件列表失败，我们可以继续执行移动操作，因为服务器端可能会有重复检查
    }
  }
  
  moving.value = true
  try {
    let fileSuccessCount = 0
    let fileFailedCount = 0
    let folderSuccessCount = 0
    let folderFailedCount = 0

    for (const folder of foldersToMove) {
      const sourceBizId = getFolderBizId(folder)
      const sourceId = getFolderRecordId(folder)
      if (!sourceBizId) {
        folderFailedCount++
        continue
      }
      try {
        await moveFolder({
          id: sourceId,
          bizId: sourceBizId,
          targetPid: targetFolderId
        })
        folderSuccessCount++
      } catch (error) {
        console.error(`Error moving folder ${folder.id}:`, error)
        folderFailedCount++
      }
    }

    for (const file of filesToMove) {
      const fileId = getFileId(file)
      if (!fileId) {
        fileFailedCount++
        continue
      }
      try {
        await moveFile({
          fileId,
          targetFolderId
        })
        fileSuccessCount++
      } catch (error) {
        console.error(`Error moving file ${file.id}:`, error)
        fileFailedCount++
      }
    }

    const totalSuccess = fileSuccessCount + folderSuccessCount
    const totalFailed = fileFailedCount + folderFailedCount
    if (totalSuccess > 0) {
      ElMessage.success(`成功移动 ${totalSuccess} 个项目（文件夹${folderSuccessCount}，文件${fileSuccessCount}）`)
    }
    if (totalFailed > 0) {
      ElMessage.warning(`${totalFailed} 个项目移动失败，请重试`)
    }
    if (totalSuccess > 0) {
      dialogVisible.value = false
      emit('refresh-folder')
      if (props.showSearchResults) {
        emit('refresh-query')
      }
    }
  } catch (error) {
    ElMessage.error('移动失败，请重试')
    console.error('Error moving item:', error)
  } finally {
    moving.value = false
  }
}

function isMovingToSelfOrChild(folder, targetId) {
  const sourceFolderId = normalizeId(getFolderBizId(folder))
  const targetFolderId = normalizeId(targetId)
  if (!sourceFolderId || !targetFolderId) {
    return false
  }

  // 检查是否移动到自身
  if (sourceFolderId === targetFolderId) {
    return true
  }
  
  // 检查是否移动到子文件夹
  return isChildFolder(targetFolderId, sourceFolderId)
}

function findNodeById(id, tree) {
  const normalizedId = normalizeId(id)
  for (const node of tree) {
    if (normalizeId(node.id) === normalizedId) {
      return node
    }
    if (node.children && node.children.length > 0) {
      const foundNode = findNodeById(id, node.children)
      if (foundNode) {
        return foundNode
      }
    }
  }
  return null
}

function isChildFolder(childId, parentId) {
  // 由于使用懒加载，无法通过本地树结构判断是否为子文件夹
  // 这里简化处理，只检查是否移动到自身
  const normalizedChildId = normalizeId(childId)
  const normalizedParentId = normalizeId(parentId)
  return normalizedChildId === normalizedParentId
}

// Methods
function handleBeforeClose(done) {
  if (moving.value) {
    ElMessage.warning('移动操作正在进行中，请等待完成后再关闭')
    return
  }
  done()
}

// Expose methods
defineExpose({
  open
})
</script>

<style scoped>
/* 弹窗整体样式 */
:deep(.move-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: dialogFadeIn 0.3s ease-out;
}

:deep(.move-dialog .el-dialog__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  padding: 20px 24px;
}

:deep(.move-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

:deep(.move-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.move-dialog .el-dialog__footer) {
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

/* 内容区域 */
.move-dialog-content {
  max-height: 400px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  background-color: #fff;
}

/* 文件夹树样式 */
.folder-tree {
  padding: 10px;
}

:deep(.folder-tree .el-tree-node) {
  padding: 4px 0;
}

:deep(.folder-tree .el-tree-node__content) {
  height: 36px;
  line-height: 36px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.folder-tree .el-tree-node__content:hover) {
  background-color: #f0f9ff;
}

:deep(.folder-tree .el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  color: #409eff;
}

:deep(.folder-tree .el-tree-node.is-current > .el-tree-node__content:hover) {
  background-color: #e6f7ff;
}

/* 树节点内容 */
.tree-node-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 8px;
}

.folder-icon {
  margin-right: 8px;
  color: #409eff;
  font-size: 16px;
}

.tree-node-content .selected {
  color: #409eff;
  font-weight: 500;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.loading-spinner {
  margin-bottom: 12px;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: #666;
}

/* 按钮样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button {
  border-radius: 6px;
  transition: all 0.2s ease;
}

.confirm-button {
  border-radius: 6px;
  transition: all 0.2s ease;
  min-width: 80px;
}

/* 动画效果 */
@keyframes dialogFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 滚动条样式 */
.move-dialog-content::-webkit-scrollbar {
  width: 8px;
}

.move-dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.move-dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.move-dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
