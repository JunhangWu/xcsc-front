<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="文件名称" prop="materialName">
        <el-input
          v-model="queryParams.materialName"
          placeholder="请输入文件名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="上传用户ID" prop="uploadUser">
        <el-input
          v-model="queryParams.uploadUser"
          placeholder="请输入上传用户ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="上传时间" prop="uploadTime">
        <el-date-picker clearable
          v-model="queryParams.uploadTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择上传时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="文件大小" prop="size">
        <el-input
          v-model="queryParams.size"
          placeholder="请输入文件大小"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="扩展名" prop="extension">
        <el-input
          v-model="queryParams.extension"
          placeholder="请输入扩展名"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="分辨率" prop="resolution">
        <el-input
          v-model="queryParams.resolution"
          placeholder="请输入分辨率"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="时长" prop="duration">
        <el-input
          v-model="queryParams.duration"
          placeholder="请输入时长"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="可见性" prop="visibility">
        <el-input
          v-model="queryParams.visibility"
          placeholder="请输入可见性"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="所属目录ID" prop="dirId">
        <el-input
          v-model="queryParams.dirId"
          placeholder="请输入所属目录ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['xcsc:material:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['xcsc:material:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['xcsc:material:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['xcsc:material:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="materialList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="素材唯一标识" align="center" prop="materialId" />
      <el-table-column label="文件名称" align="center" prop="materialName" />
      <el-table-column label="服务器存储路径" align="center" prop="path" />
      <el-table-column label="HTTP访问地址" align="center" prop="url" />
      <el-table-column label="类型" align="center" prop="type" />
      <el-table-column label="状态" align="center" prop="status" />
      <el-table-column label="上传用户ID" align="center" prop="uploadUser" />
      <el-table-column label="上传时间" align="center" prop="uploadTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.uploadTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="文件大小" align="center" prop="size" />
      <el-table-column label="扩展名" align="center" prop="extension" />
      <el-table-column label="分辨率" align="center" prop="resolution" />
      <el-table-column label="时长" align="center" prop="duration" />
      <el-table-column label="可见性" align="center" prop="visibility" />
      <el-table-column label="素材描述" align="center" prop="description" />
      <el-table-column label="所属目录ID" align="center" prop="dirId" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['xcsc:material:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['xcsc:material:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改素材管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="materialRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="文件名称" prop="materialName">
          <el-input v-model="form.materialName" placeholder="请输入文件名称" />
        </el-form-item>
        <el-form-item label="服务器存储路径" prop="path">
          <el-input v-model="form.path" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="HTTP访问地址" prop="url">
          <el-input v-model="form.url" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="上传用户ID" prop="uploadUser">
          <el-input v-model="form.uploadUser" placeholder="请输入上传用户ID" />
        </el-form-item>
        <el-form-item label="上传时间" prop="uploadTime">
          <el-date-picker clearable
            v-model="form.uploadTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择上传时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="文件大小" prop="size">
          <el-input v-model="form.size" placeholder="请输入文件大小" />
        </el-form-item>
        <el-form-item label="扩展名" prop="extension">
          <el-input v-model="form.extension" placeholder="请输入扩展名" />
        </el-form-item>
        <el-form-item label="分辨率" prop="resolution">
          <el-input v-model="form.resolution" placeholder="请输入分辨率" />
        </el-form-item>
        <el-form-item label="时长" prop="duration">
          <el-input v-model="form.duration" placeholder="请输入时长" />
        </el-form-item>
        <el-form-item label="可见性" prop="visibility">
          <el-input v-model="form.visibility" placeholder="请输入可见性" />
        </el-form-item>
        <el-form-item label="素材描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="所属目录ID" prop="dirId">
          <el-input v-model="form.dirId" placeholder="请输入所属目录ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Material">
import { listMaterial, getMaterial, delMaterial, addMaterial, updateMaterial } from "@/api/xcsc/material"

const { proxy } = getCurrentInstance()

const materialList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    materialName: null,
    path: null,
    url: null,
    type: null,
    status: null,
    uploadUser: null,
    uploadTime: null,
    size: null,
    extension: null,
    resolution: null,
    duration: null,
    visibility: null,
    description: null,
    dirId: null
  },
  rules: {
    materialName: [
      { required: true, message: "文件名称不能为空", trigger: "blur" }
    ],
    path: [
      { required: true, message: "服务器存储路径不能为空", trigger: "blur" }
    ],
    url: [
      { required: true, message: "HTTP访问地址不能为空", trigger: "blur" }
    ],
    type: [
      { required: true, message: "类型不能为空", trigger: "change" }
    ],
    status: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ],
    uploadUser: [
      { required: true, message: "上传用户ID不能为空", trigger: "blur" }
    ],
    uploadTime: [
      { required: true, message: "上传时间不能为空", trigger: "blur" }
    ],
    size: [
      { required: true, message: "文件大小不能为空", trigger: "blur" }
    ],
    extension: [
      { required: true, message: "扩展名不能为空", trigger: "blur" }
    ],
    createTime: [
      { required: true, message: "拍摄时间不能为空", trigger: "blur" }
    ],
    visibility: [
      { required: true, message: "可见性不能为空", trigger: "blur" }
    ],
    dirId: [
      { required: true, message: "所属目录ID不能为空", trigger: "blur" }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询素材管理列表 */
function getList() {
  loading.value = true
  listMaterial(queryParams.value).then(response => {
    materialList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    materialId: null,
    materialName: null,
    path: null,
    url: null,
    type: null,
    status: null,
    uploadUser: null,
    uploadTime: null,
    updateTime: null,
    size: null,
    extension: null,
    resolution: null,
    duration: null,
    createTime: null,
    visibility: null,
    description: null,
    dirId: null
  }
  proxy.resetForm("materialRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.materialId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true //打开弹窗
  title.value = "添加素材管理"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _materialId = row.materialId || ids.value
  getMaterial(_materialId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改素材管理"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["materialRef"].validate(valid => {
    if (valid) {
      if (form.value.materialId != null) {
        updateMaterial(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addMaterial(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _materialIds = row.materialId || ids.value
  proxy.$modal.confirm('是否确认删除素材管理编号为"' + _materialIds + '"的数据项？').then(function() {
    return delMaterial(_materialIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('xcsc/material/export', {
    ...queryParams.value
  }, `material_${new Date().getTime()}.xlsx`)
}

getList()
</script>
