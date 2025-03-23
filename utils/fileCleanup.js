const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');
const logger = require('./logger');

class FileCleanup {
    /**
     * 删除指定的文件
     * @param {string[]} filenames 文件名数组
     * @param {string} uploadType 上传类型（如：help, news 等）
     */
    static async deleteFiles(filenames, uploadType) {
        if (!filenames || filenames.length === 0) return;
        
        for (const filename of filenames) {
            try {
                const filepath = path.join(__dirname, '../public/uploads', uploadType, filename);
                await fs.unlink(filepath);
                logger.info(`文件删除成功: ${filepath}`);
            } catch (error) {
                if (error.code !== 'ENOENT') { // 忽略文件不存在的错误
                    logger.error(`文件删除失败: ${filename}`, error);
                }
            }
        }
    }

    /**
     * 从 JSON 字符串中提取文件名
     * @param {string} imagesJson 图片 JSON 字符串
     * @returns {string[]} 文件名数组
     */
    static extractFilenames(imagesJson) {
        try {
            const images = JSON.parse(imagesJson || '[]');
            return images.map(img => path.basename(img.filename || img.url || ''))
                .filter(filename => filename);
        } catch (error) {
            logger.error('解析图片 JSON 失败:', error);
            return [];
        }
    }

    /**
     * 清理指定帖子的图片
     * @param {number} postId 帖子ID
     */
    static async cleanupPostFiles(postId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 获取帖子图片
            const [posts] = await connection.query(
                'SELECT images FROM help_posts WHERE id = ?',
                [postId]
            );

            // 获取该帖子下所有回答的图片
            const [answers] = await connection.query(
                'SELECT images FROM help_answers WHERE post_id = ?',
                [postId]
            );

            // 收集所有需要删除的文件名
            const filenames = [
                ...this.extractFilenames(posts[0]?.images),
                ...answers.flatMap(answer => this.extractFilenames(answer.images))
            ];

            // 删除文件
            await this.deleteFiles(filenames, 'help');

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            logger.error('清理帖子文件失败:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 清理指定回答的图片
     * @param {number} answerId 回答ID
     */
    static async cleanupAnswerFiles(answerId) {
        try {
            // 获取回答图片
            const [answers] = await pool.query(
                'SELECT images FROM help_answers WHERE id = ?',
                [answerId]
            );

            if (answers.length > 0) {
                const filenames = this.extractFilenames(answers[0].images);
                await this.deleteFiles(filenames, 'help');
            }
        } catch (error) {
            logger.error('清理回答文件失败:', error);
            throw error;
        }
    }

    /**
     * 清理未使用的图片文件
     * @param {number} hours 清理超过多少小时未使用的文件
     */
    static async cleanupUnusedFiles(hours = 24) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 获取所有在用的图片文件名
            const [posts] = await connection.query('SELECT images FROM help_posts');
            const [answers] = await connection.query('SELECT images FROM help_answers');

            // 收集所有在用的文件名
            const usedFiles = new Set([
                ...posts.flatMap(post => this.extractFilenames(post.images)),
                ...answers.flatMap(answer => this.extractFilenames(answer.images))
            ]);

            // 读取上传目录中的所有文件
            const uploadDir = path.join(__dirname, '../public/uploads/help');
            const files = await fs.readdir(uploadDir);

            // 获取文件信息并筛选出未使用且超时的文件
            const now = Date.now();
            const unusedFiles = [];

            for (const file of files) {
                try {
                    const filepath = path.join(uploadDir, file);
                    const stats = await fs.stat(filepath);
                    
                    // 如果文件不在使用中且创建时间超过指定小时数
                    if (!usedFiles.has(file) && 
                        now - stats.birthtimeMs > hours * 3600 * 1000) {
                        unusedFiles.push(file);
                    }
                } catch (error) {
                    logger.error(`获取文件信息失败: ${file}`, error);
                }
            }

            // 删除未使用的文件
            await this.deleteFiles(unusedFiles, 'help');

            await connection.commit();
            logger.info(`清理了 ${unusedFiles.length} 个未使用的文件`);
        } catch (error) {
            await connection.rollback();
            logger.error('清理未使用文件失败:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = FileCleanup; 