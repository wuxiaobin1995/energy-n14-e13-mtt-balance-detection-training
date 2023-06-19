<!--
 * @Author      : Mr.bin
 * @Date        : 2023-06-16 21:20:25
 * @LastEditTime: 2023-06-19 21:20:11
 * @Description : 根组件
-->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',

  created() {
    this.initLocalStorage()
  },

  methods: {
    /**
     * @description: 软件启动后，初始化localStorage的一些值
     */
    initLocalStorage() {
      /* 初始化边界圆半径值 */
      if (!window.localStorage.getItem('boundaryAngle')) {
        window.localStorage.setItem('boundaryAngle', 12)
      }
      /* 初始化API的IP地址 */
      if (!window.localStorage.getItem('mttIP')) {
        window.localStorage.setItem('mttIP', '192.168.1.150')
      }
    }
  }
}
</script>

<style lang="scss" scoped></style>
