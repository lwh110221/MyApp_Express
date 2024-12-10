const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// 发布动态
exports.createMoment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { content } = req.body;
    const userId = req.userData.userId;
    
    await connection.beginTransaction();

    // 插入动态内容
    const [result] = await connection.execute(
      'INSERT INTO user_moments (user_id, content) VALUES (?, ?)',
      [userId, content]
    );
    
    const momentId = result.insertId;

    // 如果有图片，保存图片信息
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => {
        const imageUrl = `/uploads/moments/${file.filename}`;
        return [momentId, imageUrl];
      });

      await connection.query(
        'INSERT INTO moment_images (moment_id, image_url) VALUES ?',
        [imageValues]
      );
    }

    await connection.commit();
    
    // 获取刚创建的动态详细信息
    const [momentDetails] = await db.execute(
      `SELECT 
        m.id, m.content, m.created_at,
        u.username, u.id as user_id,
        up.profile_picture
      FROM user_moments m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE m.id = ?`,
      [momentId]
    );

    // 获取动态图片
    const [images] = await db.execute(
      'SELECT image_url FROM moment_images WHERE moment_id = ?',
      [momentId]
    );

    const moment = momentDetails[0];
    moment.images = images.map(img => img.image_url);

    // 确保返回成功状态和完整的动态数据
    return res.status(201).json({
      success: true,
      message: '动态发布成功',
      moment: moment
    });

  } catch (error) {
    await connection.rollback();
    
    if (req.files) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../public/uploads/moments', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    console.error('发布动态失败:', error);
    return res.status(500).json({
      success: false,
      message: '发布动态失败，请重试'
    });
  } finally {
    connection.release();
  }
};

// 获取用户动态列表
exports.getMoments = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || req.userData.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 获取动态列表及其图片
    const [moments] = await db.execute(
      `SELECT 
        m.id, m.content, m.created_at,
        u.username, u.id as user_id,
        up.profile_picture
      FROM user_moments m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, limit.toString(), offset.toString()]
    );

    // 获取每条动态的图片
    for (let moment of moments) {
      const [images] = await db.execute(
        'SELECT image_url FROM moment_images WHERE moment_id = ?',
        [moment.id]
      );
      moment.images = images.map(img => img.image_url);
    }

    res.json(moments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除动态
exports.deleteMoment = async (req, res) => {
  try {
    const { momentId } = req.params;
    const userId = req.userData.userId;

    // 检查是否是动态的所有者
    const [moment] = await db.execute(
      'SELECT * FROM user_moments WHERE id = ? AND user_id = ?',
      [momentId, userId]
    );

    if (moment.length === 0) {
      return res.status(403).json({ message: '无权删除此动态' });
    }

    // 获取动态相关的图片
    const [images] = await db.execute(
      'SELECT image_url FROM moment_images WHERE moment_id = ?',
      [momentId]
    );

    // 删除动态(级联删除会自动删除相关图片记录)
    await db.execute(
      'DELETE FROM user_moments WHERE id = ?',
      [momentId]
    );

    // 删除图片文件
    images.forEach(image => {
      const filePath = path.join(__dirname, '../public', image.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    res.json({ message: '动态已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 