<template>
  <div class="app-container">
    <div class="card">
      <div class="card-header"></div>
      <div class="card-body">
        <!-- 上传区域 -->
        <div class="upload-area">
          <el-upload v-model:file-list="fileList" class="upload-demo" drag :multiple="uploadType === 'file'"
            :directory="uploadType === 'folder'" action="" :on-change="handleFileChange"
            :before-upload="handleBeforeUpload" :auto-upload="false">
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              {{ uploadType === 'file' ? '点击或拖拽文件到此处上传' : '点击或拖拽文件夹到此处上传' }}
              <div class="el-upload__tip"> 支持图片：jpeg / jpg / png / bmp / gif；视频：mp4 / mov / avi / mkv / flv；文档：docx /
                pdf / pptx
              </div>
            </div>
          </el-upload>

          <div class="formBox">
            <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadFormRules" label-width="auto"
              style="width: 600px;">
              <el-form-item label="AI分类" prop="aiCategories">
                <el-select v-model="uploadForm.aiCategories" placeholder="AI自动分类">
                  <el-option v-for="category in aiRecommendedCategories" :key="category.value" :label="category.name"
                    :value="category.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="文件路径" prop="dynamicPath">
                <el-select v-model="uploadForm.dynamicPath" filterable allow-create default-first-option
                  :reserve-keyword="false" placeholder="请选择或输入文件路径, 子文件夹用 ‘ / ’ 隔开。">
                  <el-option v-for="item in pathOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>

              <el-form-item label="上传人" prop="uploader">
                <el-input v-model="uploadForm.uploader" placeholder="当前登录用户" disabled />
              </el-form-item>
            </el-form>

            <el-button type="primary" @click="submitUploadForm" class="upload-btn" :disabled="uploadProgress > 0">{{
              uploadProgress > 0 ? '上传中...' : '开始上传' }}</el-button>
          </div>
        </div>


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
import { addFolder } from "@/api/xcsc/uploadFile"


import EXIF from 'exif-js'
// 创建router实例
const router = useRouter()
console.log('Router instance created:', router)

// 上传类型
const uploadType = ref('file')
// 文件列表
const fileList = ref([])
// 上传进度
const uploadProgress = ref(0)
// 上传状态文本
const uploadStatusText = ref('')

// 上传对话框相关
const uploadFormRef = ref(null)

// 上传表单数据
const uploadForm = reactive({
  uploader: 'admin', // 默认当前登录用户
  aiCategories: '', //AI分类
  dynamicPath: '',  //文件路径
})



// 表单验证规则
const uploadFormRules = {
  aiCategories: [
    { required: true, message: '请选择至少一个分类', trigger: ['change', 'blur'] }
  ],
  dynamicPath: [
    { required: true, message: '请选择或输入文件路径', trigger: ['change', 'blur'] },
    { max: 100, message: '文件名长度不能超过100个字符', trigger: 'blur' }
  ],
}

// AI推荐分类（与首页板块分类保持一致）
const aiRecommendedCategories = [
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
  { name: '其他', value: 'qita' }]


// 支持的文件格式
const supportedFormats = {
  image: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'flv'],
  document: ['docx', 'pdf', 'pptx']
}

// 根据文件扩展名获取文件类型
const getFileType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  if (supportedFormats.image.includes(ext)) {
    return 'image'
  } else if (supportedFormats.video.includes(ext)) {
    return 'video'
  } else if (supportedFormats.document.includes(ext)) {
    return 'document'
  } else {
    return 'other'
  }
}

// 从图片文件中提取真实的拍摄时间（使用EXIF.js库）
const extractExifDateTime = (file) => {
  return new Promise((resolve, reject) => {
    try {
      // 1. 首先尝试使用EXIF.js读取图片的真实拍摄时间
      EXIF.getData(file, function () {
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
  // 模拟AI推荐（基于文件名）
  simulateAIRecommendation()
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


}

// 检查文件格式是否支持
const isSupportedFormat = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  return Object.values(supportedFormats).flat().includes(ext)
}

// 处理图片预览错误
const handlePreviewError = (err) => {
  console.warn('图片预览加载失败:', err)
  ElMessage.warning('预览图加载失败，请尝试重新选择文件')
}



// 重置上传表单
const resetUploadForm = () => {
  uploadForm.shootLocation = ''
  uploadForm.aiCategories = []

  // 初始化上传人为当前登录用户（这里使用示例用户名）
  uploadForm.uploader = 'admin'
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



// 提交上传表单
const submitUploadForm = () => {
  uploadFormRef.value.validate((valid) => {
    if (valid) {
      // 表单验证通过，开始上传
      console.log('====uploadForm==', uploadForm);
      if (uploadForm.dynamicPath) {
        if (uploadForm.dynamicPath.split('/').length > 3) {
          ElMessage.warning('文件夹层级过多，请删减！')
        }
      }
      let folderParams = {
        filePath: uploadForm.aiCategories,
        dynamicPath: uploadForm.dynamicPath.replace(/\s/g, ""), // 文件夹名称1/ 文件夹名称2 / 文件夹名称3 /文件夹名称4
      }
      addFolder(folderParams).then(res => {
        console.log('res========', res)
      })
    } else {
      ElMessage.error('请完善必填信息')
      return false
    }
  })


  // if (fileList.value.length === 0) {
  //   ElMessage.warning('请先选择要上传的文件')
  //   return
  // }

  // // 检查文件格式
  // const invalidFiles = fileList.value.filter(file => !isSupportedFormat(file.name))
  // if (invalidFiles.length > 0) {
  //   ElMessage.error(`素材格式不符合，请上传支持的文件格式`)
  //   return
  // }

  // if (!uploadFormRef.value) return


}




</script>

<style scoped lang="scss">
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  width: 100%;

  .upload-demo {
    width: 100%;
  }

  .formBox {
    .upload-btn {
      position: relative;
      left: 512px;
    }
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