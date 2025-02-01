# DeepSave

一个用于导出 DeepSeek 聊天记录的 Chrome 扩展。

## 功能特性
- 一键导出完整聊天记录
- 保留代码块格式
- 自动分页处理
- 支持重试机制
- 实时DOM监听

## 项目结构
```
deepsave/
├── manifest.json        # 扩展配置文件
├── content-script.js    # 内容脚本（核心导出逻辑）
├── background.js       # 后台服务（消息处理）
├── popup.html         # 弹出窗口界面
├── popup.js          # 弹出窗口脚本
├── popup.css         # 弹出窗口样式
├── LOCATION_GUIDE.md  # 元素定位指南
└── icons/            # 图标资源
    ├── icon16.png    # 工具栏图标
    ├── icon32.png    # 小号图标
    ├── icon48.png    # 中等图标
    └── icon128.png   # 大号图标
```

## 安装方法
1. 下载本项目的代码（可以下载 zip 压缩包）
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目目录

## 使用方法
1. 访问 DeepSeek 聊天页面
2. 等待页面完全加载
3. 点击扩展图标
4. 等待导出完成，文件将自动下载

## 常见问题

### 导出失败
1. 确保页面完全加载
2. 检查是否在正确的URL下使用
3. 尝试刷新页面后重试

### 格式问题
1. 代码块格式异常
   - 检查 Markdown 渲染器设置
   - 确保使用兼容的查看器

2. 内容缺失
   - 检查页面是否完全展开
   - 确认分页是否完全处理


## 许可证
MIT License - 详见 [LICENSE](LICENSE) 文件
