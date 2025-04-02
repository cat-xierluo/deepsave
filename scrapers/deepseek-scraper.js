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
        'div.f9bf7997',
        'div[class*="_4f9bf79"]',
        'div[class*="_9663006"]',
        'div[class*="d7dc56a8"]'
      ],
      roleIndicator: [
        'div[class*="eb23581b"]',
        'div[class*="edb250b1"]',
        'div[class*="f72b0bab"]',
        '.message-role',
        'div[class*="_48edb25"]'
      ],
      content: [
        'div[class*="d8ed659a"]',
        'div[class*="ds-markdown"]',
        'div[class*="f6004764"]',
        '.message-content',
        '.ds-markdown--block',
        'div.ds-markdown.ds-markdown--block'
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

      // 查找所有消息块（同时使用新旧选择器）
      const messageBlocks = document.querySelectorAll([
        'div[class*="_4f9bf79"]',
        'div[class*="_9663006"]',
        'div.fa81',
        'div.f9bf7997'
      ].join(', '));

      if (!messageBlocks || messageBlocks.length === 0) {
        console.warn('未找到 DeepSeek 消息块');
        return messages;
      }

      console.log(`找到 ${messageBlocks.length} 个消息块`);

      messageBlocks.forEach((block, index) => {
        try {
          // 用户消息（同时检查新旧类名）
          if (block.classList.contains('_9663006') || block.classList.contains('fa81')) {
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
          // AI 回复（同时检查新旧类名）
          else if (block.classList.contains('_4f9bf79')) {
            let aiContent = '';
            
            // 深度思考部分
            const deepThinkingContainer = block.querySelector('div[class*="_48edb25"]');
            if (deepThinkingContainer) {
              const deepThinkingText = deepThinkingContainer.innerText.trim()
                // 移除"已深度思考（用时 xx 秒）"这样的文本
                .replace(/^已深度思考（用时\s*\d+\s*秒）\s*/, '')
                .trim();
              
              if (deepThinkingText) {
                // 用 <think> 标签包裹深度思考内容
                aiContent += `<think>${deepThinkingText}</think>\n\n`;
              }
            }
            
            // 常规回复部分 - 获取原始内容并转换为 Markdown
            const regularResponse = block.querySelector('.ds-markdown.ds-markdown--block');
            if (regularResponse) {
              const htmlContent = regularResponse.innerHTML;
              
              if (htmlContent) {
                // HTML 转 Markdown 的转换函数
                const convertToMarkdown = (html) => {
                  return html
                    // 清理 HTML 属性和多余空格
                    .replace(/\s*style="[^"]*"/g, '')
                    .replace(/\s*class="[^"]*"/g, '')
                    // 移除引用编号
                    .replace(/<span>\d+<\/span>/g, '')
                    // 转换标题
                    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
                    // 转换加粗
                    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                    // 转换段落
                    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
                    // 转换列表
                    .replace(/<ul>/g, '')
                    .replace(/<\/ul>/g, '')
                    .replace(/<li>/g, '- ')
                    .replace(/<\/li>/g, '\n')
                    // 转换分隔线
                    .replace(/<hr>/g, '---\n')
                    // 转换换行
                    .replace(/<br\s*\/?>/gi, '\n')
                    // 清理其他 HTML 标签
                    .replace(/<[^>]*>/g, '')
                    // 转换 HTML 实体
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    // 清理多余空行
                    .replace(/\n\s*\n\s*\n/g, '\n\n')
                    .trim();
                };
                
                aiContent += convertToMarkdown(htmlContent);
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
