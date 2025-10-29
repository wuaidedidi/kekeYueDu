<template>
  <div class="user-info">
    <el-dropdown @command="handleCommand">
      <span class="user-dropdown">
        <el-avatar :size="32" :src="userStore.user?.avatar">
          {{ userStore.user?.username?.charAt(0).toUpperCase() }}
        </el-avatar>
        <span class="username">{{ userStore.user?.username }}</span>
        <el-icon class="el-icon--right">
          <arrow-down />
        </el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="profile">
            <el-icon><user /></el-icon>
            个人资料
          </el-dropdown-item>
          <el-dropdown-item command="settings">
            <el-icon><setting /></el-icon>
            设置
          </el-dropdown-item>
          <el-dropdown-item divided command="logout">
            <el-icon><switch-button /></el-icon>
            退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 个人资料对话框 -->
    <el-dialog
      v-model="profileVisible"
      title="个人资料"
      width="400px"
      @close="resetProfileForm"
    >
      <el-form :model="profileForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="profileForm.email"
            placeholder="请输入邮箱"
            :disabled="!editingProfile"
          />
        </el-form-item>
        <el-form-item label="注册时间">
          <el-input v-model="profileForm.created_at" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="profileVisible = false">取消</el-button>
          <el-button
            v-if="!editingProfile"
            type="primary"
            @click="editingProfile = true"
          >
            编辑
          </el-button>
          <el-button
            v-else
            type="primary"
            @click="saveProfile"
            :loading="saving"
          >
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '@/store/userStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, User, Setting, SwitchButton } from '@element-plus/icons-vue'
import http from '@/utils/http'

const userStore = useUserStore()

// 个人资料对话框
const profileVisible = ref(false)
const editingProfile = ref(false)
const saving = ref(false)

const profileForm = reactive({
  username: '',
  email: '',
  created_at: ''
})

// 显示个人资料
const showProfile = () => {
  if (userStore.user) {
    profileForm.username = userStore.user.username
    profileForm.email = userStore.user.email || ''
    profileForm.created_at = new Date(userStore.user.created_at).toLocaleDateString()
    profileVisible.value = true
    editingProfile.value = false
  }
}

// 保存个人资料
const saveProfile = async () => {
  if (!userStore.user) return

  // 邮箱格式验证
  if (profileForm.email && profileForm.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(profileForm.email)) {
      ElMessage.error('邮箱格式不正确')
      return
    }
  }

  saving.value = true
  try {
    const response = await http.put('/profile', {
      userId: userStore.user.id,
      updates: {
        email: profileForm.email.trim() || null
      }
    })

    if (response.data.success) {
      userStore.updateUser({
        email: profileForm.email.trim() || undefined
      })
      ElMessage.success('保存成功')
      editingProfile.value = false
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error: any) {
    console.error('保存个人资料错误:', error)
    const message = error.response?.data?.message || '保存失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetProfileForm = () => {
  editingProfile.value = false
  saving.value = false
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      showProfile()
      break
    case 'settings':
      ElMessage.info('设置功能开发中...')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    userStore.logout()
    ElMessage.success('已退出登录')
  }).catch(() => {
    // 用户取消
  })
}
</script>

<style scoped>
.user-info {
  display: inline-block;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: var(--el-fill-color-light);
}

.username {
  margin: 0 8px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>