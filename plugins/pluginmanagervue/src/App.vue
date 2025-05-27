<template>
  <div class="app-container">
    <v-app>
      <v-app-bar color="primary" app>
        <v-app-bar-title>插件管理器 - 本地测试</v-app-bar-title>
      </v-app-bar>

      <v-main>
        <v-container>
          <v-tabs v-model="activeTab" bg-color="primary" grow>
            <v-tab value="page">插件管理</v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="mt-4">
            <v-window-item value="page">
              <h2 class="text-h5 mb-4">插件管理器 (Page.vue)</h2>
              <div class="component-preview">
                <page-component 
                  :api="mockPluginApiWrapper" 
                  @close="handleClose('Page')"
                ></page-component>
              </div>
            </v-window-item>
          </v-window>
        </v-container>
      </v-main>

      <v-footer app color="primary" class="text-center d-flex justify-center">
        <span class="text-white">MoviePilot 插件管理器本地测试 ©{{ new Date().getFullYear() }}</span>
      </v-footer>
    </v-app>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top end">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> 关闭 </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import PageComponent from './components/Page.vue'

const activeTab = ref('page');

const mockDatabase = reactive({
  plugins: [
    // 本地插件 (不在在线市场)
    {
      id: 'localplugin1',
      name: '本地测试插件',
      version: '1.0',
      order: 1,
      description: '这是一个本地开发的插件，不在在线市场',
      author: 'LocalDev',
      icon: '',
      type: 'local',
      installed: true,
      status: 'running'
    },
    {
      id: 'customtool',
      name: '自定义工具',
      version: '2.1',
      order: 2,
      description: '自定义开发的工具插件',
      author: 'CustomDev',
      icon: '',
      type: 'local',
      installed: false,
      status: 'stopped'
    },
    // 在线插件 (来自市场)
    {
      id: 'logsclean',
      name: '日志清理Vue',
      version: '2.0',
      order: 50,
      description: '定时清理插件产生的日志文件，支持按行数和时间清理，保持系统整洁',
      author: 'madrays',
      icon: 'https://cdn.jsdelivr.net/gh/madrays/MoviePilot-Plugins@main/icons/clean.png',
      type: 'online',
      installed: true,
      status: 'running'
    },
    {
      id: 'autosignin',
      name: '站点自动签到',
      version: '2.6',
      order: 10,
      description: '自动完成PT站点每日签到任务，支持多站点批量签到，获取魔力值和积分',
      author: 'jxxghp',
      icon: 'https://cdn.jsdelivr.net/gh/jxxghp/MoviePilot-Plugins@main/icons/signin.png',
      type: 'online',
      installed: true,
      status: 'running'
    },
    {
      id: 'douban',
      name: '豆瓣刮削器',
      version: '1.5',
      order: 5,
      description: '从豆瓣获取电影和电视剧的详细信息、评分、演员表等元数据',
      author: 'jxxghp',
      icon: 'https://cdn.jsdelivr.net/gh/jxxghp/MoviePilot-Plugins@main/icons/douban.png',
      type: 'online',
      installed: false,
      status: 'stopped'
    },
    {
      id: 'tmdb',
      name: 'TMDB元数据',
      version: '2.1',
      order: 3,
      description: '从TMDB获取影视作品的海报、背景图、演员信息等丰富的元数据内容',
      author: 'jxxghp',
      icon: 'https://cdn.jsdelivr.net/gh/jxxghp/MoviePilot-Plugins@main/icons/tmdb.png',
      type: 'online',
      installed: true,
      status: 'running'
    },
    {
      id: 'mediaserver',
      name: '媒体服务器',
      version: '1.8',
      order: 15,
      description: '连接和管理Plex、Emby、Jellyfin等媒体服务器，同步媒体库信息',
      author: 'jxxghp',
      icon: 'https://cdn.jsdelivr.net/gh/jxxghp/MoviePilot-Plugins@main/icons/mediaserver.png',
      type: 'online',
      installed: true,
      status: 'running'
    },
    {
      id: 'notification',
      name: '消息通知',
      version: '3.2',
      order: 20,
      description: '支持微信、Telegram、邮件等多种方式发送系统通知和下载完成提醒',
      author: 'jxxghp',
      icon: 'https://cdn.jsdelivr.net/gh/jxxghp/MoviePilot-Plugins@main/icons/notification.png',
      type: 'online',
      installed: false,
      status: 'stopped'
    },
    {
      id: 'pluginmanagervue',
      name: '插件管理器',
      version: '3.0',
      order: 99,
      description: '管理插件重载、卸载等功能，支持本地和在线插件管理',
      author: 'InfinityPacer',
      icon: 'https://cdn.jsdelivr.net/gh/InfinityPacer/MoviePilot-Plugins@main/icons/manager.png',
      type: 'online',
      installed: true,
      status: 'running'
    }
  ],
  status: {
    total_plugins: 9,
    installed_plugins: 6,
    directory_plugins: 9,
    enabled: true,
    last_reload_count: 0
  },
  lastReloadPlugins: [
    {
      id: 'autosignin',
      name: '站点自动签到',
      version: '2.6',
      icon: 'https://cdn.jsdelivr.net/gh/jxxghp/MoviePilot-Plugins@main/icons/signin.png'
    },
    {
      id: 'logsclean',
      name: '日志清理Vue',
      version: '2.0',
      icon: 'https://cdn.jsdelivr.net/gh/madrays/MoviePilot-Plugins@main/icons/clean.png'
    }
  ]
});

// 模拟API包装器
const mockPluginApiWrapper = {
  get: async (url) => {
    console.log(`[Mock API GET] ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (url.includes('/plugins')) {
      return {
        success: true,
        data: mockDatabase.plugins
      };
    }
    
    if (url.includes('/status')) {
      return {
        success: true,
        data: mockDatabase.status
      };
    }
    
    if (url.includes('/last_reload')) {
      return {
        success: true,
        data: mockDatabase.lastReloadPlugins
      };
    }
    
    throw new Error(`Mock API: 未知的GET端点 ${url}`);
  },
  
  post: async (url, data) => {
    console.log(`[Mock API POST] ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url.includes('/reload')) {
      const pluginId = data?.plugin_id;
      if (!pluginId) {
        return {
          success: false,
          message: '插件ID不能为空'
        };
      }
      
      const plugin = mockDatabase.plugins.find(p => p.id === pluginId);
      if (!plugin) {
        return {
          success: false,
          message: `插件 ${pluginId} 不存在`
        };
      }
      
      if (!plugin.installed) {
        return {
          success: false,
          message: `插件 ${plugin.name} 未安装，无法重载`
        };
      }
      
      // 更新上次重载列表
      const existingIndex = mockDatabase.lastReloadPlugins.findIndex(p => p.id === pluginId);
      if (existingIndex >= 0) {
        mockDatabase.lastReloadPlugins.splice(existingIndex, 1);
      }
      mockDatabase.lastReloadPlugins.unshift({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        icon: plugin.icon
      });
      // 只保留最近5个
      mockDatabase.lastReloadPlugins = mockDatabase.lastReloadPlugins.slice(0, 5);
      
      showNotification(`模拟重载插件: ${plugin.name}`, 'success');
      return {
        success: true,
        message: `插件 ${plugin.name} 重载成功`
      };
    }
    
    if (url.includes('/uninstall')) {
      const pluginId = data?.plugin_id;
      const clearConfig = data?.clear_config || false;
      const clearData = data?.clear_data || false;
      
      if (!pluginId) {
        return {
          success: false,
          message: '插件ID不能为空'
        };
      }
      
      const plugin = mockDatabase.plugins.find(p => p.id === pluginId);
      if (!plugin) {
        return {
          success: false,
          message: `插件 ${pluginId} 不存在`
        };
      }
      
      if (!plugin.installed) {
        return {
          success: false,
          message: `插件 ${plugin.name} 未安装`
        };
      }
      
      // 模拟卸载
      plugin.installed = false;
      plugin.status = 'stopped';
      mockDatabase.status.installed_plugins--;
      
      // 从上次重载列表中移除
      const reloadIndex = mockDatabase.lastReloadPlugins.findIndex(p => p.id === pluginId);
      if (reloadIndex >= 0) {
        mockDatabase.lastReloadPlugins.splice(reloadIndex, 1);
      }
      
      let message = `插件 ${plugin.name} 卸载成功`;
      if (clearConfig) {
        message += '，已清除配置';
      }
      if (clearData) {
        message += '，已清除数据';
      }
      
      showNotification(`模拟卸载插件: ${plugin.name}`, 'success');
      return {
        success: true,
        message: message
      };
    }
    
    throw new Error(`Mock API: 未知的POST端点 ${url}`);
  }
};

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
  timeout: 3000,
});

function showNotification(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

function handleClose(componentName) {
  showNotification(`${componentName} 已关闭 (模拟)`, 'info');
}

onMounted(async () => {
  try {
    showNotification('插件管理器: 模拟环境已准备就绪', 'success');
  } catch (e) {
    console.error("Error during App.vue onMounted:", e);
    showNotification(`初始化失败: ${e.message || '未知错误'}`, 'error');
  }
});

</script>

<style scoped>
.app-container { }
.component-preview {
  overflow: hidden;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px; 
  background-color: #f9f9f9; 
}
.v-tab {
  text-transform: none !important; 
}
</style>
