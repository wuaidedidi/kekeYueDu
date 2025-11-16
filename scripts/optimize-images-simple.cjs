const fs = require('fs')
const path = require('path')
const { Jimp } = require('jimp')

/**
 * 基于 Jimp 的图片优化工具
 * 支持 PNG、JPEG 格式的压缩和 WebP 转换
 */

class SimpleImageOptimizer {
  constructor(options = {}) {
    this.options = {
      quality: options.quality || 80,
      supportedFormats: ['.jpg', '.jpeg', '.png'],
      outputFormat: options.outputFormat || 'webp',
      keepOriginal: options.keepOriginal || true,
      ...options
    }
  }

  /**
   * 格式化文件大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 优化单张图片
   */
  async optimizeImage(inputPath, outputPath) {
    try {
      const image = await Jimp.read(inputPath)
      const ext = path.extname(inputPath).toLowerCase()

      let finalPath = outputPath

      // 根据输出格式进行优化
      if (this.options.outputFormat === 'webp') {
        finalPath = outputPath.replace(/\.[^/.]+$/, '.webp')
        // 对于 WebP 转换，需要先转换为合适的格式
        await image.raster()
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        await image.quality(this.options.quality)
      } else if (ext === '.png') {
        // PNG 优化：减少颜色深度并使用压缩
        await image.deflateLevel(9)
      }

      await image.writeAsync(finalPath)

      // 获取优化后的文件大小
      const stats = fs.statSync(finalPath)
      return stats.size
    } catch (error) {
      console.error(`❌ 优化失败: ${inputPath}`, error.message)
      return false
    }
  }

  /**
   * 批量优化目录中的图片
   */
  async optimizeDirectory(dir, options = {}) {
    const {
      recursive = true,
      extensions = this.options.supportedFormats,
      onProgress = () => {},
      onComplete = () => {}
    } = options

    let totalFiles = 0
    let optimizedFiles = 0
    let totalSizeSaved = 0

    const processDirectory = (currentDir) => {
      const files = fs.readdirSync(currentDir)

      for (const file of files) {
        const fullPath = path.join(currentDir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory() && recursive) {
          processDirectory(fullPath)
        } else if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase()
          if (extensions.includes(ext)) {
            totalFiles++

            const originalSize = stat.size
            const outputPath = this.generateOutputPath(fullPath)

            // 确保输出目录存在
            const outputDir = path.dirname(outputPath)
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true })
            }

            // 异步优化图片
            this.optimizeImage(fullPath, outputPath).then(optimizedSize => {
              if (optimizedSize) {
                optimizedFiles++
                const sizeSaved = originalSize - optimizedSize
                totalSizeSaved += sizeSaved

                onProgress({
                  file: fullPath,
                  originalSize,
                  optimizedSize,
                  sizeSaved,
                  percentage: ((sizeSaved / originalSize) * 100).toFixed(1)
                })
              }
            }).catch(error => {
              console.error(`处理文件失败: ${fullPath}`, error)
            })
          }
        }
      }
    }

    processDirectory(dir)

    // 延迟返回结果，等待异步处理完成
    setTimeout(() => {
      onComplete({
        totalFiles,
        optimizedFiles,
        totalSizeSaved,
        averageSaving: optimizedFiles > 0 ? totalSizeSaved / optimizedFiles : 0
      })
    }, totalFiles * 100) // 估算处理时间
  }

  /**
   * 生成输出文件路径
   */
  generateOutputPath(inputPath) {
    const parsedPath = path.parse(inputPath)

    if (this.options.outputFormat === 'webp') {
      return path.join(parsedPath.dir, `${parsedPath.name}_optimized.webp`)
    }

    return path.join(parsedPath.dir, `${parsedPath.name}_optimized${parsedPath.ext}`)
  }

  /**
   * 快速优化大文件
   */
  async quickOptimizeLargeFiles(directory, minSize = 500 * 1024) {
    console.log('🚀 开始快速优化大文件...')

    const files = this.findImageFiles(directory)
    const largeFiles = files.filter(file => {
      const stat = fs.statSync(file)
      return stat.size >= minSize
    })

    console.log(`📊 找到 ${largeFiles.length} 个大文件需要优化`)

    let totalSaved = 0
    for (const filePath of largeFiles) {
      const originalSize = fs.statSync(filePath).size
      const outputPath = this.generateOutputPath(filePath)

      console.log(`🔄 正在优化: ${path.basename(filePath)}`)

      try {
        const optimizedSize = await this.optimizeImage(filePath, outputPath)
        if (optimizedSize) {
          const saved = originalSize - optimizedSize
          totalSaved += saved
          console.log(`✅ ${path.basename(filePath)} - ${this.formatBytes(originalSize)} → ${this.formatBytes(optimizedSize)} (节省 ${((saved/originalSize)*100).toFixed(1)}%)`)
        }
      } catch (error) {
        console.error(`❌ 优化失败: ${filePath}`, error.message)
      }
    }

    console.log(`\n🎉 优化完成! 总共节省空间: ${this.formatBytes(totalSaved)}`)
    return totalSaved
  }

  /**
   * 查找所有图片文件
   */
  findImageFiles(directory) {
    const files = []
    const self = this // 保存 this 引用

    function scanDir(dir) {
      const items = fs.readdirSync(dir)

      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          scanDir(fullPath)
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase()
          if (self.options.supportedFormats.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    }

    scanDir(directory)
    return files
  }
}

// CLI 接口
if (require.main === module) {
  const command = process.argv[2]
  const targetDir = process.argv[3] || 'public'

  const optimizer = new SimpleImageOptimizer({
    quality: 80,
    outputFormat: 'webp',
    keepOriginal: true
  })

  switch (command) {
    case 'analyze':
      console.log('📊 分析图片使用情况...')
      const files = optimizer.findImageFiles(targetDir)
      let totalSize = 0
      const largeFiles = []

      for (const file of files) {
        const stat = fs.statSync(file)
        totalSize += stat.size
        if (stat.size > 500 * 1024) {
          largeFiles.push({ path: file, size: stat.size, formattedSize: optimizer.formatBytes(stat.size) })
        }
      }

      console.log(`\n📁 目录: ${targetDir}`)
      console.log(`🖼️ 总文件数: ${files.length}`)
      console.log(`💾 总大小: ${optimizer.formatBytes(totalSize)}`)

      if (largeFiles.length > 0) {
        console.log('\n⚠️ 大文件 (>500KB):')
        largeFiles.forEach(file => {
          console.log(`   ${file.path} - ${file.formattedSize}`)
        })
      }

      if (largeFiles.length > 0) {
        console.log('\n💡 优化建议:')
        console.log(`   - 发现 ${largeFiles.length} 个大图片文件需要压缩`)
        console.log('   - 建议运行: node scripts/optimize-images-simple.cjs optimize public')
      }
      break

    case 'optimize':
      optimizer.quickOptimizeLargeFiles(targetDir, 500 * 1024)
      break

    default:
      console.log('📚 简易图片优化工具')
      console.log('')
      console.log('使用方法:')
      console.log('  node scripts/optimize-images-simple.cjs analyze <目录>  # 分析图片使用情况')
      console.log('  node scripts/optimize-images-simple.cjs optimize <目录> # 优化图片')
      console.log('')
      console.log('示例:')
      console.log('  node scripts/optimize-images-simple.cjs analyze public')
      console.log('  node scripts/optimize-images-simple.cjs optimize public')
      break
  }
}

module.exports = SimpleImageOptimizer