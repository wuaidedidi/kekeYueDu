<template>
  <div class="task-center">
    <div class="grid">
      <!-- 左：主要任务 -->
      <section class="panel main-tasks">
        <header class="panel-header">
          <h3>主要任务</h3>
          <span class="panel-sub">完成后可获得墨水，用于兑换权益</span>
        </header>
        <ul class="task-list">
          <li v-for="task in majorTasks" :key="task.key" class="task-item">
            <div class="task-info">
              <h4 class="task-title">{{ task.title }}</h4>
              <p class="task-desc">{{ task.desc }}</p>
            </div>
            <div class="task-actions">
              <span class="reward">+{{ task.reward }}</span>
              <el-button
                size="small"
                :type="task.done ? 'success' : 'primary'"
                :disabled="task.done || claiming"
                @click="claimTask(task)"
              >{{ task.done ? '已完成' : '领取' }}</el-button>
            </div>
          </li>
        </ul>
      </section>

      <!-- 右：每日任务 -->
      <section class="panel daily-tasks">
        <header class="panel-header">
          <h3>每日任务</h3>
          <span class="panel-sub">已领取奖励后，奖励将逐步增加</span>
        </header>
        <div class="daily-grid">
          <div
            v-for="task in dailyTasks"
            :key="task.key"
            class="daily-card"
            :class="{ done: task.done }"
          >
            <div class="daily-head">
              <span class="daily-title">{{ task.title }}</span>
              <span class="daily-reward">+{{ task.reward }}</span>
            </div>
            <div class="daily-actions">
              <el-button
                size="small"
                :type="task.done ? 'success' : 'primary'"
                :disabled="task.done || claiming"
                @click="claimTask(task)"
              >{{ task.done ? '已完成' : '领取' }}</el-button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/utils/http'

interface UIRewardTask {
  key: string
  title: string
  desc?: string
  reward: number
  done: boolean
}

defineProps<{ balance: number }>()
const emit = defineEmits<{ (e: 'recharged'): void }>()

const claiming = ref(false)

const majorTasks = ref<UIRewardTask[]>([
  { key: 'upload_shell', title: '上传抽题壳', desc: '首次上传抽题壳文件', reward: 10, done: false },
  { key: 'complete_profile', title: '完善个人信息', desc: '填写个人信息与偏好', reward: 5, done: false },
  { key: 'bind_phone', title: '绑定手机号', desc: '绑定手机号提升账号安全', reward: 5, done: false },
  { key: 'import_old_books', title: '导入旧书', desc: '从本地或云端导入旧书', reward: 20, done: false },
])

const dailyTasks = ref<UIRewardTask[]>([
  { key: 'signin', title: '签到', reward: 5, done: false },
  { key: 'collect', title: '收藏', reward: 5, done: false },
  { key: 'writing', title: '写作', reward: 5, done: false },
  { key: 'comment', title: '评论', reward: 5, done: false },
  { key: 'publish', title: '发布章节', reward: 5, done: false },
  { key: 'share', title: '分享', reward: 5, done: false },
  { key: 'upload_cover', title: '上传封面', reward: 20, done: false },
])

async function claimTask(task: UIRewardTask) {
  try {
    claiming.value = true
    const res = await http.post('/shop/recharge', { amount: task.reward })
    if (res.data?.success) {
      task.done = true
      ElMessage.success(`已领取 +${task.reward} 墨水`)
      emit('recharged')
    } else {
      ElMessage.error(res.data?.message || '领取失败')
    }
  } catch (err) {
    ElMessage.error('领取失败，请稍后重试')
  } finally {
    claiming.value = false
  }
}
</script>

<style scoped>
.task-center { max-width: 1200px; margin: 0 auto; padding: 24px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }

.panel { background: #fff; border: 1px solid #eaeaea; border-radius: 8px; }
.panel-header { display: flex; align-items: baseline; justify-content: space-between; padding: 16px; border-bottom: 1px solid #f0f0f0; }
.panel-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #1a1a1a; }
.panel-sub { font-size: 12px; color: #999; }

.task-list { list-style: none; padding: 0 20px 20px; margin: 0; }
.task-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 0; border-bottom: 1px dashed #f0f0f0; min-height: 80px; }
.task-item:last-child { border-bottom: none; }
.task-info { flex: 1; min-width: 0; margin-right: 24px; padding-top: 2px; }
.task-title { font-size: 14px; color: #1a1a1a; margin: 0 0 8px; line-height: 1.4; }
.task-desc { font-size: 12px; color: #666; margin: 0; line-height: 1.4; }
.task-actions { display: flex; align-items: center; gap: 16px; flex-shrink: 0; margin-top: 2px; min-width: 100px; justify-content: flex-end; }
.reward { font-size: 14px; font-weight: 600; color: #1a1a1a; white-space: nowrap; }

.daily-tasks { }
.daily-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 24px; }
.daily-card { border: 1px solid #eaeaea; border-radius: 8px; padding: 20px; background: #fff; transition: box-shadow .2s ease; min-height: 100px; display: flex; flex-direction: column; }
.daily-card:hover { box-shadow: 0 6px 12px rgba(0,0,0,.06); }
.daily-card.done { border-color: #52c41a; background: #f6ffed; }
.daily-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.daily-title { font-size: 14px; color: #1a1a1a; font-weight: 500; line-height: 1.4; flex: 1; }
.daily-reward { font-size: 12px; color: #666; white-space: nowrap; margin-left: 8px; }
.daily-actions { margin-top: auto; display: flex; justify-content: flex-end; }

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .daily-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>