<template>
  <div class="ink-shop">
    <!-- 顶部导航栏 -->
    <div class="shop-nav">
      <div class="nav-container">
        <div class="nav-tabs">
          <div
            v-for="tab in navTabs"
            :key="tab.key"
            :class="['nav-tab', { active: currentTab === tab.key }]"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </div>
        </div>
        <div class="nav-right">
          <div class="balance-display">
            <span class="balance-amount">{{ userBalance.points }} 积分/墨水</span>
          </div>
          <el-button type="primary" size="small" class="upload-btn">
            抽题壳上传
          </el-button>
        </div>
      </div>
    </div>

    <!-- 内容区域：墨水商店 -->
    <div class="shop-content" v-if="currentTab === 'shop'">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <div
            v-for="filter in filterTabs"
            :key="filter.key"
            :class="['filter-tab', { active: currentFilter === filter.key }]"
            @click="switchFilter(filter.key)"
          >
            {{ filter.label }}
          </div>
        </div>
      </div>

      <!-- 商品列表区域 -->
      <div class="products-section">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="skeleton-grid">
            <div v-for="i in 6" :key="i" class="skeleton-card">
              <div class="skeleton-icon"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-subtitle"></div>
                <div class="skeleton-price"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 商品列表 -->
        <div v-else-if="products.length > 0" class="products-grid">
          <div
            v-for="product in products"
            :key="product.id"
            :class="['product-card', { owned: product.owned }]"
            @click="handleProductClick(product)"
            tabindex="0"
            @keydown.enter="handleProductClick(product)"
          >
            <div class="product-icon" :style="{ background: getProductBgColor(product) }">
              <span class="product-emoji">{{ getProductIcon(product) }}</span>
            </div>
            <div class="product-info">
              <div class="product-content">
                <h3 class="product-title">{{ product.title }}</h3>
                <p class="product-subtitle">{{ product.subtitle }}</p>
                <p class="product-description">{{ product.description }}</p>
                <div class="product-price-line">
                  <div class="price-info">
                    <span class="price-amount">{{ product.price }}</span>
                    <span class="price-unit">墨水</span>
                  </div>
                  <div class="product-meta">
                    <span v-if="product.duration_days" class="meta-info">
                      {{ product.duration_days }}天
                    </span>
                    <span v-else-if="product.times" class="meta-info">
                      {{ product.times }}次
                    </span>
                    <span v-else class="meta-info">永久</span>
                  </div>
                </div>
              </div>
              <div class="product-actions">
                <el-button
                  :type="getButtonType(product)"
                  :disabled="getButtonDisabled(product)"
                  size="small"
                  class="product-button"
                  @click.stop="handleRedeem(product)"
                >
                  {{ getButtonText(product) }}
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">📦</div>
          <p class="empty-text">暂无相关商品</p>
          <el-button @click="loadProducts" type="primary" plain>
            重新加载
          </el-button>
        </div>
      </div>
    </div>

    <!-- 内容区域：任务中心 -->
    <div v-else-if="currentTab === 'task'" class="shop-content">
      <TaskCenter :balance="userBalance.points" @recharged="loadUserBalance" />
    </div>

    <!-- 内容区域：邀请卡 -->
    <div v-else-if="currentTab === 'invite'" class="shop-content">
      <InviteCard :balance="userBalance.points" @recharged="loadUserBalance" />
    </div>

    <!-- 兑换确认弹窗 -->
    <el-dialog
      v-model="redeemDialogVisible"
      title="确认兑换"
      width="400px"
      :before-close="handleCloseRedeemDialog"
    >
      <div class="redeem-dialog-content" v-if="selectedProduct">
        <div class="redeem-product-info">
          <div class="redeem-product-icon" :style="{ background: getProductBgColor(selectedProduct) }">
            <span class="product-emoji">{{ getProductIcon(selectedProduct) }}</span>
          </div>
          <div class="redeem-product-details">
            <h4>{{ selectedProduct.title }}</h4>
            <p>{{ selectedProduct.subtitle }}</p>
            <div class="redeem-price">
              <span class="price-amount">{{ selectedProduct.price }}</span>
              <span class="price-unit">墨水</span>
            </div>
          </div>
        </div>

        <div class="balance-info">
          <div class="balance-item">
            <span class="label">当前余额：</span>
            <span class="value">{{ userBalance.points }} 墨水</span>
          </div>
          <div class="balance-item">
            <span class="label">兑换后余额：</span>
            <span class="value">{{ userBalance.points - selectedProduct.price }} 墨水</span>
          </div>
        </div>

        <div v-if="selectedProduct.duration_days" class="validity-info">
          有效期：{{ selectedProduct.duration_days }}天
        </div>
        <div v-else-if="selectedProduct.times" class="validity-info">
          使用次数：{{ selectedProduct.times }}次
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="redeemDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="redeeming"
            :disabled="userBalance.points < selectedProduct?.price"
            @click="confirmRedeem"
          >
            确认兑换
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/utils/http'
import TaskCenter from './TaskCenter.vue'
import InviteCard from './InviteCard.vue'

// 数据类型定义
interface ShopProduct {
  id: number
  title: string
  subtitle?: string
  description?: string
  type: string
  price: number
  charge_mode: string
  duration_days?: number
  times?: number
  activation_required?: boolean
  icon_url: string
  status: string
  stock?: number
  owned?: boolean
}

interface UserBalance {
  points: number
}

// 导航标签
const navTabs = [
  { key: 'task', label: '任务中心' },
  { key: 'shop', label: '墨水商店' },
  { key: 'invite', label: '邀请卡' }
]

// 筛选标签
const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'vip', label: '会员' },
  { key: 'coupon', label: '券类' },
  { key: 'tool', label: '工具' },
  { key: 'skin', label: '皮肤' }
]

// 响应式数据
const currentTab = ref('shop')
const currentFilter = ref('all')
const loading = ref(false)
const redeeming = ref(false)
const redeemDialogVisible = ref(false)
const selectedProduct = ref<ShopProduct | null>(null)

const products = ref<ShopProduct[]>([])
const userBalance = ref<UserBalance>({ points: 0 })

// 方法
const switchTab = (tab: string) => {
  currentTab.value = tab
  // 这里可以添加路由切换逻辑
  if (tab === 'task') {
    // 跳转到任务中心
  } else if (tab === 'invite') {
    // 跳转到邀请卡页面
  }
}

const switchFilter = (filter: string) => {
  currentFilter.value = filter
  loadProducts()
}

const loadProducts = async () => {
  try {
    loading.value = true
    const response = await http.get('/shop/products', {
      params: {
        type: currentFilter.value === 'all' ? undefined : currentFilter.value,
        status: 'active'
      }
    })

    if (response.data.success) {
      products.value = response.data.data || []
    } else {
      ElMessage.error('获取商品列表失败')
    }
  } catch (error) {
    console.error('Load products error:', error)
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const loadUserBalance = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    const response = await http.get('/shop/balance')

    if (response.data.success) {
      userBalance.value = response.data.data
    }
  } catch (error) {
    console.error('Load balance error:', error)
  }
}

const handleProductClick = (product: ShopProduct) => {
  // 点击商品卡片的处理逻辑
  selectedProduct.value = product
}

const handleRedeem = (product: ShopProduct) => {
  selectedProduct.value = product
  redeemDialogVisible.value = true
}

const getButtonType = (product: ShopProduct) => {
  if (product.owned) return 'success'
  if (userBalance.value.points < product.price) return 'info'
  return 'primary'
}

const getButtonDisabled = (product: ShopProduct) => {
  if (product.owned) return false
  return userBalance.value.points < product.price
}

const getButtonText = (product: ShopProduct) => {
  if (product.owned) return '已拥有'
  if (userBalance.value.points < product.price) return '余额不足'
  return '立即兑换'
}

const confirmRedeem = async () => {
  if (!selectedProduct.value) return

  try {
    redeeming.value = true
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.error('请先登录')
      return
    }

    const response = await http.post('/shop/redeem', {
      productId: selectedProduct.value.id,
      quantity: 1
    })

    if (response.data.success) {
      // 更新余额
      userBalance.value.points = response.data.data.newBalance

      // 更新商品状态
      const product = products.value.find(p => p.id === selectedProduct.value!.id)
      if (product) {
        product.owned = true
      }

      ElMessage.success('兑换成功！')
      redeemDialogVisible.value = false
    } else {
      if (response.data.message === '余额不足') {
        ElMessageBox.confirm(
          '您的墨水余额不足，是否前往任务中心赚取墨水？',
          '余额不足',
          {
            confirmButtonText: '去任务中心',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          switchTab('task')
        }).catch(() => {})
      } else {
        ElMessage.error(response.data.message || '兑换失败')
      }
    }
  } catch (error: any) {
    console.error('Redeem error:', error)
    if (error.response?.status === 402) {
      ElMessageBox.confirm(
        '您的墨水余额不足，是否前往任务中心赚取墨水？',
        '余额不足',
        {
          confirmButtonText: '去任务中心',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        switchTab('task')
      }).catch(() => {})
    } else {
      ElMessage.error('兑换失败，请重试')
    }
  } finally {
    redeeming.value = false
  }
}

const handleCloseRedeemDialog = () => {
  redeemDialogVisible.value = false
  selectedProduct.value = null
}

// 获取商品图标（根据商品类型返回对应的emoji）
const getProductIcon = (product: ShopProduct) => {
  const iconMap: Record<string, string> = {
    vip: '👑',        // VIP会员
    coupon: '🎫',     // 券类
    skin: '🎨',       // 皮肤
    tool: '🔧',       // 工具
    ai_tool: '🤖'     // AI工具
  }
  return iconMap[product.type] || '📦'
}

// 获取商品背景色（根据商品类型）
const getProductBgColor = (product: ShopProduct) => {
  const colorMap: Record<string, string> = {
    vip: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    coupon: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    skin: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    tool: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    ai_tool: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  }
  return colorMap[product.type] || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
}

// 生命周期
onMounted(() => {
  loadProducts()
  loadUserBalance()
})
</script>

<style scoped>
.ink-shop {
  width: 100%;
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.shop-nav {
  height: 56px;
  border-bottom: 1px solid #eaeaea;
  background: #ffffff;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-tabs {
  display: flex;
  gap: 32px;
}

.nav-tab {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding: 16px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.nav-tab:hover {
  color: #1677ff;
}

.nav-tab.active {
  color: #1677ff;
  border-bottom-color: #1677ff;
  font-weight: 500;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.balance-display {
  font-size: 14px;
  color: #666;
}

.balance-amount {
  font-weight: 500;
}

.upload-btn {
  height: 32px;
  border-radius: 6px;
}

/* 内容区域 */
.shop-content {
  flex: 1;
  overflow-y: auto;
  background: #fafafa;
}

/* 筛选栏 */
.filter-bar {
  background: #ffffff;
  border-bottom: 1px solid #eaeaea;
  padding: 0 24px;
}

.filter-tabs {
  display: flex;
  gap: 24px;
  padding: 16px 0;
}

.filter-tab {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.filter-tab:hover {
  background: #f0f7ff;
  color: #1677ff;
}

.filter-tab.active {
  background: #1677ff;
  color: #ffffff;
}

/* 商品列表区域 */
.products-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* 商品网格 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 24px;
}

/* 商品卡片 */
.product-card {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-height: 132px;
  height: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.product-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.product-card.owned {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.product-card.owned .product-title {
  color: #6c757d;
}

.product-card:focus {
  outline: 2px solid #1677ff;
  outline-offset: 2px;
}

.product-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-emoji {
  font-size: 32px;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100px;
  justify-content: space-between;
}

.product-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-right: 8px;
}

.product-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 12px;
  padding-top: 8px;
}

.product-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.product-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.product-description {
  font-size: 13px;
  color: #999;
  margin: 0 0 14px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.product-price-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-amount {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.price-unit {
  font-size: 12px;
  color: #666;
}

.product-meta {
  font-size: 12px;
  color: #999;
}

.meta-info {
  font-size: 12px;
  color: #666;
}

.product-button {
  width: auto;
  min-width: 80px;
  height: 32px;
  flex-shrink: 0;
  font-size: 13px;
}

/* 骨架屏 */
.loading-container {
  padding: 24px 0;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
}

.skeleton-card {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  height: 132px;
}

.skeleton-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.skeleton-title {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  width: 80%;
}

.skeleton-subtitle {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  width: 60%;
  margin-top: 8px;
}

.skeleton-price {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  width: 40%;
  margin-top: 12px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 24px;
}

/* 兑换弹窗 */
.redeem-dialog-content {
  padding: 0;
}

.redeem-product-info {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eaeaea;
}

.redeem-product-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.redeem-product-details h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1a1a1a;
}

.redeem-product-details p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.redeem-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.redeem-price .price-amount {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.redeem-price .price-unit {
  font-size: 14px;
  color: #666;
}

.balance-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.balance-item:last-child {
  margin-bottom: 0;
}

.balance-item .label {
  font-size: 14px;
  color: #666;
}

.balance-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.validity-info {
  font-size: 14px;
  color: #666;
  background: #fff7e6;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #faad14;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 16px;
  }

  .nav-tabs {
    gap: 20px;
  }

  .products-section {
    padding: 16px;
  }

  .products-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .product-card {
    height: auto;
    min-height: 120px;
  }
}
</style>