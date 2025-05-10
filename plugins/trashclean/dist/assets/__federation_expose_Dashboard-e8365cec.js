import { importShared } from './__federation_fn_import-054b33c3.js';
import { _ as _export_sfc } from './_plugin-vue_export-helper-c4c0bc37.js';

const Dashboard_vue_vue_type_style_index_0_scoped_92bb95fe_lang = '';

const {resolveComponent:_resolveComponent,createVNode:_createVNode,toDisplayString:_toDisplayString,createTextVNode:_createTextVNode,withCtx:_withCtx,openBlock:_openBlock,createBlock:_createBlock,createCommentVNode:_createCommentVNode,createElementVNode:_createElementVNode,createElementBlock:_createElementBlock,normalizeClass:_normalizeClass} = await importShared('vue');


const _hoisted_1 = { class: "dashboard-widget" };
const _hoisted_2 = {
  key: 0,
  class: "text-center py-2"
};
const _hoisted_3 = {
  key: 1,
  class: "text-error text-caption d-flex align-center"
};
const _hoisted_4 = { key: 2 };
const _hoisted_5 = {
  key: 3,
  class: "text-caption text-disabled text-center py-3"
};
const _hoisted_6 = { class: "text-caption text-disabled" };

const {ref,reactive,onMounted,onUnmounted,computed} = await importShared('vue');



const _sfc_main = {
  __name: 'Dashboard',
  props: {
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
},
  setup(__props) {

const props = __props;

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

return (_ctx, _cache) => {
  const _component_v_icon = _resolveComponent("v-icon");
  const _component_v_card_title = _resolveComponent("v-card-title");
  const _component_v_card_subtitle = _resolveComponent("v-card-subtitle");
  const _component_v_card_item = _resolveComponent("v-card-item");
  const _component_v_progress_circular = _resolveComponent("v-progress-circular");
  const _component_v_list_item_title = _resolveComponent("v-list-item-title");
  const _component_v_list_item = _resolveComponent("v-list-item");
  const _component_v_divider = _resolveComponent("v-divider");
  const _component_v_chip = _resolveComponent("v-chip");
  const _component_v_list = _resolveComponent("v-list");
  const _component_v_card_text = _resolveComponent("v-card-text");
  const _component_v_spacer = _resolveComponent("v-spacer");
  const _component_v_btn = _resolveComponent("v-btn");
  const _component_v_card_actions = _resolveComponent("v-card-actions");
  const _component_v_card = _resolveComponent("v-card");

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createVNode(_component_v_card, {
      flat: !props.config?.attrs?.border,
      loading: loading.value,
      class: "fill-height d-flex flex-column"
    }, {
      default: _withCtx(() => [
        (props.config?.attrs?.title || props.config?.attrs?.subtitle)
          ? (_openBlock(), _createBlock(_component_v_card_item, { key: 0 }, {
              default: _withCtx(() => [
                _createVNode(_component_v_card_title, { class: "d-flex align-center" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_icon, {
                      icon: "mdi-broom",
                      class: "mr-2",
                      color: "primary"
                    }),
                    _createTextVNode(" " + _toDisplayString(props.config?.attrs?.title || '垃圾文件清理概览'), 1)
                  ]),
                  _: 1
                }),
                (props.config?.attrs?.subtitle)
                  ? (_openBlock(), _createBlock(_component_v_card_subtitle, { key: 0 }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(props.config.attrs.subtitle), 1)
                      ]),
                      _: 1
                    }))
                  : _createCommentVNode("", true)
              ]),
              _: 1
            }))
          : _createCommentVNode("", true),
        _createVNode(_component_v_card_text, { class: "flex-grow-1 pa-3" }, {
          default: _withCtx(() => [
            (loading.value && !initialDataLoaded.value)
              ? (_openBlock(), _createElementBlock("div", _hoisted_2, [
                  _createVNode(_component_v_progress_circular, {
                    indeterminate: "",
                    color: "primary",
                    size: "small"
                  }),
                  _cache[0] || (_cache[0] = _createElementVNode("div", { class: "text-caption mt-2" }, "加载中...", -1))
                ]))
              : (error.value)
                ? (_openBlock(), _createElementBlock("div", _hoisted_3, [
                    _createVNode(_component_v_icon, {
                      size: "small",
                      color: "error",
                      class: "mr-2"
                    }, {
                      default: _withCtx(() => _cache[1] || (_cache[1] = [
                        _createTextVNode("mdi-alert-circle-outline")
                      ])),
                      _: 1
                    }),
                    _createTextVNode(" " + _toDisplayString(error.value || '数据加载失败'), 1)
                  ]))
                : (initialDataLoaded.value && statusData)
                  ? (_openBlock(), _createElementBlock("div", _hoisted_4, [
                      _createVNode(_component_v_list, {
                        density: "compact",
                        class: "py-0",
                        nav: ""
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_list_item, { class: "px-2" }, {
                            prepend: _withCtx(() => [
                              _createVNode(_component_v_icon, {
                                size: "small",
                                color: statusData.enabled ? 'success' : 'grey',
                                class: "mr-2"
                              }, {
                                default: _withCtx(() => _cache[2] || (_cache[2] = [
                                  _createTextVNode(" mdi-power ")
                                ])),
                                _: 1
                              }, 8, ["color"])
                            ]),
                            default: _withCtx(() => [
                              _createVNode(_component_v_list_item_title, { class: "text-caption" }, {
                                default: _withCtx(() => [
                                  _cache[3] || (_cache[3] = _createTextVNode(" 插件状态: ")),
                                  _createElementVNode("span", {
                                    class: _normalizeClass(statusData.enabled ? 'text-success' : 'text-grey')
                                  }, _toDisplayString(statusData.enabled ? '已启用' : '已禁用'), 3)
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }),
                          _createVNode(_component_v_divider, { class: "my-1" }),
                          latestCleanResult
                            ? (_openBlock(), _createBlock(_component_v_list_item, {
                                key: 0,
                                class: "px-2"
                              }, {
                                prepend: _withCtx(() => [
                                  _createVNode(_component_v_icon, {
                                    size: "small",
                                    color: "primary",
                                    class: "mr-2"
                                  }, {
                                    default: _withCtx(() => _cache[4] || (_cache[4] = [
                                      _createTextVNode("mdi-calendar-clock")
                                    ])),
                                    _: 1
                                  })
                                ]),
                                default: _withCtx(() => [
                                  _createVNode(_component_v_list_item_title, { class: "text-caption" }, {
                                    default: _withCtx(() => [
                                      _createTextVNode(" 上次清理: " + _toDisplayString(getLastCleanTimeText()), 1)
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }))
                            : _createCommentVNode("", true),
                          latestCleanResult
                            ? (_openBlock(), _createBlock(_component_v_list_item, {
                                key: 1,
                                class: "px-2"
                              }, {
                                prepend: _withCtx(() => [
                                  _createVNode(_component_v_icon, {
                                    size: "small",
                                    color: "info",
                                    class: "mr-2"
                                  }, {
                                    default: _withCtx(() => _cache[5] || (_cache[5] = [
                                      _createTextVNode("mdi-folder-remove")
                                    ])),
                                    _: 1
                                  })
                                ]),
                                default: _withCtx(() => [
                                  _createVNode(_component_v_list_item_title, { class: "text-caption" }, {
                                    default: _withCtx(() => [
                                      _createTextVNode(" 清理目录: " + _toDisplayString(latestCleanResult.removed_dirs?.length || 0) + " 个 ", 1)
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }))
                            : _createCommentVNode("", true),
                          latestCleanResult
                            ? (_openBlock(), _createBlock(_component_v_list_item, {
                                key: 2,
                                class: "px-2"
                              }, {
                                prepend: _withCtx(() => [
                                  _createVNode(_component_v_icon, {
                                    size: "small",
                                    color: "success",
                                    class: "mr-2"
                                  }, {
                                    default: _withCtx(() => _cache[6] || (_cache[6] = [
                                      _createTextVNode("mdi-harddisk")
                                    ])),
                                    _: 1
                                  })
                                ]),
                                default: _withCtx(() => [
                                  _createVNode(_component_v_list_item_title, { class: "text-caption" }, {
                                    default: _withCtx(() => [
                                      _createTextVNode(" 释放空间: " + _toDisplayString(formatSize(latestCleanResult.total_freed_space)), 1)
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }))
                            : _createCommentVNode("", true),
                          (statusData.enabled)
                            ? (_openBlock(), _createBlock(_component_v_list_item, {
                                key: 3,
                                class: "px-2"
                              }, {
                                prepend: _withCtx(() => [
                                  _createVNode(_component_v_icon, {
                                    size: "small",
                                    color: "amber-darken-2",
                                    class: "mr-2"
                                  }, {
                                    default: _withCtx(() => _cache[7] || (_cache[7] = [
                                      _createTextVNode("mdi-timer-outline")
                                    ])),
                                    _: 1
                                  })
                                ]),
                                default: _withCtx(() => [
                                  _createVNode(_component_v_list_item_title, { class: "text-caption" }, {
                                    default: _withCtx(() => [
                                      _createTextVNode(" 下次运行: " + _toDisplayString(statusData.next_run_time || '未知'), 1)
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }))
                            : _createCommentVNode("", true),
                          _createVNode(_component_v_list_item, { class: "px-2" }, {
                            prepend: _withCtx(() => [
                              _createVNode(_component_v_icon, {
                                size: "small",
                                color: "deep-purple",
                                class: "mr-2"
                              }, {
                                default: _withCtx(() => _cache[8] || (_cache[8] = [
                                  _createTextVNode("mdi-folder-multiple")
                                ])),
                                _: 1
                              })
                            ]),
                            default: _withCtx(() => [
                              _createVNode(_component_v_list_item_title, { class: "text-caption" }, {
                                default: _withCtx(() => [
                                  _createTextVNode(" 监控路径: " + _toDisplayString(statusData.monitor_paths?.length || 0) + " 个 ", 1)
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }),
                          (statusData.cleanup_rules)
                            ? (_openBlock(), _createBlock(_component_v_list_item, {
                                key: 4,
                                class: "px-2"
                              }, {
                                prepend: _withCtx(() => [
                                  _createVNode(_component_v_icon, {
                                    size: "small",
                                    color: "pink",
                                    class: "mr-2"
                                  }, {
                                    default: _withCtx(() => _cache[9] || (_cache[9] = [
                                      _createTextVNode("mdi-filter-variant")
                                    ])),
                                    _: 1
                                  })
                                ]),
                                default: _withCtx(() => [
                                  _createVNode(_component_v_list_item_title, { class: "text-caption" }, {
                                    default: _withCtx(() => [
                                      _cache[13] || (_cache[13] = _createTextVNode(" 清理规则: ")),
                                      (statusData.cleanup_rules.empty_dir)
                                        ? (_openBlock(), _createBlock(_component_v_chip, {
                                            key: 0,
                                            size: "x-small",
                                            color: "success",
                                            variant: "flat",
                                            class: "ml-1"
                                          }, {
                                            default: _withCtx(() => _cache[10] || (_cache[10] = [
                                              _createTextVNode(" 空目录 ")
                                            ])),
                                            _: 1
                                          }))
                                        : _createCommentVNode("", true),
                                      (statusData.cleanup_rules.small_dir?.enabled)
                                        ? (_openBlock(), _createBlock(_component_v_chip, {
                                            key: 1,
                                            size: "x-small",
                                            color: "warning",
                                            variant: "flat",
                                            class: "ml-1"
                                          }, {
                                            default: _withCtx(() => _cache[11] || (_cache[11] = [
                                              _createTextVNode(" 小体积 ")
                                            ])),
                                            _: 1
                                          }))
                                        : _createCommentVNode("", true),
                                      (statusData.cleanup_rules.size_reduction?.enabled)
                                        ? (_openBlock(), _createBlock(_component_v_chip, {
                                            key: 2,
                                            size: "x-small",
                                            color: "error",
                                            variant: "flat",
                                            class: "ml-1"
                                          }, {
                                            default: _withCtx(() => _cache[12] || (_cache[12] = [
                                              _createTextVNode(" 体积减少 ")
                                            ])),
                                            _: 1
                                          }))
                                        : _createCommentVNode("", true)
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }))
                            : _createCommentVNode("", true)
                        ]),
                        _: 1
                      })
                    ]))
                  : (_openBlock(), _createElementBlock("div", _hoisted_5, [
                      _createVNode(_component_v_icon, {
                        icon: "mdi-information-outline",
                        class: "mb-2"
                      }),
                      _cache[14] || (_cache[14] = _createElementVNode("div", null, "暂无数据，请检查插件配置", -1))
                    ]))
          ]),
          _: 1
        }),
        (props.allowRefresh)
          ? (_openBlock(), _createBlock(_component_v_divider, { key: 1 }))
          : _createCommentVNode("", true),
        (props.allowRefresh)
          ? (_openBlock(), _createBlock(_component_v_card_actions, {
              key: 2,
              class: "px-3 py-1"
            }, {
              default: _withCtx(() => [
                _createElementVNode("span", _hoisted_6, _toDisplayString(lastRefreshedTimeDisplay.value), 1),
                _createVNode(_component_v_spacer),
                _createVNode(_component_v_btn, {
                  icon: "",
                  variant: "text",
                  size: "small",
                  onClick: fetchData,
                  loading: loading.value
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_icon, { size: "small" }, {
                      default: _withCtx(() => _cache[15] || (_cache[15] = [
                        _createTextVNode("mdi-refresh")
                      ])),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["loading"])
              ]),
              _: 1
            }))
          : _createCommentVNode("", true)
      ]),
      _: 1
    }, 8, ["flat", "loading"])
  ]))
}
}

};
const Dashboard = /*#__PURE__*/_export_sfc(_sfc_main, [['__scopeId',"data-v-92bb95fe"]]);

export { Dashboard as default };
