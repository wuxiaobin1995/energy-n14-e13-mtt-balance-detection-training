/*
 * @Author      : Mr.bin
 * @Date        : 2021-12-22 16:42:33
 * @LastEditTime: 2022-04-21 09:35:10
 * @Description : 计算圆的相关参数
 */

/**
 * @description: 计算圆的相关参数
 * @param {Number} xAxis x轴圆心位置
 * @param {Number} yAxis y轴圆心位置
 * @param {Number} radius 半径
 * @return {Array} 返回整圆数组
 */
export function setCircle(xAxis = 0, yAxis = 0, radius = 10) {
  const interval = parseInt((radius / 0.1).toFixed(0)) * 2 // x轴参数总数量
  // 上半圆数组
  const xArrUp = []
  let xItem = radius + xAxis
  for (let i = 0; i < interval; i++) {
    xArrUp.push(xItem)
    xItem = parseFloat((xItem - 0.1).toFixed(2))
  }
  xArrUp[0] = radius + xAxis // 确保第一个值等于 radius
  xArrUp[xArrUp.length] = -radius + xAxis // 确保最后一个值等于 -radius
  const yArrUp = []
  for (let i = 0; i < xArrUp.length; i++) {
    yArrUp.push(
      Math.sqrt(
        Math.abs(Math.pow(radius, 2) - Math.pow(xArrUp[i] - xAxis, 2))
      ) + yAxis
    )
  }
  const resUp = []
  for (let i = 0; i < xArrUp.length; i++) {
    resUp.push([xArrUp[i], yArrUp[i]])
  }
  // 下半圆数组
  const xArrDown = xArrUp
  xArrDown.reverse() // 数组反转，目的是避免中间出现直线
  const yArrDown = []
  for (let i = 0; i < xArrDown.length; i++) {
    yArrDown.push(
      -Math.sqrt(
        Math.abs(Math.pow(radius, 2) - Math.pow(xArrDown[i] - xAxis, 2))
      ) + yAxis
    )
  }
  const resDown = []
  for (let i = 0; i < xArrDown.length; i++) {
    resDown.push([xArrDown[i], yArrDown[i]])
  }
  // 返回整圆数组
  return resUp.concat(resDown)
}
