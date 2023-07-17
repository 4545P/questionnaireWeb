<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.title"
        placeholder="Title"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter.native="handleFilter"
      />
      <el-select v-model="listQuery.sort" style="width: 140px" class="filter-item" @change="handleFilter">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-date-picker
        v-model="listQuery.date"
        type="date"
        class="filter-item"
        placeholder="开始时间"
        @change="handleFilter"
      />
      <el-date-picker
        v-model="listQuery.endDate"
        type="date"
        class="filter-item"
        placeholder="结束时间"
        @change="handleFilter"
      />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        Search
      </el-button>
    </div>

    <el-table
      :key="tableKey"
      :data="sortedList"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80" :class-name="getSortClass('id')">
        <template #default="{ row }">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Title" min-width="150px">
        <template #default="{ row }">
          <span class="link-type" @click="handleUpdate(row)">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Date" width="150px" align="center">
        <template #default="{ row }">
          <span>{{ row.date | parseTime('{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="EndDate" width="150px" align="center">
        <template #default="{ row }">
          <span>{{ row.endDate | parseTime('{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="State" align="center" width="95">
        <template #default="{ row }">
          <span>{{ row.status }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Statistics" align="center" width="230" class-name="small-padding fixed-width">
        <template #default="{ row }">
          <el-button type="primary" size="mini" @click="result(row)">
            Result
          </el-button>
          <el-button v-if="row.status !== 'deleted'" size="mini" type="danger" @click="handleDelete(row, $index)">
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="currentPage"
      :limit.sync="pageSize"
      @pagination="fetchQuestionnaire"
    />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="listQuery"
        label-position="left"
        label-width="70px"
        style="width: 400px; margin-left: 50px;"
      >
        <el-form-item label="Type" prop="type">
          <el-select
            v-model="listQuery.type"
            class="filter-item"
            placeholder="Please select"
            @change="fetchQuestionnaire"
          >
            <el-option v-for="item in calendarTypeOptions" :key="item.key" :label="item.display_name" :value="item.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="Date" prop="date">
          <el-date-picker
            v-model="listQuery.date"
            type="datetime"
            placeholder="Please pick a date"
            @change="fetchQuestionnaire"
          />
        </el-form-item>
        <el-form-item label="EndDate" prop="endDate">
          <el-date-picker
            v-model="listQuery.endDate"
            type="datetime"
            placeholder="Please pick a date"
            @change="fetchQuestionnaire"
          />
        </el-form-item>
        <el-form-item label="Title" prop="title">
          <el-input v-model="listQuery.title" @change="fetchQuestionnaire" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
          Confirm
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { fetchList, fetchPv, createArticle, updateArticle } from '@/api/article'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import axios from 'axios'

const calendarTypeOptions = [
  { key: 'CN', display_name: 'China' },
  { key: 'US', display_name: 'USA' },
  { key: 'JP', display_name: 'Japan' },
  { key: 'EU', display_name: 'Eurozone' }
]

// arr to obj, such as { CN: "China", US: "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    parseTime(value, format) {
      const date = new Date(value)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')

      // 根据传入的格式参数进行日期格式化
      if (format === '{y}-{m}-{d}') {
        return `${year}-${month}-${day}`
      }
      // 添加其他格式的处理逻辑

      return value // 如果没有匹配的格式，直接返回原始值
    },
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    },
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    }
  },
  data() {
    return {
      currentPage: 1, // 當前頁碼
      pageSize: 10, // 每頁顯示的資料筆數
      tableKey: 0,
      list: [],
      total: 0,
      title: '',
      date: '',
      endDate: '',
      listLoading: false,
      listQuery: {
        importance: '',
        title: '',
        date: '',
        endDate: '',
        type: '',
        sort: '+id'
      },
      total: 0,
      list: [],
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      sortOptions: [{ label: 'ID Ascending', key: '+id' }, { label: 'ID Descending', key: '-id' }],
      statusOptions: ['published', 'draft', 'deleted'],
      showReviewer: false,
      temp: {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        date: '',
        endDate: '',
        title: '',
        type: '',
        status: 'published'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        type: [{ required: true, message: 'type is required', trigger: 'change' }],
        timestamp: [{ type: 'date', required: true, message: 'timestamp is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false
    }
  },
  computed: {
    sortedList() {
      // 克隆列表数据以避免直接修改原始数据
      const clonedList = [...this.list]

      // 为每个对象添加自动生成的 ID 属性和状态属性
      const sortedWithId = clonedList.map((item, index) => {
        const currentTime = new Date()
        const startDate = new Date(item.date)
        const endDate = new Date(item.endDate)
        let status = ''

        if (currentTime < startDate) {
          status = '尚未開始'
        } else if (currentTime >= startDate && currentTime <= endDate) {
          status = '進行中'
        } else {
          status = '已結束'
        }

        return { ...item, id: index + 1, status: status }
      })

      // 根据需要对列表进行排序
      if (this.listQuery.sort === '+id') {
        sortedWithId.sort((a, b) => a.id - b.id) // 升序
      } else if (this.listQuery.sort === '-id') {
        sortedWithId.sort((a, b) => b.id - a.id) // 降序
      }

      return sortedWithId
    }
  },

  created() {
    this.fetchQuestionnaire()
  },
  methods: {
    fetchQuestionnaire() {
      const url = '/api/getQuestionnaire'
      const { currentPage, pageSize } = this
      const pageRequest = {
        page: currentPage,
        limit: pageSize
      }

      axios.post(url, pageRequest)
        .then(res => {
          console.log(res)
          this.list = res.data[0].list
          this.total = res.data[0].total

          console.log(this.list)
          console.log(this.total)
        })
        .catch(error => {
          console.error('获取问卷失败：', error)
        })
    },

    handleFilter() {
      this.listQuery.page = 1 // 重置页码为第一页
      this.currentPage = 1 // 更新当前页码
      this.fetchQuestionnaire() // 发起请求，获取符合条件的数据
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
        type: 'success'
      })
      row.status = status
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        status: 'published',
        type: ''
      }
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.temp.timestamp = new Date(this.temp.timestamp)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.timestamp = +new Date(tempData.timestamp) // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464
          updateArticle(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.list.splice(index, 1)
    },
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
        this.dialogPvVisible = true
      })
    },

    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'date' || j === 'endDate') {
          return this.parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    }
  }
}
</script>
