<template>
  <div class="outline-panel">
    <div class="panel-header">
      <div class="panel-title">
        <el-icon><List /></el-icon>
        <span>大纲</span>
      </div>
      <div class="panel-controls">
        <el-button
          :icon="Refresh"
          size="small"
          circle
          @click="refreshOutline"
        />
      </div>
    </div>

    <div class="outline-content">
      <div v-if="outlineItems.length === 0" class="empty-outline">
        <el-icon><Document /></el-icon>
        <p>暂无大纲内容</p>
        <p class="hint">添加标题后会自动生成大纲</p>
      </div>

      <div v-else class="outline-tree">
        <button
          v-for="item in outlineItems"
          :key="item.id"
          class="outline-item"
          :class="`level-${item.level}`"
          @click="navigateToItem(item)"
          :aria-label="`跳转到 ${item.text} (第${item.line}行)`"
          tabindex="0"
          @keydown.enter="navigateToItem(item)"
          @keydown.space.prevent="navigateToItem(item)"
        >
          <div class="item-text">
            <span class="level-indicator">H{{ item.level }}</span>
            {{ item.text }}
          </div>
          <div class="item-meta">行 {{ item.line }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElIcon } from 'element-plus'
import { List, Refresh, Document } from '@element-plus/icons-vue'
import { editorBridge, type OutlineItem } from '@/utils/editorBridge'

const outlineItems = ref<OutlineItem[]>([])
const autoRefreshTimer = ref<NodeJS.Timeout | null>(null)

const refreshOutline = () => {
  if (!editorBridge.isReady()) return

  outlineItems.value = editorBridge.generateOutline()
}

const navigateToItem = (item: OutlineItem) => {
  const position = editorBridge.getPositionFromLine(item.line)
  if (position) {
    editorBridge.scrollToPosition(position)
  }
}

const startAutoRefresh = () => {
  autoRefreshTimer.value = setInterval(() => {
    refreshOutline()
  }, 5000)
}

const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

onMounted(() => {
  refreshOutline()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style lang="scss" scoped>
.outline-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(8px, 1.2vh, 12px) clamp(12px, 1.5vw, 16px);
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  min-height: clamp(44px, 6vh, 56px);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1vw, 8px);
  font-weight: 600;
  font-size: clamp(0.9rem, 1.2vw, 1.1rem);
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: clamp(12px, 1.5vh, 16px);
}

.empty-outline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: clamp(160px, 25vh, 200px);
  color: #666;
  text-align: center;
  padding: clamp(16px, 2vh, 24px);

  .el-icon {
    font-size: clamp(36px, 5vw, 48px);
    margin-bottom: clamp(12px, 1.5vh, 16px);
    opacity: 0.5;
  }

  p {
    font-size: clamp(0.9rem, 1.2vw, 1rem);
    margin-bottom: clamp(8px, 1vh, 12px);
  }

  .hint {
    font-size: clamp(0.75rem, 1vw, 0.85rem);
    color: #999;
    margin-top: clamp(8px, 1vh, 12px);
  }
}

.outline-tree {
  .outline-item {
    padding: clamp(6px, 1vh, 10px) clamp(8px, 1.2vw, 12px);
    margin-bottom: clamp(3px, 0.5vh, 6px);
    border-left: clamp(2px, 0.3vw, 3px) solid #e9ecef;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 0 clamp(4px, 0.5vw, 6px);
    min-height: clamp(36px, 5vh, 44px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    border-left: clamp(2px, 0.3vw, 3px) solid #e9ecef;
    font-family: inherit;
    font-size: inherit;

    &:hover {
      background: #f8f9fa;
      border-left-color: #007bff;
      transform: translateX(2px);
    }

    &:focus-visible {
      outline: 2px solid #007bff;
      outline-offset: 2px;
      background: #f8f9fa;
      border-left-color: #007bff;
    }

    &:active {
      transform: translateX(1px);
      transition: transform 0.1s ease;
    }

    &.level-1 {
      border-left-color: #dc3545;
      margin-left: 0;
    }

    &.level-2 {
      border-left-color: #fd7e14;
      margin-left: clamp(12px, 2vw, 16px);
    }

    &.level-3 {
      border-left-color: #28a745;
      margin-left: clamp(24px, 3.5vw, 32px);
    }

    &.level-4 {
      border-left-color: #17a2b8;
      margin-left: clamp(36px, 5vw, 48px);
    }

    &.level-5 {
      border-left-color: #6f42c1;
      margin-left: clamp(48px, 6.5vw, 64px);
    }

    &.level-6 {
      border-left-color: #e83e8c;
      margin-left: clamp(60px, 8vw, 80px);
    }

    .item-text {
      display: flex;
      align-items: center;
      gap: clamp(6px, 1vw, 8px);
      font-weight: 500;
      margin-bottom: clamp(2px, 0.3vh, 4px);
      font-size: clamp(0.8rem, 1.1vw, 0.9rem);
      line-height: 1.3;

      .level-indicator {
        font-size: clamp(0.6rem, 0.8vw, 0.7rem);
        font-weight: 700;
        padding: clamp(2px, 0.3vh, 3px) clamp(4px, 0.6vw, 6px);
        border-radius: clamp(2px, 0.3vw, 3px);
        background: #007bff;
        color: white;
        min-height: clamp(16px, 2.5vh, 20px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .item-meta {
      font-size: clamp(0.7rem, 0.9vw, 0.75rem);
      color: #999;
      margin-left: clamp(20px, 3vw, 24px);
    }
  }
}

// 移动端优化
@media (max-width: 768px) {
  .outline-panel {
    .outline-tree {
      .outline-item {
        padding: clamp(8px, 1.5vh, 10px);
        margin-bottom: clamp(4px, 1vh, 6px);
        min-height: clamp(44px, 6vh, 48px);

        &.level-2 {
          margin-left: clamp(8px, 1.5vw, 12px);
        }

        &.level-3 {
          margin-left: clamp(16px, 2.5vw, 20px);
        }

        &.level-4 {
          margin-left: clamp(24px, 3.5vw, 28px);
        }

        &.level-5 {
          margin-left: clamp(32px, 4.5vw, 36px);
        }

        &.level-6 {
          margin-left: clamp(40px, 5.5vw, 44px);
        }

        .item-text {
          font-size: clamp(0.85rem, 1.2vw, 0.95rem);
          gap: clamp(4px, 1vw, 6px);
        }

        .item-meta {
          font-size: clamp(0.65rem, 1vw, 0.7rem);
          margin-left: clamp(16px, 2.5vw, 18px);
        }
      }
    }
  }
}

// 触摸设备优化
@media (hover: none) and (pointer: coarse) {
  .outline-tree {
    .outline-item {
      &:hover {
        transform: none;
      }

      &:active {
        transform: translateX(1px) scale(0.98);
        transition: transform 0.1s ease;
      }
    }
  }
}
</style>
