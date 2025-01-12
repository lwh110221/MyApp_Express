const pool = require('../../config/database');
const logger = require('../../utils/logger');
const ResponseUtil = require('../../utils/responseUtil');
const createFileCleanupMiddleware = require('../../middleware/fileCleanup');

const fileCleanup = createFileCleanupMiddleware();

class MomentManageController {
    // 获取动态列表
    async getMomentList(req, res) {
        try {
            const { page = 1, limit = 10, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (startDate) {
                whereClause += ' AND m.created_at >= ?';
                params.push(startDate);
            }

            if (endDate) {
                whereClause += ' AND m.created_at <= ?';
                params.push(endDate);
            }

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM user_moments m ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 如果没有数据，直接返回空列表
            if (total === 0) {
                return ResponseUtil.success(res, {
                    items: [],
                    pagination: {
                        total: 0,
                        page: parseInt(page),
                        limit: parseInt(limit)
                    }
                });
            }

            // 获取动态列表
            const [moments] = await pool.query(
                `SELECT m.*, u.username,
                GROUP_CONCAT(mi.image_url) as images
                FROM user_moments m
                LEFT JOIN users u ON m.user_id = u.id
                LEFT JOIN moment_images mi ON m.id = mi.moment_id
                ${whereClause}
                GROUP BY m.id
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            return ResponseUtil.success(res, {
                items: moments.map(moment => ({
                    ...moment,
                    images: moment.images ? moment.images.split(',') : []
                })),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get moment list error:', error);
            return ResponseUtil.error(res, '获取动态列表失败');
        }
    }

    // 删除动态
    async deleteMoment(req, res) {
        const connection = await pool.getConnection();
        try {
            const { momentId } = req.params;

            // 获取动态图片信息
            const [images] = await connection.query(
                'SELECT image_url FROM moment_images WHERE moment_id = ?',
                [momentId]
            );

            await connection.beginTransaction();

            // 删除动态图片记录
            await connection.query('DELETE FROM moment_images WHERE moment_id = ?', [momentId]);
            
            // 删除动态
            const [result] = await connection.query('DELETE FROM user_moments WHERE id = ?', [momentId]);

            if (result.affectedRows === 0) {
                await connection.rollback();
                return ResponseUtil.error(res, '动态不存在', 404);
            }

            // 清理图片文件
            for (const image of images) {
                await fileCleanup.cleanupSingleFile(image.image_url);
            }

            await connection.commit();
            return ResponseUtil.success(res, null, '动态删除成功');
        } catch (error) {
            await connection.rollback();
            logger.error('删除动态失败:', error);
            return ResponseUtil.error(res, '删除动态失败');
        } finally {
            connection.release();
        }
    }

    // 获取动态统计数据
    async getMomentStats(req, res) {
        try {
            // 获取总动态数
            const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM user_moments');
            
            // 获取今日新增动态数
            const [todayResult] = await pool.query(
                'SELECT COUNT(*) as count FROM user_moments WHERE DATE(created_at) = CURDATE()'
            );
            
            // 获取动态增长趋势
            const [trendResult] = await pool.query(
                `SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM user_moments 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC`
            );

            return ResponseUtil.success(res, {
                total_moments: totalResult[0].total,
                today_new_moments: todayResult[0].count,
                growth_trend: trendResult
            });
        } catch (error) {
            console.error('Get moment stats error:', error);
            return ResponseUtil.error(res, '获取动态统计数据失败');
        }
    }
}

module.exports = new MomentManageController(); 