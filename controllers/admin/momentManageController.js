const pool = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/responseUtil');

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
                return successResponse(res, {
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

            return successResponse(res, {
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
            return errorResponse(res, '获取动态列表失败');
        }
    }

    // 删除动态
    async deleteMoment(req, res) {
        try {
            const { momentId } = req.params;

            // 开启事务
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 删除动态图片
                await connection.query(
                    'DELETE FROM moment_images WHERE moment_id = ?',
                    [momentId]
                );

                // 删除动态
                const [result] = await connection.query(
                    'DELETE FROM user_moments WHERE id = ?',
                    [momentId]
                );

                if (result.affectedRows === 0) {
                    await connection.rollback();
                    return errorResponse(res, '动态不存在', 404);
                }

                await connection.commit();
                return successResponse(res, null, '动态删除成功');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Delete moment error:', error);
            return errorResponse(res, '删除动态失败');
        }
    }

    // 获取动态统计数据
    async getMomentStats(req, res) {
        try {
            // 获取总动态数
            const [totalResult] = await pool.query(
                'SELECT COUNT(*) as total FROM user_moments'
            );

            // 获取今日动态数
            const [todayResult] = await pool.query(
                'SELECT COUNT(*) as count FROM user_moments WHERE DATE(created_at) = CURDATE()'
            );

            // 获取本月动态数
            const [monthResult] = await pool.query(
                'SELECT COUNT(*) as count FROM user_moments WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
            );

            // 获取动态趋势
            const [trendResult] = await pool.query(
                `SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM user_moments 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC`
            );

            return successResponse(res, {
                total: totalResult[0].total,
                today: todayResult[0].count,
                month: monthResult[0].count,
                trend: trendResult
            });
        } catch (error) {
            console.error('Get moment stats error:', error);
            return errorResponse(res, '获取动态统计数据失败');
        }
    }
}

module.exports = new MomentManageController(); 