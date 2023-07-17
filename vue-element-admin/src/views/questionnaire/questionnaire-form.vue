<template>
  <div class="container">
    <p style="text-align: center">創建項目</p>
    <el-form ref="form" :model="form" label-width="80px">
      <el-form-item label="標題">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="時間">
        <el-date-picker v-model="form.date" type="date" class="filter-item" placeholder="開始時間" />
        <el-date-picker v-model="form.endDate" type="date" class="filter-item" placeholder="結束時間" />
      </el-form-item>

      <!-- 遍历已创建的选项渲染 -->
      <div v-for="(item, index) in form.itemList" :key="index" class="item">
        <el-form-item :label="(index + 1) + ''">
          <div class="item_title">
            <span>、{{ typeMap[item.type] }}: </span>
            <span v-text="item.title" />
          </div>
          <!-- 单项填空 -->
          <div v-if="item.type === 'input'">
            <el-input class="disabled" placeholder="禁止輸入" disabled />
          </div>
          <!-- 单选 -->
          <div v-else-if="item.type === 'radio'">
            <div v-for="(elm, i) in item.textList" :key="i" class="warp">
              <el-radio :label="(i + 1) + '、'" />
              <el-input v-model="item.textList[i]" />
            </div>
          </div>

          <!-- 多选 -->
          <div v-else-if="item.type === 'checkbox'">
            <div v-for="(elm, i) in item.textList" :key="i" class="warp">
              <el-checkbox :label="(i + 1) + '、'" />
              <el-input v-model="item.textList[i]" />
            </div>
          </div>

          <!-- 选择填空 -->
          <div v-else-if="item.type === 'select'">
            <el-select v-model="value" placeholder="請選擇">
              <el-option v-for="(elm, i) in item.textList" :key="i" :label="item.textList[i]" :value="i + ''" />
            </el-select>
          </div>

          <!-- 矩阵填空 -->
          <div v-else-if="item.type === 'matrix'">
            <div v-for="(elm, i) in item.textList" :key="i" class="warp">
              <span> {{ item.textList[i] }}：</span>
              <el-input class="disabled" placeholder="禁止輸入" disabled />
            </div>
          </div>
          <!-- 上移、下移、删除 -->
          <div style="margin-top: 10px">
            <el-button v-if="index != 0" @click="handleItem('up', item)">上移</el-button>
            <el-button v-if="index != form.itemList.length - 1" @click="handleItem('down', item)">下移</el-button>
            <el-button @click="handleItem('del', item)">刪除</el-button>
            <el-button @click="edit(item, index)">編輯</el-button>
          </div>
        </el-form-item>
      </div>

      <!-- 添加选项 -->
      <el-form-item>
        <el-button @click="add('radio')">單選</el-button>
        <el-button @click="add('checkbox')">多選</el-button>
        <el-button @click="add('input')">單項填空</el-button>
        <el-button @click="add('select')">選擇填空</el-button>
        <el-button @click="add('matrix')">矩陣填空</el-button>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="onSubmit">立即創建</el-button>
      </el-form-item>

      <!-- 添加选项弹出框 -->
      <div class="additem">
        <el-dialog :title="typeMap[questItem.type]" :visible.sync="showItem" width="50%">
          <el-form-item label="標題">
            <el-input v-model="itemTitle" />
          </el-form-item>
          <el-form-item v-show="questItem.type != 'input'" label="添加選項">
            <el-input-number v-model="num" :min="1" :max="10" @change="handleChange" />
          </el-form-item>
          <el-form-item v-for="(text, i) in itemText" v-show="questItem.type != 'input'" :key="i" label="選項">
            <el-input v-model="itemText[i]" />
          </el-form-item>
          <span slot="footer" class="dialog-footer">
            <el-button @click="clearItem">取 消</el-button>
            <el-button type="primary" @click="determine">確 定</el-button>
          </span>
        </el-dialog>
      </div>
    </el-form>
  </div>
</template>
<script>
import { saveQuestionnaire } from '../../api/questionnaire'

export default {
  data() {
    return {
      value: '',
      matrixsNum: 1,
      num: 1,
      form: {
        itemList: [],
        name: '',
        date: new Date(),
        endDate: new Date()
      },
      itemTitle: '',
      itemText: new Array(1),
      questItem: {},
      showItem: false,
      typeMap: {
        radio: '單選',
        checkbox: '多選',
        input: '問答',
        matrix: '矩陣問答',
        select: '選擇'
      },
      editIndex: ''
    }
  },
  watch: {
    showItem() {
      if (!this.showItem) {
        this.clearItem()
      }
    }
  },
  created() {
    const now = new Date()
    const defaultEndDate = new Date()
    defaultEndDate.setDate(now.getDate() + 7)

    this.form.date = now.toISOString().slice(0, 10)
    this.form.endDate = defaultEndDate.toISOString().slice(0, 10)
  },
  methods: {
    // 创建选项
    add(type) {
      this.questItem.type = type
      this.showItem = true
    },
    // 增加/减少 子选项
    handleChange(val) {
      this.itemText.length = val
    },
    // 确定将选项添加进列表中进行渲染
    determine() {
      if (this.questItem.type == 'input') {
        // 填空
        if (this.itemTitle == '') {
          this.$message('請輸入選項的標題內容')
          return
        }
        if (this.editIndex !== '') {
          this.questItem.title = this.itemTitle
          this.form.itemList.splice(this.editIndex, 1, this.questItem)
          this.editIndex = ''
        } else {
          this.questItem.title = this.itemTitle
          this.form.itemList.push(this.questItem)
        }
        this.clearItem()
      } else if (this.questItem.type == 'radio' || this.questItem.type == 'checkbox' || this.questItem.type == 'matrix' || this.questItem.type == 'select') {
        // 单选、多选、矩阵
        if (this.itemTitle == '') {
          this.$message('請輸入選項的標題內容')
          return
        }
        for (var i = 0; i < this.itemText.length; i++) {
          if (this.itemText[i] == '' || this.itemText[i] == undefined) {
            this.$message('請完整輸入每個選項内容')
            return
          }
        }
        if (this.editIndex !== '') {
          this.questItem.title = this.itemTitle
          this.questItem.textList = this.itemText
          this.form.itemList.splice(this.editIndex, 1, this.questItem)
          this.editIndex = ''
        } else {
          this.questItem.title = this.itemTitle
          this.questItem.textList = this.itemText
          this.form.itemList.push(this.questItem)
        }
        this.clearItem()
      }
    },
    // 编辑
    edit(item, editIndex) {
      this.editIndex = editIndex
      if (item.type !== 'input') {
        this.num = item.textList.length
        this.showItem = true
        this.questItem = item
        this.itemTitle = item.title
        this.itemText = []
        this.itemText.push(...item.textList)
      } else {
        this.showItem = true
        this.questItem = item
        this.itemTitle = item.title
      }
    },
    // 关闭弹窗，清空数据
    clearItem() {
      this.num = 1
      this.itemTitle = ''
      this.itemText = ['']
      this.questItem = {}
      this.showItem = false
    },
    // 判断上移、下移、删除
    handleItem(val, item) {
      switch (val) {
        case 'up':
          this.moveUp(item)
          break
        case 'down':
          this.moveDown(item)
          break
        case 'del':
          this.delItem(item)
          break
        default:
          throw new Error('該操作不存在！')
      }
    },
    // 上移
    moveUp(item) {
      const index = this.form.itemList.indexOf(item)
      this.form.itemList.splice(index, 1)
      this.form.itemList.splice(index - 1, 0, item)
    },
    // 下移
    moveDown(item) {
      const index = this.form.itemList.indexOf(item)
      this.moveUp(this.form.itemList[index + 1])
    },
    // 删除
    delItem(item) {
      const index = this.form.itemList.indexOf(item)
      this.form.itemList.splice(index, 1)
    },
    // 提交
    onSubmit() {
      if (this.form.name === '') {
        this.$message('请输入标题内容')
        return
      }
      if (this.form.date === '') {
        this.$message('请选择时间')
        return
      }
      if (this.form.itemList.length === 0) {
        this.$message('至少添加一个选项')
        return
      }

      const formattedNow = new Date(this.form.date).toISOString()
      const formattedDefaultEndDate = new Date(this.form.endDate).toISOString()

      saveQuestionnaire({
        title: this.form.name,
        date: formattedNow,
        endDate: formattedDefaultEndDate,
        itemList: this.form.itemList
      })
        .then(response => {
          const submission = response.data
          alert('建立成功')
          // 返回提交结果给前端
          return submission
        })
        .catch(error => {
          console.error('保存问卷出错：', error)
          throw error
        })
    }
  }
}
</script>
<style scoped>
.container {
  width: 1000px;
  margin: 100px auto;
}

.warp {
  display: flex;
  align-items: center;
}

.disabled {
  background: #F5F7FA;
}

input {
  -webkit-appearance: none;
  background-color: #FFF;
  background-image: none;
  border-radius: 4px;
  border: 1px solid #DCDFE6;
  box-sizing: border-box;
  color: #606266;
  font-size: inherit;
  height: 40px;
  line-height: 40px;
  outline: 0;
  padding: 0 15px;
  transition: border-color .2s cubic-bezier(.645, .045, .355, 1);
  margin: 10px 0 0;
}

.el-radio {
  color: #606266;
  cursor: pointer;
  margin-right: 0;
}
</style>
