const BaseController = require('../baseController');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

class CommunityManageController extends BaseController {
    // 获取帖子列表
    async getPostList(req, res) {
        try {
            const { page = 1, limit = 10, status, keyword } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const params = [];

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
                FROM community_posts p 
                ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取帖子列表
            const [posts] = await pool.query(
                `SELECT 
                    p.*,
                    u.username as author_name
                FROM community_posts p
                LEFT JOIN users u ON p.user_id = u.id
                ${whereClause}
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            this.success(res, {
                items: posts.map(post => ({
                    ...post,
                    images: JSON.parse(post.images || '[]')
                })),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('获取社区帖子列表错误:', error);
            this.error(res, '获取帖子列表失败');
        }
    }

    // 更新帖子状态
    async updatePostStatus(req, res) {
        try {
            const { postId } = req.params;
            const { status } = req.body;

            const [result] = await pool.query(
                'UPDATE community_posts SET status = ? WHERE id = ?',
                [status, postId]
            );

            if (result.affectedRows === 0) {
                return this.error(res, '帖子不存在', 404);
            }

            this.success(res, null, '状态更新成功');
        } catch (error) {
            logger.error('更新社区帖子状态错误:', error);
            this.error(res, '更新状态失败');
        }
    }

    // 获取评论列表
    async getCommentList(req, res) {
        try {
            const { page = 1, limit = 10, status, keyword, postId } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (status !== undefined) {
                whereClause += ' AND c.status = ?';
                params.push(status);
            }

            if (postId) {
                whereClause += ' AND c.post_id = ?';
                params.push(postId);
            }

            if (keyword) {
                whereClause += ' AND c.content LIKE ?';
                params.push(`%${keyword}%`);
            }

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total 
                FROM community_comments c 
                ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取评论列表
            const [comments] = await pool.query(
                `SELECT 
                    c.*,
                    u.username as author_name,
                    p.title as post_title
                FROM community_comments c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN community_posts p ON c.post_id = p.id
                ${whereClause}
                ORDER BY c.created_at DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            this.success(res, {
                items: comments.map(comment => ({
                    ...comment,
                    images: JSON.parse(comment.images || '[]')
                })),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('获取社区评论列表错误:', error);
            this.error(res, '获取评论列表失败');
        }
    }

    // 更新评论状态
    async updateCommentStatus(req, res) {
        try {
            const { commentId } = req.params;
            const { status } = req.body;

            const [comments] = await pool.query(
                'SELECT post_id FROM community_comments WHERE id = ?',
                [commentId]
            );

            if (comments.length === 0) {
                return this.error(res, '评论不存在', 404);
            }

            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                // 更新评论状态
                const [result] = await connection.query(
                    'UPDATE community_comments SET status = ? WHERE id = ?',
                    [status, commentId]
                );

                // 如果是删除评论（status = 0），则更新帖子评论数
                if (status === 0) {
                    await connection.query(
                        'UPDATE community_posts SET comment_count = comment_count - 1 WHERE id = ?',
                        [comments[0].post_id]
                    );
                }

                await connection.commit();
                this.success(res, null, '状态更新成功');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            logger.error('更新社区评论状态错误:', error);
            this.error(res, '更新状态失败');
        }
    }
}

module.exports = new CommunityManageController(); 