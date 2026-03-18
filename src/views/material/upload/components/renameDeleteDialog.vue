<template>
  <!-- 新增文件夹/编辑文件名 -->
  <el-dialog v-model="addFolderDialogVisible" :title="getDialogTitle" width="500" :before-close="handleAddFolderClose"
    :close-on-click-modal="false" style="margin-top: 30vh;">
    <el-input v-model="getInputModel" :placeholder="getDialogPlaceholder" @keyup.enter="handleAddFolderConfirm" />
    <template #footer>
      <div class="dialogFoot">
        <el-button @click="handleAddFolderClose">取消</el-button>
        <el-button type="primary" @click="handleAddFolderConfirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'
import { addFolder, updateFolder, delFolder, getFileList, delFile, updateFile, getFileEditKey } from "@/api/xcsc/uploadFile"

const { proxy } = getCurrentInstance();

const props = defineProps({
  showSearchResults: {
    type: Boolean,
    default: false,
  },
  folderData: {
    type: Array,
    default: () => [],
  },
  fileListData: {
    type: Array,
    default: () => [],
  },
  breadcrumbData: {
    type: Array,
    default: () => [],
  },
  curFolderObj: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['refresh-folder', 'refresh-query'])

// ==================== 新建 / 重命名对话框（文件夹与文件） ====================
// 新建文件夹
const handleFolderType = ref('add') // add edit edit_file
const addFolderDialogVisible = ref(false)
const folderName = ref('')
// 编辑文件名
const editFileName = ref('')
const editFileObj = reactive({})
const tempFileKey = ref('')

// 获取对话框标题
const getDialogTitle = computed(() => {
  if (handleFolderType.value === 'add') return '请输入文件夹名称'
  if (handleFolderType.value === 'edit') return '请输入文件夹名称'
  if (handleFolderType.value === 'edit_file') return '请输入文件名称'
  return '请输入名称'
})

// 获取输入模型
const getInputModel = computed({
  get: () => {
    if (handleFolderType.value === 'edit_file') return editFileName.value
    return folderName.value
  },
  set: (val) => {
    if (handleFolderType.value === 'edit_file') {
      editFileName.value = val
    } else {
      folderName.value = val
    }
  }
})

// 获取对话框占位符
const getDialogPlaceholder = computed(() => {
  if (handleFolderType.value === 'edit_file') return '请输入文件名称'
  return '请输入文件夹名称'
})
function handleAddFolderClose() {
  folderName.value = ''
  editFileName.value = ''
  tempFileKey.value = ''
  addFolderDialogVisible.value = false
}
function handleAddFolder() {
  addFolderDialogVisible.value = true
  handleFolderType.value = 'add'
}
function handleAddFolderConfirm() {
  // 验证输入不为空
  const inputValue = getInputModel.value.trim()
  if (!inputValue) {
    ElMessage.warning('名称不能为空')
    return
  }
  
  addFolderDialogVisible.value = false
  
  // 处理编辑文件名称
  if (handleFolderType.value === 'edit_file') {
    // 保留文件扩展名
    const originalName = getFileName(editFileObj.minioPath || editFileName.value)
    const dotIndex = originalName.lastIndexOf('.')
    if (dotIndex > -1) {
      const ext = originalName.substring(dotIndex)
      // 确保新文件名包含扩展名
      if (!inputValue.endsWith(ext)) {
        editFileName.value = inputValue + ext
      }
    }
    
    // 检查当前目录下是否已存在同名文件
    let fileExists = false
    // if (showSearchResults.value) {
    //   // 在搜索结果视图中检查
    //   fileExists = queryfileListData.value.some(file => 
    //     file.fileName === editFileName.value.trim() && file.id !== editFileObj.id
    //   )
    // } else {
      // 在普通视图中检查
      fileExists = props.fileListData.some(file => 
        file.fileName === editFileName.value.trim() && file.id !== editFileObj.id
      )
    // }
    
    if (fileExists) {
      ElMessage.error('当前目录下已存在同名文件，请更换名称！')
      addFolderDialogVisible.value = true // 保持对话框打开
      return
    }

    let folderPath = ''
    props.breadcrumbData.forEach((item, idx) => {
      folderPath += item.filePath
      if (idx !== props.breadcrumbData.length - 1) {
        folderPath += '/'  
      }
    })
    const filePathMapping = {
      id: editFileObj.id,
      bizId: editFileObj.bizId,
      fileName: editFileName.value.trim(),
      // localPath: folderPath + '/' + editFileName.value.trim(),
    }
    
    updateFile(filePathMapping, tempFileKey.value).then(res => {
      ElMessage.success('文件名修改成功')
      editFileName.value = ''
      // 刷新文件列表
      if (props.showSearchResults) {
        emit('refresh-query')
      } else {
        emit('refresh-folder')
      }
    }).catch(err => {
      ElMessage.error('文件名修改失败')
      console.error('修改文件名失败:', err)
    })
    return
  }
  
  // 处理文件夹相关操作
  let params = {
    filePath: folderName.value,
  }
  if (handleFolderType.value == 'add') {
    // 检查当前目录下是否已存在同名文件夹
    const folderExists = props.folderData.some(folder => folder.filePath === folderName.value.trim())
    if (folderExists) {
      ElMessage.error('当前目录下已存在同名文件夹，请更换名称！')
      addFolderDialogVisible.value = true // 保持对话框打开
      return
    }
    
    params.pid = props.curFolderObj.bizId
    addFolder(params).then(res => {
      ElMessage.success('新增成功')
      folderName.value = ''
      emit('refresh-folder')
    })
  } else if (handleFolderType.value == 'edit') {
    // 检查当前目录下是否已存在同名文件夹
    const folderExists = props.folderData.some(folder => 
      folder.filePath === folderName.value.trim() && folder.id !== editOrDeleteFolderObj.id
    )
    if (folderExists) {
      ElMessage.error('当前目录下已存在同名文件夹，请更换名称！')
      addFolderDialogVisible.value = true // 保持对话框打开
      return
    }
    
    params.id = editOrDeleteFolderObj.id
    params.bizId = editOrDeleteFolderObj.bizId
    console.log("params.bizId", params.bizId)
    updateFolder(params).then(res => {
      ElMessage.success('修改成功')
      folderName.value = ''
      emit('refresh-folder')
    })
  }
}
const editOrDeleteFolderObj = reactive({})  //编辑、删除的文件夹
// 编辑文件夹
function editFolder(item) {
  addFolderDialogVisible.value = true
  handleFolderType.value = 'edit'
  editOrDeleteFolderObj.id = item.id
  editOrDeleteFolderObj.bizId = item.bizId
  folderName.value = item.filePath
}
// 编辑文件
function editFile(item) {
  // 获取文件编辑Key
  getFileEditKey(item.id).then(res => {
    tempFileKey.value = res.data.fileKey
    addFolderDialogVisible.value = true
    handleFolderType.value = 'edit_file'
    editFileObj.id = item.id
    editFileObj.bizId = item.bizId
    editFileObj.minioPath = item.minioPath
    // 从minioPath中提取文件名
    const fileName = item.fileName
    editFileName.value = fileName
  }).catch(err => {
    ElMessage.error('获取文件密钥失败，请重试')
    console.error('获取文件密钥失败:', err)
  })
}
//  删除文件夹
function deleteFolder(item) {
  proxy.$modal.confirm('是否确认删除文件夹名称为"' + item.filePath + '"的数据项?').then(function () {
    return delFolder(item.bizId);
  }).then(() => {
    emit('refresh-folder')
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

// ==================== 文件删除与状态展示 ====================
// 删除文件
function deleteFile(item) {
  proxy.$modal.confirm('是否确认删除文件名为"' + item.fileName + '"的文件?').then(function () {
    return delFile(item.id);
  }).then(() => {
    emit('refresh-folder')
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}
// 搜索结果中删除文件
function deleteFileinQuery(item) {
  proxy.$modal.confirm('是否确认删除文件名为"' + item.fileName + '"的文件?').then(function () {
    return delFile(item.id);
  }).then(() => {
    emit('refresh-query')
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

// 获取文件名
function getFileName(path) {
  if (!path) return '';
  const idx = path.lastIndexOf('/');
  return idx !== -1 ? path.substring(idx + 1) : path;
}

defineExpose({
  handleAddFolder,
  editFolder,
  editFile,
  deleteFolder,
  deleteFile,
  deleteFileinQuery,
})
</script>

<style scoped>
/* 对话框样式优化 */
.dialogFoot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
