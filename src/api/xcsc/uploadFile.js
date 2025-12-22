import request from '@/utils/request'


// 文件夹列表
export function getFolderList(query) {
    return request({
        url: '/folder/list',
        method: 'get',
        params: query
    })
}
// 新增文件夹
export function addFolder(data) {
    return request({
        url: '/folder',
        method: 'post',
        data: data
    })
}
// 修改文件夹名称
export function updateFolder(data) {
    return request({
        url: '/folder',
        method: 'put',
        data: data
    })
}

// 删除文件夹
export function delFolder(id) {
    return request({
        url: '/folder/' + id,
        method: 'delete'
    })
}

// 上传文件
export function uploadFiles(data, config = {}) {
    return request({
        url: '/file/uploads',
        method: 'post',
        data: data,
        ...config
    })
}
// 文件列表
export function getFileList(query) {
    return request({
        url: '/file/list',
        method: 'get',
        params: query
    })
}
// AI标注标签
export function AIMark(query) {
    return request({
        url: '/file/handle',
        method: 'get',
        params: query
    })
}
// 删除文件
export function delFile(id) {
    return request({
        url: '/file/' + id,
        method: 'delete'
    })
}
// 修改文件
export function updateFile(data) {
    return request({
        url: '/file',
        method: 'put',
        data: data
    })
}
// 首页文件列表
export function getFileIndexList(query) {
    return request({
        url: '/file/index/list',
        method: 'get',
        params: query
    })
}

//根据id批量查询文件
export function getFileBatch(idList){
    return request({
        url: `/file/ids`,
        method: 'post',
        data: idList,
        headers: {
        'Content-Type': 'application/json'
        }
    })
}

//收藏列表
export function getCollectionList(query){
    return request({
        url: '/collection/list',
        method: 'get',
        params: query
    })
}
//新增收藏
export function addCollection(data){
    return request({
        url: '/collection',
        method: 'post',
        data: data
    })
}
//删除收藏
export function delCollection(query){
    return request({
        url: '/collection/del',
        method: 'delete',
        params: query
    })
}

