# 元素定位指南

本指南详细说明在动态类名环境下定位元素的策略和最佳实践。

## 核心策略
1. **语义化定位**
   ```javascript
   // 通过角色属性定位
   document.querySelector('[role="dialog"]')
   
   // 通过ARIA标签定位
   document.querySelector('[aria-label="发送按钮"]')
   ```

2. **内容特征定位**
   ```javascript
   // 通过文本内容定位
   document.evaluate(
     '//*[contains(text(),"已深度思考")]',
     document, null, XPathResult.FIRST_ORDERED_NODE_TYPE
   ).singleNodeValue
   ```

3. **结构定位**
   ```javascript
   // 层级结构定位
   document.querySelector('div > div:nth-child(2) > button')
   
   // 相邻元素定位
   document.querySelector('svg + span.timestamp')
   ```

## 防御性定位技巧
1. **多级选择器队列**
   ```javascript
   const selectors = {
     messageBlock: [
       'div[class*="message-container"]',
       'div:has(> div > button[aria-label*="copy i18n"])',
       'div[role="presentation"] > div > div > div'
     ],
     roleIndicator: [
       'svg[fill="#4D6BFE"]',      // 助手标识
       'img[alt*="avatar"]',       // 用户头像
       'div[aria-label*="用户"]'   // ARIA标签
     ]
   }
   ```

2. **动态特征检测**
   ```javascript
   // 智能元素查询
   smartQuery(selectorType, parent = document) {
     for (const selector of EXPORT_CONFIG.selectors[selectorType]) {
       const elements = parent.querySelectorAll(selector);
       if (elements.length > 0) return elements;
     }
     throw new Error(`找不到匹配的${selectorType}元素`);
   }
   ```

3. **DOM变化监听**
   ```javascript
   // 使用MutationObserver监听DOM变化
   setupMutationObserver() {
     this.observer = new MutationObserver(mutations => {
       mutations.forEach(mutation => {
         if (mutation.addedNodes.length) {
           this.cache.clear(); // 清空缓存以捕获新消息
         }
       });
     });
     this.observer.observe(document.body, {
       childList: true,
       subtree: true
     });
   }
   ```

## 实际应用案例
1. **消息块定位**
   ```javascript
   // 通过多重特征识别消息块
   const messageBlocks = document.querySelectorAll([
     'div[class*="message-container"]',
     'div:has(> div > button[aria-label*="copy"])',
     'div[role="presentation"]'
   ].join(','));
   ```

2. **角色识别**
   ```javascript
   // 通过SVG颜色识别助手消息
   const isAssistant = element.querySelector('svg[fill="#4D6BFE"]');
   
   // 通过头像识别用户消息
   const isUser = element.querySelector('img[alt*="avatar"]');
   ```

3. **内容提取**
   ```javascript
   // 识别并保留代码块格式
   if (el.querySelector('pre')) {
     return '```\n' + el.innerText + '\n```';
   }
   ```

## 调试技巧
1. **选择器测试**
   ```javascript
   // 在控制台验证选择器
   document.querySelectorAll('div[class*="message"]').length
   ```

2. **XPath测试**
   ```javascript
   // 测试XPath表达式
   document.evaluate(
     '//div[contains(@class, "message")]',
     document,
     null,
     XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
     null
   ).snapshotLength
   ```

## 最佳实践
1. 使用多级选择器作为备选方案
2. 优先使用语义化属性（role、aria-label等）
3. 结合使用CSS选择器和XPath
4. 实现等待和重试机制
5. 监听DOM变化自动更新

## 常见问题
1. **动态类名变化**
   - 使用属性选择器：`[class*="message"]`
   - 使用结构选择器：`:has(> .avatar)`

2. **异步加载内容**
   - 实现等待机制
   - 使用MutationObserver监听

3. **选择器失效**
   - 维护多个备选选择器
   - 实现自动降级策略 
