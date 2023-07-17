// API请求
import request from '@/utils/request'

// 保存問卷數據的API
export function saveQuestionnaire(data) {
  return request({
    url: '/saveQuestionnaire',
    method: 'post',
    data
  })
}

export function getQuestionnaire() {
  return request({
    url: '/getQuestionnaire',
    method: 'get'
  })
}
