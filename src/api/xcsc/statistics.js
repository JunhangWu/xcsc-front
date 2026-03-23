import request from '@/utils/request'

// 统计近 30 天每日新增素材数量
export function getMaterialIncreaseRecent30Days() {
  return request({
    url: '/statistics/material/increase/recent30days',
    method: 'get'
  })
}

// 统计稿件总量
export function getArticleTotal(article) {
  return request({
    url: '/statistics/article/total',
    method: 'get',
    params: article
  })
}

// 统计本月新增素材量
export function getMaterialIncreaseCurrentMonth() {
  return request({
    url: '/statistics/material/increase/currentMonth',
    method: 'get'
  })
}

// 统计本月新增稿件量
export function getArticleIncreaseCurrentMonth() {
  return request({
    url: '/statistics/article/increase/currentMonth',
    method: 'get'
  })
}

// 统计近 30 天每日新增稿件数量
export function getArticleIncreaseRecent30Days() {
  return request({
    url: '/statistics/article/increase/recent30days',
    method: 'get'
  })
}

// 统计本月素材上传量前十名（按创建人）
export function getMaterialTop10ByUser() {
  return request({
    url: '/statistics/material/top10/byUser',
    method: 'get'
  })
}

// 统计本月稿件上传量前十名（按创建人）
export function getArticleTop10ByUser() {
  return request({
    url: '/statistics/article/top10/byUser',
    method: 'get'
  })
}

// 统计素材总数（按部门）
export function getMaterialTotalByDept(deptId) {
  return request({
    url: '/statistics/material/total/byDept',
    method: 'get',
    params: { deptId }
  })
}

// 统计稿件总数（按部门）
export function getArticleTotalByDept(deptId) {
  return request({
    url: '/statistics/article/total/byDept',
    method: 'get',
    params: { deptId }
  })
}

// 统计各部门稿件通过/不通过数量
export function getArticleStatusByDept() {
  return request({
    url: '/statistics/article/status/byDept',
    method: 'get'
  })
}