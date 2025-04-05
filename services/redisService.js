const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = redis.createClient({
      url: redisUrl
    });

    this.client.on('error', (err) => {
      console.error('Redis 错误:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis 连接成功');
    });

    // 启动连接
    this.connect();
  }

  async connect() {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
    } catch (err) {
      console.error('Redis 连接失败:', err);
    }
  }

  async get(key) {
    try {
      await this.connect();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error('Redis GET 错误:', err);
      return null;
    }
  }

  async set(key, value, expireSeconds = 3600) {
    try {
      await this.connect();
      await this.client.set(key, JSON.stringify(value));
      
      // 设置过期时间
      if (expireSeconds > 0) {
        await this.client.expire(key, expireSeconds);
      }
      
      return true;
    } catch (err) {
      console.error('Redis SET 错误:', err);
      return false;
    }
  }

  async delete(key) {
    try {
      await this.connect();
      await this.client.del(key);
      return true;
    } catch (err) {
      console.error('Redis DELETE 错误:', err);
      return false;
    }
  }

  /**
   * 使用SCAN命令扫描匹配指定模式的键
   * @param {string} pattern - 匹配模式，如 "user:*"
   * @param {number} count - 每次扫描返回的键数量
   * @returns {Array} - 匹配的键数组
   */
  async scan(pattern, count = 100) {
    try {
      await this.connect();
      
      let cursor = 0;
      let keys = [];
      
      do {
        // 使用Redis的SCAN命令进行游标迭代
        const reply = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: count
        });
        
        cursor = parseInt(reply.cursor);
        keys = keys.concat(reply.keys);
        
      } while (cursor !== 0); // 当游标返回0时表示迭代完成
      
      return keys;
    } catch (err) {
      console.error('Redis SCAN 错误:', err);
      return [];
    }
  }
}

module.exports = new RedisService(); 