const pool = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/responseUtil');

class UserManageController {
    // 获取用户列表
    async getUserList(req, res) {
        try {
            const { page = 1, limit = 10, username, email, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (username) {
                whereClause += ' AND u.username LIKE ?';
                params.push(`%${username}%`);
            }

            if (email) {
                whereClause += ' AND u.email LIKE ?';
                params.push(`%${email}%`);
            }

            if (startDate) {
                whereClause += ' AND u.created_at >= ?';
                params.push(startDate);
            }

            if (endDate) {
                whereClause += ' AND u.created_at <= ?';
                params.push(endDate);
            }

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM users u ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取用户列表
            const [users] = await pool.query(
                `SELECT u.*, up.bio, up.profile_picture 
                FROM users u 
                LEFT JOIN user_profiles up ON u.id = up.user_id 
                ${whereClause}
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            return successResponse(res, {
                items: users,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get user list error:', error);
            return errorResponse(res, '获取用户列表失败');
        }
    }

    // 获取用户详情
    async getUserDetail(req, res) {
        try {
            const { userId } = req.params;

            // 获取用户基本信息和资料
            const [users] = await pool.query(
                `SELECT u.*, up.bio, up.profile_picture 
                FROM users u 
                LEFT JOIN user_profiles up ON u.id = up.user_id 
                WHERE u.id = ?`,
                [userId]
            );

            if (users.length === 0) {
                return errorResponse(res, '用户不存在', 404);
            }

            // 获取用户最近的动态
            const [moments] = await pool.query(
                `SELECT m.*, GROUP_CONCAT(mi.image_url) as images
                FROM user_moments m
                LEFT JOIN moment_images mi ON m.id = mi.moment_id
                WHERE m.user_id = ?
                GROUP BY m.id
                ORDER BY m.created_at DESC
                LIMIT 5`,
                [userId]
            );

            const userData = {
                ...users[0],
                recent_moments: moments.map(moment => ({
                    ...moment,
                    images: moment.images ? moment.images.split(',') : []
                }))
            };

            return successResponse(res, userData);
        } catch (error) {
            console.error('Get user detail error:', error);
            return errorResponse(res, '获取用户详情失败');
        }
    }

    // 修改用户状态
    async toggleUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { status } = req.body;

            const statusValue = status ? 1 : 0;
            const [result] = await pool.query(
                'UPDATE users SET status = ? WHERE id = ?',
                [statusValue, userId]
            );

            if (result.affectedRows === 0) {
                return errorResponse(res, '用户不存在', 404);
            }

            return successResponse(res, null, `用户${statusValue === 1 ? '启用' : '禁用'}成功`);
        } catch (error) {
            console.error('Toggle user status error:', error);
            return errorResponse(res, '修改用户状态失败');
        }
    }

    // 删除用户
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;

            // 开启事务
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 删除用户资料
                await connection.query('DELETE FROM user_profiles WHERE user_id = ?', [userId]);
                
                // 删除用户动态相关
                await connection.query('DELETE FROM moment_images WHERE moment_id IN (SELECT id FROM user_moments WHERE user_id = ?)', [userId]);
                await connection.query('DELETE FROM user_moments WHERE user_id = ?', [userId]);
                
                // 删除用户账号
                const [result] = await connection.query('DELETE FROM users WHERE id = ?', [userId]);

                if (result.affectedRows === 0) {
                    await connection.rollback();
                    return errorResponse(res, '用户不存在', 404);
                }

                await connection.commit();
                return successResponse(res, null, '用户删除成功');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Delete user error:', error);
            return errorResponse(res, '删除用户失败');
        }
    }

    // 获取用户统计数据
    async getUserStats(req, res) {
        try {
            // 获取总用户数
            const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM users');
            
            // 获取今日新增用户数
            const [todayResult] = await pool.query(
                'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()'
            );
            
            // 获取本月活跃用户数（有发布动态的用户）
            const [activeResult] = await pool.query(
                `SELECT COUNT(DISTINCT user_id) as count 
                FROM user_moments 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
            );
            
            // 获取用户增长趋势
            const [trendResult] = await pool.query(
                `SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM users 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC`
            );

            return successResponse(res, {
                total_users: totalResult[0].total,
                today_new_users: todayResult[0].count,
                monthly_active_users: activeResult[0].count,
                growth_trend: trendResult
            });
        } catch (error) {
            console.error('Get user stats error:', error);
            return errorResponse(res, '获取用户统计数据失败');
        }
    }
}

module.exports = new UserManageController(); 