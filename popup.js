// 直接的控制台输出
console.log('===== popup.js 开始执行 =====');

// 调试日志函数
function log(...args) {
  console.log('[Popup]', ...args);
  const debugDiv = document.getElementById('debug');
  if (debugDiv) {
    const message = args.join(' ');
    debugDiv.textContent += message + '\n';
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }
}

function error(...args) {
  console.error('[Popup]', ...args);
  const debugDiv = document.getElementById('debug');
  if (debugDiv) {
    const message = '错误: ' + args.join(' ');
    debugDiv.textContent += message + '\n';
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }
}

// 等待DOM加载
function waitForDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        log('DOM已加载');
        resolve();
      });
    } else {
      log('DOM已经加载完成');
      resolve();
    }
  });
}

// 等待扩展准备就绪
async function waitForExtension(tabId) {
  log('等待扩展准备就绪');
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('等待扩展超时'));
    }, 10000);

    function checkStatus() {
      log('检查扩展状态...');
      try {
        chrome.runtime.sendMessage({ 
          action: 'checkStatus',
          tabId: tabId
        }, response => {
          if (chrome.runtime.lastError) {
            log('检查状态出错:', chrome.runtime.lastError.message);
            setTimeout(checkStatus, 500);
            return;
          }
          
          log('收到状态响应:', response);
          if (response && response.ready) {
            clearTimeout(timeout);
            resolve(true);
          } else {
            setTimeout(checkStatus, 500);
          }
        });
      } catch (err) {
        log('发送消息出错:', err);
        setTimeout(checkStatus, 500);
      }
    }

    checkStatus();
  });
}

// 基本功能检查
async function checkAPI() {
  log('开始API检查');
  try {
    if (typeof chrome === 'undefined') {
      throw new Error('chrome API 不可用');
    }
    
    if (typeof chrome.tabs === 'undefined') {
      throw new Error('chrome.tabs API 不可用');
    }

    if (typeof chrome.runtime === 'undefined') {
      throw new Error('chrome.runtime API 不可用');
    }

    log('API 检查通过');
    return true;
  } catch (err) {
    error('API 检查失败:', err.message);
    throw err;
  }
}

async function checkAndLoadConversation() {
  log('开始检查和加载对话');
  
  // DOM 检查
  const contentDiv = document.getElementById('content');
  const loadingDiv = document.getElementById('loading');
  const listDiv = document.getElementById('conversationList');

  log('DOM 元素检查', {
    contentDiv: !!contentDiv,
    loadingDiv: !!loadingDiv,
    listDiv: !!listDiv
  });

  if (!contentDiv || !loadingDiv || !listDiv) {
    error('找不到必要的DOM元素');
    return;
  }

  try {
    // 获取当前标签页
    log('开始获取当前标签页');
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tabs || tabs.length === 0) {
      error('无法获取当前标签页');
      contentDiv.innerHTML = `
        <div class="status-message">
          无法获取当前标签页信息
        </div>`;
      loadingDiv.style.display = 'none';
      return;
    }

    const tab = tabs[0];
    const url = tab.url || '';
    log('当前标签页URL:', url);
    
    // 检查是否在正确的页面
    if (!url) {
      log('URL为空');
      contentDiv.innerHTML = `
        <div class="status-message">
          无法获取页面URL
        </div>`;
      loadingDiv.style.display = 'none';
      return;
    }

    const urlPattern = /^https?:\/\/(chat\.openai\.com|chatgpt\.com|chat\.deepseek\.com)/;
    const urlMatch = url.match(urlPattern);
    log('URL匹配结果:', urlMatch ? '成功' : '失败');
    
    if (!urlMatch) {
      log('不在目标网站');
      contentDiv.innerHTML = `
        <div class="status-message">
          请在 ChatGPT 或 DeepSeek 聊天页面使用此扩展<br>
          当前URL: ${url}
        </div>`;
      loadingDiv.style.display = 'none';
      return;
    }

    log('在目标网站上，等待扩展准备就绪');
    
    try {
      // 等待扩展准备就绪
      await waitForExtension(tab.id);
      log('扩展已准备就绪，开始获取对话');
      
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ 
          action: 'getConversations',
          tabId: tab.id
        }, (response) => {
          const err = chrome.runtime.lastError;
          if (err) {
            error('消息发送错误:', err.message);
            reject(err);
            return;
          }
          
          log('收到响应:', JSON.stringify(response));
          if (!response) {
            reject(new Error('未收到响应'));
            return;
          }
          
          resolve(response);
        });
      });

      log('消息发送完成，响应:', JSON.stringify(response));
      
      if (!response || !Array.isArray(response) || response.length === 0) {
        log('未检测到对话');
        contentDiv.innerHTML = `
          <div class="status-message">
            未检测到对话，请打开对话页面<br>
            如果页面已打开，请尝试刷新页面
          </div>`;
        loadingDiv.style.display = 'none';
        return;
      }

      // 显示当前对话
      const conversation = response[0];
      log('显示对话:', JSON.stringify(conversation));
      
      if (conversation.error) {
        throw new Error(conversation.error);
      }
      
      // 获取标题，如果没有标题则使用默认值
      const title = conversation.title || '未命名对话';
      
      // 显示对话信息和导出按钮
      listDiv.innerHTML = `
        <div class="conversation-item" data-id="${conversation.id}">
          <div class="conv-title">${title}</div>
          ${conversation.messageCount ? `<div class="conv-info">消息数: ${conversation.messageCount}</div>` : ''}
        </div>
        <div class="export-buttons">
          <button id="exportMarkdown" class="export-btn">导出Markdown</button>
          <button id="exportJSON" class="export-btn">导出JSON</button>
        </div>`;

      // 添加导出按钮的点击事件
      const exportMarkdownBtn = document.getElementById('exportMarkdown');
      const exportJSONBtn = document.getElementById('exportJSON');
      
      if (exportMarkdownBtn) {
        exportMarkdownBtn.addEventListener('click', async () => {
          try {
            loadingDiv.style.display = 'block';
            const exportResponse = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage({ 
                action: 'export',
                format: 'markdown',
                tabId: tab.id
              }, (response) => {
                const err = chrome.runtime.lastError;
                if (err) {
                  reject(err);
                } else {
                  resolve(response);
                }
              });
            });
            
            if (!exportResponse || !exportResponse.success) {
              throw new Error(exportResponse?.error || '导出失败');
            }
            
            window.close();
          } catch (err) {
            error('导出错误:', err.message);
            alert('导出失败: ' + err.message);
          } finally {
            loadingDiv.style.display = 'none';
          }
        });
      }
      
      if (exportJSONBtn) {
        exportJSONBtn.addEventListener('click', async () => {
          try {
            loadingDiv.style.display = 'block';
            const exportResponse = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage({ 
                action: 'export',
                format: 'json',
                tabId: tab.id
              }, (response) => {
                const err = chrome.runtime.lastError;
                if (err) {
                  reject(err);
                } else {
                  resolve(response);
                }
              });
            });
            
            if (!exportResponse || !exportResponse.success) {
              throw new Error(exportResponse?.error || '导出失败');
            }
            
            window.close();
          } catch (err) {
            error('导出错误:', err.message);
            alert('导出失败: ' + err.message);
          } finally {
            loadingDiv.style.display = 'none';
          }
        });
      }
      
      loadingDiv.style.display = 'none';
      
    } catch (err) {
      error('通信错误:', err.message);
      contentDiv.innerHTML = `
        <div class="status-message">
          ${err.message || '加载失败，请刷新页面重试'}<br>
          <small>如果问题持续存在，请尝试重新加载扩展</small>
        </div>`;
      loadingDiv.style.display = 'none';
    }

  } catch (err) {
    error('执行错误:', err.message);
    contentDiv.innerHTML = `
      <div class="status-message">
        ${err.message || '加载失败，请刷新页面重试'}
      </div>`;
    loadingDiv.style.display = 'none';
  }
}

// 主函数
async function main() {
  log('开始执行主函数');
  try {
    // 等待DOM加载
    await waitForDOM();
    
    // 检查API
    await checkAPI();
    
    // 执行对话检查和加载
    await checkAndLoadConversation();
    
    log('主函数执行完成');
  } catch (err) {
    error('主函数执行失败:', err.message);
    const debugDiv = document.getElementById('debug');
    if (debugDiv) {
      debugDiv.textContent += `\n执行失败: ${err.message}\n`;
    }
  }
}

// 立即执行主函数
log('准备执行主函数');
main().catch(err => {
  error('执行出错:', err.message);
}); 
