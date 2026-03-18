import request from '@/utils/request'


// 文件夹列表
export function getFolderList(query) {
    return request({
        url: '/folder/list',
        method: 'get',
        params: query
    })
}
// 文件夹列表
export function getFolderListWithoutPremission(query) {
    return request({
        url: '/folder/listWithoutPremission',
        method: 'get',
        params: query
    })
}
// 获取共享文件夹列表
export function getSharedFolderList() {
    return request({
        url: '/folder/shared/list',
        method: 'get'
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
// 修改文件夹是否共享
export function updateShared(data) {
    const id = data?.id != null ? String(data.id) : ''
    const isShared = data?.isShared
    return request({
        url: '/folder/shared',
        method: 'put',
        params: {
            id,
            isShared
        }
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
// 查询已上传分块
export function checkChunks(query) {
    return request({
        url: '/file/check',
        method: 'get',
        params: query,
        headers: {
            'skipRepeatSubmit': true
        },
    })
}
// 上传单个分块
export function uploadFileChunk(data, config = {}) {
    return request({
        url: '/file/chunk',
        method: 'post',
        data: data,
        headers: {
            'skipRepeatSubmit': true
        },
        ...config
    })
}
// 合并分块
export function mergeFileChunks(data) {
    return request({
        url: '/file/merge',
        method: 'post',
        data: data,
        headers: {
            'skipRepeatSubmit': true
        },
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

// 统计总文件数量
export function countAllFile(query) {
    return request({
        url: '/file/count',
        method: 'get',
        params: query
    })
}

// 根据部门ID统计素材数量
export function countByDeptId(deptId) {
    return request({
        url: '/file/countByDeptId',
        method: 'get',
        params: { deptId }
    })
}

export const getCollectFileList = (params) => request({ url: '/file/collect/list', method: 'get', params });

// 板块分类(按照公司/部门)
export function getDeptCategoryList() {
    return request({
        url: '/dept/listAll',
        method: 'get'
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
// 获取临时fileKey（5分钟有效）
export function getFileEditKey(fileId) {
    return request({
        url: '/file/getFileEditKey',
        method: 'get',
        params: { fileId }
    })
}

// 修改文件
export function updateFile(filePathMapping, fileKey) {
    return request({
        url: '/file',
        method: 'put',
        data: filePathMapping,
        params: { fileKey }
    })
}

// 代理访问MinIO文件
export function minioProxyUrl(params) {
    return request({
        url: '/minio/proxy',
        method: 'get',
        params: params,
        responseType: 'blob'
    })
}
// 下载文件
export function downloadFile(data) {
    return request({
        url: '/minio/download',
        method: 'get',
        params: data
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

