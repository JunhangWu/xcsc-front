<template>
  <div class="preview-container">
    <!-- 左侧预览区 -->
    <div class="preview-area">
      <div v-if="material.type === 'image'" class="image-preview">
        <img :src="material.thumbnail" :alt="material.name" class="preview-image" />
      </div>
      <div v-else-if="material.type === 'video'" class="video-preview">
        <video :src="material.thumbnail" controls class="preview-video">
          您的浏览器不支持视频播放
        </video>
      </div>
      <div v-else class="file-preview">
        <el-icon class="file-icon">
          <Document v-if="material.type === 'document'" />
          <Collection v-else-if="material.type === 'ppt'" />
        </el-icon>
        <p class="file-text">无法在线预览该类型文件</p>
      </div>
    </div>
    
    <!-- 右侧信息区 -->
    <div class="info-area">
      <!-- 返回按钮 -->
      <div class="back-section">
        <el-button @click="handleBack" icon="ArrowLeft">返回</el-button>
      </div>
      
      <!-- 文件名称 -->
      <div class="name-section">
        <h2 class="material-name">{{ material.name }}</h2>
      </div>
      
      <!-- 元数据信息 -->
      <div class="metadata-section">
        <h3 class="section-title">文件信息</h3>
        <div class="metadata-grid">
          <div class="metadata-item">
            <span class="metadata-label">文件类型：</span>
            <span class="metadata-value">{{ getFileTypeText(material.type) }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">上传时间：</span>
            <span class="metadata-value">{{ material.uploadTime }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">上传者：</span>
            <span class="metadata-value">{{ material.uploader }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">所属分类：</span>
            <span class="metadata-value">{{ material.category }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">文件大小：</span>
            <span class="metadata-value">{{ formatFileSize(material.fileSize) }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">分辨率：</span>
            <span class="metadata-value">{{ material.resolution || '不适用' }}</span>
          </div>
        </div>
      </div>
      
      <!-- 标签信息 -->
      <h3 class="section-title">标签信息</h3>
      <div class="tags-section">
        <!-- 自动标签 -->
        <div class="tag-category">
          <h3 class="section-title2">自动标签</h3>
          <div class="tag-items">
            <div class="tag-dimension">
              <span class="dimension-label">场景分类：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getAutoTags('scene')" :key="tag" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">核心物体：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getAutoTags('objects')" :key="tag" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">活动事件：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getAutoTags('events')" :key="tag" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">文本信息：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getAutoTags('text')" :key="tag" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">颜色色调：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getAutoTags('color')" :key="tag" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">拍摄角度：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getAutoTags('angle')" :key="tag" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">素材描述：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getAutoTags('description')" :key="tag" size="small" type="primary" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 人工标签 -->
        <div class="tag-category">
          <h3 class="section-title2">人工标签</h3>
          <div class="tag-items">
            <div class="tag-dimension">
              <span class="dimension-label">时间信息：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getManualTags('time')" :key="tag" size="small" type="success" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">地点信息：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getManualTags('location')" :key="tag" size="small" type="success" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">人物姓名：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getManualTags('person')" :key="tag" size="small" type="success" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">建筑名称：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getManualTags('building')" :key="tag" size="small" type="success" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">相关主题：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getManualTags('theme')" :key="tag" size="small" type="success" effect="plain">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="tag-dimension">
              <span class="dimension-label">专有名词：</span>
              <div class="dimension-values">
                <el-tag v-for="tag in getManualTags('noun')" :key="tag" size="small" type="success" effect="plain">{{ tag }}</el-tag>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Document, Collection, ArrowLeft, Download } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 初始化素材数据
const material = ref({
  id: '',
  name: '',
  type: '',
  thumbnail: '',
  uploadTime: '',
  uploader: '',
  tags: [],
  category: '',
  fileSize: 0,
  resolution: ''
})

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取文件类型文本
const getFileTypeText = (type) => {
  const typeMap = {
    'image': '图片',
    'video': '视频',
    'document': '文档',
    'ppt': 'PPT'
  }
  return typeMap[type] || '未知'
}

// 返回上一页
const handleBack = () => {
  router.back()
}

// 处理下载
const handleDownload = () => {
  // 模拟下载功能
  console.log('下载文件:', material.value.name)
  // 实际项目中可以使用a标签下载或调用后端接口
  const link = document.createElement('a')
  link.href = material.value.thumbnail
  link.download = material.value.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 获取自动标签
const getAutoTags = (type) => {
  // 直接从素材对象的tags属性中获取对应的分类标签
  const tags = material.value.tags || {}
  
  // 映射类型到对应的标签分类
  const typeMap = {
    'scene': tags.scene || [],
    'objects': tags.objects || [],
    'events': tags.events || [],
    'text': tags.text || [],
    'color': tags.color || [],
    'angle': tags.angle || [],
    'description': [material.value.category || '']
  }
  
  return typeMap[type] || []
}

// 获取人工标签
const getManualTags = (type) => {
  // 直接从素材名称和现有标签中提取人工标签
  const name = material.value.name || ''
  
  // 映射类型到对应的标签提取逻辑
  const typeMap = {
    'time': name.includes('2025') ? ['2025'] : [],
    'location': extractLocationTags(name),
    'person': [],
    'building': extractBuildingTags(name),
    'theme': extractThemeTags(name),
    'noun': extractNounTags(name)
  }
  
  return typeMap[type] || []
}

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

.image-preview, .video-preview {
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
  margin-bottom: 32px;
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
  max-height: 400px; /* 设置最大高度 */
  overflow-y: auto; /* 添加垂直滚动条 */
  scrollbar-width: thin; /* 细滚动条 */
  scrollbar-color: #c0c4cc #f0f2f5; /* 滚动条颜色 */
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
}

.tag-dimension {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}

.tag-dimension:last-child {
  margin-bottom: 0;
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