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
                                <span class="metadata-value">{{ getFileTypeText(currentMaterial.minioPath) }}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">上传时间：</span>
                                <span class="metadata-value">{{ parseTime(currentMaterial.createTime) }}</span>
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

                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. 标注信息区域 -->
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
                                <!-- v-if="currentMaterial.annotationStatus == 0" -->
                                <!-- <el-tag :type="primary" v-else>AI已标注</el-tag> -->
                            </div>
                            <el-form :model="autoTagForm" label-width="120px">
                                <el-form-item label="场景分类">
                                    <el-input v-model="autoTagForm.sceneCategory" placeholder="请输入场景分类，多个用逗号分隔" />
                                    <!-- <el-select v-model="autoTagForm.sceneCategory" placeholder="请选择场景分类" multiple>
                                        <el-option label="会议场景" value="meeting" />
                                        <el-option label="活动现场" value="event" />
                                        <el-option label="办公场景" value="office" />
                                        <el-option label="户外场景" value="outdoor" />
                                        <el-option label="家庭场景" value="home" />
                                        <el-option label="商业场景" value="business" />
                                    </el-select> -->
                                </el-form-item>
                                <el-form-item label="人物行为">
                                    <el-input v-model="autoTagForm.characterBehavior" placeholder="请输入人物行为，多个用逗号分隔" />
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
                                    <el-input v-model="autoTagForm.colorTone" placeholder="请输入颜色色调" />
                                    <!-- <el-select v-model="autoTagForm.colorTone" placeholder="请选择主要颜色色调" multiple>
                                        <el-option label="红色" value="red" />
                                        <el-option label="蓝色" value="blue" />
                                        <el-option label="绿色" value="green" />
                                        <el-option label="黄色" value="yellow" />
                                        <el-option label="橙色" value="orange" />
                                        <el-option label="紫色" value="purple" />
                                        <el-option label="黑色" value="black" />
                                        <el-option label="白色" value="white" />
                                        <el-option label="灰色" value="gray" />
                                    </el-select> -->
                                </el-form-item>
                                <el-form-item label="拍摄角度">
                                    <el-input v-model="autoTagForm.shootingAngle" placeholder="请输入拍摄角度" />
                                    <!-- <el-select v-model="autoTagForm.shootingAngle" placeholder="请选择拍摄角度">
                                        <el-option label="正面" value="front" />
                                        <el-option label="侧面" value="side" />
                                        <el-option label="俯拍" value="top" />
                                        <el-option label="仰拍" value="bottom" />
                                        <el-option label="鸟瞰" value="birdseye" />
                                        <el-option label="特写" value="closeup" />
                                    </el-select> -->
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
                    <!-- 补充标签 -->
                    <!-- <el-tab-pane label="补充标签" name="otherLabel">
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
                    </el-tab-pane> -->
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
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AIMark } from "@/api/xcsc/uploadFile"
import { updateFile } from "@/api/xcsc/uploadFile"

const dialogVisible = ref(false)
const currentMaterial = reactive({})
const tabActiveName = ref('autoLabel')

// 补充标签
const supplementTags = ref([])
const newSupplementTag = ref('')

// AI标注状态
const isAIAutoTagging = ref(false)

// 标注信息 - 标签信息（7个维度）
const autoTagForm = reactive({
    sceneCategory: [], // 场景分类
    coreObjects: '', // 核心物体
    activityEvent: '', // 活动事件
    textInfo: '', // 文本信息
    colorTone: [], // 颜色色调
    shootingAngle: '', // 拍摄角度
    materialDescription: '' // 素材描述
})

// 标注信息 - 基本信息（6个维度）
const manualTagForm = reactive({
    timeInfo: '', // 时间信息
    locationInfo: '', // 地点信息
    personNames: '', // 人物姓名
    buildingNames: '', // 建筑名称
    relatedThemes: '', // 相关主题
    properNouns: '' // 专有名词
})


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
    // supplementTags.value = []
    // newSupplementTag.value = ''
}

// 保存标注
const saveAnnotation = () => {
    // 构建完整的标注数据
    let params = {
        id: currentMaterial.id,
        annotationStatus: "2",
    }
    updateFile(params).then(res => {
        console.log("标注状态更新成功", res)
        ElMessage.success('标注保存成功！')
        // 关闭窗口
        dialogVisible.value = false
        // 清空数据
        Object.keys(currentMaterial).forEach(key => {
            delete currentMaterial[key]
        })
        // 清空表单
        Object.keys(autoTagForm).forEach(key => {
            autoTagForm[key] = typeof autoTagForm[key] === 'string' ? '' : []
        })
        Object.keys(manualTagForm).forEach(key => {
            manualTagForm[key] = ''
        })
        // 发送事件刷新文件列表
        emit("updateFileList");
    })
    const annotationData = {
        materialId: currentMaterial.id,
        autoTags: { ...autoTagForm },
        manualTags: { ...manualTagForm },
        // supplementTags: [...supplementTags.value]
    }
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
const emit = defineEmits(["updateFileList"]);
const handleAIAutoTagging = () => {
    // 设置标注状态为进行中
    isAIAutoTagging.value = true

    // 清空现有数据，准备填充新的AI生成数据
    autoTagForm.sceneCategory = ''
    autoTagForm.characterBehavior = ''
    autoTagForm.coreObjects = ''
    autoTagForm.activityEvent = ''
    autoTagForm.textInfo = ''
    autoTagForm.colorTone = ''
    autoTagForm.shootingAngle = ''
    autoTagForm.materialDescription = ''

    let params = {
        id: currentMaterial.id,
    }
    AIMark(params).then(res => {
        console.log('res========', res)
        isAIAutoTagging.value = false
        ElMessage.success('AI自动标注成功！')
        emit("updateFileList"); //状态改变，更新文件列表
        Object.assign(autoTagForm, JSON.parse(res.data[0].annotationContent))
    })

}
// 获取文件类型文本
const getFileTypeText = (fileType) => {
    if (!fileType) return '未知类型';

    const typeMap = {
        'image': '图片',
        'video': '视频',
        'document': '文档',
        'audio': '音频',
        'pdf': 'PDF文档',
        'word': 'Word文档',
        'excel': 'Excel文档',
        'powerpoint': 'PPT文档'
    };

    for (const [type, text] of Object.entries(typeMap)) {
        if (fileType.includes(type)) {
            return text;
        }
    }

    return '其他';
};

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
function open(material) {
    console.log('===material===', material);
    // currentMaterial = JSON.parse(JSON.stringify(material))
    Object.assign(currentMaterial, material)
    //AI已标注
    if (material.annotationStatus == 1) {
        Object.assign(autoTagForm, JSON.parse(material.annotationContent))
    }
    dialogVisible.value = true
}
// 检查是否有未保存的数据
const hasUnsavedChanges = () => {
    // 检查autoTagForm是否有数据
    for (const key in autoTagForm) {
        const value = autoTagForm[key];
        if (Array.isArray(value) && value.length > 0) return true;
        if (typeof value === 'string' && value.trim() !== '') return true;
    }
    
    // 检查manualTagForm是否有数据
    for (const key in manualTagForm) {
        if (manualTagForm[key] && manualTagForm[key].toString().trim() !== '') return true;
    }
    
    return false;
}

// 关闭弹窗
const handleClose = () => {
    // 如果有未保存的数据，显示确认对话框
    if (hasUnsavedChanges()) {
        ElMessageBox.confirm('您有未保存的标注数据，确定要关闭吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            // 用户确认关闭
            dialogVisible.value = false
            // 清空 currentMaterial 对象的所有属性
            Object.keys(currentMaterial).forEach(key => {
                delete currentMaterial[key]
            })
            // 清空表单数据
            Object.keys(autoTagForm).forEach(key => {
                autoTagForm[key] = typeof autoTagForm[key] === 'string' ? '' : []
            })
            Object.keys(manualTagForm).forEach(key => {
                manualTagForm[key] = ''
            })
        }).catch(() => {
            // 用户取消关闭
            ElMessage.info('已取消关闭')
        })
    } else {
        // 没有未保存的数据，直接关闭
        dialogVisible.value = false
        // 清空 currentMaterial 对象的所有属性
        Object.keys(currentMaterial).forEach(key => {
            delete currentMaterial[key]
        })
        // 清空表单数据
        Object.keys(autoTagForm).forEach(key => {
            autoTagForm[key] = typeof autoTagForm[key] === 'string' ? '' : []
        })
        Object.keys(manualTagForm).forEach(key => {
            manualTagForm[key] = ''
        })
    }
}
defineExpose({
    open
})

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