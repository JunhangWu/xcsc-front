<template>
  <div class="app-container">
    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <el-input v-model="searchKeyword" placeholder="请输入素材名称" style="width: 300px; margin-right: 10px;">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="标注状态" style="width: 150px; margin-right: 10px;">
        <el-option label="全部" value="" />
        <el-option label="待标注" value="0" />
        <el-option label="待审核" value="1" />
        <el-option label="已审核" value="2" />
      </el-select>
      <el-button type="primary" @click="getQueryData" icon="Search">搜索</el-button>
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

    <!-- 搜索结果展示区域 -->
    <div class="card" v-else-if="showSearchResults">
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
            <div v-for="material in queryfileListData" :key="material.id" class="material-item"
              @mouseenter="onSubFolderMouseEnter(material)" @mouseleave="onSubFolderMouseLeave(material)">
                <span class="subFolder-actions">
                  <el-icon class="action-icon" @click.stop="editFile(material)" title="重命名" v-show="material._hover" style="color: #409eff;">
                    <Edit />
                  </el-icon>
                  <el-icon class="action-icon" @click.stop="deleteFileinQuery(material)" title="删除" v-show="material._hover" style="color: #f56c6c;">
                    <Delete />
                  </el-icon>
                </span>
              <div class="material-thumb">
                <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath" :alt="material.fileName"
                  @click="previewImg(material)" />
                <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="previewVideo(material)">
                  <el-icon class="file-icon">
                    <VideoPlay />
                  </el-icon>
                  <img :src="material.coverPath" :alt="material.fileName"/>
                  <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                    style="max-width: 95%; max-height: 95%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                </div>
                <el-icon v-else class="file-icon" @click="downloadFile(material)" style="cursor:pointer;">
                  <Document />
                </el-icon>
              </div>
              
              <div class="material-details">
                <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
                <div class="file-status">
                  <el-tag :type="getStatusTagType(material.annotationStatus)" size="medium">
                    {{ getStatusText(material.annotationStatus) }}
                  </el-tag>
                </div>
                <!-- <div class="file-info">
                  <span class="file-size">大小: {{ formatFileSize(material.fileSize) }}</span>
                  <span class="file-type">类型: {{ getFileType(material.minioPath) }}</span>
                  <span class="upload-time">上传时间: {{ formatDate(material.createTime) }}</span>
                </div> -->
              </div>
              
              <div class="material-actions">
                <el-button type="primary" size="small" @click.stop="showMaterialDetail(material)" icon="Edit">
                  标注
                </el-button>
                <!-- <el-button type="danger" size="small" @click.stop="deleteFile(material)" icon="Delete" style="margin-left: 8px;">
                </el-button> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" v-else-if="!showSearchResults">
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
          <el-button type="primary" plain @click="handleAddFolder" size="default">
            <el-icon style="margin-right: 6px;">
              <FolderAdd />
            </el-icon>新建文件夹
          </el-button>
          <el-button type="primary" plain @click="uploadFile" size="default">
            <el-icon style="margin-right: 6px;">
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
                <el-icon class="action-icon" @click.stop="editFolder(item)" title="重命名" v-show="item._hover" v-hasPermi="['xcsc:FilePathMapping:edit']"
                  style="color: #409eff;">
                  <Edit />
                </el-icon>
                <el-icon class="action-icon" @click.stop="deleteFolder(item)" title="删除" v-show="item._hover"
                  style="color: #f56c6c;">
                  <Delete />
                </el-icon>
              </span>
              <el-icon @click="selectFolder(item)">
                <FolderOpened />
              </el-icon>
              <div class="subFolderName">{{ item.filePath }}</div>
            </div>
            <!-- 文件列表 -->
            <div v-for="material in fileListData" :key="material.id" class="material-item"
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
                <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath" :alt="material.fileName"
                  @click="previewImg(material)" />
                <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="previewVideo(material)">
                  <el-icon class="file-icon">
                    <VideoPlay />
                  </el-icon>
                  <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                    style="max-width: 95%; max-height: 95%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                  <img :src="material.coverPath" :alt="material.fileName"/>
                </div>
                <el-icon v-else class="file-icon" @click="downloadFile(material)" style="cursor:pointer;">
                  <Document />
                </el-icon>
              </div>
              
              <div class="material-details">
                <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
                <div class="file-status">
                  <!-- 待标注:0  AI标注:1  人工修改:2-->
                  <el-tag :type="getStatusTagType(material.annotationStatus)" size="medium">
                    {{ getStatusText(material.annotationStatus) }}
                  </el-tag>
                </div>
                <!-- <div class="file-info">
                  <span class="file-size">{{ formatFileSize(material.fileSize) }}</span>
                  <span class="file-type">类型: {{ getFileType(material.minioPath) }}</span>
                  <span class="upload-time">上传时间: {{ formatDate(material.createTime) }}</span>
                </div> -->
              </div>
              
              <div class="material-actions">
                <el-button type="primary" size="small" @click.stop="showMaterialDetail(material)" icon="Edit">
                  标注
                </el-button>
                <!-- <el-button type="danger" size="small" @click.stop="deleteFile(material)" icon="Delete" style="margin-left: 8px;">
                </el-button> -->
              </div>

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

    <!-- 上传文件 -->
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="50vw" :before-close="cancelUpload"
      :close-on-click-modal="false" style="margin-top: 20vh;">
      <el-upload v-model:file-list="fileList" class="upload-demo" drag :multiple="uploadType === 'file'" action=""
        :on-change="handleFileChange" :on-remove="handleFileRemove" :auto-upload="false">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          {{ uploadType === 'file' ? '点击或拖拽文件到此处上传' : '点击或拖拽文件夹到此处上传' }}
          <div class="el-upload__tip"> 支持图片：jpeg / jpg / png / bmp / gif；视频：mp4 / mov / avi / mkv / flv / m4v；文档：docx /
            pdf / pptx
            <br>单个文件大小不超过2048MB，总文件大小不超过5120MB
          </div>
        </div>
      </el-upload>
        
        <!-- 上传进度条 -->
        <div v-if="showProgress" class="upload-progress-container" style="margin-top: 20px;">
          <el-progress 
            :percentage="uploadProgress" 
            :status="uploadProgress === 100 ? 'success' : 'primary'"
            :stroke-width="16"
            :text-inside="true"
          ></el-progress>
          <div class="progress-text" style="margin-top: 8px; text-align: center; color: #606266;">
            <!-- 正在上传中，请稍候... -->
            {{ uploadProgress === 100? `处理中，请稍等...` : '正在上传中，请稍候...' }}
          </div>
        </div>
        
      <template #footer>
        <div class="dialogFoot">
          <el-button @click="cancelUpload" :disabled="isUploading">取消</el-button>
          <el-button type="primary" @click="confirmUpload" :disabled="isConfirmDisabled || isUploading" :loading="isUploading">
            {{ isUploading ? '上传中...' : '确认' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 素材标注弹框 -->
    <MarkDialog ref="markDialogRef" @updateFileList="getFolderData(curFolderObj.bizId)"></MarkDialog>
  </div>
</template>

<!-- <script setup name="MaterialAnnotation"> -->
<script setup name="Annotation">

const { proxy } = getCurrentInstance();
import { ref, reactive, onMounted, computed } from 'vue'
import { api as viewerApi } from "v-viewer";
import { parseTime, } from '@/utils/common'
import { Search, VideoCamera, Document, Check, Edit, VideoPlay, Back, ArrowRight, FolderAdd, FolderOpened, Upload, UploadFilled, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFolderList, addFolder, updateFolder, delFolder, uploadFiles, getFileList, delFile, updateFile } from "@/api/xcsc/uploadFile"
import MarkDialog from './components/markDialog.vue'
import download from '../../../plugins/download';
// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('')
const showSearchResults = ref(false) // 控制是否显示搜索结果

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
// 返回按钮
const backFolder = () => {

  if (breadcrumbData.value.length == 1) {
    showFolder.value = true
    getFolderData(0)
    Object.assign(curFolderObj, {
      filePath: '',
      bizId: 0,
      id: 0
    });
    // return
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
  console.log('===返回后的curFolderObj===', curFolderObj);
  console.log('===breadcrumbData.value===', breadcrumbData.value);
}

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
  })
  if (pid !== 0) {
    let param = {
      folderId: pid,
    }
    console.log('===params===', params);
    getFileList(param).then(res => {
      fileListData.value = res.data
      console.log('===fileListData.value===', fileListData.value);
    })
  }
}
getFolderData(0)

// 获取文件列表数据
const queryfileListData = ref([])//文件列表
function getQueryData() {
  // loading.value = true
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


//新建文件夹
const handleFolderType = ref('add') // add edit edit_file
const addFolderDialogVisible = ref(false)
const folderName = ref('')
// 编辑文件名
const editFileName = ref('')
const editFileObj = reactive({})

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
      fileExists = fileListData.value.some(file => 
        file.fileName === editFileName.value.trim() && file.id !== editFileObj.id
      )
    // }
    
    if (fileExists) {
      ElMessage.error('当前目录下已存在同名文件，请更换名称！')
      addFolderDialogVisible.value = true // 保持对话框打开
      return
    }
    
    const params = {
      id: editFileObj.id,
      fileName: editFileName.value.trim()
    }
    
    updateFile(params).then(res => {
      ElMessage.success('文件名修改成功')
      editFileName.value = ''
      // 刷新文件列表
      if (showSearchResults.value) {
        getQueryData()
      } else {
        getFolderData(curFolderObj.bizId)
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
    const folderExists = folderData.value.some(folder => folder.filePath === folderName.value.trim())
    if (folderExists) {
      ElMessage.error('当前目录下已存在同名文件夹，请更换名称！')
      addFolderDialogVisible.value = true // 保持对话框打开
      return
    }
    
    params.pid = curFolderObj.bizId
    addFolder(params).then(res => {
      ElMessage.success('新增成功')
      folderName.value = ''
      getFolderData(curFolderObj.bizId)
    })
  } else if (handleFolderType.value == 'edit') {
    // 检查当前目录下是否已存在同名文件夹
    const folderExists = folderData.value.some(folder => 
      folder.filePath === folderName.value.trim() && folder.id !== editOrDeleteFolderObj.id
    )
    if (folderExists) {
      ElMessage.error('当前目录下已存在同名文件夹，请更换名称！')
      addFolderDialogVisible.value = true // 保持对话框打开
      return
    }
    
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
// 编辑文件
function editFile(item) {
  addFolderDialogVisible.value = true
  handleFolderType.value = 'edit_file'
  editFileObj.id = item.id
  editFileObj.minioPath = item.minioPath
  // 从minioPath中提取文件名
  const fileName = item.fileName
  editFileName.value = fileName
}
//  删除文件夹
function deleteFolder(item) {
  proxy.$modal.confirm('是否确认删除文件夹名称为"' + item.filePath + '"的数据项?').then(function () {
    return delFolder(item.bizId);
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
const isConfirmDisabled = ref(false);// 确认按钮是否禁用
const isUploading = ref(false); // 上传中状态
const uploadProgress = ref(0); // 上传进度（0-100）
const showProgress = ref(false); // 是否显示进度条
function uploadFile() {
  fileList.value = []
  uploadDialogVisible.value = true
}
function cancelUpload() {
  fileList.value = []
  uploadDialogVisible.value = false
  uploadProgress.value = 0
  showProgress.value = false
}
function confirmUpload() {
  // 再次检查所有文件总大小不超过5120MB
  const totalSize = fileList.value.reduce((sum, f) => sum + ((f.raw || f.originFileObj || f).size || 0), 0);
  const maxTotalSize = 5120 * 1024 * 1024; // 500MB
  if (totalSize > maxTotalSize) {
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    ElMessage.error(`所有文件总大小（${totalSizeMB}MB）超过限制（5120MB）`);
    return;
  }
  
  // 设置上传中状态
  isUploading.value = true;
  uploadProgress.value = 0;
  showProgress.value = true;
  
  let formData = new FormData();
  // files 是多个文件的数组集合，用于上传的文件流
  let files = fileList.value.map(item => item.raw || item.originFileObj || item); // 兼容不同上传组件的文件对象
  files.forEach((file, index) => {
    formData.append("files", file);
    formData.append("eventTimes", parseTime(file.lastModifiedDate) || '');
  });
  let folderPath = ''
  formData.append("folderId", curFolderObj.bizId);
  breadcrumbData.value.forEach((item, idx) => {
    folderPath += item.filePath
    if (idx !== breadcrumbData.value.length - 1) {
      folderPath += '/'  
    }
  })
  formData.append("folderPath", folderPath);
  
  // 配置上传进度监听
  const config = {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        uploadProgress.value = percentCompleted;
      }
    }
  };
  
  uploadFiles(formData, config).then(res => {
    // 完成上传，进度设为100%
    uploadProgress.value = 100;
    
    // 延迟显示成功消息，让用户看到100%的进度
    setTimeout(() => {
      ElMessage.success(`上传成功！`)
      getFolderData(curFolderObj.bizId)
    }, 300);
  }).finally(() => {
    // 无论成功失败，都重置上传状态
    setTimeout(() => {
      isUploading.value = false;
      uploadDialogVisible.value = false;
      fileList.value = [];
      uploadProgress.value = 0;
      showProgress.value = false;
    }, 700);
  })
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
// 获取文件名
function getFileName(path) {
  if (!path) return '';
  const idx = path.lastIndexOf('/');
  return idx !== -1 ? path.substring(idx + 1) : path;
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes) return '未知';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 获取文件类型
function getFileType(path) {
  if (!path) return '未知';
  const idx = path.lastIndexOf('.');
  return idx !== -1 ? path.substring(idx + 1).toUpperCase() : '未知';
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '未知';
  const date = new Date(dateStr);
  return date.getFullYear() + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + String(date.getDate()).padStart(2, '0');
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
  const maxSize = 2048 * 1024 * 1024 // 2048MB
  if (file.size > maxSize) {
    ElMessage.error(`文件 ${file.name} 大小超过限制（2048MB）`)
    return false
  }
  // 校验同名
  const fileName = file.name;
  const existNames = fileListData.value.map(item => {
    const path = item.minioPath || '';
    const idx = path.lastIndexOf('/');
    return idx !== -1 ? path.substring(idx + 1) : path;
  });
  if (existNames.includes(fileName)) {
    ElMessage.error(`已存在同名文件：${fileName}，请勿重复上传！`);
    return false;
  }
  return true
}
// 文件变化处理
const handleFileChange = (file, fileList) => {
  console.log('==file====', file);
  isConfirmDisabled.value = true;
  let hasUploadError = false; // 标记是否存在不可上传的错误
  // 实时显示文件校验状态
  fileList.forEach(f => {
    f.status = isSupportedFormat(f.name) ? 'success' : 'error'
  })
  // 检查单个文件大小
  const maxSize = 2048 * 1024 * 1024 // 2048MB
  if (file.size > maxSize) {
    ElMessage.error(`文件 ${file.name} 大小超过限制（2048MB）`)
    hasUploadError = true;
    return false
  }
  
  // 检查所有文件总大小不超过5120MB
  const totalSize = fileList.reduce((sum, f) => sum + (f.size || 0), 0);
  const maxTotalSize = 5120 * 1024 * 1024; // 500MB
  if (totalSize > maxTotalSize) {
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    ElMessage.error(`所有文件总大小（${totalSizeMB}MB）超过限制（5120MB）`)
    hasUploadError = true;
    return false
  }
  // 检查文件格式
  const invalidFiles = fileList.filter(f => !isSupportedFormat(f.name))
  if (invalidFiles.length > 0) {
    ElMessage.error(`素材格式不符合，请上传支持的文件格式`)
    hasUploadError = true;
    // 移除不支持格式的文件
    fileList.value = fileList.filter(f => isSupportedFormat(f.name))
    return
  }
  // 检查上传列表中是否存在相同文件名的文件
  const fileNames = fileList.map(f => f.name);
  const duplicateNamesInList = fileNames.filter((name, index) => fileNames.indexOf(name) !== index);
  const uniqueDuplicateNames = [...new Set(duplicateNamesInList)];

  if (uniqueDuplicateNames.length > 0) {
    ElMessage.error(`上传列表中存在重复文件：${uniqueDuplicateNames.join('、')}，请移除重复文件！`);
    hasUploadError = true;
    // 移除重复文件，只保留每个文件名的第一个实例
    const uniqueFiles = [];
    const seenNames = new Set();
    for (const f of fileList) {
      if (!seenNames.has(f.name)) {
        seenNames.add(f.name);
        uniqueFiles.push(f);
      }
    }
    fileList.value = uniqueFiles;
  }

  // 校验同名（与已存在的文件）
  const fileName = file.name;
  const existNames = fileListData.value.map(item => {
    const path = item.minioPath || '';
    const idx = path.lastIndexOf('/');
    return idx !== -1 ? path.substring(idx + 1) : path;
  });

  // 删除 fileList.value 中与已存在文件同名的文件，并提示
  const duplicateFiles = fileList.filter(f => existNames.includes(f.name));
  if (duplicateFiles.length > 0) {
    ElMessage.error(`已存在同名文件：${duplicateFiles.map(f => f.name).join('、')}，请勿重复上传！`);
    hasUploadError = true;
    fileList.value = fileList.filter(f => !existNames.includes(f.name));
  }

  isConfirmDisabled.value = hasUploadError || fileList.length === 0;

  // 对于图片文件，获取分辨率
  // if (file.raw && file.raw.type == "image/png") {
  //   // 使用同步方式获取分辨率
  //   try {
  //     const tempUrl = URL.createObjectURL(file.raw);
  //     const img = new Image();
  //     const getResolution = new Promise((resolve, reject) => {
  //       img.onload = function () {
  //         URL.revokeObjectURL(tempUrl); // 释放临时URL
  //         resolve(`${img.width}x${img.height}`);
  //       };
  //       img.onerror = function () {
  //         URL.revokeObjectURL(tempUrl); // 释放临时URL
  //         reject(new Error('图片加载失败，无法获取分辨率'));
  //       };
  //       img.src = tempUrl;
  //     });
  //     // 立即获取分辨率（同步获取）
  //     getResolution.then(res => {
  //       const resolution = res;
  //       console.log('成功获取图片分辨率:', resolution);
  //     }).catch(err => {
  //       console.warn(err.message);
  //     });
  //   } catch (error) {
  //     console.warn('获取分辨率时出错:', error);
  //   }
  // }
}

// 处理文件移除
function handleFileRemove(file, fileList) {
  // 在文件被移除后调用handleFileChange逻辑进行验证
  handleFileChange(file, fileList);
}

// 删除文件
function deleteFile(item) {
  proxy.$modal.confirm('是否确认删除文件名为"' + item.fileName + '"的文件?').then(function () {
    return delFile(item.id);
  }).then(() => {
    getFolderData(curFolderObj.bizId)
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}
// 搜索结果中删除文件
function deleteFileinQuery(item) {
  proxy.$modal.confirm('是否确认删除文件名为"' + item.fileName + '"的文件?').then(function () {
    return delFile(item.id);
  }).then(() => {
    getQueryData()
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
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
    '1': '待审核',
    '2': '已审核'
  }
  return textMap[status] || status
}

//预览图片
function previewImg(material) {
  const $viewer = viewerApi({
    options: {
      toolbar: true,
      initialViewIndex: 0,
      title: (image) => `${material.fileName}`,
    },
    images: [material.minioPath],
  });
}

//预览视频
const videoDialogVisible = ref(false)
const videoFilePath = ref('')
const videoDialogTitle = ref('')
function previewVideo(material) {
  videoDialogVisible.value = true
  videoFilePath.value = material.minioPath
  videoDialogTitle.value = material.fileName
}

//下载文件
function downloadFile(material) {
  if (material && material.minioPath) {
    window.open(material.minioPath, '_blank');
  }
}

// 重置搜索，返回文件夹视图
function resetSearch() {
  showSearchResults.value = false
  if(curFolderObj.bizId == 0){
    showFolder.value = true // 确保显示文件夹视图
  }
  
  searchKeyword.value = ''
  statusFilter.value = ''
  // breadcrumbData.value = [] // 清空面包屑数据
  // Object.assign(curFolderObj, {
  //   filePath: '',
  //   bizId: '',
  //   id: ''
  // }) // 重置当前文件夹对象
  console.log("==curFolderObj==",curFolderObj)
  getFolderData(curFolderObj.bizId) // 获取根文件夹数据
}

// 显示素材详情
const markDialogRef = ref(null)
function showMaterialDetail(material) {
  // 打开 MarkDialog 弹框
  markDialogRef.value.open(material)
}


</script>

<style scoped lang="scss">
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

.folderBox {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 18px;
  // flex-wrap: wrap;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-top: 16px;

  .folderItem {
    margin: 8px;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 250px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    transition: all 0.3s ease;
    border: 1px solid transparent;

    :deep(.el-icon) {
      font-size: 120px;
      font-weight: 500;
      color: #ffd45e;
      margin-bottom: 8px;
    }

    .folderName {
      text-align: center;
      font-size: 15px;
      color: #303133;
      padding: 0 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    &:hover {
      background-color: #ecf5ff;
      border-color: #c6e2ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

.pageTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e4e7ed;
  margin-top: 16px;

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

  .btnList {
    display: flex;
    gap: 12px;
  }
}

.search-filter {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 6px;
    transition: all 0.3s ease;
  }
}

.search-result-info {
  margin-left: 20px;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.card-body {
  background: #ffffff;
  border-radius: 0 0 8px 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-height: 400px;
}

.material-grid {
  // display: flex;
  // flex-wrap: wrap;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
  gap: 18px;
}

.subFolder {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  height: 255px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  background: #fafafa;

  :deep(.el-icon) {
    font-size: 120px;
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
    // flex: 2;
    width: 100%;
    height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #f5f7fa;
    // position: relative;

    img {
      width: 95%;
      height: 95%;
      // object-fit: cover;
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

      video {
        width: 100%;
        height: 100%;
        // object-fit: contain;
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

    .file-icon {
      font-size: 64px;
      color: #909399;
    }
  }

  .material-details {
      // flex: 1;
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

  .file-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: #909399;
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

/* 对话框样式优化 */
.dialogFoot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 统一按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

/* 统一标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
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
<style>
/* 图片预览防止被弹框遮盖 */
.viewer-container {
  z-index: 9999 !important;
}
</style>
