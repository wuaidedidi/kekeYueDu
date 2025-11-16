<template>
  <div class="lazy-image-container" :style="containerStyle">
    <!-- 加载中的占位符 -->
    <div v-if="!loaded && !error" class="image-placeholder" :style="placeholderStyle">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="image-error" :style="placeholderStyle">
      <div class="error-icon">⚠️</div>
      <div class="error-text">图片加载失败</div>
    </div>

    <!-- 实际图片 -->
    <img
      v-show="loaded"
      ref="imageRef"
      :src="currentSrc"
      :alt="alt"
      :style="imageStyle"
      :class="imageClass"
      @load="onLoad"
      @error="onError"
      loading="lazy"
      :decoding="decoding"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  src: string
  alt?: string
  width?: string | number
  height?: string | number
  placeholder?: string
  loadingText?: string
  aspectRatio?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  decoding?: 'sync' | 'async' | 'auto'
  class?: string
  quality?: number // 1-100
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  width: 'auto',
  height: 'auto',
  placeholder: '',
  loadingText: '加载中...',
  aspectRatio: '',
  objectFit: 'cover',
  decoding: 'async',
  class: '',
  quality: 85
})

const emit = defineEmits<{
  load: []
  error: []
  progress: [percent: number]
}>()

const loaded = ref(false)
const error = ref(false)
const imageRef = ref<HTMLImageElement>()

// 使用 Intersection Observer 进行懒加载
const observer = ref<IntersectionObserver | null>(null)

// 计算容器样式
const containerStyle = computed(() => {
  const styles: Record<string, any> = {}

  if (props.aspectRatio) {
    styles.aspectRatio = props.aspectRatio
  } else if (typeof props.width === 'number' && typeof props.height === 'number') {
    styles.aspectRatio = `${props.width}/${props.height}`
  }

  return styles
})

// 计算占位符样式
const placeholderStyle = computed(() => {
  const styles: Record<string, any> = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: props.placeholder || '#f5f5f5',
    borderRadius: '4px'
  }

  return styles
})

// 计算图片样式
const imageStyle = computed(() => {
  const styles: Record<string, any> = {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    height: typeof props.height === 'number' ? `${props.height}px` : props.height,
    objectFit: props.objectFit,
    borderRadius: '4px',
    transition: 'opacity 0.3s ease-in-out'
  }

  return styles
})

// 计算图片类名
const imageClass = computed(() => {
  return props.class
})

// 生成带质量的图片URL（如果支持）
const currentSrc = computed(() => {
  if (!props.src) return ''

  // 如果是本地图片，不支持质量参数
  if (props.src.startsWith('/') || props.src.startsWith('./')) {
    return props.src
  }

  // 这里可以添加CDN质量参数逻辑
  // 例如: `https://example.com/image.jpg?quality=${props.quality}`
  return props.src
})

const onLoad = () => {
  loaded.value = true
  emit('load')
}

const onError = () => {
  error.value = true
  emit('error')
}

// 设置 Intersection Observer
const setupObserver = () => {
  if (!imageRef.value || 'IntersectionObserver' in window === false) return

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 图片进入视口，开始加载
          if (imageRef.value) {
            imageRef.value.src = currentSrc.value
          }
          observer.value?.unobserve(entry.target)
        }
      })
    },
    {
      rootMargin: '50px 0px', // 提前50px开始加载
      threshold: 0.1
    }
  )

  if (imageRef.value) {
    observer.value.observe(imageRef.value)
  }
}

onMounted(() => {
  setupObserver()
})

onBeforeUnmount(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text,
.error-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.error-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.error-text {
  color: #f56c6c;
}

.image-placeholder,
.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 4px;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-text,
  .error-text {
    font-size: 11px;
  }

  .spinner {
    width: 20px;
    height: 20px;
  }
}
</style>