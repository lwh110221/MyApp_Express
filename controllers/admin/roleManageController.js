const pool = require('../../config/database');
const ResponseUtil = require('../../utils/responseUtil');

class RoleManageController {
  /**
   * 获取角色列表
   */
  async getRoleList(req, res) {
    try {
      const [roles] = await pool.query(`
        SELECT r.*, 
               COUNT(DISTINCT ar.admin_id) as admin_count,
               COUNT(DISTINCT rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN admin_roles ar ON r.id = ar.role_id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        GROUP BY r.id
        ORDER BY r.id ASC
      `);

      return ResponseUtil.success(res, roles);
    } catch (error) {
      console.error('获取角色列表错误:', error);
      return ResponseUtil.error(res, '获取角色列表失败', 500);
    }
  }

  /**
   * 获取角色详情
   */
  async getRoleDetail(req, res) {
    try {
      const { roleId } = req.params;

      // 获取角色基本信息
      const [[role]] = await pool.query(
        'SELECT * FROM roles WHERE id = ?',
        [roleId]
      );

      if (!role) {
        return ResponseUtil.error(res, '角色不存在', 404);
      }

      // 获取角色包含的权限
      const [permissions] = await pool.query(`
        SELECT p.* 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [roleId]);

      // 获取使用该角色的管理员数量
      const [[{ admin_count }]] = await pool.query(
        'SELECT COUNT(DISTINCT admin_id) as admin_count FROM admin_roles WHERE role_id = ?',
        [roleId]
      );

      return ResponseUtil.success(res, {
        ...role,
        permissions,
        admin_count
      });
    } catch (error) {
      console.error('获取角色详情错误:', error);
      return ResponseUtil.error(res, '获取角色详情失败', 500);
    }
  }

  /**
   * 创建角色
   */
  async createRole(req, res) {
    try {
      const { name, code, description, permissionIds = [] } = req.body;

      // 检查角色编码是否已存在
      const [[existingRole]] = await pool.query(
        'SELECT id FROM roles WHERE code = ?',
        [code]
      );

      if (existingRole) {
        return ResponseUtil.error(res, '角色编码已存在', 400);
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 创建角色
        const [roleResult] = await connection.query(
          'INSERT INTO roles (name, code, description) VALUES (?, ?, ?)',
          [name, code, description]
        );

        const roleId = roleResult.insertId;

        // 如果有权限，添加角色权限关联
        if (permissionIds.length > 0) {
          const values = permissionIds.map(permissionId => [roleId, permissionId]);
          await connection.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
            [values]
          );
        }

        await connection.commit();
        return ResponseUtil.success(res, { id: roleId }, '角色创建成功', 201);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('创建角色错误:', error);
      return ResponseUtil.error(res, '创建角色失败', 500);
    }
  }

  /**
   * 更新角色基本信息
   */
  async updateRole(req, res) {
    try {
      const { roleId } = req.params;
      const { name, description, status } = req.body;

      // 检查角色是否存在
      const [[role]] = await pool.query(
        'SELECT * FROM roles WHERE id = ?',
        [roleId]
      );

      if (!role) {
        return ResponseUtil.error(res, '角色不存在', 404);
      }

      // 超级管理员角色不允许修改
      if (role.code === 'super_admin') {
        return ResponseUtil.error(res, '不允许修改超级管理员角色', 403);
      }

      // 更新角色信息
      await pool.query(
        'UPDATE roles SET name = ?, description = ?, status = ? WHERE id = ?',
        [name, description, status, roleId]
      );

      return ResponseUtil.success(res, null, '角色更新成功');
    } catch (error) {
      console.error('更新角色错误:', error);
      return ResponseUtil.error(res, '更新角色失败', 500);
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(req, res) {
    try {
      const { roleId } = req.params;

      // 检查角色是否存在
      const [[role]] = await pool.query(
        'SELECT * FROM roles WHERE id = ?',
        [roleId]
      );

      if (!role) {
        return ResponseUtil.error(res, '角色不存在', 404);
      }

      // 超级管理员和管理员角色不允许删除
      if (['super_admin', 'admin'].includes(role.code)) {
        return ResponseUtil.error(res, '不允许删除系统预设角色', 403);
      }

      // 检查是否有管理员在使用该角色
      const [[{ count }]] = await pool.query(
        'SELECT COUNT(*) as count FROM admin_roles WHERE role_id = ?',
        [roleId]
      );

      if (count > 0) {
        return ResponseUtil.error(res, '该角色正在被管理员使用，无法删除', 400);
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 先删除角色权限关联
        await connection.query(
          'DELETE FROM role_permissions WHERE role_id = ?',
          [roleId]
        );

        // 再删除角色
        await connection.query(
          'DELETE FROM roles WHERE id = ?',
          [roleId]
        );

        await connection.commit();
        return ResponseUtil.success(res, null, '角色删除成功');
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('删除角色错误:', error);
      return ResponseUtil.error(res, '删除角色失败', 500);
    }
  }

  /**
   * 更新角色权限
   */
  async updateRolePermissions(req, res) {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;

      // 检查角色是否存在
      const [[role]] = await pool.query(
        'SELECT * FROM roles WHERE id = ?',
        [roleId]
      );

      if (!role) {
        return ResponseUtil.error(res, '角色不存在', 404);
      }

      // 超级管理员角色不允许修改权限
      if (role.code === 'super_admin') {
        return ResponseUtil.error(res, '不允许修改超级管理员角色的权限', 403);
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 删除所有现有权限
        await connection.query(
          'DELETE FROM role_permissions WHERE role_id = ?',
          [roleId]
        );

        // 添加新的权限
        if (permissionIds && permissionIds.length > 0) {
          const values = permissionIds.map(permissionId => [roleId, permissionId]);
          await connection.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
            [values]
          );
        }

        await connection.commit();
        return ResponseUtil.success(res, null, '角色权限更新成功');
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('更新角色权限错误:', error);
      return ResponseUtil.error(res, '更新角色权限失败', 500);
    }
  }

  /**
   * 获取所有权限列表(用于角色分配权限)
   */
  async getAllPermissions(req, res) {
    try {
      // 获取所有权限，按照功能模块分组
      const [permissions] = await pool.query(`
        SELECT * FROM permissions 
        WHERE status = 1
        ORDER BY code ASC
      `);

      // 组织权限分组
      const permissionGroups = {};
      
      // 定义获取分组名称的函数
      const getGroupName = (code) => {
        const groupNames = {
          'admin': '管理员管理',
          'user': '用户管理',
          'moment': '动态管理',
          'news': '新闻管理',
          'log': '日志管理',
          'identity': '身份认证管理',
          'community': '社区管理',
          'help': '求助服务管理'
        };
        
        return groupNames[code] || '其他功能';
      };
      
      permissions.forEach(permission => {
        // 根据权限编码前缀分组，如admin:list归类到admin组
        const group = permission.code.split(':')[0];
        
        if (!permissionGroups[group]) {
          permissionGroups[group] = {
            name: getGroupName(group),
            permissions: []
          };
        }
        
        permissionGroups[group].permissions.push(permission);
      });

      return ResponseUtil.success(res, permissionGroups);
    } catch (error) {
      console.error('获取权限列表错误:', error);
      return ResponseUtil.error(res, '获取权限列表失败', 500);
    }
  }

  /**
   * 根据权限组编码获取权限组名称
   */
  _getGroupName(code) {
    const groupNames = {
      'admin': '管理员管理',
      'user': '用户管理',
      'moment': '动态管理',
      'news': '新闻管理',
      'log': '日志管理',
      'identity': '身份认证管理',
      'community': '社区管理',
      'help': '求助服务管理'
    };
    
    return groupNames[code] || '其他功能';
  }
}

module.exports = new RoleManageController(); 