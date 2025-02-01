// DeepSeek 抓取器类
class DeepSeekScraper extends window.BaseScraper {
  constructor() {
    super();
    this.setupMutationObserver();
  }

  // 获取 DeepSeek 特定的选择器
  getCustomSelectors() {
    return {
      messageBlock: [
        'div[class*="a5cd95be"]',
        'div[class*="be88ba8a"]',
        'div[class*="f8d1e4c0"]',
        'div[class*="dad65929"]',
        'div.fa81',
        'div.f9bf7997'
      ],
      roleIndicator: [
        'div[class*="eb23581b"]', // AI图标容器
        'div[class*="edb250b1"]', // AI角色信息
        'div[class*="f72b0bab"]', // 用户消息标识
        '.message-role'
      ],
      content: [
        'div[class*="d8ed659a"]', // 文本内容
        'div[class*="ds-markdown"]', // markdown内容
        'div[class*="f6004764"]', // 消息内容容器
        '.message-content',
        '.ds-markdown--block'
      ],
      conversationTitle: [
        'div[class*="be88ba8a"]',
        'div[class*="d8ed659a"]',
        'div[class*="f72b0bab"] div[class*="d8ed659a"]',
        '.conversation-title'
      ]
    };
  }

  canHandle(url) {
    return url.includes('chat.deepseek.com');
  }

  async waitForReady() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const elements = this.smartQuery('messageBlock');
        if (elements && elements.length > 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  getTitle() {
    try {
      console.log('开始获取 DeepSeek 对话标题...');
      const elements = this.smartQuery('conversationTitle');
      if (elements && elements.length > 0) {
        const title = elements[0].innerText.trim();
        console.log('找到 DeepSeek 对话标题:', title);
        return title || '未命名对话';
      }
      console.warn('未找到 DeepSeek 标题容器');
      return '未命名对话';
    } catch (error) {
      console.error('获取 DeepSeek 标题失败:', error);
      return '未命名对话';
    }
  }

  collectMessages() {
    try {
      console.log('开始收集 DeepSeek 消息...');
      const messages = [];

      // 查找所有消息块
      const messageContainer = document.querySelector('div[class*="dad65929"]');
      if (!messageContainer) {
        console.warn('未找到 DeepSeek 消息容器');
        return messages;
      }

      // 查找所有用户消息和AI回复
      const allMessages = messageContainer.children;
      console.log(`找到 ${allMessages.length} 个消息块`);

      Array.from(allMessages).forEach((block, index) => {
        try {
          // 用户消息
          if (block.classList.contains('fa81')) {
            const content = block.innerText.trim();
            if (content) {
              messages.push({
                role: 'user',
                content: content,
                timestamp: Date.now()
              });
              console.log('添加用户消息');
            }
          }
          // AI 回复
          else if (block.classList.contains('f9bf7997')) {
            let aiContent = '';
            
            // 深度思考部分
            const deepThinkingContainer = block.querySelector('div[class*="edb250b1"]');
            if (deepThinkingContainer) {
              const deepThinkingText = deepThinkingContainer.innerText.trim();
              if (deepThinkingText) {
                aiContent += deepThinkingText + '\n\n';
              }
            }
            
            // 常规回复部分
            const regularResponse = block.querySelector('.ds-markdown--block');
            if (regularResponse) {
              const regularText = regularResponse.innerText.trim();
              if (regularText) {
                aiContent += `【回复】${regularText}`;
              }
            }

            // 如果有内容才添加消息
            if (aiContent.trim()) {
              messages.push({
                role: 'assistant',
                content: aiContent.trim(),
                timestamp: Date.now()
              });
              console.log('添加AI回复（包含深度思考和回复）');
            }
          }
        } catch (err) {
          console.error(`处理第 ${index + 1} 个消息块时出错:`, err);
        }
      });

      console.log(`成功收集 ${messages.length} 条 DeepSeek 消息`);
      return messages;
    } catch (error) {
      console.error('收集 DeepSeek 消息失败:', error);
      return [];
    }
  }
}

// 将类添加到全局作用域
window.DeepSeekScraper = DeepSeekScraper; 
