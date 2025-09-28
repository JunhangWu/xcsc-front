import request from '@/utils/request'

// 查询板块（一级文件夹）列表
export function listSection(query) {
  return request({
    url: '/xcsc/section/list',
    method: 'get',
    params: query
  })
}

// 查询板块（一级文件夹）详细
export function getSection(id) {
  return request({
    url: '/xcsc/section/' + id,
    method: 'get'
  })
}

// 新增板块（一级文件夹）
export function addSection(data) {
  return request({
    url: '/xcsc/section',
    method: 'post',
    data: data
  })
}

// 修改板块（一级文件夹）
export function updateSection(data) {
  return request({
    url: '/xcsc/section',
    method: 'put',
    data: data
  })
}

// 删除板块（一级文件夹）
export function delSection(id) {
  return request({
    url: '/xcsc/section/' + id,
    method: 'delete'
  })
}
