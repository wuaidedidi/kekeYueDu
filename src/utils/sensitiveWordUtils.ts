// 1. 读取 public/sensitiveWord/words.txt 文件
export async function loadSensitiveWords(): Promise<string[]> {
  try {
    const response = await fetch('./sensitiveWord/words.txt')
    const text = await response.text()
    // 按行分割并去除空格，过滤掉空行
    const words = text
      .split('\n')
      .map((word) => word.trim())
      .filter((word) => word.length > 0)
    return words
  } catch (error) {
    console.error('加载敏感词文件失败:', error)
    return []
  }
}

// 2. 转义正则表达式中的特殊字符
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&')
}

// 3. 使用正则表达式检测敏感词并替换
export function detectAndReplaceSensitiveWords(
  inputText: string,
  sensitiveWords: string[]
): string {
  let resultText = inputText

  // 遍历每个敏感词
  sensitiveWords.forEach((word) => {
    // 对敏感词进行转义
    const escapedWord = escapeRegExp(word)
    // 替换为与敏感词长度一致的星号
    const stars = '*'.repeat(word.length) // 根据敏感词的长度生成星号
    // 构造正则表达式，忽略大小写，全局匹配
    const regExp = new RegExp(escapedWord, 'gi') // 使用 'gi' 来进行忽略大小写和全局匹配

    // 用星号替换敏感词
    resultText = resultText.replace(regExp, stars)
  })

  return resultText
}

// 4. 敏感词检测与替换的主要功能
export async function processText(inputText: string): Promise<string> {
  // 加载敏感词库
  const sensitiveWords = await loadSensitiveWords()

  // 检测并替换敏感词
  const resultText = detectAndReplaceSensitiveWords(inputText, sensitiveWords)

  // 返回处理后的文本
  return resultText
}
