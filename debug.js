console.log('===== Popup HTML 开始加载 =====');
console.log('===== 开始设置调试系统 =====');

// 全局调试函数
window.debugLog = [];
window.addDebug = function(msg) {
  console.log('===== Debug:', msg, '=====');
  const debugDiv = document.getElementById('debug');
  window.debugLog.push(msg);
  if (debugDiv) {
    debugDiv.textContent = window.debugLog.join('\n');
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }
};

// 立即测试调试系统
window.addDebug('调试系统已初始化');
console.log('===== 调试系统设置完成 ====='); 
