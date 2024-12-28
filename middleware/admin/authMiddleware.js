const jwt = require('jsonwebtoken');
const pool = require('../../config/database');
const { errorResponse } = require('../../utils/responseUtil');

// 验证管理员token
const verifyAdminToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, '未提供token', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

        // 查询管理员信息
        const [admins] = await pool.query(
            'SELECT id, username, email, status FROM admins WHERE id = ?',
            [decoded.id]
        );

        if (admins.length === 0) {
            return errorResponse(res, '管理员不存在', 401);
        }

        const admin = admins[0];
        if (!admin.status) {
            return errorResponse(res, '管理员账号已被禁用', 403);
        }

        // 获取管理员角色和权限
        const [roles] = await pool.query(`
            SELECT r.name, r.code
            FROM roles r
            JOIN admin_roles ar ON r.id = ar.role_id
            WHERE ar.admin_id = ?
        `, [admin.id]);

        const [permissions] = await pool.query(`
            SELECT p.name, p.code
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN admin_roles ar ON rp.role_id = ar.role_id
            WHERE ar.admin_id = ?
        `, [admin.id]);

        // 将管理员信息和权限添加到请求对象
        req.admin = {
            ...admin,
            roles: roles.map(r => r.code),
            permissions: permissions.map(p => p.code)
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, '无效的token', 401);
        }
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 'token已过期', 401);
        }
        console.error('Token验证失败:', error);
        return errorResponse(res, '权限验证失败', 500);
    }
};

// 检查权限的中间件
const checkPermission = (permissionCode) => {
    return (req, res, next) => {
        if (!req.admin || !req.admin.permissions) {
            return errorResponse(res, '未授权访问', 401);
        }

        if (!req.admin.permissions.includes(permissionCode)) {
            return errorResponse(res, '没有操作权限', 403);
        }

        next();
    };
};

// 记录管理员操作日志
const logAdminOperation = async (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        res.send = originalSend;
        
        // 异步记录操作日志
        const logData = {
            admin_id: req.admin.id,
            operation_type: req.method + ' ' + req.path,
            operation_desc: `${req.admin.username} 执行了 ${req.method} ${req.path} 操作`,
            ip_address: req.ip,
            request_data: JSON.stringify(req.method === 'GET' ? req.query : req.body),
            response_data: data,
            status_code: res.statusCode
        };

        pool.query(
            'INSERT INTO admin_operation_logs SET ?',
            logData
        ).catch(error => {
            console.error('记录操作日志失败:', error);
        });

        return originalSend.call(this, data);
    };
    
    next();
};

module.exports = {
    verifyAdminToken,
    checkPermission,
    logAdminOperation
}; 