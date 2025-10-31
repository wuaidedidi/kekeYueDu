import { NamingContext, UserPreferences, WeightedWord, NamingRule, GeneratedName, NameBatch, CulturalAdapterType } from './types'

// 文化适配器基类
export abstract class CulturalAdapter {
  protected engine: IntelligentNamingEngine

  constructor(engine: IntelligentNamingEngine) {
    this.engine = engine
  }

  abstract generatePersonName(context: NamingContext): string
  abstract generatePlaceName(context: NamingContext): string

  // 使用引擎的种子随机数生成器
  protected random(): number {
    return this.engine.seededRandom()
  }

  protected randomInt(max: number): number {
    return this.engine.seededRandomInt(max)
  }
}

// 命名策略基类
export abstract class NamingStrategy {
  protected engine: IntelligentNamingEngine

  constructor(engine: IntelligentNamingEngine) {
    this.engine = engine
  }

  abstract generate(context: NamingContext): string
}

// 智能命名引擎
export class IntelligentNamingEngine {
  private culturalAdapters: Map<CulturalAdapterType, CulturalAdapter>
  private strategies: Map<string, NamingStrategy>
  private semanticNetwork: Map<string, string[]>
  private userPreferences: UserPreferences
  private randomSeed: number
  private learningHistory: GeneratedName[] = []
  private nameDatabase: GeneratedName[] = []
  private initPromise: Promise<void>

  constructor(userPreferences?: UserPreferences, seed?: number) {
    this.userPreferences = userPreferences || this.getDefaultUserPreferences()
    this.randomSeed = seed || Date.now()

    this.culturalAdapters = new Map()
    this.strategies = new Map()
    this.semanticNetwork = new Map()

    this.initializeSemanticNetwork()
    this.initPromise = Promise.all([
      this.initializeCulturalAdapters(),
      this.initializeStrategies()
    ]).then(() => void 0).catch(error => {
      console.error('Naming engine initialization failed:', error)
    })
  }

  // 获取默认用户偏好
  private getDefaultUserPreferences(): UserPreferences {
    return {
      stylePreference: 'balanced',
      complexityPreference: 'medium',
      culturalPreference: ['chinese'],
      favoriteElements: [],
      avoidedElements: []
    }
  }

  // 改进的随机数生成器
  public seededRandom(): number {
    this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280
    return this.randomSeed / 233280
  }

  // 改进的随机整数生成器
  public seededRandomInt(max: number): number {
    return Math.floor(this.seededRandom() * max)
  }

  // 生成唯一随机数组索引
  private getUniqueRandomIndex<T>(array: T[], usedIndices: Set<number>): number {
    const available = array.map((_, index) => index).filter(index => !usedIndices.has(index))
    if (available.length === 0) return Math.floor(Math.random() * array.length)
    return available[this.seededRandomInt(available.length)]
  }

  // 生成主入口
  public generateName(context: NamingContext): string {
    const strategy = this.selectStrategy(context)
    const name = strategy.generate(context)

    // 记录生成历史用于学习
    this.learningHistory.push({
      text: name,
      category: context.category,
      subcategory: context.subcategory,
      culture: context.culture,
      timestamp: Date.now()
    })
    this.updateUserPreferences(name)

    return name
  }

  // 批量生成
  public generateBatch(context: NamingContext, count: number): NameBatch {
    const names: GeneratedName[] = []
    const usedNames = new Set<string>()

    const originalSeed = this.randomSeed

    for (let i = 0; i < count; i++) {
      let attempts = 0
      let name = ''

      do {
        name = this.generateName(context)
        attempts++
      } while (usedNames.has(name) && attempts < 10)

      if (!usedNames.has(name)) {
        usedNames.add(name)
        names.push({
          text: name,
          category: context.category,
          subcategory: context.subcategory,
          culture: context.culture,
          timestamp: Date.now()
        })
      }
    }

    return {
      names,
      seed: originalSeed,
      context
    }
  }

  // 选择生成策略
  private selectStrategy(context: NamingContext): NamingStrategy {
    const strategyKey = `${context.category}_${context.subcategory || 'default'}`
    const selected = this.strategies.get(strategyKey) || this.strategies.get(context.category) || this.strategies.get('default')
    if (!selected) {
      throw new Error('Naming strategies not initialized')
    }
    return selected
  }

  // 计算权重
  public calculateWeight(word: WeightedWord, context: NamingContext): number {
    let weight = word.weight

    // 基于用户偏好调整权重
    if (this.userPreferences.favoriteElements.includes(word.text)) {
      weight *= 1.5
    }
    if (this.userPreferences.avoidedElements.includes(word.text)) {
      weight *= 0.1
    }

    // 基于语义场调整权重
    if (word.semanticField) {
      const relatedConcepts = this.semanticNetwork.get(word.text) || []
      for (const concept of relatedConcepts) {
        if (this.userPreferences.favoriteElements.includes(concept)) {
          weight *= 1.2
        }
      }
    }

    return weight
  }

  // 更新用户偏好
  private updateUserPreferences(name: string): void {
    // 基于生成结果的用户偏好学习系统
    this.analyzeNameUsage(name)
  }

  // 分析名称使用情况，更新用户偏好
  private analyzeNameUsage(name: string): void {
    // 1. 语义关联分析
    this.analyzeSemanticPatterns(name)

    // 2. 文化偏好分析
    this.analyzeCulturalPatterns(name)

    // 3. 结构偏好分析
    this.analyzeStructuralPatterns(name)
  }

  // 语义模式分析
  private analyzeSemanticPatterns(name: string): void {
    for (const [char, relatedConcepts] of this.semanticNetwork.entries()) {
      if (name.includes(char)) {
        // 增强相关概念的偏好权重
        for (const concept of relatedConcepts) {
          if (!this.userPreferences.favoriteElements.includes(concept)) {
            // 如果用户频繁使用包含某字符的名称，学习偏好相关概念
            const usageCount = this.getConceptUsage(concept)
            if (usageCount > 3) { // 使用阈值
              this.userPreferences.favoriteElements.push(concept)
            }
          }
        }
      }
    }
  }

  // 文化模式分析
  private analyzeCulturalPatterns(name: string): void {
    // 分析用户对不同文化风格的偏好
    const chinesePattern = /^[\u4e00-\u9fa5]+$/
    const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/
    const westernPattern = /^[a-zA-Z\s]+$/

    if (chinesePattern.test(name)) {
      this.incrementCulturalPreference('chinese')
    } else if (japanesePattern.test(name)) {
      this.incrementCulturalPreference('japanese')
    } else if (westernPattern.test(name)) {
      this.incrementCulturalPreference('western')
    }
  }

  // 结构模式分析
  private analyzeStructuralPatterns(name: string): void {
    // 分析名称长度偏好
    if (name.length <= 2) {
      this.userPreferences.complexityPreference = 'simple'
    } else if (name.length <= 4) {
      this.userPreferences.complexityPreference = 'medium'
    } else {
      this.userPreferences.complexityPreference = 'complex'
    }

    // 分析字符组合偏好
    for (let i = 0; i < name.length - 1; i++) {
      const charPair = name.substring(i, i + 2)
      this.incrementCharPairPreference(charPair)
    }
  }

  // 获取概念使用次数
  private getConceptUsage(concept: string): number {
    // 从学习历史中统计概念使用次数
    let count = 0
    for (const historyItem of this.learningHistory) {
      if (historyItem.text.includes(concept)) {
        count++
      }
    }
    return count
  }

  // 增加文化偏好
  private incrementCulturalPreference(culture: string): void {
    const index = this.userPreferences.culturalPreference.indexOf(culture)
    if (index === -1) {
      this.userPreferences.culturalPreference.push(culture)
    } else {
      // 将偏好文化移到前面
      this.userPreferences.culturalPreference.splice(index, 1)
      this.userPreferences.culturalPreference.unshift(culture)
    }
  }

  // 增加字符对偏好
  private incrementCharPairPreference(charPair: string): void {
    // 存储用户偏好的字符组合
    if (!this.userPreferences.favoriteElements.includes(charPair)) {
      // 如果字符对使用频繁，加入偏好列表
      const usageCount = this.getCharPairUsage(charPair)
      if (usageCount > 2) {
        this.userPreferences.favoriteElements.push(charPair)
      }
    }
  }

  // 获取字符对使用次数
  private getCharPairUsage(charPair: string): number {
    let count = 0
    for (const historyItem of this.learningHistory) {
      if (historyItem.text.includes(charPair)) {
        count++
      }
    }
    return count
  }

  // 获取语义相关建议
  public getSemanticSuggestions(element: string): string[] {
    return this.semanticNetwork.get(element) || []
  }

  // 添加用户偏好
  public addFavoriteElement(element: string): void {
    if (!this.userPreferences.favoriteElements.includes(element)) {
      this.userPreferences.favoriteElements.push(element)
    }
  }

  // 添加用户避免的元素
  public addAvoidedElement(element: string): void {
    if (!this.userPreferences.avoidedElements.includes(element)) {
      this.userPreferences.avoidedElements.push(element)
    }
  }

  // 获取智能推荐
  public getSmartRecommendations(category: string): string[] {
    const recommendations: string[] = []

    // 基于用户偏好推荐
    for (const favorite of this.userPreferences.favoriteElements) {
      const relatedConcepts = this.getSemanticSuggestions(favorite)
      recommendations.push(...relatedConcepts.filter(concept =>
        !this.userPreferences.favoriteElements.includes(concept) &&
        !this.userPreferences.avoidedElements.includes(concept)
      ))
    }

    // 去重并限制数量
    return [...new Set(recommendations)].slice(0, 10)
  }

  // 设置随机种子
  public setSeed(seed: number): void {
    this.randomSeed = seed
  }

  // 获取当前种子
  public getSeed(): number {
    return this.randomSeed
  }

  // 初始化语义网络
  private initializeSemanticNetwork(): void {
    // 自然元素
    this.semanticNetwork.set('龙', ['力量', '威严', '神话', '东方', '皇权', '守护'])
    this.semanticNetwork.set('凤', ['美丽', '重生', '高贵', '吉祥', '火焰'])
    this.semanticNetwork.set('虎', ['勇猛', '力量', '山林', '威严', '保护'])
    this.semanticNetwork.set('鹤', ['长寿', '高雅', '仙气', '纯洁', '飞翔'])

    // 自然景象
    this.semanticNetwork.set('风', ['自由', '轻盈', '自然', '变化', '速度'])
    this.semanticNetwork.set('海', ['深邃', '广阔', '神秘', '蓝色', '包容'])
    this.semanticNetwork.set('山', ['稳定', '崇高', '坚实', '永恒', '守护'])
    this.semanticNetwork.set('水', ['柔韧', '流动', '生命', '清澈', '适应'])
    this.semanticNetwork.set('火', ['热情', '毁灭', '重生', '光明', '力量'])
    this.semanticNetwork.set('土', ['稳重', '包容', '生长', '根基', '朴实'])

    // 植物元素
    this.semanticNetwork.set('松', ['坚韧', '长青', '气节', '耐寒', '常绿'])
    this.semanticNetwork.set('竹', ['气节', '虚心', '成长', '坚韧', '高雅'])
    this.semanticNetwork.set('梅', ['坚强', '纯洁', '傲骨', '报春', '芬芳'])
    this.semanticNetwork.set('兰', ['高雅', '幽香', '君子', '纯洁', '珍贵'])
    this.semanticNetwork.set('菊', ['隐逸', '高洁', '晚香', '坚韧', '淡泊'])

    // 天体元素
    this.semanticNetwork.set('天', ['广阔', '崇高', '命运', '无限', '神圣'])
    this.semanticNetwork.set('地', ['厚重', '包容', '生长', '母亲', '根基'])
    this.semanticNetwork.set('月', ['阴柔', '变化', '神秘', '清冷', '圆满'])
    this.semanticNetwork.set('日', ['阳刚', '光明', '温暖', '生命', '希望', '力量'])
    this.semanticNetwork.set('星', ['希望', '指引', '永恒', '璀璨', '梦想'])
    this.semanticNetwork.set('云', ['变化', '自由', '飘逸', '神秘', '柔软'])

    // 颜色概念
    this.semanticNetwork.set('青', ['生机', '年轻', '希望', '东方', '春天'])
    this.semanticNetwork.set('赤', ['热情', '危险', '喜庆', '南方', '火焰'])
    this.semanticNetwork.set('黄', ['皇家', '光明', '中心', '财富', '土地'])
    this.semanticNetwork.set('白', ['纯洁', '朴素', '西方', '哀悼', '正义'])
    this.semanticNetwork.set('黑', ['神秘', '深沉', '北方', '严肃', '权威'])
    this.semanticNetwork.set('金', ['财富', '坚固', '珍贵', '光明', '秋收'])
    this.semanticNetwork.set('银', ['月光', '纯洁', '珍贵', '柔和', '财富'])

    // 抽象概念
    this.semanticNetwork.set('清', ['纯洁', '高雅', '明澈', '淡泊', '正直'])
    this.semanticNetwork.set('明', ['光明', '智慧', '清晰', '希望', '公正'])
    this.semanticNetwork.set('长', ['持久', '永恒', '成长', '深远', '绵延'])
    this.semanticNetwork.set('安', ['平静', '稳定', '安全', '满足', '和谐'])
    this.semanticNetwork.set('宁', ['宁静', '平和', '安详', '纯净', '稳定'])
    this.semanticNetwork.set('静', ['安静', '沉思', '内敛', '平和', '深远'])
  }

  // 初始化文化适配器
  private initializeCulturalAdapters(): Promise<void> {
    // 使用延迟导入以避免循环依赖
    return import('./adapters').then(({ ChineseCulturalAdapter, JapaneseCulturalAdapter, WesternCulturalAdapter }) => {
      this.culturalAdapters.set('chinese', new ChineseCulturalAdapter(this))
      this.culturalAdapters.set('japanese', new JapaneseCulturalAdapter(this))
      this.culturalAdapters.set('western', new WesternCulturalAdapter(this))
    }).catch(error => {
      console.error('Failed to load cultural adapters:', error)
    })
  }

  // 初始化策略
  private initializeStrategies(): Promise<void> {
    // 使用延迟导入以避免循环依赖
    return import('./strategies').then(({
      PersonNamingStrategy,
      PlaceNamingStrategy,
      MoveNamingStrategy,
      EquipmentNamingStrategy,
      MonsterNamingStrategy,
      ItemNamingStrategy,
      DefaultNamingStrategy
    }) => {
      this.strategies.set('person', new PersonNamingStrategy(this))
      this.strategies.set('place', new PlaceNamingStrategy(this))
      this.strategies.set('move', new MoveNamingStrategy(this))
      this.strategies.set('equipment', new EquipmentNamingStrategy(this))
      this.strategies.set('monster', new MonsterNamingStrategy(this))
      this.strategies.set('item', new ItemNamingStrategy(this))
      this.strategies.set('default', new DefaultNamingStrategy(this))
    }).catch(error => {
      console.error('Failed to load naming strategies:', error)
    })
  }

  // 等待引擎初始化完成
  public async ready(): Promise<void> {
    await this.initPromise
  }

  // 获取文化适配器
  public getCulturalAdapter(type: CulturalAdapterType): CulturalAdapter | undefined {
    return this.culturalAdapters.get(type)
  }

  // 更新用户偏好
  public updateUserPreferencesDirect(preferences: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...preferences }
  }

  // 获取学习历史
  public getLearningHistory(): GeneratedName[] {
    return [...this.learningHistory]
  }

  // 清空学习历史
  public clearLearningHistory(): void {
    this.learningHistory = []
  }
}