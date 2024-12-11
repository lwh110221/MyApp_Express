const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const svgCaptcha = require('svg-captcha');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户名和邮箱是否已存在
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // 创建用户资料
    await db.execute(
      'INSERT INTO user_profiles (user_id) VALUES (?)',
      [result.insertId]
    );

    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 获取用户信息
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.email, u.points, u.created_at,
              up.bio, up.profile_picture
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ?`,
      [req.userData.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const user = users[0];
    delete user.password;

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;

    // 先检查是否已存在记录
    const [existingProfile] = await db.execute(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [req.userData.userId]
    );

    if (existingProfile.length === 0) {
      // 如果不存在则插入新记录
      await db.execute(
        'INSERT INTO user_profiles (user_id, bio) VALUES (?, ?)',
        [req.userData.userId, bio]
      );
    } else {
      // 如果存在则更新
      await db.execute(
        'UPDATE user_profiles SET bio = ? WHERE user_id = ?',
        [bio, req.userData.userId]
      );
    }

    res.json({ message: '个人资料更新成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 获取旧头像路径
    const [oldAvatar] = await db.execute(
      'SELECT profile_picture FROM user_profiles WHERE user_id = ?',
      [req.userData.userId]
    );

    // 检查是否已存在记录
    const [existingProfile] = await db.execute(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [req.userData.userId]
    );

    if (existingProfile.length === 0) {
      // 如果不存在则插入新记录
      await db.execute(
        'INSERT INTO user_profiles (user_id, profile_picture) VALUES (?, ?)',
        [req.userData.userId, avatarUrl]
      );
    } else {
      // 如果存在则更新
      await db.execute(
        'UPDATE user_profiles SET profile_picture = ? WHERE user_id = ?',
        [avatarUrl, req.userData.userId]
      );

      // 删除旧头像文件
      if (oldAvatar.length > 0 && oldAvatar[0].profile_picture) {
        const oldAvatarPath = path.join(
          __dirname, 
          '../public', 
          oldAvatar[0].profile_picture
        );
        
        // 检查文件是否存在并且不是默认头像
        if (
          fs.existsSync(oldAvatarPath) && 
          !oldAvatar[0].profile_picture.includes('default-avatar')
        ) {
          fs.unlink(oldAvatarPath, (err) => {
            if (err) {
              console.error('删除旧头像文件失败:', err);
            }
          });
        }
      }
    }

    res.json({ 
      message: '头像更新成功',
      avatarUrl: avatarUrl
    });
  } catch (error) {
    // 如果更新失败，删除新上传的文件
    if (req.file) {
      const newAvatarPath = path.join(
        __dirname, 
        '../public/uploads/avatars', 
        req.file.filename
      );
      if (fs.existsSync(newAvatarPath)) {
        fs.unlink(newAvatarPath, (err) => {
          if (err) {
            console.error('删除新上传的头像文件失败:', err);
          }
        });
      }
    }

    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userData.userId;

    // 获取用户当前密码
    const [users] = await db.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ message: '原密码错误' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 新增：获取用户积分
exports.getPoints = async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT points FROM users WHERE id = ?',
      [req.userData.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ points: users[0].points });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 生成验证码
exports.generateCaptcha = (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4, // 验证码长度
    noise: 2, // 干扰线条数
    color: true, // 验证码字符颜色
    background: '#f0f0f0' // 背景色
  });
  
  // 将验证码存入 session
  req.session.captcha = captcha.text.toLowerCase();
  
  res.type('svg');
  res.status(200).send(captcha.data);
}; 