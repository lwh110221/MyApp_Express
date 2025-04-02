const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const ResponseUtil = require('../../utils/responseUtil');

class AdminManageController {
    // 获取管理员列表
    async getAdminList(req, res) {
        try {
            const { page = 1, limit = 10, username, email } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (username) {
                whereClause += ' AND a.username LIKE ?';
                params.push(`%${username}%`);
            }

            if (email) {
                whereClause += ' AND a.email LIKE ?';
                params.push(`%${email}%`);
            }

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM admins a ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取管理员列表
            const [admins] = await pool.query(
                `SELECT a.id, a.username, a.email, a.status, a.last_login, a.created_at,
                GROUP_CONCAT(DISTINCT r.name) as roles
                FROM admins a
                LEFT JOIN admin_roles ar ON a.id = ar.admin_id
                LEFT JOIN roles r ON ar.role_id = r.id
                ${whereClause}
                GROUP BY a.id
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            return ResponseUtil.success(res, {
                items: admins.map(admin => ({
                    ...admin,
                    roles: admin.roles ? admin.roles.split(',') : []
                })),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get admin list error:', error);
            return ResponseUtil.error(res, '获取管理员列表失败');
        }
    }

    // 获取角色列表
    async getRoleList(req, res) {
        try {
            const [roles] = await pool.query(
                `SELECT id, name, code, description, status 
                FROM roles 
                WHERE status = 1
                ORDER BY id ASC`
            );
            
            return ResponseUtil.success(res, roles);
        } catch (error) {
            console.error('Get role list error:', error);
            return ResponseUtil.error(res, '获取角色列表失败');
        }
    }

    // 创建管理员
    async createAdmin(req, res) {
        try {
            const { username, email, password, roleIds } = req.body;

            // 检查用户名和邮箱是否已存在
            const [existing] = await pool.query(
                'SELECT id FROM admins WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing.length > 0) {
                return ResponseUtil.error(res, '用户名或邮箱已存在', 400);
            }

            // 开启事务
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 创建管理员账号
                const hashedPassword = await bcrypt.hash(password, 10);
                const [result] = await connection.query(
                    'INSERT INTO admins (username, email, password, status) VALUES (?, ?, ?, 1)',
                    [username, email, hashedPassword]
                );

                // 分配角色
                if (roleIds && roleIds.length > 0) {
                    const values = roleIds.map(roleId => [result.insertId, roleId]);
                    await connection.query(
                        'INSERT INTO admin_roles (admin_id, role_id) VALUES ?',
                        [values]
                    );
                }

                await connection.commit();
                return ResponseUtil.success(res, null, '管理员创建成功', 201);
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Create admin error:', error);
            return ResponseUtil.error(res, '创建管理员失败');
        }
    }

    // 更新管理员状态
    async toggleAdminStatus(req, res) {
        try {
            const { adminId } = req.params;
            const { status } = req.body;

            // 不允许自己禁用自己
            if (parseInt(adminId) === req.admin.id) {
                return ResponseUtil.error(res, '不能修改自己的状态', 400);
            }

            const statusValue = status ? 1 : 0;
            const [result] = await pool.query(
                'UPDATE admins SET status = ? WHERE id = ?',
                [statusValue, adminId]
            );

            if (result.affectedRows === 0) {
                return ResponseUtil.error(res, '管理员不存在', 404);
            }

            return ResponseUtil.success(res, null, `管理员${statusValue === 1 ? '启用' : '禁用'}成功`);
        } catch (error) {
            console.error('Toggle admin status error:', error);
            return ResponseUtil.error(res, '操作失败');
        }
    }

    // 更新管理员角色
    async updateAdminRoles(req, res) {
        try {
            const { adminId } = req.params;
            const { roleIds } = req.body;

            // 不允许修改自己的角色
            if (parseInt(adminId) === req.admin.id) {
                return ResponseUtil.error(res, '不能修改自己的角色', 400);
            }

            // 开启事务
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 删除原有角色
                await connection.query(
                    'DELETE FROM admin_roles WHERE admin_id = ?',
                    [adminId]
                );

                // 分配新角色
                if (roleIds && roleIds.length > 0) {
                    const values = roleIds.map(roleId => [adminId, roleId]);
                    await connection.query(
                        'INSERT INTO admin_roles (admin_id, role_id) VALUES ?',
                        [values]
                    );
                }

                await connection.commit();
                return ResponseUtil.success(res, null, '角色更新成功');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Update admin roles error:', error);
            return ResponseUtil.error(res, '更新角色失败');
        }
    }

    // 删除管理员
    async deleteAdmin(req, res) {
        try {
            const { adminId } = req.params;

            // 不允许删除自己
            if (parseInt(adminId) === req.admin.id) {
                return ResponseUtil.error(res, '不能删除自己的账号', 400);
            }

            // 开启事务
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 删除角色关联
                await connection.query(
                    'DELETE FROM admin_roles WHERE admin_id = ?',
                    [adminId]
                );

                // 删除管理员账号
                const [result] = await connection.query(
                    'DELETE FROM admins WHERE id = ?',
                    [adminId]
                );

                if (result.affectedRows === 0) {
                    await connection.rollback();
                    return ResponseUtil.error(res, '管理员不存在', 404);
                }

                await connection.commit();
                return ResponseUtil.success(res, null, '管理员删除成功');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Delete admin error:', error);
            return ResponseUtil.error(res, '删除管理员失败');
        }
    }
}

module.exports = new AdminManageController(); 