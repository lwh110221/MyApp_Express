const pool = require('../../config/database');
const ResponseUtil = require('../../utils/responseUtil');
const logger = require('../../utils/logger');

class HelpManageController {
    // 获取分类列表
    async getCategoryList(req, res) {
        try {
            const [categories] = await pool.query(
                'SELECT * FROM help_categories ORDER BY sort_order ASC'
            );
            return ResponseUtil.success(res, categories);
        } catch (error) {
            logger.error('获取求助分类列表错误:', error);
            return ResponseUtil.error(res, '获取分类列表失败');
        }
    }

    // 创建分类
    async createCategory(req, res) {
        try {
            const { name, description, sort_order = 0, status = 1 } = req.body;

            const [result] = await pool.query(
                'INSERT INTO help_categories (name, description, sort_order, status) VALUES (?, ?, ?, ?)',
                [name, description, sort_order, status]
            );

            return ResponseUtil.success(res, { id: result.insertId }, '分类创建成功');
        } catch (error) {
            logger.error('创建求助分类错误:', error);
            return ResponseUtil.error(res, '创建分类失败');
        }
    }

    // 更新分类
    async updateCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const { name, description, sort_order, status } = req.body;

            const [result] = await pool.query(
                'UPDATE help_categories SET name = ?, description = ?, sort_order = ?, status = ? WHERE id = ?',
                [name, description, sort_order, status, categoryId]
            );

            if (result.affectedRows === 0) {
                return ResponseUtil.error(res, '分类不存在', 404);
            }

            return ResponseUtil.success(res, null, '分类更新成功');
        } catch (error) {
            logger.error('更新求助分类错误:', error);
            return ResponseUtil.error(res, '更新分类失败');
        }
    }

    // 删除分类
    async deleteCategory(req, res) {
        const connection = await pool.getConnection();
        try {
            const { categoryId } = req.params;

            await connection.beginTransaction();

            // 检查分类下是否有帖子
            const [posts] = await connection.query(
                'SELECT COUNT(*) as count FROM help_posts WHERE category_id = ?',
                [categoryId]
            );

            if (posts[0].count > 0) {
                await connection.rollback();
                return ResponseUtil.error(res, '该分类下存在帖子，无法删除');
            }

            // 删除分类
            const [result] = await connection.query(
                'DELETE FROM help_categories WHERE id = ?',
                [categoryId]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return ResponseUtil.error(res, '分类不存在', 404);
            }

            await connection.commit();
            return ResponseUtil.success(res, null, '分类删除成功');
        } catch (error) {
            await connection.rollback();
            logger.error('删除求助分类错误:', error);
            return ResponseUtil.error(res, '删除分类失败');
        } finally {
            connection.release();
        }
    }

    // 获取求助帖子列表
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
            logger.error('获取求助帖子列表错误:', error);
            return ResponseUtil.error(res, '获取帖子列表失败');
        }
    }

    // 更新帖子状态
    async updatePostStatus(req, res) {
        try {
            const { postId } = req.params;
            const { status } = req.body;

            const [result] = await pool.query(
                'UPDATE help_posts SET status = ? WHERE id = ?',
                [status, postId]
            );

            if (result.affectedRows === 0) {
                return ResponseUtil.error(res, '帖子不存在', 404);
            }

            return ResponseUtil.success(res, null, '状态更新成功');
        } catch (error) {
            logger.error('更新帖子状态错误:', error);
            return ResponseUtil.error(res, '更新状态失败');
        }
    }
}

module.exports = new HelpManageController(); 