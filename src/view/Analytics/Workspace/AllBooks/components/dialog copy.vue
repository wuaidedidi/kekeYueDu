<template>
  <el-dialog
    :model-value="visible"
    title="草稿信息"
    align-center
    width="500"
    @closed="
      () => {
        emit('update:visible', false) // 通知父组件更新 visible 的值为 false

        // if (reset) {

        Object.assign(form, currentForm)
        // }
      }
    "
  >
    <template #header>
      <div style="text-align: left; font-weight: bolder">title</div>
    </template>
    <el-form :model="form">
      <div class="draftInfoSet">
        <el-image :src="form.src" class="draftEditImage" />
        <div class="draftInfoSetInput">
          <el-form-item label="草稿名称" label-width="80px">
            <el-input
              v-model="form.bookName"
              autocomplete="off"
              placeholder="请输入"
              show-word-limit
              maxlength="20"
            />
          </el-form-item>
        </div>
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button
          type="primary"
          @click="
            () => {
              emit('update:visible', false) // 通知父组件更新 visible 的值为 false
              emit('confirm', form)
              reset = false
            }
          "
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElButton, ElImage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { reactive, watch } from 'vue'
import type { Book } from '@/typings/book'

// 接收父组件传来的 props
const { visible, title, formData, formIndex, currentForm } = defineProps<{
  currentForm: Book
  formIndex: number
  visible: boolean
  title?: string // title 是可选的
  formData: Book[]
}>()

const oldForm = { ...formData[0] }
const reset = ref(true)
const form = reactive<Book>({
  ...formData[formIndex],
})

// 定义 emits，用于通知父组件
const emit = defineEmits(['update:visible', 'confirm'])

let firstOpen = true

// 当 props 的 formData 发生变化时，更新本地 form 数据
watch(
  () => formData,
  (newVal) => {
    Object.assign(form, newVal)
  }
)

watch(
  () => formIndex,
  (newIndex) => {
    if (firstOpen) {
      Object.assign(currentForm, form)
      firstOpen = false
    }

    Object.assign(form, formData[newIndex])
  }
)

// 关闭对话框时，通知父组件
const handleClose = () => {
  emit('update:visible', false)
}

// 点击确认时，提交表单并关闭对话框
const handleConfirm = () => {
  emit('confirm', form)
  emit('update:visible', false)
}
</script>
<style lang="scss" scoped>
.draftInfoSet {
  display: flex;
  height: 200px;
  .draftInfoSetInput {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }
  .draftEditImage {
    width: 150px;
    border-radius: 5px;
  }
}
</style>
