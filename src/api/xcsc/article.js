import request from '@/utils/request'

// 查询稿件列表
export function listArticle(query) {
  return request({
    url: '/article/list',
    method: 'get',
    params: query
  })
}

// 查询稿件详细
export function getArticle(id) {
  return request({
    url: '/article/' + id,
    method: 'get'
  })
}

// 新增稿件
export function addArticle(data) {
  return request({
    url: '/article',
    method: 'post',
    data: data
  })
}

// 修改稿件
export function updateArticle(data) {
  return request({
    url: '/article',
    method: 'put',
    data: data
  })
}

// 删除稿件
export function delArticle(id) {
  return request({
    url: '/article/' + id,
    method: 'delete'
  })
}
