const pool = require('../../config/database');
const ResponseUtil = require('../../utils/responseUtil');

class LogManageController {
    // 获取操作日志列表
    async getLogList(req, res) {
        try {
            const { page = 1, limit = 10, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (startDate) {
                whereClause += ' AND created_at >= ?';
                params.push(startDate);
            }

            if (endDate) {
                whereClause += ' AND created_at <= ?';
                params.push(endDate);
            }

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM admin_operation_logs ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取日志列表
            const [logs] = await pool.query(
                `SELECT l.*, a.username as admin_username
                FROM admin_operation_logs l
                LEFT JOIN admins a ON l.admin_id = a.id
                ${whereClause}
                ORDER BY l.created_at DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            return ResponseUtil.success(res, {
                items: logs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get log list error:', error);
            return ResponseUtil.error(res, '获取日志列表失败');
        }
    }

    // 获取日志统计数据
    async getLogStats(req, res) {
        try {
            // 获取总日志数
            const [totalResult] = await pool.query(
                'SELECT COUNT(*) as total FROM admin_operation_logs'
            );
            
            // 获取今日操作数
            const [todayResult] = await pool.query(
                'SELECT COUNT(*) as count FROM admin_operation_logs WHERE DATE(created_at) = CURDATE()'
            );
            
            // 获取操作类型统计
            const [operationStats] = await pool.query(
                `SELECT operation_type, COUNT(*) as count 
                FROM admin_operation_logs 
                GROUP BY operation_type 
                ORDER BY count DESC 
                LIMIT 10`
            );
            
            // 获取操作趋势
            const [trendResult] = await pool.query(
                `SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM admin_operation_logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC`
            );

            return ResponseUtil.success(res, {
                total: totalResult[0].total,
                today: todayResult[0].count,
                operationStats,
                trend: trendResult
            });
        } catch (error) {
            console.error('Get log stats error:', error);
            return ResponseUtil.error(res, '获取日志统计数据失败');
        }
    }

    // 清理日志
    async cleanLogs(req, res) {
        try {
            const { beforeDate } = req.body;

            const [result] = await pool.query(
                'DELETE FROM admin_operation_logs WHERE created_at < ?',
                [beforeDate]
            );

            return ResponseUtil.success(res, {
                affectedRows: result.affectedRows
            }, '日志清理成功');
        } catch (error) {
            console.error('Clean logs error:', error);
            return ResponseUtil.error(res, '清理日志失败');
        }
    }
}

module.exports = new LogManageController(); 