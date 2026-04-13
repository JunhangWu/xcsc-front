<template>
  <div class="app-container ai-search-page">
    <div class="main-content" :class="{ 'has-results': showResults }">
      <!-- 左侧搜索历史 -->
      <div class="sidebar">
        <el-button class="new-chat-btn" type="primary" @click="resetSearch">
          <el-icon><Plus /></el-icon>
          <span>新对话</span>
        </el-button>
        <div class="history-section">
          <h3>最近搜索</h3>
          <div class="history-list" v-if="searchHistory.length > 0">
            <div 
              v-for="(item, index) in searchHistory" 
              :key="item.id || index" 
              class="history-item"
            >
              <div class="history-content" @click="searchWithHistory(item.query)">
                <div class="history-info">
                  <div class="history-keyword">{{ item.query }}</div>
                  <div class="history-time">{{ parseTime(item.createTime) }}</div>
                </div>
                <div class="history-result">
                  <span>{{ item.searchResult
                      ? item.searchResult.split(',').filter(i => i.trim() !== '').length
                      : 0 }}个结果</span>
                </div>
              </div>
              <div class="history-delete" @click.stop="deleteSingleHistory(item.id)">
                <el-icon class="delete-icon"><Delete /></el-icon>
              </div>
            </div>
          </div>
          <div v-else class="no-history">
            <div class="no-history-icon">
              <el-icon><Search /></el-icon>
            </div>
            <p>暂无搜索记录</p>
          </div>
          <div class="history-actions">
            <el-button 
              v-if="searchHistory.length > 0"
              type="text" 
              size="small" 
              @click="clearHistory"
            >
              <el-icon><RefreshRight /></el-icon>
              清空全部历史
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧主内容 -->
      <div class="search-content">
        <div class="scrollable-area">
          <!-- 页面标题和描述 -->
          <div class="header-section" :class="{ 'header-active': showResults }">
            <h1 class="page-title">AI智能搜索</h1>
            <p class="page-description">使用AI技术快速查找素材，支持自然语言查询。</p>
          </div>

          <!-- 搜索示例 -->
          <div class="examples-section" v-if="showExamples">
            <h3>搜索示例:</h3>
            <div class="examples-list">
              <el-tag 
                v-for="example in searchExamples" 
                :key="example.id" 
                class="example-tag"
                @click="searchWithExample(example.text)"
              >
                {{ example.text }}
              </el-tag>
            </div>
          </div>

          <!-- 搜索结果区域 -->
          <div v-if="showResults" class="search-results">
            <!-- 用户提问消息 -->
            <div class="message-row user-row" v-if="currentSearchMessage">
              <div class="message-bubble user-bubble">
                {{ currentSearchMessage }}
              </div>
            </div>

            <!-- AI回答消息 -->
            <div class="message-row ai-row">
              <div class="ai-avatar">
                <img src="@/assets/logo/logo.png" alt="AI" onerror="this.style.display='none'" />
                <el-icon class="fallback-icon"><Monitor /></el-icon>
              </div>
              <div class="ai-content">
                <div class="assistant-reply-wrapper">
                  <div class="assistant-title">为你找到以下相关素材：</div>
                  <div class="search-result-stats" v-if="total > 0">
                    <span>找到 <strong>{{ total }}</strong> 条相关素材</span>
                  </div>
                </div>
                
                <!-- 空结果提示 -->
                <div v-if="!loading && materialList.length === 0" class="empty-result">
                  <div class="empty-icon">
                    <el-icon><Search /></el-icon>
                  </div>
                  <p class="empty-text">未找到相关素材，请尝试其他关键词</p>
                </div>
                
                <!-- 素材网格 -->
                <div v-else class="material-grid" v-loading="loading">
                  <div 
                    v-for="material in materialList" 
                    :key="material.id" 
                    class="material-card"
                  >
                    <!-- 素材预览 -->
                    <div class="material-preview-container" @click="previewMaterial(material)" style="cursor: pointer;">
                      <img 
                        v-if="isImage(material.minioPath)" 
                        :src="getProxyPath(material.coverPath) || getProxyPath(material.minioPath)" 
                        class="material-thumbnail" 
                      />
                      <!-- <div v-else-if="isVideo(material.minioPath)" src="material.minioPath" class="video-placeholder">
                        <el-icon><VideoCamera /></el-icon>
                      </div> -->
                      <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="previewVideo(material)">
                        <el-icon class="file-icon">
                          <VideoPlay />
                        </el-icon>
                        <img :src="getProxyPath(material.coverPath)" :alt="material.fileName"/>
                        <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                          style="max-width: 95%; max-height: 95%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                      </div>
                      <div v-else class="document-placeholder">
                        <el-icon><Document /></el-icon>
                      </div>
                    </div>
                    
                    <!-- 素材信息 -->
                    <div class="material-info">
                      <div class="material-name" :title="material.fileName">{{ material.fileName }}</div>
                      <div class="material-meta">
                        <span class="material-size">{{ material.fileSize }} MB</span>
                        <!-- <span class="material-type">{{ material.type.split('/')[1].toUpperCase() }}</span> -->
                      </div>
                      <!-- <div class="material-tags">
                        <el-tag 
                          v-for="tag in material.tags.slice(0, 3)"
                          :key="tag"
                          size="small"
                          v-if="tag"
                        >
                          {{ tag }}
                        </el-tag>
                        <el-tag 
                          v-if="material.tags.length > 3"
                          size="small"
                          type="info"
                        >
                          +{{ material.tags.length - 3 }}
                        </el-tag>
                      </div> -->
                      <div class="material-upload-time">{{ material.uploadTime }}</div>
                      
                      <!-- 操作按钮 -->
                      <div class="material-actions">
                        <el-button 
                          type="primary" 
                          size="small" 
                          @click.stop="previewMaterial(material)"
                          icon="View"
                        >
                          预览
                        </el-button>
                        <el-button 
                          type="default" 
                          size="small" 
                          @click.stop="downloadMaterial(material)"
                          icon="Download"
                        >
                          下载
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 初始状态提示 -->
          <div v-if="!showResults && !showExamples" class="search-suggestion">
            <div class="suggestion-icon">
              <el-icon><Search /></el-icon>
            </div>
            <p class="suggestion-text">输入关键词开始AI搜索</p>
          </div>
        </div>

        <!-- 搜索框 -->
        <div class="search-box-container">
          <div class="search-input-wrapper">
            <el-input
              v-model="searchKeyword"
              type="textarea"
              :rows="3"
              resize="none"
              placeholder="发送消息..."
              @keydown.enter.prevent="searchMaterials"
            >
            </el-input>
            <div class="input-bottom-actions">
              <el-button 
                type="info" 
                circle 
                plain
                @click="toggleRecording" 
                class="voice-btn" 
                :class="{ 'is-recording': isRecording }"
                title="语音输入"
              >
                <el-icon><Microphone /></el-icon>
              </el-button>
              <el-button 
                type="primary" 
                circle 
                @click="searchMaterials" 
                class="send-btn" 
                :disabled="!searchKeyword.trim()"
              >
                <el-icon><Top /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 素材预览弹窗 -->
    <MaterialPreviewDialog
      v-model:visible="previewVisible"
      :material="selectedMaterial"
      @download="downloadMaterial"
    />
  </div>
</template>

<script setup name="Search">
import { ref, reactive, onMounted } from 'vue'
import { Search, VideoCamera, Document, View, Download, RefreshRight, Delete, Refresh,VideoPlay, Top, Monitor, Plus, Microphone } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {getSearchList, addSearch, delSearch, delAllSearchHistory} from "@/api/xcsc/search"
import {getFileList,getFileBatch} from "@/api/xcsc/uploadFile"
import useUserStore from '@/store/modules/user'
import { scrollPageTop } from '@/utils/scroll-to'
import MaterialPreviewDialog from './MaterialPreviewDialog.vue'

// 语音识别相关变量
const isRecording = ref(false)
let recognition = null

// 初始化语音识别
const initSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    ElMessage.warning('当前浏览器不支持语音输入功能，请使用 Chrome 等现代浏览器')
    return null
  }
  
  const instance = new SpeechRecognition()
  instance.lang = 'zh-CN'
  instance.continuous = false
  instance.interimResults = true
  
  instance.onstart = () => {
    isRecording.value = true
  }
  
  instance.onresult = (event) => {
    let interimTranscript = ''
    let finalTranscript = ''
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript
      } else {
        interimTranscript += event.results[i][0].transcript
      }
    }
    
    if (finalTranscript) {
      // 避免重复追加，可以在实际应用中做更细致的拼接处理
      searchKeyword.value += finalTranscript
    }
  }
  
  instance.onerror = (event) => {
    console.error('语音识别错误:', event.error)
    isRecording.value = false
    if (event.error === 'not-allowed') {
      ElMessage.error('请允许浏览器使用麦克风')
    } else if (event.error === 'network') {
      ElMessage.error('网络连接失败，部分浏览器可能因网络限制无法使用语音识别功能')
    } else if (event.error === 'no-speech') {
      ElMessage.warning('未识别到说话！')
    } else {
      ElMessage.error('语音识别出错: ' + event.error)
    }
  }
  
  instance.onend = () => {
    isRecording.value = false
  }
  
  return instance
}

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    if (recognition) {
      recognition.stop()
    }
    isRecording.value = false
  } else {
    if (!recognition) {
      recognition = initSpeechRecognition()
    }
    if (recognition) {
      try {
        recognition.start()
      } catch (error) {
        console.error('启动语音识别失败:', error)
      }
    }
  }
}

// 视频预览相关变量
const videoDialogVisible = ref(false)
const videoFilePath = ref('')
const videoDialogTitle = ref('')

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

//当前用户
const userStore = useUserStore()
// 搜索关键词
const searchKeyword = ref('')
const currentSearchMessage = ref('')

// 素材列表
const loading = ref(false)
const idList = ref([])
const materialList = ref([])
const total = ref(0)

// 预览弹窗
const previewVisible = ref(false)
const selectedMaterial = ref({})

// 界面状态控制
const showExamples = ref(true)
const showResults = ref(false)

// 搜索历史
const searchHistory = ref([])

// 搜索示例
const searchExamples = ref([
  {
    id: 1,
    text: '美丽的自然风景'
  },
  {
    id: 2,
    text: '斜拉桥航拍'
  },
  {
    id: 3,
    text: '查找包含"安徽交控"关键词的图片'
  },
  {
    id: 4,
    text: '服务区室内环境'
  }
])

function isImage(path) {
  if (!path) return false;
  const ext = path.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp', 'svg'].includes(ext);
}
function isVideo(path) {
  if (!path) return false;
  const ext = path.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'avi', 'mkv', 'flv', 'm4v', 'wmv', 'webm'].includes(ext);
}
function previewVideo(material) {
  videoDialogVisible.value = true
  videoFilePath.value = material.minioPath
  videoDialogTitle.value = material.fileName
}
// 重置搜索
function resetSearch() {
  // 清空搜索关键词和当前显示消息
  searchKeyword.value = '';
  currentSearchMessage.value = '';
  // 重置页面状态
  showResults.value = false;
  showExamples.value = true;
  // 清空素材列表
  materialList.value = [];
  total.value = 0;
  // 清空ID列表
  idList.value = [];
}
// 搜索素材
async function searchMaterials() {
  if (!searchKeyword.value) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  console.log('searchKeyword.value', searchKeyword.value)
  
  // 更新当前显示的消息并重置搜索状态
  currentSearchMessage.value = searchKeyword.value
  const currentKeyword = searchKeyword.value
  loading.value = true;
  showExamples.value = false;
  showResults.value = true;
  // 保存到搜索历史
  await saveToSearchHistory(currentKeyword)
  await getSearchMaterialIds(currentKeyword)
  await fetchMaterialList(currentKeyword)
  // 清空输入框
  searchKeyword.value = ''
}

// 保存搜索历史
async function saveToSearchHistory(keyword) {
  try {
    // 调用API保存搜索记录
    const data = {
      query: keyword,
      userId: userStore.id,
      searchResult: idList.value.join(',')
    }
    await addSearch(data)
    // 重新获取搜索历史列表
    await fetchSearchHistory(userStore.id)
  } catch (error) {
    console.error('保存搜索历史失败:', error)
    ElMessage.error('保存搜索历史失败')
  }
}
//获取搜索结果素材id
async function getSearchMaterialIds(keyword){
  try {
    let params = {
      query: keyword, // 使用传入的明确的 keyword，避免依赖外部响应式变量产生时序问题
    };
    const res = await getSearchList(params);
    // 边界处理：确保 response 存在再访问 data
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {

      const searchResultStr = res.data[0].searchResult || "";
      
      // 3. 核心转换逻辑：字符串 → Long类型数组
      idList.value = searchResultStr
        .split(',') // 按逗号分割为字符串数组（如 ["254", "306", ...]）
        .filter(idStr => {
          // 过滤无效值：空字符串、纯空格、非数字字符
          const trimmed = idStr.trim();
          return trimmed !== "" && !isNaN(Number(trimmed));
        })
        .map(idStr => {
          // 转为Number类型
          return Number(idStr.trim());
        });
    } else {
      idList.value = [];
    }

    console.log('idList.value', idList.value)
    return idList.value;
  } catch (error) {
    // 捕获接口请求错误（如网络错误、422/500 状态码）
    console.error('获取搜索结果ID列表失败:', error);
    // 错误时重置列表，避免显示旧数据
    idList.value = [];
    return [];
  }
}

// 从历史记录搜索
function searchWithHistory(keyword) {
  currentSearchMessage.value = keyword
  searchKeyword.value = ''
  showExamples.value = false;
  showResults.value = true;
  fetchMaterialList(keyword)
}

// 使用搜索示例
async function searchWithExample(text) {
  currentSearchMessage.value = text
  loading.value = true;
  showExamples.value = false;
  showResults.value = true;
  // 保存到搜索历史
  await saveToSearchHistory(text)
  await getSearchMaterialIds(text)
  await fetchMaterialList(text)
  // 清空输入框
  searchKeyword.value = ''
}

// 删除单条搜索历史
async function deleteSingleHistory(id) {
  // debugger
  try {
    await delSearch({ id })
    // 重新获取搜索历史列表
    await fetchSearchHistory(userStore.id)
    ElMessage.success('搜索记录已删除')
  } catch (error) {
    console.error('删除搜索记录失败:', error)
    ElMessage.error('删除搜索记录失败')
  }
}

// 清空搜索历史
async function clearHistory() {
  try {
    await delAllSearchHistory(userStore.id) // 传用户ID
    searchHistory.value = []
    ElMessage.success('搜索历史已清空')
  } catch (error) {
    console.error('清空搜索历史失败:', error)
    ElMessage.error('清空搜索历史失败')
  }
}


// 获取搜索历史
async function fetchSearchHistory() {
  try {
    let params = {
        userId: userStore.id,
    }
    console.log('userStore.id', userStore.id)
    const response = await getSearchList(params)
    // 假设API返回的数据格式需要转换为组件需要的格式
    searchHistory.value = response.data || []
  } catch (error) {
    console.log('暂无搜索历史')
    // ElMessage.error('获取搜索历史失败')
  }
}

// 获取素材列表
async function fetchMaterialList(keyword) {
  loading.value = true;
  showExamples.value = false;
  showResults.value = true;
  
  if (keyword) {
    currentSearchMessage.value = keyword;
  }

  // 立即使用最新的 keyword 或者 fallback 到当前的搜索词
  const queryKeyword = keyword || searchKeyword.value || currentSearchMessage.value;

  try {
    await getSearchMaterialIds(queryKeyword);
    
    console.log('idList.value', idList.value);
    // 检查idList是否为空
    if (!idList.value || idList.value.length === 0) {
      materialList.value = [];
      total.value = 0;
      return;
    }
    
    // 调用批量查询接口，传递idList作为参数
    const res = await getFileBatch(idList.value); // 传递idList作为请求体参数
    console.log('res', res.data);
    
    // 处理批量查询结果
    const allMaterials = res.data || [];
    console.log('批量查询到的素材列表:', allMaterials);
    
    // 直接赋值，不进行分页
    materialList.value = allMaterials;
    total.value = allMaterials.length;
  } catch (error) {
    console.error('获取素材列表失败:', error);
    ElMessage.error('获取素材列表失败');
    materialList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
    console.log('materialList.value', materialList.value)
  }
}



// 预览素材
function previewMaterial(material) {
  const parsed = parseAnnotation(material.annotationContent)
  selectedMaterial.value = {
    ...material,
    annotationTags: parsed.tags,          // 所有标签
    annotationDescription: parsed.desc    // 描述
  }
  previewVisible.value = true
}

// 下载素材 todo: 抽象出工具方法
const downloadMaterial = async (material) => {
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



// 解析标签字段（打平所有数组，除了materialDescription字段
// todo 后续前后端应优化一下接口 不然后续修改容易出bug
function parseAnnotation(jsonStr) {
  if (!jsonStr) {
    return { tags: [], desc: '' }
  }

  try {
    const obj = JSON.parse(jsonStr)

    // 提取描述字段
    const desc = obj.materialDescription || ''

    // 除 materialDescription 之外的字段全部收集为 tags
    const tags = Object.entries(obj)
        .filter(([key, value]) => key !== 'materialDescription')
        .flatMap(([key, value]) => value)      // 展开数组
        .filter(tag => tag && tag.trim() !== '') // 过滤空内容

    return {
      tags,
      desc
    }

  } catch (e) {
    console.error("annotationContent 解析失败:", e)
    return { tags: [], desc: '' }
  }
}



// 组件挂载时初始化
onMounted(function() {
  // 获取搜索历史
  fetchSearchHistory()
})
</script>

<style scoped lang="scss">
.ai-search-page {
  background: #ffffff;
  min-height: calc(100vh - 84px);
}

.main-content {
  display: flex;
  gap: 16px;
  width: 100%;
  min-height: calc(100vh - 116px);
}

/* 左侧搜索历史样式 */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid #dcdfe6;
  padding-right: 8px;
  display: flex;
  flex-direction: column;

  .new-chat-btn {
    width: 100%;
    margin-bottom: 16px;
    border-radius: 12px;
    height: 40px;
    font-size: 15px;
    
    .el-icon {
      margin-right: 6px;
      font-size: 16px;
    }
  }

  .history-section {
    background: rgba(255, 255, 255, 0.56);
    border-radius: 12px;
    padding: 16px 12px;
    box-shadow: inset 0 0 0 1px rgba(215, 220, 230, 0.8);
    height: calc(100vh - 196px); /* Adjusted for new button height + margin */
    display: flex;
    flex-direction: column;

    h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: #909399;
    }

    .history-list {
      flex: 1;
      overflow-y: auto;
      padding-right: 4px;

      .history-item {
          padding: 8px 10px;
          border: 1px solid transparent;
          border-radius: 10px;
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
          background: transparent;

          &:hover {
            border-color: #d7dbe3;
            background: #fff;
          }

          .history-content {
            flex: 1;
            cursor: pointer;
          }
          .history-delete {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 4px;
            margin-left: 8px;
            cursor: pointer;
            opacity: 0;
            transition: all 0.2s;
            .delete-icon {
              color: #909399;
              font-size: 14px;
            }
          }

          &:hover .history-delete {
            opacity: 1;
          }

          .history-delete:hover {
            background-color: #f56c6c;
            .delete-icon {
              color: white;
            }
          }
        .history-info {
          .history-keyword {
            font-size: 14px;
            color: #303133;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .history-time {
            font-size: 12px;
            color: #909399;
          }
        }

        .history-result {
          font-size: 12px;
          color: #a0a5ae;
          margin-top: 4px;
        }
      }
    }

    .no-history {
      text-align: center;
      padding: 40px 20px 20px;
      color: #909399;
      .no-history-icon {
        font-size: 40px;
        margin-bottom: 12px;
        color: #c0c4cc;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .history-actions {
      margin-top: 12px;
      text-align: center;
    }
  }
}

/* 右侧主内容样式 */
.search-content {
  flex: 1;
  position: relative;
  min-height: calc(100vh - 124px);
  height: calc(100vh - 124px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .scrollable-area {
    flex: 1;
    overflow-y: auto;
    padding: 18px 24px 126px;
  }

  .header-section {
    margin: 48px auto 20px;
    text-align: center;
    transition: all 0.2s ease;

    &.header-active {
      margin: 0 0 18px;
      text-align: left;
      .page-title,
      .page-description {
        display: none;
      }
    }

    .page-title {
      font-size: 46px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
    }

    .page-description {
      font-size: 16px;
      color: #6b7280;
      margin: 0;
    }
  }

  .search-box-container {
    position: absolute;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: calc(100% - 48px);
    max-width: 920px;
    background: transparent;

    .search-input-wrapper {
      width: 100%;
      position: relative;
      background: #fff;
      border-radius: 24px;
      border: 1px solid #b6d0ff;
      padding: 12px 16px 12px 16px;
      box-shadow: 0 0 16px rgba(0, 0, 0, 0.15); /* 边缘加一圈阴影，居中且加深 */
      transition: all 0.3s;

      &:focus-within {
        border-color: #409eff;
        box-shadow: 0 0 20px rgba(64, 158, 255, 0.25); /* 聚焦时阴影加强 */
      }

      :deep(.el-textarea__inner) {
        border: none;
        box-shadow: none;
        padding: 0;
        padding-right: 40px;
        font-size: 15px;
        line-height: 1.5;
        background: transparent;
        resize: none;
        min-height: 48px !important;
        
        &::-webkit-scrollbar {
          width: 6px;
        }
        &::-webkit-scrollbar-thumb {
          border-radius: 3px;
          background: #dcdfe6;
        }
      }

      .input-bottom-actions {
        position: absolute;
        right: 12px;
        bottom: 12px;
        display: flex;
        align-items: center;

        .voice-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          margin-right: 8px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          border: none;
          background: transparent;

          &:hover {
            background: #f2f3f5;
            color: #0066ff;
          }

          &.is-recording {
            color: #f56c6c;
            animation: pulse 1.5s infinite;
          }

          .el-icon {
            font-size: 18px;
          }
        }

        .send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0066ff;
          border-color: #0066ff;
          color: white;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          
          &:hover {
            background: #3385ff;
            border-color: #3385ff;
            transform: scale(1.05);
          }

          &.is-disabled {
            background: #e4e4e4;
            border-color: #e4e4e4;
            color: #fff;
          }
          
          .el-icon {
            font-size: 18px;
            font-weight: bold;
          }
        }
      }
    }
  }

  .examples-section {
    max-width: 980px;
    margin: 0 auto;

    h3 {
      font-size: 0;
      font-weight: 500;
      margin: 0;
    }

    .examples-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
    }

    .example-tag {
      cursor: pointer;
      font-size: 16px;
      line-height: 22px;
      padding: 8px 14px;
      border-radius: 12px;
      border: 0;
      color: #111827;
      background: #eceff3;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px) scale(1.01);
        background: #e3e8f1;
        color: #0f172a;
      }
    }
  }

  .search-results {
    max-width: 1200px;
    margin: 0 auto;
    padding: 4px 4px 20px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .message-row {
    display: flex;
    width: 100%;
  }

  .user-row {
    justify-content: flex-end;
  }

  .message-bubble {
    border-radius: 16px;
    padding: 12px 18px;
    font-size: 16px;
    line-height: 1.6;
    max-width: min(80%, 720px);
    word-break: break-word;
  }

  .user-bubble {
    background: #f2f3f5;
    color: #1d2129;
    border-bottom-right-radius: 4px;
  }

  .ai-row {
    justify-content: flex-start;
    gap: 16px;
  }

  .ai-avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e8eaf0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      background: #fff;
    }
    
    .fallback-icon {
      font-size: 20px;
      color: #0066ff;
      z-index: 0;
    }
  }

  .ai-content {
    flex: 1;
    max-width: 100%;
  }

  .assistant-reply-wrapper {
    margin-bottom: 16px;
  }

  .assistant-title {
    color: #1d2129;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .search-result-stats {
    font-size: 14px;
    color: #86909c;
  }

  .search-suggestion {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 70px 20px 20px;
    color: #909399;
  }

  .suggestion-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #c0c4cc;
  }

  .suggestion-text {
    font-size: 16px;
    margin: 0;
  }

  .empty-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #909399;
    text-align: center;
  }
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #c0c4cc;
  }

  .empty-text {
    font-size: 16px;
    margin: 0;
  }
}

/* 网格布局样式 */
.material-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 12px;
  width: 100%;
}

.material-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  }
}

.material-preview-container {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #f5f7fa;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
    cursor: pointer;
  }
}

.material-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.video-placeholder,
.document-placeholder {
  font-size: 48px;
  color: #909399;
}

.material-info {
  padding: 12px;
  background: #fff;
}

.material-name {
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.material-tags {
  margin-bottom: 12px;
}

.material-upload-time {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.material-actions {
  display: flex;
  gap: 8px;

  :deep(.el-button) {
    border-radius: 999px;
  }
}

.thumbnail {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}



@media (max-width: 1280px) {
  .sidebar {
    width: 236px;
  }

  .search-content .search-box-container {
    width: calc(100% - 320px);
  }
}

@media (max-width: 992px) {
  .main-content {
    flex-direction: column;
    min-height: auto;
  }

  .sidebar {
    width: 100%;
    border-right: 0;
    padding-right: 0;

    .history-section {
      height: auto;
      max-height: 240px;
    }
  }

  .search-content {
    padding: 16px 0 120px;
    min-height: auto;

    .header-section {
      margin-top: 30px;
      .page-title {
        font-size: 34px;
      }
    }

    .search-box-container {
      width: calc(100% - 30px);
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      
      .search-input-wrapper {
        width: 100%;
      }
    }

    .chat-bubble {
      max-width: 92%;
      font-size: 16px;
    }

    .assistant-title {
      font-size: 22px;
    }
  }

  .material-grid {
    max-width: 100%;
    grid-template-columns: repeat(2, 1fr);
  }

  .material-name {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .material-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(245, 108, 108, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}
</style>
