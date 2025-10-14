<template>
  <div class="app-container">
    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <el-input v-model="searchKeyword" placeholder="请输入素材名称或标签" style="width: 300px; margin-right: 10px;">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="标注状态" style="width: 150px; margin-right: 10px;">
        <el-option label="全部" value="" />
        <el-option label="待标注" value="pending" />
        <el-option label="待审核" value="manual_review" />
        <el-option label="已标注" value="completed" />
      </el-select>
      <el-button type="primary" @click="getFolderData" icon="Search">搜索</el-button>
    </div>

    <div class="folderBox" v-if="showFolder">
      <div class="folderItem" v-for="(item, index) in folderData" :key="index"
        @click="selectFolder(item, 'isRootFolder')">
        <el-icon>
          <FolderOpened />
        </el-icon>
        <div class="folderName">
          {{ item.filePath }}
        </div>
      </div>
    </div>

    <div class="card" v-else>
      <div class="pageTop">
        <div class="breadcrumbBox">
          <!-- 返回到上一级 -->
          <el-icon @click="backFolder" class="backBtn">
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
        <div class="btnList">
          <el-button type="primary" plain @click="handleAddFolder">
            <el-icon style="font-size: 18px;margin:0 6px 0 0 ;">
              <FolderAdd />
            </el-icon>新建文件夹
          </el-button>
          <el-button type="primary" plain @click="uploadFile">
            <el-icon style="font-size: 18px;margin:0 6px 0 0 ;">
              <Upload />
            </el-icon>上传文件
          </el-button>
        </div>
      </div>

      <div class="card-body">
        <!-- 素材列表 - 网格视图 -->
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
              <span class="subFolder-actions">
                <el-icon class="action-icon" @click.stop="editFolder(item)" v-show="item._hover"
                  style="color: #409eff;">
                  <Edit />
                </el-icon>
                <el-icon class="action-icon" @click.stop="deleteFolder(item)" v-show="item._hover"
                  style="color: #f56c6c;">
                  <Delete />
                </el-icon>
              </span>
              <el-icon @click="selectFolder(item)">
                <FolderOpened />
              </el-icon>
              <div class="subFolderName"> {{ item.filePath }}</div>
            </div>
            <!-- 文件列表 -->
            <div v-for="material in fileListData" :key="material.id" class="material-item">
              <div class="material-thumb">
                <img v-if="isImage(material.minioPath)" :src="material.minioPath" :alt="getFileName(material.minioPath)"
                  @click="previewImg(material)" />
                <el-icon v-else-if="isVideo(material.minioPath)" class="file-icon">
                  <VideoPlay />
                </el-icon>
                <el-icon v-else class="file-icon">
                  <Document />
                </el-icon>
                <div class="fileName">{{ getFileName(material.minioPath) }}</div>
              </div>
              <div class="material-info">
                <div class="material-status">
                  <!-- 待标注:0  AI标注:1  人工修改:2-->
                  <el-tag :type="getStatusTagType(material.annotationStatus)">
                    {{ getStatusText(material.annotationStatus) }}
                  </el-tag>
                </div>
                <div class="material-actions">
                  <el-button type="primary" size="small" @click.stop="showMaterialDetail(material)" icon="Edit">
                    标注
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 新增文件夹 -->
    <el-dialog v-model="addFolderDialogVisible" title="请输入文件夹名称" width="500" :before-close="handleAddFolderClose"
      :close-on-click-modal="false" style="margin-top: 30vh;">
      <el-input v-model="folderName" placeholder="请输入文件夹名称" />
      <template #footer>
        <div class="dialogFoot">
          <el-button @click="handleAddFolderClose">取消</el-button>
          <el-button type="primary" @click="handleAddFolderConfirm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 上传文件 -->
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="50vw" :before-close="cancelUpload"
      :close-on-click-modal="false" style="margin-top: 20vh;">
      <el-upload v-model:file-list="fileList" class="upload-demo" drag :multiple="uploadType === 'file'"
        :directory="uploadType === 'folder'" action="" :on-change="handleFileChange" :before-upload="handleBeforeUpload"
        :auto-upload="false">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          {{ uploadType === 'file' ? '点击或拖拽文件到此处上传' : '点击或拖拽文件夹到此处上传' }}
          <div class="el-upload__tip"> 支持图片：jpeg / jpg / png / bmp / gif；视频：mp4 / mov / avi / mkv / flv；文档：docx /
            pdf / pptx
          </div>
        </div>
      </el-upload>
      <template #footer>
        <div class="dialogFoot">
          <el-button @click="cancelUpload">取消</el-button>
          <el-button type="primary" @click="confirmUpload">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 素材标注弹框 -->
    <MarkDialog ref="markDialogRef"></MarkDialog>


  </div>
</template>

<script setup name="MaterialAnnotation">
const { proxy } = getCurrentInstance();
import { ref, reactive, onMounted } from 'vue'
import { Search, VideoCamera, Document, Check, Edit, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFolderList, addFolder, updateFolder, delFolder, uploadFiles, getFileList } from "@/api/xcsc/uploadFile"
import MarkDialog from './components/markDialog.vue'
// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('')

// 素材列表
const loading = ref(false)
const showFolder = ref(true)
const curFolderObj = reactive({
  filePath: '',
  bizId: '',
  id: '',
})
const breadcrumbData = ref([])

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
    showFolder.value = true
    getFolderData(0)
    return
  } else {
    getFolderData(breadcrumbData.value[breadcrumbData.value.length - 2].bizId) //获取上一级文件夹的bizId
    breadcrumbData.value.pop()
  }
  console.log('===breadcrumbData.value===', breadcrumbData.value);
}

// 获取文件夹及文件列表数据
const folderData = ref([]) //文件夹列表
const fileListData = ref([])//文件列表
function getFolderData(pid) {
  let params = {
    pid: pid,
  }
  getFolderList(params).then(res => {
    folderData.value = res.data
  })
  if (pid !== 0) {
    let param = {
      folderId: pid,
    }
    getFileList(param).then(res => {
      fileListData.value = res.data
    })
  }
}
getFolderData(0)

//新建文件夹
const handleFolderType = ref('add') // add edit
const addFolderDialogVisible = ref(false)
const folderName = ref('')
function handleAddFolderClose() {
  folderName.value = ''
  addFolderDialogVisible.value = false
}
function handleAddFolder() {
  addFolderDialogVisible.value = true
  handleFolderType.value = 'add'
}
function handleAddFolderConfirm() {
  addFolderDialogVisible.value = false
  let params = {
    filePath: folderName.value,
  }
  if (handleFolderType.value == 'add') {
    params.pid = curFolderObj.bizId
    addFolder(params).then(res => {
      ElMessage.success('新增成功')
      folderName.value = ''
      getFolderData(curFolderObj.bizId)
    })
  } else {
    params.id = editOrDeleteFolderObj.id
    updateFolder(params).then(res => {
      ElMessage.success('修改成功')
      folderName.value = ''
      getFolderData(curFolderObj.bizId)
    })
  }
}
const editOrDeleteFolderObj = reactive({})  //编辑、删除的文件夹
// 编辑文件夹
function editFolder(item) {
  addFolderDialogVisible.value = true
  handleFolderType.value = 'edit'
  editOrDeleteFolderObj.id = item.id
  folderName.value = item.filePath
}
//  删除文件夹
function deleteFolder(item) {
  proxy.$modal.confirm('是否确认删除文件夹名称为"' + item.filePath + '"的数据项?').then(function () {
    return delFolder(item.id);
  }).then(() => {
    getFolderData(curFolderObj.bizId)
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}
// 文件夹悬浮控制
function onSubFolderMouseEnter(item) {
  item._hover = true
}
function onSubFolderMouseLeave(item) {
  item._hover = false
}

// 上传文件
const uploadDialogVisible = ref(false)
const uploadType = ref('file')// 上传类型
const fileList = ref([])// 文件列表
function uploadFile() {
  uploadDialogVisible.value = true
}
function cancelUpload() {
  uploadDialogVisible.value = false
}
function confirmUpload() {
  let formData = new FormData();
  // files 是多个文件的数组集合，用于上传的文件流
  let files = fileList.value.map(item => item.raw || item.originFileObj || item); // 兼容不同上传组件的文件对象
  files.forEach(file => {
    formData.append("files", file);
  });
  let folderPath = ''
  formData.append("folderId ", curFolderObj.bizId);
  breadcrumbData.value.forEach((item, idx) => {
    folderPath += item.filePath
    if (idx !== breadcrumbData.value.length - 1) {
      folderPath += '/'
    }
    console.log('===folderPath===', folderPath);

  })
  formData.append("folderPath ", folderPath);
  uploadFiles(formData).then(res => {
    ElMessage.success(`上传成功！`)
    getFolderData(curFolderObj.bizId)
  })
  uploadDialogVisible.value = false
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
const handleBeforeUpload = (file) => {
  // 格式验证（图片/视频/文档）
  const ext = file.name.split('.').pop().toLowerCase();
  const validFormats = [...supportedFormats.image, ...supportedFormats.video, ...supportedFormats.document];
  if (!validFormats.includes(ext)) {
    ElMessage.error(`不支持${ext}格式，请上传${Object.values(supportedFormats).flat().join('/')}文件`);
    return false;
  }
  // 检查文件格式
  if (!isSupportedFormat(file.name)) {
    ElMessage.error(`文件 ${file.name} 格式不符合要求，请上传支持的文件格式`)
    return false
  }
  // 检查文件大小（可选，可根据需要添加）
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    ElMessage.error(`文件 ${file.name} 大小超过限制（100MB）`)
    return false
  }
  return true
}
// 文件变化处理
const handleFileChange = (file, fileList) => {
  console.log('==file====', file);

  // 实时显示文件校验状态
  fileList.forEach(f => {
    f.status = isSupportedFormat(f.name) ? 'success' : 'error'
  })
  // 检查文件格式
  const invalidFiles = fileList.filter(f => !isSupportedFormat(f.name))
  if (invalidFiles.length > 0) {
    ElMessage.error(`素材格式不符合，请上传支持的文件格式`)
    // 移除不支持格式的文件
    fileList.value = fileList.filter(f => isSupportedFormat(f.name))
    return
  }

  // 更新文件列表
  fileList.value = fileList
  console.log('===fileList.value===', fileList.value);
}





// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    '0': 'warning',
    '1': 'primary',
    '2': 'success'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    '0': '待标注',
    '1': 'AI已标注',
    '2': '人工已标注'
  }
  return textMap[status] || status
}

//预览图片
function previewImg(material) {

}

// 显示素材详情
const markDialogRef = ref(null)
function showMaterialDetail(material) {
  // 打开 MarkDialog 弹框
  markDialogRef.value.open(material)
}


</script>

<style scoped lang="scss">
.folderBox {
  display: flex;
  flex-wrap: wrap;
  max-height: calc(100vh - 180px);
  overflow-y: auto;

  .folderItem {
    margin: 10px;
    aspect-ratio: 1 / 1; // 保证正方形
    width: 10vw;
    height: 10vw;
    cursor: pointer;
    display: flex;
    // justify-content: flex-start;
    // align-items: center;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    :deep(.el-icon) {
      // font-size: 30px;
      font-size: 8vw;
      font-weight: 600;
      color: #ffd45e;
    }

    .folderName {
      text-align: center;
    }

    &:hover {
      // scale: 1.05;
      background-color: #e5f3ff;
      border-radius: 6px;
    }
  }
}

.pageTop {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #d3d3d3;

  .breadcrumbBox {
    display: flex;


    .backBtn {
      font-size: 40px;
      cursor: pointer;

      &:hover {
        scale: 1.05;
        color: #409eff;
      }
    }

    .breadcrumb {
      display: flex;
      margin: 0 0 0 20px;

      .breadcrumbItem {
        display: flex;
        font-size: 20px;
        align-items: center;

        .breadcrumbName {
          line-height: 40px;
          padding: 0 8px;
          font-weight: 600;
          border-radius: 5px;
          cursor: pointer;

          &:hover {
            // scale: 1.05;
            color: #409eff;
            background-color: #ebf5ff;
          }
        }

        .breadcrumbArrow {
          position: relative;
          top: 2px;
        }
      }
    }
  }

  .btnList {
    margin: 0 5px;
  }
}


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
  border-radius: 4px;
  color: #909399;
}


// 网格视图样式
.material-grid {
  display: flex;
  margin-bottom: 20px;
}

.subFolder {
  position: relative;
  margin: 10px;
  aspect-ratio: 1 / 1; // 保证正方形
  width: 10vw;
  height: 10vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  :deep(.el-icon) {
    font-size: 8vw;
    font-weight: 600;
    color: #ffd45e;
    cursor: pointer;
  }

  &:hover {
    // scale: 1.05;
    background-color: #e5f3ff;
    border-radius: 6px;
  }

  .subFolder-actions {
    position: absolute;
    top: 8px;
    right: 10px;
    display: flex;
    gap: 8px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .subFolder-actions {
    opacity: 1;
  }

  .action-icon {
    font-size: 22px;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 50%;
    padding: 2px;
    cursor: pointer;
    transition: color 0.2s;
    font-weight: 600;

    &:hover {
      scale: 1.1;
    }
  }
}



.material-item {
  margin: 10px;
  position: relative;
  aspect-ratio: 1 / 1; // 保证正方形
  width: 10vw;
  height: 10vw;
  border-radius: 3px;
  overflow: hidden;
  background: #fff;
  transition: all 0.2s;
  cursor: pointer;
  display: block;

  .material-thumb {
    width: 100%;
    height: 100%;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 80%;
      object-fit: contain;
      transition: transform 0.3s;
    }

    .file-icon {
      font-size: 48px;
      color: #909399;
      margin: 50px 0 10px 0;
    }

    .fileName {
      text-align: center;
      margin: 5px 0 0 0;
    }
  }
}


.material-info {
  position: absolute;
  left: 0;
  top: 0px;
  width: 100%;
  height: 30px;
  z-index: 2;
  background: rgba(177, 200, 224, 0.55); // 半透明深色
  color: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;

  .material-status {
    margin: 0 5px;
  }

  .material-actions {
    margin: 0 5px;
  }

}


.preview-image {
  max-width: 100%;
  max-height: 650px;
  object-fit: contain;
  border-radius: 4px;
  transition: transform 0.3s ease;
}

.preview-image:hover {
  transform: scale(1.02);
}

.preview-video,
.preview-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #606266;
}

.preview-video .el-icon,
.preview-file .el-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #909399;
}

.material-basic-info {
  flex: 0.8;
  background: #fafafa;
  padding: 10px;
  border-radius: 8px;
  min-width: 180px;
}

.material-basic-info h4 {
  margin-bottom: 12px;
  color: #303133;
  font-weight: 700;
  font-size: 18px;
}

.info-row {
  margin-bottom: 8px;
  line-height: 1.6;
  font-size: 13px;
}

.info-label {
  color: #606266;
  font-weight: 500;
  display: inline-block;
  width: 80px;
}

/* 元数据信息样式 */
.metadata-section {
  margin-bottom: 12px;
}

.section-title {
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.metadata-grid {
  display: flex;

  .metadata-item {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px;

    .metadata-label {
      font-size: 13px;
      color: #909399;
    }

    .metadata-value {
      font-size: 13px;
      color: #303133;
      font-weight: 500;
    }

  }

}



.annotation-info {
  margin-bottom: 15px;
}

.annotation-info h3 {
  margin-bottom: 12px;
  color: #303133;
  font-weight: 500;
  font-size: 16px;
}

.annotation-section {
  margin-bottom: 15px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.annotation-section h4 {
  margin-bottom: 12px;
  color: #303133;
  font-weight: 500;
  padding-bottom: 6px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
  font-size: 14px;
}

.tag-input-section {
  margin-bottom: 10px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
  margin-top: 15px;
  border-top: 1px solid #e4e7ed;
}



.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
}
</style>