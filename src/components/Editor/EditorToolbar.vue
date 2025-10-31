<template>
  <div class="editor-toolbar">
    <div class="toolbar-group">
      <!-- 基础格式化 -->
      <el-button
        :icon="Icons.Bold"
        size="small"
        text
        @click="execCommand('bold')"
        title="加粗 (Ctrl+B)"
        class="toolbar-btn"
      />
      <el-button
        :icon="Icons.Italic"
        size="small"
        text
        @click="execCommand('italic')"
        title="斜体 (Ctrl+I)"
        class="toolbar-btn"
      />
      <el-button
        :icon="Icons.Underline"
        size="small"
        text
        @click="execCommand('underline')"
        title="下划线 (Ctrl+U)"
        class="toolbar-btn"
      />
      <el-button
        :icon="Icons.Strikethrough"
        size="small"
        text
        @click="execCommand('strike')"
        title="删除线"
        class="toolbar-btn"
      />
    </div>

    <div class="toolbar-divider" />

    <div class="toolbar-group">
      <!-- 标题 -->
      <el-select
        v-model="selectedHeading"
        size="small"
        @change="insertHeading"
        placeholder="标题"
        style="width: 80px"
        class="heading-select"
      >
        <el-option label="正文" value="p" />
        <el-option label="标题1" value="h1" />
        <el-option label="标题2" value="h2" />
        <el-option label="标题3" value="h3" />
        <el-option label="标题4" value="h4" />
        <el-option label="标题5" value="h5" />
        <el-option label="标题6" value="h6" />
      </el-select>

      <!-- 列表 -->
      <el-button
        :icon="Icons.List"
        size="small"
        text
        @click="execCommand('bullet')"
        title="无序列表"
        class="toolbar-btn"
      />
      <el-button
        :icon="Icons.Operation"
        size="small"
        text
        @click="execCommand('number')"
        title="有序列表"
        class="toolbar-btn"
      />

      <!-- 引用 -->
      <el-button
        :icon="Icons.Quote"
        size="small"
        text
        @click="execCommand('quote')"
        title="引用"
        class="toolbar-btn"
      />
    </div>

    <div class="toolbar-divider" />

    <div class="toolbar-group">
      <!-- 对齐 -->
      <el-button
        :icon="Icons.ArrowLeft"
        size="small"
        text
        @click="execCommand('justifyLeft')"
        title="左对齐"
        class="toolbar-btn"
      />
      <el-button
        :icon="Icons.More"
        size="small"
        text
        @click="execCommand('justifyCenter')"
        title="居中对齐"
        class="toolbar-btn"
      />
      <el-button
        :icon="Icons.ArrowRight"
        size="small"
        text
        @click="execCommand('justifyRight')"
        title="右对齐"
        class="toolbar-btn"
      />
    </div>

    <div class="toolbar-divider" />

    <div class="toolbar-group">
      <!-- 媒体 -->
      <el-button
        :icon="Icons.Picture"
        size="small"
        text
        @click="showImageDialog = true"
        title="插入图片"
        class="toolbar-btn image-btn"
      />
      <el-button
        :icon="Icons.Link"
        size="small"
        text
        @click="insertLink"
        title="插入链接"
        class="toolbar-btn"
      />
      <el-button
        :icon="Icons.VideoCamera"
        size="small"
        text
        @click="insertVideo"
        title="插入视频"
        class="toolbar-btn"
      />
    </div>

    <div class="toolbar-divider" />

    <div class="toolbar-group">
      <!-- 其他 -->
      <el-button
        :icon="Icons.Grid"
        size="small"
        text
        @click="insertTable"
        title="插入表格"
        class="toolbar-btn"
      />
      <el-button
        :icon="Icons.Code"
        size="small"
        text
        @click="execCommand('code')"
        title="行内代码"
        class="toolbar-btn"
      />
      <el-button
        :icon="Icons.DocumentCopy"
        size="small"
        text
        @click="execCommand('pre')"
        title="代码块"
        class="toolbar-btn"
      />
    </div>

    <!-- 图片插入对话框 -->
    <ImageInsert v-if="showImageDialog" @close="showImageDialog = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElButton, ElSelect, ElOption, ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import ImageInsert from './ImageInsert.vue'

const emit = defineEmits<{
  insertImage: [html: string]
}>()

// 状态
const selectedHeading = ref('p')
const showImageDialog = ref(false)

// 方法
const getTrixEditor = () => {
  const trixElement = document.querySelector('trix-editor') as any
  if (!trixElement) {
    console.warn('Trix editor element not found')
    return null
  }

  const editor = trixElement.editor
  if (!editor) {
    console.warn('Trix editor instance not found')
    return null
  }

  return editor
}

const execCommand = (command: string) => {
  const editor = getTrixEditor()
  if (!editor) {
    console.warn('Cannot execute command:', command, '- editor not available')
    return
  }

  try {
    console.log('Executing command:', command)
    switch (command) {
      case 'bold':
        editor.activateAttribute('bold')
        break
      case 'italic':
        editor.activateAttribute('italic')
        break
      case 'underline':
        editor.activateAttribute('underline')
        break
      case 'strike':
        editor.activateAttribute('strike')
        break
      case 'code':
        editor.activateAttribute('code')
        break
      case 'quote':
        editor.activateAttribute('quote')
        break
      case 'bullet':
        editor.deactivateAttributes()
        editor.activateAttribute('bullet')
        editor.insertLineBreak()
        break
      case 'number':
        editor.deactivateAttributes()
        editor.activateAttribute('number')
        editor.insertLineBreak()
        break
      case 'justifyLeft':
        editor.activateAttribute('justifyLeft')
        break
      case 'justifyCenter':
        editor.activateAttribute('justifyCenter')
        break
      case 'justifyRight':
        editor.activateAttribute('justifyRight')
        break
      case 'pre':
        editor.activateAttribute('code')
        editor.insertString('\n')
        break
      default:
        console.warn('Unknown command:', command)
        ElMessage.warning(`未知命令: ${command}`)
        return
    }
    console.log('Command executed successfully:', command)
  } catch (error) {
    console.error('Error executing command:', command, error)
    ElMessage.error(`执行命令失败: ${command}`)
  }
}

const insertHeading = (level: string) => {
  const editor = getTrixEditor()
  if (!editor) return

  try {
    // 清除当前属性
    editor.deactivateAttributes()

    // 插入标题
    const headingText = level === 'p' ? '正文' : `标题${level.slice(1)}`
    editor.insertString(headingText)

    // 应用标题属性
    if (level !== 'p') {
      editor.activateAttribute(`heading${level.slice(1)}`)
    }
  } catch (error) {
    console.error('Error inserting heading:', error)
    ElMessage.error('插入标题失败')
  }
}

const insertLink = async () => {
  const editor = getTrixEditor()
  if (!editor) return

  try {
    const { value: url } = await ElMessageBox.prompt('请输入链接地址', '插入链接')
    if (!url) return

    const selectedRange = editor.getSelectedRange()
    const selectedText = editor.getDocument().toString().substring(selectedRange[0], selectedRange[1])
    const linkText = selectedText || url

    editor.insertHTML(`<a href="${url}" target="_blank">${linkText}</a>`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error inserting link:', error)
      ElMessage.error('插入链接失败')
    }
  }
}

const insertVideo = async () => {
  const editor = getTrixEditor()
  if (!editor) return

  try {
    const { value: url } = await ElMessageBox.prompt('请输入视频地址', '插入视频')
    if (!url) return

    const videoHtml = `
      <div style="text-align: center; margin: 16px 0;">
        <video controls style="max-width: 100%; border-radius: 8px;">
          <source src="${url}" type="video/mp4">
          您的浏览器不支持视频播放。
        </video>
      </div>
    `
    editor.insertHTML(videoHtml)
    ElMessage.success('视频已插入')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error inserting video:', error)
      ElMessage.error('插入视频失败')
    }
  }
}

const insertTable = async () => {
  const editor = getTrixEditor()
  if (!editor) return

  try {
    const { value: rows } = await ElMessageBox.prompt('请输入行数', '插入表格', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: '3',
      inputValidator: (value) => {
        if (!value || isNaN(parseInt(value)) || parseInt(value) < 1) {
          return '请输入有效的行数（大于0的数字）'
        }
        return true
      }
    })
    if (!rows) return

    const { value: cols } = await ElMessageBox.prompt('请输入列数', '插入表格', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: '3',
      inputValidator: (value) => {
        if (!value || isNaN(parseInt(value)) || parseInt(value) < 1) {
          return '请输入有效的列数（大于0的数字）'
        }
        return true
      }
    })
    if (!cols) return

    let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">'

    // 表头
    tableHtml += '<thead><tr>'
    for (let i = 0; i < parseInt(cols); i++) {
      tableHtml += `<th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">列${i + 1}</th>`
    }
    tableHtml += '</tr></thead>'

    // 表体
    tableHtml += '<tbody>'
    for (let i = 0; i < parseInt(rows); i++) {
      tableHtml += '<tr>'
      for (let j = 0; j < parseInt(cols); j++) {
        tableHtml += `<td style="border: 1px solid #ddd; padding: 8px;">单元格</td>`
      }
      tableHtml += '</tr>'
    }
    tableHtml += '</tbody></table>'

    editor.insertHTML(tableHtml)
    ElMessage.success('表格已插入')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error inserting table:', error)
      ElMessage.error('插入表格失败')
    }
  }
}

// 监听图片插入事件
const handleInsertImage = (event: CustomEvent) => {
  emit('insertImage', event.detail.html)
}

// 生命周期
onMounted(() => {
  document.addEventListener('insertImage', handleInsertImage as EventListener)
})

onUnmounted(() => {
  document.removeEventListener('insertImage', handleInsertImage as EventListener)
})
</script>

<style lang="scss" scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: #e4e7ed;
    margin: 0 8px;
  }

  .toolbar-btn {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    transition: all 0.2s ease;
    border: 1px solid transparent;

    &:hover {
      background: #f5f7fa;
      border-color: #e4e7ed;
    }

    &:active {
      background: #e4e7ed;
      transform: translateY(1px);
    }

    &.is-active {
      background: #409eff;
      color: white;
      border-color: #409eff;
    }
  }

  .image-btn {
    color: #67c23a;

    &:hover {
      background: #f0f9ff;
      border-color: #67c23a;
    }
  }

  .heading-select {
    :deep(.el-input__wrapper) {
      border-radius: 4px;
      box-shadow: none;
      border: 1px solid #e4e7ed;

      &:hover {
        border-color: #409eff;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 6px 8px;
    gap: 2px;

    .toolbar-group {
      gap: 1px;
    }

    .toolbar-btn {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }

    .toolbar-divider {
      margin: 0 4px;
      height: 20px;
    }

    .heading-select {
      width: 70px;
    }
  }
}

@media (max-width: 480px) {
  .editor-toolbar {
    .toolbar-group {
      &:nth-child(n+4) {
        display: none; // 在小屏幕上隐藏一些不常用的工具
      }
    }
  }
}

// 图片样式类（用于插入的图片）
:global(.img-original) {
  max-width: 100%;
  height: auto;
}

:global(.img-large) {
  width: 100%;
  max-width: 800px;
  height: auto;
}

:global(.img-medium) {
  width: 100%;
  max-width: 600px;
  height: auto;
}

:global(.img-small) {
  width: 100%;
  max-width: 400px;
  height: auto;
}

:global(.img-left) {
  float: left;
  margin: 0 16px 8px 0;
}

:global(.img-right) {
  float: right;
  margin: 0 0 8px 16px;
}

:global(.img-center) {
  display: block;
  margin: 16px auto;
  text-align: center;
}
</style>