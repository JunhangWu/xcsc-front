<template>
    <!-- 素材详情和标注弹窗：核心修复区域 -->
    <el-dialog v-model="dialogVisible" title="素材标注" width="60%" :before-close="handleClose">
        <div class="annotation-dialog">
            <!-- 1. 素材预览区域（无错误，保留原结构） -->
            <div class="material-preview-container">
                <div class="material-preview">
                    <template v-if="currentMaterial.type && currentMaterial.type.includes('image')">
                        <img :src="currentMaterial.url" class="preview-image" />
                    </template>
                    <template v-else-if="currentMaterial.type && currentMaterial.type.includes('video')">
                        <div class="preview-video">
                            <el-icon>
                                <VideoCamera />
                            </el-icon>
                            <span>视频预览区域</span>
                        </div>
                    </template>
                    <template v-else>
                        <div class="preview-file">
                            <el-icon>
                                <Document />
                            </el-icon>
                            <span>文档预览区域</span>
                        </div>
                    </template>
                </div>

                <!-- 素材基本信息 -->
                <div class="material-basic-info">
                    <h4>{{ currentMaterial.name || '未命名素材' }}</h4>
                    <div class="metadata-section">
                        <div class="metadata-grid">
                            <div class="metadata-item">
                                <span class="metadata-label">文件类型：</span>
                                <span class="metadata-value">{{ getFileTypeText(currentMaterial.type) }}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">上传时间：</span>
                                <span class="metadata-value">{{ currentMaterial.uploadTime || '未知' }}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">上传者：</span>
                                <span class="metadata-value">{{ currentMaterial.uploader || '未知' }}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">所属分类：</span>
                                <span class="metadata-value">{{ currentMaterial.category || '未分类' }}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">文件大小：</span>
                                <span class="metadata-value">{{ formatFileSize(currentMaterial.size) }}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">分辨率：</span>
                                <span class="metadata-value">{{ currentMaterial.resolution || '不适用' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. 标注信息区域（修复标签闭合：补充`annotation-info`的闭合标签） -->
            <div class="annotation-info">
                <h3>标注信息</h3>

                <el-tabs v-model="tabActiveName" class="demo-tabs">
                    <el-tab-pane label="标签信息" name="autoLabel">
                        <!-- 标签信息部分 -->
                        <div class="annotation-section">
                            <div style="margin-bottom: 20px; display: flex; justify-content: flex-end;">
                                <el-button @click="handleAIAutoTagging" :type="isAIAutoTagging ? 'default' : 'primary'"
                                    :disabled="isAIAutoTagging">
                                    {{ isAIAutoTagging ? '标注中...' : 'AI标注' }}
                                </el-button>
                            </div>
                            <el-form :model="autoTagForm" label-width="120px">
                                <el-form-item label="场景分类">
                                    <el-select v-model="autoTagForm.sceneCategory" placeholder="请选择场景分类" multiple>
                                        <el-option label="会议场景" value="meeting" />
                                        <el-option label="活动现场" value="event" />
                                        <el-option label="办公场景" value="office" />
                                        <el-option label="户外场景" value="outdoor" />
                                        <el-option label="家庭场景" value="home" />
                                        <el-option label="商业场景" value="business" />
                                    </el-select>
                                </el-form-item>
                                <el-form-item label="核心物体">
                                    <el-input v-model="autoTagForm.coreObjects" placeholder="请输入核心物体，多个用逗号分隔" />
                                </el-form-item>
                                <el-form-item label="活动事件">
                                    <el-input v-model="autoTagForm.activityEvent" placeholder="请输入活动事件描述" />
                                </el-form-item>
                                <el-form-item label="文本信息">
                                    <el-input v-model="autoTagForm.textInfo" placeholder="请输入识别到的文本信息" />
                                </el-form-item>
                                <el-form-item label="颜色色调">
                                    <el-select v-model="autoTagForm.colorTone" placeholder="请选择主要颜色色调" multiple>
                                        <el-option label="红色" value="red" />
                                        <el-option label="蓝色" value="blue" />
                                        <el-option label="绿色" value="green" />
                                        <el-option label="黄色" value="yellow" />
                                        <el-option label="橙色" value="orange" />
                                        <el-option label="紫色" value="purple" />
                                        <el-option label="黑色" value="black" />
                                        <el-option label="白色" value="white" />
                                        <el-option label="灰色" value="gray" />
                                    </el-select>
                                </el-form-item>
                                <el-form-item label="拍摄角度">
                                    <el-select v-model="autoTagForm.shootingAngle" placeholder="请选择拍摄角度">
                                        <el-option label="正面" value="front" />
                                        <el-option label="侧面" value="side" />
                                        <el-option label="俯拍" value="top" />
                                        <el-option label="仰拍" value="bottom" />
                                        <el-option label="鸟瞰" value="birdseye" />
                                        <el-option label="特写" value="closeup" />
                                    </el-select>
                                </el-form-item>
                                <el-form-item label="素材描述">
                                    <el-input v-model="autoTagForm.materialDescription" type="textarea"
                                        placeholder="请输入素材描述"></el-input>
                                </el-form-item>
                            </el-form>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="基本信息" name="artificialLabel">
                        <!-- 基本信息部分 -->
                        <div class="annotation-section">
                            <el-form :model="manualTagForm" label-width="120px">
                                <el-form-item label="时间信息">
                                    <el-date-picker v-model="manualTagForm.timeInfo" type="datetime"
                                        placeholder="选择日期时间" value-format="YYYY-MM-DD HH:mm:ss"></el-date-picker>
                                </el-form-item>
                                <el-form-item label="地点信息">
                                    <el-input v-model="manualTagForm.locationInfo" placeholder="请输入地点信息" />
                                </el-form-item>
                                <el-form-item label="人物姓名">
                                    <el-input v-model="manualTagForm.personNames" placeholder="请输入人物姓名，多个用逗号分隔" />
                                </el-form-item>
                                <el-form-item label="建筑名称">
                                    <el-input v-model="manualTagForm.buildingNames" placeholder="请输入建筑名称" />
                                </el-form-item>
                                <el-form-item label="相关主题">
                                    <el-input v-model="manualTagForm.relatedThemes" placeholder="请输入相关主题，多个用逗号分隔" />
                                </el-form-item>
                                <el-form-item label="专有名词">
                                    <el-input v-model="manualTagForm.properNouns" placeholder="请输入专有名词，多个用逗号分隔" />
                                </el-form-item>
                            </el-form>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="补充标签" name="otherLabel">
                        <!-- 补充标签 -->
                        <div class="annotation-section">
                            <div class="tag-input-section">
                                <el-input v-model="newSupplementTag" placeholder="输入补充标签"
                                    style="width: 200px; margin-right: 10px;" @keyup.enter="addSupplementTag" />
                                <el-button type="primary" size="small" @click="addSupplementTag">添加</el-button>
                            </div>
                            <div class="tag-list">
                                <el-tag v-for="tag in supplementTags" :key="tag" size="small" type="primary" closable
                                    @close="removeSupplementTag(tag)">
                                    {{ tag }}
                                </el-tag>
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>
        </div>

        <!-- 3. 对话框底部按钮（修复：正确使用 el-dialog 的 footer 具名插槽） -->
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">关闭</el-button>
                <el-button type="primary" @click="saveAnnotation">保存标注</el-button>
            </span>
        </template>
    </el-dialog>

</template>

<script setup>
import { ref } from 'vue'


const dialogVisible = ref(false)
const currentMaterial = ref({})
// 补充标签
const supplementTags = ref([])
const newSupplementTag = ref('')

// AI标注状态
const isAIAutoTagging = ref(false)

// 重置标签表单
const resetTagForms = () => {
    // 重置标签信息
    Object.keys(autoTagForm).forEach(key => {
        autoTagForm[key] = typeof autoTagForm[key] === 'string' ? '' : []
    })

    // 重置基本信息
    Object.keys(manualTagForm).forEach(key => {
        manualTagForm[key] = ''
    })

    // 重置补充标签
    supplementTags.value = []
    newSupplementTag.value = ''
}

// 保存标注
const saveAnnotation = () => {
    // 构建完整的标注数据
    const annotationData = {
        materialId: currentMaterial.value.id,
        autoTags: { ...autoTagForm },
        manualTags: { ...manualTagForm },
        supplementTags: [...supplementTags.value]
    }

    // 模拟保存操作
    loading.value = true
    setTimeout(() => {
        loading.value = false
        dialogVisible.value = false
        ElMessage.success('标注信息保存成功')

        // 更新素材状态和标签数据
        const material = materialList.value.find(item => item.id === currentMaterial.value.id)
        if (material) {
            material.status = 'completed'

            // 确保tags对象存在
            if (!material.tags) {
                material.tags = {}
            }

            // 保存完整的标注数据
            material.tags.annotationData = annotationData

            // 保存标注素材数据到localStorage，供首页读取
            try {
                localStorage.setItem('annotationMaterials', JSON.stringify(materialList.value))
                console.log('标注素材数据已保存到localStorage')
            } catch (error) {
                console.error('保存标注素材数据失败:', error)
            }

            // 同时也更新全局素材信息
            try {
                // 获取当前存储的全局素材
                const storedMaterials = JSON.parse(localStorage.getItem('globalMaterials') || '[]')

                // 查找并更新对应的素材
                const globalMaterialIndex = storedMaterials.findIndex(item => item.id === currentMaterial.value.id)
                if (globalMaterialIndex > -1) {
                    if (!storedMaterials[globalMaterialIndex].tags) {
                        storedMaterials[globalMaterialIndex].tags = {}
                    }
                    storedMaterials[globalMaterialIndex].tags.annotationData = annotationData

                    // 重新保存到localStorage
                    localStorage.setItem('globalMaterials', JSON.stringify(storedMaterials))
                }
            } catch (error) {
                console.error('同步素材标签到全局数据失败:', error)
            }
        }

        console.log('保存的标注数据:', annotationData)
    }, 800)
}

// 关闭弹窗
const handleClose = () => {
    dialogVisible.value = false
}

// 添加补充标签
const addSupplementTag = () => {
    if (!newSupplementTag.value.trim()) {
        ElMessage.warning('请输入标签内容')
        return
    }

    if (supplementTags.value.includes(newSupplementTag.value.trim())) {
        ElMessage.warning('该标签已存在')
        return
    }

    supplementTags.value.push(newSupplementTag.value.trim())
    newSupplementTag.value = ''
}

// 移除补充标签
const removeSupplementTag = (tag) => {
    const index = supplementTags.value.indexOf(tag)
    if (index > -1) {
        supplementTags.value.splice(index, 1)
    }
}



// AI自动标注处理函数
const handleAIAutoTagging = () => {
    // 设置标注状态为进行中
    isAIAutoTagging.value = true

    // 模拟AI根据素材内容自动生成标注信息
    ElMessage({ message: '正在进行AI自动标注...', type: 'info' })

    // 清空现有数据，准备填充新的AI生成数据
    autoTagForm.sceneCategory = []
    autoTagForm.coreObjects = ''
    autoTagForm.activityEvent = ''
    autoTagForm.textInfo = ''
    autoTagForm.colorTone = []
    autoTagForm.shootingAngle = ''
    autoTagForm.materialDescription = ''

    // 模拟AI生成的标注数据
    // 延迟显示效果
    setTimeout(() => {
        // 根据素材类型和内容生成不同的标注信息
        if (currentMaterial.value.type && currentMaterial.value.type.includes('image')) {
            autoTagForm.sceneCategory = ['meeting', 'office']
            autoTagForm.coreObjects = '人物,办公设备,文件'
            autoTagForm.activityEvent = '办公会议'
            autoTagForm.textInfo = '会议讨论内容'
            autoTagForm.colorTone = ['blue', 'white', 'gray']
            autoTagForm.shootingAngle = 'front'
            autoTagForm.materialDescription = '室内办公场景下的会议照片'
        } else if (currentMaterial.value.type && currentMaterial.value.type.includes('video')) {
            autoTagForm.sceneCategory = ['event', 'outdoor']
            autoTagForm.coreObjects = '人物,场地,设备'
            autoTagForm.activityEvent = '户外活动'
            autoTagForm.textInfo = '活动现场声音记录'
            autoTagForm.colorTone = ['green', 'blue', 'yellow']
            autoTagForm.shootingAngle = 'birdseye'
            autoTagForm.materialDescription = '户外场景下的活动视频记录'
        } else {
            autoTagForm.sceneCategory = ['office']
            autoTagForm.coreObjects = '文档,文字'
            autoTagForm.activityEvent = '文档编辑'
            autoTagForm.textInfo = '文档内文本内容'
            autoTagForm.colorTone = ['white', 'black']
            autoTagForm.shootingAngle = ''
            autoTagForm.materialDescription = '标准文档资料'
        }

        ElMessage({ message: 'AI标注完成，请检查并根据需要修改！', type: 'success' })

        // 标注完成后恢复按钮状态
        isAIAutoTagging.value = false
    }, 1000)
}

// 格式化文件大小
const formatFileSize = (size) => {
    if (!size) return '未知';

    if (size < 1024) {
        return size + ' B';
    } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
    } else if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
        return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
};
</script>

<style scoped lang="scss">
.annotation-dialog {
    .annotation-content {
        display: flex;
        gap: 20px;
        max-height: 500px;
        overflow-y: auto;

        .material-preview {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f7fa;
            border-radius: 4px;
            min-height: 300px;

            .preview-image {
                max-width: 100%;
                max-height: 400px;
                object-fit: contain;
            }

            .preview-video,
            .preview-file {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #909399;

                span {
                    font-size: 16px;
                }
            }
        }

        .annotation-info {
            flex: 1;

            .annotation-section {
                margin-bottom: 20px;

                h4 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: #303133;
                }

                .tag-input-section {
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                }

                .tag-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
            }
        }
    }
}
</style>