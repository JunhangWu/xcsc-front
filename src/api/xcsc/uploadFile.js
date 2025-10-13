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

// 删除文件夹
export function delFolder(id) {
    return request({
        url: '/folder/' + id,
        method: 'delete'
    })
}
