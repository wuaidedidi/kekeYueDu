import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义 Store
export const useMenuStore = defineStore('menuStore', () => {
  // 创建一个响应式变量
  const selectedMenu = ref<number | null>(null)

  // 定义一个方法，用于修改 selectedMenu 的值
  const setSelectedMenu = (index: number) => {
    selectedMenu.value = index
  }

  return {
    selectedMenu,
    setSelectedMenu,
  }
})
