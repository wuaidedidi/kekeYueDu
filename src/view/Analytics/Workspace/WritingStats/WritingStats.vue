<template>
  <div class="content">
    <div class="writingTitle">
      <div>码字统计</div>
      <div class="writingCheckTag">
        <el-segmented v-model="checkDay" :options="days" size="default" />
      </div>
    </div>
    <div style="font-size: smaller; color: lightgray">
      当前设备字数更新于今天 16:32, 其他客户端字数更新于今天16:30(每小时同步)
    </div>
    <div class="writingCount">
      <el-card class="editCount" body-style="width:100%;height:100%;">
        <div class="editHeader">
          <div class="editTop">
            今日码字<el-icon style="margin-left: 3px"><Warning /></el-icon>
          </div>
          <div style="font-weight: bolder; font-size: larger">09/19</div>
        </div>
        <div class="editCountCenter">
          <img
            src="/allBooks/bookList/bookTemplate1.png"
            style="width: 60%; height: 200px"
          />
          <div class="largeNumber">{{ 0 }}</div>

          <div>更更更， 码字犹如神，一日发三张，丸子不足夸</div>
        </div>
      </el-card>
      <el-card
        class="editImage"
        body-style="width:100%;padding:0px !important;"
      >
        <!-- 图表容器 -->
        <div ref="chartRef" class="chartImg"></div>
      </el-card>
    </div>
    <div class="writingDetail">
      <el-card class="detailList">
        <text class="detailTitle">7日最高码字</text>
        <br />
        <span style="font-size: 20px; font-weight: bold">657</span
        ><span style="font-size: xx-small; color: gray; opacity: 0.6">字</span>

        <div class="detailBottom">
          勇往直前吧, 少年!<el-icon><Flag /></el-icon>
        </div>
      </el-card>
      <el-card class="detailList">
        <text class="detailTitle">7日最高</text>

        <br />
        <span style="font-size: 20px; font-weight: bold">1,542</span
        ><span style="font-size: xx-small; color: gray; opacity: 0.6">字</span>

        <div class="detailBottom">
          今天比昨天更棒
          <el-icon style="color: pink">
            <MagicStick />
          </el-icon>
        </div>
      </el-card>
      <el-card class="detailList">
        <text class="detailTitle">7日累计码字</text>
        <br />
        <span style="font-size: 20px; font-weight: bold">3,232</span
        ><span style="font-size: xx-small; color: gray; opacity: 0.6">字</span>
        <div class="detailBottom">
          继续加油吧!
          <el-icon style="color: yellowgreen">
            <Star />
          </el-icon>
        </div>
      </el-card>
      <el-card class="detailList">
        <text class="detailTitle">本月平均码字</text>
        <div>657字</div>

        <div
          class="detailBottom"
          style="
            flex-direction: column;
            height: 60px;
            gap: 5px;
            justify-content: flex-end;
          "
        >
          <div
            style="
              padding-left: 10px;
              height: 20px;
              background-color: #4b8df2;
              width: 100%;
              color: white;
            "
          >
            本月
          </div>
          <div
            style="
              padding-left: 10px;
              height: 20px;
              background-color: #f4f8ff;
              width: 100%;
            "
          >
            820字/每天
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElSegmented } from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { Warning, Flag, Star, MagicStick } from '@element-plus/icons-vue'

// 选择天数的选项
const days = ['7天', '15天', '30天']
const checkDay = ref('7天')

// 图表引用和实例
const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null

// 不同天数的数据和日期
const chartData = {
  '7天': {
    data: [300, 600, 900, 1200, 1500, 1800, 1200], // 示例数据
    xAxis: [
      '2024/09/13',
      '2024/09/14',
      '2024/09/15',
      '2024/09/16',
      '2024/09/17',
      '2024/09/18',
      '2024/09/19',
    ],
  },
  '15天': {
    data: [
      300, 450, 600, 750, 900, 1050, 1200, 1350, 1500, 1650, 1800, 1950, 2100,
      2250, 2400,
    ], // 示例数据
    xAxis: [
      '2024/09/05',
      '2024/09/06',
      '2024/09/07',
      '2024/09/08',
      '2024/09/09',
      '2024/09/10',
      '2024/09/11',
      '2024/09/12',
      '2024/09/13',
      '2024/09/14',
      '2024/09/15',
      '2024/09/16',
      '2024/09/17',
      '2024/09/18',
      '2024/09/19',
    ],
  },
  '30天': {
    data: [
      300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950,
      1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550,
      1600, 1650, 1700, 1750,
    ], // 示例数据
    xAxis: [
      '2024/08/21',
      '2024/08/22',
      '2024/08/23',
      '2024/08/24',
      '2024/08/25',
      '2024/08/26',
      '2024/08/27',
      '2024/08/28',
      '2024/08/29',
      '2024/08/30',
      '2024/08/31',
      '2024/09/01',
      '2024/09/02',
      '2024/09/03',
      '2024/09/04',
      '2024/09/05',
      '2024/09/06',
      '2024/09/07',
      '2024/09/08',
      '2024/09/09',
      '2024/09/10',
      '2024/09/11',
      '2024/09/12',
      '2024/09/13',
      '2024/09/14',
      '2024/09/15',
      '2024/09/16',
      '2024/09/17',
      '2024/09/18',
      '2024/09/19',
    ],
  },
}

// 更新图表
const updateChart = (daysKey: keyof typeof chartData) => {
  if (chartInstance) {
    const option = {
      grid: {
        left: 75,
        right: 75,
      },
      tooltip: {
        trigger: 'axis', // 触发类型为轴触发
        formatter: function (params) {
          // 自定义提示内容
          const { name, value } = params[0]
          return `日期: ${name}<br/>码字数: ${value} 字`
        },
      },
      xAxis: {
        type: 'category',
        data: chartData[daysKey].xAxis,
        grid: {
          left: '15%', // 调整左边距
          right: '15%', // 调整右边距
        },
      },
      yAxis: {
        type: 'value',
        min: 300,
        max: 1800,
        interval: 300,
        axisLabel: {
          formatter: '{value} 字',
        },
      },
      series: [
        {
          data: chartData[daysKey].data,
          type: 'bar',
        },
      ],
    }
    chartInstance.setOption(option)
  }
}

onMounted(() => {
  chartInstance = echarts.init(chartRef.value)
  updateChart('7天')

  // 监听窗口大小变化，图表自适应
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

// 监听 checkDay 的变化，更新图表
watch(checkDay, (newDay) => {
  updateChart(newDay as keyof typeof chartData)
})
</script>

<style lang="scss" scoped>
.content {
  height: 100%;
  width: 90%;
  margin: 0 auto;

  .writingTitle {
    margin-top: 20px;
    font-size: large;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    .writingCheckTag {
      margin-left: auto;
    }
  }
  .writingCount {
    height: 350px;
    width: 100%;
    margin-top: 50px;
    display: flex;
    gap: 20px;
    .editCount {
      display: flex;
      height: 100%;
      flex: 4;
      .editTop {
        font-size: smaller;
        color: lightgray;
        display: flex;
        justify-content: flex-start;
        align-items: center;
      }

      .editCountCenter {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .largeNumber {
          font-size: xx-large;
        }
      }
    }
    .editImage {
      display: flex;
      height: 100%;

      flex: 6;
      .editImageBody {
        width: 100%;
      }

      .chartImg {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
      }
    }
  }
  .writingDetail {
    height: 150px;
    width: 100%;
    display: flex;
    gap: 20px;
    margin-top: 20px;
    .detailList {
      height: 100%;
      flex: 1;
      position: relative;
      .detailTitle {
        color: gray;
        font-weight: lighter;
        font-size: 12px;
      }
      .detailBottom {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        font-size: small;
        color: rgb(133, 124, 124);
        position: absolute;
        bottom: 10px; /* 将该元素放到容器的底部 */
        width: 80%;
      }
    }
  }
}
</style>
