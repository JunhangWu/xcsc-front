<template>
  <el-button type="primary" plain @click="uploadFile" size="default" :disabled="disabled">
    <el-icon style="margin-right: 6px;">
      <Upload />
    </el-icon>上传文件
  </el-button>
  <el-button type="primary" plain @click="toggleUploadList" size="default" class="upload-list-btn">
    <el-icon style="margin-right: 6px;">
      <Files />
    </el-icon>传输列表
    <span v-if="uploadTaskCount > 0" class="task-count-badge">{{ uploadTaskCount }}</span>
  </el-button>

  <!-- 上传文件 -->
  <el-dialog v-model="uploadDialogVisible" title="上传文件" width="50vw" :before-close="cancelUpload"
    :close-on-click-modal="false" style="margin-top: 20vh;">
    <el-upload v-model:file-list="fileList" class="upload-demo" drag :multiple="uploadType === 'file'" action=""
      :on-change="handleFileChange" :on-remove="handleFileRemove" :auto-upload="false">
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        {{ uploadType === 'file' ? '点击或拖拽文件到此处上传' : '点击或拖拽文件夹到此处上传' }}
        <div class="el-upload__tip"> 支持图片：jpeg / jpg / png / bmp / gif；视频：mp4 / mov / avi / mkv / flv / m4v；文档：docx / doc /
          pdf / pptx
          <br>单个文件大小不超过2048MB，总文件大小不超过5120MB
        </div>
      </div>
    </el-upload>
      
      <!-- 每个文件的上传进度条 -->
      <div v-if="showProgress" class="file-progress-container" style="margin-top: 20px;">
        <div v-for="(fileStatus, index) in fileUploadStatus" :key="index" class="file-progress-item" style="margin-bottom: 15px;">
          <div class="file-name" style="margin-bottom: 8px; font-weight: 500;">{{ fileStatus.fileName }}</div>
          <el-progress 
            :percentage="fileStatus.progress" 
            :status="fileStatus.progress === 100 ? 'success' : 'primary'"
            :stroke-width="12"
            :text-inside="true"
          ></el-progress>
          <div class="file-progress-text" style="margin-top: 5px; font-size: 12px; color: #606266;">
            {{ fileStatus.progress === 100? `处理中，请稍等...` : '正在上传中，请稍候...' }}
            <span v-if="fileStatus.speed" style="margin-left: 15px;">
              速率: {{ fileStatus.speed }}
            </span>
          </div>
        </div>
      </div>
      
    <template #footer>
      <div class="dialogFoot">
        <el-button @click="cancelUpload" :disabled="isUploading">取消</el-button>
        <el-button type="primary" @click="confirmUpload" :disabled="isConfirmDisabled || isUploading" :loading="isUploading">
          {{ isUploading ? '上传中...' : '确认' }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 上传管理面板 -->
  <div v-if="uploadManagerVisible" class="upload-manager-panel">
    <div class="upload-manager-header">
      <span>上传管理</span>
      <el-icon @click="toggleUploadList" style="cursor: pointer; color: #909399;">
        <Close />
      </el-icon>
    </div>
    <div class="upload-manager-body">
      <div v-if="uploadTasks.length === 0" class="upload-manager-empty">
        <el-empty description="暂无上传任务" />
      </div>
      <div v-for="task in uploadTasks" :key="task.id" class="upload-task-item">
        <div class="upload-task-header">
          <span class="upload-task-name">{{ task.fileName }}</span>
          <span :class="['upload-task-status', task.status]">{{ getTaskStatusText(task.status) }}</span>
        </div>
        <div class="upload-task-progress">
          <el-progress 
            :percentage="task.progress" 
            :status="task.progress === 100 ? 'success' : 'primary'"
            :stroke-width="10"
          ></el-progress>
        </div>
        <div class="upload-task-info">
          <span>速度: {{ task.speed || '0 B/s' }}</span>
          <span>进度: {{ task.progress }}%</span>
        </div>
        <div class="upload-task-actions">
          <el-button v-if="task.status === 'uploading'" class="upload-task-action-btn" type="default" size="small" @click="pauseTask(task.id)">
            <el-icon><VideoPause /></el-icon>
          </el-button>
          <el-button v-else-if="task.status === 'paused'" class="upload-task-action-btn" type="default" size="small" @click="resumeTask(task.id)">
            <el-icon><VideoPlay /></el-icon>
          </el-button>
          <el-button class="upload-task-action-btn is-cancel" type="default" size="small" @click="cancelTask(task.id)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    <div class="upload-manager-footer">
      <span>共 {{ uploadTasks.length }} 个任务</span>
      <el-button type="primary" size="small" @click="clearCompletedTasks">
        清空已完成
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { parseTime, } from '@/utils/common'
import { Upload, UploadFilled, Files, Close, VideoPause, VideoPlay, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { checkChunks, uploadFileChunk, mergeFileChunks } from "@/api/xcsc/uploadFile"
import SparkMD5 from 'spark-md5';
import axios from 'axios';
import request from '@/utils/request'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  curFolderObj: {
    type: Object,
    required: true,
  },
  breadcrumbData: {
    type: Array,
    required: true,
  },
  fileListData: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['upload-complete'])

// ==================== 上传弹框与任务管理 ====================
// 上传文件
const uploadDialogVisible = ref(false)
const uploadType = ref('file')// 上传类型
const fileList = ref([])// 文件列表
const isConfirmDisabled = ref(false);// 确认按钮是否禁用
const isUploading = ref(false); // 上传中状态
const uploadProgress = ref(0); // 上传进度（0-100）
const showProgress = ref(false); // 是否显示进度条
const uploadSpeed = ref(''); // 上传速率
let lastLoaded = 0; // 上一次的已上传字节数
let lastTime = 0; // 上一次的时间戳
const fileUploadStatus = ref([]); // 存储每个文件的上传状态和进度

// 上传管理
const uploadManagerVisible = ref(false) // 上传管理面板显示状态
const uploadTasks = ref([]) // 上传任务列表
let taskIdCounter = 1 // 任务ID计数器
let isQueueRunning = false // 队列是否正在处理

// 计算当前任务数量（用于徽章显示）
const uploadTaskCount = computed(() => {
  return uploadTasks.value.filter(task => task.status !== 'completed' && task.status !== 'failed').length
})

// 切换上传管理面板显示状态
function toggleUploadList() {
  uploadManagerVisible.value = !uploadManagerVisible.value
}

// 获取任务状态文本
function getTaskStatusText(status) {
  const statusMap = {
    waiting: '等待中',
    uploading: '上传中',
    paused: '暂停中',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[status] || '未知'
}

// 暂停任务
function pauseTask(taskId) {
  const task = uploadTasks.value.find(t => t.id === taskId)
  if (task && task.status === 'uploading') {
    task.status = 'paused'
    task.isPaused = true
    ElMessage.info(`已暂停上传：${task.fileName}`)
  }
}

// 继续任务
function resumeTask(taskId) {
  const task = uploadTasks.value.find(t => t.id === taskId)
  if (task && task.status === 'paused') {
    task.status = 'uploading'
    task.isPaused = false
    ElMessage.info(`已继续上传：${task.fileName}`)
    // 继续由原有上传流程恢复
  }
}

// 取消任务
function cancelTask(taskId) {
  const taskIndex = uploadTasks.value.findIndex(t => t.id === taskId)
  if (taskIndex !== -1) {
    const task = uploadTasks.value[taskIndex]
    // 取消正在进行的上传请求
    if (task.cancelSource && typeof task.cancelSource.cancel === 'function') {
      task.cancelSource.cancel('上传任务已取消');
    }
    task.status = 'cancelled'
    uploadTasks.value.splice(taskIndex, 1)
    ElMessage.info(`已取消上传：${task.fileName}`)
  }
}

// 清空已完成的任务
function clearCompletedTasks() {
  uploadTasks.value = uploadTasks.value.filter(task => task.status !== 'completed' && task.status !== 'failed')
}

// 单线程队列调度：保证新任务只会按顺序等待
async function runUploadQueue() {
  if (isQueueRunning) {
    return
  }

  isQueueRunning = true
  try {
    while (true) {
      const nextTask = uploadTasks.value.find(task => task.status === 'waiting' && !task.isProcessing)
      if (!nextTask) {
        break
      }

      await processUploadTask(nextTask)

      if (nextTask.status === 'completed') {
        emit('upload-complete', nextTask.folderId)
      }
    }
  } finally {
    isQueueRunning = false
  }
}

function uploadFile() {
  fileList.value = []
  uploadDialogVisible.value = true
}
function cancelUpload() {
  fileList.value = []
  uploadDialogVisible.value = false
  uploadProgress.value = 0
  showProgress.value = false
  uploadSpeed.value = ''
  lastLoaded = 0
  lastTime = 0
  fileUploadStatus.value = []
}
// ==================== 分片上传核心逻辑 ====================
// 存储文件哈希和已上传分块（用于断点续传）
const fileUploadCache = new Map(); 
// 分块大小配置（16MB，可根据需求调整）
const CHUNK_SIZE = 16 * 1024 * 1024; 

// 分块相关工具函数
function getChunkSizeByIndex(fileSize, chunkIndex) {
  const start = chunkIndex * CHUNK_SIZE;
  if (start >= fileSize) {
    return 0;
  }
  return Math.min(CHUNK_SIZE, fileSize - start);
}

function calcUploadedBytes(uploadedChunks, fileSize) {
  if (!Array.isArray(uploadedChunks) || uploadedChunks.length === 0) {
    return 0;
  }
  return uploadedChunks.reduce((sum, idx) => sum + getChunkSizeByIndex(fileSize, idx), 0);
}

function formatSpeed(speedBps) {
  if (!Number.isFinite(speedBps) || speedBps <= 0) {
    return '0 B/s';
  }
  if (speedBps < 1024) {
    return `${speedBps.toFixed(2)} B/s`;
  }
  if (speedBps < 1024 * 1024) {
    return `${(speedBps / 1024).toFixed(2)} KB/s`;
  }
  return `${(speedBps / (1024 * 1024)).toFixed(2)} MB/s`;
}
async function calculateFastHash(file) {
  return new Promise((resolve) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    const size = file.size;
    const sampleSize = 2 * 1024 * 1024; // 每段抽样 2MB

    // 抽样策略：开头 2MB + 中间 2MB + 结尾 2MB
    const chunks = [file.slice(0, sampleSize)];
    if (size > sampleSize) {
      const mid = Math.floor(size / 2);
      chunks.push(file.slice(mid, mid + sampleSize));
      chunks.push(file.slice(size - sampleSize, size));
    }

    let current = 0;
    reader.onload = (e) => {
      spark.append(e.target.result);
      current++;
      if (current < chunks.length) {
        readNext();
      } else {
        // 关键：混合文件总大小，进一步降低碰撞概率
        spark.append(new TextEncoder().encode(size.toString()));
        resolve(spark.end());
      }
    };

    const readNext = () => reader.readAsArrayBuffer(chunks[current]);
    readNext();
  });
}
async function calculateFileHash(file) {
  return new Promise((resolve) => {
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    const chunkSize = 16 * 1024 * 1024; // 计算哈希时的切片大小（2MB）
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;

    fileReader.onload = function (e) {
      spark.append(e.target.result);
      currentChunk++;
      if (currentChunk < chunks) {
        loadNextChunk();
      } else {
        resolve(spark.end()); // 返回文件唯一哈希
      }
    };

    function loadNextChunk() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNextChunk();
  });
}

// 工具函数：查询已上传分块（后端接口）
async function getUploadedChunks(fileHash) {
  try {
    const res = await checkChunks({ fileHash });
    return res.data.uploadedChunks || []; // 后端返回已上传的分块索引数组
  } catch (e) {
    console.error('查询已上传分块失败', e);
    return [];
  }
}

// 工具函数：上传单个分块
async function uploadChunk(fileHash, chunkIndex, chunk, folderId, folderPath, fileLastModified, fileIndex) {
  const formData = new FormData();
  formData.append('fileChunk', chunk);
  formData.append('fileHash', fileHash);
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', Math.ceil(chunk.fileSize / CHUNK_SIZE));
  formData.append('folderId', folderId);
  formData.append('folderPath', folderPath);
  formData.append('eventTimes', fileLastModified);
  formData.append('fileName', chunk.fileName);

  // 分块上传进度监听（用于计算整体进度）
  const config = {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && fileUploadStatus.value[fileIndex]) {
        const status = fileUploadStatus.value[fileIndex];
        const baseUploadedBytes = status.uploadedBytes || 0;
        const currentLoaded = baseUploadedBytes + progressEvent.loaded;
        const progress = (currentLoaded / chunk.fileSize) * 100;
        status.progress = Math.min(Math.round(progress), 100);
        
        // 计算对应文件的实时上传速率
        const currentTime = Date.now();
        if (status.lastTime > 0) {
          const timeDiff = (currentTime - status.lastTime) / 1000;
          const loadedDiff = currentLoaded - status.lastLoaded;
          if (timeDiff > 0) {
            status.speed = formatSpeed(loadedDiff / timeDiff);
          }
        }
        status.lastLoaded = currentLoaded;
        status.lastTime = currentTime;
      }
    }
  };

  const res = await uploadFileChunk(formData, config);
  if (fileUploadStatus.value[fileIndex]) {
    const status = fileUploadStatus.value[fileIndex];
    status.uploadedBytes = (status.uploadedBytes || 0) + chunk.size;
    status.lastLoaded = status.uploadedBytes;
  }
  return res;
}

// 工具函数：合并分块
async function mergeChunks(fileHash, fileName, totalChunks, folderId, folderPath, eventTimes, contentType) {
  // debugger
  // console.log("执行到debugger之后");
  return mergeFileChunks({
    fileHash,
    fileName,
    totalChunks,
    folderId,
    folderPath,
    eventTimes,
    contentType
  });
}

// 改造后的确认上传函数
async function confirmUpload() {
  // 1. 保留你原有文件大小校验逻辑（可选）
  // const totalSize = fileList.value.reduce((sum, f) => sum + ((f.raw || f.originFileObj || f).size || 0), 0);
  // const maxTotalSize = 5120 * 1024 * 1024; // 5120MB
  // if (totalSize > maxTotalSize) {
  //   const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  //   ElMessage.error(`所有文件总大小（${totalSizeMB}MB）超过限制（5120MB）`);
  //   return;
  // }

  // 2. 处理每个文件的分块上传
  const files = fileList.value.map(item => item.raw || item.originFileObj || item);
  const folderId = props.curFolderObj.bizId;
  let folderPath = '';
  props.breadcrumbData.forEach((item, idx) => {
    folderPath += item.filePath;
    if (idx !== props.breadcrumbData.length - 1) {
      folderPath += '/';
    }
  });

  // 3. 为每个文件创建上传任务
  if (files.length === 0) {
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const task = reactive({
      id: taskIdCounter++,
      fileName: file.name,
      progress: 0,
      speed: '0 B/s',
      status: 'waiting',
      file: file,
      folderId: folderId,
      folderPath: folderPath,
      fileLastModified: parseTime(file.lastModifiedDate),
      contentType: file.type,
      fileSize: file.size,
      totalBytes: file.size,
      uploadedBytes: 0,
      lastLoaded: 0,
      lastTime: 0,
      chunks: [],
      uploadedChunks: [],
      isPaused: false,
      isProcessing: false,
      cancelToken: null,
      cancelSource: null
    });
    uploadTasks.value.push(task);
  }

  // 4. 关闭上传对话框并显示提示
  uploadDialogVisible.value = false;
  ElMessage.success('任务已添加后台运行！');

  // 5. 后台执行上传任务（若已有任务在上传，则只追加到队列）
  runUploadQueue();
}

// 处理单个上传任务
async function processUploadTask(task) {
  if (task.isProcessing) {
    return;
  }
  task.isProcessing = true;

  try {
    // 更新任务状态为上传中
    task.status = 'uploading';
    
    const file = task.file;
    const fileName = task.fileName;
    const fileSize = task.fileSize;
    const contentType = task.contentType;
    const fileLastModified = task.fileLastModified;
    const folderId = task.folderId;
    const folderPath = task.folderPath;
    
    // 计算文件哈希（用于秒传/断点续传）
    const fileHash = await calculateFastHash(file);
    
    // 查询已上传分块（断点续传核心）
    const uploadedChunks = await getUploadedChunks(fileHash);
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const uploadedBytes = calcUploadedBytes(uploadedChunks, fileSize);
    task.uploadedBytes = uploadedBytes;
    task.lastLoaded = uploadedBytes;
    if (uploadedBytes > 0) {
      task.progress = Math.min(Math.round((uploadedBytes / fileSize) * 100), 100);
    }

    // 秒传判断：如果所有分块都已上传，直接合并
    if (uploadedChunks.length === totalChunks) {
      await mergeChunks(fileHash, fileName, totalChunks, folderId, folderPath, fileLastModified, contentType);
      task.progress = 100;
      task.status = 'completed';
      ElMessage.success(`${fileName} 秒传成功！`);
      return;
    }

    // 分块上传：只传未上传的分块
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // 检查任务是否被暂停
      while (task.status === 'paused') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 检查任务是否被取消
      if (task.status === 'cancelled') {
        return;
      }

      // 跳过已上传的分块
      if (uploadedChunks.includes(chunkIndex)) {
        continue;
      }

      // 切分文件块
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = file.slice(start, end);
      // 给分块附加元信息
      chunk.fileName = fileName;
      chunk.fileSize = fileSize;
      chunk.totalChunks = totalChunks;

      // 上传当前分块
      await uploadChunkWithProgress(fileHash, chunkIndex, chunk, folderId, folderPath, fileLastModified, task);
      task.uploadedBytes = (task.uploadedBytes || 0) + chunk.size;
    }

    // 所有分块上传完成，合并分块
    await mergeChunks(fileHash, fileName, totalChunks, folderId, folderPath, fileLastModified, contentType);
    task.progress = 100;
    task.status = 'completed';
    ElMessage.success(`${fileName} 上传完成！`);
  } catch (e) {
    // 检查是否是取消操作
    if (e.message && e.message.includes('上传任务已取消')) {
      console.log('上传任务已取消:', task.fileName);
      task.status = 'cancelled';
    } else {
      console.error('上传失败', e);
      task.status = 'failed';
      ElMessage.error(`${task.fileName} 上传失败：${e.message}`);
    }
  } finally {
    task.isProcessing = false;
  }
}

// 导入 axios 用于创建 CancelToken

// 上传分块并更新任务进度
async function uploadChunkWithProgress(fileHash, chunkIndex, chunk, folderId, folderPath, fileLastModified, task) {
  // 创建 CancelToken
  const cancelSource = axios.CancelToken.source();
  task.cancelSource = cancelSource;
  task.cancelToken = cancelSource.token;

  const formData = new FormData();
  formData.append('fileChunk', chunk);
  formData.append('fileHash', fileHash);
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', Math.ceil(chunk.fileSize / CHUNK_SIZE));
  formData.append('folderId', folderId);
  formData.append('folderPath', folderPath);
  formData.append('eventTimes', fileLastModified);
  formData.append('fileName', chunk.fileName);

  // 分块上传进度监听（用于计算整体进度）
  const config = {
    cancelToken: cancelSource.token,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const baseUploadedBytes = task.uploadedBytes || 0;
        const currentLoaded = baseUploadedBytes + progressEvent.loaded;
        const progress = (currentLoaded / task.fileSize) * 100;
        task.progress = Math.min(Math.round(progress), 100);
        
        // 计算对应任务的实时上传速率
        const currentTime = Date.now();
        if (task.lastTime > 0) {
          const timeDiff = (currentTime - task.lastTime) / 1000;
          const loadedDiff = currentLoaded - task.lastLoaded;
          if (timeDiff > 0) {
            task.speed = formatSpeed(loadedDiff / timeDiff);
          }
        }
        task.lastLoaded = currentLoaded;
        task.lastTime = currentTime;
      }
    }
  };

  try {
    return await uploadFileChunk(formData, config);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('上传被取消:', error.message);
      throw error;
    }
    throw error;
  }
}
// ==================== 上传前校验与文件选择处理 ====================
// 支持的文件格式
const supportedFormats = {
  image: ['jpeg', 'jpg', 'png', 'bmp', 'gif'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'm4v'],
  document: ['docx', 'doc', 'pptx', 'pdf']
}

// 检查文件格式是否支持
const isSupportedFormat = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  return Object.values(supportedFormats).flat().includes(ext)
}

// 计算字符串的UTF8字符数
const getUtf8Length = (str) => {
  if (!str) return 0;
  // 使用TextEncoder将字符串编码为UTF-8，然后获取字节长度
  return new TextEncoder().encode(str).length;
}
const handleBeforeUpload = (file) => {
  // 校验文件名UTF8字符数
  const utf8Length = getUtf8Length(file.name);
  if (utf8Length > 255) {
    ElMessage.error(`文件名UTF8字符数超过限制（${utf8Length}/255），请缩短文件名后上传`);
    return false;
  }
  
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
  // // 检查文件大小（可选，可根据需要添加）
  // const maxSize = 2048 * 1024 * 1024 // 2048MB
  // if (file.size > maxSize) {
  //   ElMessage.error(`文件 ${file.name} 大小超过限制（2048MB）`)
  //   return false
  // }
  // 校验同名
  const fileName = file.name;
  const existNames = props.fileListData.map(item => {
    const path = item.minioPath || '';
    const idx = path.lastIndexOf('/');
    return idx !== -1 ? path.substring(idx + 1) : path;
  });
  if (existNames.includes(fileName)) {
    ElMessage.error(`已存在同名文件：${fileName}，请勿重复上传！`);
    return false;
  }
  return true
}
// 文件变化处理
const handleFileChange = (file, fileList) => {
  console.log('==file====', file);
  isConfirmDisabled.value = true;
  let hasUploadError = false; // 标记是否存在不可上传的错误
  // 检查所有文件的UTF8字符数
  const overLengthFiles = fileList.filter(file => getUtf8Length(file.name) > 244);
  console.log("overLengthFiles",overLengthFiles.value)
  if (overLengthFiles.length > 0) {
    ElMessage.error(`文件名字符数超过限制：${overLengthFiles.map(file => file.name).join('、')}，请缩短文件名后上传！`);
    hasUploadError = true;
    // 移除不符合要求的文件
    // fileList.value = fileList.filter(f => getUtf8Length(f.name) <= 255);
    return false
  }
  
  // // 检查单个文件大小
  // const maxSize = 2048 * 1024 * 1024 // 2048MB
  // if (file.size > maxSize) {
  //   ElMessage.error(`文件 ${file.name} 大小超过限制（2048MB）`)
  //   hasUploadError = true;
  //   return false
  // }
  
  // // 检查所有文件总大小不超过5120MB
  // const totalSize = fileList.reduce((sum, f) => sum + (f.size || 0), 0);
  // const maxTotalSize = 5120 * 1024 * 1024; // 500MB
  // if (totalSize > maxTotalSize) {
  //   const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  //   ElMessage.error(`所有文件总大小（${totalSizeMB}MB）超过限制（5120MB）`)
  //   hasUploadError = true;
  //   return false
  // }
  // 检查文件格式
  const invalidFiles = fileList.filter(f => !isSupportedFormat(f.name))
  if (invalidFiles.length > 0) {
    ElMessage.error(`素材格式不符合，请上传支持的文件格式`)
    hasUploadError = true;
    // 移除不支持格式的文件
    fileList.value = fileList.filter(f => isSupportedFormat(f.name))
    return
  }
    // 检查上传列表中是否存在相同文件名的文件
  const fileNames = fileList.map(f => f.name);
  const duplicateNamesInList = fileNames.filter((name, index) => fileNames.indexOf(name) !== index);
  const uniqueDuplicateNames = [...new Set(duplicateNamesInList)];

  if (uniqueDuplicateNames.length > 0) {
    ElMessage.error(`上传列表中存在重复文件：${uniqueDuplicateNames.join('、')}，请移除重复文件！`);
    hasUploadError = true;
    // 移除重复文件，只保留每个文件名的第一个实例
    const uniqueFiles = [];
    const seenNames = new Set();
    for (const f of fileList) {
      if (!seenNames.has(f.name)) {
        seenNames.add(f.name);
        uniqueFiles.push(f);
      }
    }
    fileList.value = uniqueFiles;
  }

  // 校验同名（与已存在的文件）
  const fileName = file.name;
  const existNames = props.fileListData.map(item => {
    // const path = item.minioPath || '';
    // const idx = path.lastIndexOf('/');
    // return idx !== -1 ? path.substring(idx + 1) : path;
    return item.fileName || '';
  });

  // 删除 fileList.value 中与已存在文件同名的文件，并提示
  const duplicateFiles = fileList.filter(f => existNames.includes(f.name));
  if (duplicateFiles.length > 0) {
    ElMessage.error(`已存在同名文件：${duplicateFiles.map(f => f.name).join('、')}，请勿重复上传！`);
    hasUploadError = true;
    fileList.value = fileList.filter(f => !existNames.includes(f.name));
  }

  isConfirmDisabled.value = hasUploadError || fileList.length === 0;

}

// 处理文件移除
function handleFileRemove(file, fileList) {
  // 在文件被移除后调用handleFileChange逻辑进行验证
  handleFileChange(file, fileList);
}

// 为正文编辑器提供可复用上传方法
async function uploadArticleImage(file) {
  if (!file) {
    throw new Error('未选择图片文件')
  }
  const formData = new FormData()
  formData.append('file', file)
  const res = await request({
    url: '/article/uploadImage',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      'skipRepeatSubmit': true
    }
  })
  return res
}

defineExpose({
  uploadArticleImage
})
</script>

<style scoped>
/* 对话框样式优化 */
.dialogFoot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 上传列表按钮样式 */
.upload-list-btn {
  position: relative;
}

.task-count-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  background-color: #f56c6c;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  padding: 0 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 上传管理面板样式 */
.upload-manager-panel {
  position: fixed;
  /* bottom: 20px;
  right: 20px; */
  top: 260px;
  right: 20px;
  width: 440px;
  max-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.upload-manager-header {
  padding: 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
}

.upload-manager-body {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
}

.upload-task-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 10px;
  background-color: #fafafa;
}

.upload-task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.upload-task-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.upload-task-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #ecf5ff;
  color: #409eff;
}

.upload-task-status.waiting {
  background-color: #ecf5ff;
  color: #409eff;
}

.upload-task-status.uploading {
  background-color: #f0f9eb;
  color: #67c23a;
}

.upload-task-status.paused {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.upload-task-status.completed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.upload-task-status.failed {
  background-color: #fef0f0;
  color: #f56c6c;
}

.upload-task-progress {
  margin: 8px 0;
}

.upload-task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.upload-task-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.upload-task-actions .el-button {
  padding: 4px 12px;
  font-size: 16px;
}

.upload-task-action-btn {
  border-radius: 10px;
  height: 28px;
  width: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border-color: #ebeef5;
  color: #409eff;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.upload-task-action-btn :deep(.el-icon) {
  font-size: 16px;
}

.upload-task-action-btn:hover {
  transform: translateY(-1px);
}

.upload-task-action-btn:active {
  transform: translateY(0);
  filter: brightness(0.95);
}

.upload-task-action-btn.is-cancel {
  background-color: #ffffff;
  border-color: #ebeef5;
  color: #f56c6c;
}

.upload-manager-footer {
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-manager-empty {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
