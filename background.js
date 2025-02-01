// 调试日志函数
function log(...args) {
  console.log('[Background]', ...args);
}

function error(...args) {
  console.error('[Background]', ...args);
}

// 检查content script是否已注入
async function ensureContentScriptInjected(tabId) {
  log('检查content script注入状态');
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return window.chatExporterDebug?.getStatus();
      }
    });
    
    if (result && result.result) {
      log('content script已注入且正常运行', result.result);
      return true;
    }
    
    log('content script未正确初始化，尝试重新注入');
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js']
    });
    log('content script注入成功');
    return true;
  } catch (err) {
    error('content script操作失败', err);
    return false;
  }
}

// 检查扩展状态
async function checkExtensionStatus(tabId) {
  try {
    const isInjected = await ensureContentScriptInjected(tabId);
    if (!isInjected) {
      return { ready: false, error: 'content script未正确加载' };
    }
    
    // 检查content script状态
    const [status] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return window.chatExporterDebug?.getStatus();
      }
    });
    
    if (!status || !status.result) {
      return { ready: false, error: 'content script未初始化' };
    }
    
    return { ready: true, status: status.result };
  } catch (err) {
    error('状态检查失败', err);
    return { ready: false, error: err.message };
  }
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    log('标签页更新', { tabId, url: tab.url });
    if (tab.url.match(/^https?:\/\/(chat\.openai\.com|chatgpt\.com|chat\.deepseek\.com)/)) {
      log('匹配到目标网站，确保content script已注入');
      await ensureContentScriptInjected(tabId);
    }
  }
});

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  log('扩展已安装/更新');
});

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('收到消息', request);
  
  if (request.action === 'checkStatus') {
    log('检查扩展状态', request);
    checkExtensionStatus(request.tabId).then(status => {
      log('扩展状态:', status);
      sendResponse(status);
    });
    return true;
  }
  
  if (request.action === 'getConversations' || request.action === 'export') {
    // 获取当前活动标签页
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab) {
        error('未找到活动标签页');
        sendResponse({ error: '未找到活动标签页' });
        return;
      }
      
      log('当前标签页', { id: tab.id, url: tab.url });
      
      // 确保content script已注入
      const isInjected = await ensureContentScriptInjected(tab.id);
      if (!isInjected) {
        error('无法注入content script');
        sendResponse({ error: '扩展初始化失败，请刷新页面重试' });
        return;
      }
      
      // 转发消息到content script
      try {
        log('转发消息到content script', request);
        chrome.tabs.sendMessage(tab.id, request, (response) => {
          const err = chrome.runtime.lastError;
          if (err) {
            error('消息发送失败', err);
            sendResponse({ error: err.message });
            return;
          }
          log('收到content script响应', response);
          sendResponse(response);
        });
      } catch (err) {
        error('消息发送异常', err);
        sendResponse({ error: err.message });
      }
    });
    
    return true; // 保持消息通道开放
  }
}); 
