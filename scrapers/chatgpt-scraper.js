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
        'div[class*="markdown"]',
        'div[class*="text-message"]'
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

  // 处理代码块的格式
  processCodeBlock(element) {
    try {
      // 首先获取所有代码块
      const codeBlocks = element.querySelectorAll('pre');
      if (codeBlocks.length === 0) {
        // 如果没有代码块，直接返回文本内容
        return element.innerText.trim();
      }

      // 创建一个副本以保留原始内容
      let content = element.cloneNode(true);
      let processedContent = content.innerHTML;

      // 处理每个代码块
      codeBlocks.forEach(pre => {
        const code = pre.querySelector('code');
        if (code) {
          // 获取语言标识
          const language = Array.from(code.classList)
            .find(cls => cls.startsWith('language-'))
            ?.replace('language-', '') || '';
          
          // 获取代码内容并保留格式
          const codeContent = code.innerText
            .replace(/^\n+|\n+$/g, '') // 移除开头和结尾的空行
            .split('\n')
            .map(line => line.replace(/\r$/, '')) // 移除行尾的回车符
            .join('\n');

          // 创建替换的代码块文本
          const replacement = `\n\`\`\`${language}\n${codeContent}\n\`\`\`\n`;
          
          // 替换原始的 pre 元素
          processedContent = processedContent.replace(pre.outerHTML, replacement);
        }
      });

      // 创建临时元素来解析处理后的HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedContent;

      // 获取处理后的文本内容并规范化格式
      let finalContent = tempDiv.innerText
        .replace(/^\s+|\s+$/g, '') // 移除开头和结尾的空白
        .replace(/\n{3,}/g, '\n\n') // 将连续的3个或更多换行符替换为2个
        .replace(/```\s*\n\s*```/g, '```\n```') // 修复空代码块格式
        .replace(/\n\s*```(\w*)\s*\n/g, '\n\n```$1\n') // 确保代码块前有空行
        .replace(/\n\s*```\s*\n/g, '\n```\n\n') // 确保代码块后有空行
        .replace(/^\s*```/g, '```') // 修复文本开头的代码块格式
        .replace(/```\s*$/g, '```'); // 修复文本结尾的代码块格式

      return finalContent;
    } catch (error) {
      console.error('处理代码块时出错:', error);
      return element.innerText.trim();
    }
  }

  collectMessages() {
    try {
      console.log('开始收集 ChatGPT 消息...');
      const messages = [];
      const processedIds = new Set(); // 使用消息ID来去重

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
            const messageId = messageElement.getAttribute('data-message-id');
            // 使用消息ID来判断是否重复
            if (!messageId || processedIds.has(messageId)) {
              return;
            }

            const authorRole = messageElement.getAttribute('data-message-author-role');
            const isUser = authorRole === 'user';
            
            // 获取消息内容
            let content = null;
            const contentElement = messageElement.querySelector('div.whitespace-pre-wrap') ||
                                 messageElement.querySelector('div[class*="markdown"]') ||
                                 messageElement.querySelector('div[class*="text-message"]');
            
            if (contentElement) {
              content = this.processCodeBlock(contentElement);
            }

            // 检查内容是否非空
            if (content && content.length > 0) {
              processedIds.add(messageId); // 记录已处理的消息ID
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
