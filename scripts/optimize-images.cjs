const fs = require('fs')
const path = require('path')

/**
 * 图片优化工具脚本
 * 建议使用 imagemin 或 sharp 进行图片压缩
 * 这里提供基础的图片大小分析功能
 */

function analyzeImageSizes(directory) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
  let totalSize = 0
  let imageCount = 0
  const largeImages = []

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        scanDirectory(fullPath)
      } else {
        const ext = path.extname(file).toLowerCase()
        if (imageExtensions.includes(ext)) {
          const fileSize = stat.size
          totalSize += fileSize
          imageCount++

          // 找出大于500KB的图片
          if (fileSize > 500 * 1024) {
            largeImages.push({
              path: fullPath,
              size: fileSize,
              sizeFormatted: formatBytes(fileSize)
            })
          }
        }
      }
    }
  }

  scanDirectory(directory)

  console.log(`\n📊 图片分析报告`)
  console.log(`================`)
  console.log(`📁 分析目录: ${directory}`)
  console.log(`🖼️ 图片总数: ${imageCount}`)
  console.log(`💾 总大小: ${formatBytes(totalSize)}`)
  console.log(`📈 平均大小: ${formatBytes(Math.round(totalSize / imageCount))}`)

  if (largeImages.length > 0) {
    console.log(`\n⚠️ 大图片警告 (>500KB):`)
    largeImages.forEach(img => {
      console.log(`   ${img.path} - ${img.sizeFormatted}`)
    })
    console.log(`\n💡 建议: 压缩这些大图片以提升性能`)
  } else {
    console.log(`✅ 所有图片大小适中`)
  }

  return {
    totalSize,
    imageCount,
    largeImages
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 分析public目录的图片
if (require.main === module) {
  const publicDir = path.join(__dirname, '../public')
  analyzeImageSizes(publicDir)
}

module.exports = {
  analyzeImageSizes,
  formatBytes
}