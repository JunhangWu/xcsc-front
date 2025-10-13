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
      <el-button type="primary" @click="getMaterialList" icon="Search">搜索</el-button>
    </div>

    <div class="folderBox" v-if="showFolder">
      <div class="folderItem" v-for="(item, index) in classify" :key="index" @click="selectFolder(item)">
        <el-icon>
          <FolderOpened />
        </el-icon>
        <div class="folderName">
          {{ item.name }}
        </div>
      </div>

    </div>

    <div class="card" v-else>
      <div class="pageTop">
        <div class="breadcrumbBox">
          <el-icon @click="backFolder" class="backBtn">
            <Back />
          </el-icon>
          <div class="breadcrumb">
            {{ breadcrumb }}
          </div>
        </div>
        <div class="btnList">
          <el-button type="primary" plain @click="addFolder">
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
          <div v-else-if="materialList.length == 0" class="empty-state">
            <el-empty description="暂无内容" />
          </div>
          <div v-else class="material-grid">
            <div class="subFolder" @click="subFolderClick(item)">
              <el-icon>
                <FolderOpened />
              </el-icon>
              <div class="subFolderName">文件夹名称1</div>
            </div>
            <div class="subFolder">
              <el-icon>
                <FolderOpened />
              </el-icon>
              <div class="subFolderName">文件夹名称2</div>
            </div>

            <div v-for="material in materialList" :key="material.id" class="material-item"
              @click="showMaterialDetail(material)">
              <div class="material-thumb">
                <img v-if="material.type.includes('image')" :src="material.url" :alt="material.name" />
                <el-icon v-else-if="material.type.includes('video')" class="file-icon">
                  <VideoPlay />
                </el-icon>
                <el-icon v-else class="file-icon">
                  <Document />
                </el-icon>
              </div>
              <div class="material-info">
                <div class="material-name">{{ material.name }}</div>
                <div class="material-meta">
                  <span class="meta-item">大小: {{ material.size }} KB</span>
                  <span class="meta-item">类型: {{ getFileTypeText(material.type) }}</span>
                  <span class="meta-item">上传时间: {{ material.uploadTime }}</span>
                </div>
                <div class="material-status">
                  <el-tag :type="getStatusTagType(material.status)" size="small">
                    {{ getStatusText(material.status) }}
                  </el-tag>
                </div>
                <div class="material-actions">
                  <el-button type="primary" size="small" @click.stop="showMaterialDetail(material)" icon="Edit">
                    {{ material.status === 'completed' ? '修改标注' : '标注' }}
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


  </div>
</template>

<script setup name="MaterialAnnotation">
import { ref, reactive, onMounted } from 'vue'
import { Search, VideoCamera, Document, Check, Edit, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFolderList } from "@/api/xcsc/uploadFile"
// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('')


// 素材列表
const loading = ref(false)
const materialList = ref([])
const showFolder = ref(true)
const curFolderName = ref('')
const breadcrumb = ref('')

//   '高速公路建设', '高速公路营运', '设计咨询', '地产酒店', '建筑施工','广告传媒', '服务区', '加油站', '金融资本', '物流运输', '资源板块',  '深化改革', '党的建设', '群团工作', '企业文化', '科技创新', '其他'
const classify = [
  { name: '高速公路建设', value: 'gsgljs' },
  { name: '高速公路营运', value: 'gsglyy' },
  { name: '设计咨询', value: 'sjzx' },
  { name: '地产酒店', value: 'dcjd' },
  { name: '建筑施工', value: 'jzsj' },
  { name: '广告传媒', value: 'ggcm' },
  { name: '服务区', value: 'fwq' },
  { name: '加油站', value: 'jyz' },
  { name: '金融资本', value: 'jrzb' },
  { name: '物流运输', value: 'wlys' },
  { name: '资源板块', value: 'zybk' },
  { name: '深化改革', value: 'shgg' },
  { name: '党的建设', value: 'djdj' },
  { name: '群团工作', value: 'qtgz' },
  { name: '企业文化', value: 'qywh' },
  { name: '科技创新', value: 'kjcj' },
  { name: '其他', value: 'qita' }
]

// 标注信息 - 标签信息（7个维度）
const autoTagForm = reactive({
  sceneCategory: [], // 场景分类
  coreObjects: '', // 核心物体
  activityEvent: '', // 活动事件
  textInfo: '', // 文本信息
  colorTone: [], // 颜色色调
  shootingAngle: '', // 拍摄角度
  materialDescription: '' // 素材描述
})

// 标注信息 - 基本信息（6个维度）
const manualTagForm = reactive({
  timeInfo: '', // 时间信息
  locationInfo: '', // 地点信息
  personNames: '', // 人物姓名
  buildingNames: '', // 建筑名称
  relatedThemes: '', // 相关主题
  properNouns: '' // 专有名词
})




const selectFolder = (item) => {
  console.log('====item==', item);
  breadcrumb.value = item.name
  curFolderName.value = item.name
  showFolder.value = false
}
const backFolder = () => {
  showFolder.value = true
  breadcrumb.value = ''
  curFolderName.value = ''
}

//新建文件夹
const addFolderDialogVisible = ref(false)
const folderName = ref('')
function handleAddFolderClose() {
  folderName.value = ''
  addFolderDialogVisible.value = false
}
function addFolder() {
  addFolderDialogVisible.value = true
}
function handleAddFolderConfirm() {
  addFolderDialogVisible.value = false
  let params = {
    folderName: folderName.value,
  }
  aaa(params).then(res => {
    console.log('res========', res)
  })
}
// 支持的文件格式
const supportedFormats = {
  image: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'flv'],
  document: ['docx', 'pdf', 'pptx']
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
  uploadDialogVisible.value = false
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

  // 如果是图片文件，尝试自动提取拍摄时间（仅对第一个图片文件）
  if (fileList.value.length > 0) {
    const firstImageFile = fileList.value.find(f => f.type?.includes('image'))
    if (firstImageFile) {
      try {
        extractExifDateTime(firstImageFile).then(dateTime => {
        }).catch(error => {
          console.warn('提取拍摄时间失败:', error);
        });
      } catch (error) {
        console.warn('提取拍摄时间失败:', error);
      }
    }
  }
}
// 检查文件格式是否支持
const isSupportedFormat = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  return Object.values(supportedFormats).flat().includes(ext)
}



//点击子文件展示相关文件夹及文件
function subFolderClick(item) {
  console.log('==item====', item);
}

// 获取文件类型文本
const getFileTypeText = (fileType) => {
  if (!fileType) return '未知类型';

  const typeMap = {
    'image': '图片',
    'video': '视频',
    'document': '文档',
    'audio': '音频',
    'pdf': 'PDF文档',
    'word': 'Word文档',
    'excel': 'Excel文档',
    'powerpoint': 'PPT文档'
  };

  for (const [type, text] of Object.entries(typeMap)) {
    if (fileType.includes(type)) {
      return text;
    }
  }

  return '其他';
};



// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'auto_annotating': 'info',
    'manual_review': 'primary',
    'completed': 'success'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待标注',
    'manual_review': '待审核',
    'completed': '已标注'
  }
  return textMap[status] || status
}



// 获取素材
function getMaterialList() {
  let params = {
    pid: 0,
  }
  getFolderList(params).then(res => {
    console.log('res========', res)
  })
}
getMaterialList()



// 显示素材详情
const showMaterialDetail = (material) => {
  // // 确保当前素材对象包含所有必要的字段
  // currentMaterial.value = {
  //   ...material,
  //   // 从全局素材数据中获取分辨率信息
  //   resolution: material.resolution || (() => {
  //     try {
  //       const globalMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')
  //       const originalMaterial = globalMaterials.find(m => m.id === material.id)
  //       return originalMaterial ? originalMaterial.resolution : '不适用'
  //     } catch (error) {
  //       return '不适用'
  //     }
  //   })()
  // }



  // // 检查素材是否已有存储的标注数据，如果有则加载
  // if (material.tags && material.tags.annotationData) {
  //   const annotationData = material.tags.annotationData

  //   // 加载标签信息
  //   if (annotationData.autoTags) {
  //     Object.assign(autoTagForm, annotationData.autoTags)
  //   }

  //   // 加载基本信息
  //   if (annotationData.manualTags) {
  //     Object.assign(manualTagForm, annotationData.manualTags)
  //   }

  //   // 加载补充标签
  //   if (annotationData.supplementTags) {
  //     supplementTags.value = [...annotationData.supplementTags]
  //   }
  // } else if (material.status === 'manual_review') {
  //   // 自动标注待审核状态
  //   autoTagForm.sceneCategory = ['meeting', 'office']
  //   autoTagForm.coreObjects = '椅子, 屏幕, 桌子, 投影仪'
  //   autoTagForm.activityEvent = '商务会议'
  //   autoTagForm.textInfo = '第三季度工作报告'
  //   autoTagForm.colorTone = ['white', 'blue', 'gray']
  //   autoTagForm.shootingAngle = 'front'
  //   autoTagForm.materialDescription = '会议室场景，多人正在进行会议讨论'
  // } else if (material.status === 'completed') {
  //   // 已完成标注状态
  //   autoTagForm.sceneCategory = ['office']
  //   autoTagForm.coreObjects = '文档, 图表'
  //   autoTagForm.activityEvent = '文档编辑'
  //   autoTagForm.textInfo = '财务数据汇总'
  //   autoTagForm.colorTone = ['white', 'gray']
  //   autoTagForm.shootingAngle = 'top'
  //   autoTagForm.materialDescription = '财务报告文档截图'

  //   manualTagForm.timeInfo = '2023-09-30 15:30:00'
  //   manualTagForm.locationInfo = '总部办公楼3楼财务室'
  //   manualTagForm.personNames = '张三, 李四'
  //   manualTagForm.buildingNames = '总部办公楼'
  //   manualTagForm.relatedThemes = '财务分析, 季度报告'
  //   manualTagForm.properNouns = '财务报表, 第三季度'

  //   supplementTags.value = ['重要文档', '季度汇总']
  // } else {
  //   // 其他状态重置表单
  //   resetTagForms()
  // }

  dialogVisible.value = true
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
      // background-color: #e5f3ff;
      // scale: 1.01;
      // transform: translateX(10px);
      scale: 1.05;
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
      line-height: 40px;
      margin: 0 0 0 20px;
      font-size: 20px;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        scale: 1.05;
        color: #409eff;
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
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}


// 网格视图样式
.material-grid {
  display: flex;
  margin-bottom: 20px;
}

.subFolder {
  margin: 10px;
  aspect-ratio: 1 / 1; // 保证正方形
  width: 10vw;
  height: 10vw;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  :deep(.el-icon) {
    font-size: 8vw;
    font-weight: 600;
    color: #ffd45e;
  }

  &:hover {
    scale: 1.05;
  }
}



.material-item {
  margin: 10px;
  position: relative;
  aspect-ratio: 1 / 1; // 保证正方形
  width: 10vw;
  height: 10vw;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.2s;
  cursor: pointer;
  display: block;
}

.material-thumb {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.material-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.material-thumb .file-icon {
  font-size: 48px;
  color: #909399;
}

.material-info {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  background: rgba(44, 62, 80, 0.55); // 半透明深色
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 18px 14px 14px 14px;
  opacity: 0;
  transition: opacity 0.25s;
  pointer-events: none;
}

.material-item:hover .material-info {
  opacity: 1;
  pointer-events: auto;
}

.material-name {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-meta {
  font-size: 13px;
  color: #e0e0e0;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.material-status {
  margin-bottom: 8px;
}

.material-actions {
  margin-top: 6px;
}

.material-item:hover .material-thumb img {
  transform: scale(1.05);
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

.material-thumb {
  height: 180px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.material-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.material-item:hover .material-thumb img {
  transform: scale(1.05);
}

.material-thumb .file-icon {
  font-size: 48px;
  color: #909399;
}

.material-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.material-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-meta {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  display: block;
  line-height: 1.6;
}

.material-status {
  margin-bottom: 16px;
}

.material-actions {
  margin-top: auto;
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