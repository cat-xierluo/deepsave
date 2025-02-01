// ChatGPT 抓取器类
class ChatGPTScraper extends window.BaseScraper {
  constructor() {
    super();
    this.setupMutationObserver();
  }

  // 获取 ChatGPT 特定的选择器
  getCustomSelectors() {
    return {
      messageBlock: [
        'article[data-testid^="conversation-turn-"]'
      ],
      roleIndicator: [
        'div[data-message-author-role]'
      ],
      content: [
        'div.whitespace-pre-wrap',
        'div[class*="text-message"]',
        'div[class*="markdown"]'
      ]
    };
  }

  canHandle(url) {
    if (!url) return false;
    return url.includes('chat.openai.com') || url.includes('chatgpt.com');
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
      console.log('开始获取 ChatGPT 对话标题...');
      
      // 获取当前URL的最后一段
      const pathSegments = window.location.pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];
      
      if (lastSegment) {
        // 查找包含该 URL 片段的链接元素
        const linkElement = document.querySelector(`a[href*="${lastSegment}"]`);
        if (linkElement) {
          // 查找相邻的带有 title 属性的元素
          const titleElement = linkElement.closest('div').querySelector('[title]');
          if (titleElement) {
            const title = titleElement.getAttribute('title');
            if (title && title.length > 0) {
              console.log('找到 ChatGPT 对话标题:', title);
              return title;
            }
          }
        }
      }
      
      console.warn('未找到 ChatGPT 标题');
      return '未命名对话';
    } catch (error) {
      console.error('获取 ChatGPT 标题失败:', error);
      return '未命名对话';
    }
  }

  collectMessages() {
    try {
      console.log('开始收集 ChatGPT 消息...');
      const messages = [];
      const processedContents = new Set(); // 用于去重

      // 查找所有对话回合
      const turns = this.smartQuery('messageBlock');
      if (!turns) {
        console.warn('未找到 ChatGPT 对话回合');
        return messages;
      }

      console.log(`找到 ${turns.length} 个对话回合`);

      turns.forEach((turn, index) => {
        try {
          // 在每个回合中查找用户消息和助手消息
          const messageElements = turn.querySelectorAll('div[data-message-author-role]');
          
          messageElements.forEach(messageElement => {
            const authorRole = messageElement.getAttribute('data-message-author-role');
            const isUser = authorRole === 'user';
            
            // 获取消息内容
            let content = null;
            const contentElement = messageElement.querySelector('div.whitespace-pre-wrap') ||
                                 messageElement.querySelector('div[class*="markdown"]') ||
                                 messageElement.querySelector('div[class*="text-message"]');
            
            if (contentElement) {
              content = contentElement.innerText.trim();
            }

            // 检查内容是否重复且非空
            if (content && content.length > 0 && !processedContents.has(content)) {
              processedContents.add(content); // 添加到已处理集合
              messages.push({
                role: isUser ? 'user' : 'assistant',
                content: content,
                timestamp: Date.now()
              });
              console.log(`添加${isUser ? '用户' : 'ChatGPT'}消息:`, content.substring(0, 50) + '...');
            }
          });
        } catch (err) {
          console.error(`处理第 ${index + 1} 个对话回合时出错:`, err);
        }
      });

      console.log(`成功收集 ${messages.length} 条 ChatGPT 消息`);
      return messages;
    } catch (error) {
      console.error('收集 ChatGPT 消息失败:', error);
      return [];
    }
  }
}

// 将类添加到全局作用域
window.ChatGPTScraper = ChatGPTScraper; 
