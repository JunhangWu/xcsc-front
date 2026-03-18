<template>
  <div class="preview-container">
    <!-- 左侧预览区 -->
    <div class="preview-area">
      <div v-if="getFileType(material.minioPath) === 'image'" class="image-preview">
        <img :src="getProxyPath(material.minioPath)" :alt="material.fileName" class="preview-image" />
      </div>
      <div v-else-if="getFileType(material.minioPath) === 'video'" class="video-preview">
        <!-- <video :src="material.thumbnail" controls class="preview-video">
          您的浏览器不支持视频播放
        </video> -->
        <video :src="getProxyPath(material.minioPath)" controls autoplay loop muted playsinline
          style="max-width: 100%; max-height: 600px; width: auto; height: auto; display: block; object-fit: contain;"></video>
      </div>
      <div v-else class="file-preview">
        <!-- <el-icon class="file-icon"> -->
          <!-- <Document v-if="getFileType(material.minioPath) === 'document'" />
          <Collection v-else-if="getFileType(material.minioPath) === 'ppt'" /> -->
          <el-link type="primary" :href="getProxyPath(material.minioPath)" target="_blank">{{ material.fileName}}</el-link>
        <!-- </el-icon> -->
        <!-- <p class="file-text">无法在线预览该类型文件</p> -->
      </div>
    </div>

    <!-- 右侧信息区 -->
    <div class="info-area">
      <!-- 返回按钮 -->
      <div class="back-section">
        <el-button @click="handleBack" icon="ArrowLeft">返回</el-button>
        <el-button @click="handleShare" icon="Share">分享</el-button>
      </div>

      <!-- 文件名称 -->
      <div class="name-section">
        <h2 class="material-name">{{ material.fileName }}</h2>
      </div>

      <!-- 元数据信息 -->
      <div class="metadata-section">
        <h3 class="section-title">文件信息</h3>
        <div class="metadata-grid">
          <div class="metadata-item">
            <span class="metadata-label">文件类型：</span>
            <span class="metadata-value">{{ getFileTypeText(material.minioPath) }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">上传时间：</span>
            <span class="metadata-value">{{ parseTime(material.createTime) }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">上传者：</span>
            <span class="metadata-value">{{ material.createBy }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">所属路径：</span>
            <span class="metadata-value">{{ buildDisplayLocalPath(material.localPath, material.fileName) || '未分类' }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">文件大小：</span>
            <span class="metadata-value">{{ material.fileSize }}M</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">分辨率：</span>
            <span class="metadata-value">{{ material.resolution }}</span>
          </div>
        </div>
      </div>

      <!-- 标签信息 -->
      <h3 class="section-title">标签信息</h3>
      <div class="tags-section">
        <!-- 自动标签 -->
        <div class="tag-category">
          <h3 class="section-title2">智能标签</h3>
          <div class="tag-items">
            <div class="tag-dimension">
              <span class="dimension-label">场景分类：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in autoTagForm.sceneCategory" :key="tag" size="small" type="primary"
                  effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">人物行为：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in autoTagForm.characterBehavior" :key="tag" size="small" type="primary"
                  effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">核心物体：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in autoTagForm.coreObjects" :key="tag" size="small" type="primary" effect="plain">{{
                  tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">活动事件：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in autoTagForm.activityEvent" :key="tag" size="small" type="primary"
                  effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">文本信息：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in autoTagForm.textInfo" :key="tag" size="small" type="primary" effect="plain">{{ tag
                }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">颜色色调：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in autoTagForm.colorTone" :key="tag" size="small" type="primary" effect="plain">{{
                  tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">拍摄角度：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in autoTagForm.shootingAngle" :key="tag" size="small" type="primary"
                  effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">素材描述：</span>
              <div class="dimension-values">
                <el-tag size="small" type="primary" effect="plain">
                  {{ autoTagForm.materialDescription }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 人工标签 -->
        <div class="tag-category">
          <h3 class="section-title2">基础标签</h3>
          <div class="tag-items">
            <div class="tag-dimension">
              <span class="dimension-label">时间信息：</span>
              <div class="dimension-values">
                <el-tag size="small" type="success" effect="plain">{{ manualTagForm.timeInfo }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">地点信息：</span>
              <div class="dimension-values">
                <el-tag v-for="(tag, index) in manualTagForm.locationInfo.split(',')"  :key="index" size="small" type="success"
                  effect="plain">{{ tag.trim() }}</el-tag>
                <!-- <el-tag size="small" type="success" effect="plain">{{ manualTagForm.locationInfo }}</el-tag> -->
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">人物姓名：</span>
              <div class="dimension-values">
                <el-tag v-for="(tag, index) in manualTagForm.personNames.split(',')"  :key="index" size="small" type="success"
                  effect="plain">{{ tag.trim() }}</el-tag>
                <!-- <el-tag size="small" type="success" effect="plain">{{ manualTagForm.personNames }}</el-tag> -->
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">事件信息：</span>
              <div class="dimension-values">
                <el-tag v-for="(tag, index) in manualTagForm.eventInfo.split(',')"  :key="index" size="small" type="success"
                  effect="plain">{{ tag.trim() }}</el-tag>
                <!-- <el-tag size="small" type="success" effect="plain">{{ manualTagForm.eventInfo }}</el-tag> -->
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">建筑名称：</span>
              <div class="dimension-values">
                <el-tag v-for="(tag, index) in manualTagForm.buildingNames.split(',')"  :key="index" size="small" type="success"
                  effect="plain">{{ tag.trim() }}</el-tag>
                <!-- <el-tag size="small" type="success" effect="plain">{{ manualTagForm.buildingNames }}</el-tag> -->
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">相关主题：</span>
              <div class="dimension-values">
                <el-tag v-for="(tag, index) in manualTagForm.relatedThemes.split(',')"  :key="index" size="small" type="success"
                  effect="plain">{{ tag.trim() }}</el-tag>
                <!-- <el-tag size="small" type="success" effect="plain">{{ manualTagForm.relatedThemes }}</el-tag> -->
              </div>
            </div>
            
          </div>
        </div>

        <!-- 补充标签 -->
        <div class="tag-category">
          <h3 class="section-title2">补充标签</h3>
          <div class="tag-items"> 
            <div class="tag-dimension">
              <!-- <span class="dimension-label">补充标签：</span> -->
              <div class="dimension-values">
                <el-tag v-for="(tag, index) in supplementTags.split(',')"  :key="index" size="small" type="success"
                      effect="plain">{{ tag.trim() }}</el-tag>
              </div>
            </div>
          </div>
        </div>  
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <el-button type="primary" @click="handleDownload" icon="Download">下载</el-button>
      </div>
    </div>
  </div>
</template>

<script setup name="MaterialPreview">
import { ref, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Document, Collection, ArrowLeft, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFileList } from "@/api/xcsc/uploadFile"

const router = useRouter()
const route = useRoute()
const material = reactive({
  minioPath: '',
  fileSize: '',
  fileName: '',
  resolution: '',
  createTime: '',
  createBy: '',
  fileType: '',
  tag: '',
  localPath: '',
})
// 标注信息 - 标签信息（8个维度）
const autoTagForm = reactive({
  sceneCategory: '', // 场景分类
  characterBehavior: '', // 人物行为
  coreObjects: '', // 核心物体
  activityEvent: '', // 活动事件
  textInfo: '', // 文本信息
  colorTone: '', // 颜色色调
  shootingAngle: '', // 拍摄角度
  materialDescription: '' // 素材描述
})

// 标注信息 - 基本信息（6个维度）
const manualTagForm = reactive({
  timeInfo: '', // 事件时间
  locationInfo: '', // 地点信息
  personNames: '', // 人物姓名
  buildingNames: '', // 建筑名称
  relatedThemes: '', // 相关主题
  eventInfo: '' // 事件信息
})

// 标注信息 - 补充标签
const supplementTags = ref('')

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

const handleShare = () => {
  const previewUrl = window.location.href
  if (!previewUrl) {
    ElMessage.warning('当前页面地址不可用')
    return
  }
  navigator.clipboard.writeText(previewUrl)
      .then(() => ElMessage.success('链接已复制到剪贴板'))
      .catch(() => ElMessage.error('复制失败，请手动复制'));
};


//获取自动标注信息
function getAutoTags() {
  let params = {
    id: route.params.id,
  }
  getFileList(params).then(res => {
    console.log('自动标注:', JSON.parse(res.data[0].annotationContent))
    let resJson = JSON.parse(res.data[0].annotationContent)
    autoTagForm.sceneCategory = resJson==null?['']:resJson.sceneCategory
    autoTagForm.characterBehavior = resJson==null?['']:resJson.characterBehavior
    autoTagForm.coreObjects = resJson==null?['']:resJson.coreObjects
    autoTagForm.activityEvent = resJson==null?['']:resJson.activityEvent
    autoTagForm.textInfo = resJson==null?['']:resJson.textInfo
    autoTagForm.colorTone = resJson==null?['']:resJson.colorTone
    autoTagForm.shootingAngle = resJson==null?['']:resJson.shootingAngle
    autoTagForm.materialDescription = resJson==null?'':resJson.materialDescription || ''
  })
}
getAutoTags()

//获取人工标注信息
function getManualTags() {
  let params = {
    id: route.params.id,
  }
  getFileList(params).then(res => {
    console.log('人工标注:', res.data[0])
    manualTagForm.timeInfo = res.data[0].timeInfo || ''
    manualTagForm.locationInfo = res.data[0].locationInfo || ''
    manualTagForm.personNames = res.data[0].personNames || ''
    manualTagForm.buildingNames = res.data[0].buildingNames || ''
    manualTagForm.relatedThemes = res.data[0].relatedThemes || ''
    manualTagForm.eventInfo = res.data[0].eventInfo || ''
  })
}
getManualTags()

//获取补充标注信息
function getSupplementTags() {
  let params = {
    id: route.params.id,
  }
  getFileList(params).then(res => {
    console.log('补充标注:', res.data[0].supplementAnnotation)
    supplementTags.value = res.data[0].supplementAnnotation || ''
    console.log('补充标注:', supplementTags)
  })
}
getSupplementTags()

//获取素材
function getMaterial() {
  // debugger
  let params = {
    id: route.params.id,
  }

  getFileList(params).then(res => {
    console.log('getFileList 响应:', res)
    console.log('getFileList 响应:', res.data[0].minioPath)
    material.minioPath = res.data[0].minioPath || ''
    material.fileSize = res.data[0].fileSize || ''
    material.fileName = res.data[0].fileName || ''
    material.resolution = res.data[0].fileResolution || ''
    material.createTime = res.data[0].createTime || ''
    material.createBy = res.data[0].createBy || ''
    material.fileType = getFileType(res.data[0].minioPath)
    material.tag = res.data.annotationContent || ''
    material.localPath = res.data[0].localPath || ''
  })
  console.log('素材数据加载成功:', material);
}
onMounted(() => {
  getMaterial() // 组件挂载后初始加载
  console.log('material.minioPath:', material.minioPath)
})

// 根据文件路径判断文件类型
function getFileType(filePath) {
  if (!filePath) return 'other'
  const lowerPath = filePath.toLowerCase()
  if (/\.(jpg|jpeg|png|gif|bmp)$/.test(lowerPath)) {
    return 'image'
  } else if (/\.(mp4|avi|mov|wmv|flv|m4v)$/.test(lowerPath)) {
    return 'video'
  } else if (/\.(doc|docx|pdf|txt)$/.test(lowerPath)) {
    return 'document'
  } else if (/\.(ppt|pptx)$/.test(lowerPath)) {
    return 'ppt'
  }
  return 'other'
}
// 获取文件名
function getFileName(path) {
    if (!path) return '';
    const idx = path.lastIndexOf('/');
    return idx !== -1 ? path.substring(idx + 1) : path;
}
// 展示用路径：localPath 最后一个 "/" 前的目录 + fileName
function buildDisplayLocalPath(localPath, fileName) {
  if (!fileName) return localPath || '';
  if (!localPath) return fileName;
  const idx = localPath.lastIndexOf('/');
  if (idx === -1) return fileName;
  const dir = localPath.substring(0, idx);
  return dir ? `${dir}/${fileName}` : fileName;
}
//获取文件路径
function getFilePath(path) {
  if (!path) return '';
  // const prefix = 'xcsc/';
  const prefix = path.substring(28,32)
  const startIndex = path.indexOf(prefix) + prefix.length;
  const result = path.substring(startIndex);
  return result.replace("/" + getFileName(path), "");
}
// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取文件类型文本
// const getFileTypeText = (type) => {
//   const typeMap = {
//     'image': '图片',
//     'video': '视频',
//     'document': '文档',
//     'ppt': 'PPT'
//   }
//   return typeMap[type] || '未知'
// }
// 获取文件类型文本
const getFileTypeText = (filePath) => {
  if (!filePath) return '未知类型';

  const dotIndex = filePath.lastIndexOf('.');
  if (dotIndex === -1) return '其他';
  const ext = filePath.substring(dotIndex + 1);
  const typeMap = {
    '图片': ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp', 'svg', 'heic'],
    '视频': ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'webm','m4v'],
    '音频': ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
    'PDF文档': ['pdf'],
    'Word文档': ['doc', 'docx'],
    'Excel文档': ['xls', 'xlsx'],
    'PPT文档': ['ppt', 'pptx'],
    '压缩文件': ['zip', 'rar', '7z', 'tar', 'gz'],
    '文本': ['txt', 'md', 'csv', 'json', 'xml']
  };
  for (const [type, exts] of Object.entries(typeMap)) {
    if (exts.includes(ext.toLowerCase())) {
      return type;
    }
  }
  return '其他';
};
// 返回上一页
const handleBack = () => {
  router.back()
}

// 处理下载
const handleDownload = async () => {
  if (!material.minioPath) {
    ElMessage.warning('文件路径不存在，无法下载')
    return
  }
  console.log('下载文件:', material.fileName)
  try {
    // 使用fetch API获取文件内容
    const response = await fetch(getProxyPath(material.minioPath), {
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

// 从URL中提取文件名
function getFileNameFromUrl(url) {
  // 尝试从URL路径中提取文件名
  const pathname = new URL(url).pathname
  const parts = pathname.split('/')
  return parts[parts.length - 1]
}

// 获取自动标签
// const getAutoTags = (type) => {
// // 直接从素材对象的tags属性中获取对应的分类标签
// const tags = material.value.tags || {}

// // 映射类型到对应的标签分类
// const typeMap = {
//   'scene': tags.scene || [],
//   'objects': tags.objects || [],
//   'events': tags.events || [],
//   'text': tags.text || [],
//   'color': tags.color || [],
//   'angle': tags.angle || [],
//   'description': [material.value.category || '']
// }

// return typeMap[type] || []
// }

// 获取人工标签
// const getManualTags = (type) => {
// // 直接从素材名称和现有标签中提取人工标签
// const name = material.value.name || ''

// // 映射类型到对应的标签提取逻辑
// const typeMap = {
//   'time': name.includes('2025') ? ['2025'] : [],
//   'location': extractLocationTags(name),
//   'person': [],
//   'building': extractBuildingTags(name),
//   'theme': extractThemeTags(name),
//   'noun': extractNounTags(name)
// }

// return typeMap[type] || []
// }

// 提取地点标签
const extractLocationTags = (name) => {
  const locationKeywords = ['芜湖', '巢湖', '丰乐', '高速时代广场']
  return locationKeywords.filter(keyword => name.includes(keyword))
}

// 提取建筑名称标签
const extractBuildingTags = (name) => {
  const buildingKeywords = ['芜湖二桥', '高速时代广场', '安徽交控驿达丰乐服务区']
  return buildingKeywords.filter(keyword => name.includes(keyword))
}

// 提取主题标签
const extractThemeTags = (name) => {
  const themeKeywords = ['党建', '排水', '防汛', '企业文化']
  return themeKeywords.filter(keyword => name.includes(keyword))
}

// 提取专有名词标签
const extractNounTags = (name) => {
  const nounKeywords = ['合巢芜处', '安徽交控', '驿达', '理想']
  return nounKeywords.filter(keyword => name.includes(keyword))
}

// 获取文件真实大小
const getRealFileSize = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl, {
      method: 'HEAD',
      credentials: 'include'
    });

    if (response.ok) {
      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        return parseInt(contentLength);
      }
    }
    console.log('无法获取文件真实大小，使用默认值');
  } catch (error) {
    console.error('获取文件大小失败:', error);
  }
  return material.value.fileSize; // 失败时使用默认值
}

// 获取图片真实分辨率
const getRealResolution = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const resolution = `${img.width}x${img.height}`;
      resolve(resolution);
    };
    img.onerror = () => {
      console.log('无法获取图片真实分辨率，使用默认值');
      resolve(material.value.resolution || '不适用');
    };
    img.src = imageUrl;
  });
}
//预览文件
function downloadFile(material) {
  if (material && material.minioPath) {
    window.open(getProxyPath(material.minioPath), '_blank');
  }
}
// 组件挂载时获取素材数据
onMounted(async () => {
  // 从路由参数中获取素材ID
  const materialId = route.params.id
  console.log('获取素材ID:', materialId)

  // 尝试从localStorage获取全局素材数据
  try {
    const globalMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')
    const selectedMaterial = globalMaterials.find(m => m.id === materialId)

    if (selectedMaterial) {
      material.value = selectedMaterial

      // 尝试获取文件真实大小和分辨率
      if (material.value.type === 'image') {
        // 对于图片，获取真实分辨率和大小
        const [realResolution, realFileSize] = await Promise.all([
          getRealResolution(material.value.thumbnail),
          getRealFileSize(material.value.thumbnail)
        ]);
        material.value.resolution = realResolution;
        material.value.fileSize = realFileSize;
      } else if (material.value.type === 'video') {
        // 对于视频，仅获取真实大小
        const realFileSize = await getRealFileSize(material.value.thumbnail);
        material.value.fileSize = realFileSize;
      }

      console.log('已获取文件真实信息:', material.value.name);
    } else {
      // 如果localStorage中没有，使用模拟数据（实际项目中应该从API获取）
      // 这里使用默认的模拟数据
      console.log('未找到素材数据，使用默认数据')
    }
  } catch (error) {
    console.error('获取素材数据失败:', error)
  }
})

</script>

<style scoped lang="scss">
.preview-container {
  height: 100vh;
  display: flex;
  background: #f0f2f5;
  padding: 24px;
  box-sizing: border-box;
}

.preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  margin-right: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.image-preview,
.video-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-video {
  max-width: 100%;
  max-height: 90%;
}

.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.file-icon {
  font-size: 64px;
  color: #909399;
  margin-bottom: 16px;
}

.file-text {
  font-size: 16px;
  color: #606266;
}

.info-area {
  width: 360px;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.back-section {
  margin-bottom: 20px;
}

.name-section {
  margin-bottom: 22px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.material-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  word-break: break-all;
}

.metadata-section {
  margin-bottom: 24px;
}

.tags-section {
  margin-bottom: 24px;
  max-height: 400px;
  /* 设置最大高度 */
  overflow-y: auto;
  /* 添加垂直滚动条 */
  scrollbar-width: thin;
  /* 细滚动条 */
  scrollbar-color: #c0c4cc #f0f2f5;
  /* 滚动条颜色 */
}

.section-title {
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.section-title2 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.metadata-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
}

.metadata-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.metadata-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.tag-category {
  margin-bottom: 24px;
}

.tag-items {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.tag-dimension {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.tag-dimension:last-child {
  margin-bottom: 0;
}

.dimension-values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  padding-right: 4px;
}

.dimension-values .el-tag {
  max-width: 100%;
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
  padding: 6px 8px;
  box-sizing: border-box;
  height: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.dimension-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.dimension-values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* WebKit浏览器滚动条样式 */
.tags-section::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.tags-section::-webkit-scrollbar-track {
  background: #f0f2f5;
  border-radius: 3px;
}

.tags-section::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.tags-section::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.actions-section {
  margin-top: auto;
}

.actions-section .el-button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}
</style>
