import ChatGPTScraper from './chatgpt-scraper.js';
import DeepSeekScraper from './deepseek-scraper.js';

class ScraperManager {
  constructor() {
    this.scrapers = [
      new ChatGPTScraper(),
      new DeepSeekScraper()
    ];
  }

  getScraper(url) {
    const scraper = this.scrapers.find(s => s.canHandle(url));
    if (!scraper) {
      throw new Error(`未找到适用于 ${url} 的抓取器`);
    }
    return scraper;
  }

  async getTitle(url) {
    const scraper = this.getScraper(url);
    await scraper.waitForReady();
    return scraper.getTitle();
  }

  async collectMessages(url) {
    const scraper = this.getScraper(url);
    await scraper.waitForReady();
    return scraper.collectMessages();
  }
}

export default ScraperManager; 
