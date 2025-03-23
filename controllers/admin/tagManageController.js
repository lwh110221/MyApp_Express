const BaseController = require('../baseController');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

class TagManageController extends BaseController {
    /**
     * 获取标签列表
     */
    async getTagList(req, res) {
        try {
            const { page = 1, limit = 10, keyword, status } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = 'WHERE 1=1';
            const params = [];
            
            if (keyword) {
                whereClause += ' AND name LIKE ?';
                params.push(`%${keyword}%`);
            }
            
            if (status !== undefined) {
                whereClause += ' AND status = ?';
                params.push(status);
            }
            
            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM community_tags ${whereClause}`,
                params
            );
            const total = countResult[0].total;
            
            // 获取标签列表
            const [tags] = await pool.query(
                `SELECT 
                    id, name, status, used_count, created_at, updated_at
                FROM community_tags
                ${whereClause}
                ORDER BY used_count DESC, id DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );
            
            this.success(res, {
                items: tags,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('获取标签列表错误:', error);
            this.error(res, '获取标签列表失败');
        }
    }
    
    /**
     * 创建标签
     */
    async createTag(req, res) {
        try {
            const { name } = req.body;
            
            // 检查标签是否已存在
            const [existingTags] = await pool.query(
                'SELECT id FROM community_tags WHERE name = ?',
                [name]
            );
            
            if (existingTags.length > 0) {
                return this.error(res, '标签已存在', 400);
            }
            
            // 创建标签
            const [result] = await pool.query(
                'INSERT INTO community_tags (name) VALUES (?)',
                [name]
            );
            
            this.success(res, { id: result.insertId }, '标签创建成功');
        } catch (error) {
            logger.error('创建标签错误:', error);
            this.error(res, '创建标签失败');
        }
    }
    
    /**
     * 更新标签
     */
    async updateTag(req, res) {
        try {
            const { tagId } = req.params;
            const { name, status } = req.body;
            
            // 检查标签是否存在
            const [existingTags] = await pool.query(
                'SELECT id FROM community_tags WHERE id = ?',
                [tagId]
            );
            
            if (existingTags.length === 0) {
                return this.error(res, '标签不存在', 404);
            }
            
            // 如果要更新名称，检查新名称是否已存在
            if (name) {
                const [duplicateNames] = await pool.query(
                    'SELECT id FROM community_tags WHERE name = ? AND id != ?',
                    [name, tagId]
                );
                
                if (duplicateNames.length > 0) {
                    return this.error(res, '标签名称已存在', 400);
                }
            }
            
            // 构建更新语句
            const updateFields = [];
            const updateParams = [];
            
            if (name !== undefined) {
                updateFields.push('name = ?');
                updateParams.push(name);
            }
            
            if (status !== undefined) {
                updateFields.push('status = ?');
                updateParams.push(status);
            }
            
            if (updateFields.length === 0) {
                return this.error(res, '未提供要更新的字段', 400);
            }
            
            // 执行更新
            await pool.query(
                `UPDATE community_tags SET ${updateFields.join(', ')} WHERE id = ?`,
                [...updateParams, tagId]
            );
            
            this.success(res, null, '标签更新成功');
        } catch (error) {
            logger.error('更新标签错误:', error);
            this.error(res, '更新标签失败');
        }
    }
    
    /**
     * 删除标签
     */
    async deleteTag(req, res) {
        const connection = await pool.getConnection();
        try {
            const { tagId } = req.params;
            
            await connection.beginTransaction();
            
            // 检查标签是否存在
            const [existingTags] = await connection.query(
                'SELECT id, used_count FROM community_tags WHERE id = ?',
                [tagId]
            );
            
            if (existingTags.length === 0) {
                await connection.rollback();
                return this.error(res, '标签不存在', 404);
            }
            
            // 检查标签是否被使用
            const [usedResult] = await connection.query(
                'SELECT COUNT(*) as count FROM community_post_tags WHERE tag_id = ?',
                [tagId]
            );
            
            if (usedResult[0].count > 0) {
                await connection.rollback();
                return this.error(res, '标签已被使用，不能删除', 400);
            }
            
            // 删除标签
            await connection.query(
                'DELETE FROM community_tags WHERE id = ?',
                [tagId]
            );
            
            await connection.commit();
            this.success(res, null, '标签删除成功');
        } catch (error) {
            await connection.rollback();
            logger.error('删除标签错误:', error);
            this.error(res, '删除标签失败');
        } finally {
            connection.release();
        }
    }
    
    /**
     * 获取标签使用报告
     */
    async getTagUsageReport(req, res) {
        try {
            // 获取总标签数量
            const [totalResult] = await pool.query(
                'SELECT COUNT(*) as total FROM community_tags'
            );
            
            // 获取使用过的标签数量
            const [usedResult] = await pool.query(
                'SELECT COUNT(*) as used FROM community_tags WHERE used_count > 0'
            );
            
            // 获取最热门的10个标签
            const [hotTags] = await pool.query(
                `SELECT 
                    id, name, used_count 
                FROM community_tags 
                WHERE status = 1 
                ORDER BY used_count DESC 
                LIMIT 10`
            );
            
            // 获取最近创建的10个标签
            const [newTags] = await pool.query(
                `SELECT 
                    id, name, created_at 
                FROM community_tags 
                ORDER BY created_at DESC 
                LIMIT 10`
            );
            
            // 获取标签使用趋势（最近7天）
            const [trendResult] = await pool.query(
                `SELECT 
                    DATE(pt.created_at) as date, 
                    COUNT(*) as count 
                FROM community_post_tags pt
                WHERE pt.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE(pt.created_at)
                ORDER BY date DESC`
            );
            
            this.success(res, {
                total_tags: totalResult[0].total,
                used_tags: usedResult[0].used,
                hot_tags: hotTags,
                new_tags: newTags,
                usage_trend: trendResult
            });
        } catch (error) {
            logger.error('获取标签使用报告错误:', error);
            this.error(res, '获取标签使用报告失败');
        }
    }
}

module.exports = new TagManageController(); 