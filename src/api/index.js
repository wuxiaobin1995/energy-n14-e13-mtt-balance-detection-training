/*
 * @Author      : Mr.bin
 * @Date        : 2023-06-19 21:46:11
 * @LastEditTime: 2023-06-19 21:46:22
 * @Description : 封装axios
 */
import axios from 'axios'

const instance = axios.create({
  baseURL: '', // 局域网
  timeout: 8000
})

export { instance }
