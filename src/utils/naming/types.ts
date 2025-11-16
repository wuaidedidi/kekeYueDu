// 命名系统类型定义

export interface NamingContext {
  category: string
  subcategory?: string
  culture: string
  userPreferences?: UserPreferences
  complexity?: 'simple' | 'medium' | 'complex'
  count?: number
}

export interface UserPreferences {
  stylePreference: 'male' | 'female' | 'balanced'
  complexityPreference: 'simple' | 'medium' | 'complex'
  culturalPreference: string[]
  favoriteElements: string[]
  avoidedElements: string[]
}

export interface WeightedWord {
  text: string
  weight: number
  tags?: string[]
  semanticField?: string
}

export interface NamingRule {
  pattern: string[]
  weights?: number[]
  semanticConstraints?: string[]
  conditions?: (context: NamingContext) => boolean
}

export interface GeneratedName {
  text: string
  category: string
  subcategory?: string
  culture: string
  timestamp: number
  userLiked?: boolean
}

export interface NameBatch {
  names: GeneratedName[]
  seed: number
  context: NamingContext
}

export type CulturalAdapterType = 'chinese' | 'japanese' | 'western'
export type NamingCategory =
  | 'person'
  | 'place'
  | 'move'
  | 'equipment'
  | 'monster'
  | 'item'
  | 'default'
