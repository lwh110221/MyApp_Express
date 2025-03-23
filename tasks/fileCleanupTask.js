const cron = require('node-cron');
const FileCleanup = require('../utils/fileCleanup');
const logger = require('../utils/logger');

// 每天凌晨3点运行清理任务
const schedule = '0 3 * * *';

const startFileCleanupTask = () => {
    cron.schedule(schedule, async () => {
        try {
            logger.info('开始运行文件清理任务');
            await FileCleanup.cleanupUnusedFiles(24); // 清理24小时前的未使用文件
            logger.info('文件清理任务完成');
        } catch (error) {
            logger.error('文件清理任务失败:', error);
        }
    });
    
    logger.info('文件清理定时任务已启动');
};

module.exports = startFileCleanupTask; 