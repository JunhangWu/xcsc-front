<template>
    <!-- 素材详情和标注弹窗：核心修复区域 -->
    <el-dialog v-model="dialogVisible" title="素材标注" width="60%" :before-close="handleClose">
        <div class="annotation-dialog" v-loading="dialogLoading">
            <!-- 1. 素材预览区域（无错误，保留原结构） -->
            <div class="material-preview-container">
                <div class="material-preview">
                    <template v-if="getFileTypeText(currentMaterial.minioPath) == '图片'">
                        <img :src="currentMaterial.minioPath" class="preview-image" />
                    </template>
                    <template v-else-if="getFileTypeText(currentMaterial.minioPath) == '视频'">
                        <div class="preview-video">
                            <video :src="currentMaterial.minioPath" controls autoplay loop muted playsinline
                                style="max-width: 100%; max-height: 400px; width: auto; height: auto; display: block; object-fit: contain;"></video>
                        </div>
                    </template>
                    <template v-else>
                        <div class="preview-file">
                            <!-- 文件名称 -->
                            <el-link type="primary" :href="currentMaterial.minioPath" target="_blank">{{ currentMaterial.fileName
                                }}</el-link>
                        </div>
                    </template>
                </div>

                <!-- 素材基本信息 -->
                <div class="material-basic-info">
                    <h1 class="material-title">{{ currentMaterial.fileName }}</h1>
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
                                <span class="metadata-value">{{ currentMaterial.createBy || '未知' }}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">所属路径：</span>
                                <span class="metadata-value">{{ getFilePath(currentMaterial.minioPath) || '未分类'
                                    }}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">文件大小：</span>
                                <span class="metadata-value">{{ currentMaterial.fileSize }} M</span>
                            </div>
                            <div class="metadata-item" v-if="getFileTypeText(currentMaterial.minioPath) == '图片'">
                                <span class="metadata-label">分辨率：</span>
                                <span class="metadata-value">{{ currentMaterial.fileResolution }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. 标注信息区域 -->
            <div class="annotation-info">
                <!-- <h3>标注信息</h3> -->
                <el-tabs v-model="tabActiveName" class="demo-tabs">
                    <el-tab-pane label="智能标签" name="autoLabel">
                        <!-- 标签信息部分 -->
                         
                        <div class="annotation-section">
                            <div style="margin-bottom: 5px; display: flex; justify-content: flex-end;">
                                <el-button @click="handleAIAutoTagging" :type="isAIAutoTagging ? 'default' : 'primary'"
                                    :disabled="isAIAutoTagging">
                                    {{ isAIAutoTagging ? '标注中...' : 'AI标注' }}
                                </el-button>
                                <!-- v-if="currentMaterial.annotationStatus == 0" -->
                                <!-- <el-tag :type="primary" v-else>AI已标注</el-tag> -->
                            </div>
                            <div class="annotation-tip">（多个标签请用英文逗号分隔）</div>
                            <el-form :model="autoTagForm" label-width="120px">
                                <el-form-item label="场景分类">
                                    <el-input v-model="autoTagForm.sceneCategory" placeholder="请输入场景分类" />
                                </el-form-item>
                                <el-form-item label="人物行为">
                                    <el-input v-model="autoTagForm.characterBehavior" placeholder="请输入人物行为" />
                                </el-form-item>
                                <el-form-item label="核心物体">
                                    <el-input v-model="autoTagForm.coreObjects" placeholder="请输入核心物体" />
                                </el-form-item>
                                <el-form-item label="活动事件">
                                    <el-input v-model="autoTagForm.activityEvent" placeholder="请输入活动事件描述" />
                                </el-form-item>
                                <el-form-item label="文本信息">
                                    <el-input v-model="autoTagForm.textInfo" placeholder="请输入识别到的文本信息" />
                                </el-form-item>
                                <el-form-item label="颜色色调">
                                    <el-input v-model="autoTagForm.colorTone" placeholder="请输入颜色色调" />
                                </el-form-item>
                                <el-form-item label="拍摄角度">
                                    <el-input v-model="autoTagForm.shootingAngle" placeholder="请输入拍摄角度" />
                                </el-form-item>
                                <el-form-item label="素材描述">
                                    <el-input v-model="autoTagForm.materialDescription" type="textarea"
                                        placeholder="请输入素材描述"></el-input>
                                </el-form-item>
                            </el-form>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="基础标签" name="artificialLabel">
                        <!-- 基本信息部分 -->
                        <div class="annotation-tip">（多个标签请用英文逗号分隔）</div>
                        <div class="annotation-section">
                            <el-form :model="manualTagForm" label-width="120px">
                                <el-form-item label="事件时间">
                                    <el-date-picker v-model="manualTagForm.eventTime" type="datetime"
                                        placeholder="选择日期时间" value-format="YYYY-MM-DD HH:mm:ss"></el-date-picker>
                                </el-form-item>
                                <el-form-item label="地点信息">
                                    <el-input v-model="manualTagForm.locationInfo" placeholder="请输入地点信息" />
                                </el-form-item>
                                <el-form-item label="人物姓名">
                                    <el-input v-model="manualTagForm.personNames" placeholder="请输入人物姓名" />
                                </el-form-item>
                                <el-form-item label="建筑名称">
                                    <el-input v-model="manualTagForm.buildingNames" placeholder="请输入建筑名称" />
                                </el-form-item>
                                <el-form-item label="相关主题">
                                    <el-input v-model="manualTagForm.relatedThemes" placeholder="请输入相关主题" />
                                </el-form-item>
                                <el-form-item label="专有名词">
                                    <el-input v-model="manualTagForm.properNouns" placeholder="请输入专有名词" />
                                </el-form-item>
                            </el-form>
                        </div>
                    </el-tab-pane>
                    <!-- 补充标签 -->
                    <el-tab-pane label="补充标签" name="otherLabel">
                        <div class="annotation-section">
                            <div class="tag-input-section">
                                <el-input v-model="newSupplementTag" placeholder="请输入补充标签"
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
                <el-button type="primary" @click="saveAnnotation" :disabled="isSaveAnnotationDisabled">保存标注</el-button>
            </span>
        </template>
    </el-dialog>

</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AIMark } from "@/api/xcsc/uploadFile"
import { updateFile } from "@/api/xcsc/uploadFile"

const dialogLoading = ref(false)
const dialogVisible = ref(false)
const currentMaterial = reactive({})
const tabActiveName = ref('autoLabel')

// 补充标签
const supplementTags = ref([])
const newSupplementTag = ref('')

// AI标注状态
const isAIAutoTagging = ref(false)
const isSaveAnnotationDisabled = ref(false);// 确认按钮是否禁用
// 标注信息 - 标签信息（8个维度）
const autoTagForm = reactive({
    sceneCategory: '', // 场景分类
    characterBehavior: '', // 人物行为
    coreObjects: '', // 核心物体
    activityEvent: '', // 活动事件
    textInfo: '', // 文本信息
    colorTone: '', // 颜色色调
    shootingAngle: '', // 拍摄角度
    materialDescription: '' // 素材描述
})

// 标注信息 - 基本信息（6个维度）
const manualTagForm = reactive({
    eventTime: '', // 事件时间
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
    supplementTags.value = []
    newSupplementTag.value = ''
}

// 保存标注
const saveAnnotation = () => {

    // 定义需要处理的字段列表
    const fields = [
    'sceneCategory',
    'characterBehavior',
    'coreObjects',
    'activityEvent',
    'textInfo',
    'colorTone',
    'shootingAngle' // 补充你未写完的字段
    ];
    //字符串转为数组
    fields.forEach(field => {
        const value = autoTagForm[field];
        if (typeof value === 'string') {
            autoTagForm[field] = value
            .split(',')
            .map(item => item.trim())
            .filter(item => item); // 过滤空值
        }
    });
    // autoTagForm.materialDescription = [autoTagForm.materialDescription]
    // 构建完整的标注数据
    let params = {
        id: currentMaterial.id,
        annotationStatus: "2", // 已审核
        annotationContent: JSON.stringify(autoTagForm), //标签信息
        ...manualTagForm, // 基本信息
        supplementAnnotation: supplementTags.value.join(',')  // 补充标签
    }
    console.log("autoTagForm",autoTagForm)
    console.log("JSON.stringify(autoTagForm)",JSON.stringify(autoTagForm))
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
        supplementTags.value = []
        newSupplementTag.value = ''
        // 发送事件刷新文件列表
        emit("updateFileList");
    })
    const annotationData = {
        materialId: currentMaterial.id,
        autoTags: { ...autoTagForm },
        manualTags: {},
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
    if(getFileTypeText(currentMaterial.minioPath) == '文档'){
        ElMessage.warning('该类型素材暂时无法标注！')
        return
    }
    // 设置标注状态为进行中
    isAIAutoTagging.value = true
    isSaveAnnotationDisabled.value = true // 标注过程中，确认按钮禁用

    // 清空现有数据，准备填充新的AI生成数据
    autoTagForm.sceneCategory = ''
    autoTagForm.characterBehavior = ''
    autoTagForm.coreObjects = ''
    autoTagForm.activityEvent = ''
    autoTagForm.textInfo = ''
    autoTagForm.colorTone = ''
    autoTagForm.shootingAngle = ''
    autoTagForm.materialDescription = ''
    manualTagForm.personNames = ''

    let params = {
        id: currentMaterial.id,
    }
    dialogLoading.value = true
        AIMark(params).then(res => {
            dialogLoading.value = false
            isAIAutoTagging.value = false
            isSaveAnnotationDisabled.value = false // 标注完成后，启用确认按钮
            if(res.data[0].annotationContent == null){
                ElMessage.error('AI自动标注失败！')
            }
            else{
                ElMessage.success('AI自动标注成功！')
            
            // ElMessage.success('AI自动标注成功！')
            // ElMessage.error('AI自动标注失败！')
            // console.log("JSON.parse(res.data[0].annotationContent)",res.data[0])
                console.log("JSON.parse(res.data[0].annotationContent)",res.data[0].annotationContent)
                emit("updateFileList"); //状态改变，更新文件列表
                Object.assign(autoTagForm, JSON.parse(res.data[0].annotationContent))
                manualTagForm.personNames = res.data[0].personNames
            }
        }).catch(error => {
            // 处理错误情况，确保状态被正确重置
            dialogLoading.value = false
            isAIAutoTagging.value = false
            isSaveAnnotationDisabled.value = false
            console.error('AI自动标注发生错误:', error)
            ElMessage.error('AI自动标注过程中发生错误！')
        })
    // }
    // dialogLoading.value = false
    // isAIAutoTagging.value = false
}
// 获取文件类型文本
const getFileTypeText = (filePath) => {
    if (!filePath) return '未知类型';

    const dotIndex = filePath.lastIndexOf('.');
    if (dotIndex === -1) return '其他';
    const ext = filePath.substring(dotIndex + 1);
    const typeMap = {
        '图片': ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp', 'svg', 'heic'],
        '视频': ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'webm'],
        // '音频': ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
        // 'PDF文档': ['pdf'],
        // 'Word文档': ['doc', 'docx'],
        // 'Excel文档': ['xls', 'xlsx'],
        // 'PPT文档': ['ppt', 'pptx'],
        // '压缩文件': ['zip', 'rar', '7z', 'tar', 'gz'],
        // '文本': ['txt', 'md', 'csv', 'json', 'xml'],
        '文档': ['doc', 'docx', 'ppt', 'pptx', 'pdf']
    };
    for (const [type, exts] of Object.entries(typeMap)) {
        if (exts.includes(ext.toLowerCase())) {
            return type;
        }
    }
    return '其他';
};

// 获取文件名
function getFileName(path) {
    if (!path) return '';
    const idx = path.lastIndexOf('/');
    return idx !== -1 ? path.substring(idx + 1) : path;
}

//获取文件路径
function getFilePath(path) {
    if (!path) return '';
    // const prefix = 'xcsc/';
    const prefix = path.substring(28,32)
    const startIndex = path.indexOf(prefix) + prefix.length;
    const result = path.substring(startIndex);
    return result.replace("/" + getFileName(path), "");
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
function open(material) {
    console.log('===material===', material)
    Object.assign(currentMaterial, material)
    tabActiveName.value = 'autoLabel'
    if (material && material.annotationContent) {
        try {
            Object.assign(autoTagForm, JSON.parse(material.annotationContent))
        } catch (e) {
            console.warn('解析 annotationContent 失败', e)
        }
    }
    Object.keys(manualTagForm).forEach(key => {
        if (material && Object.prototype.hasOwnProperty.call(material, key) && material[key] != null) {
            manualTagForm[key] = material[key]
        } else {
            manualTagForm[key] = ''
        }
    })
    // 填充补充标签
    if (material && material.supplementAnnotation) {
        supplementTags.value = material.supplementAnnotation
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '')
    } else {
        supplementTags.value = []
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

    // 检查补充标签是否有数据
    if (supplementTags.value && supplementTags.value.length > 0) return true;

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
            // 清空补充标签
            supplementTags.value = []
            newSupplementTag.value = ''
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
        // 清空补充标签
        supplementTags.value = []
        newSupplementTag.value = ''
    }
}
defineExpose({
    open
})

</script>
<style scoped lang="scss">
.annotation-dialog {

    // 修复容器层级问题，匹配实际HTML结构
    .material-preview-container {
        display: flex;
        gap: 20px;
        max-height: 500px;
        max-width: 100%;
        overflow-y: auto;
        margin-bottom: 20px; // 增加与标注区域的间距

        .material-preview {
            flex: 3;
            display: flex;
            align-items: center;
            justify-content: center;
            //   background-color: #f5f7fa;
            border-radius: 4px;
            min-height: 300px;

            .preview-image {
                max-width: 100%;
                max-height: 500px;
                object-fit: contain;
            }

            .preview-video,
            .preview-file {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                // background-color: #f5f7fa;
                // padding: 24px;
            }
        }

        .material-basic-info {
            flex: 1;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
            display: flex;
            flex-direction: column;
            
            .material-title {
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 600;
                color: #2c3e50;
                line-height: 1.4;
                word-break: break-word;
            }
            
            .metadata-section {
                flex: 1;
                
                .metadata-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .metadata-item {
                    display: flex;
                    align-items: flex-start;
                    line-height: 1.5;
                    
                    .metadata-label {
                        font-weight: 500;
                        color: #606266;
                        min-width: 80px;
                        flex-shrink: 0;
                    }
                    
                    .metadata-value {
                        color: #303133;
                        font-size: 14px;
                        flex: 1;
                        word-break: break-word;
                    }
                }
            }
        }
    }

    // 标注信息区域样式
    .annotation-info {
        .annotation-section {
            margin-bottom: 20px;

            .material-title {
                margin: 0 0 10px 0;
                font-size: 20px;
                font-weight: 500;
                font-style: bold;
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
.annotation-tip {
  margin-bottom: 15px;
  color: #b0b2bb;
  font-size: 14px;
}
</style>
