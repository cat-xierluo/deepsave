# Location Guide

## DeepSeek Chat DOM Structure

DeepSeek Chat 的页面结构使用了特定的类名来组织不同的内容区域：

### 主要容器层级
- `class="be88ba8a"` - 聊天窗口的标题/名称容器
- `class="b83ee326"` - 主聊天窗口容器
  - `class="f6004764"` - 消息滚动容器
    - `class="f72b0bab"` - 消息列表容器
      - `class="dad65929"` - 消息组容器

### 消息元素
- `class="fa81"` - 用户消息容器
- `class="f9bf7997 c05b5566"` - AI 回复容器，包含：
  - `class="eb23581b dfa60d66"` - AI 图标容器
  - `class="edb250b1"` - AI 深度思考内容容器
  - `class="ds-markdown ds-markdown--block"` - AI 常规回复内容容器
  - `class="ds-flex"` - AI 回复底部操作栏

### DOM结构示例
```html
<div class="be88ba8a">                 <!-- 标题容器 -->
  <!-- 对话标题 -->
</div>
<div class="b83ee326">                 <!-- 主聊天窗口容器 -->
  <div class="f6004764">               <!-- 消息滚动容器 -->
    <div class="f72b0bab">             <!-- 消息列表容器 -->
      <div class="dad65929">           <!-- 消息组容器 -->
        <!-- 用户消息 -->
        <div class="fa81">
          <!-- 用户输入的内容 -->
        </div>
        <!-- AI回复 -->
        <div class="f9bf7997 c05b5566">
          <div class="eb23581b dfa60d66">
            <!-- AI图标 -->
          </div>
          <div class="edb250b1">
            <!-- AI深度思考内容 -->
          </div>
          <div class="ds-markdown ds-markdown--block">
            <!-- AI常规回复内容 -->
          </div>
          <div class="ds-flex">
            <!-- 底部操作栏 -->
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

注意：
1. 消息按照用户和AI的对话顺序交替排列在消息组容器中
2. 每个AI回复可能同时包含深度思考和常规回复两部分内容
3. 这些类名可能会随着 DeepSeek 的更新而改变，建议定期验证选择器的有效性 
