// 导出配置
const EXPORT_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  // 通用选择器配置
  commonSelectors: {
    messageBlock: [
      'div[class*="message"]',
      'div[class*="conversation-turn"]',
      'div[class*="chat-message"]',
      'div.text-message'
    ],
    roleIndicator: [
      'div[data-role]',
      'div[data-author]',
      'div[class*="role"]',
      'div[class*="author"]'
    ],
    content: [
      'div[class*="content"]',
      'div[class*="text"]',
      'div[class*="message-body"]'
    ],
    timestamp: [
      'time',
      'div[class*="time"]',
      'span[class*="timestamp"]',
      'div[class*="date"]'
    ],
    conversationTitle: [
      'h1',
      'div[role="heading"]',
      'div[class*="title"]',
      'div[class*="header"]'
    ]
  }
};

// 基础抓取器类
class BaseScraper {
  constructor() {
    if (this.constructor === BaseScraper) {
      throw new Error('BaseScraper 是抽象类，不能直接实例化');
    }
    this.observer = null;
    this.cache = new Map();
    // 初始化选择器配置
    this.selectors = {
      ...EXPORT_CONFIG.commonSelectors,
      ...this.getCustomSelectors()
    };
  }

  // 获取特定网站的选择器配置（子类必须实现）
  getCustomSelectors() {
    throw new Error('子类必须实现 getCustomSelectors 方法');
  }

  // 检查当前页面是否由该抓取器处理
  canHandle(url) {
    throw new Error('子类必须实现 canHandle 方法');
  }

  // 获取对话标题
  getTitle() {
    throw new Error('子类必须实现 getTitle 方法');
  }

  // 收集消息
  collectMessages() {
    throw new Error('子类必须实现 collectMessages 方法');
  }

  // 等待页面加载完成
  waitForReady() {
    throw new Error('子类必须实现 waitForReady 方法');
  }

  // 智能元素查询
  smartQuery(selectorType, parent = document) {
    console.log(`Querying for ${selectorType}`);
    const selectors = this.selectors[selectorType] || [];
    for (const selector of selectors) {
      console.log(`Trying selector: ${selector}`);
      const elements = parent.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        return elements;
      }
    }
    console.warn(`No elements found for ${selectorType}`);
    return null;
  }

  // 设置 DOM 变化监听
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

  // 生成 JSON 数据
  generateJSON(messages) {
    return {
      title: this.getTitle(),
      url: window.location.href,
      timestamp: Date.now(),
      messages: messages
    };
  }

  // 下载 JSON 文件
  downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `chat-export-${Date.now()}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }
}

// 将类添加到全局作用域
window.BaseScraper = BaseScraper;
window.EXPORT_CONFIG = EXPORT_CONFIG; 
