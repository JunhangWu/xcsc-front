<template>
  <div class="app-container">
    <div class="card">
      <div class="card-header"></div>
      <div class="card-body">
        <!-- 上传类型选择 -->
        <!-- <div class="upload-type-section">
          <el-radio-group v-model="uploadType" @change="handleUploadTypeChange">
            <el-radio label="file">上传文件</el-radio>
            <el-radio label="folder">上传文件夹</el-radio>
          </el-radio-group>
        </div> -->

        <!-- 上传区域 -->
        <div class="upload-area">
          <el-upload v-model:file-list="fileList" class="upload-demo" drag :multiple="uploadType === 'file'"
            :directory="uploadType === 'folder'" action="" :on-change="handleFileChange"
            :before-upload="handleBeforeUpload" :auto-upload="false">
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              {{ uploadType === 'file' ? '点击或拖拽文件到此处上传' : '点击或拖拽文件夹到此处上传' }}
              <div class="el-upload__tip"> 支持图片：JPEG/JPG/PNG/BMP/GIF；视频：MP4/MOV/AVI/MKV/FLV；文档：DOCX/PDF/PPTX
              </div>
            </div>
          </el-upload>

          <!-- <el-form :model="form" label-width="auto" style="max-width: 600px">
            <el-form-item label="Activity name">
              <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="Activity zone">
              <el-select v-model="form.region" placeholder="please select your zone">
                <el-option label="Zone one" value="shanghai" />
                <el-option label="Zone two" value="beijing" />
              </el-select>
            </el-form-item>
          </el-form> -->

          <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadFormRules" label-width="auto"
            style="max-width: 600px">
            <el-form-item label="AI分类推荐" prop="aiCategories">
              <el-select v-model="uploadForm.aiCategories" placeholder="AI自动推荐分类">
                <el-option v-for="category in aiRecommendedCategories" :key="category" :label="category"
                  :value="category" />
              </el-select>
            </el-form-item>
            <el-form-item label="文件路径" prop="filePath">
              <el-input v-model="uploadForm.filePath" placeholder="请输入文件路径" maxlength="100" show-word-limit />
            </el-form-item>
            <el-form-item label="上传人" prop="uploader">
              <el-input v-model="uploadForm.uploader" placeholder="当前登录用户" disabled />
            </el-form-item>
          </el-form>
          <!-- 
          <el-button type="primary" @click="openUploadDialog" class="upload-btn" :disabled="uploadProgress > 0">{{
            uploadProgress > 0 ? '上传中...' : '开始上传' }}</el-button> -->

          <el-button type="primary" @click="submitUploadForm" class="upload-btn" :disabled="uploadProgress > 0">{{
            uploadProgress > 0 ? '上传中...' : '开始上传' }}</el-button>
        </div>

        <!-- 上传表单对话框 -->
        <el-dialog v-model="uploadDialogVisible" :title="uploadDialogTitle" width="800px"
          :before-close="handleDialogClose">
          <div class="dialog-container">
            <!-- <div class="preview-pane">
              <el-image v-if="fileList.length > 0 && fileList[0].type?.includes('image') && fileList[0].raw"
                :src="URL.createObjectURL(fileList[0].raw)" fit="contain" class="image-preview" @load="() => { }"
                @error="handlePreviewError" />
              <div v-else class="preview-placeholder">
                <el-icon>
                  <Picture />
                </el-icon>
                <span>{{ fileList.length > 0 ? '图片加载中...' : '选择文件后显示预览' }}</span>
              </div>
            </div> -->
            <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadFormRules" label-width="100px"
              class="form-pane">
              <el-form-item label="文件名" prop="fileName">
                <el-input v-model="uploadForm.fileName" placeholder="请输入文件名（不填写则使用原文件名）" maxlength="100"
                  show-word-limit />
              </el-form-item>
              <el-form-item label="文件路径" prop="filePath">
                <el-input v-model="uploadForm.filePath" placeholder="请输入文件路径" maxlength="100" show-word-limit />
              </el-form-item>

              <el-form-item label="拍摄时间" prop="shootTime">
                <el-date-picker v-model="uploadForm.shootTime" type="datetime" placeholder="请选择拍摄时间"
                  value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
              </el-form-item>

              <el-form-item label="拍摄地点" prop="shootLocation">
                <el-input v-model="uploadForm.shootLocation" placeholder="请输入拍摄地点或来源" maxlength="100" show-word-limit />
              </el-form-item>

              <el-form-item label="上传人" prop="uploader">
                <el-input v-model="uploadForm.uploader" placeholder="当前登录用户" disabled />
              </el-form-item>

              <el-form-item label="AI分类推荐" prop="aiCategories">
                <el-select v-model="uploadForm.aiCategories" placeholder="AI自动推荐分类" style="width: 100%">
                  <el-option v-for="category in aiRecommendedCategories" :key="category" :label="category"
                    :value="category" />
                </el-select>
                <!-- <div class="form-tip">AI基于素材内容推荐1-3个匹配分类</div> -->
              </el-form-item>

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

// 上传类型
const uploadType = ref('file')
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
  fileName: '',
  shootTime: '',
  shootLocation: '',
  uploader: 'admin', // 默认当前登录用户
  aiCategories: []
})



// 表单验证规则
const uploadFormRules = {
  fileName: [
    { required: false, message: '请输入文件名', trigger: 'blur' },
    { max: 100, message: '文件名长度不能超过100个字符', trigger: 'blur' }
  ],
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
const aiRecommendedCategories = [
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
          uploadForm.shootTime = dateTime;
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

  // 打开对话框
  uploadDialogVisible.value = true
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

// // 处理上传类型变化
// const handleUploadTypeChange = () => {
//   // 当切换上传类型时，清空文件列表
//   fileList.value = []
// }

// 重置上传表单
const resetUploadForm = () => {
  uploadForm.shootTime = ''
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

// 对话框关闭处理
const handleDialogClose = (done) => {
  ElMessageBox.confirm('确定要取消上传吗？未保存的信息将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    uploadDialogVisible.value = false
    if (done) done()
  }).catch(() => { })
}

// 提交上传表单
const submitUploadForm = () => {
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
      let newMaterials = []
      fileList.value.forEach(file => {
        // 构建符合要求的素材对象结构
        const fileType = getFileType(file.name);
        // 获取当前日期，只保留年月日格式 (YYYY/MM/DD)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const uploadTimeStr = `${year}/${month}/${day}`;

        // 保存文件到images目录并获取URL

        let thumbnailUrl = '';
        let fileUrl = '';
        let resolution = '';

        // 设置缩略图和文件URL为images目录路径
        thumbnailUrl = fileType === 'image' ? `/${file.name}` : '';
        fileUrl = `/${file.name}`;

        // 对于图片文件，获取分辨率
        if (fileType === 'image' && file.raw) {
          // 使用同步方式获取分辨率
          try {
            // 使用原始文件创建临时URL
            const tempUrl = URL.createObjectURL(file.raw);
            const img = new Image();

            // 使用Promise确保分辨率获取完成
            const getResolution = new Promise((resolve, reject) => {
              img.onload = function () {
                URL.revokeObjectURL(tempUrl); // 释放临时URL
                resolve(`${img.width}x${img.height}`);
              };
              img.onerror = function () {
                URL.revokeObjectURL(tempUrl); // 释放临时URL
                reject(new Error('图片加载失败，无法获取分辨率'));
              };
              img.src = tempUrl;
            });

            // 立即获取分辨率（同步获取）
            getResolution.then(res => {
              resolution = res;
              console.log('成功获取图片分辨率:', resolution);
            }).catch(err => {
              console.warn(err.message);
            });
          } catch (error) {
            console.warn('获取分辨率时出错:', error);
          }
        }

        const newMaterial = {
          id: Date.now() + Math.random(),
          name: uploadForm.fileName || file.name,
          type: fileType === 'image' ? 'image' :
            fileType === 'video' ? 'video' :
              fileType === 'document' ? 'document' : 'other',
          thumbnail: thumbnailUrl,
          uploadTime: uploadTimeStr,
          uploader: uploadForm.uploader || 'admin',
          tags: {
            scene: [],
            behavior: [],
            objects: [],
            text: [],
            events: [],
            color: [],
            angle: []
          },
          category: uploadForm.aiCategories[0] || '未分类',
          fileSize: file.size, // 直接使用文件的真实大小（字节）
          resolution: resolution,
          isFavorite: false, // 默认为未收藏
          url: fileUrl,
          status: 'pending',
          shootTime: uploadForm.shootTime,
          shootLocation: uploadForm.shootLocation
        }
        newMaterials.push(newMaterial)
      })

      // 保存到本地存储并同步到首页
      try {
        // 使用 localStorage 实现持久存储
        console.log('准备保存素材数据到localStorage，素材数量:', newMaterials.length)
        console.log('newMaterials内容:', newMaterials)

        // 创建可序列化的素材数据副本
        let serializableNewMaterials = JSON.parse(JSON.stringify(newMaterials))

        // 检查素材数据是否可以被JSON序列化
        try {
          const testSerialization = JSON.stringify(serializableNewMaterials)
          console.log('素材数据可以被正常序列化')
        } catch (serializeError) {
          console.error('素材数据序列化失败:', serializeError)
          // 尝试清理不可序列化的属性
          serializableNewMaterials = serializableNewMaterials.map(material => {
            // 创建一个可序列化的副本
            const cleanMaterial = { ...material }
            // 移除可能导致序列化问题的属性
            if (cleanMaterial.file) {
              delete cleanMaterial.file
            }
            if (cleanMaterial.raw) {
              delete cleanMaterial.raw
            }
            return cleanMaterial
          })
          console.log('已清理素材数据中的不可序列化属性')
        }

        // 1. 保存到全局素材库用于首页显示
        // 获取现有全局素材数据
        const globalMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')
        console.log('现有全局素材数量:', globalMaterials.length)

        // 合并新素材并去重
        serializableNewMaterials.forEach(material => {
          if (!globalMaterials.some(m => m.id === material.id)) {
            globalMaterials.push(material)
            console.log('添加新素材到全局素材库:', material.name)
          }
        })

        // 保存更新后的全局素材数据
        localStorage.setItem('globalMaterials', JSON.stringify(globalMaterials))
        console.log('已保存全局素材数据到localStorage')

        // 2. 按分类组织素材数据
        const categorizedMaterials = JSON.parse(localStorage.getItem('categorizedMaterials') || '{}')
        serializableNewMaterials.forEach(material => {
          const category = material.category || '未分类'
          if (!categorizedMaterials[category]) {
            categorizedMaterials[category] = []
            console.log('创建新分类:', category)
          }
          // 避免重复添加
          if (!categorizedMaterials[category].some(m => m.id === material.id)) {
            categorizedMaterials[category].push(material)
            console.log('添加素材到分类', category, ':', material.name)
          }
        })

        // 保存按分类组织的数据
        localStorage.setItem('categorizedMaterials', JSON.stringify(categorizedMaterials))
        console.log('已保存按分类组织的素材数据到localStorage')

        // 3. 设置同步标记
        localStorage.setItem('materialsNeedSync', 'true')
        console.log('已设置同步标记')

        // 上传成功后延迟2秒自动跳转到首页，让用户有时间看到成功提示
        console.log('准备延迟跳转到首页')
        setTimeout(() => {
          console.log('执行跳转到首页')
          try {
            router.push('/')
            console.log('跳转命令已执行')
          } catch (error) {
            console.error('跳转失败:', error)
            ElMessage.error('跳转失败，您可以手动返回首页查看素材')
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
.upload-type-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

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