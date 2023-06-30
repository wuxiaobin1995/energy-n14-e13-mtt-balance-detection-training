<!--
 * @Author      : Mr.bin
 * @Date        : 2023-06-20 11:40:04
 * @LastEditTime: 2023-06-30 21:35:55
 * @Description : 左右平衡测试-具体测量
-->
<template>
  <div class="lr-balance-measure">
    <div class="wrapper">
      <!-- 语音播放 -->
      <audio ref="audio" controls="controls" hidden :src="audioSrc" />

      <!-- 标题 -->
      <div class="title">左右平衡测试</div>

      <!-- 提示 -->
      <div class="tip">测试内容：左右重心转移。</div>

      <!-- 主体 -->
      <div class="main">
        <!-- 参数 -->
        <div class="parameter">
          <div class="parameter__visual">
            视觉反馈：{{ isVisual === true ? '有' : '无' }}
          </div>
          <div class="parameter__barycenter">
            重心轨迹：{{ isBarycenter === true ? '有' : '无' }}
          </div>
          <div class="parameter__time">测试时长：{{ time }}秒</div>
        </div>

        <!-- 图形区 -->
        <div class="chart" v-show="isVisual">
          <div id="chart" :style="{ width: '100%', height: '100%' }"></div>
        </div>

        <!-- 倒计时 -->
        <div class="count-down">
          <div class="count-down__text">倒 计 时</div>
          <div class="count-down__nowTime">{{ nowTime }} S</div>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="btn">
        <el-button
          class="item"
          type="primary"
          round
          @click="handleStart"
          :disabled="isStart"
          >开始测量</el-button
        >
        <el-button class="item" type="info" @click="handleRefresh"
          >刷新页面</el-button
        >
        <el-button class="item" round type="danger" @click="handleExit"
          >退出订单</el-button
        >
      </div>
    </div>
  </div>
</template>

<script>
/* 路径模块 */
import path from 'path'

/* 串口通信库 */
import SerialPort from 'serialport'
import Readline from '@serialport/parser-readline'

/* 计算圆的相关参数 */
import { setCircle } from '@/utils/setCircle.js'

export default {
  name: 'lr-balance-measure',

  data() {
    return {
      /* 语音相关 */
      audioOpen: this.$store.state.voiceSwitch,
      audioSrc: path.join(__static, `narrate/mandarin/Test/左右平衡测试.mp3`),

      /* 控制类 */
      isStart: false, // 是否开始

      /* 串口相关 */
      usbPort: null,
      parser: null,
      scmBaudRate: 115200,

      /* 图形相关变量 */
      myChart: null,
      option: {},

      /* 其他 */
      timeClock: null, // 倒计时计时器
      time: this.$store.state.settings[0].time, // 倒计时（测试时长）
      nowTime: this.$store.state.settings[0].time, // 实时倒计时
      isVisual: this.$store.state.settings[0].isVisual, // 是否开启视觉反馈
      isBarycenter: this.$store.state.settings[0].isBarycenter, // 是否开启重心轨迹

      xStandard: null,
      yStandard: null,

      trackArray: [] // 轨迹数组
    }
  },

  created() {
    this.xStandard = this.$store.state.zeroStandard.xStandard
    this.yStandard = this.$store.state.zeroStandard.yStandard

    this.initSerialPort() // 初始化串口对象
  },
  mounted() {
    if (this.audioOpen === true) {
      setTimeout(() => {
        this.$refs.audio.currentTime = 0
        this.$refs.audio.play()
      }, 500)
    }

    this.initChart() // 初始化echarts图形
  },
  beforeDestroy() {
    // 清除计时器
    if (this.timeClock) {
      clearInterval(this.timeClock)
    }
    // 关闭串口
    if (this.usbPort) {
      if (this.usbPort.isOpen) {
        this.usbPort.close()
      }
    }
  },

  methods: {
    /**
     * @description: 退出订单
     */
    handleExit() {
      this.$confirm(
        '订单进行中，此操作会退出该订单，之前的数据将会丢失，是否退出？',
        '警告',
        {
          type: 'warning',
          showClose: true,
          closeOnClickModal: true,
          closeOnPressEscape: true,
          center: true,
          confirmButtonText: '退 出',
          cancelButtonText: '否'
        }
      )
        .then(() => {
          this.$router.push({
            path: '/home'
          })
        })
        .catch(() => {})
    },

    /**
     * @description: 初始化串口对象
     */
    initSerialPort() {
      SerialPort.list()
        .then(ports => {
          /* 遍历设备的USB串口，目标设备需安装驱动 */
          let comPath = ''
          for (const port of ports) {
            if (/^USB/.test(port.pnpId)) {
              comPath = port.path
              break
            }
          }

          /* 验证USB有没有连接到电脑，但不能验证有无数据发送给上位机 */
          if (comPath) {
            /**
             * @description: 创建串口实例
             * @param {String} comPath 串行端口的系统路径。例如：在Mac、Linux上的/dev/tty.XXX或Windows上的COM1
             * @param {Object} 配置项
             */
            this.usbPort = new SerialPort(comPath, {
              baudRate: this.scmBaudRate, // 默认波特率115200
              autoOpen: false // 是否自动开启串口
            })
            /* 调用 this.usbPort.open() 成功时触发（开启串口成功） */
            this.usbPort.on('open', () => {
              this.usbPort.write('Y')

              this.isStart = true
              this.timeClock = setInterval(() => {
                this.nowTime -= 1
                if (this.nowTime === 0) {
                  this.finishData()
                }
              }, 1000)
            })
            /* 调用 this.usbPort.open() 失败时触发（开启串口失败） */
            this.usbPort.on('error', () => {
              this.$alert(
                `请重新连接USB线，然后点击"刷新页面"按钮，重新测试！`,
                '串口开启失败',
                {
                  type: 'error',
                  showClose: false,
                  center: true,
                  confirmButtonText: '刷新页面',
                  callback: () => {
                    this.handleRefresh()
                  }
                }
              )
            })

            /* Readline解析器将数据转换成字符串 */
            this.parser = this.usbPort.pipe(new Readline({ delimiter: '\n' }))
            this.parser.on('data', data => {
              const dataArray = data.split(',')
              const x = parseFloat(dataArray[0]) // 绕Y角度，左右
              const y = parseFloat(dataArray[1]) // 绕X角度，前后

              /* 数据验证 */
              if (!isNaN(x) && !isNaN(y)) {
                const xCalibration = parseFloat((x - this.xStandard).toFixed(2))
                const yCalibration = parseFloat((y - this.yStandard).toFixed(2))

                this.trackArray.push([xCalibration, yCalibration])

                if (this.isBarycenter) {
                  this.option.series[0].data = this.trackArray
                  this.myChart.setOption(this.option)
                }
              }
            })
          } else {
            this.$getLogger('没有检测到USB连接')
            this.$alert(
              `请重新连接USB线，然后点击"刷新页面"按钮，重新测试！`,
              '没有检测到USB连接',
              {
                type: 'error',
                showClose: false,
                center: true,
                confirmButtonText: '刷新页面',
                callback: () => {
                  this.handleRefresh()
                }
              }
            )
          }
        })
        .catch(err => {
          this.$getLogger(err)
          this.$alert(
            `${err}。请重新连接USB线，然后点击"刷新页面"按钮，重新测试！`,
            `初始化SerialPort.list失败`,
            {
              type: 'error',
              showClose: false,
              center: true,
              confirmButtonText: '刷新页面',
              callback: () => {
                this.handleRefresh()
              }
            }
          )
        })
    },

    /**
     * @description: 初始化echarts图形
     */
    initChart() {
      /* 相关计算 */
      const boundaryAngle = parseFloat(
        window.localStorage.getItem('boundaryAngle')
      ) // 最大角度

      const borderRound = setCircle(0, 0, boundaryAngle) // 边界圆

      this.myChart = this.$echarts.init(
        document.getElementById('chart'),
        'light',
        {
          renderer: 'canvas'
        }
      )
      this.option = {
        xAxis: {
          type: 'value',
          min: -boundaryAngle,
          max: boundaryAngle,
          axisLabel: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          min: -boundaryAngle,
          max: boundaryAngle,
          axisLabel: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          }
        },
        // tooltip: {},
        series: [
          // 重心移动轨迹
          {
            type: 'line',
            name: '重心移动轨迹',
            data: [],
            color: 'red',
            smooth: true,
            showSymbol: false
          },
          // 边界圆
          {
            type: 'line',
            name: '边界圆',
            data: borderRound,
            color: '#6E7079',
            smooth: true,
            showSymbol: false
          },
          // 线框
          {
            type: 'line',
            name: '线框',
            data: [
              [boundaryAngle - 1, parseFloat((boundaryAngle / 8).toFixed(2))],
              [-boundaryAngle + 1, parseFloat((boundaryAngle / 8).toFixed(2))],
              [-boundaryAngle + 1, -parseFloat((boundaryAngle / 8).toFixed(2))],
              [boundaryAngle - 1, -parseFloat((boundaryAngle / 8).toFixed(2))],
              [boundaryAngle - 1, parseFloat((boundaryAngle / 8).toFixed(2))]
            ],
            color: '#2E75B6',
            smooth: false,
            showSymbol: false
          }
        ],
        animation: false
      }
      this.myChart.setOption(this.option)
    },

    /**
     * @description: 开始按钮
     */
    handleStart() {
      if (this.usbPort) {
        if (!this.usbPort.isOpen) {
          this.usbPort.open()
        }
      }
    },

    /**
     * @description: 完成该项目
     */
    finishData() {
      // 清除计时器
      if (this.timeClock) {
        clearInterval(this.timeClock)
      }

      this.usbPort.write('N')

      /* 删除Vuex参数配置数组的第一个元素 */
      let settings = JSON.parse(JSON.stringify(this.$store.state.settings))
      settings.shift()
      this.$store.dispatch('setSettings', settings).then(() => {
        /* 数据 */
        const res = this.calculate()
        const obj = {
          pattern: '左右平衡测试',
          time: this.time, // 测试时长
          isVisual: this.isVisual, // 是否开启视觉反馈
          isBarycenter: this.isBarycenter, // 是否开启重心轨迹
          trackArray: this.trackArray, // 轨迹数组
          boundaryAngle: res.boundaryAngle, // 最大角度
          borderRound: res.borderRound, // 边界圆
          score: res.score, // 综合得分
          scoreText: res.scoreText, // 评价
          deflection: res.deflection // 偏向
        }

        /* 暂存至 sessionStorage */
        let resultArray = JSON.parse(
          window.sessionStorage.getItem('resultArray')
        )
        resultArray.push(obj)
        window.sessionStorage.setItem(
          'resultArray',
          JSON.stringify(resultArray)
        )

        if (this.$store.state.settings.length) {
          this.$alert(`请点击“下一项”按钮`, '完成', {
            type: 'success',
            showClose: false,
            center: true,
            confirmButtonText: '下一项',
            callback: () => {
              this.handleFinish()
            }
          })
        } else {
          this.$alert(`请点击“完成订单”按钮`, '完成', {
            type: 'success',
            showClose: false,
            center: true,
            confirmButtonText: '完成订单',
            callback: () => {
              this.handleFinish()
            }
          })
        }
      })
    },

    /**
     * @description: 完成订单或者下一项
     */
    handleFinish() {
      if (this.$store.state.settings.length) {
        // 下一项
        let route = ''
        switch (this.$store.state.settings[0].pattern) {
          case '平衡测试':
            route = 'balance-measure'
            break
          case '本体感觉平衡测试':
            route = 'proprioception-balance-measure'
            break
          case '左右平衡测试':
            route = 'lr-balance-measure'
            break
          case '前后平衡测试':
            route = 'fb-balance-measure'
            break
          case '对角线平衡测试':
            route = 'diagonal-balance-measure'
            break
          default:
            break
        }

        this.$router.push({
          path: '/' + route
        })
      } else {
        // 完成订单
        this.$router.push({
          path: '/test-send'
        })
      }
    },

    /**
     * @description: 刷新页面按钮
     */
    handleRefresh() {
      this.$router.push({
        path: '/refresh',
        query: {
          routerName: JSON.stringify('/lr-balance-measure'),
          duration: JSON.stringify(300)
        }
      })
    },

    /**
     * @description: 计算各种数值逻辑函数
     */
    calculate() {
      /* 背景参考曲线 */
      const boundaryAngle = parseFloat(
        window.localStorage.getItem('boundaryAngle')
      ) // 最大角度

      const borderRound = setCircle(0, 0, boundaryAngle) // 边界圆

      /* 计算综合得分和评价 */
      const trackArray = this.trackArray

      const yes = []
      for (let i = 0; i < trackArray.length; i++) {
        const x = trackArray[i][0]
        const y = trackArray[i][1]
        if (x >= -(boundaryAngle - 1) && x <= boundaryAngle - 1) {
          if (
            y >= -parseFloat((boundaryAngle / 8).toFixed(2)) &&
            y <= parseFloat((boundaryAngle / 8).toFixed(2))
          ) {
            yes.push(1)
          }
        }
      }
      const score = parseInt(
        ((yes.length / trackArray.length) * 100).toFixed(0)
      )

      let scoreText = ''
      if (score < 40) {
        scoreText = '差'
      } else if (score >= 40 && score < 60) {
        scoreText = '较差'
      } else if (score >= 60 && score < 80) {
        scoreText = '一般'
      } else if (score >= 80 && score <= 100) {
        scoreText = '优秀'
      } else {
        scoreText = '暂无评价'
      }

      /* 计算偏向 */
      const left = [] // 左
      const right = [] // 右
      for (let i = 0; i < trackArray.length; i++) {
        const x = trackArray[i][0]
        if (x < 0) {
          left.push(x)
        } else if (x > 0) {
          right.push(x)
        }
      }
      let deflection = ''
      if (left.length > right.length) {
        deflection = '左'
      } else if (left.length <= right.length) {
        deflection = '右'
      }

      /* 返回结果 */
      return {
        boundaryAngle,
        borderRound,

        score,
        scoreText,

        deflection
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.lr-balance-measure {
  width: 100%;
  height: 100%;
  @include flex(row, center, center);

  .wrapper {
    width: 96%;
    height: 96%;
    border-radius: 20px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    @include flex(column, stretch, stretch);
    padding: 20px 100px;

    /* 标题 */
    .title {
      font-size: 36px;
      color: green;
    }

    /* 提示 */
    .tip {
      margin-top: 20px;
      font-size: 22px;
    }

    /* 主体 */
    .main {
      flex: 1;
      @include flex(row, space-between, center);
      // 参数
      .parameter {
        width: 20%;
        .parameter__visual {
          font-size: 22px;
        }
        .parameter__barycenter {
          margin-top: 100px;
          font-size: 22px;
        }
        .parameter__time {
          margin-top: 100px;
          font-size: 22px;
        }
      }

      // 图形区
      .chart {
        width: 30vw;
        height: 63vh;
      }

      // 倒计时
      .count-down {
        width: 20%;
        @include flex(column, center, center);
        .count-down__text {
          font-size: 28px;
        }
        .count-down__nowTime {
          margin-top: 10px;
          padding: 4px 0;
          width: 100px;
          background-color: rgb(112, 173, 71);
          @include flex(row, center, center);
          font-size: 28px;
          color: #ffffff;
        }
      }
    }

    /* 按钮组 */
    .btn {
      @include flex(row, center, center);
      .item {
        font-size: 30px;
        margin: 0 40px;
      }
    }
  }
}
</style>
