<template>
  <div class="app-container home">
    <div class="home-header">
      <h1>欢迎使用素材管理与AI创作平台</h1>
      <p>高效管理素材，智能辅助创作</p>
    </div>
    
    <div class="module-cards">
      <el-card 
        v-for="module in modules" 
        :key="module.name"
        class="module-card"
        @click="navigateToModule(module.path)"
      >
        <div class="module-content">
          <el-icon class="module-icon">
            <UploadFilled v-if="module.name === 'archive'" />
            <Tools v-else-if="module.name === 'annotation'" />
            <Search v-else-if="module.name === 'search'" />
            <MagicStick v-else-if="module.name === 'ai-creation'" />
          </el-icon>
          <div class="module-info">
            <h3 class="module-title">{{ module.title }}</h3>
            <p class="module-desc">{{ module.description }}</p>
          </div>
        </div>
      </el-card>
    </div>
    
    <div class="system-info">
      <span>系统版本: {{ version }}</span>
    </div>
  </div>
</template>

<script setup name="Index">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled, Tools, Search, MagicStick } from '@element-plus/icons-vue'

const router = useRouter()
const version = ref('3.8.7')

// 模块列表
const modules = ref([
  {
    name: 'archive',
    title: '素材归档',
    description: '上传、管理和归档各类素材文件',
    path: '/material/archive',
    icon: UploadFilled
  },
  {
    name: 'annotation',
    title: '素材标注',
    description: '对素材进行标签标注和分类管理',
    path: '/material/annotation',
    icon: Tools
  },
  {
    name: 'search',
    title: '素材检索',
    description: '多维度检索和筛选素材资源',
    path: '/material/search',
    icon: Search
  },
  {
    name: 'ai-creation',
    title: 'AI创作',
    description: '基于AI技术进行内容创作和生成',
    path: '/material/ai-creation',
    icon: MagicStick
  }
])

function goTarget(url) {
  window.open(url, '__blank')
}

// 跳转到模块
const navigateToModule = (path) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
.home {
  padding: 20px;
}

.home-header {
  text-align: center;
  margin-bottom: 40px;
  h1 {
    font-size: 32px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px;
  }
  p {
    font-size: 16px;
    color: #606266;
  }
}

.module-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.module-card {
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
}

.module-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.module-icon {
  font-size: 48px;
  color: #409eff;
  margin-right: 20px;
}

.module-info {
  flex: 1;
}

.module-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 10px 0;
}

.module-desc {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.system-info {
  text-align: center;
  font-size: 14px;
  color: #909399;
}
</style>

