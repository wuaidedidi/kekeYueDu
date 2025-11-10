<template>
  <div class="image-insert-component">
    <!-- 图片插入按钮 -->
    <el-button
      ref="insertButton"
      type="primary"
      :icon="Picture"
      size="small"
      circle
      @click="toggleImagePanel"
      title="插入图片"
      class="image-insert-btn"
    />

    <!-- 图片插入面板 -->
    <div
      v-if="showImagePanel"
      ref="imagePanel"
      class="image-insert-panel"
      :style="panelPosition"
    >
      <div class="panel-header">
        <span class="panel-title">插入图片</span>
        <el-button
          :icon="Close"
          size="small"
          text
          @click="showImagePanel = false"
          class="close-btn"
        />
      </div>

      <div class="panel-content">
        <!-- 标签页 -->
        <el-tabs v-model="activeTab" size="small">
          <!-- 本地上传 -->
          <el-tab-pane label="本地上传" name="upload">
            <div class="upload-section">
              <el-upload
                ref="uploadRef"
                :action="uploadUrl"
                :headers="uploadHeaders"
                :before-upload="beforeUpload"
                :on-success="onUploadSuccess"
                :on-error="onUploadError"
                :on-progress="onUploadProgress"
                :show-file-list="false"
                :accept="imageTypes"
                :auto-upload="true"
                drag
                class="image-uploader"
              >
                <div class="upload-area">
                  <el-icon class="upload-icon" :size="48"><UploadFilled /></el-icon>
                  <div class="upload-text">
                    <p>点击或拖拽图片到此处上传</p>
                    <p class="upload-hint">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</p>
                  </div>
                </div>
              </el-upload>

              <!-- 上传进度 -->
              <div v-if="uploading" class="upload-progress">
                <el-progress :percentage="uploadProgress" :stroke-width="6" />
                <p class="progress-text">正在上传... {{ uploadProgress }}%</p>
              </div>

              <!-- 预览区域 -->
              <div v-if="previewImage" class="preview-section">
                <div class="preview-title">图片预览</div>
                <div class="preview-image-container">
                  <img :src="previewImage.url" :alt="previewImage.name" class="preview-image" />
                  <div class="preview-info">
                    <p><strong>{{ previewImage.name }}</strong></p>
                    <p>{{ formatFileSize(previewImage.size) }}</p>
                    <p>{{ previewImage.dimensions }}</p>
                  </div>
                </div>

                <!-- 图片设置 -->
                <div class="image-settings">
                  <el-form label-width="80px" size="small">
                    <el-form-item label="替代文本">
                      <el-input
                        v-model="imageSettings.alt"
                        placeholder="图片描述（用于无障碍访问）"
                        maxlength="200"
                        show-word-limit
                      />
                    </el-form-item>
                    <el-form-item label="标题">
                      <el-input
                        v-model="imageSettings.title"
                        placeholder="鼠标悬停时显示的文本"
                        maxlength="100"
                        show-word-limit
                      />
                    </el-form-item>
                    <el-form-item label="对齐方式">
                      <el-radio-group v-model="imageSettings.align">
                        <el-radio-button label="left">左对齐</el-radio-button>
                        <el-radio-button label="center">居中</el-radio-button>
                        <el-radio-button label="right">右对齐</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="尺寸">
                      <el-radio-group v-model="imageSettings.size">
                        <el-radio-button label="original">原始</el-radio-button>
                        <el-radio-button label="large">大</el-radio-button>
                        <el-radio-button label="medium">中</el-radio-button>
                        <el-radio-button label="small">小</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                  </el-form>
                </div>

                <!-- 插入按钮 -->
                <div class="insert-actions">
                  <el-button @click="showImagePanel = false">取消</el-button>
                  <el-button type="primary" @click="insertImageToEditor" :disabled="!previewImage">
                    插入图片
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 网络图片 -->
          <el-tab-pane label="网络图片" name="url">
            <div class="url-section">
              <el-form label-width="80px" size="small">
                <el-form-item label="图片URL">
                  <el-input
                    v-model="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    @blur="validateImageUrl"
                  />
                </el-form-item>
                <el-form-item label="替代文本">
                  <el-input
                    v-model="urlImageSettings.alt"
                    placeholder="图片描述"
                  />
                </el-form-item>
                <el-form-item label="标题">
                  <el-input
                    v-model="urlImageSettings.title"
                    placeholder="鼠标悬停文本"
                  />
                </el-form-item>
              </el-form>

              <!-- URL图片预览 -->
              <div v-if="urlImagePreview" class="url-preview">
                <img :src="urlImagePreview" alt="预览" class="url-preview-image" />
              </div>

              <div class="insert-actions">
                <el-button @click="clearUrlImage">清除</el-button>
                <el-button type="primary" @click="insertUrlImageToEditor" :disabled="!validUrl">
                  插入图片
                </el-button>
              </div>
            </div>
          </el-tab-pane>

          <!-- 图片库 -->
          <el-tab-pane label="图片库" name="library">
            <div class="library-section">
              <ImageLibrary />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElButton, ElIcon, ElUpload, ElProgress, ElForm, ElFormItem, ElInput, ElRadioGroup, ElRadioButton, ElTabs, ElTabPane } from 'element-plus'
import { Picture, Close, UploadFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/userStore'
import http, { buildApiUrl, buildServerUrl } from '@/utils/http'
import ImageLibrary from './ImageLibrary.vue'

const userStore = useUserStore()

// 组件状态
const insertButton = ref()
const imagePanel = ref()
const uploadRef = ref()
const showImagePanel = ref(false)
const activeTab = ref('upload')
const uploading = ref(false)
const uploadProgress = ref(0)
const panelPosition = ref({ top: '40px', left: '0px' })

// 上传相关
const uploadUrl = computed(() => buildApiUrl('/upload'))
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${userStore.token}`
}))
const imageTypes = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'

// 预览图片
const previewImage = ref<{
  url: string
  name: string
  size: number
  dimensions: string
  serverUrl?: string
} | null>(null)

// 图片设置
const imageSettings = reactive({
  alt: '',
  title: '',
  align: 'center',
  size: 'original'
})

// URL图片相关
const imageUrl = ref('')
const urlImagePreview = ref('')
const validUrl = ref(false)
const urlImageSettings = reactive({
  alt: '',
  title: ''
})

// 方法
const toggleImagePanel = () => {
  showImagePanel.value = !showImagePanel.value
  if (showImagePanel.value) {
    nextTick(() => {
      updatePanelPosition()
    })
  }
}

const updatePanelPosition = () => {
  if (!insertButton.value || !imagePanel.value) return

  const buttonRect = insertButton.value.$el.getBoundingClientRect()
  const panelWidth = 400 // 面板宽度

  let left = buttonRect.left
  let top = buttonRect.bottom + 8

  // 确保面板不超出视窗
  if (left + panelWidth > window.innerWidth) {
    left = window.innerWidth - panelWidth - 16
  }
  if (left < 16) {
    left = 16
  }
  if (top + 600 > window.innerHeight) {
    top = buttonRect.top - 608 // 面板高度 + 8px间距
  }

  panelPosition.value = {
    top: `${top}px`,
    left: `${left}px`
  }
}

const beforeUpload = (file: File) => {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  // 检查文件大小（10MB）
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }

  uploading.value = true
  uploadProgress.value = 0

  // 创建本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      previewImage.value = {
        url: e.target?.result as string,
        name: file.name,
        size: file.size,
        dimensions: `${img.width} × ${img.height}`
      }
      // 默认使用文件名作为alt文本
      imageSettings.alt = file.name.split('.')[0]
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)

  return true
}

const onUploadProgress = (event: any) => {
  uploadProgress.value = Math.round((event.loaded * 100) / event.total)
}

const onUploadSuccess = (response: any) => {
  uploading.value = false
  uploadProgress.value = 100

  if (response.success) {
    // 保持本地预览URL，但存储服务器URL用于后续插入
    if (previewImage.value) {
      // 检查response.data.url是否已经是完整URL
      if (response.data.url.startsWith('http')) {
        previewImage.value.serverUrl = response.data.url
      } else {
        previewImage.value.serverUrl = buildServerUrl(response.data.url)
      }
    }
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
    // 上传失败时仍然保持本地预览，用户可以直接插入本地图片
  }
}

const onUploadError = (error: any) => {
  uploading.value = false
  console.error('Upload error:', error)
  ElMessage.error('上传失败，您可以直接插入本地图片')
  // 不重置预览，让用户可以直接插入本地图片
}

const resetUpload = () => {
  uploading.value = false
  uploadProgress.value = 0
  previewImage.value = null
  Object.assign(imageSettings, {
    alt: '',
    title: '',
    align: 'center',
    size: 'original'
  })
}

const validateImageUrl = async () => {
  if (!imageUrl.value) {
    urlImagePreview.value = ''
    validUrl.value = false
    return
  }

  try {
    // 简单的URL格式验证
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i
    if (!urlPattern.test(imageUrl.value)) {
      validUrl.value = false
      urlImagePreview.value = ''
      return
    }

    // 创建图片对象测试URL是否有效
    const img = new Image()
    img.onload = () => {
      urlImagePreview.value = imageUrl.value
      validUrl.value = true
    }
    img.onerror = () => {
      urlImagePreview.value = ''
      validUrl.value = false
      ElMessage.error('无法加载该图片，请检查URL是否正确')
    }
    img.src = imageUrl.value
  } catch (error) {
    validUrl.value = false
    urlImagePreview.value = ''
  }
}

const clearUrlImage = () => {
  imageUrl.value = ''
  urlImagePreview.value = ''
  validUrl.value = false
  Object.assign(urlImageSettings, {
    alt: '',
    title: ''
  })
}

const insertImageToEditor = () => {
  if (!previewImage.value) return

  // 优先使用服务器URL，如果没有则使用本地预览URL
  const imageSrc = previewImage.value.serverUrl || previewImage.value.url

  const imageHtml = createImageHtml({
    src: imageSrc,
    alt: imageSettings.alt || previewImage.value.name,
    title: imageSettings.title,
    align: imageSettings.align,
    size: imageSettings.size
  })

  // 发送自定义事件到父组件
  const event = new CustomEvent('insertImage', {
    detail: { html: imageHtml }
  })
  document.dispatchEvent(event)

  // 重置状态
  showImagePanel.value = false
  resetUpload()
  ElMessage.success('图片已插入')
}

const insertUrlImageToEditor = () => {
  if (!validUrl.value || !urlImagePreview.value) return

  const imageHtml = createImageHtml({
    src: urlImagePreview.value,
    alt: urlImageSettings.alt || '网络图片',
    title: urlImageSettings.title,
    align: 'center',
    size: 'medium'
  })

  // 发送自定义事件到父组件
  const event = new CustomEvent('insertImage', {
    detail: { html: imageHtml }
  })
  document.dispatchEvent(event)

  // 重置状态
  showImagePanel.value = false
  clearUrlImage()
  ElMessage.success('图片已插入')
}

const createImageHtml = (options: {
  src: string
  alt: string
  title?: string
  align: string
  size: string
}) => {
  const { src, alt, title, align, size } = options

  // 根据尺寸设置样式
  let sizeClass = ''
  let sizeStyle = ''
  switch (size) {
    case 'large':
      sizeClass = 'img-large'
      break
    case 'medium':
      sizeClass = 'img-medium'
      break
    case 'small':
      sizeClass = 'img-small'
      break
    default:
      sizeClass = 'img-original'
  }

  // 根据对齐方式设置样式
  let alignClass = ''
  switch (align) {
    case 'left':
      alignClass = 'img-left'
      break
    case 'right':
      alignClass = 'img-right'
      break
    default:
      alignClass = 'img-center'
  }

  const titleAttr = title ? ` title="${title}"` : ''
  const classAttr = `class="${sizeClass} ${alignClass}"`

  return `<img src="${src}" alt="${alt}"${titleAttr} ${classAttr} />`
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 点击外部关闭面板
const handleClickOutside = (event: MouseEvent) => {
  if (!showImagePanel.value) return

  const target = event.target as Node
  if (insertButton.value?.$el?.contains(target) || imagePanel.value?.contains(target)) {
    return
  }

  showImagePanel.value = false
}

// 监听滚动事件更新面板位置
const handleScroll = () => {
  if (showImagePanel.value) {
    updatePanelPosition()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})
</script>

<style lang="scss" scoped>
.image-insert-component {
  position: relative;
  display: inline-block;
}

.image-insert-btn {
  position: relative;
  z-index: 100;
}

.image-insert-panel {
  position: fixed;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  width: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;

  .panel-title {
    font-weight: 600;
    font-size: 14px;
    color: #333;
  }

  .close-btn {
    padding: 4px;
    min-height: auto;
  }
}

.panel-content {
  padding: 16px;
}

.upload-section {
  .image-uploader {
    :deep(.el-upload-dragger) {
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      background: #fafafa;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409eff;
        background: #f0f9ff;
      }
    }
  }

  .upload-area {
    padding: 20px;
    text-align: center;
    color: #666;

    .upload-icon {
      color: #c0c4cc;
      margin-bottom: 12px;
    }

    .upload-text p {
      margin: 8px 0;
      font-size: 14px;
    }

    .upload-hint {
      font-size: 12px;
      color: #999;
    }
  }

  .upload-progress {
    margin-top: 16px;
    text-align: center;

    .progress-text {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
    }
  }

  .preview-section {
    margin-top: 16px;
    border-top: 1px solid #e4e7ed;
    padding-top: 16px;

    .preview-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 12px;
      color: #333;
    }

    .preview-image-container {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;

      .preview-image {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid #e4e7ed;
      }

      .preview-info {
        flex: 1;
        font-size: 12px;
        color: #666;

        p {
          margin: 4px 0;
        }
      }
    }

    .image-settings {
      margin-bottom: 16px;

      :deep(.el-form-item) {
        margin-bottom: 12px;
      }
    }

    .insert-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #e4e7ed;
    }
  }
}

.url-section {
  .url-preview {
    margin: 16px 0;
    text-align: center;

    .url-preview-image {
      max-width: 100%;
      max-height: 200px;
      border-radius: 4px;
      border: 1px solid #e4e7ed;
    }
  }

  .insert-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e4e7ed;
  }
}

.library-section {
  height: 500px;
  overflow: hidden;
}

// 响应式设计
@media (max-width: 768px) {
  .image-insert-panel {
    width: 320px;
    max-height: 80vh;
  }

  .preview-image-container {
    flex-direction: column;
    text-align: center;
  }
}
</style>