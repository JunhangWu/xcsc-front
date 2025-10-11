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
      <el-button type="primary" @click="searchMaterial" icon="Search">搜索</el-button>
    </div>

    <div class="folderBox" v-if="showFolder">
      <div class="folderItem" v-for="(item, index) in classify" :key="index" @click="selectFolder">
        <el-icon>
          <FolderOpened />
        </el-icon>
        &nbsp;
        <div class="folderName">
          {{ item }}
        </div>
      </div>
    </div>

    <div class="card" v-else>
      <el-icon @click="backFolder" style="font-size: 40px;cursor: pointer;">
        <Back />
      </el-icon>
      <div class="card-body">
        <!-- 素材列表 - 网格视图 -->
        <div class="material-list">
          <div v-if="loading" class="loading-container">
            <el-loading-text>正在加载素材...</el-loading-text>
          </div>
          <div v-else-if="materialList.length === 0" class="empty-state">
            <el-empty description="暂无素材" />
          </div>
          <div v-else class="material-grid">
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

        <!-- 分页 -->
        <!-- <div class="pagination-container">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
        </div> -->
      </div>
    </div>

    <!-- 素材详情和标注弹窗：核心修复区域 -->
    <el-dialog v-model="dialogVisible" title="素材标注" width="60%" :before-close="handleClose">
      <div class="annotation-dialog">
        <!-- 1. 素材预览区域（无错误，保留原结构） -->
        <div class="material-preview-container">
          <div class="material-preview">
            <template v-if="currentMaterial.type && currentMaterial.type.includes('image')">
              <img :src="currentMaterial.url" class="preview-image" />
            </template>
            <template v-else-if="currentMaterial.type && currentMaterial.type.includes('video')">
              <div class="preview-video">
                <el-icon>
                  <VideoCamera />
                </el-icon>
                <span>视频预览区域</span>
              </div>
            </template>
            <template v-else>
              <div class="preview-file">
                <el-icon>
                  <Document />
                </el-icon>
                <span>文档预览区域</span>
              </div>
            </template>
          </div>

          <!-- 素材基本信息 -->
          <div class="material-basic-info">
            <h4>{{ currentMaterial.name || '未命名素材' }}</h4>
            <div class="metadata-section">
              <div class="metadata-grid">
                <div class="metadata-item">
                  <span class="metadata-label">文件类型：</span>
                  <span class="metadata-value">{{ getFileTypeText(currentMaterial.type) }}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">上传时间：</span>
                  <span class="metadata-value">{{ currentMaterial.uploadTime || '未知' }}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">上传者：</span>
                  <span class="metadata-value">{{ currentMaterial.uploader || '未知' }}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">所属分类：</span>
                  <span class="metadata-value">{{ currentMaterial.category || '未分类' }}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">文件大小：</span>
                  <span class="metadata-value">{{ formatFileSize(currentMaterial.size) }}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">分辨率：</span>
                  <span class="metadata-value">{{ currentMaterial.resolution || '不适用' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 标注信息区域（修复标签闭合：补充`annotation-info`的闭合标签） -->
        <div class="annotation-info">
          <h3>标注信息</h3>

          <el-tabs v-model="tabActiveName" class="demo-tabs">
            <el-tab-pane label="自动标签" name="autoLabel">
              <!-- 自动标签部分 -->
              <div class="annotation-section">
                <div style="margin-bottom: 20px; display: flex; justify-content: flex-end;">
                  <el-button @click="handleAIAutoTagging" :type="isAIAutoTagging ? 'default' : 'primary'"
                    :disabled="isAIAutoTagging">
                    {{ isAIAutoTagging ? '标注中...' : 'AI标注' }}
                  </el-button>
                </div>
                <el-form :model="autoTagForm" label-width="120px">
                  <el-form-item label="场景分类">
                    <el-select v-model="autoTagForm.sceneCategory" placeholder="请选择场景分类" multiple>
                      <el-option label="会议场景" value="meeting" />
                      <el-option label="活动现场" value="event" />
                      <el-option label="办公场景" value="office" />
                      <el-option label="户外场景" value="outdoor" />
                      <el-option label="家庭场景" value="home" />
                      <el-option label="商业场景" value="business" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="核心物体">
                    <el-input v-model="autoTagForm.coreObjects" placeholder="请输入核心物体，多个用逗号分隔" />
                  </el-form-item>
                  <el-form-item label="活动事件">
                    <el-input v-model="autoTagForm.activityEvent" placeholder="请输入活动事件描述" />
                  </el-form-item>
                  <el-form-item label="文本信息">
                    <el-input v-model="autoTagForm.textInfo" placeholder="请输入识别到的文本信息" />
                  </el-form-item>
                  <el-form-item label="颜色色调">
                    <el-select v-model="autoTagForm.colorTone" placeholder="请选择主要颜色色调" multiple>
                      <el-option label="红色" value="red" />
                      <el-option label="蓝色" value="blue" />
                      <el-option label="绿色" value="green" />
                      <el-option label="黄色" value="yellow" />
                      <el-option label="橙色" value="orange" />
                      <el-option label="紫色" value="purple" />
                      <el-option label="黑色" value="black" />
                      <el-option label="白色" value="white" />
                      <el-option label="灰色" value="gray" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="拍摄角度">
                    <el-select v-model="autoTagForm.shootingAngle" placeholder="请选择拍摄角度">
                      <el-option label="正面" value="front" />
                      <el-option label="侧面" value="side" />
                      <el-option label="俯拍" value="top" />
                      <el-option label="仰拍" value="bottom" />
                      <el-option label="鸟瞰" value="birdseye" />
                      <el-option label="特写" value="closeup" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="素材描述">
                    <el-input v-model="autoTagForm.materialDescription" type="textarea"
                      placeholder="请输入素材描述"></el-input>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
            <el-tab-pane label="人工标签" name="artificialLabel">
              <!-- 人工标签部分 -->
              <div class="annotation-section">
                <el-form :model="manualTagForm" label-width="120px">
                  <el-form-item label="时间信息">
                    <el-date-picker v-model="manualTagForm.timeInfo" type="datetime" placeholder="选择日期时间"
                      value-format="YYYY-MM-DD HH:mm:ss"></el-date-picker>
                  </el-form-item>
                  <el-form-item label="地点信息">
                    <el-input v-model="manualTagForm.locationInfo" placeholder="请输入地点信息" />
                  </el-form-item>
                  <el-form-item label="人物姓名">
                    <el-input v-model="manualTagForm.personNames" placeholder="请输入人物姓名，多个用逗号分隔" />
                  </el-form-item>
                  <el-form-item label="建筑名称">
                    <el-input v-model="manualTagForm.buildingNames" placeholder="请输入建筑名称" />
                  </el-form-item>
                  <el-form-item label="相关主题">
                    <el-input v-model="manualTagForm.relatedThemes" placeholder="请输入相关主题，多个用逗号分隔" />
                  </el-form-item>
                  <el-form-item label="专有名词">
                    <el-input v-model="manualTagForm.properNouns" placeholder="请输入专有名词，多个用逗号分隔" />
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
            <el-tab-pane label="补充标签" name="otherLabel">
              <!-- 补充标签 -->
              <div class="annotation-section">
                <div class="tag-input-section">
                  <el-input v-model="newSupplementTag" placeholder="输入补充标签" style="width: 200px; margin-right: 10px;"
                    @keyup.enter="addSupplementTag" />
                  <el-button type="primary" size="small" @click="addSupplementTag">添加</el-button>
                </div>
                <div class="tag-list">
                  <el-tag v-for="tag in supplementTags" :key="tag" size="small" type="primary" closable
                    @close="removeSupplementTag(tag)">
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>





        </div> <!-- 修复：补充 annotation-info 的闭合标签 -->
      </div> <!-- 修复：补充 annotation-dialog 的闭合标签 -->

      <!-- 3. 对话框底部按钮（修复：正确使用 el-dialog 的 footer 具名插槽） -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="primary" @click="saveAnnotation">保存标注</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MaterialAnnotation">
import { ref, reactive, onMounted } from 'vue'
import { Search, VideoCamera, Document, Check, Edit, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('')

// 素材列表
const loading = ref(false)
const materialList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const showFolder = ref(true)
const curFolderName = ref('')

const classify = [
  '高速公路建设', '高速公路营运', '设计咨询', '地产酒店', '建筑施工',
  '广告传媒', '服务区', '加油站', '金融资本', '物流运输', '资源板块',
  '深化改革', '党的建设', '群团工作', '企业文化', '科技创新', '其他'
]


// 弹窗相关
const dialogVisible = ref(false)
const currentMaterial = ref({})
const tabActiveName = ref('autoLabel')

// 标注信息 - 自动标签（7个维度）
const autoTagForm = reactive({
  sceneCategory: [], // 场景分类
  coreObjects: '', // 核心物体
  activityEvent: '', // 活动事件
  textInfo: '', // 文本信息
  colorTone: [], // 颜色色调
  shootingAngle: '', // 拍摄角度
  materialDescription: '' // 素材描述
})

// 标注信息 - 人工标签（6个维度）
const manualTagForm = reactive({
  timeInfo: '', // 时间信息
  locationInfo: '', // 地点信息
  personNames: '', // 人物姓名
  buildingNames: '', // 建筑名称
  relatedThemes: '', // 相关主题
  properNouns: '' // 专有名词
})

// 补充标签
const supplementTags = ref([])
const newSupplementTag = ref('')

// AI标注状态
const isAIAutoTagging = ref(false)

const selectFolder = (item) => {
  console.log('====item==', item);
  showFolder.value = false
  curFolderName.value = item
}
const backFolder = () => {
  showFolder.value = true
  curFolderName.value = '   '
}


// 确保素材列表在初始化时也保存到localStorage
const initializeMaterialStorage = () => {
  try {
    localStorage.setItem('annotationMaterials', JSON.stringify(materialList.value))
    console.log('初始化标注素材数据到localStorage')
  } catch (error) {
    console.error('初始化标注素材数据失败:', error)
  }
};

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

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size) return '未知';

  if (size < 1024) {
    return size + ' B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
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

// AI自动标注处理函数
const handleAIAutoTagging = () => {
  // 设置标注状态为进行中
  isAIAutoTagging.value = true

  // 模拟AI根据素材内容自动生成标注信息
  ElMessage({ message: '正在进行AI自动标注...', type: 'info' })

  // 清空现有数据，准备填充新的AI生成数据
  autoTagForm.sceneCategory = []
  autoTagForm.coreObjects = ''
  autoTagForm.activityEvent = ''
  autoTagForm.textInfo = ''
  autoTagForm.colorTone = []
  autoTagForm.shootingAngle = ''
  autoTagForm.materialDescription = ''

  // 模拟AI生成的标注数据
  // 延迟显示效果
  setTimeout(() => {
    // 根据素材类型和内容生成不同的标注信息
    if (currentMaterial.value.type && currentMaterial.value.type.includes('image')) {
      autoTagForm.sceneCategory = ['meeting', 'office']
      autoTagForm.coreObjects = '人物,办公设备,文件'
      autoTagForm.activityEvent = '办公会议'
      autoTagForm.textInfo = '会议讨论内容'
      autoTagForm.colorTone = ['blue', 'white', 'gray']
      autoTagForm.shootingAngle = 'front'
      autoTagForm.materialDescription = '室内办公场景下的会议照片'
    } else if (currentMaterial.value.type && currentMaterial.value.type.includes('video')) {
      autoTagForm.sceneCategory = ['event', 'outdoor']
      autoTagForm.coreObjects = '人物,场地,设备'
      autoTagForm.activityEvent = '户外活动'
      autoTagForm.textInfo = '活动现场声音记录'
      autoTagForm.colorTone = ['green', 'blue', 'yellow']
      autoTagForm.shootingAngle = 'birdseye'
      autoTagForm.materialDescription = '户外场景下的活动视频记录'
    } else {
      autoTagForm.sceneCategory = ['office']
      autoTagForm.coreObjects = '文档,文字'
      autoTagForm.activityEvent = '文档编辑'
      autoTagForm.textInfo = '文档内文本内容'
      autoTagForm.colorTone = ['white', 'black']
      autoTagForm.shootingAngle = ''
      autoTagForm.materialDescription = '标准文档资料'
    }

    ElMessage({ message: 'AI标注完成，请检查并根据需要修改！', type: 'success' })

    // 标注完成后恢复按钮状态
    isAIAutoTagging.value = false
  }, 1000)
}

// 搜索素材
const searchMaterial = () => {
  fetchMaterialList()
}

// 获取素材列表
const fetchMaterialList = () => {
  loading.value = true
  // 模拟API请求
  setTimeout(() => {
    try {
      // 从localStorage获取首页素材数据
      const storedMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')

      if (storedMaterials && storedMaterials.length > 0) {
        // 将首页素材转换为标注界面所需格式
        let materials = storedMaterials.map(material => {
          // 计算文件大小（KB）
          const sizeInKB = Math.round(material.fileSize / 1024)

          // 根据素材类型设置正确的MIME类型
          let mimeType = 'application/octet-stream'
          if (material.type === 'image') {
            mimeType = material.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
          } else if (material.type === 'video') {
            mimeType = 'video/mp4'
          } else if (material.type === 'document') {
            mimeType = 'application/pdf'
          } else if (material.type === 'ppt') {
            mimeType = 'application/vnd.ms-powerpoint'
          }

          return {
            id: material.id,
            name: material.name,
            url: material.thumbnail,
            size: sizeInKB,
            type: mimeType,
            uploadTime: material.uploadTime, // 保持YYYY/MM/DD格式
            status: material.status,
            tags: material.tags,
            category: material.category,
            uploader: material.uploader
          }
        })

        // 实现搜索功能
        if (searchKeyword.value.trim()) {
          const keyword = searchKeyword.value.trim().toLowerCase()
          materials = materials.filter(material => {
            // 搜索素材名称
            const nameMatch = material.name.toLowerCase().includes(keyword)

            // 搜索素材标签
            let tagsMatch = false
            if (material.tags && typeof material.tags === 'object') {
              // 检查标签对象中的各个字段
              const tagValues = Object.values(material.tags)
              tagsMatch = tagValues.some(value => {
                if (typeof value === 'string') {
                  return value.toLowerCase().includes(keyword)
                } else if (Array.isArray(value)) {
                  return value.some(item =>
                    typeof item === 'string' && item.toLowerCase().includes(keyword)
                  )
                }
                return false
              })
            }

            return nameMatch || tagsMatch
          })
        }

        // 实现状态筛选
        if (statusFilter.value) {
          materials = materials.filter(material => material.status === statusFilter.value)
        }

        materialList.value = materials
        total.value = materials.length
      } else {
        // 如果没有存储数据，使用默认模拟数据
        let mockMaterials = [
          {
            id: '1',
            name: '活动现场照片1.jpg',
            url: 'https://picsum.photos/id/1/400/300',
            size: 245,
            type: 'image/jpeg',
            uploadTime: '2023-09-15 10:23',
            status: 'manual_review'
          },
          {
            id: '2',
            name: '产品宣传视频.mp4',
            url: '',
            size: 12540,
            type: 'video/mp4',
            uploadTime: '2023-09-14 15:36',
            status: 'pending'
          },
          {
            id: '3',
            name: '季度报告文档.docx',
            url: '',
            size: 356,
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            uploadTime: '2023-09-13 09:12',
            status: 'completed'
          },
          {
            id: '4',
            name: '团队合影.jpg',
            url: 'https://picsum.photos/id/1005/400/300',
            size: 320,
            type: 'image/jpeg',
            uploadTime: '2023-09-12 16:45',
            status: 'auto_annotating'
          }
        ]

        // 对模拟数据也应用搜索和筛选
        if (searchKeyword.value.trim()) {
          const keyword = searchKeyword.value.trim().toLowerCase()
          mockMaterials = mockMaterials.filter(material =>
            material.name.toLowerCase().includes(keyword)
          )
        }

        if (statusFilter.value) {
          mockMaterials = mockMaterials.filter(material =>
            material.status === statusFilter.value
          )
        }

        materialList.value = mockMaterials
        total.value = mockMaterials.length
      }
    } catch (error) {
      console.error('加载素材数据失败:', error)
      // 出错时使用默认模拟数据
      materialList.value = [
        {
          id: '1',
          name: '活动现场照片1.jpg',
          url: 'https://picsum.photos/id/1/400/300',
          size: 245,
          type: 'image/jpeg',
          uploadTime: '2023-09-15 10:23',
          status: 'manual_review'
        },
        {
          id: '2',
          name: '产品宣传视频.mp4',
          url: '',
          size: 12540,
          type: 'video/mp4',
          uploadTime: '2023-09-14 15:36',
          status: 'pending'
        }
      ]
      total.value = 2
    }
    loading.value = false
  }, 500)
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

// 显示素材详情
const showMaterialDetail = (material) => {
  // 确保当前素材对象包含所有必要的字段
  currentMaterial.value = {
    ...material,
    // 从全局素材数据中获取分辨率信息
    resolution: material.resolution || (() => {
      try {
        const globalMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')
        const originalMaterial = globalMaterials.find(m => m.id === material.id)
        return originalMaterial ? originalMaterial.resolution : '不适用'
      } catch (error) {
        return '不适用'
      }
    })()
  }

  // 重置标签表单
  const resetTagForms = () => {
    // 重置自动标签
    Object.keys(autoTagForm).forEach(key => {
      autoTagForm[key] = typeof autoTagForm[key] === 'string' ? '' : []
    })

    // 重置人工标签
    Object.keys(manualTagForm).forEach(key => {
      manualTagForm[key] = ''
    })

    // 重置补充标签
    supplementTags.value = []
    newSupplementTag.value = ''
  }

  // 检查素材是否已有存储的标注数据，如果有则加载
  if (material.tags && material.tags.annotationData) {
    const annotationData = material.tags.annotationData

    // 加载自动标签
    if (annotationData.autoTags) {
      Object.assign(autoTagForm, annotationData.autoTags)
    }

    // 加载人工标签
    if (annotationData.manualTags) {
      Object.assign(manualTagForm, annotationData.manualTags)
    }

    // 加载补充标签
    if (annotationData.supplementTags) {
      supplementTags.value = [...annotationData.supplementTags]
    }
  } else if (material.status === 'manual_review') {
    // 自动标注待审核状态
    autoTagForm.sceneCategory = ['meeting', 'office']
    autoTagForm.coreObjects = '椅子, 屏幕, 桌子, 投影仪'
    autoTagForm.activityEvent = '商务会议'
    autoTagForm.textInfo = '第三季度工作报告'
    autoTagForm.colorTone = ['white', 'blue', 'gray']
    autoTagForm.shootingAngle = 'front'
    autoTagForm.materialDescription = '会议室场景，多人正在进行会议讨论'
  } else if (material.status === 'completed') {
    // 已完成标注状态
    autoTagForm.sceneCategory = ['office']
    autoTagForm.coreObjects = '文档, 图表'
    autoTagForm.activityEvent = '文档编辑'
    autoTagForm.textInfo = '财务数据汇总'
    autoTagForm.colorTone = ['white', 'gray']
    autoTagForm.shootingAngle = 'top'
    autoTagForm.materialDescription = '财务报告文档截图'

    manualTagForm.timeInfo = '2023-09-30 15:30:00'
    manualTagForm.locationInfo = '总部办公楼3楼财务室'
    manualTagForm.personNames = '张三, 李四'
    manualTagForm.buildingNames = '总部办公楼'
    manualTagForm.relatedThemes = '财务分析, 季度报告'
    manualTagForm.properNouns = '财务报表, 第三季度'

    supplementTags.value = ['重要文档', '季度汇总']
  } else {
    // 其他状态重置表单
    resetTagForms()
  }

  dialogVisible.value = true
}

// 添加补充标签
const addSupplementTag = () => {
  if (!newSupplementTag.value.trim()) {
    ElMessage.warning('请输入标签内容')
    return
  }

  if (supplementTags.value.includes(newSupplementTag.value.trim())) {
    ElMessage.warning('该标签已存在')
    return
  }

  supplementTags.value.push(newSupplementTag.value.trim())
  newSupplementTag.value = ''
}

// 移除补充标签
const removeSupplementTag = (tag) => {
  const index = supplementTags.value.indexOf(tag)
  if (index > -1) {
    supplementTags.value.splice(index, 1)
  }
}

// 保存标注
const saveAnnotation = () => {
  // 构建完整的标注数据
  const annotationData = {
    materialId: currentMaterial.value.id,
    autoTags: { ...autoTagForm },
    manualTags: { ...manualTagForm },
    supplementTags: [...supplementTags.value]
  }

  // 模拟保存操作
  loading.value = true
  setTimeout(() => {
    loading.value = false
    dialogVisible.value = false
    ElMessage.success('标注信息保存成功')

    // 更新素材状态和标签数据
    const material = materialList.value.find(item => item.id === currentMaterial.value.id)
    if (material) {
      material.status = 'completed'

      // 确保tags对象存在
      if (!material.tags) {
        material.tags = {}
      }

      // 保存完整的标注数据
      material.tags.annotationData = annotationData

      // 保存标注素材数据到localStorage，供首页读取
      try {
        localStorage.setItem('annotationMaterials', JSON.stringify(materialList.value))
        console.log('标注素材数据已保存到localStorage')
      } catch (error) {
        console.error('保存标注素材数据失败:', error)
      }

      // 同时也更新全局素材信息
      try {
        // 获取当前存储的全局素材
        const storedMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')

        // 查找并更新对应的素材
        const globalMaterialIndex = storedMaterials.findIndex(item => item.id === currentMaterial.value.id)
        if (globalMaterialIndex > -1) {
          if (!storedMaterials[globalMaterialIndex].tags) {
            storedMaterials[globalMaterialIndex].tags = {}
          }
          storedMaterials[globalMaterialIndex].tags.annotationData = annotationData

          // 重新保存到localStorage
          localStorage.setItem('globalMaterials', JSON.stringify(storedMaterials))
        }
      } catch (error) {
        console.error('同步素材标签到全局数据失败:', error)
      }
    }

    console.log('保存的标注数据:', annotationData)
  }, 800)
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
}

// 组件挂载时获取素材列表
onMounted(() => {
  fetchMaterialList()
  // 初始化时保存素材数据
  initializeMaterialStorage()
})
</script>

<style scoped lang="scss">
.folderBox {
  // display: flex;
  // justify-content: flex-start;
  // align-content: center;
  // flex-direction: column;
  // flex-wrap: wrap;
  max-height: calc(100vh - 180px);
  overflow-y: auto;

  .folderItem {
    border-radius: 6px;
    width: 60vw;
    cursor: pointer;
    margin: 10px 0;
    padding: 3px;
    display: flex;
    // flex-direction: column;
    justify-content: flex-start;
    align-items: center;

    :deep(.el-icon) {
      font-size: 30px;
      font-weight: 600;
      color: #ffd45e;
    }

    .folderName {
      text-align: center;
    }
  }

  .folderItem:hover {
    background-color: #e5f3ff;
    scale: 1.01;
    transform: translateX(10px);
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

.annotation-dialog {
  .annotation-content {
    display: flex;
    gap: 20px;
    max-height: 500px;
    overflow-y: auto;

    .material-preview {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      border-radius: 4px;
      min-height: 300px;

      .preview-image {
        max-width: 100%;
        max-height: 400px;
        object-fit: contain;
      }

      .preview-video,
      .preview-file {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #909399;

        span {
          font-size: 16px;
        }
      }
    }

    .annotation-info {
      flex: 1;

      .annotation-section {
        margin-bottom: 20px;

        h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }

        .tag-input-section {
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    }
  }
}

// 网格视图样式
.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.material-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.material-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

/* 弹窗样式优化 */
.annotation-dialog {
  padding: 6px;
}

.material-preview-container {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.material-preview {
  flex: 4;
  min-height: 500px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
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
  display: grid;
  grid-template-columns: 1fr;
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>