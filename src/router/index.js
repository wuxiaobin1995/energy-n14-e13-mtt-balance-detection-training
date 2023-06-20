/*
 * @Author      : Mr.bin
 * @Date        : 2023-06-16 21:20:25
 * @LastEditTime: 2023-06-20 11:43:50
 * @Description : 路由
 */
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 解决ElementUI导航栏中的vue-router在3.0版本以上重复点菜单报错问题
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

const routes = [
  /*
   * 前面加"/"表示绝对路径，不加"/"表示相对路径
   * 一般嵌套路由中的子路由不需要加"/"，它会在父路由后自动加上"/子路由"
   * 比如父 "/father"，子 "child"，要想访问子路由，跳转链接需要写成 "/father/child"
   */

  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout'),
    redirect: '/home',
    children: [
      // 首页
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/home'),
        meta: ['首页']
      },
      // 蓝牙连接
      {
        path: 'set-bluetooth-connect',
        name: 'set-bluetooth-connect',
        component: () => import('@/views/set/set-bluetooth-connect'),
        meta: ['蓝牙连接']
      },
      // 调零
      {
        path: 'set-zero',
        name: 'set-zero',
        component: () => import('@/views/set/set-zero'),
        meta: ['调零']
      },
      // 开发者
      {
        path: 'set-developer',
        name: 'set-developer',
        component: () => import('@/views/set/set-developer'),
        meta: ['开发者']
      },

      // 任务详情页
      {
        path: 'task',
        name: 'task',
        component: () => import('@/views/task'),
        meta: ['任务详情页']
      },

      /* 评估 */
      // 平衡测试-具体测量
      {
        path: 'balance-measure',
        name: 'balance-measure',
        component: () => import('@/views/test-mode/balance/measure'),
        meta: ['平衡测试-具体测量']
      },
      // 本体感觉平衡测试-具体测量
      {
        path: 'proprioception-balance-measure',
        name: 'proprioception-balance-measure',
        component: () =>
          import('@/views/test-mode/proprioception-balance/measure'),
        meta: ['本体感觉平衡测试-具体测量']
      },
      // 左右平衡测试-具体测量
      {
        path: 'lr-balance-measure',
        name: 'lr-balance-measure',
        component: () => import('@/views/test-mode/lr-balance/measure'),
        meta: ['左右平衡测试-具体测量']
      },
      // 前后平衡测试-具体测量
      {
        path: 'fb-balance-measure',
        name: 'fb-balance-measure',
        component: () => import('@/views/test-mode/fb-balance/measure'),
        meta: ['前后平衡测试-具体测量']
      },
      // 对角线平衡测试-具体测量
      {
        path: 'diagonal-balance-measure',
        name: 'diagonal-balance-measure',
        component: () => import('@/views/test-mode/diagonal-balance/measure'),
        meta: ['对角线平衡测试-具体测量']
      },

      /* 训练 */
      // 圆环保持训练-具体测量
      {
        path: 'ring-hold-measure',
        name: 'ring-hold-measure',
        component: () => import('@/views/train-mode/ring-hold/measure'),
        meta: ['圆环保持训练-具体测量']
      },
      // 圆圈保持训练-具体测量
      {
        path: 'circle-hold-measure',
        name: 'circle-hold-measure',
        component: () => import('@/views/train-mode/circle-hold/measure'),
        meta: ['圆圈保持训练-具体测量']
      }
    ]
  },

  /* 评估数据统一发送页面 */
  {
    path: '/test-send',
    name: 'test-send',
    component: () => import('@/views/test-mode/test-send'),
    meta: ['评估数据统一发送页面']
  },

  /* 训练数据统一发送页面 */
  {
    path: '/train-send',
    name: 'train-send',
    component: () => import('@/views/train-mode/train-send'),
    meta: ['训练数据统一发送页面']
  },

  {
    path: '/refresh',
    name: 'refresh',
    component: () => import('@/views/refresh')
  },

  {
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  routes,
  /* 自定义路由切换时页面如何滚动 */
  scrollBehavior(to, from, savedPosition) {
    return { x: 0, y: 0 } // 回到顶部
  }
})
export default router
