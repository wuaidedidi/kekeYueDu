import type { IntelligentNamingEngine } from './engine'
import { NamingContext, NamingRule } from './types'

// 命名策略基类
abstract class NamingStrategy {
  protected engine: IntelligentNamingEngine

  constructor(engine: IntelligentNamingEngine) {
    this.engine = engine
  }

  abstract generate(context: NamingContext): string
}

// 人物命名策略
export class PersonNamingStrategy extends NamingStrategy {
  public generate(context: NamingContext): string {
    const rules = this.getNamingRules(context.userPreferences?.complexityPreference)
    const rule = this.selectRule(rules, context)
    return this.applyRule(rule, context)
  }

  private getNamingRules(complexity?: string): NamingRule[] {
    if (complexity === 'complex') {
      return [
        {
          pattern: ['prefix', 'root', 'suffix'],
          weights: [0.2, 0.6, 0.2],
          semanticConstraints: ['person', 'meaningful']
        },
        {
          pattern: ['root1', 'root2', 'suffix'],
          weights: [0.4, 0.4, 0.2],
          semanticConstraints: ['person', 'balanced']
        }
      ]
    } else if (complexity === 'simple') {
      return [
        {
          pattern: ['prefix', 'suffix'],
          weights: [0.6, 0.4],
          semanticConstraints: ['person', 'simple']
        }
      ]
    }

    return [
      {
        pattern: ['prefix', 'root', 'suffix'],
        weights: [0.3, 0.4, 0.3],
        semanticConstraints: ['person', 'balanced']
      },
      {
        pattern: ['prefix', 'suffix'],
        weights: [0.5, 0.5],
        semanticConstraints: ['person', 'simple']
      }
    ]
  }

  private selectRule(rules: NamingRule[], context: NamingContext): NamingRule {
    // 优先使用带条件的规则
    const conditional = rules.find(r => typeof r.conditions === 'function' && r.conditions(context))
    if (conditional) return conditional

    // 次选根据子类别偏好（例如森林更偏自然）
    if (context.subcategory === 'forest' && rules.length > 1) return rules[1]

    // 默认返回第一个规则
    return rules[0]
  }

  private applyRule(rule: NamingRule, context: NamingContext): string {
    // 获取当前文化适配器
    const culturalMap: Record<string, string> = {
      'china': 'chinese',
      'japan': 'japanese',
      'west': 'western'
    }

    const adapterName = culturalMap[context.culture] || context.culture
    const adapter = this.engine.getCulturalAdapter(adapterName as any)

    if (!adapter) {
      console.warn(`找不到文化适配器: ${adapterName}`)
      return '未知人名'
    }

    // 委托给文化适配器生成人名
    try {
      return adapter.generatePersonName(context)
    } catch (error) {
      console.error('人名生成失败:', error)
      return '人名生成失败'
    }
  }
}

// 地点命名策略
export class PlaceNamingStrategy extends NamingStrategy {
  public generate(context: NamingContext): string {
    const rules = this.getNamingRules(context.subcategory)
    const rule = this.selectRule(rules, context)
    return this.applyRule(rule, context)
  }

  private getNamingRules(subcategory?: string): NamingRule[] {
    return [
      {
        pattern: ['prefix', 'suffix'],
        weights: [0.4, 0.6],
        semanticConstraints: ['location']
      },
      {
        pattern: ['prefix', 'root', 'suffix'],
        weights: [0.3, 0.4, 0.3],
        semanticConstraints: ['location', 'nature']
      },
      {
        pattern: ['root1', 'root2', 'suffix'],
        weights: [0.35, 0.35, 0.3],
        conditions: (ctx) => ctx.complexity === 'complex'
      }
    ]
  }

  private selectRule(rules: NamingRule[], context: NamingContext): NamingRule {
    // 根据上下文选择合适的规则
    return rules[0]
  }

  private applyRule(rule: NamingRule, context: NamingContext): string {
    // 获取当前文化适配器
    const culturalMap: Record<string, string> = {
      'china': 'chinese',
      'japan': 'japanese',
      'west': 'western'
    }

    const adapterName = culturalMap[context.culture] || context.culture
    const adapter = this.engine.getCulturalAdapter(adapterName as any)

    if (!adapter) {
      console.warn(`找不到文化适配器: ${adapterName}`)
      return '未知地名'
    }

    // 委托给文化适配器生成地名
    try {
      return adapter.generatePlaceName(context)
    } catch (error) {
      console.error('地名生成失败:', error)
      return '地名生成失败'
    }
  }
}

// 招式命名策略
export class MoveNamingStrategy extends NamingStrategy {
  private moves = [
    '龙拳', '虎爪', '凤翼', '蛇击', '鹰眼', '熊抱', '狼扑', '猴拳',
    '剑气', '刀光', '枪影', '棍法', '掌力', '指功', '腿法', '身法',
    '破天', '裂地', '惊雷', '闪电', '烈火', '寒冰', '狂风', '暴雨'
  ]

  public generate(context: NamingContext): string {
    return this.moves[this.engine.seededRandomInt(this.moves.length)]
  }
}

// 装备命名策略
export class EquipmentNamingStrategy extends NamingStrategy {
  private equipment = [
    '青龙剑', '白虎刀', '朱雀弓', '玄武甲', '麒麟盾', '凤凰羽',
    '寒铁剑', '烈焰刀', '冰霜甲', '雷鸣弓', '风行靴', '地脉盾',
    '龙鳞甲', '凤羽衣', '虎骨环', '狼牙箭', '鹰眼石', '熊皮靴'
  ]

  public generate(context: NamingContext): string {
    return this.equipment[this.engine.seededRandomInt(this.equipment.length)]
  }
}

// 怪物命名策略
export class MonsterNamingStrategy extends NamingStrategy {
  private monsters = [
    '恶龙', '猛虎', '狂狼', '巨熊', '毒蛇', '凶鹰', '野猪', '黑豹',
    '石巨人', '木乃伊', '骷髅兵', '僵尸', '幽灵', '恶魔', '天使', '精灵',
    '火龙', '冰龙', '雷龙', '风龙', '土龙', '水龙', '光龙', '暗龙'
  ]

  public generate(context: NamingContext): string {
    return this.monsters[this.engine.seededRandomInt(this.monsters.length)]
  }
}

// 物品命名策略
export class ItemNamingStrategy extends NamingStrategy {
  private items = [
    '生命药水', '魔法药水', '力量卷轴', '智力卷轴', '敏捷卷轴', '体力卷轴',
    '金币', '银币', '铜币', '宝石', '珍珠', '水晶', '玉石', '玛瑙',
    '龙血', '凤羽', '虎骨', '狼皮', '鹰眼', '熊胆', '蛇毒', '鳞片'
  ]

  public generate(context: NamingContext): string {
    return this.items[this.engine.seededRandomInt(this.items.length)]
  }
}

// 默认命名策略
export class DefaultNamingStrategy extends NamingStrategy {
  private defaults = [
    '神秘物品', '未知存在', '奇特事物', '非凡现象', '奇妙造物',
    '独特个体', '特殊存在', '稀有物品', '珍贵事物', '非凡创造'
  ]

  public generate(context: NamingContext): string {
    return this.defaults[this.engine.seededRandomInt(this.defaults.length)]
  }
}