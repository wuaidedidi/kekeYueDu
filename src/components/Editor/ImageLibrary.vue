<template>
  <div class="image-library">
    <div class="library-header">
      <span class="library-title">图片库</span>
      <el-button
        :icon="Refresh"
        size="small"
        text
        @click="loadImages"
        :loading="loading"
        title="刷新"
      />
    </div>

    <div class="library-content">
      <!-- 搜索框 -->
      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="搜索图片..."
          :prefix-icon="Search"
          size="small"
          clearable
          @input="filterImages"
        />
      </div>

      <!-- 图片分类 -->
      <div class="category-section">
        <el-radio-group v-model="selectedCategory" size="small" @change="filterImages">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="recent">最近</el-radio-button>
          <el-radio-button label="favorite">收藏</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 图片网格 -->
      <div class="image-grid" v-if="filteredImages.length > 0">
        <div
          v-for="image in filteredImages"
          :key="image.id"
          class="image-item"
          :class="{ selected: selectedImage?.id === image.id }"
          @click="selectImage(image)"
        >
          <div class="image-wrapper">
            <img :src="image.url" :alt="image.name" class="library-image" />
            <div class="image-overlay">
              <el-button
                :icon="View"
                size="small"
                circle
                text
                @click.stop="showImagePreview(image)"
                title="预览"
              />
              <el-button
                :icon="Delete"
                size="small"
                circle
                text
                @click.stop="deleteImage(image)"
                title="删除"
                class="delete-btn"
              />
            </div>
          </div>
          <div class="image-info">
            <p class="image-name" :title="image.name">{{ image.name }}</p>
            <p class="image-meta">{{ formatDate(image.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-state">
        <el-icon :size="48" class="empty-icon"><Picture /></el-icon>
        <p class="empty-text">暂无图片</p>
        <p class="empty-hint">上传图片后，它们会显示在这里</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="library-footer" v-if="selectedImage">
      <div class="selected-info">
        <span>已选择: {{ selectedImage.name }}</span>
      </div>
      <div class="footer-actions">
        <el-button @click="cancelSelection">取消</el-button>
        <el-button type="primary" @click="insertSelectedImage" :disabled="!selectedImage">
          插入图片
        </el-button>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="showPreview"
      title="图片预览"
      width="80%"
      :before-close="closePreview"
    >
      <div class="preview-dialog">
        <img :src="previewImage?.url" :alt="previewImage?.name" class="preview-image" />
        <div class="preview-details">
          <h3>{{ previewImage?.name }}</h3>
          <p><strong>尺寸:</strong> {{ previewImage?.dimensions || '未知' }}</p>
          <p><strong>大小:</strong> {{ formatFileSize(previewImage?.size || 0) }}</p>
          <p><strong>上传时间:</strong> {{ formatDate(previewImage?.createdAt) }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElButton, ElIcon, ElInput, ElRadioGroup, ElRadioButton, ElDialog, ElSkeleton } from 'element-plus'
import { Search, Refresh, View, Delete, Picture } from '@element-plus/icons-vue'

interface ImageItem {
  id: string
  name: string
  url: string
  size: number
  dimensions?: string
  createdAt: Date
  category: string
}

// 状态
const loading = ref(false)
const images = ref<ImageItem[]>([])
const selectedImage = ref<ImageItem | null>(null)
const previewImage = ref<ImageItem | null>(null)
const searchQuery = ref('')
const selectedCategory = ref('all')
const showPreview = ref(false)

// 过滤后的图片列表
const filteredImages = computed(() => {
  let filtered = images.value

  // 按分类过滤
  if (selectedCategory.value === 'recent') {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    filtered = filtered.filter(img => new Date(img.createdAt) >= threeDaysAgo)
  } else if (selectedCategory.value === 'favorite') {
    // 这里可以根据实际情况实现收藏逻辑
    filtered = filtered.filter(img => img.category === 'favorite')
  }

  // 按搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(img =>
      img.name.toLowerCase().includes(query) ||
      img.category.toLowerCase().includes(query)
    )
  }

  return filtered
})

// 方法
const loadImages = async () => {
  loading.value = true
  try {
    // 模拟从API加载图片列表
    // 实际项目中这里应该调用真实的API
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟数据
    images.value = [
      {
        id: '1',
        name: '示例图片1.jpg',
        url: 'https://picsum.photos/300/200?random=1',
        size: 102400,
        dimensions: '300 × 200',
        createdAt: new Date('2024-01-15'),
        category: 'general'
      },
      {
        id: '2',
        name: '示例图片2.png',
        url: 'https://picsum.photos/400/300?random=2',
        size: 204800,
        dimensions: '400 × 300',
        createdAt: new Date('2024-01-14'),
        category: 'favorite'
      },
      {
        id: '3',
        name: '封面图.jpg',
        url: 'https://picsum.photos/600/400?random=3',
        size: 307200,
        dimensions: '600 × 400',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
        category: 'general'
      }
    ]
  } catch (error) {
    console.error('Failed to load images:', error)
    ElMessage.error('加载图片失败')
  } finally {
    loading.value = false
  }
}

const filterImages = () => {
  // 过滤逻辑已在计算属性中处理
}

const selectImage = (image: ImageItem) => {
  selectedImage.value = image
}

const cancelSelection = () => {
  selectedImage.value = null
}

const insertSelectedImage = () => {
  if (!selectedImage.value) return

  const imageHtml = createImageHtml({
    src: selectedImage.value.url,
    alt: selectedImage.value.name,
    title: selectedImage.value.name,
    align: 'center',
    size: 'medium'
  })

  // 发送自定义事件到父组件
  const event = new CustomEvent('insertImage', {
    detail: { html: imageHtml }
  })
  document.dispatchEvent(event)

  // 重置状态
  selectedImage.value = null
  ElMessage.success('图片已插入')
}

const showImagePreview = (image: ImageItem) => {
  previewImage.value = image
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
  previewImage.value = null
}

const deleteImage = async (image: ImageItem) => {
  try {
    await ElMessage.confirm('确定要删除这张图片吗？', '确认删除', {
      type: 'warning'
    })

    // 调用删除API
    // 实际项目中这里应该调用真实的删除接口
    images.value = images.value.filter(img => img.id !== image.id)

    if (selectedImage.value?.id === image.id) {
      selectedImage.value = null
    }

    ElMessage.success('图片已删除')
  } catch (error) {
    // 用户取消删除
  }
}

const createImageHtml = (options: {
  src: string
  alt: string
  title?: string
  align: string
  size: string
}) => {
  const { src, alt, title, align, size } = options

  let sizeClass = ''
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

const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生命周期
onMounted(() => {
  loadImages()
})
</script>

<style lang="scss" scoped>
.image-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;

  .library-title {
    font-weight: 600;
    font-size: 14px;
    color: #333;
  }
}

.library-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.search-section {
  margin-bottom: 16px;
}

.category-section {
  margin-bottom: 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .image-overlay {
      opacity: 1;
    }
  }

  &.selected {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

.image-wrapper {
  position: relative;
  padding-bottom: 75%;
  overflow: hidden;
}

.library-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;

  .image-item:hover & {
    transform: scale(1.05);
  }
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;

  .el-button {
    background: rgba(255, 255, 255, 0.9);
    color: #333;

    &:hover {
      background: white;
    }

    &.delete-btn {
      background: rgba(245, 108, 108, 0.9);
      color: white;

      &:hover {
        background: #f56c6c;
      }
    }
  }
}

.image-info {
  padding: 8px;
}

.image-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-meta {
  font-size: 10px;
  color: #999;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #999;

  .empty-icon {
    color: #dcdfe6;
    margin-bottom: 16px;
  }

  .empty-text {
    font-size: 14px;
    margin: 0 0 8px 0;
    color: #666;
  }

  .empty-hint {
    font-size: 12px;
    margin: 0;
    color: #999;
  }
}

.loading-state {
  padding: 16px;
}

.library-footer {
  border-top: 1px solid #e4e7ed;
  padding: 12px 16px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-info {
  font-size: 12px;
  color: #666;
  flex: 1;
  min-width: 0;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
}

.footer-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.preview-dialog {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.preview-image {
  max-width: 60%;
  max-height: 60vh;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.preview-details {
  flex: 1;

  h3 {
    margin: 0 0 16px 0;
    color: #333;
  }

  p {
    margin: 8px 0;
    color: #666;
    font-size: 14px;

    strong {
      color: #333;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }

  .preview-dialog {
    flex-direction: column;
  }

  .preview-image {
    max-width: 100%;
  }
}
</style>