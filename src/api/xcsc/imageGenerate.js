import request from '@/utils/request'

// AI 生成图片
export function generateImage(query) {
  return request({
    url: '/ai/generate-image',
    method: 'get',
    params: query
  })
}

// 上传参考图到 MinIO
export function uploadImage(data, filePath = 'reference') {
  return request({
    url: '/ai/upload-image',
    method: 'post',
    params: { filePath },
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
      skipRepeatSubmit: true
    }
  })
}
