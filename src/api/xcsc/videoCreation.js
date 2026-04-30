import request from '@/utils/request'

export function generateStoryboard(data) {
  return request({
    url: '/ai/video/storyboard',
    method: 'post',
    data,
    headers: {
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
