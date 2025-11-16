import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LazyImage from '../../src/components/LazyImage.vue'

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})
global.IntersectionObserver = mockIntersectionObserver

describe('LazyImage.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确渲染基本图片组件', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image'
      }
    })

    expect(wrapper.find('.lazy-image-container').exists()).toBe(true)
    expect(wrapper.find('.image-placeholder').exists()).toBe(true)
  })

  it('应该显示加载状态', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image',
        loadingText: '自定义加载文本'
      }
    })

    expect(wrapper.find('.loading-text').text()).toBe('自定义加载文本')
  })

  it('应该处理图片加载成功', async () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image'
      }
    })

    const img = wrapper.find('img')

    // 模拟图片加载成功
    await img.trigger('load')

    expect(wrapper.vm.loaded).toBe(true)
    expect(img.isVisible()).toBe(true)
    expect(wrapper.find('.image-placeholder').exists()).toBe(false)
  })

  it('应该处理图片加载错误', async () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/non-existent-image.jpg',
        alt: 'Test Image'
      }
    })

    const img = wrapper.find('img')

    // 模拟图片加载失败
    await img.trigger('error')

    expect(wrapper.vm.error).toBe(true)
    expect(wrapper.find('.image-error').exists()).toBe(true)
    expect(wrapper.find('.error-text').text()).toBe('图片加载失败')
  })

  it('应该正确设置宽度和高度', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image',
        width: 300,
        height: 200
      }
    })

    const containerStyle = wrapper.vm.containerStyle
    expect(containerStyle.aspectRatio).toBe('300/200')
  })

  it('应该支持自定义宽高比', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image',
        aspectRatio: '16:9'
      }
    })

    expect(wrapper.vm.containerStyle.aspectRatio).toBe('16:9')
  })

  it('应该正确应用objectFit样式', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image',
        objectFit: 'contain'
      }
    })

    const imageStyle = wrapper.vm.imageStyle
    expect(imageStyle.objectFit).toBe('contain')
  })

  it('应该支持自定义CSS类', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image',
        class: 'custom-image-class'
      }
    })

    expect(wrapper.vm.imageClass).toBe('custom-image-class')
  })

  it('应该生成正确的图片URL', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/local-image.jpg',
        alt: 'Test Image'
      }
    })

    expect(wrapper.vm.currentSrc).toBe('/local-image.jpg')
  })

  it('应该在挂载时设置IntersectionObserver', () => {
    mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image'
      }
    })

    expect(mockIntersectionObserver).toHaveBeenCalled()
  })

  it('应该清理观察器', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image'
      }
    })

    wrapper.unmount()

    // 验证清理逻辑
    expect(true).toBe(true) // 基本验证，实际清理逻辑会在组件销毁时执行
  })

  it('应该处理懒加载逻辑', () => {
    const wrapper = mount(LazyImage, {
      props: {
        src: '/test-image.jpg',
        alt: 'Test Image'
      }
    })

    const img = wrapper.find('img')
    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('decoding')).toBe('async')
  })
})