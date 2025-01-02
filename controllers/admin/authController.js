const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/database');
const ResponseUtil = require('../../utils/responseUtil');

class AdminAuthController {
    // 管理员登录
    async login(req, res) {
        try {
            const { username, password } = req.body;

            // 查询管理员
            const [admins] = await pool.query(
                'SELECT * FROM admins WHERE username = ?',
                [username]
            );

            const admin = admins[0];
            if (!admin || !bcrypt.compareSync(password, admin.password)) {
                return ResponseUtil.error(res, '用户名或密码错误', 401);
            }

            if (admin.status === 0) {
                return ResponseUtil.error(res, '账号已被禁用', 403);
            }

            // 生成JWT token
            const token = jwt.sign(
                { id: admin.id },
                process.env.ADMIN_JWT_SECRET,
                { expiresIn: '24h' }
            );

            // 更新最后登录时间
            await pool.query(
                'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [admin.id]
            );

            // 获取管理员角色
            const [roles] = await pool.query(`
                SELECT r.name, r.description
                FROM roles r
                JOIN admin_roles ar ON r.id = ar.role_id
                WHERE ar.admin_id = ?
            `, [admin.id]);

            return ResponseUtil.success(res, {
                token,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email,
                    roles: roles
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return ResponseUtil.error(res, '登录失败', 500);
        }
    }

    // 获取当前管理员信息
    async getProfile(req, res) {
        try {
            const adminId = req.admin.id;

            // 获取管理员详细信息
            const [admins] = await pool.query(`
                SELECT id, username, email, status, created_at, last_login
                FROM admins WHERE id = ?
            `, [adminId]);

            // 获取管理员角色
            const [roles] = await pool.query(`
                SELECT r.name, r.description
                FROM roles r
                JOIN admin_roles ar ON r.id = ar.role_id
                WHERE ar.admin_id = ?
            `, [adminId]);

            // 获取权限列表
            const [permissions] = await pool.query(`
                SELECT DISTINCT p.name, p.code
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN admin_roles ar ON rp.role_id = ar.role_id
                WHERE ar.admin_id = ?
            `, [adminId]);

            return ResponseUtil.success(res, {
                ...admins[0],
                roles,
                permissions
            });
        } catch (error) {
            console.error('Get profile error:', error);
            return ResponseUtil.error(res, '获取管理员信息失败', 500);
        }
    }

    // 修改密码
    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const adminId = req.admin.id;

            // 验证旧密码
            const [admins] = await pool.query(
                'SELECT password FROM admins WHERE id = ?',
                [adminId]
            );

            if (!bcrypt.compareSync(oldPassword, admins[0].password)) {
                return ResponseUtil.error(res, '原密码错误', 400);
            }

            // 加密新密码
            const hashedPassword = bcrypt.hashSync(newPassword, 10);

            // 更新密码
            await pool.query(
                'UPDATE admins SET password = ? WHERE id = ?',
                [hashedPassword, adminId]
            );

            return ResponseUtil.success(res, null, '密码修改成功');
        } catch (error) {
            console.error('Change password error:', error);
            return ResponseUtil.error(res, '密码修改失败', 500);
        }
    }
}

module.exports = new AdminAuthController(); 