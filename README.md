# DeepSave
一个用于导出 DeepSeek 聊天记录的 Chrome 扩展。

## 功能特性
- 一键导出聊天记录
- 区分用户和AI的消息
- 区分深度思考内容和常规回复
- 支持 Markdown 和 JSON 格式导出
- 支持 DeepSeek 和 ChatGPT 平台

![ChatGPT Logo](pics/openai.png) 
![DeepSeek Logo](pics/deepseek.png) 

## 安装方法
1. 下载本项目的代码 [release](https://github.com/cat-xierluo/deepsave/releases/latest) （可以下载 zip 压缩包）解压
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目目录
安装后就能看到插件的图标了

## 使用方法
1. 访问 DeepSeek 或 ChatGPT 聊天页面
2. 等待页面完全加载
3. 点击扩展图标
4. 选择导出格式（Markdown 或 JSON）
5. 等待导出完成，文件将自动下载

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
MIT
