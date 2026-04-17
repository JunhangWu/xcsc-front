﻿<template>
  <div class="app-container">
    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <el-input v-model="searchKeyword" placeholder="请输入素材名称" style="width: 300px; margin-right: 10px;">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="标注状态" style="width: 150px; margin-right: 10px;">
        <el-option label="全部" value="" />
        <el-option label="待标注" value="0" />
        <el-option label="待审核" value="1" />
        <el-option label="已审核" value="2" />
        <el-option label="标注失败" value="3" />
      </el-select>
      <el-button type="primary" @click="getQueryData" icon="Search">搜索</el-button>
    </div>

    <div class="folderBox" v-if="showFolder" ref="folderBoxRef">
      <div class="folderItem" v-for="(item, index) in visibleFolderData" :key="index"
        @click="selectFolder(item, 'isRootFolder')">
        <el-icon>
          <FolderOpened />
        </el-icon>
        <div class="folderName">
          {{ item.filePath }}
        </div>
      </div>
    </div>

    <!-- 搜索结果展示区域 -->
    <div class="card" v-else-if="showSearchResults">
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
          <el-button
            type="primary"
            plain
            size="default"
            @click="toggleSelectAllItems"
            :disabled="availableSelectableItems.length === 0"
          >
            {{ allItemsSelected ? '取消全选' : '全选' }}
          </el-button>
          <el-button type="primary" plain @click="refreshData" size="default">
            <el-icon style="margin-right: 6px;">
              <Refresh />
            </el-icon>刷新
          </el-button>
          <el-dropdown trigger="click" @command="switchViewMode" popper-class="view-mode-dropdown">
            <el-button class="view-mode-trigger" text>
              <el-icon>
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
      <div class="selection-toolbar" v-if="selectedItemCount > 0">
        <span class="selection-count">已选择{{ selectedItemCount }}个项目（文件夹{{ selectedFolders.length }}，文件{{ selectedFiles.length }}）</span>
        <el-button type="primary" plain size="small" @click="renameSelectedItems">批量重命名</el-button>
        <el-button type="primary" plain size="small" @click="moveSelectedItems">批量移动</el-button>
        <el-button type="danger" plain size="small" @click="deleteSelectedItems">批量删除</el-button>
        <el-button text size="small" @click="clearSelectedItems">取消选择</el-button>
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
            <div v-for="material in paginatedQueryFileListData" :key="material.id" class="material-item"
              :class="{ 'is-selected': isFileSelected(material) }"
              @mouseenter="onSubFolderMouseEnter(material)" @mouseleave="onSubFolderMouseLeave(material)">
                <span class="file-select-box" v-show="material._hover || isFileSelected(material)" @click.stop>
                  <el-checkbox
                    :model-value="isFileSelected(material)"
                    @change="(checked) => toggleFileSelected(material, checked)"
                  />
                </span>
                <span class="subFolder-actions">
                  <el-icon class="action-icon" @click.stop="editFile(material)" title="重命名" v-show="material._hover" style="color: #409eff;">
                    <Edit />
                  </el-icon>
                  <el-icon class="action-icon" @click.stop="moveFileinQuery(material)" title="移动" v-show="material._hover" style="color: #67c23a;">
                    <ArrowRight />
                  </el-icon>
                  <el-icon class="action-icon" @click.stop="deleteFileinQuery(material)" title="删除" v-show="material._hover" style="color: #f56c6c;">
                    <Delete />
                  </el-icon>
                </span>
              <div class="material-thumb">
                <img v-if="isImage(material.minioPath)" :src="getProxyPath(material.coverPath) || getProxyPath(material.minioPath)" :alt="material.fileName"
                  @click="previewImg(material)" />
                <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="previewVideo(material)">
                  <el-icon class="file-icon">
                    <VideoPlay />
                  </el-icon>
                  <img :src="getProxyPath(material.coverPath)" :alt="material.fileName"/>
                  <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                    style="max-width: 95%; max-height: 95%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                </div>
                <el-icon v-else class="file-icon" @click="downloadFile(material)" style="cursor:pointer;">
                  <Document />
                </el-icon>
              </div>
              
              <div class="material-details">
                <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
                <div class="file-id">ID: {{ material.id }}</div>
                <div class="file-id">大小: {{ formatFileSize(material.fileSize) }}</div>
                <div class="file-status">
                  <el-tag :type="getStatusTagType(material.annotationStatus)" size="medium">
                    {{ getStatusText(material.annotationStatus) }}
                  </el-tag>
                </div>
                <!-- <div class="file-info">
                  <span class="file-size">大小: {{ formatFileSize(material.fileSize) }}</span>
                  <span class="file-type">类型: {{ getFileType(material.minioPath) }}</span>
                  <span class="upload-time">上传时间: {{ formatDate(material.createTime) }}</span>
                </div> -->
              </div>
              
              <div class="material-actions">
                <el-button type="primary" size="small" @click.stop="showMaterialDetail(material)" icon="Edit">
                  标注
                </el-button>
                <!-- <el-button type="danger" size="small" @click.stop="deleteFile(material)" icon="Delete" style="margin-left: 8px;">
                </el-button> -->
              </div>
            </div>
          </div>
          <div v-else class="material-table-wrapper">
            <el-table
              ref="queryTableRef"
              :data="paginatedQueryFileListData"
              class="material-table"
              :row-key="getListRowKey"
              @selection-change="handleSearchTableSelectionChange"
            >
              <el-table-column type="selection" width="52" />
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
                      :src="getProxyPath(row.coverPath) || getProxyPath(row.minioPath)"
                      :alt="row.fileName"
                      @click.stop="previewImg(row)"
                    />
                    <img
                      v-else-if="isVideo(row.minioPath) && row.coverPath"
                      class="table-thumb"
                      :src="getProxyPath(row.coverPath)"
                      :alt="row.fileName"
                      @click.stop="previewVideo(row)"
                    />
                    <span v-else-if="isVideo(row.minioPath)" class="table-type-icon" @click.stop="previewVideo(row)">
                      <el-icon>
                        <VideoPlay />
                      </el-icon>
                    </span>
                    <span v-else class="table-type-icon" @click.stop="downloadFile(row)">
                      <el-icon>
                        <Document />
                      </el-icon>
                    </span>
                    <span class="table-file-name-text" :title="row.fileName" @click="handleListNameClick(row)">
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
                    <el-button link type="primary" @click.stop="showMaterialDetail(row)">标注</el-button>
                    <el-button link type="primary" @click.stop="editFile(row)">重命名</el-button>
                    <el-button link type="danger" @click.stop="deleteFileinQuery(row)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-if="queryfileListData.length > 0" class="search-pagination-container">
            <el-pagination
              v-model:current-page="searchCurrentPage"
              v-model:page-size="searchPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="queryfileListData.length"
              @size-change="handleSearchPageSizeChange"
              @current-change="handleSearchPageChange"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="card" v-else-if="!showSearchResults">
      <div class="pageTop">
        <div class="breadcrumbBox">
          <!-- 返回到上一级 -->
          <el-icon @click="backFolder" class="backBtn">
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
          <div class="btnList">
            <el-button
              type="primary"
              plain
              @click="toggleSelectAllItems"
              size="default"
              :disabled="availableSelectableItems.length === 0 || isInSharedFolderContext"
            >
              {{ allItemsSelected ? '取消全选' : '全选' }}
            </el-button>
            <el-button type="primary" plain @click="refreshData" size="default">
              <el-icon style="margin-right: 6px;">
                <Refresh />
              </el-icon>刷新
            </el-button>
            <el-button type="primary" plain @click="renameFilesByFolderName" size="default" :disabled="isInSharedFolderContext">
              <el-icon style="margin-right: 6px;">
                <DocumentCopy />
              </el-icon>按文件夹名重命名文件
            </el-button>
            <el-button type="primary" plain @click="handleAddFolder" size="default" :disabled="isInSharedFolderContext">
              <el-icon style="margin-right: 6px;">
                <FolderAdd />
              </el-icon>新建文件夹
            </el-button>
            <UploadFileManager
              :disabled="isInSharedFolderContext"
              :cur-folder-obj="curFolderObj"
              :breadcrumb-data="breadcrumbData"
              :file-list-data="fileListData"
              @upload-complete="getFolderData(curFolderObj.bizId)"
            />
          </div>
          <el-dropdown trigger="click" @command="switchViewMode" popper-class="view-mode-dropdown">
            <el-button class="view-mode-trigger" text>
              <el-icon>
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
      <div class="selection-toolbar" v-if="selectedItemCount > 0">
        <span class="selection-count">已选择{{ selectedItemCount }}个项目（文件夹{{ selectedFolders.length }}，文件{{ selectedFiles.length }}）</span>
        <el-button type="primary" plain size="small" @click="renameSelectedItems" :disabled="isInSharedFolderContext">批量重命名</el-button>
        <el-button type="primary" plain size="small" @click="moveSelectedItems" :disabled="isInSharedFolderContext">批量移动</el-button>
        <el-button type="danger" plain size="small" @click="deleteSelectedItems" :disabled="isInSharedFolderContext">批量删除</el-button>
        <el-button text size="small" @click="clearSelectedItems">取消选择</el-button>
      </div>
      <div class="file-count-info">
        共 {{ fileListData.length }} 个文件，{{ visibleFolderData.length }} 个文件夹
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
        <!-- 素材列表 - 网格视图 -->
        <div class="material-list">
          <div v-if="loading" class="loading-container">
            <el-loading-text>正在加载素材...</el-loading-text>
          </div>
          <div v-else-if="visibleFolderData.length == 0 && fileListData.length == 0" class="empty-state">
            <el-empty description="暂无内容" />
          </div>
          <div v-else-if="viewMode === 'thumbnail'" class="material-grid">
            <!-- 文件夹列表 -->
            <div class="subFolder" v-for="(item, index) in visibleFolderData" :key="index"
              :class="{ 'is-selected': isFolderSelected(item) }"
              @mouseenter="onSubFolderMouseEnter(item)" @mouseleave="onSubFolderMouseLeave(item)">
              <span class="file-select-box" v-show="item._hover || isFolderSelected(item)" @click.stop>
                <el-checkbox
                  :model-value="isFolderSelected(item)"
                  :disabled="isInSharedFolderContext"
                  @change="(checked) => toggleFolderSelected(item, checked)"
                />
              </span>
              <span class="subFolder-actions">
                <el-icon
                  class="action-icon"
                  @click.stop="toggleFolderShare(item)"
                  :title="getFolderShareStatus(item) ? '取消共享' : '放入共享'"
                  v-show="item._hover && isTopSectionLevel && auth.hasRoleOr(['admin', 'studio'])"
                  :style="{ color: getFolderShareStatus(item) ? '#67c23a' : '#909399' }"
                >
                  <Share />
                </el-icon>
                <el-icon class="action-icon" @click.stop="editFolder(item)" title="重命名" v-show="item._hover && !isInSharedFolderContext"
                  style="color: #409eff;">
                  <Edit />
                </el-icon>
                <el-icon class="action-icon" @click.stop="moveFolder(item)" title="移动" v-show="item._hover && !isInSharedFolderContext"
                  style="color: #67c23a;">
                  <ArrowRight />
                </el-icon>
                <el-icon class="action-icon" @click.stop="deleteFolder(item)" title="删除" v-show="item._hover && !isInSharedFolderContext"
                  style="color: #f56c6c;">
                  <Delete />
                </el-icon>
                </span>
              <el-icon @click="selectFolder(item)">
                <FolderOpened />
              </el-icon>
              <div class="subFolderName">{{ item.filePath }}</div>
            </div>
            <!-- 文件列表 -->
            <div v-for="material in fileListData" :key="material.id" class="material-item"
              :class="{ 'is-selected': isFileSelected(material) }"
              @mouseenter="onSubFolderMouseEnter(material)" @mouseleave="onSubFolderMouseLeave(material)">
                <span class="file-select-box" v-show="material._hover || isFileSelected(material)" @click.stop>
                  <el-checkbox
                    :model-value="isFileSelected(material)"
                    :disabled="isInSharedFolderContext"
                    @change="(checked) => toggleFileSelected(material, checked)"
                  />
                </span>
                <span class="subFolder-actions">
                  <el-icon class="action-icon" @click.stop="editFile(material)" title="重命名" v-show="material._hover && !isInSharedFolderContext" style="color: #409eff;">
                    <Edit />
                  </el-icon>
                  <el-icon class="action-icon" @click.stop="moveFile(material)" title="移动" v-show="material._hover && !isInSharedFolderContext" style="color: #67c23a;">
                    <ArrowRight />
                  </el-icon>
                  <el-icon class="action-icon" @click.stop="deleteFile(material)" title="删除" v-show="material._hover && !isInSharedFolderContext" style="color: #f56c6c;">
                    <Delete />
                  </el-icon>
                </span>
              <div class="material-thumb">
                <img v-if="isImage(material.minioPath)" :src="getProxyPath(material.coverPath) || getProxyPath(material.minioPath)" :alt="material.fileName"
                  @click="previewImg(material)" />
                <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="previewVideo(material)">
                  <el-icon class="file-icon">
                    <VideoPlay />
                  </el-icon>
                  <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                    style="max-width: 95%; max-height: 95%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                  <img :src="getProxyPath(material.coverPath)" :alt="material.fileName"/>
                </div>
                <el-icon v-else class="file-icon" @click="downloadFile(material)" style="cursor:pointer;">
                  <Document />
                </el-icon>
              </div>
              
              <div class="material-details">
                <div class="fileName" :title="material.fileName">{{ material.fileName }}</div>
                <div class="file-id">ID: {{ material.id }}</div>
                <div class="file-id">大小: {{ formatFileSize(material.fileSize) }}</div>
                <div class="file-status">
                  <!-- 待标注:0  待审核:1  已审核:2  标注失败:3 -->
                  <el-tag :type="getStatusTagType(material.annotationStatus)" size="medium">
                    {{ getStatusText(material.annotationStatus) }}
                  </el-tag>
                </div>
                <!-- <div class="file-info">
                  <span class="file-size">{{ formatFileSize(material.fileSize) }}</span>
                  <span class="file-type">类型: {{ getFileType(material.minioPath) }}</span>
                  <span class="upload-time">上传时间: {{ formatDate(material.createTime) }}</span>
                </div> -->
              </div>
              
              <div class="material-actions">
                <el-button type="primary" size="small" @click.stop="showMaterialDetail(material)" icon="Edit">
                  标注
                </el-button>
                <!-- <el-button type="danger" size="small" @click.stop="deleteFile(material)" icon="Delete" style="margin-left: 8px;">
                </el-button> -->
              </div>

            </div>
          </div>
          <div v-else class="material-table-wrapper">
            <el-table
              ref="folderTableRef"
              :data="listViewRows"
              class="material-table"
              :row-key="getListRowKey"
              @selection-change="handleFolderTableSelectionChange"
            >
              <el-table-column type="selection" width="52" :selectable="isFolderFileSelectable" />
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
                      :src="getProxyPath(row.coverPath) || getProxyPath(row.minioPath)"
                      :alt="row.fileName"
                      @click.stop="previewImg(row)"
                    />
                    <img
                      v-else-if="isVideo(row.minioPath) && row.coverPath"
                      class="table-thumb"
                      :src="getProxyPath(row.coverPath)"
                      :alt="row.fileName"
                      @click.stop="previewVideo(row)"
                    />
                    <span v-else-if="isVideo(row.minioPath)" class="table-type-icon" @click.stop="previewVideo(row)">
                      <el-icon>
                        <VideoPlay />
                      </el-icon>
                    </span>
                    <span v-else class="table-type-icon" @click.stop="downloadFile(row)">
                      <el-icon>
                        <Document />
                      </el-icon>
                    </span>
                    <span class="table-file-name-text" :title="row.fileName" @click="handleListNameClick(row)">
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
                    <el-button v-if="auth.hasRoleOr(['admin', 'studio'])" :type="getFolderShareStatus(row) ? 'success' : 'default'" link @click.stop="toggleFolderShare(row) ">
                      {{ getFolderShareStatus(row) ? '取消共享' : '放入共享' }}
                    </el-button>
                    <el-button link type="primary" @click.stop="editFolder(row)" v-hasPermi="['xcsc:FilePathMapping:edit']" :disabled="isInSharedFolderContext">重命名</el-button>
                    <el-button link type="primary" @click.stop="moveFolder(row)" :disabled="isInSharedFolderContext">移动</el-button>
                    <el-button link type="danger" @click.stop="deleteFolder(row)" :disabled="isInSharedFolderContext">删除</el-button>
                  </div>
                  <div v-else class="table-actions">
                    <el-button link type="primary" @click.stop="showMaterialDetail(row)">标注</el-button>
                    <el-button link type="primary" @click.stop="editFile(row)" :disabled="isInSharedFolderContext">重命名</el-button>
                    <el-button link type="primary" @click.stop="moveFile(row)" :disabled="isInSharedFolderContext">移动</el-button>
                    <el-button link type="danger" @click.stop="deleteFile(row)" :disabled="isInSharedFolderContext">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览视频 -->
    <el-dialog v-model="videoDialogVisible" :title="videoDialogTitle" width="50vw" :close-on-click-modal="false"
      style="margin-top: 15vh;">
      <video :src="videoFilePath" controls autoplay loop muted playsinline
        style="max-width: 100%; max-height: 50vh; width: auto; height: auto; display: block; object-fit: contain;margin: 0 auto;"></video>
    </el-dialog>

    <RenameDeleteDialog
      ref="renameDeleteDialogRef"
      :show-search-results="showSearchResults"
      :folder-data="folderData"
      :file-list-data="fileListData"
      :breadcrumb-data="breadcrumbData"
      :cur-folder-obj="curFolderObj"
      @refresh-folder="getFolderData(curFolderObj.bizId)"
      @refresh-query="getQueryData"
    />

    <!-- 素材标注弹框 -->
    <MarkDialog ref="markDialogRef" @updateFileList="getFolderData(curFolderObj.bizId)"></MarkDialog>
    
    <!-- 移动文件/文件夹弹框 -->
    <MoveDialog
      ref="moveDialogRef"
      :show-search-results="showSearchResults"
      :folder-data="folderData"
      :file-list-data="fileListData"
      :breadcrumb-data="breadcrumbData"
      :cur-folder-obj="curFolderObj"
      @refresh-folder="getFolderData(curFolderObj.bizId)"
      @refresh-query="getQueryData"
    />
  </div>
</template>

<!-- <script setup name="MaterialAnnotation"> -->
<script setup name="Annotation">
// ==================== 依赖与基础上下文 ====================
const { proxy } = getCurrentInstance();
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { api as viewerApi } from "v-viewer";
import { Search, VideoCamera, Document, Check, Edit, VideoPlay, Back, ArrowRight, ArrowUp, FolderAdd, FolderOpened, Delete, Grid, List, DocumentCopy, Refresh, Share, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFolderList, getSharedFolderList, updateShared, getFileList, updateFile, delFile, getFileEditKey, delFolder, updateFolder } from "@/api/xcsc/uploadFile"
import auth from '@/plugins/auth'
import MarkDialog from './components/markDialog.vue'
import UploadFileManager from './components/uploadFileManager.vue'
import RenameDeleteDialog from './components/renameDeleteDialog.vue'
import MoveDialog from './components/MoveDialog.vue'
import EXIF from 'exif-js';
import {
  getListRowKey,
  getListFileType,
  getListRowSize,
  isImage,
  isVideo,
  getFileName,
  formatFileSize,
  formatDateTime,
  getFileType
} from '@/views/utils/materialCommon'
// 修复压缩版的变量丢失 bug（关键：手动声明缺失的变量）
window.EXIF = EXIF;
window.n = window.n || {}; // 补充缺失的 n 变量（根据错误提示补充）

// ==================== 页面筛选 / 排序 / 展示状态 ====================
// 搜索和筛选
const searchKeyword = ref('')// 搜索关键词
const statusFilter = ref('')// 素材状态筛选
const showSearchResults = ref(false) // 是否显示搜索结果

// 排序相关
const SORT_PREFERENCE_KEY = 'material_upload_sort_preference'
const sortField = ref('name') // 当前排序字段：name, size, date
const sortOrder = ref('desc') // 当前排序方向：asc, desc
const viewMode = ref('list') // 当前展示模式：thumbnail, list
const nameCollator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' }) // 用于文件名排序的比较器

function loadSortPreference() {
  try {
    const raw = localStorage.getItem(SORT_PREFERENCE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    const validField = ['name', 'size', 'date', 'type'].includes(parsed?.field)
    const validOrder = ['asc', 'desc'].includes(parsed?.order)
    if (validField) sortField.value = parsed.field
    if (validOrder) sortOrder.value = parsed.order
  } catch (_) {
    // 忽略损坏的本地缓存
  }
}

function saveSortPreference() {
  localStorage.setItem(SORT_PREFERENCE_KEY, JSON.stringify({
    field: sortField.value,
    order: sortOrder.value
  }))
}

// ==================== 文件夹导航与列表数据 ====================
// 素材列表
const loading = ref(false)
//是否开启文件夹模式（用于根目录）
const showFolder = ref(true)
const folderBoxRef = ref(null)
//当前文件夹对象
const curFolderObj = reactive({
  filePath: '',
  bizId: '',
  id: '',
})
//面包屑导航
const breadcrumbData = ref([])
const SCROLL_ROOT_KEY = 'view:root-folder'
const SCROLL_FOLDER_KEY_PREFIX = 'view:folder:'
const scrollPositionMap = new Map()

function getPageScrollTop() {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
}

function setPageScrollTop(top) {
  window.scrollTo({ top, behavior: 'auto' })
}

function getFolderScrollKeyById(bizId) {
  if (!bizId) return SCROLL_ROOT_KEY
  return `${SCROLL_FOLDER_KEY_PREFIX}${bizId}`
}

function getCurrentScrollKey() {
  if (showFolder.value) {
    return SCROLL_ROOT_KEY
  }
  return getFolderScrollKeyById(curFolderObj.bizId || 0)
}

function saveCurrentScrollPosition() {
  const key = getCurrentScrollKey()
  if (!key) return
  if (showFolder.value && folderBoxRef.value) {
    scrollPositionMap.set(key, folderBoxRef.value.scrollTop || 0)
    return
  }
  scrollPositionMap.set(key, getPageScrollTop())
}

function restoreScrollPositionByKey(key) {
  const targetTop = scrollPositionMap.get(key) || 0
  nextTick(() => {
    requestAnimationFrame(() => {
      if (key === SCROLL_ROOT_KEY && folderBoxRef.value) {
        folderBoxRef.value.scrollTop = targetTop
        return
      }
      setPageScrollTop(targetTop)
    })
  })
}

//点击子文件展示相关文件夹及文件
function selectFolder(item, type) {
  saveCurrentScrollPosition()
  console.log('====item==', item);
  Object.assign(curFolderObj, item)
   
  if (type == 'isRootFolder') {
    showFolder.value = false
    breadcrumbData.value = [{
      filePath: item.filePath,
      bizId: item.bizId,
    }]
  }
  else {
    breadcrumbData.value.push({
      filePath: item.filePath,
      bizId: item.bizId,
    })
  }
  getFolderData(item.bizId, { restoreScrollKey: getFolderScrollKeyById(item.bizId) })
  
  console.log('=== breadcrumbData.value===', breadcrumbData.value);

}
//点击面包屑
function clickBreadcrumb(item, index) {
  saveCurrentScrollPosition()
  console.log('===item===', item);
  Object.assign(curFolderObj, item)
  getFolderData(item.bizId, { restoreScrollKey: getFolderScrollKeyById(item.bizId) })
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
// 返回按钮
const backFolder = () => {
  saveCurrentScrollPosition()
  //返回根目录
  if (breadcrumbData.value.length == 1) {
    showFolder.value = true
    // 先重置curFolderObj，再调用getFolderData
    Object.assign(curFolderObj, {
      filePath: '',
      bizId: 0,
      id: 0
    });
    getFolderData(0, { restoreScrollKey: SCROLL_ROOT_KEY })
    // return
  } 
  else {
    const prevFolder = breadcrumbData.value[breadcrumbData.value.length - 2]
    Object.assign(curFolderObj, {
      filePath: prevFolder.filePath,
      bizId: prevFolder.bizId,
      id: prevFolder.id,
      isShared: prevFolder.isShared
    });
    getFolderData(
      breadcrumbData.value[breadcrumbData.value.length - 2].bizId,
      { restoreScrollKey: getFolderScrollKeyById(breadcrumbData.value[breadcrumbData.value.length - 2].bizId) }
    ) //获取上一级文件夹的bizId
    breadcrumbData.value.pop()
  }
  console.log('===返回后的curFolderObj===', curFolderObj);
  console.log('===breadcrumbData.value===', breadcrumbData.value);
}

// 获取文件夹及文件列表数据
const folderData = ref([]) //文件夹列表
const fileListData = ref([])//文件列表
const queryfileListData = ref([])//搜索结果文件列表
const SHARED_FOLDER_NAME = '共享文件夹'
const canViewSharedFolder = computed(() => auth.hasPermi('xcsc:FilePathMapping:share'))

function prioritizeSharedFolderFirst(folders = []) {
  const sharedFolders = []
  const otherFolders = []
  folders.forEach((item) => {
    if (item?.filePath === SHARED_FOLDER_NAME) {
      sharedFolders.push(item)
    } else {
      otherFolders.push(item)
    }
  })
  return [...sharedFolders, ...otherFolders]
}

const visibleFolderData = computed(() => {
  const folders = canViewSharedFolder.value
    ? folderData.value
    : folderData.value.filter(item => item.filePath !== SHARED_FOLDER_NAME)

  return prioritizeSharedFolderFirst(folders)
})
const isTopSectionLevel = computed(() => !showFolder.value && breadcrumbData.value.length === 1)
const isInSharedFolderContext = computed(() => {
  return breadcrumbData.value.length > 0 && breadcrumbData.value[0].filePath === SHARED_FOLDER_NAME;
})

const listViewRows = computed(() => {
  const folders = visibleFolderData.value.map(item => ({ ...item, _rowType: 'folder' }))
  const files = fileListData.value.map(item => ({ ...item, _rowType: 'file' }))
  return [...folders, ...files]
})

const queryTableRef = ref(null)
const folderTableRef = ref(null)
const selectedFileIds = ref([])
const selectedFolderBizIds = ref([])
const searchCurrentPage = ref(1)
const searchPageSize = ref(20)
const paginatedQueryFileListData = computed(() => {
  const start = (searchCurrentPage.value - 1) * searchPageSize.value
  const end = start + searchPageSize.value
  return queryfileListData.value.slice(start, end)
})
function normalizeSelectionId(value) {
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}

function getFileSelectionId(file) {
  return normalizeSelectionId(file?.id)
}

function getFolderSelectionId(folder) {
  return normalizeSelectionId(folder?.bizId ?? folder?.id)
}

const availableSelectableItems = computed(() => {
  if (!showSearchResults.value && isInSharedFolderContext.value) {
    return []
  }
  const files = (showSearchResults.value ? queryfileListData.value : fileListData.value)
    .filter(item => getFileSelectionId(item))
    .map(item => ({ ...item, _rowType: 'file' }))
  if (showSearchResults.value) {
    return files
  }
  const folders = visibleFolderData.value
    .filter(item => getFolderSelectionId(item))
    .map(item => ({ ...item, _rowType: 'folder' }))
  return [...folders, ...files]
})
const allItemsSelected = computed(() => {
  if (availableSelectableItems.value.length === 0) return false
  const fileSet = new Set(selectedFileIds.value.map(id => normalizeSelectionId(id)))
  const folderSet = new Set(selectedFolderBizIds.value.map(id => normalizeSelectionId(id)))
  return availableSelectableItems.value.every((item) => {
    if (item?._rowType === 'folder') {
      return folderSet.has(getFolderSelectionId(item))
    }
    return fileSet.has(getFileSelectionId(item))
  })
})
const selectedFiles = computed(() => {
  const idSet = new Set(selectedFileIds.value.map(id => normalizeSelectionId(id)))
  const source = showSearchResults.value ? queryfileListData.value : fileListData.value
  return source.filter(item => idSet.has(getFileSelectionId(item)))
})
const selectedFolders = computed(() => {
  if (showSearchResults.value) return []
  const idSet = new Set(selectedFolderBizIds.value.map(id => normalizeSelectionId(id)))
  return visibleFolderData.value.filter(item => idSet.has(getFolderSelectionId(item)))
})
const selectedItemCount = computed(() => selectedFiles.value.length + selectedFolders.value.length)

function clearSelectedItems() {
  selectedFileIds.value = []
  selectedFolderBizIds.value = []
  nextTick(() => {
    queryTableRef.value?.clearSelection?.()
    folderTableRef.value?.clearSelection?.()
  })
}

function isFileSelected(file) {
  return selectedFileIds.value
    .map(id => normalizeSelectionId(id))
    .includes(getFileSelectionId(file))
}

function isFolderSelected(folder) {
  return selectedFolderBizIds.value
    .map(id => normalizeSelectionId(id))
    .includes(getFolderSelectionId(folder))
}

function toggleFileSelected(file, checked) {
  const fileId = getFileSelectionId(file)
  if (!fileId) return
  if (!showSearchResults.value && isInSharedFolderContext.value) return
  const idSet = new Set(selectedFileIds.value.map(id => normalizeSelectionId(id)))
  if (checked) {
    if (!idSet.has(fileId)) {
      selectedFileIds.value = [...selectedFileIds.value, fileId]
    }
    return
  }
  selectedFileIds.value = selectedFileIds.value.filter(id => normalizeSelectionId(id) !== fileId)
}

function toggleFolderSelected(folder, checked) {
  const folderId = getFolderSelectionId(folder)
  if (!folderId) return
  if (showSearchResults.value) return
  if (isInSharedFolderContext.value) return
  const idSet = new Set(selectedFolderBizIds.value.map(id => normalizeSelectionId(id)))
  if (checked) {
    if (!idSet.has(folderId)) {
      selectedFolderBizIds.value = [...selectedFolderBizIds.value, folderId]
    }
    return
  }
  selectedFolderBizIds.value = selectedFolderBizIds.value.filter(id => normalizeSelectionId(id) !== folderId)
}

function handleSearchTableSelectionChange(rows) {
  const currentPageIds = new Set(paginatedQueryFileListData.value.map(item => getFileSelectionId(item)))
  const preservedIds = selectedFileIds.value.filter(id => !currentPageIds.has(normalizeSelectionId(id)))
  const currentSelectedIds = rows.map(item => getFileSelectionId(item)).filter(Boolean)
  selectedFileIds.value = [...preservedIds, ...currentSelectedIds]
}

function isFolderFileSelectable(row) {
  if (isInSharedFolderContext.value) return false
  return true
}

function handleFolderTableSelectionChange(rows) {
  selectedFileIds.value = rows
    .filter(item => item?._rowType === 'file')
    .map(item => getFileSelectionId(item))
    .filter(Boolean)
  selectedFolderBizIds.value = rows
    .filter(item => item?._rowType === 'folder')
    .map(item => getFolderSelectionId(item))
    .filter(Boolean)
}

function syncTableSelectionByIds() {
  nextTick(() => {
    const fileIdSet = new Set(selectedFileIds.value.map(id => normalizeSelectionId(id)))
    const folderIdSet = new Set(selectedFolderBizIds.value.map(id => normalizeSelectionId(id)))
    if (showSearchResults.value) {
      const table = queryTableRef.value
      table?.clearSelection?.()
      paginatedQueryFileListData.value.forEach((row) => {
        if (fileIdSet.has(getFileSelectionId(row))) {
          table?.toggleRowSelection?.(row, true)
        }
      })
      return
    }
    const table = folderTableRef.value
    table?.clearSelection?.()
    listViewRows.value.forEach((row) => {
      if (row?._rowType === 'file' && fileIdSet.has(getFileSelectionId(row))) {
        table?.toggleRowSelection?.(row, true)
      }
      if (row?._rowType === 'folder' && folderIdSet.has(getFolderSelectionId(row))) {
        table?.toggleRowSelection?.(row, true)
      }
    })
  })
}

function toggleSelectAllItems() {
  if (allItemsSelected.value) {
    clearSelectedItems()
    return
  }
  if (availableSelectableItems.value.length === 0) {
    ElMessage.warning('当前没有可选择的项目')
    return
  }
  selectedFileIds.value = availableSelectableItems.value
    .filter(item => item?._rowType === 'file')
    .map(item => getFileSelectionId(item))
    .filter(Boolean)
  selectedFolderBizIds.value = availableSelectableItems.value
    .filter(item => item?._rowType === 'folder')
    .map(item => getFolderSelectionId(item))
    .filter(Boolean)
  syncTableSelectionByIds()
}

function handleSearchPageSizeChange(size) {
  searchPageSize.value = size
  searchCurrentPage.value = 1
  setPageScrollTop(0)
  syncTableSelectionByIds()
}

function handleSearchPageChange(page) {
  searchCurrentPage.value = page
  setPageScrollTop(0)
  syncTableSelectionByIds()
}

function getFolderShareStatus(folder) {
  const val = folder?.isShared ?? false;
  return val === 1 || val === '1' || val === true
}

function toggleFolderShare(folder) {
  const id = folder?.id
  if (!id) {
    ElMessage.warning('未获取到文件夹id')
    return
  }

  const targetShared = getFolderShareStatus(folder) ? 0 : 1
  let params = {
    id: id,
    isShared: targetShared,
  }
  updateShared(params).then(() => {
    folder.isShared = targetShared
    proxy.$modal.msgSuccess(targetShared === 1 ? '已放入共享文件夹' : '已取消共享')
    getFolderData(curFolderObj.bizId || 0)
  }).catch(() => { })
}

function switchViewMode(mode) {
  if (mode === 'thumbnail' || mode === 'list') {
    viewMode.value = mode
  }
}
//获取文件夹及文件列表数据
async function getFolderData(pid, options = {}) {
  loading.value = true
  folderData.value = []
  fileListData.value = []
  clearSelectedItems()
  const restoreScrollKey = options.restoreScrollKey
  let params = {
    pid: pid,
  }
  console.log('===pid===', pid);
  console.log('===params===', params);
  console.log('===curFolderObj===', curFolderObj);
  try {
    //如果当前文件夹是共享文件夹
    if (curFolderObj.filePath === SHARED_FOLDER_NAME) {
      await getSharedFolderList().then(res => {
        const sharedFolders = res.data || []
        console.log('===sharedFolders===', sharedFolders);
        folderData.value = sharedFolders
        console.log('===folderData.value===', folderData.value);
        fileListData.value = []
      })
    }
    //其他文件夹
    else {
      const folderPromise = getFolderList(params).then(res => {
        folderData.value = res.data || []
      })
      let filePromise = Promise.resolve()
      if (pid !== 0) {
        let param = {
          folderId: pid,
        }
        console.log('===params===', params);
        filePromise = getFileList(param).then(res => {
          fileListData.value = res.data || []
          console.log('===fileListData.value===', fileListData.value);
        })
      } else {
        fileListData.value = []
        filePromise = Promise.resolve()
      }
      await Promise.all([folderPromise, filePromise])
    }
    applyCurrentSort()
  } finally {
    loading.value = false
  }

  if (restoreScrollKey) {
    restoreScrollPositionByKey(restoreScrollKey)
  }
}
loadSortPreference()
getFolderData(0)

// ==================== 搜索与刷新 ====================
// 获取搜索结果文件列表
function getQueryData() {
  clearSelectedItems()
  searchCurrentPage.value = 1
  loading.value = true
  queryfileListData.value = []
  let params = {
    fileName: searchKeyword.value,
    annotationStatus: statusFilter.value,
  }
  getFileList(params).then(res => {
    queryfileListData.value = res.data || []
    showSearchResults.value = true // 显示搜索结果
    showFolder.value = false // 隐藏文件夹模式
    applyCurrentSort()
  }).finally(() => {
    loading.value = false
  })
}

function refreshData() {
  if (showSearchResults.value) {
    getQueryData()
    return
  }
  const pid = curFolderObj.bizId || 0
  getFolderData(pid)
}

// 重置搜索态并回到目录视图
function resetSearch() {
  clearSelectedItems()
  searchCurrentPage.value = 1
  showSearchResults.value = false
  if (curFolderObj.bizId == 0) {
    showFolder.value = true // 确保显示文件夹视图
  }

  searchKeyword.value = ''
  statusFilter.value = ''
  console.log("==curFolderObj==", curFolderObj)
  getFolderData(curFolderObj.bizId)
}
// ==================== 文件名与路径工具 ====================
function getCurrentFolderPath() {
  let folderPath = ''
  breadcrumbData.value.forEach((item, idx) => {
    folderPath += item.filePath
    if (idx !== breadcrumbData.value.length - 1) {
      folderPath += '/'  
    }
  })
  return folderPath
}

function getFileExtension(name) {
  if (!name) return ''
  const dotIndex = name.lastIndexOf('.')
  return dotIndex > -1 ? name.substring(dotIndex) : ''
}

function getPathDirectory(path) {
  if (!path) return ''
  const slashIndex = path.lastIndexOf('/')
  return slashIndex > -1 ? path.substring(0, slashIndex) : ''
}

function buildRenameLocalPath(file, newName) {
  const fromLocalPath = getPathDirectory(file?.localPath || '')
  if (fromLocalPath) {
    return `${fromLocalPath}/${newName}`
  }
  if (!showSearchResults.value) {
    const folderPath = getCurrentFolderPath()
    if (folderPath) {
      return `${folderPath}/${newName}`
    }
  }
  return ''
}

// ==================== 批量文件操作 ====================
// 按当前文件夹名批量重命名文件
function renameFilesByFolderName() {
  if (showFolder.value || !curFolderObj.bizId) {
    ElMessage.warning('请选择一个文件夹')
    return
  }
  if (fileListData.value.length === 0) {
    ElMessage.warning('当前文件夹下没有文件')
    return
  }
  const folderName = curFolderObj.filePath || '文件'
  const folderPath = getCurrentFolderPath()
  proxy.$modal.confirm(`确定将当前文件夹下的${fileListData.value.length}个文件重命名为"${folderName}1"..."${folderName}${fileListData.value.length}"吗?`).then(async () => {
    const updatePromises = fileListData.value.map(async (file, idx) => {
      try {
        // 获取文件编辑Key
        const keyRes = await getFileEditKey(file.id)
        const tempFileKey = keyRes.data.fileKey
        const ext = getFileExtension(file.fileName || getFileName(file.minioPath))
        const newName = `${folderName}${idx + 1}${ext}`
        const params = {
          id: file.id,
          fileName: newName,
          localPath: `${folderPath}/${newName}`,
        }
        return updateFile(params, tempFileKey)
      } catch (err) {
        console.error('获取文件密钥失败:', err)
        throw err
      }
    })
    return Promise.all(updatePromises)
  }).then(() => {
    ElMessage.success('批量重命名成功！')
    getFolderData(curFolderObj.bizId)
  }).catch(() => { })
}

// 勾选项目批量删除（文件夹/文件/混合）
function deleteSelectedItems() {
  if (selectedItemCount.value === 0) {
    ElMessage.warning('请先勾选文件夹或文件')
    return
  }
  const folderCount = selectedFolders.value.length
  const fileCount = selectedFiles.value.length
  proxy.$modal.confirm(`是否确认删除选中的${selectedItemCount.value}个项目（文件夹${folderCount}，文件${fileCount}）?`).then(() => {
    const folderDeletePromises = selectedFolders.value.map(folder => delFolder(folder.bizId))
    const fileDeletePromises = selectedFiles.value.map(file => delFile(file.id))
    return Promise.allSettled([...folderDeletePromises, ...fileDeletePromises])
  }).then((results) => {
    const failed = results.filter(item => item.status === 'rejected').length
    const success = results.length - failed
    if (success > 0) {
      ElMessage.success(`已删除${success}个项目`)
    }
    if (failed > 0) {
      ElMessage.warning(`${failed}个项目删除失败，请重试`)
    }
    clearSelectedItems()
    refreshData()
  }).catch(() => { })
}

// 批量移动项目（文件夹/文件/混合）
function moveSelectedItems() {
  if (selectedItemCount.value === 0) {
    ElMessage.warning('请先勾选文件夹或文件')
    return
  }
  const selectedItems = [
    ...selectedFolders.value.map(item => ({ ...item, _rowType: 'folder' })),
    ...selectedFiles.value.map(item => ({ ...item, _rowType: 'file' }))
  ]
  if (selectedItems.length === 1) {
    const item = selectedItems[0]
    moveDialogRef.value.open(item, item._rowType)
    return
  }
  moveDialogRef.value.open(selectedItems, 'mixed')
}

// 勾选项目批量重命名（文件夹/文件/混合）
function renameSelectedItems() {
  if (selectedItemCount.value === 0) {
    ElMessage.warning('请先勾选文件夹或文件')
    return
  }
  if (!showSearchResults.value && isInSharedFolderContext.value) {
    ElMessage.warning('共享文件夹下不支持重命名')
    return
  }

  const defaultPrefix = showSearchResults.value ? '文件' : (curFolderObj.filePath || '项目')
  ElMessageBox.prompt('请输入批量重命名前缀，系统会自动追加序号（文件保留原后缀）', '批量重命名', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: defaultPrefix,
    inputPlaceholder: '例如：样本_',
    inputValidator: (value) => {
      if (!value || !value.trim()) return '前缀不能为空'
      return true
    }
  }).then(async ({ value }) => {
    const prefix = value.trim()
    let serial = 1
    const folderPromises = selectedFolders.value.map((folder) => {
      const params = {
        id: folder.id,
        bizId: folder.bizId,
        filePath: `${prefix}${serial++}`
      }
      return updateFolder(params)
    })
    const filePromises = selectedFiles.value.map(async (file) => {
      try {
        const keyRes = await getFileEditKey(file.id)
        const tempFileKey = keyRes.data.fileKey
        const ext = getFileExtension(file.fileName || getFileName(file.minioPath))
        const newName = `${prefix}${serial++}${ext}`
        const localPath = buildRenameLocalPath(file, newName)
        const params = {
          id: file.id,
          fileName: newName
        }
        if (localPath) {
          params.localPath = localPath
        }
        return updateFile(params, tempFileKey)
      } catch (err) {
        console.error('获取文件密钥失败:', err)
        throw err
      }
    })
    return Promise.allSettled([...folderPromises, ...filePromises])
  }).then((results) => {
    const failed = results.filter(item => item.status === 'rejected').length
    const success = results.length - failed
    if (success > 0) {
      ElMessage.success(`已重命名${success}个项目`)
    }
    if (failed > 0) {
      ElMessage.warning(`${failed}个项目重命名失败，请检查命名冲突后重试`)
    }
    clearSelectedItems()
    refreshData()
  }).catch(() => { })
}

// ==================== 重命名 / 删除弹窗 ====================
const renameDeleteDialogRef = ref(null)

// ==================== 移动弹窗 ====================
const moveDialogRef = ref(null)

function handleAddFolder() {
  renameDeleteDialogRef.value?.handleAddFolder()
}

// 编辑文件夹
function editFolder(item) {
  renameDeleteDialogRef.value?.editFolder(item)
}
// 编辑文件
function editFile(item) {
  renameDeleteDialogRef.value?.editFile(item)
}
//  删除文件夹
function deleteFolder(item) {
  renameDeleteDialogRef.value?.deleteFolder(item)
}

// 移动文件夹
function moveFolder(item) {
  moveDialogRef.value?.open(item, 'folder')
}

// 删除文件
function deleteFile(item) {
  renameDeleteDialogRef.value?.deleteFile(item)
}

// 移动文件
function moveFile(item) {
  moveDialogRef.value?.open(item, 'file')
}

// 搜索结果中删除文件
function deleteFileinQuery(item) {
  renameDeleteDialogRef.value?.deleteFileinQuery(item)
}

// 搜索结果中移动文件
function moveFileinQuery(item) {
  moveDialogRef.value?.open(item, 'file')
}

// 文件夹悬浮控制
function onSubFolderMouseEnter(item) {
  item._hover = true
}
function onSubFolderMouseLeave(item) {
  item._hover = false
}

// ==================== 列表展示与格式化工具 ====================
// 相关通用方法已抽取至 materialCommon

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '未知';
  const date = new Date(dateStr);
  return date.getFullYear() + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + String(date.getDate()).padStart(2, '0');
}

function getListRowTime(row) {
  return formatDateTime(row?.updateTime || row?.createTime);
}

function handleListNameClick(row) {
  if (!row) return;
  if (row._rowType === 'folder') {
    selectFolder(row);
    return;
  }
  const filePath = row.minioPath || '';
  if (isImage(filePath)) {
    previewImg(row);
    return;
  }
  if (isVideo(filePath)) {
    previewVideo(row);
    return;
  }
  downloadFile(row);
}
// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    '0': 'warning',
    '1': 'primary',
    '2': 'success',
    '3': 'danger'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    '0': '待标注',
    '1': '待审核',
    '2': '已审核',
    '3': '标注失败'
  }
  return textMap[status] || status
}

// ==================== 文件预览与下载 ====================

const getProxyPath = (url) => {
  if (!url) return ''
  const u = new URL(url)
  const parts = u.pathname.replace(/^\/+/, '').split('/')
  const bucket = parts.shift()
  const objectKey = parts.join('/')
// 自动获取当前环境的 API 前缀（例如 /dev-api）
  const baseApi = import.meta.env.VITE_APP_BASE_API || ''
  const params = new URLSearchParams({
    bucketName: bucket,
    filePath: objectKey
  })
  return `${baseApi}/minio/proxy?${params.toString()}`
}
// 预览图片
function previewImg(material) {
  const $viewer = viewerApi({
    options: {
      toolbar: true,
      initialViewIndex: 0,
      title: (image) => `${material.fileName}`,
    },
    images: [getProxyPath(material.minioPath)],
  });
}

//预览视频
const videoDialogVisible = ref(false)
const videoFilePath = ref('')
const videoDialogTitle = ref('')
function previewVideo(material) {
  videoDialogVisible.value = true
  videoFilePath.value = getProxyPath(material.minioPath)
  videoDialogTitle.value = material.fileName
}

//下载文件
function downloadFile(material) {
  if (material && material.minioPath) {
    window.open(material.minioPath, '_blank');
  }
}

// ==================== 标注与排序 ====================
// 显示素材详情
const markDialogRef = ref(null)
function showMaterialDetail(material) {
  // 打开 MarkDialog 弹框
  markDialogRef.value.open(material)
}

// 排序文件
function sortFiles(field) {
  // 根目录（一级公司文件夹）不参与排序
  if (!showSearchResults.value && showFolder.value) {
    return
  }

  // 如果点击的是当前排序字段，则切换排序方向
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 否则，设置新的排序字段和默认排序方向
    sortField.value = field
    sortOrder.value = 'asc'
  }
  saveSortPreference()
  applyCurrentSort()
  if (showSearchResults.value) {
    searchCurrentPage.value = 1
    syncTableSelectionByIds()
  }
}

function applyCurrentSort() {
  if (showSearchResults.value) {
    sortFileList(queryfileListData)
    return
  }
  // 根目录（一级公司文件夹）保持接口原顺序
  if (showFolder.value) {
    return
  }
  sortFolderList(folderData)
  sortFileList(fileListData)
}

function startsWithNumber(value) {
  return /^\d/.test(String(value || '').trim())
}

function compareNameWithNumberPriority(nameA, nameB, order) {
  const normalizedA = String(nameA || '').toLowerCase()
  const normalizedB = String(nameB || '').toLowerCase()
  const aStartsWithNumber = startsWithNumber(normalizedA)
  const bStartsWithNumber = startsWithNumber(normalizedB)

  if (aStartsWithNumber !== bStartsWithNumber) {
    return aStartsWithNumber ? -1 : 1
  }

  return nameCollator.compare(normalizedA, normalizedB) * order
}

// 具体的排序实现
function sortFileList(fileList) {
  const order = sortOrder.value === 'asc' ? 1 : -1
  
  fileList.value = [...fileList.value].sort((a, b) => {
    switch (sortField.value) {
      case 'name':
        // 按文件名排序
        const nameA = (a.fileName || '').toLowerCase()
        const nameB = (b.fileName || '').toLowerCase()
        return compareNameWithNumberPriority(nameA, nameB, order)
      
      case 'size':
        // 按文件大小排序
        const sizeA = a.fileSize || 0
        const sizeB = b.fileSize || 0
        return (sizeA - sizeB) * order
      
      case 'date':
        // 按创建日期排序
        const dateA = new Date(a.createTime || 0).getTime()
        const dateB = new Date(b.createTime || 0).getTime()
        return (dateA - dateB) * order
      
      case 'type':
        // 按文件类型排序
        const typeA = getFileType(a.minioPath || '').toLowerCase()
        const typeB = getFileType(b.minioPath || '').toLowerCase()
        return nameCollator.compare(typeA, typeB) * order
      
      default:
        return 0
    }
  })
}

// 文件夹排序
function sortFolderList(folderList) {
  const order = sortOrder.value === 'asc' ? 1 : -1

  folderList.value = [...folderList.value].sort((a, b) => {
    switch (sortField.value) {
      case 'name': {
        const nameA = (a.filePath || '').toLowerCase()
        const nameB = (b.filePath || '').toLowerCase()
        return compareNameWithNumberPriority(nameA, nameB, order)
      }
      case 'date': {
        const dateA = new Date(a.updateTime || a.createTime || 0).getTime()
        const dateB = new Date(b.updateTime || b.createTime || 0).getTime()
        return (dateA - dateB) * order
      }
      case 'size':
      case 'type':
      default: {
        const nameA = (a.filePath || '').toLowerCase()
        const nameB = (b.filePath || '').toLowerCase()
        return nameCollator.compare(nameA, nameB) * order
      }
    }
  })
}

</script>

<style scoped lang="scss">
.subFolder-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  gap: 4px;
}

.action-icon {
  font-size: 18px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.2s;
  background-color: #ffffff;
  border-radius: 50%;
  padding: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.material-item {
  position: relative;
}

.folderBox {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 18px;
  // flex-wrap: wrap;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-top: 16px;

  .folderItem {
    margin: 8px;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 250px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    transition: all 0.3s ease;
    border: 1px solid transparent;

    :deep(.el-icon) {
      font-size: 120px;
      font-weight: 500;
      color: #ffd45e;
      margin-bottom: 8px;
    }

    .folderName {
      text-align: center;
      font-size: 15px;
      color: #303133;
      padding: 0 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    &:hover {
      background-color: #ecf5ff;
      border-color: #c6e2ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

.pageTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e4e7ed;
  margin-top: 16px;

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

  .btnList {
    display: flex;
    gap: 12px;
  }

  .pageTopRight {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .view-mode-trigger {
    font-size: 18px;
    color: #606266;
    padding: 6px;
    border-radius: 4px;
    border: none;

    &:hover,
    &:focus-visible {
      color: #409eff;
      background: #ecf5ff;
    }
  }

}

:deep(.view-mode-dropdown .view-mode-option) {
  display: inline-flex;
  align-items: center;
  min-width: 72px;
}

:deep(.view-mode-dropdown .view-mode-prefix) {
  width: 16px;
  margin-right: 6px;
  flex: 0 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.view-mode-dropdown .view-mode-check) {
  color: #409eff;
}

:deep(.view-mode-dropdown .view-mode-option .is-active) {
  color: #409eff;
}

.search-filter {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 6px;
    transition: all 0.3s ease;
  }
}

.search-result-info {
  margin-left: 20px;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.selection-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #f5faff;
  border-bottom: 1px solid #d9ecff;
}

.selection-count {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.file-count-info {
  padding: 12px 20px;
  font-size: 14px;
  color: #606266;
  // background: #ffffff;
  // border-bottom: 1px solid #e4e7ed;
}

.sort-controls {
  padding: 8px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .sort-label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }
  
  :deep(.el-button) {
    margin-right: 8px;
    
    .el-icon {
      margin-left: 4px;
      transition: transform 0.3s ease;
      
      &.is-reverse {
        transform: rotate(180deg);
      }
    }
  }
}

.sort-arrow {
  margin-left: 4px;
  transition: transform 0.3s ease;
}

.sort-arrow.is-reverse {
  transform: rotate(180deg);
}

.el-button .el-icon {
  transition: transform 0.3s ease;
  
  &.is-reverse {
    transform: rotate(180deg);
  }
}

.sortable-header {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: #409eff;
  }
}

.material-table-wrapper {
  width: 100%;
}

.table-file-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.table-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f7fa;
  cursor: pointer;
  flex-shrink: 0;
}

.table-type-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #909399;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.table-type-icon.folder {
  color: #e6a23c;
  width: 48px;
  height: 48px;
  
  :deep(.el-icon) {
    font-size: 24px;
  }
}

.table-file-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
  cursor: pointer;

  &:hover {
    color: #409eff;
  }
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-body {
  background: #ffffff;
  border-radius: 0 0 8px 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-height: 400px;
}

.material-grid {
  // display: flex;
  // flex-wrap: wrap;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
  gap: 18px;
}

.subFolder {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  height: 255px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  background: #fafafa;

  :deep(.el-icon) {
    font-size: 120px;
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

  &.is-selected {
    border-color: #409eff;
    background-color: #ecf5ff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
  }

  .subFolder-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
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

.subFolder,
.material-item {
  .file-select-box {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 11;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(64, 158, 255, 0.28);
    border-radius: 6px;
    line-height: 0;
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
  }

  .file-select-box :deep(.el-checkbox) {
    margin: 0;
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .file-select-box :deep(.el-checkbox__input) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .file-select-box :deep(.el-checkbox__inner) {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border-color: #9ec5ff;
  }

  .file-select-box :deep(.el-checkbox__inner::after) {
    left: 6px;
    top: 2px;
    width: 4px;
    height: 8px;
  }
}

.material-item {
    margin: 0;
    position: relative;
    width: 100%;
    height: 255px;
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

    &.is-selected {
      border-color: #409eff;
      background-color: #ecf5ff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
    }

  .material-thumb {
    // flex: 2;
    width: 100%;
    height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #f5f7fa;
    // position: relative;

    img {
      width: 95%;
      height: 95%;
      // object-fit: cover;
      contain: content;
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
        // object-fit: contain;
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

    .file-icon {
      font-size: 64px;
      color: #909399;
    }
  }

  .material-details {
      // flex: 1;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .file-status {
      margin-bottom: 8px;
    }

  .fileName {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  
  .file-id {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: #909399;
  }

  .material-actions {
    position: absolute;
    bottom: 8px;
    right: 12px;
    margin-top: -4px;
  }

  :deep(.el-button) {
    padding: 6px 8px;
    font-size: 12px;
    height: 24px;
  }
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

.search-pagination-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 16px;
}

/* 对话框样式优化 */
.dialogFoot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 统一按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

/* 统一标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
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

  .pageTopRight {
    width: 100%;
    justify-content: space-between;
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
</style>
<style>
/* 图片预览防止被弹框遮盖 */
.viewer-container {
  z-index: 9999 !important;
}

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

</style>


