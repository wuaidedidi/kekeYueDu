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
              src="https://via.placeholder.com/150"
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
import { ref } from 'vue'
import http from '@/utils/http'
import { ElMessage } from 'element-plus'

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

// 登录操作
const login = async () => {
  if (!agree.value) {
    return alert('请先同意用户协议和隐私政策')
  }
  try {
    const response = await http.post('/api/login', {
      username: accountLoginForm.value.username,
      password: accountLoginForm.value.password,
    })
    console.log(response.status)
    if (response.status >= 200 && response.status < 300) {
      ElMessage({
        message: '登陆成功',
        type: 'success',
      })
      router.push('/workspace/all-books')
    } else {
      ElMessage({
        message: '登陆失败',
        type: 'warning',
      })
    }
  } catch (error) {
    ElMessage({
      message: '登陆失败',
      type: 'warning',
    })
  }
}

const register = async () => {
  const { username, password, confirmPassword } = accountRegisterForm.value

  // 表单验证
  if (!username || !password || !confirmPassword) {
    return alert('请填写所有字段')
  }
  if (password !== confirmPassword) {
    return alert('两次输入的密码不一致')
  }

  try {
    const response = await fetch('http://localhost:8080/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }), // 只需传递用户名和密码
    })

    if (response.ok) {
      alert('注册成功！')
      // 清空表单
      accountRegisterForm.value = {
        username: '',
        password: '',
        confirmPassword: '',
      }
      showRegister.value = false // 返回登录界面
      router.push('workspace/all-books')
    } else {
      const errorMessage = await response.text()
      alert('注册失败：' + errorMessage)
    }
  } catch (error) {
    alert('注册失败：' + error.message)
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
  background-image: url('/login/loginBackground.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-box {
  width: 400px;
  padding: 30px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.el-tabs {
  margin-bottom: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 调整每个元素的垂直间距 */
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
