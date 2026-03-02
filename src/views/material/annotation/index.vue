<template>
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
      </el-select>
      <el-button type="primary" @click="getQueryData" icon="Search">搜索</el-button>
    </div>

    <div class="folderBox" v-if="showFolder">
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
            <div v-for="material in queryfileListData" :key="material.id" class="material-item"
              @mouseenter="onSubFolderMouseEnter(material)" @mouseleave="onSubFolderMouseLeave(material)">
                <span class="subFolder-actions">
                  <el-icon class="action-icon" @click.stop="editFile(material)" title="重命名" v-show="material._hover" style="color: #409eff;">
                    <Edit />
                  </el-icon>
                  <el-icon class="action-icon" @click.stop="deleteFileinQuery(material)" title="删除" v-show="material._hover" style="color: #f56c6c;">
                    <Delete />
                  </el-icon>
                </span>
              <div class="material-thumb">
                <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath" :alt="material.fileName"
                  @click="previewImg(material)" />
                <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="previewVideo(material)">
                  <el-icon class="file-icon">
                    <VideoPlay />
                  </el-icon>
                  <img :src="material.coverPath" :alt="material.fileName"/>
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
            <el-table :data="queryfileListData" class="material-table" :row-key="getListRowKey">
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
                      @click.stop="previewImg(row)"
                    />
                    <img
                      v-else-if="isVideo(row.minioPath) && row.coverPath"
                      class="table-thumb"
                      :src="row.coverPath"
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
            <el-button type="primary" plain @click="refreshData" size="default">
              <el-icon style="margin-right: 6px;">
                <Refresh />
              </el-icon>刷新
            </el-button>
            <el-button type="primary" plain @click="renameFilesByFolderName" size="default">
              <el-icon style="margin-right: 6px;">
                <DocumentCopy />
              </el-icon>按文件夹名重命名文件
            </el-button>
            <el-button type="primary" plain @click="handleAddFolder" size="default">
              <el-icon style="margin-right: 6px;">
                <FolderAdd />
              </el-icon>新建文件夹
            </el-button>
            <el-button type="primary" plain @click="uploadFile" size="default">
              <el-icon style="margin-right: 6px;">
                <Upload />
              </el-icon>上传文件
            </el-button>
            <el-button type="primary" plain @click="toggleUploadList" size="default" class="upload-list-btn">
              <el-icon style="margin-right: 6px;">
                <Files />
              </el-icon>传输列表
              <span v-if="uploadTaskCount > 0" class="task-count-badge">{{ uploadTaskCount }}</span>
            </el-button>
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
              @mouseenter="onSubFolderMouseEnter(item)" @mouseleave="onSubFolderMouseLeave(item)">
              <span class="subFolder-actions">
                <el-icon class="action-icon" @click.stop="editFolder(item)" title="重命名" v-show="item._hover" v-hasPermi="['xcsc:FilePathMapping:edit']"
                  style="color: #409eff;">
                  <Edit />
                </el-icon>
                <el-icon class="action-icon" @click.stop="deleteFolder(item)" title="删除" v-show="item._hover"
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
              @mouseenter="onSubFolderMouseEnter(material)" @mouseleave="onSubFolderMouseLeave(material)">
                <span class="subFolder-actions">
                  <el-icon class="action-icon" @click.stop="editFile(material)" title="重命名" v-show="material._hover" style="color: #409eff;">
                    <Edit />
                  </el-icon>
                  <el-icon class="action-icon" @click.stop="deleteFile(material)" title="删除" v-show="material._hover" style="color: #f56c6c;">
                    <Delete />
                  </el-icon>
                </span>
              <div class="material-thumb">
                <img v-if="isImage(material.minioPath)" :src="material.coverPath || material.minioPath" :alt="material.fileName"
                  @click="previewImg(material)" />
                <div class="videoBox" v-else-if="isVideo(material.minioPath)" @click="previewVideo(material)">
                  <el-icon class="file-icon">
                    <VideoPlay />
                  </el-icon>
                  <!-- <video :src="material.minioPath" playsinline muted preload="metadata"
                    style="max-width: 95%; max-height: 95%; width: auto; height: auto; display: block; object-fit: contain; margin: 0 auto; overflow: hidden;"></video> -->
                  <img :src="material.coverPath" :alt="material.fileName"/>
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
                  <!-- 待标注:0  AI标注:1  人工修改:2-->
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
                      @click.stop="previewImg(row)"
                    />
                    <img
                      v-else-if="isVideo(row.minioPath) && row.coverPath"
                      class="table-thumb"
                      :src="row.coverPath"
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
                    <el-button link type="primary" @click.stop="editFolder(row)" v-hasPermi="['xcsc:FilePathMapping:edit']">重命名</el-button>
                    <el-button link type="danger" @click.stop="deleteFolder(row)">删除</el-button>
                  </div>
                  <div v-else class="table-actions">
                    <el-button link type="primary" @click.stop="showMaterialDetail(row)">标注</el-button>
                    <el-button link type="primary" @click.stop="editFile(row)">重命名</el-button>
                    <el-button link type="danger" @click.stop="deleteFile(row)">删除</el-button>
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

    <!-- 新增文件夹/编辑文件名 -->
    <el-dialog v-model="addFolderDialogVisible" :title="getDialogTitle" width="500" :before-close="handleAddFolderClose"
      :close-on-click-modal="false" style="margin-top: 30vh;">
      <el-input v-model="getInputModel" :placeholder="getDialogPlaceholder" @keyup.enter="handleAddFolderConfirm" />
      <template #footer>
        <div class="dialogFoot">
          <el-button @click="handleAddFolderClose">取消</el-button>
          <el-button type="primary" @click="handleAddFolderConfirm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 上传文件 -->
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="50vw" :before-close="cancelUpload"
      :close-on-click-modal="false" style="margin-top: 20vh;">
      <el-upload v-model:file-list="fileList" class="upload-demo" drag :multiple="uploadType === 'file'" action=""
        :on-change="handleFileChange" :on-remove="handleFileRemove" :auto-upload="false">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          {{ uploadType === 'file' ? '点击或拖拽文件到此处上传' : '点击或拖拽文件夹到此处上传' }}
          <!-- <div class="el-upload__tip"> 支持图片：jpeg / jpg / png / bmp / gif；视频：mp4 / mov / avi / mkv / flv / m4v；文档：docx /
            pdf / pptx
            <br>单个文件大小不超过2048MB，总文件大小不超过5120MB
          </div> -->
        </div>
      </el-upload>
        
        <!-- 每个文件的上传进度条 -->
        <div v-if="showProgress" class="file-progress-container" style="margin-top: 20px;">
          <div v-for="(fileStatus, index) in fileUploadStatus" :key="index" class="file-progress-item" style="margin-bottom: 15px;">
            <div class="file-name" style="margin-bottom: 8px; font-weight: 500;">{{ fileStatus.fileName }}</div>
            <el-progress 
              :percentage="fileStatus.progress" 
              :status="fileStatus.progress === 100 ? 'success' : 'primary'"
              :stroke-width="12"
              :text-inside="true"
            ></el-progress>
            <div class="file-progress-text" style="margin-top: 5px; font-size: 12px; color: #606266;">
              {{ fileStatus.progress === 100? `处理中，请稍等...` : '正在上传中，请稍候...' }}
              <span v-if="fileStatus.speed" style="margin-left: 15px;">
                速率: {{ fileStatus.speed }}
              </span>
            </div>
          </div>
        </div>
        
      <template #footer>
        <div class="dialogFoot">
          <el-button @click="cancelUpload" :disabled="isUploading">取消</el-button>
          <el-button type="primary" @click="confirmUpload" :disabled="isConfirmDisabled || isUploading" :loading="isUploading">
            {{ isUploading ? '上传中...' : '确认' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 素材标注弹框 -->
    <MarkDialog ref="markDialogRef" @updateFileList="getFolderData(curFolderObj.bizId)"></MarkDialog>

    <!-- 上传管理面板 -->
    <div v-if="uploadManagerVisible" class="upload-manager-panel">
      <div class="upload-manager-header">
        <span>上传管理</span>
        <el-icon @click="toggleUploadList" style="cursor: pointer; color: #909399;">
          <Close />
        </el-icon>
      </div>
      <div class="upload-manager-body">
        <div v-if="uploadTasks.length === 0" class="upload-manager-empty">
          <el-empty description="暂无上传任务" />
        </div>
        <div v-for="task in uploadTasks" :key="task.id" class="upload-task-item">
          <div class="upload-task-header">
            <span class="upload-task-name">{{ task.fileName }}</span>
            <span :class="['upload-task-status', task.status]">{{ getTaskStatusText(task.status) }}</span>
          </div>
          <div class="upload-task-progress">
            <el-progress 
              :percentage="task.progress" 
              :status="task.progress === 100 ? 'success' : 'primary'"
              :stroke-width="10"
            ></el-progress>
          </div>
          <div class="upload-task-info">
            <span>速度: {{ task.speed || '0 B/s' }}</span>
            <span>进度: {{ task.progress }}%</span>
          </div>
          <div class="upload-task-actions">
            <el-button v-if="task.status === 'uploading'" class="upload-task-action-btn" type="default" size="small" @click="pauseTask(task.id)">
              <el-icon><VideoPause /></el-icon>
            </el-button>
            <el-button v-else-if="task.status === 'paused'" class="upload-task-action-btn" type="default" size="small" @click="resumeTask(task.id)">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
            <el-button class="upload-task-action-btn is-cancel" type="default" size="small" @click="cancelTask(task.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
      <div class="upload-manager-footer">
        <span>共 {{ uploadTasks.length }} 个任务</span>
        <el-button type="primary" size="small" @click="clearCompletedTasks">
          清空已完成
        </el-button>
      </div>
    </div>
  </div>
</template>

<!-- <script setup name="MaterialAnnotation"> -->
<script setup name="Annotation">
const router = useRouter()
const route = useRoute()
const { proxy } = getCurrentInstance();
import { ref, reactive, onMounted, computed } from 'vue'
import { api as viewerApi } from "v-viewer";
import { parseTime, } from '@/utils/common'
import { Search, VideoCamera, Document, Check, Edit, VideoPlay, VideoPause, Back, ArrowRight, ArrowUp, FolderAdd, FolderOpened, Upload, UploadFilled, Delete, Grid, Close, List, Files, DocumentCopy, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFolderList, addFolder, updateFolder, delFolder, uploadFiles, getFileList, delFile, updateFile, checkChunks, uploadFileChunk, mergeFileChunks } from "@/api/xcsc/uploadFile"
import auth from '@/plugins/auth'
import MarkDialog from './components/markDialog.vue'
import EXIF from 'exif-js';
// 修复压缩版的变量丢失 bug（关键：手动声明缺失的变量）
window.EXIF = EXIF;
window.n = window.n || {}; // 补充缺失的 n 变量（根据错误提示补充）
// import EXIF from 'exif-js';
// window.EXIF = EXIF; // 关键：将库挂载到全局 window 对象
import download from '../../../plugins/download';
// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('')
const showSearchResults = ref(false) // 控制是否显示搜索结果

// 排序相关
const sortField = ref('name') // 当前排序字段：name, size, date
const sortOrder = ref('asc') // 当前排序方向：asc, desc
const viewMode = ref('thumbnail') // 当前展示模式：thumbnail, list
const nameCollator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })

// 素材列表
const loading = ref(false)
const showFolder = ref(true)
const curFolderObj = reactive({
  filePath: '',
  bizId: '',
  id: '',
})
const breadcrumbData = ref([])

//点击子文件展示相关文件夹及文件
function selectFolder(item, type) {
  console.log('====item==', item);
  Object.assign(curFolderObj, item)
  if (type == 'isRootFolder') {
    //根文件夹
    showFolder.value = false
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
  getFolderData(item.bizId)
  console.log('===item===', item);
  Object.assign(curFolderObj, item)
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

  if (breadcrumbData.value.length == 1) {
    showFolder.value = true
    getFolderData(0)
    Object.assign(curFolderObj, {
      filePath: '',
      bizId: 0,
      id: 0
    });
    // return
  } else {
    Object.assign(curFolderObj, {
      filePath: breadcrumbData.value[breadcrumbData.value.length - 2].filePath,
      bizId: breadcrumbData.value[breadcrumbData.value.length - 2].bizId,
      id: breadcrumbData.value[breadcrumbData.value.length - 2].id
    });
    // curFolderObj.filePath = breadcrumbData.value[breadcrumbData.value.length - 2].filePath
    // curFolderObj.bizId = breadcrumbData.value[breadcrumbData.value.length - 2].bizId
    // curFolderObj.id = breadcrumbData.value[breadcrumbData.value.length - 2].id
    getFolderData(breadcrumbData.value[breadcrumbData.value.length - 2].bizId) //获取上一级文件夹的bizId
    breadcrumbData.value.pop()
  }
  console.log('===返回后的curFolderObj===', curFolderObj);
  console.log('===breadcrumbData.value===', breadcrumbData.value);
}

// 获取文件夹及文件列表数据
const folderData = ref([]) //文件夹列表
const fileListData = ref([])//文件列表
const SHARED_FOLDER_NAME = '共享文件夹'
const canViewSharedFolder = computed(() => auth.hasPermi('xcsc:FilePathMapping:share'))
const visibleFolderData = computed(() => {
  if (canViewSharedFolder.value) {
    return folderData.value
  }
  return folderData.value.filter(item => item.filePath !== SHARED_FOLDER_NAME)
})

const listViewRows = computed(() => {
  const folders = visibleFolderData.value.map(item => ({ ...item, _rowType: 'folder' }))
  const files = fileListData.value.map(item => ({ ...item, _rowType: 'file' }))
  return [...folders, ...files]
})

function switchViewMode(mode) {
  if (mode === 'thumbnail' || mode === 'list') {
    viewMode.value = mode
  }
}

function getFolderData(pid) {
  let params = {
    pid: pid,
  }
  console.log('===pid===', pid);
  console.log('===params===', params);
  getFolderList(params).then(res => {
    folderData.value = res.data
  })
  if (pid !== 0) {
    let param = {
      folderId: pid,
    }
    console.log('===params===', params);
    getFileList(param).then(res => {
      fileListData.value = res.data
      console.log('===fileListData.value===', fileListData.value);
    })
  }
}
getFolderData(0)

// 获取文件列表数据
const queryfileListData = ref([])//文件列表
function getQueryData() {
  // loading.value = true
  let params = {
    fileName: searchKeyword.value,
    annotationStatus: statusFilter.value,
  }
  getFileList(params).then(res => {
    queryfileListData.value = res.data
    showSearchResults.value = true // 显示搜索结果
    showFolder.value = false // 隐藏文件夹模式
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
  proxy.$modal.confirm(`确定将当前文件夹下的${fileListData.value.length}个文件重命名为"${folderName}1"..."${folderName}${fileListData.value.length}"吗?`).then(() => {
    const updatePromises = fileListData.value.map((file, idx) => {
      const ext = getFileExtension(file.fileName || getFileName(file.minioPath))
      const newName = `${folderName}${idx + 1}${ext}`
      const params = {
        id: file.id,
        fileName: newName,
        localPath: `${folderPath}/${newName}`,
      }
      return updateFile(params)
    })
    return Promise.all(updatePromises)
  }).then(() => {
    ElMessage.success('批量重命名成功！')
    getFolderData(curFolderObj.bizId)
  }).catch(() => { })
}

//新建文件夹
const handleFolderType = ref('add') // add edit edit_file
const addFolderDialogVisible = ref(false)
const folderName = ref('')
// 编辑文件名
const editFileName = ref('')
const editFileObj = reactive({})

// 获取对话框标题
const getDialogTitle = computed(() => {
  if (handleFolderType.value === 'add') return '请输入文件夹名称'
  if (handleFolderType.value === 'edit') return '请输入文件夹名称'
  if (handleFolderType.value === 'edit_file') return '请输入文件名称'
  return '请输入名称'
})

// 获取输入模型
const getInputModel = computed({
  get: () => {
    if (handleFolderType.value === 'edit_file') return editFileName.value
    return folderName.value
  },
  set: (val) => {
    if (handleFolderType.value === 'edit_file') {
      editFileName.value = val
    } else {
      folderName.value = val
    }
  }
})

// 获取对话框占位符
const getDialogPlaceholder = computed(() => {
  if (handleFolderType.value === 'edit_file') return '请输入文件名称'
  return '请输入文件夹名称'
})
function handleAddFolderClose() {
  folderName.value = ''
  editFileName.value = ''
  addFolderDialogVisible.value = false
}
function handleAddFolder() {
  addFolderDialogVisible.value = true
  handleFolderType.value = 'add'
}
function handleAddFolderConfirm() {
  // 验证输入不为空
  const inputValue = getInputModel.value.trim()
  if (!inputValue) {
    ElMessage.warning('名称不能为空')
    return
  }
  
  addFolderDialogVisible.value = false
  
  // 处理编辑文件名称
  if (handleFolderType.value === 'edit_file') {
    // 保留文件扩展名
    const originalName = getFileName(editFileObj.minioPath || editFileName.value)
    const dotIndex = originalName.lastIndexOf('.')
    if (dotIndex > -1) {
      const ext = originalName.substring(dotIndex)
      // 确保新文件名包含扩展名
      if (!inputValue.endsWith(ext)) {
        editFileName.value = inputValue + ext
      }
    }
    
    // 检查当前目录下是否已存在同名文件
    let fileExists = false
    // if (showSearchResults.value) {
    //   // 在搜索结果视图中检查
    //   fileExists = queryfileListData.value.some(file => 
    //     file.fileName === editFileName.value.trim() && file.id !== editFileObj.id
    //   )
    // } else {
      // 在普通视图中检查
      fileExists = fileListData.value.some(file => 
        file.fileName === editFileName.value.trim() && file.id !== editFileObj.id
      )
    // }
    
    if (fileExists) {
      ElMessage.error('当前目录下已存在同名文件，请更换名称！')
      addFolderDialogVisible.value = true // 保持对话框打开
      return
    }

    let folderPath = ''
    breadcrumbData.value.forEach((item, idx) => {
      folderPath += item.filePath
      if (idx !== breadcrumbData.value.length - 1) {
        folderPath += '/'  
      }
    })
    const params = {
      id: editFileObj.id,
      fileName: editFileName.value.trim(),
      localPath: folderPath+'/'+editFileName.value.trim(),
    }
    
    updateFile(params).then(res => {
      ElMessage.success('文件名修改成功')
      editFileName.value = ''
      // 刷新文件列表
      if (showSearchResults.value) {
        getQueryData()
      } else {
        getFolderData(curFolderObj.bizId)
      }
    }).catch(err => {
      ElMessage.error('文件名修改失败')
      console.error('修改文件名失败:', err)
    })
    return
  }
  
  // 处理文件夹相关操作
  let params = {
    filePath: folderName.value,
  }
  if (handleFolderType.value == 'add') {
    // 检查当前目录下是否已存在同名文件夹
    const folderExists = folderData.value.some(folder => folder.filePath === folderName.value.trim())
    if (folderExists) {
      ElMessage.error('当前目录下已存在同名文件夹，请更换名称！')
      addFolderDialogVisible.value = true // 保持对话框打开
      return
    }
    
    params.pid = curFolderObj.bizId
    addFolder(params).then(res => {
      ElMessage.success('新增成功')
      folderName.value = ''
      getFolderData(curFolderObj.bizId)
    })
  } else if (handleFolderType.value == 'edit') {
    // 检查当前目录下是否已存在同名文件夹
    const folderExists = folderData.value.some(folder => 
      folder.filePath === folderName.value.trim() && folder.id !== editOrDeleteFolderObj.id
    )
    if (folderExists) {
      ElMessage.error('当前目录下已存在同名文件夹，请更换名称！')
      addFolderDialogVisible.value = true // 保持对话框打开
      return
    }
    
    params.id = editOrDeleteFolderObj.id
    updateFolder(params).then(res => {
      debugger
      // 获取该文件夹下的所有文件
      console.log("editOrDeleteFolderObj.bizId",editOrDeleteFolderObj.bizId)
      getFileList({ folderId: editOrDeleteFolderObj.bizId}).then(filesRes => {
        const files = filesRes.data
        // 遍历文件并更新路径
        const updatePromises = files.map(file => {
          let folderPath = ''
          breadcrumbData.value.forEach((item, idx) => {
            folderPath += item.filePath
            if (idx !== breadcrumbData.value.length - 1) {
              folderPath += '/'  
            }
          })
          folderPath += '/'+folderName.value.trim()
          console.log("folderPath",folderPath)
          const params = {
            id: file.id,
            localPath: folderPath+'/'+file.fileName,
          }
          
          updateFile(params).then(res => {
          }).catch(err => {
            console.error('修改文件路径失败:', err)
          })
        })
        
        
        // 等待所有文件更新完成
        return Promise.all(updatePromises)
      }).then(() => {
        ElMessage.success('修改成功')
        folderName.value = ''
        getFolderData(curFolderObj.bizId)
      })
    })
  }
}
const editOrDeleteFolderObj = reactive({})  //编辑、删除的文件夹
// 编辑文件夹
function editFolder(item) {
  addFolderDialogVisible.value = true
  handleFolderType.value = 'edit'
  editOrDeleteFolderObj.id = item.id
  editOrDeleteFolderObj.bizId = item.bizId
  folderName.value = item.filePath
}
// 编辑文件
function editFile(item) {
  addFolderDialogVisible.value = true
  handleFolderType.value = 'edit_file'
  editFileObj.id = item.id
  editFileObj.minioPath = item.minioPath
  // 从minioPath中提取文件名
  const fileName = item.fileName
  editFileName.value = fileName
}
//  删除文件夹
function deleteFolder(item) {
  proxy.$modal.confirm('是否确认删除文件夹名称为"' + item.filePath + '"的数据项?').then(function () {
    return delFolder(item.bizId);
  }).then(() => {
    getFolderData(curFolderObj.bizId)
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}
// 文件夹悬浮控制
function onSubFolderMouseEnter(item) {
  item._hover = true
}
function onSubFolderMouseLeave(item) {
  item._hover = false
}

// 上传文件
const uploadDialogVisible = ref(false)
const uploadType = ref('file')// 上传类型
const fileList = ref([])// 文件列表
const isConfirmDisabled = ref(false);// 确认按钮是否禁用
const isUploading = ref(false); // 上传中状态
const uploadProgress = ref(0); // 上传进度（0-100）
const showProgress = ref(false); // 是否显示进度条
const uploadSpeed = ref(''); // 上传速率
let lastLoaded = 0; // 上一次的已上传字节数
let lastTime = 0; // 上一次的时间戳
const fileUploadStatus = ref([]); // 存储每个文件的上传状态和进度

// 上传管理
const uploadManagerVisible = ref(false) // 上传管理面板显示状态
const uploadTasks = ref([]) // 上传任务列表
let taskIdCounter = 1 // 任务ID计数器

// 计算当前任务数量（用于徽章显示）
const uploadTaskCount = computed(() => {
  return uploadTasks.value.filter(task => task.status !== 'completed' && task.status !== 'failed').length
})

// 切换上传管理面板显示状态
function toggleUploadList() {
  uploadManagerVisible.value = !uploadManagerVisible.value
}

// 获取任务状态文本
function getTaskStatusText(status) {
  const statusMap = {
    waiting: '等待中',
    uploading: '上传中',
    paused: '暂停中',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[status] || '未知'
}

// 暂停任务
function pauseTask(taskId) {
  const task = uploadTasks.value.find(t => t.id === taskId)
  if (task && task.status === 'uploading') {
    task.status = 'paused'
    task.isPaused = true
    ElMessage.info(`已暂停上传：${task.fileName}`)
  }
}

// 继续任务
function resumeTask(taskId) {
  const task = uploadTasks.value.find(t => t.id === taskId)
  if (task && task.status === 'paused') {
    task.status = 'uploading'
    task.isPaused = false
    ElMessage.info(`已继续上传：${task.fileName}`)
    // 继续由原有上传流程恢复
  }
}

// 取消任务
function cancelTask(taskId) {
  const taskIndex = uploadTasks.value.findIndex(t => t.id === taskId)
  if (taskIndex !== -1) {
    const task = uploadTasks.value[taskIndex]
    // 取消正在进行的上传请求
    if (task.cancelSource && typeof task.cancelSource.cancel === 'function') {
      task.cancelSource.cancel('上传任务已取消');
    }
    task.status = 'cancelled'
    uploadTasks.value.splice(taskIndex, 1)
    ElMessage.info(`已取消上传：${task.fileName}`)
  }
}

// 清空已完成的任务
function clearCompletedTasks() {
  uploadTasks.value = uploadTasks.value.filter(task => task.status !== 'completed' && task.status !== 'failed')
}
function uploadFile() {
  fileList.value = []
  uploadDialogVisible.value = true
}
function cancelUpload() {
  fileList.value = []
  uploadDialogVisible.value = false
  uploadProgress.value = 0
  showProgress.value = false
  uploadSpeed.value = ''
  lastLoaded = 0
  lastTime = 0
  fileUploadStatus.value = []
}
// 全局变量：存储文件哈希和已上传分块（用于断点续传）
const fileUploadCache = new Map(); 
// 分块大小配置（16MB，可根据需求调整）
const CHUNK_SIZE = 16 * 1024 * 1024; 

// 工具函数：计算文件MD5哈希（需引入spark-md5库，npm install spark-md5）
import SparkMD5 from 'spark-md5';
function getChunkSizeByIndex(fileSize, chunkIndex) {
  const start = chunkIndex * CHUNK_SIZE;
  if (start >= fileSize) {
    return 0;
  }
  return Math.min(CHUNK_SIZE, fileSize - start);
}

function calcUploadedBytes(uploadedChunks, fileSize) {
  if (!Array.isArray(uploadedChunks) || uploadedChunks.length === 0) {
    return 0;
  }
  return uploadedChunks.reduce((sum, idx) => sum + getChunkSizeByIndex(fileSize, idx), 0);
}

function formatSpeed(speedBps) {
  if (!Number.isFinite(speedBps) || speedBps <= 0) {
    return '0 B/s';
  }
  if (speedBps < 1024) {
    return `${speedBps.toFixed(2)} B/s`;
  }
  if (speedBps < 1024 * 1024) {
    return `${(speedBps / 1024).toFixed(2)} KB/s`;
  }
  return `${(speedBps / (1024 * 1024)).toFixed(2)} MB/s`;
}
async function calculateFastHash(file) {
  return new Promise((resolve) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    const size = file.size;
    const sampleSize = 2 * 1024 * 1024; // 每段抽样 2MB

    // 抽样策略：开头 2MB + 中间 2MB + 结尾 2MB
    const chunks = [file.slice(0, sampleSize)];
    if (size > sampleSize) {
      const mid = Math.floor(size / 2);
      chunks.push(file.slice(mid, mid + sampleSize));
      chunks.push(file.slice(size - sampleSize, size));
    }

    let current = 0;
    reader.onload = (e) => {
      spark.append(e.target.result);
      current++;
      if (current < chunks.length) {
        readNext();
      } else {
        // 关键：混合文件总大小，进一步降低碰撞概率
        spark.append(new TextEncoder().encode(size.toString()));
        resolve(spark.end());
      }
    };

    const readNext = () => reader.readAsArrayBuffer(chunks[current]);
    readNext();
  });
}
async function calculateFileHash(file) {
  return new Promise((resolve) => {
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    const chunkSize = 16 * 1024 * 1024; // 计算哈希时的切片大小（2MB）
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;

    fileReader.onload = function (e) {
      spark.append(e.target.result);
      currentChunk++;
      if (currentChunk < chunks) {
        loadNextChunk();
      } else {
        resolve(spark.end()); // 返回文件唯一哈希
      }
    };

    function loadNextChunk() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNextChunk();
  });
}

// 工具函数：查询已上传分块（后端接口）
async function getUploadedChunks(fileHash) {
  try {
    const res = await checkChunks({ fileHash });
    return res.data.uploadedChunks || []; // 后端返回已上传的分块索引数组
  } catch (e) {
    console.error('查询已上传分块失败', e);
    return [];
  }
}

// 工具函数：上传单个分块
async function uploadChunk(fileHash, chunkIndex, chunk, folderId, folderPath, fileLastModified, fileIndex) {
  const formData = new FormData();
  formData.append('fileChunk', chunk);
  formData.append('fileHash', fileHash);
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', Math.ceil(chunk.fileSize / CHUNK_SIZE));
  formData.append('folderId', folderId);
  formData.append('folderPath', folderPath);
  formData.append('eventTimes', fileLastModified);
  formData.append('fileName', chunk.fileName);

  // 分块上传进度监听（用于计算整体进度）
  const config = {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && fileUploadStatus.value[fileIndex]) {
        const status = fileUploadStatus.value[fileIndex];
        const baseUploadedBytes = status.uploadedBytes || 0;
        const currentLoaded = baseUploadedBytes + progressEvent.loaded;
        const progress = (currentLoaded / chunk.fileSize) * 100;
        status.progress = Math.min(Math.round(progress), 100);
        
        // 计算对应文件的实时上传速率
        const currentTime = Date.now();
        if (status.lastTime > 0) {
          const timeDiff = (currentTime - status.lastTime) / 1000;
          const loadedDiff = currentLoaded - status.lastLoaded;
          if (timeDiff > 0) {
            status.speed = formatSpeed(loadedDiff / timeDiff);
          }
        }
        status.lastLoaded = currentLoaded;
        status.lastTime = currentTime;
      }
    }
  };

  const res = await uploadFileChunk(formData, config);
  if (fileUploadStatus.value[fileIndex]) {
    const status = fileUploadStatus.value[fileIndex];
    status.uploadedBytes = (status.uploadedBytes || 0) + chunk.size;
    status.lastLoaded = status.uploadedBytes;
  }
  return res;
}

// 工具函数：合并分块
async function mergeChunks(fileHash, fileName, totalChunks, folderId, folderPath, eventTimes, contentType) {
  // debugger
  // console.log("执行到debugger之后");
  return mergeFileChunks({
    fileHash,
    fileName,
    totalChunks,
    folderId,
    folderPath,
    eventTimes,
    contentType
  });
}

// 改造后的确认上传函数
async function confirmUpload() {
  // 1. 保留你原有文件大小校验逻辑（可选）
  // const totalSize = fileList.value.reduce((sum, f) => sum + ((f.raw || f.originFileObj || f).size || 0), 0);
  // const maxTotalSize = 5120 * 1024 * 1024; // 5120MB
  // if (totalSize > maxTotalSize) {
  //   const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  //   ElMessage.error(`所有文件总大小（${totalSizeMB}MB）超过限制（5120MB）`);
  //   return;
  // }

  // 2. 处理每个文件的分块上传
  const files = fileList.value.map(item => item.raw || item.originFileObj || item);
  const folderId = curFolderObj.bizId;
  let folderPath = '';
  breadcrumbData.value.forEach((item, idx) => {
    folderPath += item.filePath;
    if (idx !== breadcrumbData.value.length - 1) {
      folderPath += '/';
    }
  });

  // 3. 为每个文件创建上传任务
  const tasks = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const task = reactive({
      id: taskIdCounter++,
      fileName: file.name,
      progress: 0,
      speed: '0 B/s',
      status: 'waiting',
      file: file,
      folderId: folderId,
      folderPath: folderPath,
      fileLastModified: parseTime(file.lastModifiedDate),
      contentType: file.type,
      fileSize: file.size,
      totalBytes: file.size,
      uploadedBytes: 0,
      lastLoaded: 0,
      lastTime: 0,
      chunks: [],
      uploadedChunks: [],
      isPaused: false,
      isProcessing: false,
      cancelToken: null,
      cancelSource: null
    });
    uploadTasks.value.push(task);
    tasks.push(task);
  }

  // 4. 关闭上传对话框并显示提示
  uploadDialogVisible.value = false;
  ElMessage.success('任务已添加后台运行！');

  // 5. 后台执行上传任务
  for (let task of tasks) {
    await processUploadTask(task);
  }

  // 6. 上传完成后刷新文件列表
  getFolderData(curFolderObj.bizId);
}

// 处理单个上传任务
async function processUploadTask(task) {
  if (task.isProcessing) {
    return;
  }
  task.isProcessing = true;

  try {
    // 更新任务状态为上传中
    task.status = 'uploading';
    
    const file = task.file;
    const fileName = task.fileName;
    const fileSize = task.fileSize;
    const contentType = task.contentType;
    const fileLastModified = task.fileLastModified;
    const folderId = task.folderId;
    const folderPath = task.folderPath;
    
    // 计算文件哈希（用于秒传/断点续传）
    const fileHash = await calculateFastHash(file);
    
    // 查询已上传分块（断点续传核心）
    const uploadedChunks = await getUploadedChunks(fileHash);
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const uploadedBytes = calcUploadedBytes(uploadedChunks, fileSize);
    task.uploadedBytes = uploadedBytes;
    task.lastLoaded = uploadedBytes;
    if (uploadedBytes > 0) {
      task.progress = Math.min(Math.round((uploadedBytes / fileSize) * 100), 100);
    }

    // 秒传判断：如果所有分块都已上传，直接合并
    if (uploadedChunks.length === totalChunks) {
      await mergeChunks(fileHash, fileName, totalChunks, folderId, folderPath, fileLastModified, contentType);
      task.progress = 100;
      task.status = 'completed';
      ElMessage.success(`${fileName} 秒传成功！`);
      return;
    }

    // 分块上传：只传未上传的分块
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // 检查任务是否被暂停
      while (task.status === 'paused') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 检查任务是否被取消
      if (task.status === 'cancelled') {
        return;
      }

      // 跳过已上传的分块
      if (uploadedChunks.includes(chunkIndex)) {
        continue;
      }

      // 切分文件块
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = file.slice(start, end);
      // 给分块附加元信息
      chunk.fileName = fileName;
      chunk.fileSize = fileSize;
      chunk.totalChunks = totalChunks;

      // 上传当前分块
      await uploadChunkWithProgress(fileHash, chunkIndex, chunk, folderId, folderPath, fileLastModified, task);
      task.uploadedBytes = (task.uploadedBytes || 0) + chunk.size;
    }

    // 所有分块上传完成，合并分块
    await mergeChunks(fileHash, fileName, totalChunks, folderId, folderPath, fileLastModified, contentType);
    task.progress = 100;
    task.status = 'completed';
    ElMessage.success(`${fileName} 上传完成！`);
  } catch (e) {
    // 检查是否是取消操作
    if (e.message && e.message.includes('上传任务已取消')) {
      console.log('上传任务已取消:', task.fileName);
      task.status = 'cancelled';
    } else {
      console.error('上传失败', e);
      task.status = 'failed';
      ElMessage.error(`${task.fileName} 上传失败：${e.message}`);
    }
  } finally {
    task.isProcessing = false;
  }
}

// 导入 axios 用于创建 CancelToken
import axios from 'axios';

// 上传分块并更新任务进度
async function uploadChunkWithProgress(fileHash, chunkIndex, chunk, folderId, folderPath, fileLastModified, task) {
  // 创建 CancelToken
  const cancelSource = axios.CancelToken.source();
  task.cancelSource = cancelSource;
  task.cancelToken = cancelSource.token;

  const formData = new FormData();
  formData.append('fileChunk', chunk);
  formData.append('fileHash', fileHash);
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', Math.ceil(chunk.fileSize / CHUNK_SIZE));
  formData.append('folderId', folderId);
  formData.append('folderPath', folderPath);
  formData.append('eventTimes', fileLastModified);
  formData.append('fileName', chunk.fileName);

  // 分块上传进度监听（用于计算整体进度）
  const config = {
    cancelToken: cancelSource.token,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const baseUploadedBytes = task.uploadedBytes || 0;
        const currentLoaded = baseUploadedBytes + progressEvent.loaded;
        const progress = (currentLoaded / task.fileSize) * 100;
        task.progress = Math.min(Math.round(progress), 100);
        
        // 计算对应任务的实时上传速率
        const currentTime = Date.now();
        if (task.lastTime > 0) {
          const timeDiff = (currentTime - task.lastTime) / 1000;
          const loadedDiff = currentLoaded - task.lastLoaded;
          if (timeDiff > 0) {
            task.speed = formatSpeed(loadedDiff / timeDiff);
          }
        }
        task.lastLoaded = currentLoaded;
        task.lastTime = currentTime;
      }
    }
  };

  try {
    return await uploadFileChunk(formData, config);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('上传被取消:', error.message);
      throw error;
    }
    throw error;
  }
}
// // 支持的文件格式
// const supportedFormats = {
//   image: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
//   video: ['mp4', 'mov', 'avi', 'mkv', 'flv','m4v'],
//   document: ['docx', 'pdf', 'pptx']
// }
function isImage(path) {
  return ['jpg', 'jpeg', 'png', 'bmp', 'gif'].some(ext => path.toLowerCase().includes(ext));
}
function isVideo(path) {
  return ['mp4', 'mov', 'avi', 'mkv', 'flv','m4v'].some(ext => path.toLowerCase().includes(ext));
}
// 获取文件名
function getFileName(path) {
  if (!path) return '';
  const idx = path.lastIndexOf('/');
  return idx !== -1 ? path.substring(idx + 1) : path;
}

// 格式化文件大小
function formatFileSize(bytes) {
    //TODO
  // if (!bytes) return '未知';
  // if (bytes < 1024) return bytes + ' B';
  // if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  // return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return bytes + ' MB';
}

// 获取文件类型
function getFileType(path) {
  if (!path) return '未知';
  const idx = path.lastIndexOf('.');
  return idx !== -1 ? path.substring(idx + 1).toUpperCase() : '未知';
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '未知';
  const date = new Date(dateStr);
  return date.getFullYear() + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + String(date.getDate()).padStart(2, '0');
}

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

function getListRowKey(row) {
  if (row?._rowType === 'folder') {
    return `folder-${row.bizId || row.id || row.filePath}`;
  }
  return `file-${row?.id || row?.fileName || ''}`;
}

function getListFileType(row) {
  if (row?._rowType === 'folder') return '文件夹';
  const fileType = getFileType(row?.minioPath || '');
  if (fileType === '未知') return fileType;
  return `${fileType.toLowerCase()}文件`;
}

function getListRowSize(row) {
  if (row?._rowType === 'folder') return '--';
  return formatFileSize(row?.fileSize);
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
// 检查文件格式是否支持
// const isSupportedFormat = (filename) => {
//   const ext = filename.split('.').pop().toLowerCase()
//   return Object.values(supportedFormats).flat().includes(ext)
// }

// 计算字符串的UTF8字符数
const getUtf8Length = (str) => {
  if (!str) return 0;
  // 使用TextEncoder将字符串编码为UTF-8，然后获取字节长度
  return new TextEncoder().encode(str).length;
}
const handleBeforeUpload = (file) => {
  // 校验文件名UTF8字符数
  const utf8Length = getUtf8Length(file.name);
  if (utf8Length > 255) {
    ElMessage.error(`文件名UTF8字符数超过限制（${utf8Length}/255），请缩短文件名后上传`);
    return false;
  }
  
  // // 格式验证（图片/视频/文档）
  // const ext = file.name.split('.').pop().toLowerCase();
  // const validFormats = [...supportedFormats.image, ...supportedFormats.video, ...supportedFormats.document];
  // if (!validFormats.includes(ext)) {
  //   ElMessage.error(`不支持${ext}格式，请上传${Object.values(supportedFormats).flat().join('/')}文件`);
  //   return false;
  // }
  // // 检查文件格式
  // if (!isSupportedFormat(file.name)) {
  //   ElMessage.error(`文件 ${file.name} 格式不符合要求，请上传支持的文件格式`)
  //   return false
  // }
  // // 检查文件大小（可选，可根据需要添加）
  // const maxSize = 2048 * 1024 * 1024 // 2048MB
  // if (file.size > maxSize) {
  //   ElMessage.error(`文件 ${file.name} 大小超过限制（2048MB）`)
  //   return false
  // }
  // 校验同名
  const fileName = file.name;
  const existNames = fileListData.value.map(item => {
    const path = item.minioPath || '';
    const idx = path.lastIndexOf('/');
    return idx !== -1 ? path.substring(idx + 1) : path;
  });
  if (existNames.includes(fileName)) {
    ElMessage.error(`已存在同名文件：${fileName}，请勿重复上传！`);
    return false;
  }
  return true
}
// 文件变化处理
const handleFileChange = (file, fileList) => {
  console.log('==file====', file);
  isConfirmDisabled.value = true;
  let hasUploadError = false; // 标记是否存在不可上传的错误
  // 检查所有文件的UTF8字符数
  const overLengthFiles = fileList.filter(file => getUtf8Length(file.name) > 255);
  console.log("overLengthFiles",overLengthFiles.value)
  if (overLengthFiles.length > 0) {
    ElMessage.error(`文件名字符数超过限制：${overLengthFiles.map(file => file.name).join('、')}，请缩短文件名后上传！`);
    hasUploadError = true;
    // 移除不符合要求的文件
    // fileList.value = fileList.filter(f => getUtf8Length(f.name) <= 255);
    return false
  }
  
  // // 检查单个文件大小
  // const maxSize = 2048 * 1024 * 1024 // 2048MB
  // if (file.size > maxSize) {
  //   ElMessage.error(`文件 ${file.name} 大小超过限制（2048MB）`)
  //   hasUploadError = true;
  //   return false
  // }
  
  // // 检查所有文件总大小不超过5120MB
  // const totalSize = fileList.reduce((sum, f) => sum + (f.size || 0), 0);
  // const maxTotalSize = 5120 * 1024 * 1024; // 500MB
  // if (totalSize > maxTotalSize) {
  //   const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  //   ElMessage.error(`所有文件总大小（${totalSizeMB}MB）超过限制（5120MB）`)
  //   hasUploadError = true;
  //   return false
  // }
  // // 检查文件格式
  // const invalidFiles = fileList.filter(f => !isSupportedFormat(f.name))
  // if (invalidFiles.length > 0) {
  //   ElMessage.error(`素材格式不符合，请上传支持的文件格式`)
  //   hasUploadError = true;
  //   // 移除不支持格式的文件
  //   fileList.value = fileList.filter(f => isSupportedFormat(f.name))
  //   return
  // }
    // 检查上传列表中是否存在相同文件名的文件
  const fileNames = fileList.map(f => f.name);
  const duplicateNamesInList = fileNames.filter((name, index) => fileNames.indexOf(name) !== index);
  const uniqueDuplicateNames = [...new Set(duplicateNamesInList)];

  if (uniqueDuplicateNames.length > 0) {
    ElMessage.error(`上传列表中存在重复文件：${uniqueDuplicateNames.join('、')}，请移除重复文件！`);
    hasUploadError = true;
    // 移除重复文件，只保留每个文件名的第一个实例
    const uniqueFiles = [];
    const seenNames = new Set();
    for (const f of fileList) {
      if (!seenNames.has(f.name)) {
        seenNames.add(f.name);
        uniqueFiles.push(f);
      }
    }
    fileList.value = uniqueFiles;
  }

  // 校验同名（与已存在的文件）
  const fileName = file.name;
  const existNames = fileListData.value.map(item => {
    // const path = item.minioPath || '';
    // const idx = path.lastIndexOf('/');
    // return idx !== -1 ? path.substring(idx + 1) : path;
    return item.fileName || '';
  });

  // 删除 fileList.value 中与已存在文件同名的文件，并提示
  const duplicateFiles = fileList.filter(f => existNames.includes(f.name));
  if (duplicateFiles.length > 0) {
    ElMessage.error(`已存在同名文件：${duplicateFiles.map(f => f.name).join('、')}，请勿重复上传！`);
    hasUploadError = true;
    fileList.value = fileList.filter(f => !existNames.includes(f.name));
  }

  isConfirmDisabled.value = hasUploadError || fileList.length === 0;

}

// 处理文件移除
function handleFileRemove(file, fileList) {
  // 在文件被移除后调用handleFileChange逻辑进行验证
  handleFileChange(file, fileList);
}

// 删除文件
function deleteFile(item) {
  proxy.$modal.confirm('是否确认删除文件名为"' + item.fileName + '"的文件?').then(function () {
    return delFile(item.id);
  }).then(() => {
    getFolderData(curFolderObj.bizId)
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}
// 搜索结果中删除文件
function deleteFileinQuery(item) {
  proxy.$modal.confirm('是否确认删除文件名为"' + item.fileName + '"的文件?').then(function () {
    return delFile(item.id);
  }).then(() => {
    getQueryData()
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    '0': 'warning',
    '1': 'primary',
    '2': 'success'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    '0': '待标注',
    '1': '待审核',
    '2': '已审核'
  }
  return textMap[status] || status
}

//预览图片
function previewImg(material) {
  const $viewer = viewerApi({
    options: {
      toolbar: true,
      initialViewIndex: 0,
      title: (image) => `${material.fileName}`,
    },
    images: [material.minioPath],
  });
}

//预览视频
const videoDialogVisible = ref(false)
const videoFilePath = ref('')
const videoDialogTitle = ref('')
function previewVideo(material) {
  videoDialogVisible.value = true
  videoFilePath.value = material.minioPath
  videoDialogTitle.value = material.fileName
}

//下载文件
function downloadFile(material) {
  if (material && material.minioPath) {
    window.open(material.minioPath, '_blank');
  }
}

// 重置搜索，返回文件夹视图
function resetSearch() {
  showSearchResults.value = false
  if(curFolderObj.bizId == 0){
    showFolder.value = true // 确保显示文件夹视图
  }
  
  searchKeyword.value = ''
  statusFilter.value = ''
  // breadcrumbData.value = [] // 清空面包屑数据
  // Object.assign(curFolderObj, {
  //   filePath: '',
  //   bizId: '',
  //   id: ''
  // }) // 重置当前文件夹对象
  console.log("==curFolderObj==",curFolderObj)
  getFolderData(curFolderObj.bizId) // 获取根文件夹数据
}

// 显示素材详情
const markDialogRef = ref(null)
function showMaterialDetail(material) {
  // 打开 MarkDialog 弹框
  markDialogRef.value.open(material)
}

// 排序文件
function sortFiles(field) {
  // 如果点击的是当前排序字段，则切换排序方向
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 否则，设置新的排序字段和默认排序方向
    sortField.value = field
    sortOrder.value = 'asc'
  }
  
  // 根据当前视图对相应的文件列表进行排序
  if (showSearchResults.value) {
    sortFileList(queryfileListData)
  } else {
    sortFolderList(folderData)
    sortFileList(fileListData)
  }
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
        return nameCollator.compare(nameA, nameB) * order
      
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
        return nameCollator.compare(nameA, nameB) * order
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

/* 上传列表按钮样式 */
.upload-list-btn {
  position: relative;
}

.task-count-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  background-color: #f56c6c;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  padding: 0 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 上传管理面板样式 */
.upload-manager-panel {
  position: fixed;
  /* bottom: 20px;
  right: 20px; */
  top: 260px;
  right: 20px;
  width: 440px;
  max-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.upload-manager-header {
  padding: 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
}

.upload-manager-body {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
}

.upload-task-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 10px;
  background-color: #fafafa;
}

.upload-task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.upload-task-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.upload-task-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #ecf5ff;
  color: #409eff;
}

.upload-task-status.waiting {
  background-color: #ecf5ff;
  color: #409eff;
}

.upload-task-status.uploading {
  background-color: #f0f9eb;
  color: #67c23a;
}

.upload-task-status.paused {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.upload-task-status.completed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.upload-task-status.failed {
  background-color: #fef0f0;
  color: #f56c6c;
}

.upload-task-progress {
  margin: 8px 0;
}

.upload-task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.upload-task-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.upload-task-actions .el-button {
  padding: 4px 12px;
  font-size: 16px;
}

.upload-task-action-btn {
  border-radius: 10px;
  height: 28px;
  width: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border-color: #ebeef5;
  color: #409eff;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.upload-task-action-btn :deep(.el-icon) {
  font-size: 16px;
}

.upload-task-action-btn:hover {
  transform: translateY(-1px);
}

.upload-task-action-btn:active {
  transform: translateY(0);
  filter: brightness(0.95);
}

.upload-task-action-btn.is-cancel {
  background-color: #ffffff;
  border-color: #ebeef5;
  color: #f56c6c;
}

.upload-manager-footer {
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-manager-empty {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
