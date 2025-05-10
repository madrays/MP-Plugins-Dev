<template>
  <div class="plugin-page">
    <v-card flat class="rounded border">
      <!-- 标题区域 -->
      <v-card-title class="text-subtitle-1 d-flex align-center px-3 py-2 bg-primary-lighten-5">
        <v-icon icon="mdi-broom" class="mr-2" color="primary" size="small" />
        <span>垃圾文件清理</span>
      </v-card-title>
      
      <!-- 通知区域 -->
      <v-card-text class="px-3 py-2">
        <v-alert v-if="error" type="error" density="compact" class="mb-2 text-caption" variant="tonal" closable>{{ error }}</v-alert>
        <v-alert v-if="actionMessage" :type="actionMessageType" density="compact" class="mb-2 text-caption" variant="tonal" closable>{{ actionMessage }}</v-alert>
        
        <v-skeleton-loader v-if="loading && !initialDataLoaded" type="article, actions"></v-skeleton-loader>

        <div v-if="initialDataLoaded" class="my-1">
          <!-- 状态卡片 -->
          <v-row>
            <v-col cols="12" md="6">
              <!-- 当前状态 -->
              <v-card flat class="rounded mb-3 border config-card">
                <v-card-title class="text-caption d-flex align-center px-3 py-2 bg-primary-lighten-5">
                  <v-icon icon="mdi-information" class="mr-2" color="primary" size="small" />
                  <span>当前状态</span>
                </v-card-title>
                <v-card-text class="pa-0">
                  <v-list class="bg-transparent pa-0">
                    <v-list-item class="px-3 py-1">
                      <template v-slot:prepend>
                        <v-icon :color="statusData.enabled ? 'success' : 'grey'" icon="mdi-power" size="small" />
                      </template>
                      <v-list-item-title class="text-caption">插件状态</v-list-item-title>
                      <template v-slot:append>
                        <v-chip
                          :color="statusData.enabled ? 'success' : 'grey'"
                          size="x-small"
                          variant="tonal"
                        >
                          {{ statusData.enabled ? '已启用' : '已禁用' }}
                        </v-chip>
                      </template>
                    </v-list-item>
                    <v-divider class="my-1"></v-divider>
                    <v-list-item class="px-3 py-1">
                      <template v-slot:prepend>
                        <v-icon icon="mdi-code-braces" color="primary" size="small" />
                      </template>
                      <v-list-item-title class="text-caption">CRON表达式</v-list-item-title>
                      <template v-slot:append>
                        <code class="text-caption px-2 py-1 rounded" style="background-color: rgba(0,0,0,0.05)">{{ statusData.cron || '未设置' }}</code>
                      </template>
                    </v-list-item>
                    <v-divider class="my-1"></v-divider>
                    <v-list-item class="px-3 py-1">
                      <template v-slot:prepend>
                        <v-icon icon="mdi-clock-time-five" color="amber-darken-2" size="small" />
                      </template>
                      <v-list-item-title class="text-caption">下次运行</v-list-item-title>
                      <template v-slot:append>
                        <span class="text-caption">{{ statusData.next_run_time || '未知' }}</span>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions class="px-3 py-2">
                  <!-- 移除手动清理按钮，已移到底部操作栏 -->
                </v-card-actions>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <!-- 监控路径状态 -->
              <v-card flat class="rounded mb-3 border config-card">
                <v-card-title class="text-caption d-flex align-center px-3 py-2 bg-primary-lighten-5">
                  <v-icon icon="mdi-folder-search" class="mr-2" color="primary" size="small" />
                  <span>监控路径</span>
                  <v-chip class="ml-1" size="x-small" color="info" variant="flat">{{ pathStats.length || 0 }} 个路径</v-chip>
                </v-card-title>
                <v-card-text class="pa-0">
                  <div v-if="!pathStats.length" class="text-center text-grey py-3">
                    <v-icon icon="mdi-folder-off" size="small" class="mb-1" />
                    <div class="text-caption">未设置任何监控路径</div>
                  </div>
                  <v-list v-else class="pa-0 bg-transparent" density="compact">
                    <v-list-item
                      v-for="(path, index) in pathStats"
                      :key="index"
                      class="px-3 py-1"
                    >
                      <template v-slot:prepend>
                        <v-icon
                          :icon="path.exists ? 'mdi-folder' : 'mdi-folder-off'"
                          :color="path.exists ? 'amber-darken-2' : 'grey'"
                          size="small"
                          class="mr-2"
                        />
                      </template>
                      <v-list-item-title class="text-caption">{{ path.path }}</v-list-item-title>
                      <template v-slot:append>
                        <v-chip
                          size="x-small"
                          :color="path.exists ? (path.status === 'valid' ? 'success' : 'error') : 'grey'"
                          variant="flat"
                        >
                          {{ path.exists ? (path.status === 'valid' ? '可用' : '错误') : '不存在' }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
              
              <!-- 排除目录状态 -->
              <v-card flat class="rounded mb-3 border config-card">
                <v-card-title class="text-caption d-flex align-center px-3 py-2 bg-primary-lighten-5">
                  <v-icon icon="mdi-folder-remove" class="mr-2" color="primary" size="small" />
                  <span>排除目录</span>
                  <v-chip class="ml-1" size="x-small" color="info" variant="flat">{{ statusData.exclude_dirs?.length || 0 }} 个目录</v-chip>
                </v-card-title>
                <v-card-text class="pa-0">
                  <div v-if="!statusData.exclude_dirs?.length" class="text-center text-grey py-3">
                    <v-icon icon="mdi-folder-off" size="small" class="mb-1" />
                    <div class="text-caption">未设置任何排除目录</div>
                  </div>
                  <v-list v-else class="pa-0 bg-transparent" density="compact">
                    <v-list-item
                      v-for="(path, index) in statusData.exclude_dirs"
                      :key="index"
                      class="px-3 py-1"
                    >
                      <template v-slot:prepend>
                        <v-icon
                          icon="mdi-folder-remove"
                          color="error"
                          size="small"
                          class="mr-2"
                        />
                      </template>
                      <v-list-item-title class="text-caption">{{ path }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- 下载器监控状态 -->
          <v-card v-if="statusData.only_when_no_download" flat class="rounded mb-3 border config-card">
            <v-card-title class="text-caption d-flex align-center justify-space-between px-3 py-2 bg-primary-lighten-5">
              <div class="d-flex align-center">
                <v-icon icon="mdi-download-network" class="mr-2" color="primary" size="small" />
                <span>下载器监控状态</span>
              </div>
              <v-chip size="x-small" :color="downloadersHaveActiveTasks ? 'warning' : 'success'" variant="flat">
                {{ downloadersHaveActiveTasks ? '有活动任务' : '无活动任务' }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-0">
              <div v-if="loadingDownloaders" class="d-flex justify-center py-4">
                <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
              </div>
              <div v-else-if="!downloaders.length" class="text-center text-grey py-3">
                <v-icon icon="mdi-download-off" size="small" class="mb-1" />
                <div class="text-caption">未找到可用的下载器</div>
              </div>
              <div v-else>
                <div class="downloader-grid pa-2">
                  <v-card
                    v-for="(downloader, index) in downloaders"
                    :key="index"
                    :color="downloader.hasActiveTasks ? 'warning-lighten-5' : 'success-lighten-5'"
                    class="downloader-card"
                    flat
                    rounded
                    elevation="0"
                  >
                    <div class="d-flex align-center px-3 py-2">
                      <v-avatar size="40" :color="downloader.hasActiveTasks ? 'warning-lighten-4' : 'success-lighten-4'" class="mr-3">
                        <v-icon
                          :icon="downloader.hasActiveTasks ? 'mdi-download' : 'mdi-check-circle'"
                          :color="downloader.hasActiveTasks ? 'warning-darken-1' : 'success-darken-1'"
                        />
                      </v-avatar>
                      <div>
                        <div class="font-weight-medium">{{ downloader.name }}</div>
                        <div class="text-caption">{{ downloader.hasActiveTasks ? `${downloader.count || '0'} 个活动任务` : '空闲' }}</div>
                      </div>
                      <v-spacer></v-spacer>
                      <v-chip
                        size="small"
                        :color="downloader.hasActiveTasks ? 'warning' : 'success'"
                        variant="tonal"
                        class="ml-2"
                      >
                        {{ downloader.hasActiveTasks ? '运行中' : '可清理' }}
                      </v-chip>
                    </div>
                    
                    <!-- 添加活动种子列表 -->
                    <template v-if="downloader.hasActiveTasks && downloader.activeTasks && downloader.activeTasks.length > 0">
                      <v-divider></v-divider>
                      <v-expansion-panels variant="accordion" class="mt-1">
                        <v-expansion-panel>
                          <v-expansion-panel-title class="py-1 px-3" density="compact">
                            <div class="d-flex align-center">
                              <v-icon icon="mdi-download-network" size="small" class="mr-1"></v-icon>
                              <span>活动任务 ({{ downloader.count }})</span>
                            </div>
                          </v-expansion-panel-title>
                          <v-expansion-panel-text class="py-1 px-0">
                            <div class="tasks-container">
                              <div
                                v-for="(task, taskIndex) in downloader.activeTasks"
                                :key="taskIndex"
                                class="task-item py-2 px-3"
                              >
                                <div class="d-flex align-center mb-1">
                                  <v-icon icon="mdi-download" size="small" class="mr-2" color="warning"></v-icon>
                                  <div class="text-subtitle-2 text-truncate" :title="task.name">{{ task.name }}</div>
                                </div>
                                <div class="task-info d-flex align-center justify-space-between mt-1">
                                  <v-progress-linear
                                    v-model="task.progress"
                                    color="warning"
                                    height="6"
                                    class="rounded-lg flex-grow-1"
                                  ></v-progress-linear>
                                  <span class="text-caption progress-value ml-2">{{ task.progress.toFixed(1) }}%</span>
                                </div>
                                <div class="task-details d-flex flex-wrap justify-space-between mt-2">
                                  <span class="info-chip">
                                    <v-icon icon="mdi-speedometer" size="x-small" class="mr-1"></v-icon>
                                    {{ formatSpeed(task.dlspeed) }}
                                  </span>
                                  <span class="info-chip">
                                    <v-icon icon="mdi-clock-outline" size="x-small" class="mr-1"></v-icon>
                                    {{ formatETA(task.eta) }}
                                  </span>
                                  <span class="info-chip">
                                    <v-icon icon="mdi-harddisk" size="x-small" class="mr-1"></v-icon>
                                    {{ formatSize(task.size) }}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </v-expansion-panel-text>
                        </v-expansion-panel>
                      </v-expansion-panels>
                    </template>
                  </v-card>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- 清理规则状态 -->
          <v-card flat class="rounded mb-3 border config-card">
            <v-card-title class="text-caption d-flex align-center px-3 py-2 bg-primary-lighten-5">
              <v-icon icon="mdi-filter-settings" class="mr-2" color="primary" size="small" />
              <span>清理规则</span>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-list class="bg-transparent pa-0">
                <v-list-item class="px-3 py-1">
                  <template v-slot:prepend>
                    <v-icon 
                      :color="cleanupRules.empty_dir ? 'success' : 'grey'" 
                      icon="mdi-folder-remove" 
                      size="small" 
                    />
                  </template>
                  <v-list-item-title class="text-caption">清理空目录</v-list-item-title>
                  <template v-slot:append>
                    <v-chip
                      :color="cleanupRules.empty_dir ? 'success' : 'grey'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ cleanupRules.empty_dir ? '已启用' : '已禁用' }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-divider class="my-1"></v-divider>
                <v-list-item class="px-3 py-1">
                  <template v-slot:prepend>
                    <v-icon 
                      :color="cleanupRules.small_dir.enabled ? 'warning' : 'grey'" 
                      icon="mdi-weight" 
                      size="small" 
                    />
                  </template>
                  <v-list-item-title class="text-caption">清理小体积目录</v-list-item-title>
                  <template v-slot:append>
                    <span v-if="cleanupRules.small_dir.enabled" class="text-caption mr-2">
                      最大体积 {{ cleanupRules.small_dir.max_size }}MB
                    </span>
                    <v-chip
                      :color="cleanupRules.small_dir.enabled ? 'warning' : 'grey'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ cleanupRules.small_dir.enabled ? '已启用' : '已禁用' }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-divider class="my-1"></v-divider>
                <v-list-item class="px-3 py-1">
                  <template v-slot:prepend>
                    <v-icon 
                      :color="cleanupRules.size_reduction.enabled ? 'error' : 'grey'" 
                      icon="mdi-chart-line-variant" 
                      size="small" 
                    />
                  </template>
                  <v-list-item-title class="text-caption">清理体积减少目录</v-list-item-title>
                  <template v-slot:append>
                    <span v-if="cleanupRules.size_reduction.enabled" class="text-caption mr-2">
                      减少阈值 {{ cleanupRules.size_reduction.threshold }}%
                    </span>
                    <v-chip
                      :color="cleanupRules.size_reduction.enabled ? 'error' : 'grey'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ cleanupRules.size_reduction.enabled ? '已启用' : '已禁用' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
          
          <!-- 目录统计显示部分 -->
          <v-card v-if="pathStats.length" flat class="rounded mb-3 border config-card">
            <v-card-title class="text-caption d-flex align-center justify-space-between px-3 py-2 bg-primary-lighten-5">
              <div class="d-flex align-center">
                <v-icon icon="mdi-chart-bar" class="mr-2" color="primary" size="small" />
                <span>目录统计</span>
                <v-chip v-if="lastStatsUpdate" size="x-small" color="info" variant="flat" class="ml-1">
                  {{ lastStatsUpdate }}
                </v-chip>
              </div>
              <v-btn 
                size="small" 
                color="primary" 
                variant="tonal"
                :loading="updatingStats"
                :disabled="updatingStats" 
                @click="updateStats"
                class="stats-update-btn"
              >
                <v-icon icon="mdi-refresh" size="small" class="mr-1" />
                <span>更新统计</span>
              </v-btn>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-table density="compact" class="text-body-2">
                <thead>
                  <tr>
                    <th class="text-body-2 font-weight-bold">路径</th>
                    <th class="text-body-2 font-weight-bold text-center">总大小</th>
                    <th class="text-body-2 font-weight-bold text-center">文件数</th>
                    <th class="text-body-2 font-weight-bold text-center">子目录数</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(path, index) in validPathStats" :key="index">
                    <td>
                      <div class="d-flex align-center">
                        <v-icon icon="mdi-folder" size="small" color="amber-darken-2" class="mr-2" />
                        <span class="text-truncate" style="max-width: 300px;">{{ path.path }}</span>
                      </div>
                    </td>
                    <td class="text-center">{{ formatSize(path.total_size_bytes) }}</td>
                    <td class="text-center">{{ path.file_count }}</td>
                    <td class="text-center">{{ path.dir_count }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
          
          <!-- 清理历史记录卡片 -->
          <v-card flat class="rounded mb-3 border config-card" v-if="cleanResult">
            <v-card-title class="text-caption d-flex align-center px-3 py-2 bg-primary-lighten-5">
              <v-icon icon="mdi-history" class="mr-2" color="primary" size="small" />
              <span>最近清理记录</span>
              <v-chip size="x-small" color="success" variant="flat" class="ml-2">
                {{ formatDate(new Date()) }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-alert 
                :type="cleanResult.status === 'success' ? 'success' : 'error'" 
                variant="tonal" 
                density="compact" 
                class="ma-2"
              >
                {{ cleanResult.status === 'success' ? 
                  `清理成功，共删除 ${cleanResult.removed_dirs.length} 个目录，释放 ${cleanResult.total_freed_space.toFixed(2)}MB 空间` : 
                  cleanResult.message || '清理失败' }}
              </v-alert>
              
              <div v-if="cleanResult.status === 'success' && cleanResult.removed_dirs.length">
                <v-card flat class="ma-2 px-2 py-1 bg-grey-lighten-5">
                  <div class="d-flex align-center px-2 py-1">
                    <v-icon icon="mdi-information-outline" size="small" color="info" class="mr-2"></v-icon>
                    <span class="text-caption">按类型统计：空目录({{ cleanResult.removed_empty_dirs_count }})、小体积目录({{ cleanResult.removed_small_dirs_count }})、体积减少目录({{ cleanResult.removed_size_reduction_dirs_count }})</span>
                  </div>
                </v-card>
                
                <div class="my-2 px-3">
                  <div class="text-subtitle-2 font-weight-medium d-flex justify-space-between align-center">
                    <span>已删除的目录：</span>
                    <v-btn 
                      v-if="cleanResult.removed_dirs.length > 3" 
                      size="x-small" 
                      color="primary"
                      variant="text"
                      @click="showCleanResultDialog = true"
                    >
                      查看全部
                    </v-btn>
                  </div>
                </div>
                
                <v-list density="compact" class="pa-0">
                  <v-list-item
                    v-for="(dir, index) in cleanResult.removed_dirs.slice(0, 3)"
                    :key="index"
                    class="clean-history-item"
                  >
                    <template v-slot:prepend>
                      <v-avatar :color="getCleanTypeColor(dir.type) + '-lighten-4'" size="28" class="mr-2">
                        <v-icon 
                          :icon="getCleanTypeIcon(dir.type)" 
                          size="small" 
                          :color="getCleanTypeColor(dir.type)" 
                        />
                      </v-avatar>
                    </template>
                    
                    <v-list-item-title class="text-body-2 clean-dir-path">
                      {{ dir.path }}
                    </v-list-item-title>
                    
                    <template v-slot:append>
                      <div class="d-flex align-center">
                        <span v-if="dir.type === 'small'" class="text-caption mr-2">{{ dir.size.toFixed(2) }}MB</span>
                        <span v-if="dir.type === 'size_reduction'" class="text-caption mr-2">减少{{ dir.reduction_percent.toFixed(0) }}%</span>
                        <v-chip
                          size="x-small"
                          :color="getCleanTypeColor(dir.type)"
                          variant="flat"
                          class="clean-type-chip"
                        >
                          {{ getCleanTypeText(dir.type) }}
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                  
                  <v-list-item v-if="cleanResult.removed_dirs.length > 3" class="text-center py-1">
                    <v-btn 
                      size="small" 
                      color="primary"
                      variant="text"
                      @click="showCleanResultDialog = true"
                      class="mx-auto"
                    >
                      <v-icon size="small" class="mr-1">mdi-dots-horizontal</v-icon>
                      查看全部 {{ cleanResult.removed_dirs.length }} 个目录
                    </v-btn>
                  </v-list-item>
                </v-list>
              </div>
              
              <div v-else-if="cleanResult.status === 'success' && cleanResult.removed_dirs.length === 0" class="text-center py-3">
                <v-icon icon="mdi-information-outline" size="large" color="info" class="mb-2" />
                <div>没有符合清理条件的目录</div>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- 清理历史 -->
          <v-card flat class="rounded mb-3 border config-card">
            <v-card-title class="text-caption d-flex align-center px-3 py-2 bg-primary-lighten-5">
              <v-icon icon="mdi-history" class="mr-2" color="primary" size="small" />
              <span>清理历史</span>
            </v-card-title>
            <v-card-text class="px-3 py-2">
              <div v-if="!cleanHistory.length" class="text-center text-grey py-1">
                <v-icon icon="mdi-information-outline" size="small" class="mb-1" />
                <div class="text-caption">暂无清理历史记录</div>
              </div>
              <v-timeline v-else density="compact" align="start" truncate-line="both" class="mt-0">
                <v-timeline-item 
                  v-for="(item, index) in cleanHistory.slice(0, 3)" 
                  :key="index"
                  :dot-color="getHistoryColor(index)"
                  size="x-small"
                >
                  <template v-slot:icon>
                    <v-icon size="x-small">mdi-broom</v-icon>
                  </template>
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-caption text-grey-darken-2">{{ formatDate(new Date(item.last_update)) }}</span>
                    <v-chip size="x-small" :color="getHistoryColor(index)" variant="flat">
                      #{{ index + 1 }}
                    </v-chip>
                  </div>
                  <div class="text-caption">
                    清理 <strong>{{ item.removed_dirs.length }}</strong> 个目录
                    (释放 {{ item.total_freed_space.toFixed(2) }}MB)
                  </div>
                </v-timeline-item>
                <v-timeline-item v-if="cleanHistory.length > 3" dot-color="primary" size="x-small">
                  <template v-slot:icon>
                    <v-icon size="x-small">mdi-dots-horizontal</v-icon>
                  </template>
                  <div class="text-caption d-flex align-center">
                    <span class="text-grey">还有 {{ cleanHistory.length - 3 }} 条历史记录</span>
                    <v-btn 
                      variant="text" 
                      density="comfortable" 
                      size="x-small" 
                      color="primary"
                      class="ml-2"
                      @click="showHistoryDialog = true"
                    >
                      查看更多
                    </v-btn>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
          
          <!-- 帮助信息卡片 -->
          <v-card flat class="rounded mb-3 border config-card">
            <v-card-text class="d-flex align-center px-3 py-2">
              <v-icon icon="mdi-information" color="info" class="mr-2" size="small"></v-icon>
              <span class="text-caption">
                点击"配置"按钮可设置清理策略和监控目录。点击"立即清理"按钮可立即执行清理任务。
              </span>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="px-2 py-1">
        <v-btn color="info" @click="refreshData" prepend-icon="mdi-refresh" :disabled="refreshing" :loading="refreshing" variant="text" size="small">刷新数据</v-btn>
        <v-spacer></v-spacer>
        <v-btn 
          color="success" 
          @click="triggerClean" 
          :loading="actionLoading" 
          :disabled="actionLoading || cleanProgress.running" 
          prepend-icon="mdi-broom" 
          variant="text" 
          size="small"
        >
          立即清理
        </v-btn>
        <v-btn color="primary" @click="emit('switch')" prepend-icon="mdi-cog" variant="text" size="small">配置</v-btn>
        <v-btn color="grey" @click="emit('close')" prepend-icon="mdi-close" variant="text" size="small">关闭</v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- 清理结果对话框 -->
    <v-dialog v-model="showCleanResultDialog" max-width="600">
      <v-card>
        <v-card-title class="text-subtitle-1 d-flex align-center px-3 py-2 bg-primary-lighten-5">
          <v-icon icon="mdi-broom" class="mr-2" color="primary" />
          <span>清理结果</span>
        </v-card-title>
        
        <v-card-text class="px-3 py-2">
          <div v-if="cleanResult">
            <v-alert 
              :type="cleanResult.status === 'success' ? 'success' : 'error'" 
              variant="tonal" 
              density="compact" 
              class="mb-3"
            >
              {{ cleanResult.status === 'success' ? 
                `清理成功，共删除 ${cleanResult.removed_dirs.length} 个目录，释放 ${cleanResult.total_freed_space.toFixed(2)}MB 空间` : 
                cleanResult.message || '清理失败' }}
            </v-alert>
            
            <div v-if="cleanResult.status === 'success' && cleanResult.removed_dirs.length">
              <div class="text-subtitle-2 mb-2">已删除的目录：</div>
              <v-list density="compact" class="bg-grey-lighten-5 rounded">
                <v-list-item
                  v-for="(dir, index) in cleanResult.removed_dirs"
                  :key="index"
                  class="py-1"
                >
                  <template v-slot:prepend>
                    <v-icon 
                      icon="mdi-folder-remove" 
                      size="small" 
                      :color="getCleanTypeColor(dir.type)" 
                      class="mr-2" 
                    />
                  </template>
                  <v-list-item-title class="text-caption">{{ dir.path }}</v-list-item-title>
                  <template v-slot:append>
                    <v-chip
                      size="x-small"
                      :color="getCleanTypeColor(dir.type)"
                      variant="flat"
                    >
                      {{ getCleanTypeText(dir.type) }}
                      {{ dir.type === 'size_reduction' ? `(${dir.reduction_percent.toFixed(0)}%)` : 
                         dir.type === 'small' ? `(${dir.size.toFixed(2)}MB)` : '' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>
            
            <div v-if="cleanResult.status === 'success' && cleanResult.removed_dirs.length === 0" class="text-center py-2">
              <v-icon icon="mdi-information-outline" size="large" color="info" class="mb-2" />
              <div>没有符合清理条件的目录</div>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions class="px-3 py-2">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showCleanResultDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 历史记录对话框 -->
    <v-dialog v-model="showHistoryDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-subtitle-1 d-flex align-center px-4 py-3 bg-primary-lighten-5">
          <v-icon icon="mdi-history" class="mr-2" color="primary" />
          <span>清理历史记录</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-timeline v-if="cleanHistory.length" density="compact" align="start">
            <v-timeline-item 
              v-for="(item, index) in cleanHistory" 
              :key="index"
              :dot-color="getHistoryColor(index)"
              size="small"
            >
              <template v-slot:icon>
                <v-icon size="x-small">mdi-broom</v-icon>
              </template>
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption font-weight-medium">{{ formatDate(new Date(item.last_update)) }}</span>
                <v-chip size="x-small" :color="getHistoryColor(index)" variant="flat">
                  #{{ index + 1 }}
                </v-chip>
              </div>
              <div class="text-body-2">
                清理 <strong>{{ item.removed_dirs.length }}</strong> 个目录
                (释放 {{ item.total_freed_space.toFixed(2) }}MB 空间)
              </div>
              <div class="d-flex flex-wrap text-caption mt-1">
                <v-chip size="x-small" color="success" variant="flat" class="mr-1 mb-1">
                  空目录: {{ item.removed_empty_dirs_count }}
                </v-chip>
                <v-chip size="x-small" color="warning" variant="flat" class="mr-1 mb-1">
                  小体积目录: {{ item.removed_small_dirs_count }}
                </v-chip>
                <v-chip size="x-small" color="error" variant="flat" class="mb-1">
                  体积减少目录: {{ item.removed_size_reduction_dirs_count }}
                </v-chip>
              </div>
            </v-timeline-item>
          </v-timeline>
          <div v-else class="d-flex align-center justify-center py-4">
            <v-icon icon="mdi-information-outline" color="grey" class="mr-2" />
            <span class="text-grey">暂无清理历史记录</span>
          </div>
        </v-card-text>
        <v-card-actions class="px-4 py-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="primary" @click="showHistoryDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 目录统计更新进度对话框 -->
    <v-dialog v-model="showUpdateStatsDialog" persistent max-width="400px">
      <v-card>
        <v-card-title class="text-subtitle-1 d-flex align-center px-4 py-3" :class="updatingStats ? 'bg-primary-lighten-5' : 'bg-success-lighten-5'">
          <v-icon :icon="updatingStats ? 'mdi-refresh' : 'mdi-check-circle'" class="mr-2" :color="updatingStats ? 'primary' : 'success'" />
          <span>{{ updatingStats ? '正在更新目录统计' : '更新完成' }}</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-center mb-3">
            <span class="text-subtitle-2">{{ updateStatsMessage || (updatingStats ? '正在更新目录统计数据，请稍候...' : '目录统计数据更新完成！') }}</span>
            <div class="text-h4 font-weight-bold mt-2" :class="updatingStats ? 'primary--text' : 'success--text'">
              {{ updateStatsProgress }}%
            </div>
          </div>
          <v-progress-linear
            v-model="updateStatsProgress"
            :color="updatingStats ? 'primary' : 'success'"
            height="10"
            rounded
            striped
          ></v-progress-linear>
          <div class="text-caption text-center mt-3 text-grey" v-if="updatingStats">
            <v-icon icon="mdi-information-outline" size="x-small" class="mr-1" />
            该过程可能需要较长时间，您可以关闭此窗口，统计将在后台继续进行
          </div>
        </v-card-text>
        <v-card-actions class="px-4 py-3">
          <v-spacer></v-spacer>
          <v-btn 
            :color="updatingStats ? 'primary' : 'success'" 
            variant="text" 
            @click="showUpdateStatsDialog = false"
            :disabled="updatingStats && updateStatsProgress < 5"
          >
            {{ updatingStats ? '关闭窗口（后台继续）' : '关闭' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 清理进度对话框 -->
    <v-dialog v-model="showCleanProgressDialog" persistent max-width="600px">
      <v-card>
        <v-card-title class="text-subtitle-1 d-flex align-center px-4 py-3" :class="getProgressStatusClass">
          <v-icon :icon="getProgressStatusIcon" class="mr-2" :color="getProgressStatusColor" />
          <span>{{ getProgressStatusText }}</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="progress-content">
            <!-- 进度显示 -->
            <div class="mb-3">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-subtitle-2">
                  {{ cleanProgress.message }}
                </span>
                <span class="text-h6 font-weight-bold" :class="getProgressStatusColor + '--text'">
                  {{ cleanProgress.percent.toFixed(0) }}%
                </span>
              </div>
              <v-progress-linear
                v-model="cleanProgress.percent"
                :color="getProgressStatusColor"
                height="12"
                rounded
                striped
              ></v-progress-linear>
            </div>
            
            <!-- 详细信息 -->
            <div class="progress-details pa-3 rounded-lg" :class="getProgressInfoBgClass">
              <div class="d-flex flex-wrap">
                <div class="progress-stat-item">
                  <v-icon icon="mdi-clock-time-five" size="small" class="mr-1"></v-icon>
                  <span>开始时间: {{ formatDate(new Date(cleanProgress.start_time || Date.now())) }}</span>
                </div>
                <div class="progress-stat-item">
                  <v-icon icon="mdi-folder-multiple" size="small" class="mr-1"></v-icon>
                  <span>总目录数: {{ cleanProgress.total_dirs }}</span>
                </div>
                <div class="progress-stat-item">
                  <v-icon icon="mdi-folder-check" size="small" class="mr-1"></v-icon>
                  <span>已处理: {{ cleanProgress.processed_dirs }}</span>
                </div>
                <div class="progress-stat-item">
                  <v-icon icon="mdi-delete" size="small" class="mr-1"></v-icon>
                  <span>已清理: {{ cleanProgress.removed_dirs.length }}</span>
                </div>
              </div>
              
              <div v-if="cleanProgress.current_dir" class="mt-2">
                <v-icon icon="mdi-folder-open" size="small" class="mr-1"></v-icon>
                <span class="text-caption">当前处理: {{ cleanProgress.current_dir }}</span>
              </div>
            </div>
            
            <!-- 已删除目录列表 -->
            <div v-if="cleanProgress.removed_dirs.length > 0" class="mt-3">
              <div class="text-subtitle-2 mb-2">已删除的目录:</div>
              <div class="removed-dirs-container bg-grey-lighten-5 rounded pa-1">
                <div 
                  v-for="(dir, index) in cleanProgress.removed_dirs.slice(0, 5)" 
                  :key="index"
                  class="removed-dir-item pa-2"
                >
                  <div class="d-flex align-center">
                    <v-icon :icon="getCleanTypeIcon(dir.type)" :color="getCleanTypeColor(dir.type)" size="small" class="mr-2"></v-icon>
                    <span class="text-caption text-truncate">{{ dir.path }}</span>
                  </div>
                </div>
                <div v-if="cleanProgress.removed_dirs.length > 5" class="text-center pa-2">
                  <span class="text-caption">... 还有 {{ cleanProgress.removed_dirs.length - 5 }} 个目录已删除</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn 
            color="primary" 
            variant="text" 
            @click="showCleanProgressDialog = false"
            :disabled="cleanProgress.running"
          >
            {{ cleanProgress.running ? '清理中...' : '关闭' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, toRefs, computed, onMounted, onUnmounted } from 'vue';

export default defineComponent({
  name: 'Page',
  
  props: {
    api: {
      type: [Object, Function],
      required: true
    }
  },
  
  emits: ['switch', 'close'],
  
  setup(props, { emit }) {
    // 状态
    const state = reactive({
      error: null,
      loading: true,
      refreshing: false,
      initialDataLoaded: false,
      actionMessage: null,
      actionMessageType: 'info',
      actionLoading: false,
      statusData: {
        enabled: false,
        cron: '',
        next_run_time: '',
        monitor_paths: [],
        exclude_dirs: [],
        only_when_no_download: false,
        dir_history_count: 0,
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
      },
      pathStats: [],
      showCleanResultDialog: false,
      cleanResult: null,
      downloaders: [],
      loadingDownloaders: false,
      cleanHistory: [],
      loadingHistory: false,
      showHistoryDialog: false,
      lastStatsUpdate: '',
      updatingStats: false,
      showUpdateStatsDialog: false,
      updateStatsProgress: 0,
      updateStatsMessage: '',
      cleanProgress: {
        running: false,
        total_dirs: 0,
        processed_dirs: 0,
        current_dir: "",
        removed_dirs: [],
        start_time: null,
        status: "idle",
        message: "",
        percent: 0
      },
      showCleanProgressDialog: false,
      progressPollTimer: null
    });
    
    // 计算属性：有效的路径统计
    const validPathStats = computed(() => {
      return state.pathStats.filter(path => path.exists && path.status === 'valid');
    });
    
    // 计算属性：清理规则
    const cleanupRules = computed(() => {
      return state.statusData.cleanup_rules || {
        empty_dir: false,
        small_dir: {
          enabled: false,
          max_size: 10
        },
        size_reduction: {
          enabled: false,
          threshold: 80
        }
      };
    });
    
    // 计算属性：下载器是否有活动任务
    const downloadersHaveActiveTasks = computed(() => {
      return state.downloaders.some(downloader => downloader.hasActiveTasks);
    });
    
    // 加载状态数据
    const loadStatusData = async () => {
      try {
        state.error = null;
        state.loading = true;
        
        const response = await props.api.get('plugin/TrashClean/status');
        if (response) {
          state.statusData = response;
          state.initialDataLoaded = true;
        }
      } catch (error) {
        state.error = `加载状态数据失败: ${error.message || error}`;
        console.error('加载状态数据失败:', error);
      } finally {
        state.loading = false;
      }
    };
    
    // 加载路径统计数据
    const loadPathStats = async () => {
      try {
        const response = await props.api.get('plugin/TrashClean/stats');
        if (response) {
          state.pathStats = response;
        }
      } catch (error) {
        state.error = `加载路径统计数据失败: ${error.message || error}`;
        console.error('加载路径统计数据失败:', error);
      }
    };
    
    // 加载下载器状态
    const loadDownloaderStatus = async () => {
      try {
        state.loadingDownloaders = true;
        
        const response = await props.api.get('plugin/TrashClean/downloaders');
        if (response && Array.isArray(response)) {
          state.downloaders = response;
        } else {
          state.downloaders = [];
        }
      } catch (error) {
        console.error('加载下载器状态失败:', error);
        state.downloaders = [];
      } finally {
        state.loadingDownloaders = false;
      }
    };
    
    // 加载清理历史记录
    const loadCleanHistory = async () => {
      try {
        state.loadingHistory = true;
        const response = await props.api.get('plugin/TrashClean/history');
        if (response) {
          state.cleanHistory = response;
        } else {
          state.cleanHistory = [];
        }
      } catch (error) {
        console.error('加载清理历史记录失败:', error);
        state.cleanHistory = [];
      } finally {
        state.loadingHistory = false;
      }
    };
    
    // 加载最新清理结果
    const loadLatestCleanResult = async () => {
      try {
        const response = await props.api.get('plugin/TrashClean/latest_clean_result');
        if (response) {
          state.cleanResult = response;
          console.log('已加载最新清理结果:', response);
        }
      } catch (error) {
        console.error('加载最新清理结果失败:', error);
      }
    };
    
    // 刷新所有数据
    const refreshData = async () => {
      try {
        state.refreshing = true;
        state.error = null;
        state.actionMessage = null;
        
        await loadStatusData();
        await loadPathStats();
        
        // 获取统计缓存信息
        try {
          const statsCache = await props.api.get('plugin/TrashClean/stats_cache');
          if (statsCache && statsCache.last_update) {
            state.lastStatsUpdate = statsCache.last_update;
          }
        } catch (error) {
          console.error('获取统计缓存失败:', error);
        }
        
        // 如果启用了只在无下载任务时执行，则加载下载器状态
        if (state.statusData.only_when_no_download) {
          await loadDownloaderStatus();
        }
        
        // 如果有历史记录，加载历史数据
        if (state.statusData.dir_history_count > 0) {
          await loadCleanHistory();
        }
        
        // 加载最新清理结果
        await loadLatestCleanResult();
        
        state.actionMessage = '数据刷新成功';
        state.actionMessageType = 'success';
        
        // 3秒后清除成功消息
        setTimeout(() => {
          state.actionMessage = null;
        }, 3000);
      } catch (error) {
        state.error = `刷新数据失败: ${error.message || error}`;
        console.error('刷新数据失败:', error);
      } finally {
        state.refreshing = false;
      }
    };
    
    // 手动更新统计数据
    const updateStats = async () => {
      try {
        state.updatingStats = true;
        state.error = null;
        state.showUpdateStatsDialog = true; // 显示更新对话框
        state.updateStatsProgress = 0; // 初始进度
        state.updateStatsMessage = "准备开始更新统计数据...";
        
        // 显示加载消息
        state.actionMessage = "正在更新目录统计数据，这可能需要一些时间...";
        state.actionMessageType = "info";
        
        // 启动进度轮询
        const progressTimer = setInterval(async () => {
          try {
            const statsCache = await props.api.get('plugin/TrashClean/stats_cache');
            if (statsCache) {
              state.updateStatsProgress = statsCache.progress || 0;
              state.updateStatsMessage = statsCache.message || "更新中...";
              
              // 如果更新完成，停止轮询
              if (statsCache.status === "success" && statsCache.progress >= 100) {
                clearInterval(progressTimer);
              }
            }
          } catch (err) {
            console.error('获取统计缓存进度失败:', err);
          }
        }, 500);
        
        // 执行更新操作
        const response = await props.api.post('plugin/TrashClean/update_stats');
        
        // 停止进度轮询
        clearInterval(progressTimer);
        
        // 获取最终结果
        const finalStats = await props.api.get('plugin/TrashClean/stats_cache');
        if (finalStats) {
          state.updateStatsProgress = finalStats.progress || 100;
          state.updateStatsMessage = finalStats.message || "更新完成";
          state.lastStatsUpdate = finalStats.last_update || "";
        }
        
        // 重新加载统计数据
        await loadPathStats();
        
        // 更新完成，但不自动关闭对话框，让用户手动关闭
        state.updatingStats = false;
        
        state.actionMessage = "目录统计数据更新成功";
        state.actionMessageType = "success";
        
        // 3秒后清除成功消息
        setTimeout(() => {
          if (state.actionMessage === "目录统计数据更新成功") {
            state.actionMessage = null;
          }
        }, 3000);
      } catch (error) {
        state.error = `更新目录统计数据失败: ${error.message || error}`;
        console.error('更新目录统计数据失败:', error);
        state.updatingStats = false;
      }
    };
    
    // 获取清理进度
    const getCleanProgress = async () => {
      try {
        const response = await props.api.get('plugin/TrashClean/clean_progress');
        if (response) {
          state.cleanProgress = response;
          
          // 如果清理任务正在运行并且进度对话框未显示，则显示它
          if (response.running && !state.showCleanProgressDialog) {
            state.showCleanProgressDialog = true;
          }
          
          // 如果清理任务已完成但对话框仍显示，则5秒后自动关闭
          if (!response.running && response.status !== "idle" && state.showCleanProgressDialog) {
            setTimeout(() => {
              if (!state.cleanProgress.running) {
                state.showCleanProgressDialog = false;
              }
            }, 5000);
          }
        }
      } catch (error) {
        console.error('获取清理进度失败:', error);
      }
    };
    
    // 启动清理进度轮询
    const startProgressPolling = () => {
      if (state.progressPollTimer) {
        clearInterval(state.progressPollTimer);
      }
      
      // 每秒轮询一次进度
      state.progressPollTimer = setInterval(async () => {
        await getCleanProgress();
        
        // 如果清理任务已经完成且不是初始状态，则停止轮询
        if (!state.cleanProgress.running && state.cleanProgress.status !== "idle") {
          stopProgressPolling();
        }
      }, 1000);
    };
    
    // 停止清理进度轮询
    const stopProgressPolling = () => {
      if (state.progressPollTimer) {
        clearInterval(state.progressPollTimer);
        state.progressPollTimer = null;
      }
    };
    
    // 触发手动清理
    const triggerClean = async () => {
      try {
        state.actionLoading = true;
        state.error = null;
        state.actionMessage = null;
        
        // 开始进度轮询
        startProgressPolling();
        
        // 显示进度对话框
        state.showCleanProgressDialog = true;
        
        const response = await props.api.post('plugin/TrashClean/clean');
        
        if (response) {
          state.cleanResult = response;
          
          // 继续轮询一段时间以显示最终结果
          setTimeout(() => {
            getCleanProgress();
          }, 1000);
          
          // 刷新数据
          await refreshData();
        }
      } catch (error) {
        state.error = `手动清理失败: ${error.message || error}`;
        console.error('手动清理失败:', error);
        
        // 停止进度轮询
        stopProgressPolling();
      } finally {
        state.actionLoading = false;
      }
    };
    
    // 格式化文件大小
    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B';
      
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      
      return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
    };
    
    // 获取清理类型对应的颜色
    const getCleanTypeColor = (type) => {
      switch (type) {
        case 'empty':
          return 'success';
        case 'small':
          return 'warning';
        case 'size_reduction':
          return 'error';
        default:
          return 'grey';
      }
    };
    
    // 获取清理类型对应的文本
    const getCleanTypeText = (type) => {
      switch (type) {
        case 'empty':
          return '空目录';
        case 'small':
          return '小体积';
        case 'size_reduction':
          return '体积减少';
        default:
          return '未知';
      }
    };
    
    // 格式化日期时间
    const formatDate = (date) => {
      if (!date) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
    
    // 获取清理类型对应的图标
    const getCleanTypeIcon = (type) => {
      switch (type) {
        case 'empty':
          return 'mdi-folder-remove';
        case 'small':
          return 'mdi-weight';
        case 'size_reduction':
          return 'mdi-chart-line-variant';
        default:
          return 'mdi-folder';
      }
    };
    
    // 添加格式化速度函数
    const formatSpeed = (bytesPerSecond) => {
      if (bytesPerSecond < 0 || bytesPerSecond === undefined) return "未知";
      const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
      let speed = bytesPerSecond;
      let unitIndex = 0;
      
      while (speed >= 1024 && unitIndex < units.length - 1) {
        speed /= 1024;
        unitIndex++;
      }
      
      return speed.toFixed(2) + ' ' + units[unitIndex];
    };
    
    // 添加格式化时间函数
    const formatETA = (seconds) => {
      if (seconds < 0 || seconds === undefined || seconds >= 8640000) return "未知";
      
      if (seconds < 60) {
        return `${seconds}秒`;
      } else if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}分钟`;
      } else if (seconds < 86400) {
        return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
      } else {
        return `${Math.floor(seconds / 86400)}天${Math.floor((seconds % 86400) / 3600)}小时`;
      }
    };
    
    // 获取历史记录颜色
    const getHistoryColor = (index) => {
      const colors = ['success', 'warning', 'error'];
      return colors[index % colors.length];
    };
    
    // 计算属性：进度状态颜色
    const getProgressStatusColor = computed(() => {
      switch (state.cleanProgress.status) {
        case 'success':
          return 'success';
        case 'error':
          return 'error';
        case 'running':
          return 'primary';
        default:
          return 'grey';
      }
    });
    
    // 计算属性：进度状态文本
    const getProgressStatusText = computed(() => {
      switch (state.cleanProgress.status) {
        case 'success':
          return '清理任务完成';
        case 'error':
          return '清理任务失败';
        case 'running':
          return '清理任务进行中...';
        default:
          return '准备开始清理';
      }
    });
    
    // 计算属性：进度状态图标
    const getProgressStatusIcon = computed(() => {
      switch (state.cleanProgress.status) {
        case 'success':
          return 'mdi-check-circle';
        case 'error':
          return 'mdi-alert-circle';
        case 'running':
          return 'mdi-progress-clock';
        default:
          return 'mdi-broom';
      }
    });
    
    // 计算属性：进度状态类
    const getProgressStatusClass = computed(() => {
      switch (state.cleanProgress.status) {
        case 'success':
          return 'bg-success-lighten-5';
        case 'error':
          return 'bg-error-lighten-5';
        case 'running':
          return 'bg-primary-lighten-5';
        default:
          return 'bg-grey-lighten-5';
      }
    });
    
    // 计算属性：进度信息背景类
    const getProgressInfoBgClass = computed(() => {
      switch (state.cleanProgress.status) {
        case 'success':
          return 'bg-success-lighten-5';
        case 'error':
          return 'bg-error-lighten-5';
        case 'running':
          return 'bg-primary-lighten-5';
        default:
          return 'bg-grey-lighten-5';
      }
    });
    
    // 组件挂载时加载数据
    onMounted(() => {
      refreshData();
      
      // 加载最新清理结果
      loadLatestCleanResult();
      
      // 检查是否有正在进行的清理任务
      getCleanProgress().then(() => {
        if (state.cleanProgress.running) {
          state.showCleanProgressDialog = true;
          startProgressPolling();
        }
      });
    });
    
    // 组件卸载时清理
    onUnmounted(() => {
      stopProgressPolling();
    });
    
    return {
      ...toRefs(state),
      validPathStats,
      cleanupRules,
      downloadersHaveActiveTasks,
      refreshData,
      triggerClean,
      formatSize,
      getCleanTypeColor,
      getCleanTypeText,
      formatDate,
      getCleanTypeIcon,
      formatSpeed,
      formatETA,
      getHistoryColor,
      updateStats,
      getProgressStatusColor,
      getProgressStatusText,
      getProgressStatusIcon,
      getProgressStatusClass,
      getProgressInfoBgClass,
      emit
    };
  }
});
</script>

<style>
.config-card {
  box-shadow: none !important;
}

.downloaders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.downloader-card {
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  border-radius: 8px;
  overflow: hidden;
}

.downloader-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.clean-history-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
}

.clean-history-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.clean-dir-path {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clean-type-chip {
  font-weight: 500;
}

.history-row:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.directory-path {
  max-width: 350px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.time-highlight {
  color: #1976d2;
}

.downloader-item {
  transition: background-color 0.2s ease;
}

.downloader-item.has-tasks {
  background-color: rgba(255, 193, 7, 0.05);
}

.downloader-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.status-chip {
  font-weight: 500;
}

.history-table th, .history-table td {
  padding: 8px 16px !important;
}

.active-task-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
}

.active-task-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.task-downloading {
  background-color: rgba(255, 193, 7, 0.1);
}

.torrent-name {
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-text {
  min-width: 45px;
  text-align: right;
}

.tasks-container {
  max-height: 300px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.02);
}

.task-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.task-item:last-child {
  border-bottom: none;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.7);
  margin-right: 4px;
}

.progress-value {
  min-width: 40px;
  text-align: right;
}

.progress-details {
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.progress-stat-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.removed-dirs-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.removed-dir-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.removed-dir-item:last-child {
  border-bottom: none;
}

.stats-update-btn {
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.stats-update-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style> 