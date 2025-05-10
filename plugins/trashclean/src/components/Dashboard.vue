<template>
  <div class="dashboard-widget">
    <v-card :flat="!props.config?.attrs?.border" :loading="loading" class="fill-height d-flex flex-column">
      <v-card-item v-if="props.config?.attrs?.title || props.config?.attrs?.subtitle">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-broom" class="mr-2" color="primary"></v-icon>
          {{ props.config?.attrs?.title || '垃圾文件清理概览' }}
        </v-card-title>
        <v-card-subtitle v-if="props.config?.attrs?.subtitle">{{ props.config.attrs.subtitle }}</v-card-subtitle>
      </v-card-item>

      <v-card-text class="flex-grow-1 pa-3">
        <div v-if="loading && !initialDataLoaded" class="text-center py-2">
          <v-progress-circular indeterminate color="primary" size="small"></v-progress-circular>
          <div class="text-caption mt-2">加载中...</div>
        </div>
        <div v-else-if="error" class="text-error text-caption d-flex align-center">
          <v-icon size="small" color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
          {{ error || '数据加载失败' }}
        </div>
        <div v-else-if="initialDataLoaded && statusData">
          <v-list density="compact" class="py-0" nav>
            <v-list-item class="px-2">
              <template v-slot:prepend>
                <v-icon size="small" :color="statusData.enabled ? 'success' : 'grey'" class="mr-2">
                  mdi-power
                </v-icon>
              </template>
              <v-list-item-title class="text-caption">
                插件状态: 
                <span :class="statusData.enabled ? 'text-success' : 'text-grey'">
                  {{ statusData.enabled ? '已启用' : '已禁用' }}
                </span>
              </v-list-item-title>
            </v-list-item>

            <v-divider class="my-1"></v-divider>

            <v-list-item class="px-2" v-if="latestCleanResult">
              <template v-slot:prepend>
                <v-icon size="small" color="primary" class="mr-2">mdi-calendar-clock</v-icon>
              </template>
              <v-list-item-title class="text-caption">
                上次清理: {{ getLastCleanTimeText() }}
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-2" v-if="latestCleanResult">
              <template v-slot:prepend>
                <v-icon size="small" color="info" class="mr-2">mdi-folder-remove</v-icon>
              </template>
              <v-list-item-title class="text-caption">
                清理目录: {{ latestCleanResult.removed_dirs?.length || 0 }} 个
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-2" v-if="latestCleanResult">
              <template v-slot:prepend>
                <v-icon size="small" color="success" class="mr-2">mdi-harddisk</v-icon>
              </template>
              <v-list-item-title class="text-caption">
                释放空间: {{ formatSize(latestCleanResult.total_freed_space) }}
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-2" v-if="statusData.enabled">
              <template v-slot:prepend>
                <v-icon size="small" color="amber-darken-2" class="mr-2">mdi-timer-outline</v-icon>
              </template>
              <v-list-item-title class="text-caption">
                下次运行: {{ statusData.next_run_time || '未知' }}
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-2">
              <template v-slot:prepend>
                <v-icon size="small" color="deep-purple" class="mr-2">mdi-folder-multiple</v-icon>
              </template>
              <v-list-item-title class="text-caption">
                监控路径: {{ statusData.monitor_paths?.length || 0 }} 个
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-2" v-if="statusData.cleanup_rules">
              <template v-slot:prepend>
                <v-icon size="small" color="pink" class="mr-2">mdi-filter-variant</v-icon>
              </template>
              <v-list-item-title class="text-caption">
                清理规则:
                <v-chip size="x-small" color="success" variant="flat" class="ml-1" v-if="statusData.cleanup_rules.empty_dir">
                  空目录
                </v-chip>
                <v-chip size="x-small" color="warning" variant="flat" class="ml-1" v-if="statusData.cleanup_rules.small_dir?.enabled">
                  小体积
                </v-chip>
                <v-chip size="x-small" color="error" variant="flat" class="ml-1" v-if="statusData.cleanup_rules.size_reduction?.enabled">
                  体积减少
                </v-chip>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
        <div v-else class="text-caption text-disabled text-center py-3">
          <v-icon icon="mdi-information-outline" class="mb-2"></v-icon>
          <div>暂无数据，请检查插件配置</div>
        </div>
      </v-card-text>

      <v-divider v-if="props.allowRefresh"></v-divider>
      <v-card-actions v-if="props.allowRefresh" class="px-3 py-1">
        <span class="text-caption text-disabled">{{ lastRefreshedTimeDisplay }}</span>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" size="small" @click="fetchData" :loading="loading">
          <v-icon size="small">mdi-refresh</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
  api: { 
    type: [Object, Function],  // 允许Object或Function类型
    required: true,
  },
  config: { // Widget display config (title, border etc.)
    type: Object,
    default: () => ({ attrs: {} }),
  },
  allowRefresh: {
    type: Boolean,
    default: false,
  },
  refreshInterval: {
    type: Number,
    default: 0, // 0 means no auto-refresh
  },
});

const loading = ref(false);
const error = ref(null);
const initialDataLoaded = ref(false);
const statusData = reactive({ 
    enabled: null,
    cron: '',
    next_run_time: null,
    monitor_paths: [],
    exclude_dirs: [],
    only_when_no_download: false,
    cleanup_rules: {
      empty_dir: false,
      small_dir: {
        enabled: false,
        max_size: 10
      },
      size_reduction: {
        enabled: false,
        threshold: 80
      }
    }
});
const latestCleanResult = reactive({
  status: "success",
  removed_dirs: [],
  removed_empty_dirs_count: 0,
  removed_small_dirs_count: 0,
  removed_size_reduction_dirs_count: 0,
  total_freed_space: 0
});
const lastRefreshedTimestamp = ref(null);

let refreshTimer = null;

const getPluginId = () => {
  return "TrashClean";  // 使用固定的插件ID
};

// 获取状态数据
async function fetchStatus() {
  try {
    const pluginId = getPluginId();
    const data = await props.api.get(`plugin/${pluginId}/status`);
    
    if (data) {
      // 更新状态数据
      Object.assign(statusData, data);
    } else {
      throw new Error('状态数据响应无效');
    }
  } catch (err) {
    console.error('获取状态数据失败:', err);
    throw err;
  }
}

// 获取最新清理结果
async function fetchLatestCleanResult() {
  try {
    const pluginId = getPluginId();
    const data = await props.api.get(`plugin/${pluginId}/latest_clean_result`);
    
    if (data) {
      // 更新最新清理结果
      Object.assign(latestCleanResult, data);
    }
  } catch (err) {
    console.error('获取最新清理结果失败:', err);
    // 不抛出错误，因为这个接口可能不存在
  }
}

// 获取所有数据
async function fetchData() {
  loading.value = true;
  error.value = null;
  
  try {
    await fetchStatus();
    await fetchLatestCleanResult();
    
    initialDataLoaded.value = true;
    lastRefreshedTimestamp.value = Date.now();
  } catch (err) {
    console.error('获取仪表盘数据失败:', err);
    error.value = err.message || '获取仪表盘数据失败';
  } finally {
    loading.value = false;
  }
}

const lastRefreshedTimeDisplay = computed(() => {
  if (!lastRefreshedTimestamp.value) return '';
  return `上次更新: ${new Date(lastRefreshedTimestamp.value).toLocaleTimeString()}`;
});

// 格式化大小
const formatSize = (mbSize) => {
  if (mbSize === undefined || mbSize === null) return '0 MB';
  
  if (mbSize < 1) {
    return `${(mbSize * 1024).toFixed(2)} KB`;
  } else if (mbSize < 1024) {
    return `${mbSize.toFixed(2)} MB`;
  } else {
    return `${(mbSize / 1024).toFixed(2)} GB`;
  }
};

// 获取最后清理时间文本
const getLastCleanTimeText = () => {
  if (!latestCleanResult.timestamp) {
    // 尝试从history中获取最后一条记录
    if (statusData.cleaning_history && statusData.cleaning_history.length > 0) {
      return statusData.cleaning_history[0].timestamp || '无数据';
    }
    return '无数据';
  }
  return latestCleanResult.timestamp;
};

onMounted(() => {
  fetchData();
  
  // 设置自动刷新
  if (props.allowRefresh && props.refreshInterval > 0) {
    refreshTimer = setInterval(fetchData, props.refreshInterval * 1000);
  }
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped>
.dashboard-widget {
  height: 100%;
  width: 100%;
}
.v-card-item {
  padding-bottom: 8px;
}
.v-list-item {
  min-height: 28px;
}
</style> 