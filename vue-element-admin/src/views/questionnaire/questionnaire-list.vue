<template>
    <div class="app-container">
        <div class="filter-container">
            <el-input v-model="listQuery.title" placeholder="Title" style="width: 200px" class="filter-item"
                @keyup.enter.native="handleFilter" />
            <el-select v-model="listQuery.sort" style="width: 140px" class="filter-item" @change="handleFilter">
                <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
            </el-select>
            <el-date-picker v-model="listQuery.date" type="date" class="filter-item" placeholder="开始时间"
                @change="handleFilter" />
            <el-date-picker v-model="listQuery.endDate" type="date" class="filter-item" placeholder="结束时间"
                @change="handleFilter" />
            <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
                Search
            </el-button>
        </div>

        <el-table :key="tableKey" :data="sortedList" border fit highlight-current-row style="width: 100%"
            @sort-change="handleSortChange">
            <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80"
                :class-name="getSortClass('id')">
                <template #default="{ row }">
                    <span>{{ row.id }}</span>
                </template>
            </el-table-column>
            <el-table-column label="Title" min-width="150px">
                <template #default="{ row }">
                    <span class="link-type">{{ row.title }}</span>
                </template>
            </el-table-column>
            <el-table-column label="Date" width="150px" align="center">
                <template #default="{ row }">
                    <span>{{ row.date | parseTime("{y}-{m}-{d}") }}</span>
                </template>
            </el-table-column>
            <el-table-column label="EndDate" width="150px" align="center">
                <template #default="{ row }">
                    <span>{{ row.endDate | parseTime("{y}-{m}-{d}") }}</span>
                </template>
            </el-table-column>
            <el-table-column label="State" align="center" width="95">
                <template #default="{ row }">
                    <span>{{ row.status }}</span>
                </template>
            </el-table-column>

            <el-table-column label="Statistics" align="center" width="230" class-name="small-padding fixed-width">
                <template #default="{ row }">
                    <el-button type="primary" size="mini" @click="handleResult(row)">
                        Result
                    </el-button>
                    <el-button size="mini" type="danger" @click="handleDelete(row)">
                        Delete
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-dialog v-if="showModal" title="Chart" :visible.sync="showModal" width="70%">
            <div class="chart-container">
                <div id="pieChart" style="width: 100%; height: 400px;"></div>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="showModal = false">Close</el-button>
            </span>
        </el-dialog>

        <pagination v-show="total > 0" :total="total" :page.sync="currentPage" :limit.sync="pageSize"
            @pagination="fetchQuestionnaire" />

        <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
            <el-form ref="dataForm" :rules="rules" :model="listQuery" label-position="left" label-width="70px"
                style="width: 400px; margin-left: 50px">
                <el-form-item label="Type" prop="type">

                    <el-select v-model="listQuery.type" class="filter-item" placeholder="Please select"
                        @change="fetchQuestionnaire">
                        <el-option v-for="item in calendarTypeOptions" :key="item.key" :label="item.display_name"
                            :value="item.key" />
                    </el-select>
                </el-form-item>
                <el-form-item label="Date" prop="date">
                    <el-date-picker v-model="listQuery.date" type="datetime" placeholder="Please pick a date"
                        @change="fetchQuestionnaire" />
                </el-form-item>
                <el-form-item label="EndDate" prop="endDate">
                    <el-date-picker v-model="listQuery.endDate" type="datetime" placeholder="Please pick a date"
                        @change="fetchQuestionnaire" />
                </el-form-item>
                <el-form-item label="Title" prop="title">
                    <el-input v-model="listQuery.title" @change="fetchQuestionnaire" />
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible = false">
                    Cancel
                </el-button>
                <el-button type="primary" @click="
                    dialogStatus === 'create' ? createData() : updateData()
                    ">
                    Confirm
                </el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import {
    fetchList,
    fetchPv,
    createArticle,
    updateArticle,
} from "@/api/article";
import waves from "@/directive/waves"; // waves directive
import { parseTime } from "@/utils";
import Pagination from "@/components/Pagination"; // secondary package based on el-pagination
import axios from "axios";
import echarts from "echarts/lib/echarts";
import "echarts/lib/chart/pie";
import "echarts/lib/component/tooltip";



const calendarTypeOptions = [
    { key: "CN", display_name: "China" },
    { key: "US", display_name: "USA" },
    { key: "JP", display_name: "Japan" },
    { key: "EU", display_name: "Eurozone" },
];

// arr to obj, such as { CN: "China", US: "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
    acc[cur.key] = cur.display_name;
    return acc;
}, {});

export default {
    name: "ComplexTable",
    components: { Pagination },
    directives: { waves },
    filters: {
        parseTime(value, format) {
            const date = new Date(value);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");

            // 根据传入的格式参数进行日期格式化
            if (format === "{y}-{m}-{d}") {
                return `${year}-${month}-${day}`;
            }

            return value; // 如果没有匹配的格式，直接返回原始值
        },
        statusFilter(status) {
            const statusMap = {
                published: "success",
                draft: "info",
                deleted: "danger",
            };
            return statusMap[status];
        },
        typeFilter(type) {
            return calendarTypeKeyValue[type];
        },
    },
    data() {
        return {
            currentPage: 1, // 當前頁碼
            pageSize: 10, // 每頁顯示的資料筆數
            tableKey: 0,
            list: [],
            total: 0,
            title: "",
            date: "",
            endDate: "",
            keyword: "",
            listLoading: false,
            showModal: false, // 控制是否顯示 Modal
            chartData: [], // 初始化為空數組
            listQuery: {
                importance: "",
                title: "",
                date: "",
                endDate: "",
                type: "",
                sort: "+id",
            },
            importanceOptions: [1, 2, 3],
            calendarTypeOptions,
            sortOptions: [
                { label: "ID Ascending", key: "+id" },
                { label: "ID Descending", key: "-id" },
            ],
            statusOptions: ["published", "draft", "deleted"],
            showReviewer: false,
            temp: {
                id: undefined,
                importance: 1,
                remark: "",
                timestamp: new Date(),
                date: "",
                endDate: "",
                title: "",
                type: "",
                status: "published",
            },
            dialogFormVisible: false,
            dialogStatus: "",
            textMap: {
                update: "Edit",
                create: "Create",
            },
            dialogPvVisible: false,
            pvData: [],
            rules: {
                type: [
                    {
                        required: true,
                        message: "type is required",
                        trigger: "change",
                    },
                ],
                timestamp: [
                    {
                        type: "date",
                        required: true,
                        message: "timestamp is required",
                        trigger: "change",
                    },
                ],
                title: [
                    {
                        required: true,
                        message: "title is required",
                        trigger: "blur",
                    },
                ],
            },
            downloadLoading: false,
        };
    },
    computed: {
        sortedList() {
            // 克隆列表数据以避免直接修改原始数据
            const clonedList = [...this.list];

            // 为每个对象添加属性和状态属性
            const sortedWithId = clonedList.map((item, index) => {
                const currentTime = new Date();
                const startDate = new Date(item.date);
                const endDate = new Date(item.endDate);
                let status = "";

                if (currentTime < startDate) {
                    status = "尚未開始";
                } else if (currentTime >= startDate && currentTime <= endDate) {
                    status = "進行中";
                } else {
                    status = "已結束";
                }

                return {
                    ...item,
                    id: item.id, // 使用数据库中的ID字段
                    status: status,
                };
            });

            // 根据需要对列表进行排序
            if (this.listQuery.sort === "+id") {
                return sortedWithId.sort((a, b) => a.id - b.id); // 升序
            } else if (this.listQuery.sort === "-id") {
                return sortedWithId.sort((a, b) => b.id - a.id); // 降序
            }

            return sortedWithId;
        },
        displayedList() {
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            return this.sortedList.slice(startIndex, endIndex);
        },
    },
    mounted() {
        this.updateChart();
    },
    created() {
        this.fetchQuestionnaire();
    },
    methods: {
        fetchQuestionnaire() {
            const url = "/api/getQuestionnaire";
            const { currentPage, pageSize, listQuery } = this;
            const requestData = {
                page: currentPage,
                limit: pageSize,
                title: listQuery.title.trim(),
                date: listQuery.date,
                endDate: listQuery.endDate,
            };

            console.log(requestData); // 檢查 requestData 的內容

            axios
                .post(url, requestData)
                .then((res) => {
                    console.log(res);
                    this.list = res.data[0].list;
                    this.total = res.data[0].total;

                    console.log(this.list);
                    console.log(this.total);
                })
                .catch((error) => {
                    console.error("获取问卷失败：", error);
                });
        },

        handleDelete(row) {
            const url = "/api/deleteQuestionnaire";
            const requestData = { id: row.id }; // 构建要发送的 JSON 数据

            axios.post(url, requestData).then(() => {
                console.log(row.id);
                this.fetchQuestionnaire();
                this.$notify({
                    title: "Success",
                    message: "Delete Successfully",
                    type: "success",
                    duration: 2000,
                });
            });
        },
        handleResult(row) {
            const url = "/api/resultQuestionnaire";
            const requestResult = { id: row.id };

            axios
                .post(url, requestResult)
                .then((response) => {
                    this.chartData = response.data;
                    this.showModal = true; // 顯示 Modal
                    this.updateChart(); // 更新圖表
                    console.log(response.data)
                })
                .catch((error) => {
                    console.error("Error fetching result:", error);
                });
        },

        // updateChart() {
        //     this.$nextTick(() => {
        //         // 初始化 echarts 圖表實例
        //         let chart = echarts.init(document.getElementById("pieChart"));

        //         let option = {
        //             series: [
        //                 {
        //                     type: "pie",
        //                     data: this.chartData,
        //                 },
        //             ],
        //         };

        //         // 設置選項並更新圖表
        //         chart.setOption(option);
        //         console.log("ECharts initialized and chart updated.");
        //     });
        // },

        updateChart() {
            this.$nextTick(() => {
                // 初始化 echarts 圖表實例
                let chart = echarts.init(document.getElementById("pieChart"));

                let option = {
                    tooltip: {
                        trigger: "item",
                    },
                    legend: {
                        top: "5%",
                        left: "center",
                    },
                    series: [
                        {
                            name: "Access From",
                            type: "pie",
                            radius: ["40%", "70%"],
                            avoidLabelOverlap: false,
                            itemStyle: {
                                borderRadius: 10,
                                borderColor: "#fff",
                                borderWidth: 2,
                            },
                            label: {
                                show: false,
                                position: "center",
                            },
                            emphasis: {
                                label: {
                                    show: true,
                                    fontSize: 14,
                                    fontWeight: "bold",
                                },
                            },
                            labelLine: {
                                show: false,
                            },
                            data: this.chartData, // 使用從後端獲取的數據更新數據
                            // 自定義顏色
                            color: ["#5470C6", "#91CC75", "#EE6666", "#73C0DE", "#3BA272"],
                            // 自定義圖例
                            legend: {
                                orient: "vertical",
                                left: "left",
                                data: this.chartData.map(item => item.name),
                            },
                            // 自定義標籤
                            label: {
                                formatter: "{b}: {c} ({d}%)",
                            },
                            // 自定義提示框內容
                            tooltip: {
                                trigger: "item",
                                formatter: "{a} <br/>{b}: {c} ({d}%)",
                            },
                        },
                    ],
                };

                // 設置選項並更新圖表
                chart.setOption(option);
                console.log("ECharts initialized and chart updated.");
            });
        },


        // updateChart() {
        //     this.$nextTick(() => {
        //         if (this.showPieChart) {
        //             // 初始化 echarts 圖表實例
        //             let chart = echarts.init(document.getElementById("pieChart"));


        //             let option = {
        //                 tooltip: {
        //                     trigger: "item",
        //                 },
        //                 legend: {
        //                     top: "5%",
        //                     left: "center",
        //                 },
        //                 series: [
        //                     {
        //                         name: "Access From",
        //                         type: "pie",
        //                         radius: ["40%", "70%"],
        //                         avoidLabelOverlap: false,
        //                         itemStyle: {
        //                             borderRadius: 10,
        //                             borderColor: "#fff",
        //                             borderWidth: 2,
        //                         },
        //                         label: {
        //                             show: false,
        //                             position: "center",
        //                         },
        //                         emphasis: {
        //                             label: {
        //                                 show: true,
        //                                 fontSize: 14,
        //                                 fontWeight: "bold",
        //                             },
        //                         },
        //                         labelLine: {
        //                             show: false,
        //                         },
        //                         data: this.chartData, // 使用從後端獲取的數據更新數據
        //                         // 自定義顏色
        //                         color: ["#5470C6", "#91CC75", "#EE6666", "#73C0DE", "#3BA272"],
        //                         // 自定義圖例
        //                         legend: {
        //                             orient: "vertical",
        //                             left: "left",
        //                             data: this.chartData.map(item => item.name),
        //                         },
        //                         // 自定義標籤
        //                         label: {
        //                             formatter: "{b}: {c} ({d}%)",
        //                         },
        //                         // 自定義提示框內容
        //                         tooltip: {
        //                             trigger: "item",
        //                             formatter: "{a} <br/>{b}: {c} ({d}%)",
        //                         },
        //                     },
        //                 ],
        //             };

        //             // 設置選項並更新圖表
        //             chart.setOption(option);
        //             console.log("ECharts initialized and chart updated.");
        //         }
        //     });
        // },


        handleFilter() {
            this.listQuery.page = 1;
            this.currentPage = 1;
            this.fetchQuestionnaire();
        },

        handleModifyStatus(row, status) {
            this.$message({
                message: "操作Success",
                type: "success",
            });
            row.status = status;
        },

        handleSortChange(data) {
            const { prop, order } = data;
            if (prop === "id") {
                this.listQuery.sort = order === "ascending" ? "+id" : "-id";
            } else {
                this.listQuery.sort = "";
            }
            this.handleFilter();
        },
        //  showQuestions() {
        //   // 向后端API发送请求，获取问卷的问题数据
        //   // 假设questionnaireId是当前问卷的ID，您可以从listQuery对象中获取该ID
        //   const questionnaireId = this.listQuery.questionnaireId;

        //   // 向后端API发送请求，获取问题数据
        //   this.$axios.get(`/api/questionnaire/${questionnaireId}/questions`)
        //     .then(response => {
        //       // 获取到问题数据后，存储在questions数组中，并弹出对话框显示问题
        //       this.questions = response.data;
        //       this.dialogFormVisible = true;
        //     })
        //     .catch(error => {
        //       console.error("Error:", error);
        //     });
        // },

        // sortChange(data) {
        //   const { prop, order } = data;
        //   if (prop === "id") {
        //     this.sortByID(order);
        //   }
        // },

        resetTemp() {
            this.temp = {
                id: undefined,
                importance: 1,
                remark: "",
                timestamp: new Date(),
                title: "",
                status: "published",
                type: "",
            };
        },

        formatJson(filterVal) {
            return this.list.map((v) =>
                filterVal.map((j) => {
                    if (j === "date" || j === "endDate") {
                        return this.parseTime(v[j]);
                    } else {
                        return v[j];
                    }
                })
            );
        },
        getSortClass: function (key) {
            const sort = this.listQuery.sort;
            return sort === `+${key}` ? "ascending" : "descending";
        },
    },
};
</script>
