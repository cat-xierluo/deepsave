// 立即执行的初始化日志
console.log('=== Chat Exporter 插件已加载 ===');

// 等待抓取器类加载完成
function waitForScrapers() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5秒内尝试50次
    
    const checkInterval = setInterval(() => {
      attempts++;
      console.log(`检查抓取器加载状态 (${attempts}/${maxAttempts})...`);
      
      if (!window.BaseScraper || !window.ChatGPTScraper || !window.DeepSeekScraper) {
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error(`加载失败: BaseScraper=${!!window.BaseScraper}, ChatGPTScraper=${!!window.ChatGPTScraper}, DeepSeekScraper=${!!window.DeepSeekScraper}`));
        }
        return;
      }
      
      clearInterval(checkInterval);
      resolve();
    }, 100);
  });
}

// 抓取器管理器类
class ScraperManager {
  constructor() {
    if (!window.BaseScraper || !window.ChatGPTScraper || !window.DeepSeekScraper) {
      throw new Error('必要的抓取器类未加载');
    }

    this.scrapers = [
      new window.ChatGPTScraper(),
      new window.DeepSeekScraper()
    ];
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    window.onerror = (msg, url, line, col, error) => {
      console.error('全局错误:', {
        message: msg,
        url: url,
        line: line,
        column: col,
        error: error
      });
      return false;
    };
  }

  getScraper(url) {
    console.log('获取抓取器，当前URL:', url);
    const scraper = this.scrapers.find(s => s.canHandle(url));
    if (!scraper) {
      throw new Error(`未找到适用于 ${url} 的抓取器`);
    }
    console.log('找到适用的抓取器:', scraper.constructor.name);
    return scraper;
  }
}

// 全局导出器实例
let scraperManager = null;

// 初始化函数
async function initialize() {
  try {
    console.log('开始初始化 content script...');
    if (!scraperManager) {
      // 等待抓取器加载完成
      await waitForScrapers();
      scraperManager = new ScraperManager();
      console.log('ScraperManager 初始化成功');
    }
    return { ready: true };
  } catch (error) {
    console.error('初始化失败:', error);
    return { ready: false, error: error.message };
  }
}

// 生成 Markdown 内容
function generateMarkdown(title, messages, isDeepSeek = true) {
  let markdown = `# ${title}\n\n`;
  let lastRole = null;
  
  messages.forEach((msg) => {
    if (msg.role === 'user') {
      markdown += `### User\n\n${msg.content}\n\n---\n\n`;
      lastRole = 'user';
    } else if (msg.role === 'assistant') {
      const assistantName = isDeepSeek ? 'DeepSeek' : 'ChatGPT';
      if (lastRole !== 'assistant') {
        markdown += `### ${assistantName}\n\n`;
      }
      markdown += `${msg.content}\n\n---\n\n`;
      lastRole = 'assistant';
    }
  });
  
  return markdown;
}

// 生成安全的文件名
function getSafeFilename(title) {
  // 移除不安全的文件名字符
  return title.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
              .replace(/\s+/g, '_')  // 空格替换为下划线
              .replace(/-+/g, '-')   // 多个连续横线替换为单个
              .trim();
}

// 生成时间戳 (格式: YYYYMMDDHHMM)
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}`;
}

// 处理导出聊天请求
async function handleExportChat(format, sendResponse) {
  try {
    const initResult = await initialize();
    if (!initResult.ready) {
      throw new Error(initResult.error || 'Content script 未初始化');
    }

    const currentUrl = window.location.href;
    const scraper = scraperManager.getScraper(currentUrl);
    await scraper.waitForReady();

    const messages = scraper.collectMessages();
    console.log(`成功收集 ${messages.length} 条消息`);

    if (messages.length === 0) {
      throw new Error('未找到任何消息');
    }

    const title = scraper.getTitle();
    let content, mimeType, extension;

    if (format === 'markdown') {
      const isDeepSeek = currentUrl.includes('chat.deepseek.com');
      content = generateMarkdown(title, messages, isDeepSeek);
      mimeType = 'text/markdown';
      extension = 'md';
    } else {
      content = JSON.stringify({
        title: title,
        url: currentUrl,
        timestamp: Date.now(),
        messages: messages
      }, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    }

    // 创建安全的文件名
    const safeTitle = getSafeFilename(title);
    const timestamp = getTimestamp();
    const filename = `${safeTitle}_${timestamp}.${extension}`;

    // 创建 Blob 并下载
    const blob = new Blob([content], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    sendResponse({ success: true, messageCount: messages.length });
  } catch (error) {
    console.error('导出失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 处理获取对话请求
async function handleGetConversations(sendResponse) {
  try {
    const initResult = await initialize();
    if (!initResult.ready) {
      throw new Error(initResult.error || 'Content script 未初始化');
    }

    const currentUrl = window.location.href;
    const scraper = scraperManager.getScraper(currentUrl);
    await scraper.waitForReady();

    const title = scraper.getTitle();
    const messages = scraper.collectMessages();

    const response = [{
      id: currentUrl,
      title: title,
      messageCount: messages.length,
      url: currentUrl
    }];
    
    console.log('获取对话信息成功');
    sendResponse(response);
  } catch (error) {
    console.error('获取对话信息失败:', error);
    sendResponse([{
      error: error.message,
      title: '加载失败'
    }]);
  }
}

// 导出调试信息
window.chatExporterDebug = {
    getStatus: () => ({
    exporterInitialized: !!scraperManager,
        url: window.location.href,
        readyState: document.readyState,
        hasContent: !!document.querySelector('div[class*="prose"], div[class*="min-h-[20px]"], div.markdown')
    })
};

// 立即尝试初始化
initialize();

// 监听来自 background.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request.action);

  if (request.action === 'checkStatus') {
    initialize().then(sendResponse);
    return true;
  }

  if (request.action === 'export') {
    handleExportChat(request.format || 'json', sendResponse);
    return true;
  }

  if (request.action === 'getConversations') {
    handleGetConversations(sendResponse);
    return true;
  }
});
