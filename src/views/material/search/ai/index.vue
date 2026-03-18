<template>
  <div class="app-container">
    <div class="main-content">
      <!-- 左侧搜索历史 -->
      <div class="sidebar">
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
        <!-- 页面标题和描述 -->
        <div class="header-section">
          <h1 class="page-title">AI智能搜索</h1>
          <p class="page-description">使用AI技术快速查找素材，支持自然语言查询。</p>
        </div>

        <!-- 搜索框 -->
        <div class="search-box-container">
          <div class="search-input-wrapper">
            <el-input
              v-model="searchKeyword"
              placeholder="请输入图片描述或关键词..."
              style="width: 100%;"
              @keyup.enter="searchMaterials"
              clearable
            >
              <template #append>
                <el-button type="primary" @click="searchMaterials" class="ai-search-button">
                  <el-icon><Search /></el-icon> AI搜索
                </el-button>
              </template>
            </el-input>
          </div>
          <div class="search-actions">
            <el-button @click="resetSearch" class="reset-button" style="margin-left: 10px;">
              <el-icon><Refresh /></el-icon> 重置
            </el-button>
          </div>
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
          <div class="search-result-stats">
            <span>找到 <strong>{{ total }}</strong> 条相关素材</span>
          </div>
          
          <!-- 素材网格 -->
          <div class="material-grid" v-loading="loading">
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

        <!-- 初始状态提示 -->
        <div v-if="!showResults && !showExamples" class="search-suggestion">
          <div class="suggestion-icon">
            <el-icon><Search /></el-icon>
          </div>
          <p class="suggestion-text">输入关键词开始AI搜索</p>
        </div>
      </div>
    </div>
    
    <!-- 素材预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="素材预览"
      width="80%"
      :before-close="handleClose"
    >
      <div class="preview-dialog">
        <div class="preview-content">
          <div
              v-if="['jpg','jpeg','png','gif','webp','bmp','svg'].includes(
                  selectedMaterial.fileType?.toLowerCase()
              )"
              class="image-preview"
          >
            <img :src="getProxyPath(selectedMaterial.minioPath)" class="full-image" />
          </div>
          <div
              v-else-if="['mp4','mov','avi','mkv','flv','wmv','webm'].includes(
               selectedMaterial.fileType?.toLowerCase().replace('.', '')
             )"
              class="video-preview"
          >
            <div class="video-placeholder">
                  <video :src="getProxyPath(selectedMaterial.minioPath)" controls autoplay loop muted playsinline
                      style="max-width: 100%; max-height: 400px; width: auto; height: auto; display: block; object-fit: contain;"></video>
              <!-- <span>视频预览区域</span> -->
            </div>
          </div>
          <div v-else class="document-preview">
            <div class="document-placeholder">
              <el-icon><Document /></el-icon>
              <span>文档预览区域</span>
            </div>
          </div>
          <div class="material-info">
            <h3>{{ selectedMaterial.fileName }}</h3>
            <div class="info-row">
              <!-- <span class="info-label">素材ID:</span>
              <span class="info-value">{{ selectedMaterial.id }}</span> -->
            </div>
            <div class="info-row">
              <span class="info-label">大小:</span>
              <span class="info-value">{{ selectedMaterial.fileSize }} M</span>
            </div>
            <div class="info-row">
              <span class="info-label">类型:</span>
              <span class="info-value">{{ selectedMaterial.fileType }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">上传时间:</span>
              <span class="info-value">{{ parseTime(selectedMaterial.createTime) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">标签:</span>
              <div class="tag-list">
                <el-tag
                    v-for="tag in selectedMaterial.annotationTags"
                    :key="tag"
                    size="small"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <span class="info-label">描述:</span>
              <span class="info-value">{{ selectedMaterial.annotationDescription || '无' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="primary" @click="downloadMaterial(selectedMaterial)">下载素材</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Search">
import { ref, reactive, onMounted } from 'vue'
import { Search, VideoCamera, Document, View, Download, RefreshRight, Delete, Refresh,VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {getSearchList, addSearch, delSearch, delAllSearchHistory} from "@/api/xcsc/search"
import {getFileList,getFileBatch} from "@/api/xcsc/uploadFile"
import useUserStore from '@/store/modules/user'

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

// 素材列表
const loading = ref(false)
const idList = ref([])
const materialList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
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
    text: '一位领导正在发言'
  },
  {
    id: 3,
    text: '查找包含"安徽交控"关键词的图片'
  },
  {
    id: 4,
    text: '高楼大厦全景图'
  }
])

function isImage(path) {
  return ['jpg', 'jpeg', 'png', 'bmp', 'gif'].some(ext => path.toLowerCase().includes(ext));
}
function isVideo(path) {
  return ['mp4', 'mov', 'avi', 'mkv', 'flv','m4v'].some(ext => path.toLowerCase().includes(ext));
}
function previewVideo(material) {
  videoDialogVisible.value = true
  videoFilePath.value = material.minioPath
  videoDialogTitle.value = material.fileName
}
// 重置搜索
function resetSearch() {
  // 清空搜索关键词
  searchKeyword.value = '';
  // 重置页面状态
  showResults.value = false;
  showExamples.value = true;
  // 清空素材列表
  materialList.value = [];
  total.value = 0;
  // 重置分页
  currentPage.value = 1;
  // 清空ID列表
  idList.value = [];
}
// 搜索素材
async function searchMaterials() {
  // debugger
  if (!searchKeyword.value) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  console.log('searchKeyword.value', searchKeyword.value)
  // 保存到搜索历史
  await saveToSearchHistory(searchKeyword.value)
  fetchMaterialList()
}

// 保存搜索历史
async function saveToSearchHistory(keyword) {
  // debugger
  try {
    // 调用API保存搜索记录
    const data = {
      query: keyword,
      userId: userStore.id,
      // searchResult: searchResult,
    }
    await addSearch(data)
    // getSearchMaterialIds()
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
      query: keyword || searchKeyword.value, // 确保 keyword 已定义（如从响应式变量中获取）
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
  searchKeyword.value = keyword
  fetchMaterialList()
}

// 使用搜索示例
function searchWithExample(text) {
  searchKeyword.value = text
  fetchMaterialList()
  saveToSearchHistory(text)
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
    // getSearchList(params).then(res => {
    //   searchHistory.value = res.data || []

    // })
    // 假设API返回的数据格式需要转换为组件需要的格式
    searchHistory.value = response.data || []
    // console.log('response',response)
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

  try {
    await getSearchMaterialIds(keyword || searchKeyword.value);
    
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
    
    // 处理分页
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    materialList.value = allMaterials.slice(start, end);
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

// 分页处理
function handleSizeChange(size) {
  pageSize.value = size
  fetchMaterialList()
}

function handleCurrentChange(current) {
  currentPage.value = current
  fetchMaterialList()
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

// 关闭弹窗
function handleClose() {
  previewVisible.value = false
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
.main-content {
  display: flex;
  gap: 20px;
  width: 100%;
}

/* 左侧搜索历史样式 */
.sidebar {
  width: 300px;
  flex-shrink: 0;
  .history-section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }
    .history-list {
      .history-item {
          padding: 12px;
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s;
          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
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
            transition: all 0.3s;
            .delete-icon {
              color: #909399;
              font-size: 16px;
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
            margin-bottom: 4px;
          }
          .history-time {
            font-size: 12px;
            color: #909399;
          }
        }
        .history-result {
          font-size: 12px;
          color: #606266;
          margin-top: 8px;
        }
      }
    }
    .no-history {
      text-align: center;
      padding: 40px 20px;
      color: #909399;
      .no-history-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: #c0c4cc;
      }
      p {
        margin: 0;
        font-size: 14px;
      }
    }
    .history-actions {
      margin-top: 16px;
      text-align: center;
    }
  }
}

/* 右侧主内容样式 */
.search-content {
  flex: 1;
  .header-section {
    margin-bottom: 24px;
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }
    .page-description {
      font-size: 14px;
      color: #606266;
      margin: 0;
    }
  }
  .search-box-container {
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    .search-input-wrapper {
      width: 100%;
      max-width: 800px;
      .ai-search-button {
        background-color: #409eff;
        border-color: #409eff;
        color: white;
        &:hover {
          background-color: #66b1ff;
          border-color: #66b1ff;
          color: white;
        }
      }
    }
  }
  .examples-section {
    margin-bottom: 24px;
    h3 {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin: 0 0 12px 0;
    }
    .examples-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .example-tag {
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
      }
    }
  }
  .search-results {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .search-suggestion {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
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
}

.search-result-stats {
  margin-bottom: 20px;
  font-size: 14px;
  color: #606266;
}

/* 网格布局样式 */
.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.material-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  background: white;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.material-preview-container {
  height: 180px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  img {
    width: 95%;
    height: 95%;
    // object-fit: cover;
    contain: content;
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
  padding: 16px;
}

.material-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.material-tags {
  margin-bottom: 12px;
}

.material-upload-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 16px;
}

.material-actions {
  display: flex;
  gap: 8px;
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

.preview-dialog {
  .preview-content {
    display: flex;
    gap: 20px;
    max-height: 600px;
    overflow-y: auto;
    .image-preview,
    .video-preview,
    .document-preview {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      border-radius: 4px;
      min-height: 400px;
      .full-image {
        max-width: 100%;
        max-height: 500px;
        object-fit: contain;
      }
      .video-placeholder,
      .document-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #909399;
        & > span {
          font-size: 16px;
        }
      }
    }
    .material-info {
      flex: 1;
      min-width: 300px;
      h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 500;
        color: #303133;
      }
      .info-row {
        margin-bottom: 15px;
        display: flex;
        align-items: flex-start;
        .info-label {
          width: 80px;
          font-weight: 500;
          color: #606266;
        }
        .info-value {
          flex: 1;
          color: #303133;
        }
      }
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>