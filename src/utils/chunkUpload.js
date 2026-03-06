import { checkChunks, uploadFileChunk, mergeFileChunks } from "@/api/xcsc/uploadFile"
import SparkMD5 from 'spark-md5';
import axios from 'axios';

const CHUNK_SIZE = 16 * 1024 * 1024;

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
    const sampleSize = 2 * 1024 * 1024;

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
        spark.append(new TextEncoder().encode(size.toString()));
        resolve(spark.end());
      }
    };

    const readNext = () => reader.readAsArrayBuffer(chunks[current]);
    readNext();
  });
}

async function getUploadedChunks(fileHash) {
  try {
    const res = await checkChunks({ fileHash });
    return res.data.uploadedChunks || [];
  } catch (e) {
    console.error('查询已上传分块失败', e);
    return [];
  }
}

async function uploadChunk(fileHash, chunkIndex, chunk, folderId, folderPath, fileLastModified, fileName, onProgress) {
  const formData = new FormData();
  formData.append('fileChunk', chunk);
  formData.append('fileHash', fileHash);
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', Math.ceil(chunk.fileSize / CHUNK_SIZE));
  formData.append('folderId', folderId);
  formData.append('folderPath', folderPath);
  formData.append('eventTimes', fileLastModified);
  formData.append('fileName', fileName);

  const config = {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        onProgress(progressEvent);
      }
    }
  };

  const res = await uploadFileChunk(formData, config);
  return res;
}

async function mergeChunks(fileHash, fileName, totalChunks, folderId, folderPath, eventTimes, contentType) {
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

export async function uploadFileWithChunk(file, folderId, folderPath, options = {}) {
  const {
    onProgress,
    onSpeedUpdate,
    onComplete,
    onError,
    fileLastModified,
    contentType
  } = options;

  try {
    const fileHash = await calculateFastHash(file);
    const uploadedChunks = await getUploadedChunks(fileHash);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadedBytes = calcUploadedBytes(uploadedChunks, file.size);
    
    let currentUploadedBytes = uploadedBytes;
    let lastTime = Date.now();
    let lastLoaded = uploadedBytes;

    if (uploadedBytes > 0 && onProgress) {
      onProgress((uploadedBytes / file.size) * 100);
    }

    if (uploadedChunks.length === totalChunks) {
      await mergeChunks(fileHash, file.name, totalChunks, folderId, folderPath, fileLastModified, contentType);
      if (onProgress) onProgress(100);
      if (onComplete) onComplete();
      return { success: true, fileHash };
    }

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (uploadedChunks.includes(chunkIndex)) {
        continue;
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      chunk.fileName = file.name;
      chunk.fileSize = file.size;

      await uploadChunk(fileHash, chunkIndex, chunk, folderId, folderPath, fileLastModified, file.name, (progressEvent) => {
        const currentLoaded = currentUploadedBytes + progressEvent.loaded;
        const progress = (currentLoaded / file.size) * 100;
        
        if (onProgress) {
          onProgress(Math.min(progress, 100));
        }

        if (onSpeedUpdate) {
          const currentTime = Date.now();
          const timeDiff = (currentTime - lastTime) / 1000;
          const loadedDiff = currentLoaded - lastLoaded;
          
          if (timeDiff > 0) {
            onSpeedUpdate(formatSpeed(loadedDiff / timeDiff));
          }
          
          lastTime = currentTime;
          lastLoaded = currentLoaded;
        }
      });

      currentUploadedBytes += chunk.size;
    }

    await mergeChunks(fileHash, file.name, totalChunks, folderId, folderPath, fileLastModified, contentType);
    
    if (onProgress) onProgress(100);
    if (onComplete) onComplete();
    
    return { success: true, fileHash };
  } catch (error) {
    if (onError) onError(error);
    return { success: false, error };
  }
}
