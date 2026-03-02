<template>
  <div class="main-content">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 个人空间模块 -->
      <div class="sidebar-section">
        <h3 class="section-title">个人空间</h3>
        <div class="space-list">
          <div v-for="item in personalSpace" :key="item.id" :class="['space-item', { active: activeSpace === item.id }]"
            @click="handleSpaceClick(item.id)">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.name }}</span>
            <!-- <span class="space-name">{{ item.name }}</span> -->
            <!-- <span class="file-count">{{ item.id === 'all' ? totalAllFiles : totalFavoriteFiles }}</span> -->
          </div>
        </div>
      </div>

      <!-- 板块分类模块 -->
      <div class="category-list">
        <div
            v-for="dept in visibleCategoriesByDept"
            :key="dept.deptId"
            :class="[
        'category-item',
        {
          active: activeDeptId === dept.deptId,
          disabled: !canClickDept(dept)
        }
      ]"
            @click="handleDeptClickIfAllowed(dept)"
        >
          <span class="category-name">{{ dept.deptName }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="content-area">
      <!-- 筛选搜索栏 -->
      <div class="filter-bar">
        <el-form :model="filterForm" inline>
          <el-form-item label="素材类型：">
            <el-select v-model="filterForm.fileType" placeholder="请选择" clearable style="width: 150px;">
              <el-option label="图片" value="image" />
              <el-option label="视频" value="video" />
              <el-option label="文档" value="document" />
            </el-select>
          </el-form-item>

          <el-form-item label="日期范围：">
            <el-date-picker v-model="filterForm.dateRange" type="daterange" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
          </el-form-item>

          <el-form-item label="上传人：">
            <el-input v-model="filterForm.createBy" placeholder="请输入上传人" clearable style="width: 150px;" />
          </el-form-item>

          <el-form-item label="素材标签：">
            <el-input v-model="filterForm.annotationContent" placeholder="请输入素材标签" clearable style="width: 150px;" />
          </el-form-item>

          <el-form-item label="文件名：">
            <el-input v-model="filterForm.fileName" placeholder="请输入文件名" clearable style="width: 150px;" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <!-- 搜索结果展示区域 -->
      <div class="card" v-if="showSearchResults">
        <div class="pageTop">
          <div class="breadcrumbBox">
            <el-button type="primary" plain @click="resetSearch" size="default" style="margin-right: 20px;">
              <el-icon style="margin-right: 6px;">
                <Back />
              </el-icon>返回文件夹视图
            </el-button>
            <div class="search-result-info">
              搜索结果：共 {{ queryfileListData.length }} 个文件
            </div>
          </div>
          <div class="pageTopRight">
            <el-dropdown trigger="click" @command="switchViewMode" popper-class="view-mode-dropdown">
              <el-button class="view-mode-trigger" text>
                <el-icon style="font-size: 20px;">
                  <Grid />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="list">
                    <span class="view-mode-option">
                      <span class="view-mode-prefix">
                        <el-icon v-if="viewMode === 'list'" class="view-mode-check">
                          <Check />
                        </el-icon>
                      </span>
                      <span :class="{ 'is-active': viewMode === 'list' }">列表模式</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="thumbnail">
                    <span class="view-mode-option">
                      <span class="view-mode-prefix">
                        <el-icon v-if="viewMode === 'thumbnail'" class="view-mode-check">
                          <Check />
                        </el-icon>
                      </span>
                      <span :class="{ 'is-active': viewMode === 'thumbnail' }">大图模式</span>
                    </span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="sort-controls" v-if="viewMode === 'thumbnail'">
          <span class="sort-label">排序方式：</span>
          <el-button :type="sortField === 'name' ? 'primary' : 'default'" @click="sortFiles('name')" size="small">
            名称
            <el-icon v-if="sortField === 'name'" :class="{ 'is-reverse': sortOrder === 'desc' }">
              <ArrowUp />
            </el-icon>
          </el-button>
          <el-button :type="sortField === 'size' ? 'primary' : 'default'" @click="sortFiles('size')" size="small">
            大小
            <el-icon v-if="sortField === 'size'" :class="{ 'is-reverse': sortOrder === 'desc' }">
              <ArrowUp />
            </el-icon>
          </el-button>
          <el-button :type="sortField === 'date' ? 'primary' : 'default'" @click="sortFiles('date')" size="small">
            创建日期
            <el-icon v-if="sortField === 'date'" :class="{ 'is-reverse': sortOrder === 'desc' }">
              <ArrowUp />
            </el-icon>
          </el-button>
          <el-button :type="sortField === 'type' ? 'primary' : 'default'" @click="sortFiles('type')" size="small">
            类型
            <el-icon v-if="sortField === 'type'" :class="{ 'is-reverse': sortOrder === 'desc' }">
              <ArrowUp />
            </el-icon>
          </el-button>
        </div>

        <div class="card-body">
          <!-- 搜索结果 - 网格视图 -->
          <div class="material-list">
            <div v-if="loading" class="loading-container">
              <el-loading-text>正在加载搜索结果...</el-loading-text>
            </div>
            <div v-else-if="queryfileListData.length == 0" class="empty-state">
              <el-empty description="未找到匹配的文件" />
            </div>
            <div v-else-if="viewMode === 'thumbnail'" class="material-grid">
              <!-- 搜索结果文件列表 -->
              <div v-for="material in sortedFileListData" :key="material.id" class="material-item">
                <div class="material-thumb">
                  <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath" :alt="getFileName(material.minioPath)"
                    @click="handleMaterialClick(material)" />
                  <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="handleMaterialClick(material)">
                    <el-icon class="file-icon">
                      <VideoPlay />
                    </el-icon>
                    <img :src="material.coverPath" :alt="material.fileName"/>
                    <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                      style="max-width: 90%; max-height: 90%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                  </div>
                  <el-icon v-else :src="material.minioPath" :alt="getFileName(material.minioPath)" class="file-icon"
                    @click="handleMaterialClick(material)" style="cursor:pointer;">
                    <Document />
                  </el-icon>
                </div>
                <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
                <div class="material-tags" v-if="material.annotationContent !== null">
                  <el-tag v-for="tag in JSON.parse(material.annotationContent).sceneCategory" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                  <el-tag v-for="tag in JSON.parse(material.annotationContent).activityEvent" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                </div>
                <div class="material-actions">
                  <el-button size="small" @click.stop="toggleFavorite($event, material)"
                    :class="['favorite-btn', { favorited: material.isFavorite }]"
                    :icon="material.isFavorite ? StarFilled : Star">
                    {{ material.isFavorite ? '已收藏' : '收藏' }}
                  </el-button>
                  <el-button type="primary" size="small" @click.stop="handleDownload(material)" class="download-btn"
                    :icon="Download">
                    下载
                  </el-button>
                </div>
              </div>
            </div>
            <div v-else class="material-table-wrapper">
              <el-table :data="sortedFileListData" class="material-table" :row-key="getListRowKey">
                <el-table-column min-width="360">
                  <template #header>
                    <div class="sortable-header" @click="sortFiles('name')">
                      文件名
                      <el-icon v-if="sortField === 'name'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                        <ArrowUp />
                      </el-icon>
                    </div>
                  </template>
                  <template #default="{ row }">
                    <div class="table-file-cell">
                      <img
                        v-if="isImage(row.minioPath)"
                        class="table-thumb"
                        :src="row.coverPath || row.minioPath"
                        :alt="row.fileName"
                        @click.stop="handleMaterialClick(row)"
                      />
                      <img
                        v-else-if="isVideo(row.minioPath) && row.coverPath"
                        class="table-thumb"
                        :src="row.coverPath"
                        :alt="row.fileName"
                        @click.stop="handleMaterialClick(row)"
                      />
                      <span v-else-if="isVideo(row.minioPath)" class="table-type-icon" @click.stop="handleMaterialClick(row)">
                        <el-icon>
                          <VideoPlay />
                        </el-icon>
                      </span>
                      <span v-else class="table-type-icon" @click.stop="handleMaterialClick(row)">
                        <el-icon>
                          <Document />
                        </el-icon>
                      </span>
                      <span class="table-file-name-text" :title="row.fileName" @click="handleMaterialClick(row)">
                        {{ row.fileName }}
                      </span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column width="160">
                  <template #header>
                    <div class="sortable-header" @click="sortFiles('size')">
                      大小
                      <el-icon v-if="sortField === 'size'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                        <ArrowUp />
                      </el-icon>
                    </div>
                  </template>
                  <template #default="{ row }">
                    {{ formatFileSize(row.fileSize) }}
                  </template>
                </el-table-column>
                <el-table-column width="160">
                  <template #header>
                    <div class="sortable-header" @click="sortFiles('type')">
                      类型
                      <el-icon v-if="sortField === 'type'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                        <ArrowUp />
                      </el-icon>
                    </div>
                  </template>
                  <template #default="{ row }">
                    {{ getListFileType(row) }}
                  </template>
                </el-table-column>
                <el-table-column width="200">
                  <template #header>
                    <div class="sortable-header" @click="sortFiles('date')">
                      修改时间
                      <el-icon v-if="sortField === 'date'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                        <ArrowUp />
                      </el-icon>
                    </div>
                  </template>
                  <template #default="{ row }">
                    {{ formatDateTime(row.updateTime || row.createTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="220">
                  <template #default="{ row }">
                    <div class="table-actions">
                      <el-button link type="primary" @click.stop="toggleFavorite($event, row)">
                        {{ row.isFavorite ? '已收藏' : '收藏' }}
                      </el-button>
                      <el-button link type="primary" @click.stop="handleDownload(row)">下载</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>  
      <!-- 文件信息区 -->
      <div class="card" v-else-if="!showSearchResults">
        <div class="pageTop" v-if="activeSpace !== 'all'">
          <div class="breadcrumbBox">
            <!-- 返回到上一级 - 当不在'所有文件'或'我的收藏'界面时显示 -->
            <el-icon
              v-if="breadcrumbData.length > 1 || (breadcrumbData.length === 1 && breadcrumbData[0].bizId !== 'all' && breadcrumbData[0].bizId !== 'favorite')"
              @click="backFolder" class="backBtn">
              <Back />
            </el-icon>
            <div class="breadcrumb">
              <!-- 文件夹面包屑 -->
              <div class="breadcrumbItem" v-for="(item, index) in breadcrumbData" :key="index">
                <div class="breadcrumbName" @click="clickBreadcrumb(item, index)"> {{ item.filePath }}</div>
                <div class="breadcrumbArrow" v-if="index < breadcrumbData.length - 1">
                  <el-icon>
                    <ArrowRight />
                  </el-icon>
                </div>
              </div>
            </div>
          </div>
          <div class="pageTopRight">
            <el-dropdown trigger="click" @command="switchViewMode" popper-class="view-mode-dropdown">
              <el-button class="view-mode-trigger" text>
                <el-icon style="font-size: 20px;">
                  <Grid />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="list">
                    <span class="view-mode-option">
                      <span class="view-mode-prefix">
                        <el-icon v-if="viewMode === 'list'" class="view-mode-check">
                          <Check />
                        </el-icon>
                      </span>
                      <span :class="{ 'is-active': viewMode === 'list' }">列表模式</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="thumbnail">
                    <span class="view-mode-option">
                      <span class="view-mode-prefix">
                        <el-icon v-if="viewMode === 'thumbnail'" class="view-mode-check">
                          <Check />
                        </el-icon>
                      </span>
                      <span :class="{ 'is-active': viewMode === 'thumbnail' }">大图模式</span>
                    </span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 文件数量信息 -->
        <div class="file-info" v-if="!showSearchResults">
          <template v-if="activeSpace === 'all'">
            共<span class="file-count-text">&nbsp;{{ totalAllFiles }}&nbsp;</span>个文件
          </template>
          <template v-else-if="activeSpace === 'favorite'">
            共<span class="file-count-text">&nbsp;{{ fileListData.length }}&nbsp;</span>个文件
          </template>
          <template v-else-if="activeCategory">
            共<span class="file-count-text">&nbsp;{{ fileListData.length }}&nbsp;</span>个文件
          </template>
          <template v-if="folderData.length > 0">
            ，<span class="folder-count-text">&nbsp;{{ folderData.length }}&nbsp;</span>个文件夹
          </template>
        </div>

        <!-- 排序控制 -->
        <div class="sort-controls" v-if="!showSearchResults && viewMode === 'thumbnail' && activeSpace !== 'all'">
          <span class="sort-label">排序方式：</span>
          <el-button :type="sortField === 'name' ? 'primary' : 'default'" @click="sortFiles('name')" size="small">
            名称
            <el-icon v-if="sortField === 'name'" :class="{ 'is-reverse': sortOrder === 'desc' }">
              <ArrowUp />
            </el-icon>
          </el-button>
          <el-button :type="sortField === 'size' ? 'primary' : 'default'" @click="sortFiles('size')" size="small">
            大小
            <el-icon v-if="sortField === 'size'" :class="{ 'is-reverse': sortOrder === 'desc' }">
              <ArrowUp />
            </el-icon>
          </el-button>
          <el-button :type="sortField === 'date' ? 'primary' : 'default'" @click="sortFiles('date')" size="small">
            创建日期
            <el-icon v-if="sortField === 'date'" :class="{ 'is-reverse': sortOrder === 'desc' }">
              <ArrowUp />
            </el-icon>
          </el-button>
          <el-button :type="sortField === 'type' ? 'primary' : 'default'" @click="sortFiles('type')" size="small">
            类型
            <el-icon v-if="sortField === 'type'" :class="{ 'is-reverse': sortOrder === 'desc' }">
              <ArrowUp />
            </el-icon>
          </el-button>
        </div>
        
      <!-- 素材列表区 -->
        <div class="material-list">
          <div v-if="loading" class="loading-container">
            <el-loading-text>正在加载素材...</el-loading-text>
          </div>
          <div v-else-if="activeSpace == 'all' && Object.keys(allFileListData).length == 0"
            class="empty-state">
            <el-empty description="暂无内容" />
          </div>
          <div v-else-if="activeSpace == '' && folderData.length == 0 && fileListData == 0"
            class="empty-state">
            <el-empty description="暂无内容" />
          </div>
          <div v-else-if="activeSpace == 'favorite' && folderData.length == 0 && fileListData == 0"
            class="empty-state">
            <el-empty description="暂无内容" />
          </div>
          
          <div v-else-if="viewMode === 'thumbnail'" class="material-grid">
            <!-- 文件夹列表 -->
            <div class="subFolder" v-if="activeSpace !== 'all'" v-for="(item, index) in folderData" :key="index"
              @mouseenter="onSubFolderMouseEnter(item)" @mouseleave="onSubFolderMouseLeave(item)">
              <el-icon @click="selectFolder(item)">
                <FolderOpened />
              </el-icon>
              <div class="subFolderName">{{ item.filePath }}</div>
            </div>
            <!-- 文件列表 -->
            <div v-for="material in sortedFileListData" :key="material.id" class="material-item">
              <div class="material-thumb">
                <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath" :alt="getFileName(material.minioPath)"
                  @click="handleMaterialClick(material)" />
                <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="handleMaterialClick(material)">
                  <el-icon class="file-icon">
                    <VideoPlay />
                  </el-icon>
                  <img :src="material.coverPath" :alt="material.fileName"/>
                  <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                    style="max-width: 90%; max-height: 90%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                </div>
                <el-icon v-else :src="material.minioPath" :alt="getFileName(material.minioPath)" class="file-icon"
                  @click="handleMaterialClick(material)" style="cursor:pointer;">
                  <Document />
                </el-icon>
              </div>
              <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
              <div class="material-tags" v-if="material.annotationContent !== null">
                <el-tag v-for="tag in JSON.parse(material.annotationContent).sceneCategory" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                <el-tag v-for="tag in JSON.parse(material.annotationContent).activityEvent" :key="tag" type="success" size="small">{{ tag }}</el-tag>
              </div>
              <div class="material-actions">
                <el-button size="small" @click.stop="toggleFavorite($event, material)" 
                  :class="['favorite-btn', { favorited: material.isFavorite }]"
                  :icon="material.isFavorite ? StarFilled : Star">
                  {{ material.isFavorite ? '已收藏' : '收藏' }}
                </el-button>
                <el-button type="primary" size="small" @click.stop="handleDownload(material)" class="download-btn"
                  :icon="Download">
                  下载
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="material-table-wrapper">
            <el-table :data="listViewRows" class="material-table" :row-key="getListRowKey">
              <el-table-column min-width="360">
                <template #header>
                  <div class="sortable-header" @click="sortFiles('name')">
                    文件名
                    <el-icon v-if="sortField === 'name'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                      <ArrowUp />
                    </el-icon>
                  </div>
                </template>
                <template #default="{ row }">
                  <div v-if="row._rowType === 'folder'" class="table-file-cell">
                    <span class="table-type-icon folder" @click="selectFolder(row)">
                      <el-icon>
                        <FolderOpened />
                      </el-icon>
                    </span>
                    <span class="table-file-name-text" :title="row.filePath" @click="selectFolder(row)">
                      {{ row.filePath }}
                    </span>
                  </div>
                  <div v-else class="table-file-cell">
                    <img
                      v-if="isImage(row.minioPath)"
                      class="table-thumb"
                      :src="row.coverPath || row.minioPath"
                      :alt="row.fileName"
                      @click.stop="handleMaterialClick(row)"
                    />
                    <img
                      v-else-if="isVideo(row.minioPath) && row.coverPath"
                      class="table-thumb"
                      :src="row.coverPath"
                      :alt="row.fileName"
                      @click.stop="handleMaterialClick(row)"
                    />
                    <span v-else-if="isVideo(row.minioPath)" class="table-type-icon" @click.stop="handleMaterialClick(row)">
                      <el-icon>
                        <VideoPlay />
                      </el-icon>
                    </span>
                    <span v-else class="table-type-icon" @click.stop="handleMaterialClick(row)">
                      <el-icon>
                        <Document />
                      </el-icon>
                    </span>
                    <span class="table-file-name-text" :title="row.fileName" @click="handleMaterialClick(row)">
                      {{ row.fileName }}
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column width="160">
                <template #header>
                  <div class="sortable-header" @click="sortFiles('size')">
                    大小
                    <el-icon v-if="sortField === 'size'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                      <ArrowUp />
                    </el-icon>
                  </div>
                </template>
                <template #default="{ row }">
                  {{ getListRowSize(row) }}
                </template>
              </el-table-column>
              <el-table-column width="160">
                <template #header>
                  <div class="sortable-header" @click="sortFiles('type')">
                    类型
                    <el-icon v-if="sortField === 'type'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                      <ArrowUp />
                    </el-icon>
                  </div>
                </template>
                <template #default="{ row }">
                  {{ getListFileType(row) }}
                </template>
              </el-table-column>
              <el-table-column width="200">
                <template #header>
                  <div class="sortable-header" @click="sortFiles('date')">
                    修改时间
                    <el-icon v-if="sortField === 'date'" class="sort-arrow" :class="{ 'is-reverse': sortOrder === 'desc' }">
                      <ArrowUp />
                    </el-icon>
                  </div>
                </template>
                <template #default="{ row }">
                  {{ getListRowTime(row) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="250">
                <template #default="{ row }">
                  <div v-if="row._rowType === 'folder'" class="table-actions">
                    <el-button link type="primary" @click.stop="selectFolder(row)">打开</el-button>
                  </div>
                  <div v-else class="table-actions">
                    <el-button link type="primary" @click.stop="toggleFavorite($event, row)">
                      {{ row.isFavorite ? '已收藏' : '收藏' }}
                    </el-button>
                    <el-button link type="primary" @click.stop="handleDownload(row)">下载</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="allFileList" v-if="activeSpace == 'all'">
            <div class="everydayBox" v-for="(everydayData, index) in Object.keys(paginatedAllFiles)" :key="index">
              <div class="date" style=" font-size: 16px;font-weight: 600;color: #303133;padding: 10px 0;border-bottom: 1px solid #ebeef5;width: 100%; margin-bottom: 16px;">{{ everydayData }}</div>
              <div class="material-grid">
                <div v-for="material in paginatedAllFiles[everydayData]" :key="material.id" class="material-item">
                  <div class="material-thumb">
                    <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath"
                      :alt="getFileName(material.minioPath)" @click="handleMaterialClick(material)" />
                    <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="handleMaterialClick(material)">
                      <el-icon class="file-icon">
                        <VideoPlay />
                      </el-icon>
                      <img :src="material.coverPath" :alt="material.fileName"/>
                      <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                        style="max-width: 90%; max-height: 90%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                    </div>
                    <el-icon v-else :src="material.minioPath" :alt="getFileName(material.minioPath)" class="file-icon"
                      @click="handleMaterialClick(material)" style="cursor:pointer;">
                      <Document />
                    </el-icon>
                  </div>
                  <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
                  <div class="material-tags" v-if="material.annotationContent !== null">
                    <el-tag v-for="tag in JSON.parse(material.annotationContent).sceneCategory" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                    <el-tag v-for="tag in JSON.parse(material.annotationContent).activityEvent" :key="tag" type="success" size="small">{{ tag }}</el-tag>
                  </div>
                  <div class="material-actions">
                    <el-button size="small" @click.stop="toggleFavorite($event, material)" 
                      :class="['favorite-btn', { favorited: material.isFavorite }]"
                      :icon="material.isFavorite ? StarFilled : Star">
                      {{ material.isFavorite ? '已收藏' : '收藏' }}
                    </el-button>
                    <el-button type="primary" size="small" @click.stop="handleDownload(material)" class="download-btn"
                      :icon="Download">
                      下载
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 加载更多按钮 -->
            <div v-if="hasMoreFiles" class="load-more-container" style="text-align: center; margin: 20px auto; width: 100%; display: flex; justify-content: center;">
              <el-button plain @click="loadMoreFiles" size="default">
                加载更多
              </el-button>
            </div>
          </div>



        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="Index">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import {
  UploadFilled,
  Tools,
  MagicStick,
  VideoPlay,
  Document,
  Collection,
  Folder,
  Star,
  StarFilled,
  Download,
  Search,
  FolderOpened,
  Back,
  ArrowRight,
  ArrowUp,
  Grid,
  Check
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFolderList, getFileList, getCollectFileList, getFileIndexList, getCollectionList, addCollection, delCollection,  getDeptCategoryList } from "@/api/xcsc/uploadFile"
import useUserStore from '@/store/modules/user'

const router = useRouter()
const route = useRoute()
const showSearchResults = ref(false) // 控制是否显示搜索结果
const userStore = useUserStore()
// const isFavorite = ref(false) // 收藏状态

// 排序相关
const sortField = ref('name') // 当前排序字段：name, size, date
const sortOrder = ref('asc') // 当前排序方向：asc, desc
const viewMode = ref('thumbnail') // 当前展示模式：thumbnail, list
const nameCollator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })
// 文件夹悬浮控制
function onSubFolderMouseEnter(item) {
    item._hover = true
}
function onSubFolderMouseLeave(item) {
    item._hover = false
}

// 计算列表视图的行数据
const listViewRows = computed(() => {
  const folders = folderData.value.map(item => ({ ...item, _rowType: 'folder' }))
  const files = fileListData.value.map(item => ({ ...item, _rowType: 'file' }))
  return [...folders, ...files]
})

// 获取列表行的唯一键
function getListRowKey(row) {
  if (row?._rowType === 'folder') {
    return `folder-${row.bizId || row.id || row.filePath}`;
  }
  return `file-${row?.id || row?.fileName || ''}`;
}

// 获取列表行的文件类型
function getListFileType(row) {
  if (row?._rowType === 'folder') return '文件夹';
  const fileType = getFileType(row?.minioPath || '');
  if (fileType === '未知') return fileType;
  return `${fileType.toLowerCase()}文件`;
}

// 获取列表行的大小
function getListRowSize(row) {
  if (row?._rowType === 'folder') return '--';
  return formatFileSize(row?.fileSize);
}

// 获取列表行的时间
function getListRowTime(row) {
  return formatDateTime(row?.updateTime || row?.createTime);
}

// 排序文件列表
function sortFileList(fileList) {
  if (!Array.isArray(fileList)) return fileList;
  return fileList.sort((a, b) => {
    if (sortField.value === 'name') {
      return sortOrder.value === 'asc'
        ? nameCollator.compare(a?.fileName || '', b?.fileName || '')
        : nameCollator.compare(b?.fileName || '', a?.fileName || '');
    } else if (sortField.value === 'size') {
      const sizeA = Number(a?.fileSize) || 0;
      const sizeB = Number(b?.fileSize) || 0;
      return sortOrder.value === 'asc' ? sizeA - sizeB : sizeB - sizeA;
    } else if (sortField.value === 'date') {
      const timeA = new Date(a?.updateTime || a?.createTime || 0).getTime();
      const timeB = new Date(b?.updateTime || b?.createTime || 0).getTime();
      return sortOrder.value === 'asc' ? timeA - timeB : timeB - timeA;
    } else if (sortField.value === 'type') {
      const typeA = getFileType(a?.minioPath || '');
      const typeB = getFileType(b?.minioPath || '');
      return sortOrder.value === 'asc'
        ? nameCollator.compare(typeA, typeB)
        : nameCollator.compare(typeB, typeA);
    }
    return 0;
  });
}

// 处理排序
function sortFiles(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
  if (showSearchResults.value) {
    queryfileListData.value = [...queryfileListData.value].sort((a, b) => sortCompare(a, b));
  } else {
    fileListData.value = [...fileListData.value].sort((a, b) => sortCompare(a, b));
  }
}

// 获取排序后的文件列表（用于缩略图视图）
const sortedFileListData = computed(() => {
  if (showSearchResults.value) {
    return [...queryfileListData.value].sort((a, b) => sortCompare(a, b));
  }
  return [...fileListData.value].sort((a, b) => sortCompare(a, b));
});

// 排序比较函数
function sortCompare(a, b) {
  if (sortField.value === 'name') {
    return sortOrder.value === 'asc'
      ? nameCollator.compare(a?.fileName || '', b?.fileName || '')
      : nameCollator.compare(b?.fileName || '', a?.fileName || '');
  } else if (sortField.value === 'size') {
    const sizeA = Number(a?.fileSize) || 0;
    const sizeB = Number(b?.fileSize) || 0;
    return sortOrder.value === 'asc' ? sizeA - sizeB : sizeB - sizeA;
  } else if (sortField.value === 'date') {
    const timeA = new Date(a?.updateTime || a?.createTime || 0).getTime();
    const timeB = new Date(b?.updateTime || b?.createTime || 0).getTime();
    return sortOrder.value === 'asc' ? timeA - timeB : timeB - timeA;
  } else if (sortField.value === 'type') {
    const typeA = getFileType(a?.minioPath || '');
    const typeB = getFileType(b?.minioPath || '');
    return sortOrder.value === 'asc'
      ? nameCollator.compare(typeA, typeB)
      : nameCollator.compare(typeB, typeA);
  }
  return 0;
}


// 当前选中的板块分类
const activeCategory = ref('')
// 板块分类
const categories = reactive({
  bizId: [],
  filePath: [],
})
// 存储分类名称到bizId的映射
const categoryMap = ref({})

// 获取左侧板块列表
function getCategoriesByDeptList() {
  return getDeptCategoryList().then(response => {
    const list = response.data || []

    // 直接赋值数组
    categoriesByDept.value = list

    // 默认选中第一个
    // if (list.length > 0) {
    //   activeDeptId.value = list[0].deptId
    // }
  })
}

// 页面加载时调用
// getCategories(0)
getCategoriesByDeptList()

// 素材列表
const loading = ref(false)
const curFolderObj = reactive({
  filePath: '',
  bizId: '',
  id: '',
})
const breadcrumbData = ref([])
// 获取文件夹及文件列表数据
const folderData = ref([]) //文件夹列表
const fileListData = ref([])//文件列表

// 通用文件夹下内容获取（含搜索）
function getFolderData(folderBizId, mode = 'folder') {
  let params = {
    pid: folderBizId,
  }
  console.log('===folderBizId===', folderBizId);
  console.log('===params===', params);

  // 1 获取文件夹列表（无论浏览/搜索，都获取文件夹结构）
  getFolderList(params).then(res => {
    folderData.value = res.data || []
    console.log('===folderData.value===', folderData.value)
  })

  // 2 获取文件列表（浏览：folderBizId !== 0 才请求；搜索：强制请求，忽略folderBizId）
  // 判断条件   「搜索模式」OR「文件夹模式且folderBizId非0」
  if (mode === 'search' || (mode === 'folder' && folderBizId !== 0)) {
    let param = {
      //  搜索模式：folderId为0，文件夹模式：folderId为当前文件夹id
      folderId: folderBizId,
      fileTypeList: fileTypeObj[filterForm.fileType] || null,
      createStartTime: filterForm.dateRange[0]
          ? filterForm.dateRange[0] + ' 00:00:00'
          : null,
      createEndTime: filterForm.dateRange[1]
          ? filterForm.dateRange[1] + ' 23:59:59'
          : null,
      createBy: filterForm.createBy,
      annotationContent: filterForm.annotationContent,
      fileName: filterForm.fileName
    }

    getFileList(param).then(res => {
      // 根据 mode 决定写入哪个列表
      const targetList = mode === 'search' ? queryfileListData : fileListData
      targetList.value = res.data || []

      // 获取收藏列表并同步状态
      getCollectionData().then(() => {
        const favoriteFileIds = collectionList.value.map(item => item.fileId)
        targetList.value.forEach(file => {
          file.isFavorite = favoriteFileIds.includes(file.id)
        })
        console.log(`===${mode === 'search' ? 'queryfileListData' : 'fileListData'}.value===`, targetList.value)
      })

      // 搜索模式才显示搜索结果区域
      if (mode === 'search') {
        showSearchResults.value = true
      }
    })
  }
}




//点击子文件展示相关文件夹及文件
function selectFolder(item, type) {
    console.log('====item==', item);
    Object.assign(curFolderObj, item)

    curFolderId.value = item.bizId;

    if (type == 'isRootFolder') {
        //根文件夹
        breadcrumbData.value = [{
            filePath: item.filePath,
            bizId: item.bizId,
        }]
    } else {
        breadcrumbData.value.push({
            filePath: item.filePath,
            bizId: item.bizId,
        })
    }
    getFolderData(item.bizId)
    console.log('=== breadcrumbData.value===', breadcrumbData.value);
}

//点击面包屑
function clickBreadcrumb(item, index) {
    console.log('===item===', item);
    Object.assign(curFolderObj, item)
    
    // 特殊处理"我的收藏"的面包屑点击
    if (item.bizId === 'favorite') {
        activeSpace.value = 'favorite'
        activeCategory.value = ''
        folderData.value = [] // 不展示文件夹
        showSearchResults.value = false // 确保显示文件夹视图
        getFavoriteFiles() // 获取收藏文件并应用筛选条件
    } else {
        // 正常文件夹处理
        curFolderId.value = item.bizId;
        getFolderData(item.bizId)
    }
    
    if (index == 0) {
        breadcrumbData.value = [{
            filePath: item.filePath,
            bizId: item.bizId,
        }]
    }
    // 判断item的filePath在breadcrumbData的哪一个对象中，删除breadcrumbData的后面部分
    const idx = breadcrumbData.value.findIndex(b => b.filePath === item.filePath)
    if (idx !== -1) {
        breadcrumbData.value = breadcrumbData.value.slice(0, idx + 1)
    }
}

//  返回按钮
const backFolder = () => {
  if (breadcrumbData.value.length == 1) {
    // 根目录无法返回，保持当前curFolderId
    return
  } else {
    Object.assign(curFolderObj, {
      filePath: breadcrumbData.value[breadcrumbData.value.length - 2].filePath,
      bizId: breadcrumbData.value[breadcrumbData.value.length - 2].bizId,
      id: breadcrumbData.value[breadcrumbData.value.length - 2].id
    });
    getFolderData(breadcrumbData.value[breadcrumbData.value.length - 2].bizId) //获取上一级文件夹的bizId
    breadcrumbData.value.pop()
    // 添加边界判断，避免数组越界
    if (breadcrumbData.value.length > 0) {
      curFolderId.value = breadcrumbData.value[breadcrumbData.value.length - 1].bizId;
    } else {
      curFolderId.value = curDeptRootFolderId.value; // 回退到板块根文件夹
    }
  }
  console.log('===breadcrumbData.value===', breadcrumbData.value);
};

// 视图切换方法
function switchViewMode(mode) {
  if (mode === 'thumbnail' || mode === 'list') {
    viewMode.value = mode
  }
}


// 筛选表单
const filterForm = reactive({
  fileType: '',
  dateRange: [],
  createBy: '',
  annotationContent: '',
  fileName: ''
})


// 当前选中的个人空间
const activeSpace = ref('all')
// 当前选中的板块（根文件夹）
const curDeptRootFolderId = ref('')
//  当前选中的文件夹
const curFolderId =  ref('')

// 总文件数
// const totalFiles = computed(() => materials.value.length)
// 计算所有文件的总数
const totalAllFiles = computed(() => {
  let count = 0;
  for (const dateKey in allFileListData) {
    if (allFileListData[dateKey] && Array.isArray(allFileListData[dateKey])) {
      count += allFileListData[dateKey].length;
    }
  }
  return count;
});

// 计算收藏文件的总数
const totalFavoriteFiles = computed(() => {
  if (activeSpace.value === 'favorite') {
    return fileListData.value.length;
  }
  return collectionList.value.length;
});

// 存储各板块的文件数量 todo 通过sql查count
// const categoryFileCounts = ref({});

// 获取指定板块的文件数量
const getCategoryFileCount = (category) => {
  return categoryFileCounts.value[category] || 0;
};

// 更新板块文件数量
function updateCategoryFileCounts() {
  // 重置计数
  categoryFileCounts.value = {};
  
  // 遍历所有板块
  if (categories.filePath && Array.isArray(categories.filePath)) {
    categories.filePath.forEach(category => {
      const pid = categoryMap.value[category];
      if (pid) {
        // 为每个板块调用API获取文件数量
        let params = {
          folderId: pid,
          // 不设置筛选条件，获取该板块下的所有文件
          fileTypeList: null,
          createStartTime: null,
          createEndTime: null,
          createBy: '',
          annotationContent: '',
          fileName: ''
        };
        
        getFileList(params).then(res => {
          // 存储该板块的文件数量
          categoryFileCounts.value[category] = res.data.length;
          console.log(`板块 ${category} 的文件数量: ${res.data.length}`);
        }).catch(error => {
          console.error(`获取板块 ${category} 文件数量失败:`, error);
          categoryFileCounts.value[category] = 0;
        });
      }
    });
  }
}


//收藏列表
const collectionList = ref([])

function getCollectionData(){
    return getCollectionList().then(res => {
      collectionList.value = res.data
      console.log('collectionList.value', collectionList.value)
      return res.data;
    })
}
// 在组件挂载时获取收藏列表，确保页面初始加载时所有文件的收藏状态正确
onMounted(() => {
  if (userStore.id) {
    getCollectionData()
  }
  // 初始化板块文件数量
  // initCategoryFileCounts();
})

// 更新文件列表中的收藏状态
function updateFileFavoriteStatus() {
  const favoriteFileIds = collectionList.value.map(item => item.fileId);

  // 处理 fileListData
  if (fileListData.value && fileListData.value.length > 0) {
    fileListData.value.forEach(file => {
      // 加固：设置默认值 false，避免 undefined
      file.isFavorite = favoriteFileIds.includes(file.id) || false;
    });
  }

  // 处理 queryfileListData
  if (queryfileListData.value && queryfileListData.value.length > 0) {
    queryfileListData.value.forEach(file => {
      file.isFavorite = favoriteFileIds.includes(file.id) || false;
    });
  }

  // 处理 allFileListData
  for (const dateKey in allFileListData) {
    const dailyFiles = allFileListData[dateKey];
    dailyFiles.forEach(file => {
      file.isFavorite = favoriteFileIds.includes(file.id) || false;
    });
  }
}

// 当前选中的部门
const activeDeptId = ref(null)

// 所有部门列表
const categoriesByDept = ref([])

const isAdmin = computed(() => {
  const user = userStore.user;

  // 对象数组 roles
  const objectRoles = user?.roles?.some(
      role => role.roleKey === 'admin' || role.roleKey === 'studio'
  );

  // 顶层字符串数组 roles
  const stringRoles = userStore.roles?.some(
      role => role === 'admin' || role === 'studio'
  );

  return objectRoles || stringRoles;
});

// 判断部门是否可点击
const canClickDept = (dept) => {
  if (isAdmin.value) return true
  // leader为"all" 或 部门ID匹配 都可点击
  // 注：这里共享文件夹为便捷开发，利用了现有的dept表的leader字段
  return Number(dept.deptId) === Number(userStore.deptId) || dept.leader === "all"
}

// 点击部门处理（真正业务逻辑）
const handleDeptClick = (dept) => {
  activeDeptId.value = dept.deptId
  curDeptRootFolderId.value = dept.rootFolderId
  console.log('选中部门：', dept.deptName)
  // TODO: 根据 deptId 拉取文件列表等逻辑
  // 板块/公司  有一个主文件夹（pid = 0）；dept."foldid"
  handleCategoryClick(dept)
}

// 包装点击：不可点击时直接 return
const handleDeptClickIfAllowed = (dept) => {
  if (!canClickDept(dept)) return
  handleDeptClick(dept)
}

// 排序：可点击部门排前面
const sortedCategoriesByDept = computed(() => {
  return [...categoriesByDept.value].sort((a, b) => {
    const aCan = canClickDept(a) ? 0 : 1
    const bCan = canClickDept(b) ? 0 : 1
    return aCan - bCan
  })
})

// 侧边栏只显示可点击的部门
const visibleCategoriesByDept = computed(() => {
  return sortedCategoriesByDept.value.filter((dept) => canClickDept(dept))
})

// 收藏操作
const toggleFavorite = (event, material) => {
  event.stopPropagation()

  if(material.isFavorite){
    ElMessageBox.confirm(
        '确定要取消收藏该素材吗？',
        '取消收藏确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    ).then(() => {
      // 1. 即时修改本地状态，视觉立即反馈
      material.isFavorite = false
      let params = { fileId: material.id }
      delCollection(params).then(res => {
        // 2. 仅更新收藏列表，无需调用 updateFileFavoriteStatus（本地已改）
        getCollectionData()
        ElMessage.success('取消收藏')
        // 我的收藏页面移除该文件
        if (activeSpace.value === 'favorite') {
          const index = fileListData.value.findIndex(file => file.id === material.id)
          if (index !== -1) fileListData.value.splice(index, 1)
        }
      })
    }).catch(() => {
      console.log('用户取消了取消收藏操作')
    })
  } else {
    // 1. 即时修改本地状态
    material.isFavorite = true
    let params = { fileId: material.id }
    addCollection(params).then(res => {
      // 2. 仅更新收藏列表
      getCollectionData()
      ElMessage.success('收藏成功')
    })
  }
}

// 下载素材
// 处理下载
const handleDownload = async (material) => {
    if (!material.minioPath) {
        ElMessage.warning('文件路径不存在，无法下载')
        return
    }
    console.log('下载文件:', material.fileName)
    try {
        // 使用fetch API获取文件内容
        const response = await fetch(material.minioPath, {
            method: 'GET',
            credentials: 'include' // 包含cookies等认证信息
        })
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status}`)
        }
        // 获取文件内容并创建Blob对象
        const blob = await response.blob()
        // 创建下载链接
        const link = document.createElement('a')
        // 创建指向Blob的URL
        const url = window.URL.createObjectURL(blob)
        // 设置下载属性
        link.href = url
        link.download = material.fileName || getFileNameFromUrl(material.minioPath) || 'download_file'
        // 隐藏链接
        link.style.display = 'none'
        // 添加到文档并触发点击
        document.body.appendChild(link)
        link.click()
        // 延迟清理
        setTimeout(() => {
            // 移除链接
            document.body.removeChild(link)
            // 释放Blob URL
            window.URL.revokeObjectURL(url)
        }, 100)
        ElMessage.success('文件下载已开始')
    } catch (error) {
        console.error('文件下载失败:', error)
        ElMessage.error('文件下载失败，请稍后重试')
    }
}

// 个人空间
const personalSpace = ref([
  { id: 'all', name: '所有文件', icon: Folder },
  { id: 'favorite', name: '我的收藏', icon: Star }
])

// 获取收藏文件的详细信息 - 核心优化：直调后端/collect/list接口，极简精简
const getFavoriteFiles = async (mode = 'normal') => {
  loading.value = true;
  const targetList = mode === 'search' ? queryfileListData : fileListData;
  targetList.value = [];

  try {
    const params = {
      fileTypeList: fileTypeObj[filterForm.fileType] || null,
      createStartTime: filterForm.dateRange?.[0] ? `${filterForm.dateRange[0]} 00:00:00` : null,
      createEndTime: filterForm.dateRange?.[1] ? `${filterForm.dateRange[1]} 23:59:59` : null,
      createBy: filterForm.createBy,
      annotationContent: filterForm.annotationContent,
      fileName: filterForm.fileName
    };

    if (!filterForm.dateRange || filterForm.dateRange.length === 0) {
      const end = new Date();
      const start = new Date(end.setDate(end.getDate() - 30));
      const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,0)}-${String(d.getDate()).padStart(2,0)}`;
      filterForm.dateRange = [fmt(start), fmt(new Date())];
      params.createStartTime = `${filterForm.dateRange[0]} 00:00:00`;
      params.createEndTime = `${filterForm.dateRange[1]} 23:59:59`;
    }

    const res = await getCollectFileList(params);
    const collectFiles = res.data || [];

    targetList.value = collectFiles.map(file => ({ ...file, isFavorite: true }));

    if (collectFiles.length === 0) {
      ElMessage.info(mode === 'search' ? '该筛选条件下无收藏文件' : '暂无收藏文件，快去收藏吧～');
    } else if (mode === 'search') {
      ElMessage.success(`找到${collectFiles.length}个符合条件的收藏文件`);
    }

  } catch (err) {
    console.error('收藏文件查询失败：', err);
    ElMessage.error(mode === 'search' ? '收藏搜索失败，请稍后重试' : '查询收藏失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 点击个人空间
const handleSpaceClick = (spaceId) => {
  // 重置筛选表单
  Object.assign(filterForm, { fileType: '', dateRange: [], createBy: '', annotationContent: '', fileName: '' });
  activeSpace.value = spaceId;
  activeDeptId.value = null;
  activeCategory.value = '';
  folderData.value = [];
  showSearchResults.value = false; // 初始关闭搜索区域
  curFolderId.value = '';
  breadcrumbData.value = [];

  if (activeSpace.value == 'all') {
    fileListData.value = [];
        currentShownCount.value = pageSize.value; // 重置分页计数
    Object.assign(curFolderObj, { filePath: '', bizId: '', id: '' });
    getAllFileListData();
  } else if (activeSpace.value == 'favorite') {
    // 初始进入：普通模式加载收藏列表
    getFavoriteFiles('normal');
  }
}


const allFileListData = reactive({}) // 文件列表
// 分页相关状态
const pageSize = ref(30) // 每页显示数量
const currentShownCount = ref(30) // 当前已显示数量

// 计算按日期分组并分页的文件列表
const paginatedAllFiles = computed(() => {
  const paginatedData = {};
  let shownCount = 0;
  
  // 获取排序后的日期
  const sortedDates = getSortedDates();
  
  for (const dateKey of sortedDates) {
    const dailyFiles = allFileListData[dateKey] || [];
    const remainingSlots = currentShownCount.value - shownCount;
    
    if (remainingSlots <= 0) break;
    
    if (dailyFiles.length <= remainingSlots) {
      // 当天文件全部显示
      paginatedData[dateKey] = dailyFiles;
      shownCount += dailyFiles.length;
    } else {
      // 当天文件只显示部分
      paginatedData[dateKey] = dailyFiles.slice(0, remainingSlots);
      shownCount += remainingSlots;
    }
  }
  
  return paginatedData;
});

// 计算是否有更多文件可以加载
const hasMoreFiles = computed(() => {
  const totalFiles = totalAllFiles.value;
  return currentShownCount.value < totalFiles;
});

// 加载更多文件
function loadMoreFiles() {
  currentShownCount.value += pageSize.value;
}

const fileTypeObj = {
  image: ['jpg','jpeg','png','bmp','gif','webp','svg','heic'],
  video: ['mp4','mov','avi','mkv','flv','wmv','webm','m4v'],
  document: ['doc','docx','xls','xlsx','pdf','pptx','zip','rar','7z','tar','gz','txt','md','csv','json','xml'],
}

function getAllFileListData() {
  const params = {
    fileTypeList: fileTypeObj[filterForm.fileType] || null,
    createStartTime: filterForm.dateRange?.[0] ? filterForm.dateRange[0] + ' 00:00:00' : null,
    createEndTime: filterForm.dateRange?.[1] ? filterForm.dateRange[1] + ' 23:59:59' : null,
    createBy: filterForm.createBy,
    keyWords: filterForm.annotationContent,
    fileName: filterForm.fileName
  }

  getFileIndexList(params).then(res => {
    Object.assign(allFileListData, res.data) // 直接覆盖，不用先删
    // 设置收藏状态
    getCollectionData().then(() => {
      const favoriteFileIds = collectionList.value.map(item => item.fileId)
      for (const dateKey in allFileListData) {
        allFileListData[dateKey].forEach(file => {
          file.isFavorite = favoriteFileIds.includes(file.id)
        })
      }
    })
  })
}

// 点击板块分类（统一接收 dept 对象）
const handleCategoryClick = (dept) => {
  // 关闭搜索结果视图，切换到文件夹视图
  showSearchResults.value = false;
  // 1. 重置搜索栏
  Object.assign(filterForm, {
    fileType: '',
    dateRange: [],
    createBy: '',
    annotationContent: '',
    fileName: ''
  })

  // 2. 设置当前选中状态
  activeCategory.value = dept.deptName
  activeDeptId.value = dept.deptId
  activeSpace.value = ''
  curDeptRootFolderId.value =  dept.rootFolderId
  // 进入板块主文件夹，初始化curFolderId为根文件夹ID
  curFolderId.value = dept.rootFolderId;

  console.log('===activeCategory===', dept)

  // 3. 拉取数据
  getFolderData(dept.rootFolderId)

  // 4. 面包屑
  breadcrumbData.value = [
    {
      filePath: dept.deptName,
      bizId: dept.rootFolderId
    }
  ]

  // 5. 当前文件夹对象
  Object.assign(curFolderObj, {
    filePath: dept.deptName,
    bizId: dept.rootFolderId
  })
}

// 查询处理
const handleQuery = () => {
  if (activeSpace.value == 'all') {
    folderData.value = []
    getFolderData(undefined, 'search')
  } else if (activeSpace.value == 'favorite') {
    // 显示搜索结果区域
    showSearchResults.value = true;
    folderData.value = []
    // 传search模式，告知接口是搜索行为
    getFavoriteFiles('search');
  } else {
    const bizId = curFolderId.value
    getFolderData(bizId, 'search')
  }
}

// 获取文件列表数据
const queryfileListData = ref([])//文件列表
// function getQueryData(pid) {
//
//   if (pid !== 0) {
//   let currentFilePath = "";
//   for (let i = 0; i < breadcrumbData.value.length; i++) {
//     // 避免开头出现多余的"/"
//     currentFilePath += i === 0 ? breadcrumbData.value[i].filePath : "/" + breadcrumbData.value[i].filePath;
//   }
//     let param = {
//       localPath: currentFilePath,
//       // folderId: pid,
//       fileTypeList: fileTypeObj[filterForm.fileType] || null,
//       createStartTime: filterForm.dateRange[0] ? filterForm.dateRange[0] + ' 00:00:00' : null,
//       createEndTime: filterForm.dateRange[0] ? filterForm.dateRange[1] + ' 23:59:59' : null,
//       createBy: filterForm.createBy,
//       keyWords: filterForm.annotationContent,
//       fileName: filterForm.fileName
//
//     }
//     // console.log('localPath:', curFolderObj.filePath)
//     console.log('breadcrumbData:', currentFilePath)
//     getFileList(param).then(res => {
//       queryfileListData.value = res.data
//       showSearchResults.value = true
//       // 获取当前用户收藏列表并设置文件收藏状态
//       getCollectionData().then(() => {
//           // 提取收藏列表中的文件id
//           const favoriteFileIds = collectionList.value.map(item => item.fileId);
//           // 遍历文件列表，设置收藏状态
//           queryfileListData.value.forEach(file => {
//               file.isFavorite = favoriteFileIds.includes(file.id);
//           });
//       });
//     })
//   }
// }
// 重置搜索，返回文件夹视图
function resetSearch() {
  showSearchResults.value = false; // 关闭搜索结果区域
  // 重置筛选表单
  Object.assign(filterForm, { fileType: '', dateRange: [], createBy: '', annotationContent: '', fileName: '' });

  if (activeSpace.value === 'all') {
    fileListData.value = [];
    folderData.value = [];
    getAllFileListData();
  } else if (activeSpace.value === 'favorite') {
    // 收藏重置：回到普通收藏列表
    getFavoriteFiles('normal');
  } else if (curFolderObj.bizId) {
    getFolderData(curFolderObj.bizId);
  }
}

// 重置筛选表单
const handleReset = () => {
  Object.assign(filterForm, { fileType: '', dateRange: [], createBy: '', annotationContent: '', fileName: '' });
  if (activeSpace.value == 'all') {
    folderData.value = [];
    getAllFileListData();
  } else if (activeSpace.value == 'favorite') {
    // 收藏表单重置：回到无筛选的收藏列表
    getFavoriteFiles('normal');
  } else if (getCategoryPid(activeCategory.value)) {
    getFolderData(getCategoryPid(activeCategory.value));
  }
}

// AI搜索
const handleAISearch = () => {
  console.log('执行AI搜索')
}

// 点击素材项
const handleMaterialClick = (material) => {
  console.log('点击素材:', material)
  const materialId = material?.id ?? material?.fileId
  if (!materialId) {
    ElMessage.warning('素材ID缺失，无法预览')
    return
  }
  // 跳转到预览界面
  router.push({ name: 'MaterialPreview', params: { id: materialId } })
}

// 支持的文件格式
const supportedFormats = {
  image: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'flv','m4v'],
  document: ['docx', 'pdf', 'pptx']
}

function isImage(path) {
  return ['jpg', 'jpeg', 'png', 'bmp', 'gif'].some(ext => path.toLowerCase().includes(ext));
}

function isVideo(path) {
  return ['mp4', 'mov', 'avi', 'mkv', 'flv','m4v'].some(ext => path.toLowerCase().includes(ext));
}

//获取文件名
function getFileName(path) {
  if (!path) return '';
  const idx = path.lastIndexOf('/');
  return idx !== -1 ? path.substring(idx + 1) : path;
}

// 格式化文件大小
function formatFileSize(bytes) {
  //TODO
  // if (!bytes) return '0 MB';
  // if (bytes < 1024) return bytes + ' B';
  // if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  // return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return bytes + ' MB';
}

// 格式化日期时间
function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '--';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 获取文件类型
function getFileType(path) {
  if (!path) return '未知';
  const idx = path.lastIndexOf('.');
  return idx !== -1 ? path.substring(idx + 1).toUpperCase() : '未知';
}

// 检查文件格式是否支持
const isSupportedFormat = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  return Object.values(supportedFormats).flat().includes(ext)
}

// 获取按日期倒序排序的日期键数组
const getSortedDates = () => {
  return Object.keys(allFileListData).sort((a, b) => {
    // 将日期字符串转换为Date对象进行比较，确保最新的日期排在前面
    return new Date(b) - new Date(a);
  });
}


// 定时检查同步（每5秒）
let syncInterval = null

onMounted(async () => {
  console.log('首页加载完成')
    handleSpaceClick('all')
})


// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (syncInterval) {
    clearInterval(syncInterval)
  }
})
</script>

<style scoped lang="scss">
// 主内容区
.main-content {
  display: flex;
  overflow: hidden;
  max-height: calc(100vh - 84px);
  height: calc(100vh - 84px);
}

// 顶部导航
.top-nav {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  gap: 20px;

  .nav-btn {
    font-size: 16px;
    font-weight: 500;
    padding: 8px 16px;

    .nav-icon {
      margin-right: 8px;
      font-size: 18px;
    }

    &:hover {
      color: #409eff;
      background: #ecf5ff;
      border-radius: 4px;
    }
  }
}

/* sidebar.scss */
.sidebar {
  width: 280px;
  height: 100vh;
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  display: flex;
  flex-direction: column;

  /* 每个板块间隔 */
  .sidebar-section {
    &:not(:last-child) {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #606266;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
    }
  }

  /* 个人空间列表 */
  .space-list {
    max-height: 120px;       // 固定高度，超出滚动
    overflow-y: auto;

    .space-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      color: #303133;
      background: #fff;

      &:hover {
        background: #ecf5ff;
        color: #409eff;
      }

      &.active {
        background: #409eff;
        color: #fff;
        font-weight: 500;
      }

      .space-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-count {
        font-size: 12px;
        color: #909399;
        background: #f0f2f5;
        padding: 2px 8px;
        border-radius: 10px;
        margin-left: auto;

        .space-item:hover & {
          background: #e6f7ff;
          color: #409eff;
        }

        .space-item.active & {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
      }
    }
  }

  .category-list {
    flex: 1;                // 占满剩余高度
    overflow-y: auto;       // 开启垂直滚动
    padding-right: 4px;     // 防止滚动条遮挡内容
    .category-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin-bottom: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      color: #606266;
      background: #fff;

      .category-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-count {
        font-size: 12px;
        color: #909399;
        background: #f0f2f5;
        padding: 2px 8px;
        border-radius: 10px;
        margin-left: 8px;
        flex-shrink: 0;
      }

      // hover 样式：只有可点击的才生效
      &:not(.disabled):hover {
        background: #ecf5ff;
        color: #409eff;

        .category-name,
        .file-count {
          color: #409eff;
        }
        .file-count {
          background: #e6f7ff;
        }
      }

      &.active {
        background: #409eff;
        color: #fff;

        .category-name,
        .file-count {
          color: #fff;
        }
        .file-count {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      &.disabled {
        cursor: not-allowed;
        color: #aaa;
        background: #f5f5f5;

        .file-count {
          background: #eee;
          color: #aaa;
        }
      }
    }
  }
}

// 右侧内容区
.content-area {
  flex: 1;
  width: 100%;
  padding: 24px;
  overflow-y: auto;
  background: #fff;
  height: 100%;

  .filter-bar {
    // margin-bottom: 20px;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 8px;

    .el-form-item {
      margin-bottom: 16px;
      margin-right: 20px;

      &:last-child {
        margin-right: 0;
      }
    }
  }

  .file-info {
    // margin-bottom: 20px;
    font-size: 14px;
    color: #606266;
    display: flex;
    align-items: center;
    padding: 10px 16px;
    // background: #f8f9fa;
    border-radius: 4px;
    
    .file-count-text {
      font-weight: 500;
      // color: #409eff;
    }
  }

  .material-list {
    max-height: calc(100% - 130px);
    height: calc(100% - 130px);
    overflow-y: auto;
  }

  /* 素材标签样式 */
  .material-tags {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 12px 12px;
  }
}

.subFolder {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  height: 305px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  background: #fafafa;

  :deep(.el-icon) {
    font-size: 100px;
    font-weight: 500;
    color: #ffd45e;
    margin-bottom: 8px;
    cursor: pointer;
  }

  &:hover {
    background-color: #ecf5ff;
    border-color: #c6e2ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .subFolder-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .subFolder-actions {
    opacity: 1;
  }

  .action-icon {
    font-size: 18px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    padding: 2px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: scale(1.1);
    }
  }

  .subFolderName {
    text-align: center;
    font-size: 15px;
    color: #303133;
    padding: 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
}

.material-grid {
  display: grid;
  // flex-wrap: wrap;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 18px;
  margin-top: 16px;
}

.allFileList {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  .date {
      font-size: 14px;
      color: #606266;
      padding: 0 8px;
      margin-bottom: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

  .everydayBox {
    // display: flex;
    // flex-wrap: wrap;
    // gap: 16px;
    max-height: calc(100% - 130px);
    height: calc(100% - 130px);
    overflow-y: auto;
    margin-top: 16px;
    width: 100%; 
  }
}

.material-item {
    margin: 0;
    position: relative;
    // width: 255px;
    width: 100%;
    height: 305px;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #ebeef5;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;

    &:hover {
      border-color: #409eff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

  .material-thumb {
    width: 100%;
    height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #f5f7fa;

    img {
      width: 95%;
      height: 95%;
      object-fit: fill;
      transition: transform 0.3s;
      cursor: pointer;
    }

    .videoBox {
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      video {
        width: 100%;
        height: 100%;
        object-fit: fill;
      }

      .file-icon {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        font-size: 48px;
        color: #ffffff;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        padding: 8px;
      }
    }

    .video-icon {
      font-size: 48px;
      color: #409eff;
    }

    .file-icon {
      font-size: 64px;
      color: #909399;
    }
  }


  .fileName {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    margin-top: 6px;
    margin-bottom: 4px;
    margin-left: 6px;
    margin-right: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    text-align: center
  }


  .download-btn {
    width: 45%;
    background-color: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 24px;

    &:hover {
      background-color: #66b1ff;
    }
  }
  

  .favorite-btn {
    width: 48%;
    background-color: #f0f2f5;
    color: #606266;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 24px;

    &:hover {
      // background-color: #e6f7ff;
      // border-color: #91d5ff;
      // color: #1890ff;
      background-color: #fff7e6;
      border-color: #ffd591;
      color: #fa8c16;
    }
    
    &.favorited {
      // background-color: #fff2e8;
      // border-color: #ffbb96;
      // color: #fa541c;
      background-color: #fff7e6;
      border-color: #ffd591;
      color: #fa8c16;
    }
  }
  
  :deep(.el-button) {
    padding: 6px 8px;
    font-size: 12px;
    height: 24px;
  }
}
.material-info {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 36px;
  z-index: 2;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid #ebeef5;
  border-radius: 8px 8px 0 0;

  .material-status {
    display: flex;
    align-items: center;
  }

  .material-actions {
    display: flex;
    align-items: center;
  }

  .material-del {
    display: flex;
    align-items: center;
  }

  :deep(.el-button) {
    padding: 4px 10px;
    font-size: 12px;
    height: 24px;
  }
}

//面包屑
.pageTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e4e7ed;

  .breadcrumbBox {
    display: flex;
    align-items: center;

    .backBtn {
      font-size: 36px;
      cursor: pointer;
      color: #606266;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        color: #409eff;
        background-color: #ecf5ff;
      }
    }

    .breadcrumb {
      display: flex;
      margin-left: 16px;
      align-items: center;

      .breadcrumbItem {
        display: flex;
        align-items: center;

        .breadcrumbName {
          line-height: 28px;
          padding: 0 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          color: #606266;
          transition: all 0.2s ease;

          &:hover {
            color: #409eff;
            background-color: #ecf5ff;
          }
        }

        .breadcrumbArrow {
          margin: 0 4px;
          color: #c0c4cc;
        }
      }
    }
  }
}

/* 素材标签样式 */
.material-tags {
  height: 50px;
  margin-top: 8px;
  margin-bottom: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 12px;
  /* 隐藏溢出内容 */
  overflow: hidden;
  
  :deep(.el-tag) {
    background-color: #ffffff;
    border-color: #67c23a;
    color: #67c23a;
  }
}

/* 素材操作区样式 */
.material-actions {
  padding: 0 12px 12px;
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.favorite-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-result-info {
  margin-left: 20px;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
  color: #909399;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

/* 适配不同屏幕尺寸 */
@media screen and (max-width: 1200px) {
  .subFolder {
    width: 120px;
    height: 120px;
  }
  
  .material-item {
    width: 250px;
    height: 240px;
  }
}

@media screen and (max-width: 768px) {
  .search-filter {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-filter>* {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .pageTop {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .btnList {
    justify-content: center;
  }

  .folderItem,
  .subFolder {
    width: 100px;
    height: 100px;
  }
  
  .material-item {
    width: 100%;
    max-width: 280px;
    height: 260px;
    margin: 0 auto;
  }

  :deep(.el-icon) {
    font-size: 32px !important;
  }
}
/* 视图切换样式 */
.view-mode-dropdown .view-mode-option {
  display: inline-flex;
  align-items: center;
  min-width: 72px;
}

.view-mode-dropdown .view-mode-prefix {
  width: 16px;
  margin-right: 6px;
  flex: 0 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.view-mode-dropdown .view-mode-check {
  color: #409eff;
}

.view-mode-dropdown .view-mode-option .is-active {
  color: #409eff;
}

/* 排序控制样式 */
.sort-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.sort-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

/* 排序表头样式 */
.sortable-header {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    color: #409eff;
  }
}

.sort-arrow {
  transition: transform 0.2s ease;
  font-size: 12px;
  color: #909399;

  &.is-reverse {
    transform: rotate(180deg);
  }
}

/* 列表视图样式 */
.material-table-wrapper {
  width: 100%;
  overflow-x: auto;
  background: #ffffff;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.material-table {
  width: 100%;
  border-radius: 0 0 8px 8px;
  overflow: hidden;

  :deep(.el-table__header-wrapper) {
    background: #f5f7fa;
  }

  :deep(.el-table__row:hover) {
    background: #ecf5ff !important;
  }
}

.table-file-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.table-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  flex: 0 0 40px;
}

.table-type-icon {
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  flex: 0 0 24px;

  &.folder {
    color: #ffd45e;
  }
}

.table-file-name-text {
  font-size: 14px;
  color: #303133;
  cursor: pointer;
  flex: 1;
  min-width: 0;

  &:hover {
    color: #409eff;
  }
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 文件夹数量样式 */
.folder-count-text {
  font-weight: 500;
}

/* 响应式样式 */
@media screen and (max-width: 1200px) {
  .sort-controls {
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
  }

  .material-table {
    font-size: 12px;
  }

  .table-file-cell {
    gap: 8px;
  }

  .table-thumb {
    width: 32px;
    height: 32px;
  }

  .table-type-icon {
    font-size: 20px;
  }
}

@media screen and (max-width: 768px) {
  .sort-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .pageTopRight {
    width: 100%;
    justify-content: space-between;
  }

  .material-table {
    font-size: 11px;
  }

  .table-file-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .table-thumb {
    width: 60px;
    height: 60px;
  }
}
</style>
