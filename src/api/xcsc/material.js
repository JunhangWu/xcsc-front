import request from '@/utils/request'

// 查询素材管理列表
export function listMaterial(query) {
  return request({
    url: '/xcsc/material/list',
    method: 'get',
    params: query
  })
}

// 查询素材管理详细
export function getMaterial(materialId) {
  return request({
    url: '/xcsc/material/' + materialId,
    method: 'get'
  })
}

// 新增素材管理
export function addMaterial(data) {
  return request({
    url: '/xcsc/material',
    method: 'post',
    data: data
  })
}

// 修改素材管理
export function updateMaterial(data) {
  return request({
    url: '/xcsc/material',
    method: 'put',
    data: data
  })
}

// 删除素材管理
export function delMaterial(materialId) {
  return request({
    url: '/xcsc/material/' + materialId,
    method: 'delete'
  })
}
