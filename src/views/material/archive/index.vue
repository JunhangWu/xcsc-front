<template>
  <div class="app-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">素材归档管理</div>
      </div>
      <div class="card-body">
        <!-- 上传区域 -->
        <div class="upload-area">
          <el-upload
            v-model:file-list="fileList"
            class="upload-demo"
            drag
            multiple
            action=""
            :on-change="handleFileChange"
            :before-upload="handleBeforeUpload"
            :auto-upload="false"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">点击或拖拽文件到此处上传</div>
            <div class="el-upload__tip" slot="tip">
              支持图片：JPEG/JPG/PNG/BMP/GIF；视频：MP4/MOV/AVI/MKV/FLV；文档：DOCX/PDF/PPTX
            </div>
          </el-upload>
          
          <el-button type="primary" @click="openUploadDialog" class="upload-btn" :disabled="uploadProgress > 0">{{ uploadProgress > 0 ? '上传中...' : '开始上传' }}</el-button>
        </div>
        
        <!-- 上传表单对话框 -->
        <el-dialog
          v-model="uploadDialogVisible"
          :title="uploadDialogTitle"
          width="800px"
          :before-close="handleDialogClose"
        >
          <div class="dialog-container">
            <div class="preview-pane">
              <el-image
                v-if="previewUrl"
                :src="previewUrl"
                fit="contain"
                class="image-preview"
              />
              <div v-else class="preview-placeholder">
                <el-icon><Picture /></el-icon>
                <span>选择文件后显示预览</span>
              </div>
            </div>
            <el-form
              ref="uploadFormRef"
              :model="uploadForm"
              :rules="uploadFormRules"
              label-width="100px"
              class="form-pane"
            >
            <el-form-item label="拍摄时间" prop="shootTime">
              <el-date-picker
                v-model="uploadForm.shootTime"
                type="datetime"
                placeholder="请选择拍摄时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="拍摄地点" prop="shootLocation">
              <el-input
                v-model="uploadForm.shootLocation"
                placeholder="请输入拍摄地点或来源"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="上传人" prop="uploader">
              <el-input
                v-model="uploadForm.uploader"
                placeholder="当前登录用户"
                disabled
              />
            </el-form-item>
            
            <el-form-item label="AI分类推荐" prop="aiCategories">
              <el-select
                v-model="uploadForm.aiCategories"
                multiple
                placeholder="AI自动推荐分类"
                style="width: 100%"
              >
                <el-option
                  v-for="category in aiRecommendedCategories"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
              <div class="form-tip">AI基于素材内容推荐1-3个匹配分类</div>
            </el-form-item>
            
            <!-- AI自动标注功能已移除 -->
          </el-form>
        </div>
          
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="handleDialogClose">取消</el-button>
              <el-button type="primary" @click="submitUploadForm">确认上传</el-button>
            </div>
          </template>
        </el-dialog>

        <!-- 上传进度 -->
        <div v-if="uploadProgress > 0" class="upload-progress">
          <el-progress :percentage="uploadProgress" status="primary" />
          <span class="progress-text">{{ uploadStatusText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="MaterialArchive">
import { ref, onMounted, reactive } from 'vue'
import { UploadFilled, VideoCamera, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import EXIF from 'exif-js'

// 创建router实例
const router = useRouter()
console.log('Router instance created:', router)

// 文件列表
const fileList = ref([])
// 上传进度
const uploadProgress = ref(0)
// 上传状态文本
const uploadStatusText = ref('')

// 上传对话框相关
const uploadDialogVisible = ref(false)
const uploadFormRef = ref(null)
const uploadDialogTitle = ref('素材上传信息填写')

// 上传表单数据
const uploadForm = reactive({
  shootTime: '',
  shootLocation: '',
  uploader: '当前登录用户', // 默认当前登录用户
  aiCategories: []
})

// 图片预览URL
const previewUrl = ref('')

// 表单验证规则
const uploadFormRules = {
  shootTime: [
    { required: false, message: '请选择拍摄时间', trigger: ['blur', 'change'] }
  ],
  shootLocation: [
    { required: false, message: '请输入拍摄地点', trigger: 'blur' }
  ],
  aiCategories: [
    { required: true, message: '请选择至少一个分类', trigger: 'change' }
  ]
}

// AI推荐分类（与首页板块分类保持一致）
const aiRecommendedCategories =[
  '高速公路建设', '高速公路营运', '设计咨询', '地产酒店', '建筑施工',
  '广告传媒', '服务区', '加油站', '金融资本', '物流运输', '资源板块',
  '深化改革', '党的建设', '群团工作', '企业文化', '科技创新', '其他'
]


// AI推荐标签功能已移除

// 支持的文件格式
const supportedFormats = {
  image: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'flv'],
  document: ['docx', 'pdf', 'pptx']
}

// 从图片文件中提取真实的拍摄时间（使用EXIF.js库）
const extractExifDateTime = (file) => {
  return new Promise((resolve, reject) => {
    try {
      // 1. 首先尝试使用EXIF.js读取图片的真实拍摄时间
      EXIF.getData(file, function() {
        // 获取原始EXIF日期字符串
        const exifDateStr = EXIF.getTag(this, 'DateTimeOriginal') || 
                           EXIF.getTag(this, 'DateTime') || 
                           EXIF.getTag(this, 'DateTimeDigitized');
        
        if (exifDateStr) {
          // EXIF日期格式通常为："YYYY:MM:DD HH:mm:ss"
          // 将格式转换为我们需要的："YYYY-MM-DD HH:mm:ss"
          const formattedDate = exifDateStr.replace(/:/g, '-').replace(' ', 'T');
          const date = new Date(formattedDate);
          
          if (!isNaN(date.getTime())) {
            // 日期有效，返回格式化后的字符串
            return resolve(date.toISOString().replace('T', ' ').substring(0, 19));
          }
        }
        
        // 2. 如果没有EXIF数据或日期无效，尝试从文件名中提取日期信息
        const dateFromName = /(\d{4})(\d{2})(\d{2})[_-](\d{2})(\d{2})/.exec(file.name);
        if (dateFromName) {
          const [, year, month, day, hour, minute] = dateFromName;
          return resolve(`${year}-${month}-${day} ${hour}:${minute}:00`);
        }
        
        // 3. 检查文件名是否包含其他日期格式
        const altDateFromName = /(\d{4})[-/](\d{2})[-/](\d{2})\s+(\d{2})[:](\d{2})/.exec(file.name);
        if (altDateFromName) {
          const [, year, month, day, hour, minute] = altDateFromName;
          return resolve(`${year}-${month}-${day} ${hour}:${minute}:00`);
        }
        
        // 4. 如果都没有识别到拍摄时间，返回空字符串
        resolve('');
      });
    } catch (error) {
      console.warn('读取EXIF数据时发生错误:', error);
      // 出错时，默认返回文件名提取或当前时间
      const dateFromName = /(\d{4})(\d{2})(\d{2})[_-](\d{2})(\d{2})/.exec(file.name);
      if (dateFromName) {
        const [, year, month, day, hour, minute] = dateFromName;
        resolve(`${year}-${month}-${day} ${hour}:${minute}:00`);
      } else {
        // 出错且未从文件名提取到时间，返回空字符串
        resolve('');
      }
    }
  });
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
  
  // 如果是图片文件，尝试自动提取拍摄时间
  if (fileList.value.length > 0 && fileList.value[0].type?.includes('image')) {
    try {
      // 由于extractExifDateTime现在是异步函数，需要使用await
      extractExifDateTime(fileList.value[0]).then(dateTime => {
        uploadForm.shootTime = dateTime;
      }).catch(error => {
        console.warn('提取拍摄时间失败:', error);
      });
    } catch (error) {
      console.warn('提取拍摄时间失败:', error);
    }
  }
}

// 上传前检查
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

// 打开上传对话框
const openUploadDialog = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }

  // 检查文件格式
  const invalidFiles = fileList.value.filter(file => !isSupportedFormat(file.name))
  if (invalidFiles.length > 0) {
    ElMessage.error(`素材格式不符合，请上传支持的文件格式`)
    return
  }

  // 重置表单
  resetUploadForm()

  // 模拟AI推荐（基于文件名）
  simulateAIRecommendation()

  // 设置预览图
  previewUrl.value = fileList.value[0]?.type?.includes('image') 
    ? URL.createObjectURL(fileList.value[0].raw) 
    : ''

  // 打开对话框
  uploadDialogVisible.value = true
}

// 检查文件格式是否支持
const isSupportedFormat = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  return Object.values(supportedFormats).flat().includes(ext)
}

// 重置上传表单
const resetUploadForm = () => {
  uploadForm.shootTime = ''
  uploadForm.shootLocation = ''
  uploadForm.aiCategories = []
  
  // 初始化上传人为当前登录用户（这里使用示例用户名）
  uploadForm.uploader = '当前登录用户'
}

// 模拟AI推荐（基于文件名分析，仅保留分类推荐）
const simulateAIRecommendation = () => {
  const filename = fileList.value[0]?.name || ''
  
  // 基于文件名推荐分类
  if (filename.includes('广场') || filename.includes('地产')) {
    uploadForm.aiCategories = ['地产酒店']
  } else if (filename.includes('产品') || filename.includes('科技')) {
    uploadForm.aiCategories = ['科技创新']
  } else if (filename.includes('报告') || filename.includes('金融')) {
    uploadForm.aiCategories = ['金融资本']
  } else if (filename.includes('项目') || filename.includes('建筑')) {
    uploadForm.aiCategories = ['建筑施工']
  } else {
    uploadForm.aiCategories = ['企业文化']
  }
}

// 对话框关闭处理
const handleDialogClose = (done) => {
  ElMessageBox.confirm('确定要取消上传吗？未保存的信息将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    uploadDialogVisible.value = false
    if (done) done()
  }).catch(() => {})
}

// 提交上传表单
const submitUploadForm = () => {
  if (!uploadFormRef.value) return
  
  uploadFormRef.value.validate((valid) => {
    if (valid) {
      // 表单验证通过，开始上传
      startUpload()
    } else {
      ElMessage.error('请完善必填信息')
      return false
    }
  })
}

// 开始上传
const startUpload = () => {
  // 禁用上传按钮
  uploadStatusText.value = '准备上传中...'
  // 模拟上传进度
  uploadProgress.value = 0
  uploadStatusText.value = '准备上传...'
  
  const interval = setInterval(() => {
    uploadProgress.value += 10
    uploadStatusText.value = `上传中... ${uploadProgress.value}%`
    
    if (uploadProgress.value >= 100) {
      clearInterval(interval)
      uploadStatusText.value = '上传完成'
      uploadDialogVisible.value = false
      ElMessage.success(`成功上传${fileList.value.length}个素材至【${uploadForm.aiCategories.join('、')}】分类`)
      
      // 添加到素材列表并同步到首页
      const newMaterials = []
      fileList.value.forEach(file => {
        const newMaterial = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: getFileType(file.name),
          thumbnail: file.type === 'image' ? URL.createObjectURL(file.raw) : '',
          url: URL.createObjectURL(file.raw),
          size: file.size,
          uploadTime: new Date().toLocaleDateString().replace(/\//g, '/'), // 格式化为 YYYY/MM/DD
          category: uploadForm.aiCategories[0], // 使用第一个分类
          tags: [], // 不再使用AI自动标注功能
          shootTime: uploadForm.shootTime,
          shootLocation: uploadForm.shootLocation,
          uploader: uploadForm.uploader
        }
        newMaterials.push(newMaterial)
      })
      
      // 保存到本地存储并同步到首页
      try {
        // 使用 localStorage 实现持久存储
        // 2. 保存到全局素材库用于首页显示
        // 获取现有全局素材数据
        const globalMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')
        // 合并新素材并去重
        newMaterials.forEach(material => {
          if (!globalMaterials.some(m => m.id === material.id)) {
            globalMaterials.push(material)
          }
        })
        // 保存更新后的全局素材数据
        localStorage.setItem('globalMaterials', JSON.stringify(globalMaterials))
        
        // 3. 按分类组织素材数据
        const categorizedMaterials = JSON.parse(localStorage.getItem('categorizedMaterials') || '{}')
        newMaterials.forEach(material => {
          const category = material.category
          if (!categorizedMaterials[category]) {
            categorizedMaterials[category] = []
          }
          // 避免重复添加
          if (!categorizedMaterials[category].some(m => m.id === material.id)) {
            categorizedMaterials[category].push(material)
          }
        })
        // 保存按分类组织的数据
        localStorage.setItem('categorizedMaterials', JSON.stringify(categorizedMaterials))
        
        // 4. 设置同步标记
        localStorage.setItem('materialsNeedSync', 'true')
        
        // 上传成功后延迟2秒自动跳转到首页，让用户有时间看到成功提示
        console.log('准备延迟跳转到首页')
        setTimeout(() => {
          console.log('执行跳转到首页')
          try {
            router.push('/')
            console.log('跳转命令已执行')
          } catch (error) {
            console.error('跳转失败:', error)
          }
        }, 2000)
      } catch (error) {
        console.error('保存素材数据失败:', error)
      }
      
      // 关闭对话框并重置状态
      uploadDialogVisible.value = false
      uploadStatusText.value = ''
      fileList.value = []
      
      // 清空文件列表并重置表单
      fileList.value = []
      uploadFormRef.value?.resetFields()
      
      setTimeout(() => {
        uploadProgress.value = 0
        uploadStatusText.value = ''
      }, 2000)
    }
  }, 200)
}



</script>

<style scoped lang="scss">
.upload-area {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
  .upload-btn {
    align-self: flex-start;
    margin-top: 20px;
  }
}

.upload-progress {
  margin-bottom: 30px;
  .progress-text {
    display: block;
    margin-top: 10px;
    text-align: center;
    color: #606266;
  }
}

.dialog-footer {
  text-align: right;
  padding: 20px 0 0;
}

.dialog-container {
  display: flex;
  gap: 30px;

  .preview-pane {
    flex: 1;
    min-width: 300px;
    border-right: 1px solid #ebeef5;
    padding-right: 30px;

    .image-preview {
      width: 100%;
      height: 400px;
      border-radius: 4px;
    }

    .preview-placeholder {
      height: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;

      .el-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
    }
  }

  .form-pane {
    flex: 1;
    min-width: 350px;
  }
}

.el-form-item {
  margin-bottom: 20px;
}

.el-select {
  width: 100%;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>