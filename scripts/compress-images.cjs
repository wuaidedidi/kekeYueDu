const fs = require('fs')
const path = require('path')

/**
 * 简单的图片压缩和优化工具
 * 主要通过分析和复制文件来提供优化建议
 */

class ImageCompressor {
  constructor() {
    this.supportedFormats = ['.png', '.jpg', '.jpeg', '.webp']
    this.largeFileThreshold = 500 * 1024 // 500KB
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
   * 查找所有图片文件
   */
  findImageFiles(directory) {
    const files = []

    function scanDir(dir) {
      try {
        const items = fs.readdirSync(dir)

        for (const item of items) {
          const fullPath = path.join(dir, item)
          const stat = fs.statSync(fullPath)

          if (stat.isDirectory()) {
            scanDir(fullPath)
          } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase()
            if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
              files.push(fullPath)
            }
          }
        }
      } catch (error) {
        console.warn(`无法读取目录: ${dir}`, error.message)
      }
    }

    scanDir(directory)
    return files
  }

  /**
   * 分析图片文件
   */
  analyzeImages(directory) {
    console.log('📊 分析图片文件...')

    const files = this.findImageFiles(directory)
    const analysis = {
      totalFiles: files.length,
      totalSize: 0,
      formatStats: {},
      largeFiles: [],
      recommendations: [],
    }

    files.forEach((filePath) => {
      try {
        const stat = fs.statSync(filePath)
        const ext = path.extname(filePath).toLowerCase()
        const relativePath = path.relative(directory, filePath)

        analysis.totalSize += stat.size

        // 统计格式
        if (!analysis.formatStats[ext]) {
          analysis.formatStats[ext] = { count: 0, size: 0 }
        }
        analysis.formatStats[ext].count++
        analysis.formatStats[ext].size += stat.size

        // 识别大文件
        if (stat.size > this.largeFileThreshold) {
          analysis.largeFiles.push({
            path: relativePath,
            fullPath: filePath,
            size: stat.size,
            formattedSize: this.formatBytes(stat.size),
          })
        }
      } catch (error) {
        console.warn(`无法分析文件: ${filePath}`, error.message)
      }
    })

    // 生成建议
    if (analysis.largeFiles.length > 0) {
      analysis.recommendations.push(
        `发现 ${analysis.largeFiles.length} 个大图片文件 (>500KB) 需要压缩`
      )
      analysis.recommendations.push(
        '建议使用在线工具如 TinyPNG 或 Squoosh 进行压缩'
      )
    }

    if (
      analysis.formatStats['.png'] &&
      analysis.formatStats['.png'].count > 10
    ) {
      analysis.recommendations.push(
        'PNG 文件较多，建议转换为 WebP 格式以节省空间'
      )
    }

    const totalMB = analysis.totalSize / (1024 * 1024)
    if (totalMB > 10) {
      analysis.recommendations.push(
        `总图片大小 ${totalMB.toFixed(1)}MB 较大，建议优化`
      )
    }

    return analysis
  }

  /**
   * 生成优化报告
   */
  generateReport(directory) {
    const analysis = this.analyzeImages(directory)

    console.log(`\n📁 目录: ${directory}`)
    console.log(`🖼️ 总文件数: ${analysis.totalFiles}`)
    console.log(`💾 总大小: ${this.formatBytes(analysis.totalSize)}`)

    console.log('\n📈 格式统计:')
    Object.entries(analysis.formatStats).forEach(([ext, stats]) => {
      console.log(
        `   ${ext}: ${stats.count} 个文件, ${this.formatBytes(stats.size)}`
      )
    })

    if (analysis.largeFiles.length > 0) {
      console.log('\n⚠️ 大文件 (>500KB):')
      analysis.largeFiles.forEach((file) => {
        const percentage = ((file.size / analysis.totalSize) * 100).toFixed(1)
        console.log(
          `   ${file.path} - ${file.formattedSize} (${percentage}% of total)`
        )
      })
    }

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 优化建议:')
      analysis.recommendations.forEach((rec) => {
        console.log(`   - ${rec}`)
      })
    }

    // 保存详细报告
    const reportData = {
      timestamp: new Date().toISOString(),
      directory,
      analysis,
      optimizationSuggestions: [
        '1. 使用在线压缩工具: https://tinypng.com/',
        '2. 批量转换工具: https://squoosh.app/',
        '3. WebP 转换: https://converter.to/webp/',
        '4. 图片格式建议:',
        '   - 照片类: JPEG (质量 80-85%)',
        '   - 图标/插画: PNG (带透明) 或 WebP',
        '   - 复杂图片: WebP (体积小，质量好)',
      ],
    }

    const reportPath = path.join(directory, 'image-compression-report.json')
    try {
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
      console.log(`\n📄 详细报告已保存: ${reportPath}`)
    } catch (error) {
      console.warn('保存报告失败:', error.message)
    }

    return analysis
  }

  /**
   * 创建压缩示例
   */
  async createCompressionExample(directory) {
    console.log('\n🔧 创建压缩示例...')

    // 找到最大的文件作为示例
    const analysis = this.analyzeImages(directory)
    if (analysis.largeFiles.length === 0) {
      console.log('没有找到需要压缩的大文件')
      return
    }

    const largestFile = analysis.largeFiles[0]
    const ext = path.extname(largestFile.path)

    // 创建示例目录
    const exampleDir = path.join(directory, 'optimized-examples')
    if (!fs.existsSync(exampleDir)) {
      fs.mkdirSync(exampleDir, { recursive: true })
    }

    try {
      // 简单复制作为示例（实际压缩需要专业工具）
      const inputPath = largestFile.fullPath
      const outputPath = path.join(
        exampleDir,
        `optimized-${path.basename(largestFile.path)}`
      )

      fs.copyFileSync(inputPath, outputPath)

      console.log(`✅ 创建压缩示例: ${path.basename(largestFile.path)}`)
      console.log(`📂 示例文件位置: ${outputPath}`)
      console.log(`💡 请使用专业工具对该文件进行压缩测试`)
    } catch (error) {
      console.warn('创建示例失败:', error.message)
    }
  }
}

// CLI 接口
if (require.main === module) {
  const command = process.argv[2]
  const targetDir = process.argv[3] || 'public'

  const compressor = new ImageCompressor()

  switch (command) {
    case 'analyze':
      compressor.generateReport(targetDir)
      break

    case 'example':
      compressor.generateReport(targetDir)
      compressor.createCompressionExample(targetDir)
      break

    default:
      console.log('📚 图片压缩分析工具')
      console.log('')
      console.log('使用方法:')
      console.log(
        '  node scripts/compress-images.cjs analyze <目录>    # 分析图片使用情况'
      )
      console.log(
        '  node scripts/compress-images.cjs example <目录>    # 创建压缩示例'
      )
      console.log('')
      console.log('示例:')
      console.log('  node scripts/compress-images.cjs analyze public')
      console.log('  node scripts/compress-images.cjs example public')
      console.log('')
      console.log('推荐工具:')
      console.log('  - TinyPNG: https://tinypng.com/')
      console.log('  - Squoosh: https://squoosh.app/')
      console.log('  - ImageOptim (macOS)')
      break
  }
}

module.exports = ImageCompressor
