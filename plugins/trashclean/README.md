# 垃圾文件清理插件

## 插件说明
自动清理下载文件夹中的垃圾文件，支持多种清理策略：
- 清理空目录
- 清理小体积目录
- 清理体积减少的目录

## 功能特点
1. 支持定时清理和手动清理
2. 自定义清理规则
3. 排除特定目录
4. 仅在下载器无任务时执行
5. 清理结果通知

## 数据管理
- **目录大小历史数据**: 系统只保留当前监控路径下的目录数据。当某个目录不再位于任何监控路径下时，其历史数据会在下次扫描时自动清理。
- **清理历史记录**: 保留最近的30条清理记录，便于追踪清理效果和历史趋势。

## 注意事项
1. 建议配置排除目录，避免意外删除重要文件
2. 体积减少目录清理功能需要累积足够的历史数据才能准确判断
3. 清理操作为永久删除，请谨慎配置

## 更新日志
### v1.0
- 初版发布

### v1.1 
- 改进历史数据管理机制
- 优化UI交互体验
- 增加仪表盘功能

MoviePilot 垃圾文件清理插件，用于自动清理下载目录中的垃圾文件和文件夹。

## 功能特点

- **多规则清理**：支持三种清理规则：空目录清理、小体积目录清理、体积减少目录清理
- **下载器状态监控**：可设置仅在下载器没有活动任务时执行清理
- **可视化文件浏览器**：内置文件浏览器，方便选择监控路径
- **定时自动执行**：支持自定义CRON表达式设置执行时间
- **路径排除功能**：可设置排除目录，避免误删重要文件
- **数据统计功能**：显示监控目录的文件数量、体积等统计信息

## 规则说明

1. **空目录清理**：清理不包含任何文件或子目录的空文件夹
2. **小体积目录清理**：清理总体积小于指定值(MB)的目录
3. **体积减少目录清理**：清理体积减少超过指定百分比的目录，通常表示重要内容被删除，剩余的是垃圾文件

## 使用方法

1. 在插件配置页面启用插件
2. 添加需要监控的下载目录路径
3. 根据需要选择清理规则和参数
4. 设置定时任务执行时间
5. 可选择仅在下载器没有活动任务时执行

## 注意事项

- 首次使用建议先不要启用自动清理，手动测试清理效果
- 清理前建议进行备份，避免重要文件被误删
- 可以设置排除目录，防止误删带有特定名称的目录
- 建议设置合理的小体积目录阈值和体积减少阈值，避免误删

## 作者信息

- 作者：madrays
- GitHub：[https://github.com/madrays](https://github.com/madrays)
- 插件版本：1.0.0

## 许可证

MIT 