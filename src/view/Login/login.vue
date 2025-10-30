<template>
  <div class="login-container">
    <div class="login-box">
      <el-tabs
        v-model="activeTab"
        @tab-click="handleTabClick"
        stretch
        v-if="!showRegister"
      >
        <!-- 账号登录标签 -->
        <el-tab-pane label="账号登录" name="account">
          <el-form :model="accountLoginForm" label-width="0" class="login-form">
            <el-form-item>
              <el-input
                v-model="accountLoginForm.username"
                placeholder="请输入账号"
                required
              />
            </el-form-item>
            <el-form-item>
              <el-input
                type="password"
                v-model="accountLoginForm.password"
                placeholder="请输入密码"
                required
              />
            </el-form-item>
            <el-form-item class="username-password-row">
              <span class="forgot-password">忘记密码？</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" class="login-btn" @click="login" round
                >登录</el-button
              >
            </el-form-item>
            <el-form-item class="link-row">
              <div class="link-container">
                <span class="link" @click="showRegister = true">免费注册</span>
              </div>
            </el-form-item>
            <el-form-item class="disclaimer">
              <el-checkbox v-model="agree"
                >登录即代表您同意我们的 <a href="#">用户协议</a> 和
                <a href="#">隐私政策</a></el-checkbox
              >
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- QQ 登录标签 -->
        <el-tab-pane label="QQ登录" name="qq">
          <div class="qq-login-box">
            <el-button
              type="primary"
              class="full-width-btn"
              @click="redirectToQQ"
              >跳转到 QQ 登录页面</el-button
            >
          </div>
        </el-tab-pane>

        <!-- 微信扫码登录标签 -->
        <el-tab-pane label="微信登录" name="wechat">
          <div class="wechat-login-box">
            <p>请使用微信扫一扫进行登录</p>
            <img
              :src="wechatQrcodeSrc"
              alt="微信二维码"
              class="wechat-qrcode"
            />
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 注册标签 -->
      <div v-if="showRegister">
        <div style="font-size: large; font-weight: bolder; margin-bottom: 15px">
          用户注册
        </div>
        <el-form
          :model="accountRegisterForm"
          label-width="0"
          class="login-form"
        >
          <el-form-item>
            <el-input
              v-model="accountRegisterForm.username"
              placeholder="请输入账号"
              required
            />
          </el-form-item>
          <el-form-item>
            <el-input
              type="password"
              v-model="accountRegisterForm.password"
              placeholder="请输入密码"
              required
            />
          </el-form-item>
          <el-form-item>
            <el-input
              type="password"
              v-model="accountRegisterForm.confirmPassword"
              placeholder="请确认密码"
              required
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="login-btn" @click="register" round
              >注册</el-button
            >

            <el-button
              type="default"
              class="login-btn"
              @click="showRegister = false"
              round
              >返回登录</el-button
            >
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import router from '@/router'
import { ref, nextTick } from 'vue'
import http from '@/utils/http'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/userStore'
// 本地二维码占位图，避免外链被阻断
const wechatQrcodeSrc = new URL('../../assets/logo.png', import.meta.url).href

// 当前激活的标签
const activeTab = ref('account')

// 控制注册面板的显示
const showRegister = ref(false)

// 账号登录表单
const accountLoginForm = ref({
  username: '',
  password: '',
})

// 账号注册表单
const accountRegisterForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
})

// 用户同意复选框
const agree = ref(false)
// 用户状态管理
const userStore = useUserStore()

// 登录操作
const login = async () => {
  if (!agree.value) {
    ElMessage({
      message: '请先同意用户协议和隐私政策',
      type: 'warning',
    })
    return
  }

  // 基础验证
  if (!accountLoginForm.value.username || !accountLoginForm.value.password) {
    ElMessage({
      message: '请输入用户名和密码',
      type: 'warning',
    })
    return
  }

  try {
    const response = await http.post('/login', {
      username: accountLoginForm.value.username.trim(),
      password: accountLoginForm.value.password,
    })

    if (response.data.success) {
      // 通过 Pinia Store 保存用户信息和 token，确保路由守卫识别为已登录
      userStore.setUser(response.data.data.user, response.data.data.token)

      ElMessage({
        message: response.data.message,
        type: 'success',
      })

      // 使用 nextTick 确保状态更新完成后再跳转
      await nextTick()
      router.push('/workspace/all-books')
    } else {
      ElMessage({
        message: response.data.message || '登录失败',
        type: 'error',
      })
    }
  } catch (error: any) {
    console.error('登录错误:', error)
    const message = error.response?.data?.message || '网络错误，请稍后重试'
    ElMessage({
      message: message,
      type: 'error',
    })
  }
}

const register = async () => {
  const { username, password, confirmPassword } = accountRegisterForm.value

  // 基础验证
  if (!username || !password || !confirmPassword) {
    ElMessage({
      message: '请填写所有字段',
      type: 'warning',
    })
    return
  }

  if (password !== confirmPassword) {
    ElMessage({
      message: '两次输入的密码不一致',
      type: 'warning',
    })
    return
  }

  // 用户名长度验证
  if (username.trim().length < 3) {
    ElMessage({
      message: '用户名至少需要3个字符',
      type: 'warning',
    })
    return
  }

  if (username.trim().length > 20) {
    ElMessage({
      message: '用户名不能超过20个字符',
      type: 'warning',
    })
    return
  }

  // 密码强度验证
  if (password.length < 6) {
    ElMessage({
      message: '密码至少需要6个字符',
      type: 'warning',
    })
    return
  }

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasLetter || !hasNumber) {
    ElMessage({
      message: '密码必须包含字母和数字',
      type: 'warning',
    })
    return
  }

  try {
    const response = await http.post('/register', {
      username: username.trim(),
      password,
      confirmPassword
    })

    if (response.data.success) {
      ElMessage({
        message: response.data.message,
        type: 'success',
      })

      // 清空表单
      accountRegisterForm.value = {
        username: '',
        password: '',
        confirmPassword: '',
      }

      // 自动切换到登录界面
      showRegister.value = false

      // 预填用户名
      accountLoginForm.value.username = username.trim()
    } else {
      ElMessage({
        message: response.data.message || '注册失败',
        type: 'error',
      })
    }
  } catch (error: any) {
    console.error('注册错误:', error)
    const message = error.response?.data?.message || error.message || '网络错误，请稍后重试'
    ElMessage({
      message: '注册失败：' + message,
      type: 'error',
    })
  }
}

// QQ 登录跳转
const redirectToQQ = () => {
  window.open('https://qzone.qq.com/')
}

// 标签切换事件处理
const handleTabClick = (tab) => {
  console.log('切换到标签:', tab.name)
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  min-height: 500px; // 最小高度
  background-image: url('/login_assets/loginBackground.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1rem; // 添加内边距防止贴边
}

.login-box {
  width: clamp(320px, 40vw, 480px); // 响应式宽度
  max-width: 90vw; // 最大宽度不超过视窗90%
  padding: clamp(1.5rem, 4vw, 2.5rem); // 响应式内边距
  background-color: rgba(255, 255, 255, 0.95); // 添加透明度
  backdrop-filter: blur(10px); // 背景模糊效果
  border-radius: clamp(8px, 2vw, 16px); // 响应式圆角
  box-shadow: 0 clamp(2px, 0.5vw, 12px) rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 clamp(4px, 1vw, 20px) rgba(0, 0, 0, 0.15);
  }
}

.el-tabs {
  margin-bottom: clamp(1rem, 2vh, 1.5rem);

  :deep(.el-tabs__header) {
    margin-bottom: clamp(1.5rem, 3vh, 2rem);
  }

  :deep(.el-tabs__item) {
    font-size: clamp(0.875rem, 1.2vw, 1rem);
    padding: clamp(0.75rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.5rem);
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
    border-radius: 2px;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: clamp(1.25rem, 3vh, 1.75rem); // 响应式间距

  .el-form-item {
    margin-bottom: 0; // 移除默认的margin，使用gap控制间距

    :deep(.el-form-item__label) {
      font-size: clamp(0.875rem, 1.1vw, 1rem);
      line-height: 1.4;
      padding-bottom: 0.5rem;
    }

    :deep(.el-input__wrapper) {
      border-radius: clamp(6px, 1vw, 8px);
      padding: clamp(0.5rem, 1vh, 0.75rem) clamp(0.75rem, 1.5vw, 1rem);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }
    }

    :deep(.el-input__inner) {
      font-size: clamp(0.875rem, 1.1vw, 1rem);
      line-height: 1.4;
    }
  }

  .el-button {
    margin-top: clamp(0.5rem, 1vh, 0.75rem);
    height: clamp(2.5rem, 5vh, 3rem);
    border-radius: clamp(6px, 1.5vw, 8px);
    font-size: clamp(0.875rem, 1.1vw, 1rem);
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(98, 106, 239, 0.3);
    }
  }
}

// 社交登录按钮
.social-login {
  display: flex;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  margin-top: clamp(1rem, 2vh, 1.5rem);

  .el-button {
    flex: 1;
    height: clamp(2.25rem, 4.5vh, 2.75rem);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    :deep(span) {
      font-size: clamp(0.75rem, 1vw, 0.875rem);
    }
  }
}

// 响应式断点
@media screen and (max-width: 768px) {
  .login-container {
    padding: 0.5rem;
  }

  .login-box {
    width: 95vw;
    max-width: 400px;
    padding: 1.5rem;
  }

  .login-form {
    gap: 1rem;
  }
}

@media screen and (max-width: 480px) {
  .login-container {
    align-items: flex-start; // 小屏幕从顶部开始
    padding-top: 2rem;
  }

  .login-box {
    width: 100vw;
    max-width: none;
    border-radius: clamp(8px, 2vw, 12px) clamp(8px, 2vw, 12px) 0 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .login-form {
    gap: 1.25rem;
  }
}

.username-password-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.forgot-password {
  margin-left: auto;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
}

.link-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
}

.link-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.divider {
  color: #ccc;
}

.disclaimer {
  display: flex;
  justify-content: center;
  font-size: 12px;
  color: #999;
}

.disclaimer a {
  color: #409eff;
}

.login-btn {
  margin-left: 0px !important;
  margin-bottom: 10px;
  width: 100%; /* 按钮宽度100% */
  height: 40px;
}

.qq-login-box,
.wechat-login-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.full-width-btn {
  width: 100%; /* 按钮宽度100% */
}

.wechat-qrcode {
  width: 150px;
  height: 150px;
  margin-top: 10px;
}
</style>
