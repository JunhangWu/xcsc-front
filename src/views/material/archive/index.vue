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
            :before-upload="beforeUpload"
            :auto-upload="false"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">点击或拖拽文件到此处上传</div>
            <div class="el-upload__tip" slot="tip">
              支持单个或批量上传，支持jpg/png/gif/bmp/pdf/doc/docx/mp4等格式
            </div>
          </el-upload>
          
          <el-button type="primary" @click="handleUpload" class="upload-btn">开始上传</el-button>
        </div>
        
        <!-- 上传进度 -->
        <div v-if="uploadProgress > 0" class="upload-progress">
          <el-progress :percentage="uploadProgress" status="primary" />
          <span class="progress-text">{{ uploadStatusText }}</span>
        </div>
        
        <!-- 素材列表 -->
        <div class="material-list" v-if="materialList.length > 0">
          <el-card class="material-item" v-for="item in materialList" :key="item.id">
            <div class="material-info">
              <div class="info-left">
                <img v-if="item.type.includes('image')" :src="item.url" class="material-thumbnail" />
                <div v-else-if="item.type.includes('video')" class="video-placeholder">
                  <el-icon><video-camera /></el-icon>
                  <span>视频文件</span>
                </div>
                <div v-else class="file-placeholder">
                  <el-icon><document /></el-icon>
                  <span>文档文件</span>
                </div>
              </div>
              <div class="info-right">
                <h4>{{ item.name }}</h4>
                <div class="file-meta">
                  <span>{{ item.size }}KB</span>
                  <span>{{ item.type }}</span>
                  <span>{{ item.uploadTime }}</span>
                </div>
                <div class="file-tags">
                  <el-tag v-for="tag in item.tags" :key="tag" size="small">
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </div>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="MaterialArchive">
import { ref, onMounted } from 'vue'
import { UploadFilled, VideoCamera, Document } from '@element-plus/icons-vue'

// 文件列表
const fileList = ref([])
// 上传进度
const uploadProgress = ref(0)
// 上传状态文本
const uploadStatusText = ref('')
// 素材列表
const materialList = ref([])
// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 文件变化处理
const handleFileChange = (file, fileList) => {
  // 这里可以处理文件选择后的逻辑
}

// 上传前处理
const beforeUpload = (file) => {
  // 可以在这里进行文件格式、大小等校验
  return true
}

// 处理上传
const handleUpload = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  uploadStatusText.value = '正在上传...'
  // 模拟上传进度
  let progress = 0
  const timer = setInterval(() => {
    progress += 5
    uploadProgress.value = progress
    if (progress >= 100) {
      clearInterval(timer)
      uploadStatusText.value = '上传完成，正在归档...'
      
      // 模拟归档完成
      setTimeout(() => {
        uploadStatusText.value = '归档完成'
        // 清空文件列表
        fileList.value = []
        // 重置进度
        setTimeout(() => {
          uploadProgress.value = 0
          uploadStatusText.value = ''
        }, 2000)
        // 刷新素材列表
        fetchMaterialList()
      }, 1000)
    }
  }, 200)
}

// 获取素材列表
const fetchMaterialList = () => {
  // 模拟API请求
  setTimeout(() => {
    materialList.value = [
      {
        id: '1',
        name: '活动现场照片1.jpg',
        url: 'https://picsum.photos/id/1/400/300',
        size: 245,
        type: 'image/jpeg',
        uploadTime: '2023-09-15 10:23',
        tags: ['活动现场', '会议', '室内', '彩色']
      },
      {
        id: '2',
        name: '产品宣传视频.mp4',
        url: '',
        size: 12540,
        type: 'video/mp4',
        uploadTime: '2023-09-14 15:36',
        tags: ['产品宣传', '视频', '演示']
      },
      {
        id: '3',
        name: '季度报告文档.docx',
        url: '',
        size: 356,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadTime: '2023-09-13 09:12',
        tags: ['文档', '报告', '季度']
      },
      {
        id: '4',
        name: '团队合影.jpg',
        url: 'https://picsum.photos/id/1005/400/300',
        size: 320,
        type: 'image/jpeg',
        uploadTime: '2023-09-12 16:45',
        tags: ['团队', '合影', '人物', '彩色']
      }
    ]
    total.value = 24
  }, 300)
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchMaterialList()
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchMaterialList()
}

// 组件挂载时获取素材列表
onMounted(() => {
  fetchMaterialList()
})
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

.material-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.material-item {
  height: 100%;
}

.material-info {
  display: flex;
  align-items: center;
  .info-left {
    margin-right: 20px;
    .material-thumbnail {
      width: 120px;
      height: 90px;
      object-fit: cover;
      border-radius: 4px;
    }
    .video-placeholder,
    .file-placeholder {
      width: 120px;
      height: 90px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      border-radius: 4px;
      color: #909399;
      el-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
      span {
        font-size: 12px;
      }
    }
  }
  .info-right {
    flex: 1;
    h4 {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }
    .file-meta {
      display: flex;
      gap: 15px;
      margin-bottom: 10px;
      span {
        font-size: 12px;
        color: #909399;
      }
    }
    .file-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>