<template>
    <div class="plugin-manager">
      <!-- 顶部控制台 -->
      <div class="control-panel">
        <div class="panel-left">
          <div class="search-container">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="搜索插件..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="search-field"
            ></v-text-field>
          </div>
        </div>
        
        <div class="panel-right">
          <!-- 快速重载按钮 -->
          <v-menu v-if="lastReloadPlugins.length > 0" offset-y>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="outlined"
                size="small"
                class="control-btn quick-reload-btn"
                prepend-icon="mdi-lightning-bolt"
              >
                快速重载
                <v-badge
                  :content="lastReloadPlugins.length"
                  color="warning"
                  inline
                ></v-badge>
              </v-btn>
            </template>
            
                      <v-card class="quick-reload-menu" elevation="8">
            <v-card-text class="pa-2">
              <div class="quick-reload-header">
                <span class="text-caption">最近重载的插件</span>
                <v-btn
                  size="x-small"
                  variant="text"
                  @click="toggleAllQuickReload"
                  class="select-all-btn"
                >
                  {{ allQuickReloadSelected ? '取消全选' : '全选' }}
                </v-btn>
              </div>
              
              <div class="quick-reload-list">
                <div
                  v-for="plugin in lastReloadPlugins.slice(0, 6)"
                  :key="plugin.id"
                  class="quick-reload-item-wrapper"
                  :class="{ 'selected': selectedQuickReloadIds.has(plugin.id) }"
                  @click="toggleQuickReloadSelection(plugin.id)"
                >
                  <v-checkbox
                    :model-value="selectedQuickReloadIds.has(plugin.id)"
                    @click.stop
                    @change="toggleQuickReloadSelection(plugin.id)"
                    hide-details
                    density="compact"
                    class="quick-reload-checkbox"
                  ></v-checkbox>
                  
                  <v-avatar size="16" class="mr-2">
                    <v-img v-if="plugin.icon" :src="getPluginIconPath(plugin.icon)">
                      <template v-slot:placeholder>
                        <v-icon size="12">mdi-puzzle</v-icon>
                      </template>
                    </v-img>
                    <v-icon v-else size="12">mdi-puzzle</v-icon>
                  </v-avatar>
                  
                  <span class="quick-reload-name">{{ plugin.name }}</span>
                </div>
              </div>
              
              <v-divider class="my-2"></v-divider>
              
              <div class="quick-reload-actions">
                <v-btn
                  size="small"
                  variant="outlined"
                  @click="reloadSelectedPlugins"
                  :loading="quickReloadLoading"
                  :disabled="selectedQuickReloadIds.size === 0"
                  prepend-icon="mdi-reload"
                  class="mr-2"
                >
                  重载选中 ({{ selectedQuickReloadIds.size }})
                </v-btn>
                
                <v-btn
                  size="small"
                  variant="tonal"
                  @click="reloadAllRecent"
                  :loading="quickReloadLoading"
                  prepend-icon="mdi-reload-alert"
                >
                  全部重载
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
          </v-menu>
          
          <v-btn
            variant="outlined"
            size="small"
            @click="refreshPlugins"
            :loading="loading"
            class="control-btn"
            prepend-icon="mdi-refresh"
          >
            刷新
          </v-btn>
          
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="emit('close')"
            class="control-btn close-btn"
          ></v-btn>
        </div>
      </div>
  
      <!-- 状态监控面板 -->
      <div class="status-grid">
        <div class="status-card" v-for="(stat, index) in statusStats" :key="index">
          <div class="status-indicator">
            <v-icon :icon="stat.icon" size="18"></v-icon>
          </div>
          <div class="status-data">
            <div class="status-value">{{ stat.value }}</div>
            <div class="status-label">{{ stat.label }}</div>
          </div>
          <div class="status-glow"></div>
        </div>
      </div>
  
      <!-- 全局消息 -->
      <v-alert
        v-if="globalMessage"
        :type="globalMessageType"
        variant="tonal"
        closable
        @click:close="clearMessage"
        class="mb-3 alert-panel"
      >
        {{ globalMessage }}
      </v-alert>
  
      <!-- 加载状态 -->
      <div v-if="loading && !dataLoaded" class="loading-panel">
        <div class="loading-content">
          <v-progress-circular indeterminate size="32" width="3"></v-progress-circular>
          <div class="loading-text">系统扫描中...</div>
        </div>
      </div>
  
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-panel">
        <v-icon size="48" class="mb-3">mdi-alert-octagon</v-icon>
        <div class="error-title">系统故障</div>
        <div class="error-message">{{ error }}</div>
        <v-btn @click="refreshPlugins" variant="outlined" class="mt-3">
          重新连接
        </v-btn>
      </div>
  
      <!-- 空状态 -->
      <div v-else-if="filteredPlugins.length === 0" class="empty-panel">
        <v-icon size="64" class="mb-3">mdi-package-variant-closed</v-icon>
        <div class="empty-title">{{ searchQuery ? '未发现目标' : '插件库为空' }}</div>
        <div class="empty-subtitle">
          {{ searchQuery ? '调整搜索参数' : '等待插件部署' }}
        </div>
      </div>
  
      <!-- 插件矩阵 -->
      <div v-else class="plugin-matrix">
        <div
          v-for="plugin in filteredPlugins"
          :key="plugin.id"
          class="plugin-module"
          :class="{
            'module-active': plugin.running,
            'module-installed': plugin.installed,
            'module-local': plugin.type === 'local'
          }"
        >
          <!-- 模块头部 -->
          <div class="module-header">
            <div class="module-avatar">
              <v-avatar size="32" class="plugin-avatar">
                <v-img
                  v-if="plugin.icon"
                  :src="getPluginIconPath(plugin.icon)"
                  @error="handleImageError"
                >
                  <template v-slot:placeholder>
                    <v-icon size="18">mdi-puzzle</v-icon>
                  </template>
                </v-img>
                <v-icon v-else size="18">mdi-puzzle</v-icon>
              </v-avatar>
              <div class="status-dot" :class="getStatusClass(plugin)"></div>
            </div>
            
            <div class="module-info">
              <div class="module-name">{{ plugin.name }}</div>
              <div class="module-meta">v{{ plugin.version }} • {{ plugin.author }}</div>
            </div>
            
            <div class="module-status">
              <v-chip
                size="x-small"
                :color="getStatusColor(plugin)"
                variant="flat"
                class="status-chip"
              >
                {{ getStatusText(plugin) }}
              </v-chip>
            </div>
          </div>
  
          <!-- 模块标签 -->
          <div class="module-tags">
            <v-chip
              size="x-small"
              :color="plugin.type === 'local' ? 'primary' : 'info'"
              variant="outlined"
              class="type-chip"
            >
              {{ plugin.type === 'local' ? '本地' : '在线' }}
            </v-chip>
            
            <v-chip
              v-if="plugin.has_update"
              size="x-small"
              color="error"
              variant="flat"
              class="update-chip"
            >
              有更新
            </v-chip>
          </div>
  
          <!-- 模块控制 -->
          <div class="module-controls">
            <v-btn
              v-if="plugin.installed"
              size="small"
              variant="outlined"
              @click="reloadPlugin(plugin)"
              :loading="reloadingPlugins.has(plugin.id)"
              class="control-action reload-action"
              prepend-icon="mdi-reload"
            >
              重载
            </v-btn>
            
            <v-btn
              v-if="plugin.installed && plugin.type !== 'local'"
              size="small"
              variant="outlined"
              @click="showReinstallDialog(plugin)"
              :loading="reinstallingPlugins.has(plugin.id)"
              class="control-action reinstall-action"
              prepend-icon="mdi-download"
            >
              重装
            </v-btn>
            
            <v-btn
              size="small"
              color="error"
              variant="text"
              @click="showActionDialog(plugin)"
              class="control-action danger-action"
              :prepend-icon="plugin.installed ? 'mdi-delete' : 'mdi-folder-remove'"
            >
              {{ plugin.installed ? '卸载' : '清理' }}
            </v-btn>
          </div>
  
          <!-- 加载遮罩 -->
          <div
            v-if="reloadingPlugins.has(plugin.id) || reinstallingPlugins.has(plugin.id)"
            class="module-overlay"
          >
            <v-progress-circular indeterminate size="20" width="2"></v-progress-circular>
            <div class="overlay-text">
              {{ reloadingPlugins.has(plugin.id) ? '重载中...' : '重装中...' }}
            </div>
          </div>
        </div>
      </div>
  
      <!-- 重装确认对话框 -->
      <v-dialog v-model="reinstallDialog" max-width="500">
        <v-card class="dialog-card">
          <v-card-title class="dialog-header">
            <v-icon color="purple" size="24" class="mr-2">mdi-download-circle</v-icon>
            <span class="dialog-title">重装插件</span>
          </v-card-title>
          
          <v-card-text class="dialog-content">
            <div class="target-info">
              <div class="target-name">{{ selectedPlugin?.name }}</div>
              <div class="target-meta">
                当前版本: {{ selectedPlugin?.version }} | 作者: {{ selectedPlugin?.author }}
              </div>
            </div>
            
            <v-alert
              type="info"
              variant="tonal"
              class="mb-3 info-alert"
            >
              重装将从仓库重新下载最新版本的插件，并保留现有配置
            </v-alert>
            
            <div class="repo-info">
              <div class="info-section">
                <div class="info-label">
                  <v-icon size="16" class="mr-1">mdi-source-repository</v-icon>
                  插件仓库
                </div>
                <div 
                  class="info-value repo-clickable" 
                  @click="toggleRepoUrlDisplay"
                  :title="showFullRepoUrl ? '点击显示简洁名称' : '点击显示完整URL'"
                >
                  {{ getRepoDisplayName(onlinePluginInfo?.repo_url || selectedPlugin?.repo_url) }}
                  <v-icon size="12" class="ml-1">{{ showFullRepoUrl ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                </div>
              </div>
              
              <div class="info-section">
                <div class="info-label">
                  <v-icon size="16" class="mr-1">mdi-tag</v-icon>
                  当前版本
                </div>
                <div class="info-value">v{{ selectedPlugin?.version }}</div>
              </div>
              
              <div class="info-section">
                <div class="info-label">
                  <v-icon size="16" class="mr-1">mdi-cloud-download</v-icon>
                  最新版本
                </div>
                <div class="info-value">{{ onlinePluginInfo?.plugin_version ? `v${onlinePluginInfo.plugin_version}` : '获取中...' }}</div>
              </div>
              
              <div class="info-section">
                <div class="info-label">
                  <v-icon size="16" class="mr-1">mdi-update</v-icon>
                  更新状态
                </div>
                <div class="info-value">
                  <v-chip
                    size="small"
                    :color="getUpdateStatusColor()"
                    variant="flat"
                  >
                    {{ getUpdateStatusText() }}
                  </v-chip>
                </div>
              </div>
            </div>
          </v-card-text>
          
          <v-card-actions class="dialog-actions">
            <v-btn @click="reinstallDialog = false" variant="text">取消</v-btn>
            <v-btn
              color="purple"
              @click="confirmReinstall"
              :loading="actionLoading"
              variant="outlined"
            >
              确认重装
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 操作确认对话框 -->
      <v-dialog v-model="actionDialog" max-width="400">
        <v-card class="dialog-card">
          <v-card-title class="dialog-header">
            <v-icon
              :color="selectedPlugin?.installed ? 'error' : 'warning'"
              size="24"
              class="mr-2"
            >
              {{ selectedPlugin?.installed ? 'mdi-delete-alert' : 'mdi-folder-remove' }}
            </v-icon>
            <span class="dialog-title">
              {{ selectedPlugin?.installed ? '卸载模块' : '清理文件' }}
            </span>
          </v-card-title>
          
          <v-card-text class="dialog-content">
            <div class="target-info">
              <div class="target-name">{{ selectedPlugin?.name }}</div>
              <div class="target-meta">
                版本: {{ selectedPlugin?.version }} | 作者: {{ selectedPlugin?.author }}
              </div>
            </div>
            
            <v-alert
              :type="selectedPlugin?.installed ? 'warning' : 'error'"
              variant="tonal"
              class="mb-3 warning-alert"
            >
              {{ selectedPlugin?.installed 
                ? '此操作将卸载插件并可选择清理相关数据' 
                : '此操作将强制删除插件文件夹，无法恢复' 
              }}
            </v-alert>
            
            <div class="option-list">
              <div class="option-header">
                <span class="option-title">清理选项</span>
                <v-btn
                  size="x-small"
                  variant="text"
                  @click="toggleAllOptions"
                  class="select-all-btn"
                >
                  {{ allOptionsSelected ? '取消全选' : '全选' }}
                </v-btn>
              </div>
              
              <v-checkbox
                v-model="clearConfig"
                label="清除插件配置"
                density="compact"
                hide-details
                class="option-item"
              ></v-checkbox>
              
              <v-checkbox
                v-model="clearData"
                label="清除插件数据"
                density="compact"
                hide-details
                class="option-item"
              ></v-checkbox>
              
              <v-checkbox
                v-if="!selectedPlugin?.installed"
                v-model="forceClean"
                label="强制清理文件（危险操作）"
                density="compact"
                hide-details
                class="option-item"
              ></v-checkbox>
            </div>
          </v-card-text>
          
          <v-card-actions class="dialog-actions">
            <v-btn @click="actionDialog = false" variant="text">取消</v-btn>
            <v-btn
              :color="selectedPlugin?.installed ? 'error' : 'warning'"
              @click="confirmAction"
              :loading="actionLoading"
              variant="outlined"
            >
              确认{{ selectedPlugin?.installed ? '卸载' : '清理' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  
  // Props
  const props = defineProps({
    api: {
      type: [Object, Function],
      required: true,
    }
  });
  
  // Emits
  const emit = defineEmits(['close']);
  
  // 响应式数据
  const loading = ref(false);
  const error = ref(null);
  const dataLoaded = ref(false);
  const searchQuery = ref('');
  const globalMessage = ref(null);
  const globalMessageType = ref('info');
  const actionDialog = ref(false);
  const reinstallDialog = ref(false);
  const selectedPlugin = ref(null);
  const onlinePluginInfo = ref(null);
const clearConfig = ref(false);
const clearData = ref(false);
const forceClean = ref(false);
const actionLoading = ref(false);
const showFullRepoUrl = ref(false);
  
  // 快速重载相关
const quickReloadLoading = ref(false);
const lastReloadPlugins = ref([]);
const selectedQuickReloadIds = ref(new Set());

// 插件数据
const plugins = ref([]);
const reloadingPlugins = ref(new Set());
const reinstallingPlugins = ref(new Set());
  
  // 插件ID
  const pluginId = "PluginManagerVue";
  
  // 计算属性
  const filteredPlugins = computed(() => {
    if (!searchQuery.value) {
      return plugins.value;
    }
    
    const query = searchQuery.value.toLowerCase();
    return plugins.value.filter(plugin => 
      plugin.name.toLowerCase().includes(query) ||
      plugin.id.toLowerCase().includes(query) ||
      plugin.author.toLowerCase().includes(query) ||
      plugin.desc.toLowerCase().includes(query)
    );
  });
  
  const statusStats = computed(() => [
  {
    icon: 'mdi-package-variant',
    value: plugins.value.length,
    label: '总数'
  },
  {
    icon: 'mdi-check-circle',
    value: plugins.value.filter(p => p.installed).length,
    label: '已装'
  },
  {
    icon: 'mdi-play-circle',
    value: plugins.value.filter(p => p.running).length,
    label: '运行'
  },
  {
    icon: 'mdi-cloud',
    value: plugins.value.filter(p => p.type !== 'local').length,
    label: '在线'
  },
  {
    icon: 'mdi-folder',
    value: plugins.value.filter(p => p.type === 'local').length,
    label: '本地'
  }
]);

const allOptionsSelected = computed(() => {
  if (selectedPlugin.value?.installed) {
    // 已安装插件：配置 + 数据
    return clearConfig.value && clearData.value;
  } else {
    // 未安装插件：配置 + 数据 + 强制清理
    return clearConfig.value && clearData.value && forceClean.value;
  }
});

const allQuickReloadSelected = computed(() => {
  const availablePlugins = lastReloadPlugins.value.slice(0, 6);
  return availablePlugins.length > 0 && availablePlugins.every(plugin => selectedQuickReloadIds.value.has(plugin.id));
});
  
  // 方法
  function getStatusColor(plugin) {
  if (plugin.running) return 'success';
  if (plugin.installed) return 'primary';
  return 'grey';
}

function getStatusText(plugin) {
  if (plugin.running) return '运行中';
  if (plugin.installed) return '已安装';
  return '未安装';
}

function getStatusClass(plugin) {
  if (plugin.running) return 'dot-active';
  if (plugin.installed) return 'dot-ready';
  return 'dot-offline';
}
  
  function handleImageError(event) {
    if (event?.target?.src) {
      console.warn('插件图标加载失败:', event.target.src);
    }
  }
  
  function showMessage(message, type = 'info') {
    globalMessage.value = message;
    globalMessageType.value = type;
    
    setTimeout(() => {
      clearMessage();
    }, 5000);
  }
  
  function clearMessage() {
    globalMessage.value = null;
  }
  
  async function fetchPlugins() {
    loading.value = true;
    error.value = null;
  
    try {
      const response = await props.api.get(`plugin/${pluginId}/plugins`);
      
      if (response?.success) {
        plugins.value = response.data || [];
        dataLoaded.value = true;
      } else {
        throw new Error(response?.message || '获取插件列表失败');
      }
    } catch (err) {
      console.error('获取插件列表失败:', err);
      error.value = err.message || '获取插件列表失败';
    } finally {
      loading.value = false;
    }
  }
  
  async function refreshPlugins() {
    await fetchPlugins();
    await fetchLastReload();
  }
  
  async function reloadPlugin(plugin) {
  if (reloadingPlugins.value.has(plugin.id)) {
    return;
  }

  reloadingPlugins.value.add(plugin.id);

  try {
    const response = await props.api.post(`plugin/${pluginId}/reload`, {
      plugin_id: plugin.id
    });

    if (response?.success) {
      showMessage(`${plugin.name} 重载成功`, 'success');
      
      // 延迟刷新数据
      setTimeout(() => {
        refreshPlugins();
      }, 1000);
    } else {
      throw new Error(response?.message || '重载失败');
    }
  } catch (err) {
    console.error('重载插件失败:', err);
    showMessage(`${plugin.name} 重载失败: ${err.message}`, 'error');
  } finally {
    reloadingPlugins.value.delete(plugin.id);
  }
}


  
  async function reloadAllRecent() {
    if (lastReloadPlugins.value.length === 0) return;
    
    quickReloadLoading.value = true;
    let successCount = 0;
    let failCount = 0;
    
    for (const plugin of lastReloadPlugins.value) {
      try {
        const response = await props.api.post(`plugin/${pluginId}/reload`, {
          plugin_id: plugin.id
        });
        
        if (response?.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`重载插件 ${plugin.id} 失败:`, err);
        failCount++;
      }
    }
    
    quickReloadLoading.value = false;
    
    if (failCount === 0) {
      showMessage(`成功重载 ${successCount} 个插件`, 'success');
    } else {
      showMessage(`重载完成：成功 ${successCount} 个，失败 ${failCount} 个`, 'warning');
    }
    
    setTimeout(() => {
      refreshPlugins();
    }, 1000);
  }
  
  function showActionDialog(plugin) {
  selectedPlugin.value = plugin;
  clearConfig.value = false;
  clearData.value = false;
  forceClean.value = false;
  actionDialog.value = true;
}

async function showReinstallDialog(plugin) {
  selectedPlugin.value = plugin;
  onlinePluginInfo.value = null;
  showFullRepoUrl.value = false; // 重置为显示简洁名称
  reinstallDialog.value = true;
  
  // 获取在线插件信息
  await fetchOnlinePluginInfo(plugin.id);
}

async function fetchOnlinePluginInfo(targetPluginId) {
  try {
    // 调用插件管理器的API获取在线插件信息
    const response = await props.api.get(`plugin/PluginManagerVue/online_info/${targetPluginId}`);
    
    if (response?.success && response.data) {
      onlinePluginInfo.value = response.data;
      console.log('找到在线插件信息:', response.data);
    } else {
      console.log('未找到在线插件:', targetPluginId, response?.message);
    }
  } catch (err) {
    console.error('获取在线插件信息失败:', err);
  }
}

function getRepoDisplayName(repoUrl) {
  if (!repoUrl) return '未知仓库';
  if (repoUrl === 'local') return '本地插件';
  
  // 如果显示完整URL，直接返回
  if (showFullRepoUrl.value) {
    return repoUrl;
  }
  
  // 默认显示用户名的仓库
  try {
    if (repoUrl.includes('github.com')) {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return `${match[1]}的仓库`;
      }
    }
    
    if (repoUrl.includes('raw.githubusercontent.com')) {
      const match = repoUrl.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return `${match[1]}的仓库`;
      }
    }
    
    // 其他情况返回域名
    const url = new URL(repoUrl);
    return url.hostname;
  } catch (e) {
    return repoUrl;
  }
}

function toggleRepoUrlDisplay() {
  showFullRepoUrl.value = !showFullRepoUrl.value;
}

function getPluginIconPath(iconPath) {
  if (!iconPath) return '';
  
  // 如果是网络图片则使用代理
  if (iconPath.startsWith('http')) {
    return `/api/v1/system/img/1?imgurl=${encodeURIComponent(iconPath)}`;
  }
  
  // 本地图片使用相对路径
  return `./plugin_icon/${iconPath}`;
}

function getUpdateStatusColor() {
  if (!onlinePluginInfo.value) return 'grey';
  
  const currentVersion = selectedPlugin.value?.version;
  const latestVersion = onlinePluginInfo.value?.plugin_version;
  
  if (!currentVersion || !latestVersion) return 'grey';
  
  // 简单的版本比较
  if (currentVersion !== latestVersion) {
    return 'success';
  }
  return 'grey';
}

function getUpdateStatusText() {
  if (!onlinePluginInfo.value) return '检查中...';
  
  const currentVersion = selectedPlugin.value?.version;
  const latestVersion = onlinePluginInfo.value?.plugin_version;
  
  if (!currentVersion || !latestVersion) return '版本未知';
  
  if (currentVersion !== latestVersion) {
    return '有新版本';
  }
  return '已是最新';
}

async function confirmReinstall() {
  if (!selectedPlugin.value) return;
  
  actionLoading.value = true;
  
  try {
    const response = await props.api.post(`plugin/${pluginId}/reinstall`, {
      plugin_id: selectedPlugin.value.id
    });

    if (response?.success) {
      showMessage(`${selectedPlugin.value.name} 重装成功`, 'success');
      
      // 延迟刷新数据
      setTimeout(() => {
        refreshPlugins();
      }, 1500);
    } else {
      throw new Error(response?.message || '重装失败');
    }
  } catch (err) {
    console.error('重装插件失败:', err);
    showMessage(`${selectedPlugin.value.name} 重装失败: ${err.message}`, 'error');
  } finally {
    actionLoading.value = false;
    reinstallDialog.value = false;
    selectedPlugin.value = null;
  }
}

function toggleAllOptions() {
  if (allOptionsSelected.value) {
    // 取消全选
    clearConfig.value = false;
    clearData.value = false;
    forceClean.value = false;
  } else {
    // 全选
    clearConfig.value = true;
    clearData.value = true;
    if (!selectedPlugin.value?.installed) {
      forceClean.value = true;
    }
  }
}

function toggleAllQuickReload() {
  const availablePlugins = lastReloadPlugins.value.slice(0, 6);
  if (allQuickReloadSelected.value) {
    // 取消全选
    selectedQuickReloadIds.value.clear();
  } else {
    // 全选
    selectedQuickReloadIds.value = new Set(availablePlugins.map(p => p.id));
  }
  // 触发响应式更新
  selectedQuickReloadIds.value = new Set(selectedQuickReloadIds.value);
}

function toggleQuickReloadSelection(pluginId) {
  if (selectedQuickReloadIds.value.has(pluginId)) {
    selectedQuickReloadIds.value.delete(pluginId);
  } else {
    selectedQuickReloadIds.value.add(pluginId);
  }
  // 触发响应式更新
  selectedQuickReloadIds.value = new Set(selectedQuickReloadIds.value);
}

async function reloadSelectedPlugins() {
  if (selectedQuickReloadIds.value.size === 0) return;
  
  quickReloadLoading.value = true;
  const selectedIds = Array.from(selectedQuickReloadIds.value);
  let successCount = 0;
  let failCount = 0;
  
  for (const targetPluginId of selectedIds) {
    try {
      const response = await props.api.post(`plugin/${pluginId}/reload`, {
        plugin_id: targetPluginId
      });
      
      if (response?.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`重载插件 ${targetPluginId} 失败:`, response?.message || '未知错误');
      }
    } catch (err) {
      console.error(`重载插件 ${targetPluginId} 失败:`, err);
      failCount++;
    }
  }
  
  quickReloadLoading.value = false;
  
  if (failCount === 0) {
    showMessage(`成功重载 ${successCount} 个插件`, 'success');
  } else {
    showMessage(`重载完成：成功 ${successCount} 个，失败 ${failCount} 个`, 'warning');
  }
  
  // 清空选择
  selectedQuickReloadIds.value.clear();
  selectedQuickReloadIds.value = new Set();
  
  // 延迟刷新数据
  setTimeout(() => {
    refreshPlugins();
  }, 1000);
}
  
  async function confirmAction() {
    if (!selectedPlugin.value) return;
    
    actionLoading.value = true;
    
    try {
      const response = await props.api.post(`plugin/${pluginId}/uninstall`, {
        plugin_id: selectedPlugin.value.id,
        clear_config: clearConfig.value,
        clear_data: clearData.value,
        force_clean: forceClean.value
      });
  
      if (response?.success) {
        const action = selectedPlugin.value.installed ? '卸载' : '清理';
        showMessage(`${selectedPlugin.value.name} ${action}成功`, 'success');
        
        // 立即刷新数据
        setTimeout(() => {
          refreshPlugins();
        }, 1000);
      } else {
        throw new Error(response?.message || '操作失败');
      }
    } catch (err) {
      console.error('操作失败:', err);
      showMessage(`操作失败: ${err.message}`, 'error');
    } finally {
      actionLoading.value = false;
      actionDialog.value = false;
      selectedPlugin.value = null;
    }
  }
  
  async function fetchLastReload() {
    try {
      const response = await props.api.get(`plugin/${pluginId}/last_reload`);
      if (response?.success) {
        lastReloadPlugins.value = response.data || [];
      }
    } catch (err) {
      console.error('获取上次重载插件失败:', err);
    }
  }
  
  // 组件挂载
  onMounted(() => {
    fetchPlugins();
    fetchLastReload();
  });
  </script>
  
  <style scoped>
  .plugin-manager {
    padding: 12px;
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100vh;
  }
  
  /* 控制面板 */
  .control-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    position: relative;
    overflow: hidden;
  }
  
  .control-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(100, 200, 255, 0.3), transparent);
    animation: scan 3s infinite;
  }
  
  @keyframes scan {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
  
  .panel-left {
    flex: 1;
    max-width: 400px;
  }
  
  .panel-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .search-field {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    border-radius: 12px;
  }
  
  .control-btn {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  .control-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(100, 200, 255, 0.3);
    box-shadow: 0 0 15px rgba(100, 200, 255, 0.2);
  }
  
  .quick-reload-btn {
    position: relative;
  }
  
  .quick-reload-menu {
    background: rgba(var(--v-theme-surface), 0.9) !important;
  }
  
  .quick-reload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.quick-reload-list {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 8px;
}

.quick-reload-item-wrapper {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.quick-reload-item-wrapper:hover {
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.quick-reload-item-wrapper.selected {
  background: rgba(var(--v-theme-primary), 0.1);
}

.quick-reload-checkbox {
  margin-right: 8px;
}

.quick-reload-name {
  font-size: 0.75rem;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-reload-actions {
  display: flex;
  gap: 8px;
}
  
  /* 状态监控面板 */
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .status-card {
    position: relative;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .status-card:hover {
    transform: translateY(-2px);
    border-color: rgba(100, 200, 255, 0.3);
    box-shadow: 0 6px 20px rgba(100, 200, 255, 0.1);
  }
  
  .status-indicator {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .status-indicator::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 9px;
    background: linear-gradient(45deg, transparent, rgba(100, 200, 255, 0.2), transparent);
    z-index: -1;
    animation: rotate 4s linear infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .status-data {
    flex: 1;
  }
  
  .status-value {
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1;
    background: linear-gradient(45deg, #64c8ff, #4080ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .status-label {
    font-size: 0.7rem;
    opacity: 0.7;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }
  
  .status-glow {
    position: absolute;
    top: 50%;
    right: 16px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #64c8ff;
    box-shadow: 0 0 12px #64c8ff;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: translateY(-50%) scale(1); }
    50% { opacity: 1; transform: translateY(-50%) scale(1.2); }
  }
  
  /* 面板样式 */
  .alert-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .loading-panel, .error-panel, .empty-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    text-align: center;
  }
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .loading-text {
    font-size: 1.1rem;
    opacity: 0.8;
  }
  
  .error-title, .empty-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .error-message, .empty-subtitle {
    opacity: 0.7;
    margin-bottom: 16px;
  }
  
  /* 插件矩阵 */
  .plugin-matrix {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .plugin-module {
  position: relative;
  padding: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.plugin-module::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(100, 200, 255, 0.4), transparent);
  transform: translateX(-100%);
  transition: transform 0.8s ease;
}

.plugin-module:hover::before {
  transform: translateX(100%);
}

.plugin-module:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(100, 200, 255, 0.4);
  box-shadow: 0 12px 35px rgba(100, 200, 255, 0.15);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
}
  
  .module-active {
  border-left: 3px solid #4caf50;
  box-shadow: inset 3px 0 0 rgba(76, 175, 80, 0.2);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(255, 255, 255, 0.03));
}

.module-installed {
  border-left: 3px solid #2196f3;
  box-shadow: inset 3px 0 0 rgba(33, 150, 243, 0.2);
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(255, 255, 255, 0.03));
}

.module-local {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.05), rgba(255, 255, 255, 0.03));
}
  
  /* 模块组件 */
  .module-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .module-avatar {
  position: relative;
}

.plugin-avatar {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.plugin-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(100, 200, 255, 0.2);
}

.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.dot-active {
  background: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  animation: pulse-green 2s infinite;
}

.dot-ready {
  background: #2196f3;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.6);
  animation: pulse-blue 2s infinite;
}

.dot-offline {
  background: #757575;
  box-shadow: 0 0 4px rgba(117, 117, 117, 0.4);
}

@keyframes pulse-green {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  }
  50% { 
    transform: scale(1.1);
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.8);
  }
}

@keyframes pulse-blue {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 8px rgba(33, 150, 243, 0.6);
  }
  50% { 
    transform: scale(1.1);
    box-shadow: 0 0 12px rgba(33, 150, 243, 0.8);
  }
}
  
  .module-info {
    flex: 1;
  }
  
  .module-name {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
  }
  
  .module-meta {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 2px;
  }
  
  .module-status {
    align-self: flex-start;
  }
  
  .status-chip {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  
  .module-tags {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }
  
  .type-chip, .update-chip {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  
  .module-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .control-action {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  .reload-action:hover {
  border-color: rgba(33, 150, 243, 0.5);
  box-shadow: 0 0 12px rgba(33, 150, 243, 0.3);
  background: rgba(33, 150, 243, 0.05);
}

.reinstall-action:hover {
  border-color: rgba(156, 39, 176, 0.5);
  box-shadow: 0 0 12px rgba(156, 39, 176, 0.3);
  background: rgba(156, 39, 176, 0.05);
}

.danger-action:hover {
  border-color: rgba(244, 67, 54, 0.5);
  box-shadow: 0 0 12px rgba(244, 67, 54, 0.3);
  background: rgba(244, 67, 54, 0.05);
}
  
  .module-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.overlay-text {
  margin-top: 8px;
  font-size: 0.8rem;
  opacity: 0.9;
  font-weight: 500;
}
  
  /* 对话框 */
  .dialog-card {
    background: rgba(var(--v-theme-surface), 0.9) !important;
  }
  
  .dialog-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .dialog-title {
    font-size: 1.2rem;
    font-weight: 600;
  }
  
  .dialog-content {
    margin-bottom: 24px;
  }
  
  .target-info {
    margin-bottom: 16px;
  }
  
  .target-name {
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  .target-meta {
    font-size: 0.9rem;
    opacity: 0.7;
    margin-top: 4px;
  }
  
  .repo-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
  }
  
  .info-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(var(--v-theme-surface-variant), 0.1);
    border-radius: 8px;
  }
  
  .info-label {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .info-value {
    font-size: 0.9rem;
    font-weight: 600;
  }
  
  .repo-clickable {
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 4px;
    padding: 4px 8px;
    margin: -4px -8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .repo-clickable:hover {
    background: rgba(var(--v-theme-primary), 0.1);
    color: rgb(var(--v-theme-primary));
  }
  
  .option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

  .option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 8px;
}

.option-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.select-all-btn {
  font-size: 0.7rem;
}

.option-item {
  background: rgba(var(--v-theme-surface-variant), 0.05);
  border-radius: 8px;
  padding: 8px;
}
  
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  /* 响应式 */
  @media (max-width: 768px) {
    .plugin-manager {
      padding: 8px;
    }
    
    .control-panel {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
    
    .panel-left {
      max-width: none;
    }
    
    .panel-right {
      justify-content: center;
    }
    
    .status-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    
    .plugin-matrix {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
  
  @media (max-width: 480px) {
    .status-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .status-value {
      font-size: 1.2rem;
    }
    
    .module-controls {
      flex-direction: column;
      align-items: stretch;
    }
  }
  </style>
  
  