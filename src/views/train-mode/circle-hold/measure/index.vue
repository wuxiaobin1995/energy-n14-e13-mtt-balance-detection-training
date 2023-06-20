<!--
 * @Author      : Mr.bin
 * @Date        : 2023-06-20 10:14:53
 * @LastEditTime: 2023-06-20 10:20:04
 * @Description : 圆圈保持训练-具体测量
-->
<template>
  <div class="circle-hold-measure">
    <div class="wrapper">
      <!-- 语音播放 -->
      <audio ref="audio" controls="controls" hidden :src="audioSrc" />

      <!-- 标题 -->
      <div class="title">圆圈保持训练</div>

      <!-- 提示 -->
      <div class="tip">
        请双腿平稳站立在平台上，在规定的范围内，控制重心做训练。
      </div>

      <!-- 主体 -->
      <div class="main">
        <!-- 占位 -->
        <div class="perch"></div>

        <!-- 图形区 -->
        <div class="chart">
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
          round
          type="primary"
          @click="handleStart"
          :disabled="isStart"
          >开始训练</el-button
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
  name: 'circle-hold-measure',

  data() {
    return {
      /* 语音相关 */
      audioOpen: this.$store.state.voiceSwitch,
      audioSrc: path.join(__static, `narrate/mandarin/Train/圆圈保持训练.mp3`),

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
      time: this.$store.state.settings[0].time, // 倒计时（训练时长）
      nowTime: this.$store.state.settings[0].time, // 实时倒计时
      circle: this.$store.state.settings[0].circle, // 圆圈半径
      xAxis: this.$store.state.settings[0].xAxis, // x轴坐标
      yAxis: this.$store.state.settings[0].yAxis, // y轴坐标

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

                this.option.series[0].data = this.trackArray
                this.myChart.setOption(this.option)
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

      const round = setCircle(this.xAxis, this.yAxis, this.circle) // 圆圈

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
        series: [
          // 重心移动轨迹
          {
            type: 'line',
            name: '重心移动轨迹',
            data: [],
            color: 'orange',
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
          // 圆圈
          {
            type: 'line',
            name: '圆圈',
            data: round,
            color: 'green',
            smooth: true,
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
        const obj = {
          pattern: '圆圈保持训练',
          time: this.time, // 训练时长
          circle: this.circle, // 圆圈半径
          xAxis: this.xAxis, // x轴坐标
          yAxis: this.yAxis, // y轴坐标
          trackArray: this.trackArray // 轨迹数组
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
          case '圆环保持训练':
            route = 'ring-hold-measure'
            break
          case '圆圈保持训练':
            route = 'circle-hold-measure'
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
          path: '/train-send'
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
          routerName: JSON.stringify('/circle-hold-measure'),
          duration: JSON.stringify(300)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.circle-hold-measure {
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

      // 占位
      .perch {
        width: 20%;
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
