import request from '@/utils/request'

//搜索记录列表
export function getSearchList(query){
    return request({
        url: '/search/list',
        method: 'get',
        params: query
    })
}
//新增搜索记录
export function addSearch(data){
    return request({
        url: '/search',
        method: 'post',
        data: data
    })
}
//删除搜索记录
export function delSearch(query){
    return request({
        url: '/search/del',
        method: 'delete',
        params: query
    })
}