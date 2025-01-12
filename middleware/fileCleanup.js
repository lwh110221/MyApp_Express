const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const { BusinessError } = require('../utils/errors');

/**
 * 文件清理中间件工厂函数
 * @param {Object} options 配置选项
 * @returns {Function} Express中间件
 */
const createFileCleanupMiddleware = (options = {}) => {
  const {
    uploadPath = 'public/uploads',  // 上传根目录
    subDirs = ['avatars', 'moments', 'news']  // 子目录列表
  } = options;

  /**
   * 处理文件路径
   * @param {string} filePath 原始文件路径
   * @returns {string} 处理后的完整文件路径
   */
  const processFilePath = (filePath) => {
    // 移除开头的斜杠
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // 如果路径已经包含 'public'，直接使用
    if (cleanPath.startsWith('public/')) {
      return path.join(process.cwd(), cleanPath);
    }
    
    // 否则添加 'public' 前缀
    return path.join(process.cwd(), 'public', cleanPath);
  };

  /**
   * 提取文件URL列表
   * @param {string} content HTML内容
   * @returns {string[]} URL列表
   */
  const extractFileUrls = (content) => {
    if (!content) return [];
    
    const urls = new Set();
    
    // 匹配img标签中的src
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      if (match[1].startsWith('/uploads/')) {
        urls.add(match[1]);
      }
    }
    
    // 匹配其他可能的文件引用（如视频、音频等）
    const mediaRegex = /\/(uploads\/[^"'\s)]+)/g;
    while ((match = mediaRegex.exec(content)) !== null) {
      urls.add(match[1]);
    }
    
    return Array.from(urls);
  };

  /**
   * 清理未使用的文件
   * @param {string} oldContent 旧内容
   * @param {string} newContent 新内容
   * @param {string} subDir 子目录
   */
  const cleanupUnusedFiles = async (oldContent, newContent, subDir) => {
    try {
      const oldUrls = extractFileUrls(oldContent);
      const newUrls = extractFileUrls(newContent);
      const unusedUrls = oldUrls.filter(url => !newUrls.includes(url));

      logger.info(`开始清理未使用的文件，共 ${unusedUrls.length} 个文件`);

      for (const url of unusedUrls) {
        try {
          const filePath = processFilePath(url);
          const exists = await fs.access(filePath)
            .then(() => true)
            .catch(() => false);

          if (exists) {
            await fs.unlink(filePath);
            logger.info(`成功删除文件: ${url}`);
          } else {
            logger.warn(`文件不存在: ${url}`);
          }
        } catch (error) {
          logger.error(`删除文件失败: ${url}`, { error: error.message, stack: error.stack });
          // 不抛出错误，继续处理其他文件
        }
      }
    } catch (error) {
      logger.error('文件清理过程出错', { error: error.message, stack: error.stack });
      throw new BusinessError('文件清理失败', error);
    }
  };

  /**
   * 清理单个文件
   * @param {string} filePath 文件路径
   */
  const cleanupSingleFile = async (filePath) => {
    try {
      if (!filePath) {
        logger.warn('清理文件失败: 文件路径为空');
        return;
      }

      const fullPath = processFilePath(filePath);
      const exists = await fs.access(fullPath)
        .then(() => true)
        .catch(() => false);
      
      if (exists) {
        await fs.unlink(fullPath);
        logger.info(`成功删除文件: ${filePath}`);
      } else {
        logger.warn(`文件不存在: ${filePath}`);
      }
    } catch (error) {
      logger.error(`删除文件失败: ${filePath}`, { error: error.message, stack: error.stack });
      throw new BusinessError('文件删除失败', error);
    }
  };

  return {
    cleanupUnusedFiles,
    cleanupSingleFile
  };
};

module.exports = createFileCleanupMiddleware; 