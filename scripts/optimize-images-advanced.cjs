const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * 高级图片优化工具
 * 支持多种优化方式和批量处理
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      quality: options.quality || 85,
      progressive: options.progressive || true,
      interlaced: options.interlaced || true,
      lossless: options.lossless || false,
      // 支持的图片格式
      supportedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
      // 优化后的格式
      outputFormat: options.outputFormat || 'webp',
      // 是否保留原文件
      keepOriginal: options.keepOriginal || true,
      // WebP 输出质量
      webpQuality: options.webpQuality || 80,
      ...options
    }
  }

  /**
   * 检查系统是否安装了必要的图片处理工具
   */
  checkDependencies() {
    const tools = ['cwebp', 'optipng', 'jpegtran', 'pngquant']
    const missingTools = []

    tools.forEach(tool => {
      try {
        execSync(`${tool} --version`, { stdio: 'ignore' })
      } catch (error) {
        missingTools.push(tool)
      }
    })

    if (missingTools.length > 0) {
      console.log('⚠️  缺少以下图片优化工具:')
      missingTools.forEach(tool => {
        console.log(`   - ${tool}`)
      })
      console.log('\n安装建议:')
      console.log(' Ubuntu/Debian:')
      console.log('   sudo apt-get install webp libjpeg-progs optipng pngquant')
      console.log(' macOS (Homebrew):')
      console.log('   brew install webp jpeg-turbo optipng pngquant')
      console.log(' Windows:')
      console.log('   请手动下载并添加到 PATH')
      return false
    }
    return true
  }

  /**
   * 优化单张图片
   */
  optimizeImage(inputPath, outputPath) {
    const ext = path.extname(inputPath).toLowerCase()
    const isWebp = ext === '.webp'

    try {
      if (isWebp) {
        // WebP图片进一步优化
        this.optimizeWebP(inputPath, outputPath)
      } else if (ext === '.png') {
        // PNG 优化
        this.optimizePNG(inputPath, outputPath)
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        // JPEG 优化
        this.optimizeJPEG(inputPath, outputPath)
      } else {
        console.log(`⚠️  不支持的图片格式: ${ext}`)
        return false
      }

      // 获取优化后的文件大小
      const stats = fs.statSync(outputPath)
      return stats.size
    } catch (error) {
      console.error(`❌ 优化失败: ${inputPath}`, error.message)
      return false
    }
  }

  /**
   * 优化 WebP 图片
   */
  optimizeWebP(inputPath, outputPath) {
    const cmd = `cwebp -q ${this.options.webpQuality} "${inputPath}" -o "${outputPath}"`
    execSync(cmd, { stdio: 'ignore' })
  }

  /**
   * 优化 PNG 图片
   */
  optimizePNG(inputPath, outputPath) {
    if (this.options.outputFormat === 'webp') {
      // 转换为 WebP
      const cmd = `cwebp -q ${this.options.webpQuality} "${inputPath}" -o "${outputPath}"`
      execSync(cmd, { stdio: 'ignore' })
    } else {
      // 使用 pngquant 和 optipng 优化
      const tempPath = `${outputPath}.tmp`

      // 先用 pngquant 量化颜色
      execSync(`pngquant --quality=65-80 --speed 1 "${inputPath}" --output "${tempPath}"`, { stdio: 'ignore' })

      // 再用 optipng 压缩
      execSync(`optipng -o7 -zm1-9 "${tempPath}" "${outputPath}"`, { stdio: 'ignore' })

      // 删除临时文件
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }
    }
  }

  /**
   * 优化 JPEG 图片
   */
  optimizeJPEG(inputPath, outputPath) {
    if (this.options.outputFormat === 'webp') {
      // 转换为 WebP
      const cmd = `cwebp -q ${this.options.webpQuality} "${inputPath}" -o "${outputPath}"`
      execSync(cmd, { stdio: 'ignore' })
    } else {
      // 使用 jpegtran 优化
      const cmd = `jpegtran -optimize -progressive "${inputPath}" > "${outputPath}"`
      execSync(cmd, { stdio: 'pipe' })
    }
  }

  /**
   * 批量优化目录中的图片
   */
  optimizeDirectory(dir, options = {}) {
    const {
      recursive = true,
      extensions = this.options.supportedFormats,
      onProgress = () => {},
      onComplete = () => {}
    } = options

    let totalFiles = 0
    let optimizedFiles = 0
    let totalSizeSaved = 0

    function processDirectory(currentDir) {
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

            const optimizedSize = this.optimizeImage(fullPath, outputPath)

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

              // 如果不保留原文件，替换原文件
              if (!this.options.keepOriginal) {
                fs.unlinkSync(fullPath)
                fs.renameSync(outputPath, fullPath)
              }
            }
          }
        }
      }
    }

    processDirectory(dir)
    onComplete({
      totalFiles,
      optimizedFiles,
      totalSizeSaved,
      averageSaving: totalSizeSaved / optimizedFiles || 0
    })
  }

  /**
   * 生成输出文件路径
   */
  generateOutputPath(inputPath) {
    const parsedPath = path.parse(inputPath)
    const ext = path.extname(inputPath)

    if (this.options.outputFormat === 'webp' && !['.webp'].includes(ext)) {
      return path.join(parsedPath.dir, `${parsedPath.name}.webp`)
    }

    return path.join(parsedPath.dir, `${parsedPath.name}_optimized${ext}`)
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
   * 分析图片使用情况
   */
  analyzeImageUsage(directory) {
    const analysis = {
      totalFiles: 0,
      totalSize: 0,
      formatStats: {},
      largeFiles: [],
      recommendations: []
    }

    const self = this // 保存完整的this引用

    function analyzeDir(dir) {
      const files = fs.readdirSync(dir)

      for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          analyzeDir(fullPath)
        } else if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase()

          if (self.options.supportedFormats.includes(ext)) {
            analysis.totalFiles++
            analysis.totalSize += stat.size

            // 统计格式
            if (!analysis.formatStats[ext]) {
              analysis.formatStats[ext] = { count: 0, size: 0 }
            }
            analysis.formatStats[ext].count++
            analysis.formatStats[ext].size += stat.size

            // 识别大文件
            if (stat.size > 500 * 1024) { // 500KB
              analysis.largeFiles.push({
                path: fullPath,
                size: stat.size,
                formattedSize: self.formatBytes(stat.size)
              })
            }
          }
        }
      }
    }

    analyzeDir(directory)

    // 生成建议
    if (analysis.largeFiles.length > 0) {
      analysis.recommendations.push(`发现 ${analysis.largeFiles.length} 个大图片文件需要压缩`)
    }

    if (analysis.formatStats['.png'] && analysis.formatStats['.png'].size > 10 * 1024 * 1024) {
      analysis.recommendations.push('PNG 文件较多，建议转换为 WebP 格式')
    }

    return analysis
  }

  /**
   * 生成优化报告
   */
  generateReport(directory) {
    const analysis = this.analyzeImageUsage(directory)
    const report = {
      timestamp: new Date().toISOString(),
      directory,
      analysis,
      settings: this.options
    }

    // 保存报告到文件
    const reportPath = path.join(directory, 'optimization-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📊 优化报告已生成: ${reportPath}`)

    return report
  }
}

// CLI 接口
if (require.main === module) {
  const command = process.argv[2]
  const targetDir = process.argv[3] || 'public'

  const optimizer = new ImageOptimizer({
    quality: 85,
    outputFormat: 'webp',
    keepOriginal: true
  })

  switch (command) {
    case 'analyze':
      console.log('📊 分析图片使用情况...')
      const analysis = optimizer.analyzeImageUsage(targetDir)
      console.log(`\n📁 目录: ${targetDir}`)
      console.log(`🖼️ 总文件数: ${analysis.totalFiles}`)
      console.log(`💾 总大小: ${optimizer.formatBytes(analysis.totalSize)}`)

      if (analysis.largeFiles.length > 0) {
        console.log('\n⚠️ 大文件 (>500KB):')
        analysis.largeFiles.forEach(file => {
          console.log(`   ${file.path} - ${file.formattedSize}`)
        })
      }

      if (analysis.recommendations.length > 0) {
        console.log('\n💡 优化建议:')
        analysis.recommendations.forEach(rec => {
          console.log(`   - ${rec}`)
        })
      }
      break

    case 'optimize':
      if (!optimizer.checkDependencies()) {
        process.exit(1)
      }

      console.log('🚀 开始优化图片...')
      optimizer.optimizeDirectory(targetDir, {
        onProgress: (progress) => {
          console.log(`✅ ${progress.file.split('\\').pop()} - 压大小: ${optimizer.formatBytes(progress.originalSize)} → ${optimizer.formatBytes(progress.optimizedSize)} (节省 ${progress.percentage}%)`)
        },
        onComplete: (result) => {
          console.log(`\n🎉 优化完成!`)
          console.log(`📊 统计信息:`)
          console.log(`   - 处理文件数: ${result.totalFiles}`)
          console.log(`   - 成功优化数: ${result.optimizedFiles}`)
          console.log(`   - 总节省空间: ${optimizer.formatBytes(result.totalSizeSaved)}`)
          console.log(`   - 平均节省: ${optimizer.formatBytes(result.averageSaving)}`)
        }
      })
      break

    case 'report':
      optimizer.generateReport(targetDir)
      break

    default:
      console.log('📚 图片优化工具')
      console.log('')
      console.log('使用方法:')
      console.log('  node scripts/optimize-images-advanced.cjs analyze <目录>  # 分析图片使用情况')
      console.log('  node scripts/optimize-images-advanced.cjs optimize <目录> # 优化图片')
      console.log('  node scripts/optimize-images-advanced.cjs report <目录>   # 生成优化报告')
      console.log('')
      console.log('示例:')
      console.log('  node scripts/optimize-images-advanced.cjs analyze public')
      console.log('  node scripts/optimize-images-advanced.cjs optimize public')
      break
  }
}

module.exports = ImageOptimizer