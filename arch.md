# 系统架构文档

## 1. 项目概述
- **项目名称**: system
- **版本**: 3.8.7
- **描述**: 业务系统
- **技术栈**: Vue 3 + Vite + Element Plus + Pinia

## 2. 核心依赖
- **前端框架**: Vue 3
- **构建工具**: Vite
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **图表库**: ECharts

## 3. 目录结构
```
src/
├── api/            # 接口模块
├── assets/         # 静态资源
├── components/     # 公共组件
├── directive/      # 自定义指令
├── layout/         # 布局组件
├── plugins/        # 插件（如权限、缓存等）
├── router/         # 路由配置
├── store/          # 状态管理
├── utils/          # 工具函数
└── views/          # 页面视图
```

## 4. 构建与运行
- **开发环境**: `npm run dev`
- **生产环境**: `npm run build:prod`
- **预览**: `npm run preview`

## 5. 配置
- **Vite 配置**: 代理、别名、插件等
- **环境变量**: `.env.development`, `.env.production`, `.env.staging`

## 6. 模块功能
- 登录与权限控制
- 动态路由
- 全局状态管理
- 文件上传与下载
- 图表展示