// 命名系统主入口文件

import {
  IntelligentNamingEngine,
  CulturalAdapter,
  NamingStrategy,
} from './engine'
export { IntelligentNamingEngine, CulturalAdapter, NamingStrategy }
export {
  ChineseCulturalAdapter,
  JapaneseCulturalAdapter,
  WesternCulturalAdapter,
} from './adapters'
export {
  PersonNamingStrategy,
  PlaceNamingStrategy,
  MoveNamingStrategy,
  EquipmentNamingStrategy,
  MonsterNamingStrategy,
  ItemNamingStrategy,
  DefaultNamingStrategy,
} from './strategies'

export type {
  NamingContext,
  UserPreferences,
  WeightedWord,
  NamingRule,
  GeneratedName,
  NameBatch,
  CulturalAdapterType,
  NamingCategory,
} from './types'

// 便捷的工厂函数
export function createNamingEngine(preferences?: any, seed?: number) {
  return new IntelligentNamingEngine(preferences, seed)
}

// 便捷的批量生成函数
export function generateNames(
  category: string,
  count: number,
  culture = 'china',
  subcategory?: string
) {
  const engine = new IntelligentNamingEngine()
  return engine.generateBatch(
    {
      category,
      subcategory,
      culture,
      count,
    },
    count
  )
}
