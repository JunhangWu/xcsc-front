// 获取列表行的唯一键
export function getListRowKey(row) {
  if (row?._rowType === 'folder') {
    return `folder-${row.bizId || row.id || row.filePath}`
  }
  return `file-${row?.id || row?.fileName || ''}`
}

function includesExt(path, exts) {
  return exts.some(ext => path.toLowerCase().includes(ext))
}

export function isImage(path) {
  return includesExt(path, ['jpg', 'jpeg', 'png', 'bmp', 'gif'])
}

export function isVideo(path) {
  return includesExt(path, ['mp4', 'mov', 'avi', 'mkv', 'flv', 'm4v'])
}

//获取文件名
// 获取文件名
export function getFileName(path) {
  if (!path) return ''
  const idx = path.lastIndexOf('/')
  return idx !== -1 ? path.substring(idx + 1) : path
}

// 格式化文件大小
export function formatFileSize(bytes) {
  //TODO
  // if (!bytes) return '0 MB';
  // if (bytes < 1024) return bytes + ' B';
  // if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  // return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  // if (!bytes) return '未知';
  // if (bytes < 1024) return bytes + ' B';
  // if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  // return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return bytes + ' MB'
}

// 格式化日期时间
export function formatDateTime(dateStr) {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '--'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 获取文件类型
export function getFileType(path) {
  if (!path) return '未知'
  const idx = path.lastIndexOf('.')
  return idx !== -1 ? path.substring(idx + 1).toUpperCase() : '未知'
}

// 获取列表行的文件类型
export function getListFileType(row) {
  if (row?._rowType === 'folder') return '文件夹'
  const fileType = getFileType(row?.minioPath || '')
  if (fileType === '未知') return fileType
  return `${fileType.toLowerCase()}文件`
}

// 获取列表行的大小
export function getListRowSize(row) {
  if (row?._rowType === 'folder') return '--'
  return formatFileSize(row?.fileSize)
}
