const pool = require('../config/database');
const ResponseUtil = require('../utils/responseUtil');
const logger = require('../utils/logger');
const { BusinessError } = require('../utils/errors');
const fs = require('fs').promises;
const path = require('path');
const FileCleanup = require('../utils/fileCleanup');

class HelpController {
    // 获取求助分类列表
    async getCategoryList(req, res) {
        try {
            const [categories] = await pool.query(
                'SELECT * FROM help_categories WHERE status = 1 ORDER BY sort_order ASC'
            );
            return ResponseUtil.success(res, categories);
        } catch (error) {
            logger.error('获取求助分类列表错误:', error);
            return ResponseUtil.error(res, '获取分类列表失败');
        }
    }

    // 发布求助
    async createPost(req, res) {
        try {
            const { title, content, category_id, images } = req.body;
            const userId = req.userData.userId;

            const [result] = await pool.query(
                `INSERT INTO help_posts 
                (user_id, title, content, category_id, images) 
                VALUES (?, ?, ?, ?, ?)`,
                [userId, title, content, category_id, JSON.stringify(images || [])]
            );

            return ResponseUtil.success(res, { id: result.insertId }, '发布成功');
        } catch (error) {
            logger.error('发布求助错误:', error);
            return ResponseUtil.error(res, '发布求助失败');
        }
    }

    // 获取求助列表
    async getPostList(req, res) {
        try {
            const { page = 1, limit = 10, category_id, status, keyword } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (category_id) {
                whereClause += ' AND p.category_id = ?';
                params.push(category_id);
            }

            if (status !== undefined) {
                whereClause += ' AND p.status = ?';
                params.push(status);
            }

            if (keyword) {
                whereClause += ' AND (p.title LIKE ? OR p.content LIKE ?)';
                params.push(`%${keyword}%`, `%${keyword}%`);
            }

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total 
                FROM help_posts p 
                ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取帖子列表
            const [posts] = await pool.query(
                `SELECT 
                    p.*,
                    u.username as author_name,
                    c.name as category_name,
                    (SELECT COUNT(*) FROM help_answers WHERE post_id = p.id) as answer_count
                FROM help_posts p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN help_categories c ON p.category_id = c.id
                ${whereClause}
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            return ResponseUtil.success(res, {
                items: posts.map(post => {
                    try {
                        // 检查 images 是否已经是对象
                        const images = typeof post.images === 'string' ? 
                            JSON.parse(post.images) : 
                            (Array.isArray(post.images) ? post.images : []);
                        
                        return {
                            ...post,
                            images
                        };
                    } catch (err) {
                        logger.error('解析帖子图片数据错误:', err);
                        return {
                            ...post,
                            images: []
                        };
                    }
                }),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('获取求助列表错误:', error);
            return ResponseUtil.error(res, '获取求助列表失败');
        }
    }

    // 获取求助详情
    async getPostDetail(req, res) {
        const connection = await pool.getConnection();
        try {
            const { postId } = req.params;

            await connection.beginTransaction();

            // 更新浏览次数
            await connection.query(
                'UPDATE help_posts SET view_count = view_count + 1 WHERE id = ?',
                [postId]
            );

            // 获取帖子详情
            const [posts] = await connection.query(
                `SELECT 
                    p.*,
                    u.username as author_name,
                    c.name as category_name
                FROM help_posts p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN help_categories c ON p.category_id = c.id
                WHERE p.id = ?`,
                [postId]
            );

            if (posts.length === 0) {
                await connection.rollback();
                return ResponseUtil.error(res, '帖子不存在', 404);
            }

            const post = posts[0];
            try {
                // 检查 images 是否已经是对象
                const images = typeof post.images === 'string' ? 
                    JSON.parse(post.images) : 
                    (Array.isArray(post.images) ? post.images : []);
                
                post.images = images;
            } catch (err) {
                logger.error('解析帖子图片数据错误:', err);
                post.images = [];
            }

            await connection.commit();
            return ResponseUtil.success(res, post);
        } catch (error) {
            await connection.rollback();
            logger.error('获取求助详情错误:', error);
            return ResponseUtil.error(res, '获取求助详情失败');
        } finally {
            connection.release();
        }
    }

    // 更新求助状态
    async updatePostStatus(req, res) {
        try {
            const { postId } = req.params;
            const { status } = req.body;
            const userId = req.userData.userId;

            // 检查是否是帖子作者
            const [posts] = await pool.query(
                'SELECT user_id FROM help_posts WHERE id = ?',
                [postId]
            );

            if (posts.length === 0) {
                return ResponseUtil.error(res, '帖子不存在', 404);
            }

            if (posts[0].user_id !== userId) {
                return ResponseUtil.error(res, '无权操作此帖子', 403);
            }

            // 如果要删除帖子（status = 0），则清理相关文件
            if (status === 0) {
                await FileCleanup.cleanupPostFiles(postId);
            }

            // 更新状态
            await pool.query(
                'UPDATE help_posts SET status = ? WHERE id = ?',
                [status, postId]
            );

            return ResponseUtil.success(res, null, '更新成功');
        } catch (error) {
            logger.error('更新求助状态错误:', error);
            return ResponseUtil.error(res, '更新状态失败');
        }
    }

    // 发表回答
    async createAnswer(req, res) {
        try {
            const { postId } = req.params;
            const { content, images } = req.body;
            const expertId = req.userData.userId;

            // 检查帖子是否存在且开放
            const [posts] = await pool.query(
                'SELECT status FROM help_posts WHERE id = ?',
                [postId]
            );

            if (posts.length === 0) {
                return ResponseUtil.error(res, '帖子不存在', 404);
            }

            if (posts[0].status !== 1) {
                return ResponseUtil.error(res, '帖子已关闭或已解决', 400);
            }

            // 创建回答
            const [result] = await pool.query(
                `INSERT INTO help_answers 
                (post_id, expert_id, content, images) 
                VALUES (?, ?, ?, ?)`,
                [postId, expertId, content, JSON.stringify(images || [])]
            );

            return ResponseUtil.success(res, { id: result.insertId }, '回答成功');
        } catch (error) {
            logger.error('发表回答错误:', error);
            return ResponseUtil.error(res, '发表回答失败');
        }
    }

    // 获取回答列表
    async getAnswerList(req, res) {
        try {
            const { postId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            // 获取总数
            const [countResult] = await pool.query(
                'SELECT COUNT(*) as total FROM help_answers WHERE post_id = ?',
                [postId]
            );
            const total = countResult[0].total;

            // 获取回答列表
            const [answers] = await pool.query(
                `SELECT 
                    a.*,
                    u.username as expert_name
                FROM help_answers a
                LEFT JOIN users u ON a.expert_id = u.id
                WHERE a.post_id = ?
                ORDER BY a.is_accepted DESC, a.created_at DESC
                LIMIT ? OFFSET ?`,
                [postId, parseInt(limit), offset]
            );

            return ResponseUtil.success(res, {
                items: answers.map(answer => {
                    try {
                        // 检查 images 是否已经是对象
                        const images = typeof answer.images === 'string' ? 
                            JSON.parse(answer.images) : 
                            (Array.isArray(answer.images) ? answer.images : []);
                        
                        return {
                            ...answer,
                            images
                        };
                    } catch (err) {
                        logger.error('解析回答图片数据错误:', err);
                        return {
                            ...answer,
                            images: []
                        };
                    }
                }),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('获取回答列表错误:', error);
            return ResponseUtil.error(res, '获取回答列表失败');
        }
    }

    // 采纳回答
    async acceptAnswer(req, res) {
        const connection = await pool.getConnection();
        try {
            const { answerId } = req.params;
            const userId = req.userData.userId;

            await connection.beginTransaction();

            // 获取回答和帖子信息
            const [answers] = await connection.query(
                `SELECT a.*, p.user_id as post_author_id, p.status as post_status
                FROM help_answers a
                JOIN help_posts p ON a.post_id = p.id
                WHERE a.id = ?`,
                [answerId]
            );

            if (answers.length === 0) {
                await connection.rollback();
                return ResponseUtil.error(res, '回答不存在', 404);
            }

            const answer = answers[0];

            // 验证权限和状态
            if (answer.post_author_id !== userId) {
                await connection.rollback();
                return ResponseUtil.error(res, '无权操作此回答', 403);
            }

            if (answer.post_status === 2) {
                await connection.rollback();
                return ResponseUtil.error(res, '该帖子已有采纳的回答', 400);
            }

            if (answer.is_accepted) {
                await connection.rollback();
                return ResponseUtil.error(res, '该回答已被采纳', 400);
            }

            // 更新回答状态
            await connection.query(
                'UPDATE help_answers SET is_accepted = 1 WHERE id = ?',
                [answerId]
            );

            // 更新帖子状态为已解决
            await connection.query(
                'UPDATE help_posts SET status = 2 WHERE id = ?',
                [answer.post_id]
            );

            await connection.commit();
            return ResponseUtil.success(res, null, '采纳成功');
        } catch (error) {
            await connection.rollback();
            logger.error('采纳回答错误:', error);
            return ResponseUtil.error(res, '采纳回答失败');
        } finally {
            connection.release();
        }
    }

    // 删除回答
    async deleteAnswer(req, res) {
        try {
            const { answerId } = req.params;
            const userId = req.userData.userId;

            // 检查是否是回答作者
            const [answers] = await pool.query(
                'SELECT expert_id FROM help_answers WHERE id = ?',
                [answerId]
            );

            if (answers.length === 0) {
                return ResponseUtil.error(res, '回答不存在', 404);
            }

            if (answers[0].expert_id !== userId) {
                return ResponseUtil.error(res, '无权删除此回答', 403);
            }

            // 清理回答相关的文件
            await FileCleanup.cleanupAnswerFiles(answerId);

            // 删除回答
            await pool.query('DELETE FROM help_answers WHERE id = ?', [answerId]);

            return ResponseUtil.success(res, null, '删除成功');
        } catch (error) {
            logger.error('删除回答错误:', error);
            return ResponseUtil.error(res, '删除回答失败');
        }
    }

    // 上传图片
    async uploadImages(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return ResponseUtil.error(res, '请选择要上传的图片');
            }

            const uploadedFiles = req.files.map(file => ({
                url: `/uploads/help/${path.basename(file.path)}`,
                filename: path.basename(file.path)
            }));

            return ResponseUtil.success(res, uploadedFiles, '图片上传成功');
        } catch (error) {
            // 上传失败时删除已上传的文件
            if (req.files) {
                await Promise.all(req.files.map(file => 
                    fs.unlink(file.path).catch(() => {})
                ));
            }
            logger.error('上传图片错误:', error);
            return ResponseUtil.error(res, '图片上传失败');
        }
    }
}

module.exports = new HelpController(); 