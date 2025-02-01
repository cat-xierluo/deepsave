// 立即执行的初始化日志
console.log('=== Chat Exporter 插件已加载 ===');

// 全局导出器实例
let exporter = null;

// 增强版聊天记录导出工具
const EXPORT_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  selectors: {
    messageBlock: [
      // DeepSeek特定的消息容器
      'div[class*="a5cd95be"]',
      'div[class*="be88ba8a"]',
      'div[class*="f8d1e4c0"]',
      // ChatGPT原有选择器
      'div[data-message-id]',
      'div[data-message-author-role]',
      'div[role="presentation"]',
      'div[data-testid*="message"]',
      'div[data-testid*="conversation-turn"]',
      'div[class*="prose"]',
      'div[class*="markdown"]',
      'div[class*="message-content"]',
      // 通用备选
      'div.text-message'
    ],
    roleIndicator: [
      // DeepSeek特定的角色标识
      'div[class*="eb23581b"]', // AI图标容器
      'div[class*="edb250b1"]', // AI角色信息
      'div[class*="f72b0bab"]', // 用户消息标识
      // ChatGPT原有选择器
      'div[data-message-author-role]',
      'div[data-testid^="conversation-turn-"]',
      'h5.sr-only',
      'h6.sr-only',
      'div[class*="agent-turn"]',
      'div[class*="human-turn"]',
      'img[alt*="User" i]',
      'img[alt*="Assistant" i]',
      // 通用备选
      'div[data-role]',
      'div[data-author]'
    ],
    content: [
      // DeepSeek特定的内容容器
      'div[class*="d8ed659a"]', // 文本内容
      'div[class*="ds-markdown"]', // markdown内容
      'div[class*="f6004764"]', // 消息内容容器
      // ChatGPT原有选择器
      'div.markdown',
      'div[class*="prose"]',
      'div[class*="message-content"]',
      'div[data-message-author-role] div.markdown',
      'div[data-message-author-role] div[class*="prose"]',
      '.text-message-content',
      // 通用备选
      'div[class*="content"]',
      'div[class*="text"]'
    ],
    timestamp: [
      'time',
      'div[class*="time"]',
      'span[class*="timestamp"]',
      'div[class*="date"]'
    ],
    conversationTitle: [
      // DeepSeek特定的标题选择器
      'div[class*="d8ed659a"]', // 第一条消息内容通常就是标题
      'div[class*="f72b0bab"] div[class*="d8ed659a"]', // 用户第一条消息
      // ChatGPT原有选择器
      'h1',
      'div[role="heading"]',
      'div[class*="title"]',
      'div[class*="header"]'
    ]
  }
};

class ChatExporter {
  constructor() {
    this.observer = null;
    this.cache = new Map();
    console.log('ChatExporter constructor called');
    this.init();
  }

  init() {
    try {
      console.log('ChatExporter init started');
    this.setupMutationObserver();
      console.log('ChatExporter init completed');
    } catch (error) {
      console.error('ChatExporter init failed:', error);
    }
  }

  // 智能元素查询
  smartQuery(selectorType, parent = document) {
    console.log(`Querying for ${selectorType}`);
    for (const selector of EXPORT_CONFIG.selectors[selectorType]) {
      console.log(`Trying selector: ${selector}`);
      const elements = parent.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        return elements;
      }
    }
    console.warn(`No elements found for ${selectorType}`);
    throw new Error(`找不到匹配的${selectorType}元素`);
  }

  // 收集所有消息
  collectMessages() {
    try {
      console.log('开始收集消息...');
      const messages = [];
      
      // 查找消息组容器
      const messageGroup = document.querySelector('div[class*="dad65929"]');
      if (!messageGroup) {
        console.warn('未找到消息组容器');
        return messages;
      }
      
      // 获取所有直接子元素（用户消息和AI回复交替出现）
      const messageElements = messageGroup.children;
      console.log(`找到 ${messageElements.length} 个消息元素`);
      
      Array.from(messageElements).forEach((element, index) => {
        console.log(`处理第 ${index + 1} 个消息元素`);
        
        // 检查是否是用户消息
        if (element.classList.contains('fa81')) {
          const content = element.innerText.trim();
          if (content) {
            messages.push({
              role: 'user',
              content: content,
              timestamp: Date.now(),
              contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
              contentLength: content.length
            });
            console.log('添加用户消息，预览:', content.substring(0, 50));
          }
        }
        // 检查是否是AI回复
        else if (element.classList.contains('f9bf7997')) {
          let aiContent = '';
          
          // 1. 查找深度思考部分
          const deepThinkingContainer = element.querySelector('div[class*="edb250b1"]');
          if (deepThinkingContainer) {
            const deepThinkingText = deepThinkingContainer.innerText.trim();
            if (deepThinkingText) {
              aiContent += "【深度思考】\n" + deepThinkingText + "\n\n";
              console.log('找到深度思考内容');
            }
          }
          
          // 2. 查找常规回复部分
          const regularResponse = element.querySelector('div[class="ds-markdown ds-markdown--block"]');
          if (regularResponse) {
            const regularText = regularResponse.innerText.trim();
            if (regularText) {
              aiContent += "【回复】\n" + regularText;
              console.log('找到常规回复内容');
            }
          }
          
          if (aiContent) {
            messages.push({
              role: 'assistant',
              content: aiContent,
              timestamp: Date.now(),
              contentPreview: aiContent.substring(0, 50) + (aiContent.length > 50 ? '...' : ''),
              contentLength: aiContent.length
            });
            console.log('添加AI消息，包含深度思考和/或常规回复');
          }
        }
      });

      console.log(`成功收集 ${messages.length} 条消息`);
      return messages;
    } catch (error) {
      console.error('收集消息失败:', error);
      return [];
    }
  }

  // 解析单个消息
  parseMessage(messageBlock) {
    try {
      console.log('开始解析消息块...');
      
      // 检查是否是用户消息
      if (messageBlock.classList.contains('fa81')) {
        const content = messageBlock.innerText.trim();
        if (content) {
          const message = {
            role: 'user',
            content: content,
            timestamp: Date.now(),
            contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            contentLength: content.length
          };
          console.log('成功解析用户消息:', message);
          return message;
        }
      }
      
      // 检查是否是AI回复
      if (messageBlock.classList.contains('f9bf7997')) {
        let aiContent = '';
        
        // 1. 查找深度思考部分
        const deepThinkingContainer = messageBlock.querySelector('div[class*="edb250b1"]');
        if (deepThinkingContainer) {
          const deepThinkingText = deepThinkingContainer.innerText.trim();
          if (deepThinkingText) {
            aiContent += "【深度思考】\n" + deepThinkingText + "\n\n";
            console.log('找到深度思考内容');
          }
        }
        
        // 2. 查找常规回复部分
        const regularResponse = messageBlock.querySelector('div[class="ds-markdown ds-markdown--block"]');
        if (regularResponse) {
          const regularText = regularResponse.innerText.trim();
          if (regularText) {
            aiContent += "【回复】\n" + regularText;
            console.log('找到常规回复内容');
          }
        }
        
        if (aiContent) {
          const message = {
            role: 'assistant',
            content: aiContent,
            timestamp: Date.now(),
            contentPreview: aiContent.substring(0, 50) + (aiContent.length > 50 ? '...' : ''),
            contentLength: aiContent.length
          };
          console.log('成功解析AI消息:', message);
          return message;
        }
      }

      console.warn('未能解析到消息内容');
      return null;
    } catch (error) {
      console.error('解析消息失败:', error);
      return null;
    }
  }

  // 获取当前对话标题
  getCurrentConversationTitle() {
    try {
      console.log('开始获取对话标题...');
      
      // 查找标题容器
      const titleContainer = document.querySelector('div[class*="be88ba8a"]');
      if (titleContainer) {
        const title = titleContainer.innerText.trim();
        console.log('找到对话标题:', title);
        return title || '未命名对话';
      }
      
      console.warn('未找到标题容器');
      return '未命名对话';
    } catch (error) {
      console.error('获取标题失败:', error);
      return '未命名对话';
    }
  }

  // 生成Markdown内容
  generateMarkdown(messages) {
    console.log('开始生成Markdown...');
    try {
      const title = this.getCurrentConversationTitle();
      const timestamp = new Date().toLocaleString();
      const header = `# ${title}\n\n_导出时间：${timestamp}_\n\n---\n\n`;
      
      const content = messages.map((msg, index) => {
        // 使用统一的角色命名
        const roleText = msg.role.toUpperCase();
        const roleHeader = `### ${roleText}`;
        const divider = index === messages.length - 1 ? '' : '\n\n---\n\n';
        return `${roleHeader}\n\n${msg.content}${divider}`;
    }).join('\n');
      
      const markdown = header + content;
      console.log('Markdown生成成功，长度:', markdown.length);
      return markdown;
    } catch (error) {
      console.error('生成Markdown时出错:', error);
      throw error;
    }
  }

  async waitForReady() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // 同时检查ChatGPT和DeepSeek的内容标识
        if (document.querySelector('.markdown') || document.querySelector('.ds-markdown--block')) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  // 带重试的导出逻辑
  async exportWithRetry(format = 'markdown') {
    console.log(`开始${format}导出过程...`);
    await this.waitForReady();
    let retries = 0;
    const btns = document.querySelectorAll('.chat-export-btn');
    
    while (retries < EXPORT_CONFIG.maxRetries) {
      try {
        btns.forEach(btn => btn.classList.add('loading'));
        
        // 收集消息
        console.log('开始收集消息...');
        const messages = await this.collectMessages();
        
        if (!messages || messages.length === 0) {
          console.warn('未找到任何消息');
          throw new Error('未找到任何聊天记录');
        }
        
        console.log(`成功收集到 ${messages.length} 条消息`);
        
        // 根据格式选择下载方法
        if (format === 'json') {
          this.downloadJSON(messages);
        } else {
        this.downloadMarkdown(messages);
        }
        
        btns.forEach(btn => btn.classList.remove('loading'));
        console.log('导出成功完成');
        return true;
        
      } catch (error) {
        console.error(`导出尝试 ${retries + 1}/${EXPORT_CONFIG.maxRetries} 失败:`, error);
        retries++;
        
        if (retries < EXPORT_CONFIG.maxRetries) {
          console.log(`等待 ${EXPORT_CONFIG.retryDelay}ms 后重试...`);
        await new Promise(r => setTimeout(r, EXPORT_CONFIG.retryDelay));
        }
      }
    }
    
    console.error('导出失败，已达到最大重试次数');
    alert('导出失败，请刷新页面后重试');
    btns.forEach(btn => btn.classList.remove('loading'));
    return false;
  }

  // 文件下载
  downloadMarkdown(messages) {
    console.log('准备下载文件...');
    try {
    const markdown = this.generateMarkdown(messages);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
      const title = this.getCurrentConversationTitle();
      const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '_');
      const filename = `${sanitizedTitle}-${Date.now()}.md`;
      
      console.log('下载文件:', filename);
      a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
      
      console.log('文件下载完成');
    } catch (error) {
      console.error('下载文件时出错:', error);
      throw error;
    }
  }

  // 监听DOM变化
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
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  // 生成JSON内容
  generateJSON(messages) {
    console.log('开始生成JSON...');
    try {
      const title = this.getCurrentConversationTitle();
      const timestamp = Date.now();
      
      const jsonData = [{
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        title: title,
        chat: {
          id: "",
          title: title,
          models: ["gpt-4"],
          params: {},
          history: {
            messages: {}
          },
          messages: messages.map((msg, index) => ({
            id: crypto.randomUUID(),
            parentId: index === 0 ? null : messages[index - 1].id,
            childrenIds: index === messages.length - 1 ? [] : [messages[index + 1].id],
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            models: ["gpt-4"]
          }))
        },
        updated_at: timestamp,
        created_at: timestamp,
        share_id: null,
        archived: false,
        pinned: false,
        meta: {
          tags: ["exported_chat"]
        },
        folder_id: null
      }];

      console.log('JSON生成成功');
      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      console.error('生成JSON时出错:', error);
      throw error;
    }
  }

  // 添加JSON下载函数
  downloadJSON(messages) {
    console.log('准备下载JSON文件...');
    try {
      const jsonContent = this.generateJSON(messages);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = this.getCurrentConversationTitle();
      const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '_');
      const filename = `chat-export-${Date.now()}.json`;
      
      console.log('下载文件:', filename);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('JSON文件下载完成');
    } catch (error) {
      console.error('下载JSON文件时出错:', error);
      throw error;
    }
  }

  // 处理来自popup的消息
  handleMessage(request, sender, sendResponse) {
    console.log('收到消息:', request);
    
    if (request.action === 'getConversations') {
      try {
        console.log('处理getConversations请求');
        console.log('检查页面内容...');
        
        const messages = this.collectMessages();
        console.log(`找到 ${messages.length} 个消息块`);
        
        // 获取当前URL
        const currentURL = window.location.href;
        console.log('当前URL:', currentURL);
        
        // 获取标题
        const title = this.getCurrentConversationTitle();
        console.log('获取到标题:', title);
        
        // 返回对话信息
        const response = [{
          id: currentURL,
          title: title,
          messageCount: messages.length,
          url: currentURL
        }];
        
        console.log('发送响应:', response);
        sendResponse(response);
        
      } catch (error) {
        console.error('处理请求时出错:', error);
        sendResponse([{
          error: error.message,
          title: '加载失败'
        }]);
      }
      return true;
    }
    
    if (request.action === 'export') {
      console.log('处理export请求');
      const format = request.format || 'markdown';
      console.log(`开始${format}格式导出...`);
      
      this.exportWithRetry(format)
        .then(success => {
          console.log('导出结果:', success);
          sendResponse({ success });
        })
        .catch(error => {
          console.error('导出失败:', error);
          sendResponse({ success: false, error: error.message });
        });
      
      return true;
    }
    
    return false;
  }
}

// 初始化函数
function initializeExporter() {
    console.log('=== 开始初始化导出器 ===');
    try {
        if (!exporter) {
            exporter = new ChatExporter();
            // 注册消息监听器
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log('=== 收到消息监听器设置完成 ===');
                return exporter.handleMessage(request, sender, sendResponse);
            });
            console.log('=== 导出器初始化完成 ===');
        }
    } catch (error) {
        console.error('=== 导出器初始化失败 ===', error);
    }
}

// 检查页面加载状态并初始化
if (document.readyState === 'loading') {
    console.log('=== 页面加载中，等待DOMContentLoaded ===');
    document.addEventListener('DOMContentLoaded', initializeExporter);
} else {
    console.log('=== 页面已加载，直接初始化 ===');
    initializeExporter();
}

// 导出调试信息
window.chatExporterDebug = {
    getStatus: () => ({
        exporterInitialized: !!exporter,
        url: window.location.href,
        readyState: document.readyState,
        hasContent: !!document.querySelector('div[class*="prose"], div[class*="min-h-[20px]"], div.markdown')
    })
};

// 导出指定对话
function exportConversation(conversationId) {
  const targetConv = document.querySelector(`[data-conversation-id="${conversationId}"]`);
  if (!targetConv) return null;
  
  targetConv.click(); // 激活对话
  return new ChatExporter().exportWithRetry();
}

class ElementFinder {
  constructor() {
    // 更新选择器列表
    this.selectors = {
      messageBlock: [
        'div[class*="prose"]',
        'div[class*="markdown"]',
        'div[class*="message-content"]'
      ],
      roleIndicator: [
        // 新的角色选择器
        'div[data-message-role]',
        'div[data-message-author-role]',
        'div[class*="role"]',
        'div[class*="agent-turn"]',
        'div[class*="human-turn"]',
        // 图标选择器
        'img[alt*="User" i]',
        'img[alt*="Assistant" i]',
        'img[alt*="ChatGPT" i]',
        // 文本选择器
        'div[class*="font-semibold"]',
        // SVG选择器
        'svg[fill="#4D6BFE"]',
        'svg[class*="user"]',
        'svg[class*="assistant"]'
      ]
    };
  }

  async queryElement(type, parentElement = document) {
    console.log('Querying for ' + type);
    
    for (const selector of this.selectors[type]) {
      console.log('Trying selector:', selector);
      try {
        const elements = parentElement.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          return elements;
        }
      } catch (e) {
        console.error('Error with selector:', selector, e);
      }
    }

    // 如果是在寻找角色指示器，尝试从父元素的类名或属性判断
    if (type === 'roleIndicator' && parentElement !== document) {
      console.log('Trying to determine role from parent element attributes');
      const parentClasses = parentElement.className || '';
      const parentAttrs = Array.from(parentElement.attributes || []).map(attr => attr.name + '=' + attr.value).join(' ');
      
      if (parentClasses.match(/user|human/i) || parentAttrs.match(/user|human/i)) {
        console.log('Determined role from parent: user');
        return [{role: 'user'}];
      }
      if (parentClasses.match(/assistant|bot|gpt/i) || parentAttrs.match(/assistant|bot|gpt/i)) {
        console.log('Determined role from parent: assistant');
        return [{role: 'assistant'}];
      }
    }

    console.log('No elements found for type:', type);
    return null;
  }
}

async function determineMessageRole(messageElement) {
  const roleElements = await elementFinder.queryElement('roleIndicator', messageElement);
  if (!roleElements) {
    console.log('No role indicator found, trying parent element');
    // 检查父元素
    const parent = messageElement.parentElement;
    if (parent) {
      const parentRoleElements = await elementFinder.queryElement('roleIndicator', parent);
      if (parentRoleElements) {
        return determineRoleFromElement(parentRoleElements[0]);
      }
    }
    return null;
  }
  return determineRoleFromElement(roleElements[0]);
}

function determineRoleFromElement(element) {
  if (!element) return null;
  
  // 如果已经在ElementFinder中确定了角色
  if (element.role) {
    return element.role;
  }

  const elementString = (element.outerHTML || '').toLowerCase();
  const elementText = (element.textContent || '').toLowerCase();
  const elementAttrs = Array.from(element.attributes || []).map(attr => attr.name + '=' + attr.value).join(' ').toLowerCase();

  console.log('Determining role from element:', {
    text: elementText,
    attrs: elementAttrs
  });

  if (elementString.includes('user') || elementString.includes('human') || 
      elementText.includes('user') || elementText.includes('human')) {
    return 'user';
  }
  
  if (elementString.includes('assistant') || elementString.includes('chatgpt') || 
      elementText.includes('assistant') || elementText.includes('chatgpt')) {
    return 'assistant';
  }

  return null;
} 
