# DeepSeek Chat Exporter

一个用于将DeepSeek聊天记录导出为Markdown格式的Chrome扩展。

## 功能特性
- 一键导出完整聊天记录
- 保留代码块格式
- 自动分页处理
- 支持重试机制
- 实时DOM监听

## 项目结构
```
deepseek-exporter/
├── manifest.json        # 扩展配置文件
├── content-script.js    # 内容脚本（核心导出逻辑）
├── background.js       # 后台服务（消息处理）
├── popup.html         # 弹出窗口界面
├── popup.js          # 弹出窗口脚本
├── LOCATION_GUIDE.md  # 元素定位指南
├── README.md         # 项目说明文档
└── icons/            # 图标资源
    ├── icon16.png    # 工具栏图标
    ├── icon48.png    # 中等图标
    └── icon128.png   # 大号图标
```

## 安装步骤

### 开发环境配置
1. 克隆仓库
```bash
git clone https://github.com/yourusername/deepseek-exporter.git
cd deepseek-exporter
```

2. 安装依赖
```bash
npm install
```

3. 生成图标
```bash
node generate-icons.js
```

### Chrome安装
1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目目录

## 使用方法
1. 访问 DeepSeek 聊天页面
2. 等待页面完全加载
3. 点击扩展图标或右下角的"导出聊天记录"按钮
4. 等待导出完成，文件将自动下载

## 开发指南

### 核心文件说明
- `content-script.js`: 实现聊天记录提取和导出逻辑
- `background.js`: 处理跨页面消息通信
- `popup.js`: 处理用户界面交互

### 调试方法
1. **内容脚本调试**
   - 打开DeepSeek聊天页面
   - 按F12打开开发者工具
   - 查看Console面板的日志输出

2. **后台脚本调试**
   - 在扩展管理页面点击"背景页"
   - 查看后台Console输出

3. **弹出窗口调试**
   - 右键扩展图标，选择"检查弹出内容"

### 元素定位
- 详细的元素定位策略请参考 [LOCATION_GUIDE.md](./LOCATION_GUIDE.md)
- 包含选择器示例和最佳实践

## 常见问题

### 导出失败
1. 确保页面完全加载
2. 检查是否在正确的URL下使用
3. 尝试刷新页面后重试

### 格式问题
1. 代码块格式异常
   - 检查Markdown渲染器设置
   - 确保使用兼容的查看器

2. 内容缺失
   - 检查页面是否完全展开
   - 确认分页是否完全处理

## 贡献指南
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 版本历史
- v1.0.0 (2024-03)
  - 初始版本发布
  - 支持基本导出功能
  - 实现代码块格式保留

## 许可证
MIT License - 详见 [LICENSE](LICENSE) 文件

## 作者
- 项目维护者 - [Your Name]
- 贡献者列表 - [Contributors](https://github.com/yourusername/deepseek-exporter/contributors)

## 致谢
- DeepSeek团队提供的优秀对话平台
- 所有为本项目提供反馈和建议的用户

## 联系方式
- 项目Issues: [GitHub Issues](https://github.com/yourusername/deepseek-exporter/issues)
- 邮箱: your.email@example.com
