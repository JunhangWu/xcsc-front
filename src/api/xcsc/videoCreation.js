import request from '@/utils/request'

export function generateStoryboard(data) {
  return request({
    url: '/ai/video/storyboard',
    method: 'post',
    data,
    headers: {
      isToken: false,
      skipRepeatSubmit: true
    }
  })
}

export function extractShotTags(data) {
  return request({
    url: '/ai/video/extract-tags',
    method: 'post',
    data,
    headers: {
      isToken: false,
      skipRepeatSubmit: true
    }
  })
}

export function searchShotAssets(data) {
  return request({
    url: '/ai/video/search-assets',
    method: 'post',
    data,
    headers: {
      skipRepeatSubmit: true
    }
  })
}

export function composeVideo(data) {
  return request({
    url: '/ai/video/compose',
    method: 'post',
    data,
    headers: {
      skipRepeatSubmit: true
    }
  })
}

export function getVideoComposeTask(taskId) {
  return request({
    url: `/ai/video/task/${taskId}`,
    method: 'get'
  })
}

export function getVideoCreationResult(id) {
  return request({
    url: `/ai/video/result/${id}`,
    method: 'get'
  })
}
