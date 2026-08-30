<template>
  <el-form label-width="120px" label-position="left" class="account-league-field">
    <el-form-item label="账号状态">
      <el-tag :type="account.status.authenticated ? 'success' : 'info'">
        {{ account.status.authenticated ? `已登录 · ${account.status.accountName}` : '未登录' }}
      </el-tag>
      <el-button
        v-if="account.status.authenticated"
        class="account-league-field__button"
        :loading="account.busy"
        @click="logout"
      >退出账号</el-button>
    </el-form-item>

    <template v-if="!account.status.authenticated">
      <el-form-item label="网页登录">
        <el-button type="primary" :loading="account.busy" @click="openLogin">打开网页登录</el-button>
        <el-button :loading="account.busy" @click="completeLogin">我已完成登录</el-button>
      </el-form-item>
      <el-form-item v-if="showToken" label="会话令牌">
        <el-input
          v-model="token"
          class="account-league-field__token"
          type="password"
          show-password
          autocomplete="off"
          placeholder="输入国服 POESESSID"
          @keyup.enter="loginWithToken"
        />
        <el-button
          class="account-league-field__button"
          :disabled="!token.trim()"
          :loading="account.busy"
          @click="loginWithToken"
        >验证令牌</el-button>
      </el-form-item>
    </template>

    <el-form-item label="全局赛季">
      <div class="account-league-field__league">
        <el-select
          :model-value="account.settings.league"
          filterable
          :disabled="!account.status.authenticated"
          placeholder="选择商城配方与查价共用赛季"
          @change="changeLeague"
        >
          <el-option v-for="league in account.leagues" :key="league.id" :label="league.name" :value="league.id" />
        </el-select>
        <el-button :disabled="!account.status.authenticated" :loading="account.busy" @click="refreshLeagues">
          刷新赛季
        </el-button>
      </div>
    </el-form-item>
    <div class="account-league-field__hint">
      登录 Cookie 仅保存在独立 Electron Session 中；引导请求和日志不会包含凭证。
    </div>
  </el-form>
</template>

<script setup>
import { ref } from 'vue'
import { usePoeCnAccountStore } from '@/stores/poeCnAccount'

defineProps({ showToken: { type: Boolean, default: false } })
const emit = defineEmits(['configured'])
const account = usePoeCnAccountStore()
const token = ref('')

async function run(action, successMessage = '') {
  try {
    await account.run(action)
    if (successMessage) ElMessage.success(successMessage)
    emit('configured')
  } catch (error) {
    ElMessage.error(error?.message || '国服账号操作失败')
  }
}

function openLogin() {
  return run(
    () => account.openWebLogin(),
    '请在新窗口完成 QQ/国服登录；验证成功后窗口会自动关闭，也可手动确认'
  )
}

function completeLogin() {
  return run(() => account.completeWebLogin(), '国服网页登录成功')
}

function loginWithToken() {
  const value = token.value
  token.value = ''
  if (!value.trim()) return
  return run(() => account.setSessionToken(value), '国服会话验证成功')
}

function logout() {
  return run(() => account.logout(), '已退出国服账号')
}

function refreshLeagues() {
  return run(() => account.loadLeagues())
}

function changeLeague(league) {
  return run(() => account.setLeague(league), '全局赛季已更新')
}
</script>

<style scoped>
.account-league-field__button { margin-left: 12px; }
.account-league-field__token { max-width: 420px; }
.account-league-field__league {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 12px;
}
.account-league-field__league :deep(.el-select) { min-width: 0; flex: 1; }
.account-league-field__league .el-button { flex: 0 0 auto; }
.account-league-field__hint { margin-top: 4px; color: var(--text-secondary); font-size: 12px; }
</style>
