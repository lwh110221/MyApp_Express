const pool = require('../config/database');
const logger = require('./logger');
const ErrorHandler = require('./errorHandler');

/**
 * 数据库操作工具类
 */
class DbUtil {
  /**
   * 执行单个查询
   * @param {string} sql - SQL语句
   * @param {Array} params - 查询参数
   * @returns {Promise} 查询结果
   */
  static async query(sql, params = []) {
    try {
      const startTime = Date.now();
      const [result] = await pool.query(sql, params);
      const duration = Date.now() - startTime;

      // 记录数据库操作日志
      logger.logDatabase('query', sql, params, {
        rowCount: Array.isArray(result) ? result.length : result.affectedRows,
        duration
      });

      return result;
    } catch (error) {
      ErrorHandler.handleDbError(error);
    }
  }

  /**
   * 执行事务
   * @param {Function} callback - 事务回调函数，接收connection参数
   * @returns {Promise} 事务执行结果
   */
  static async transaction(callback) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const startTime = Date.now();
      const result = await callback(connection);
      const duration = Date.now() - startTime;

      await connection.commit();

      // 记录事务执行日志
      logger.logDatabase('transaction', 'Transaction executed successfully', null, {
        duration
      });

      return result;
    } catch (error) {
      await connection.rollback();
      ErrorHandler.handleDbError(error);
    } finally {
      connection.release();
    }
  }

  /**
   * 分页查询
   * @param {string} sql - 基础SQL语句
   * @param {Object} options - 分页选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页条数
   * @param {Array} params - 查询参数
   * @returns {Promise<Object>} 分页结果
   */
  static async paginate(sql, { page = 1, limit = 10 }, params = []) {
    const offset = (page - 1) * limit;
    
    // 构建计数SQL
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM')
                        .replace(/ORDER BY .*/i, '')
                        .replace(/LIMIT .*/i, '');
    
    try {
      // 并行执行总数查询和数据查询
      const [total, data] = await Promise.all([
        this.query(countSql, params).then(result => result[0].total),
        this.query(`${sql} LIMIT ? OFFSET ?`, [...params, limit, offset])
      ]);

      return {
        list: data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      ErrorHandler.handleDbError(error);
    }
  }

  /**
   * 批量插入数据
   * @param {string} table - 表名
   * @param {Array} records - 记录数组
   * @param {Array} fields - 字段名数组
   * @returns {Promise} 插入结果
   */
  static async batchInsert(table, records, fields) {
    if (!records.length) return { affectedRows: 0 };

    const placeholders = records.map(() => 
      `(${fields.map(() => '?').join(',')})`
    ).join(',');

    const sql = `INSERT INTO ${table} (${fields.join(',')}) VALUES ${placeholders}`;
    const params = records.flatMap(record => fields.map(field => record[field]));

    return this.query(sql, params);
  }

  /**
   * 批量更新数据
   * @param {string} table - 表名
   * @param {string} primaryKey - 主键字段名
   * @param {Array} records - 记录数组
   * @param {Array} fields - 要更新的字段名数组
   * @returns {Promise} 更新结果
   */
  static async batchUpdate(table, primaryKey, records, fields) {
    if (!records.length) return { affectedRows: 0 };

    const sql = `UPDATE ${table} SET ${
      fields.map(field => `${field} = CASE ${primaryKey} ${
        records.map(record => 
          `WHEN ? THEN ?`
        ).join(' ')
      } END`).join(', ')
    } WHERE ${primaryKey} IN (${records.map(() => '?').join(',')})`;

    const params = fields.flatMap(field => 
      records.flatMap(record => [record[primaryKey], record[field]])
    ).concat(records.map(record => record[primaryKey]));

    return this.query(sql, params);
  }

  /**
   * 执行软删除
   * @param {string} table - 表名
   * @param {string|number} id - 记录ID
   * @param {Object} options - 选项
   * @returns {Promise} 删除结果
   */
  static async softDelete(table, id, options = {}) {
    const { 
      idField = 'id',
      statusField = 'status',
      deletedValue = 0,
      updatedAtField = 'updated_at',
      updatedByField = 'updated_by',
      userId = null
    } = options;

    const updateFields = {
      [statusField]: deletedValue
    };

    if (updatedAtField) {
      updateFields[updatedAtField] = new Date();
    }

    if (updatedByField && userId) {
      updateFields[updatedByField] = userId;
    }

    const sql = `UPDATE ${table} SET ? WHERE ${idField} = ?`;
    return this.query(sql, [updateFields, id]);
  }

  /**
   * 检查记录是否存在
   * @param {string} table - 表名
   * @param {Object} conditions - 查询条件
   * @returns {Promise<boolean>} 是否存在
   */
  static async exists(table, conditions) {
    const entries = Object.entries(conditions);
    const where = entries.map(([key]) => `${key} = ?`).join(' AND ');
    const params = entries.map(([_, value]) => value);

    const sql = `SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`;
    const result = await this.query(sql, params);
    return result.length > 0;
  }

  /**
   * 获取单条记录
   * @param {string} table - 表名
   * @param {Object} conditions - 查询条件
   * @returns {Promise<Object>} 记录对象
   */
  static async findOne(table, conditions) {
    const entries = Object.entries(conditions);
    const where = entries.map(([key]) => `${key} = ?`).join(' AND ');
    const params = entries.map(([_, value]) => value);

    const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
    const result = await this.query(sql, params);
    return result[0] || null;
  }
}

module.exports = DbUtil; 