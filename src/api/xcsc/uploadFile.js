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
export function uploadFiles(data) {
    return request({
        url: '/file/uploads',
        method: 'post',
        data: data
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

