<template>
  <div class="invite-card">
    <div class="grid">
      <!-- 左：邀请卡信息 -->
      <section class="panel">
        <header class="panel-header">
          <h3>邀请卡</h3>
          <span class="panel-sub">邀请好友加入，双方均可获墨水</span>
        </header>
        <div class="card-body">
          <div class="card-block">
            <h4 class="title">我的邀请码</h4>
            <p class="desc">分享给好友，TA注册后你可获奖励</p>
            <div class="actions">
              <el-button type="primary" size="small" :disabled="claiming" @click="claim(20)">复制并领取 +20</el-button>
            </div>
          </div>
          <div class="card-block">
            <h4 class="title">成为 VIP</h4>
            <p class="desc">订阅后立享全部功能，额外获墨水</p>
            <div class="actions">
              <el-button type="primary" plain size="small" :disabled="claiming" @click="claim(50)">订阅奖励 +50</el-button>
            </div>
          </div>
        </div>
      </section>

      <!-- 右：空状态预留 -->
      <section class="panel">
        <header class="panel-header">
          <h3>邀请记录</h3>
          <span class="panel-sub">近期邀请明细</span>
        </header>
        <div class="empty">
          <div class="empty-icon">🧑‍🤝‍🧑</div>
          <p class="empty-text">暂无邀请记录</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/utils/http'

defineProps<{ balance: number }>()
const emit = defineEmits<{ (e: 'recharged'): void }>()

const claiming = ref(false)

async function claim(amount: number) {
  try {
    claiming.value = true
    const res = await http.post('/shop/recharge', { amount })
    if (res.data?.success) {
      ElMessage.success(`领取成功 +${amount} 墨水`)
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
.invite-card { max-width: 1200px; margin: 0 auto; padding: 24px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }
.panel { background: #fff; border: 1px solid #eaeaea; border-radius: 8px; }
.panel-header { display: flex; align-items: baseline; justify-content: space-between; padding: 20px; border-bottom: 1px solid #f0f0f0; }
.panel-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #1a1a1a; }
.panel-sub { font-size: 12px; color: #999; }
.card-body { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; }
.card-block { border: 1px dashed #eaeaea; border-radius: 8px; padding: 24px; background: #fcfcfc; min-height: 140px; display: flex; flex-direction: column; }
.title { margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #1a1a1a; }
.desc { margin: 0 0 20px; font-size: 13px; color: #666; line-height: 1.4; flex-grow: 1; }
.actions { margin-top: auto; display: flex; gap: 16px; flex-wrap: wrap; }
.empty { text-align: center; padding: 40px; }
.empty-icon { font-size: 36px; opacity: .6; margin-bottom: 8px; }
.empty-text { font-size: 14px; color: #999; }

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .card-body { grid-template-columns: 1fr; }
}
</style>