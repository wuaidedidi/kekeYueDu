import { CulturalAdapter, IntelligentNamingEngine } from './engine'
import { NamingContext } from './types'

// 中文文化适配器
export class ChineseCulturalAdapter extends CulturalAdapter {
  constructor(engine: IntelligentNamingEngine) {
    super(engine)
  }

  private surnameWeights = [
    { text: '张', weight: 0.08, tags: ['common', 'traditional'] },
    { text: '王', weight: 0.07, tags: ['common', 'traditional'] },
    { text: '李', weight: 0.07, tags: ['common', 'traditional'] },
    { text: '刘', weight: 0.06, tags: ['common', 'traditional'] },
    { text: '陈', weight: 0.06, tags: ['common', 'traditional'] },
    { text: '杨', weight: 0.05, tags: ['common', 'traditional'] },
    { text: '龙', weight: 0.02, tags: ['mythical', 'powerful'], semanticField: 'strength' },
    { text: '风', weight: 0.01, tags: ['nature', 'elegant'], semanticField: 'freedom' },
    { text: '云', weight: 0.01, tags: ['nature', 'mystical'], semanticField: 'mystery' },
    { text: '月', weight: 0.01, tags: ['nature', 'elegant'], semanticField: 'beauty' }
  ]

  private maleNameElements = [
    { text: '伟', weight: 0.08, tags: ['strong', 'common'] },
    { text: '杰', weight: 0.07, tags: ['outstanding', 'common'] },
    { text: '浩', weight: 0.06, tags: ['vast', 'nature'] },
    { text: '宇', weight: 0.05, tags: ['universe', 'ambitious'] },
    { text: '轩', weight: 0.05, tags: ['elegant', 'noble'] },
    { text: '睿', weight: 0.04, tags: ['wise', 'intellectual'] },
    { text: '博', weight: 0.04, tags: ['learned', 'intellectual'] },
    { text: '天', weight: 0.03, tags: ['nature', 'ambitious'] },
    { text: '海', weight: 0.03, tags: ['nature', 'vast'] },
    { text: '山', weight: 0.02, tags: ['nature', 'stable'] }
  ]

  private femaleNameElements = [
    { text: '芳', weight: 0.08, tags: ['fragrant', 'beauty'] },
    { text: '丽', weight: 0.07, tags: ['beautiful', 'common'] },
    { text: '娜', weight: 0.06, tags: ['elegant', 'graceful'] },
    { text: '静', weight: 0.05, tags: ['quiet', 'gentle'] },
    { text: '雪', weight: 0.05, tags: ['nature', 'pure'] },
    { text: '梅', weight: 0.04, tags: ['flower', 'resilient'] },
    { text: '兰', weight: 0.04, tags: ['flower', 'elegant'] },
    { text: '月', weight: 0.03, tags: ['nature', 'beauty'] },
    { text: '云', weight: 0.03, tags: ['nature', 'mystical'] },
    { text: '琳', weight: 0.02, tags: ['beautiful', 'precious'] }
  ]

  generatePersonName(context: NamingContext): string {
    const surname = this.weightedRandom(this.surnameWeights, context)
    const gender = context.userPreferences?.stylePreference || 'balanced'

    let givenName = ''
    if (this.random() < 0.7) {
      const elements = gender === 'male' ? this.maleNameElements :
                      gender === 'female' ? this.femaleNameElements :
                      [...this.maleNameElements, ...this.femaleNameElements]
      const element1 = this.weightedRandom(elements, context)
      let element2 = this.weightedRandom(elements, context)

      while (element2 === element1 && elements.length > 1) {
        element2 = this.weightedRandom(elements, context)
      }

      givenName = element1 + element2
    } else {
      const elements = gender === 'male' ? this.maleNameElements :
                      gender === 'female' ? this.femaleNameElements :
                      [...this.maleNameElements, ...this.femaleNameElements]
      givenName = this.weightedRandom(elements, context)
    }

    return surname + givenName
  }

  generatePlaceName(context: NamingContext): string {
    const placeType = context.subcategory || 'city'
    const patterns = this.getPlacePatterns(placeType)
    const pattern = patterns[this.randomInt(patterns.length)]

    return this.applyPlacePattern(pattern, context)
  }

  private getPlacePatterns(placeType: string): string[][] {
    switch (placeType) {
      case 'city':
        return [
          ['prefix', 'suffix'],
          ['prefix', 'root', 'suffix'],
          ['root1', 'root2', 'suffix'],
          ['special']
        ]
      case 'village':
        return [
          ['prefix', 'suffix'],
          ['prefix', 'root', 'suffix'],
          ['root', 'suffix'],
          ['nature', 'suffix']
        ]
      case 'mountain':
        return [
          ['prefix', 'suffix'],
          ['root', 'suffix'],
          ['color', 'suffix'],
          ['mythical', 'suffix']
        ]
      default:
        return [['prefix', 'suffix']]
    }
  }

  private applyPlacePattern(pattern: string[], context: NamingContext): string {
    switch (pattern[0]) {
      case 'prefix':
        const prefixes = ['东', '西', '南', '北', '上', '下', '中', '大', '小', '新', '古', '金', '银', '玉']
        const prefix = prefixes[this.randomInt(prefixes.length)]
        return prefix + this.getSuffix(pattern.slice(1), context)

      case 'root':
      case 'root1':
        const roots = ['云', '海', '天', '地', '龙', '凤', '虎', '鹤', '松', '竹', '梅', '兰', '清', '明', '长', '安']
        const root = roots[this.randomInt(roots.length)]
        if (pattern[0] === 'root') {
          return root + this.getSuffix(pattern.slice(1), context)
        } else {
          return root + this.applyPlacePattern(pattern.slice(1), context)
        }

      case 'color':
        const colors = ['青', '赤', '黄', '白', '黑', '紫', '金', '银', '彩', '碧']
        const color = colors[this.randomInt(colors.length)]
        return color + this.getSuffix(pattern.slice(1), context)

      case 'nature':
        const natures = ['风', '雨', '雪', '月', '星', '云', '泉', '溪', '竹', '松', '桃', '柳']
        const nature = natures[this.randomInt(natures.length)]
        return nature + this.getSuffix(pattern.slice(1), context)

      case 'mythical':
        const mythicals = ['龙', '凤', '麒', '麟', '仙', '神', '灵', '妖', '魔', '圣']
        const mythical = mythicals[this.randomInt(mythicals.length)]
        return mythical + this.getSuffix(pattern.slice(1), context)

      case 'special':
        const cityPrefixes = ['东', '西', '南', '北', '上', '下', '中', '大', '小', '新', '古']
        const cityRoots = ['海', '山', '河', '湖', '云', '星', '月', '日', '天', '地']
        const streetPrefixes = ['长', '安', '和', '平', '繁', '华', '文', '明', '幸', '福']
        const streetRoots = ['东', '西', '南', '北', '中', '大', '新', '古', '金', '银']

        const city = cityPrefixes[this.randomInt(cityPrefixes.length)] +
                    cityRoots[this.randomInt(cityRoots.length)] + '市'
        const street = streetPrefixes[this.randomInt(streetPrefixes.length)] +
                      streetRoots[this.randomInt(streetRoots.length)] + '街'
        return `${city}.${street}`

      default:
        return '未知地名'
    }
  }

  private getSuffix(pattern: string[], context: NamingContext): string {
    const placeType = context.subcategory || 'city'
    const suffixes = {
      city: ['城', '都', '京', '州', '府', '市', '镇', '县'],
      village: ['村', '庄', '寨', '坞', '堡', '营', '屯', '集'],
      mountain: ['山', '峰', '岭', '峦', '岳', '丘', '崖', '谷'],
      forest: ['林', '森', '木', '树', '丛', '森', '林', '木'],
      river: ['江', '河', '川', '溪', '涧', '泉', '水', '流']
    }

    const suffixList = suffixes[placeType] || suffixes.city
    return suffixList[this.randomInt(suffixList.length)]
  }

  private weightedRandom(words: any[], context: NamingContext): string {
    const enhancedWeights = words.map(word => ({
      ...word,
      weight: this.calculateEnhancedWeight(word, context)
    }))

    const totalWeight = enhancedWeights.reduce((sum, word) => sum + word.weight, 0)
    let random = this.random() * totalWeight

    for (const word of enhancedWeights) {
      random -= word.weight
      if (random <= 0) {
        return word.text
      }
    }

    return enhancedWeights[0].text
  }

  // 计算增强权重（基于语义网络和用户偏好）
  private calculateEnhancedWeight(word: any, context: NamingContext): number {
    let weight = word.weight

    // 1. 基于用户偏好调整权重
    if (context.userPreferences?.favoriteElements?.includes(word.text)) {
      weight *= 2.0 // 用户喜欢的元素权重翻倍
    }
    if (context.userPreferences?.avoidedElements?.includes(word.text)) {
      weight *= 0.1 // 用户避免的元素权重大幅降低
    }

    // 2. 基于语义关联调整权重
    if (word.semanticField) {
      const semanticSuggestions = this.engine.getSemanticSuggestions(word.text)
      for (const suggestion of semanticSuggestions) {
        if (context.userPreferences?.favoriteElements?.includes(suggestion)) {
          weight *= 1.3 // 语义相关的偏好元素增强权重
        }
      }
    }

    // 3. 基于文化偏好调整权重
    if (context.userPreferences?.culturalPreference?.includes('chinese') && this.isChineseElement(word.text)) {
      weight *= 1.2
    }

    // 4. 基于复杂度偏好调整权重
    if (context.userPreferences?.complexityPreference === 'simple' && word.text.length <= 1) {
      weight *= 1.3
    } else if (context.userPreferences?.complexityPreference === 'complex' && word.text.length > 1) {
      weight *= 1.2
    }

    return weight
  }

  // 判断是否为中文元素
  private isChineseElement(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text)
  }
}

// 日式文化适配器
export class JapaneseCulturalAdapter extends CulturalAdapter {
  constructor(engine: IntelligentNamingEngine) {
    super(engine)
  }

  private surnames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水']
  private givenNames = ['太郎', '次郎', '花子', '桜', '陽子', '健太', '大輝', '翔太', '美咲', 'さくら', '結衣', '葵', '大輝', '蓮', '凪']

  generatePersonName(context: NamingContext): string {
    const surname = this.surnames[this.randomInt(this.surnames.length)]
    const givenName = this.givenNames[this.randomInt(this.givenNames.length)]
    return `${surname} ${givenName}`
  }

  generatePlaceName(context: NamingContext): string {
    const placeTypes = ['市', '町', '村', '山', '川', '島', '港', '駅']
    const roots = ['東京', '大阪', '京都', '横浜', '名古屋', '札幌', '福岡', '仙台', '広島', '北九州']
    const root = roots[this.randomInt(roots.length)]
    const type = placeTypes[this.randomInt(placeTypes.length)]
    return `${root}${type}`
  }
}

// 西式文化适配器
export class WesternCulturalAdapter extends CulturalAdapter {
  constructor(engine: IntelligentNamingEngine) {
    super(engine)
  }

  private surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White']
  private maleNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Paul', 'Kevin', 'Brian', 'George']
  private femaleNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle']

  generatePersonName(context: NamingContext): string {
    const surname = this.surnames[this.randomInt(this.surnames.length)]
    const isMale = this.random() < 0.5
    const givenNames = isMale ? this.maleNames : this.femaleNames
    const givenName = givenNames[this.randomInt(givenNames.length)]
    return `${givenName} ${surname}`
  }

  generatePlaceName(context: NamingContext): string {
    const placeTypes = ['City', 'Town', 'Village', 'Mount', 'River', 'Lake', 'Falls', 'Bridge', 'Port', 'Hill']
    const prefixes = ['New', 'Old', 'North', 'South', 'East', 'West', 'Great', 'Little', 'Green', 'Blue', 'Red', 'White']
    const roots = ['York', 'Haven', 'London', 'Paris', 'Boston', 'Chicago', 'Seattle', 'Denver', 'Phoenix', 'Portland']
    const prefix = prefixes[this.randomInt(prefixes.length)]
    const root = roots[this.randomInt(roots.length)]
    const type = placeTypes[this.randomInt(placeTypes.length)]
    return `${prefix} ${root} ${type}`
  }
}