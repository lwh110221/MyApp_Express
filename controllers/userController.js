const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const svgCaptcha = require('svg-captcha');
const logger = require('../utils/logger');
const { BusinessError } = require('../utils/errors');
const createFileCleanupMiddleware = require('../middleware/fileCleanup');
const PointService = require('../services/pointService');
const FollowService = require('../services/followService');
const tokenService = require('../utils/tokenService');
const emailService = require('../utils/emailService');
const { validationResult } = require('express-validator');
const verificationCodeService = require('../utils/verificationCodeService');

const fileCleanup = createFileCleanupMiddleware();

exports.register = async (req, res) => {
  try {
    console.log('开始注册流程，接收的数据:', req.body);
    // 允许使用verificationCode或captcha作为验证码
    const { username, email, password, verificationCode, captcha, phone } = req.body;
    const code = verificationCode || captcha;

    // 验证邮箱验证码
    if (!code) {
      console.log('缺少验证码');
      return res.status(400).json({ message: '验证码不能为空' });
    }
    
    console.log(`验证码检查: ${email} - ${code}`);
    const isCodeValid = await verificationCodeService.verifyEmailCode(email, code);
    console.log(`验证码是否有效: ${isCodeValid}`);
    if (!isCodeValid) {
      return res.status(400).json({ message: '验证码无效或已过期' });
    }

    // 检查用户名和邮箱是否已存在
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // 创建用户，邮箱已验证 - 移除phone字段
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password, status, email_verified) VALUES (?, ?, ?, 1, 1)',
        [username, email, hashedPassword]
      );
      console.log(`用户创建成功，ID: ${result.insertId}`);

      // 创建用户资料
      await pool.query(
        'INSERT INTO user_profiles (user_id) VALUES (?)',
        [result.insertId]
      );
      console.log(`用户资料创建成功`);

      // 删除已使用的验证码
      await verificationCodeService.deleteEmailCode(email);
      console.log(`验证码已删除`);

    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      return res.status(500).json({ message: '创建用户失败，请稍后重试' });
    }

    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    console.error('注册过程中出现错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 获取用户信息
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND status = 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误' 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.points, u.status, u.created_at,
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
    const [existingProfile] = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [req.userData.userId]
    );

    if (existingProfile.length === 0) {
      // 如果不存在则插入新记录
      await pool.query(
        'INSERT INTO user_profiles (user_id, bio) VALUES (?, ?)',
        [req.userData.userId, bio]
      );
    } else {
      // 如果存在则更新
      await pool.query(
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
    const [oldAvatar] = await pool.query(
      'SELECT profile_picture FROM user_profiles WHERE user_id = ?',
      [req.userData.userId]
    );

    // 检查是否已存在记录
    const [existingProfile] = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [req.userData.userId]
    );

    if (existingProfile.length === 0) {
      // 如果不存在则插入新记录
      await pool.query(
        'INSERT INTO user_profiles (user_id, profile_picture) VALUES (?, ?)',
        [req.userData.userId, avatarUrl]
      );
    } else {
      // 如果存在则更新
      await pool.query(
        'UPDATE user_profiles SET profile_picture = ? WHERE user_id = ?',
        [avatarUrl, req.userData.userId]
      );

      // 使用文件清理中间件删除旧头像
      if (oldAvatar.length > 0 && oldAvatar[0].profile_picture) {
        const oldAvatarPath = oldAvatar[0].profile_picture;
        if (!oldAvatarPath.includes('default-avatar')) {
          await fileCleanup.cleanupSingleFile(oldAvatarPath);
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
      await fileCleanup.cleanupSingleFile(`/uploads/avatars/${req.file.filename}`);
    }

    logger.error('更新头像失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userData.userId;

    // 获取用户当前密码
    const [users] = await pool.query(
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
    await pool.query(
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
    const [users] = await pool.query(
      'SELECT points FROM users WHERE id = ?',
      [req.userData.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      points: users[0].points
    });
  } catch (error) {
    logger.error('获取用户积分失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 新增：获取用户积分记录
exports.getPointRecords = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const { page = 1, limit = 10 } = req.query;
    
    const records = await PointService.getUserPointRecords(userId, page, limit);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: records
    });
  } catch (error) {
    logger.error('获取用户积分记录失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器错误' 
    });
  }
};

// 新增：获取用户资料（包括关注统计）
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userData ? req.userData.userId : null;
    
    // 获取用户基本信息
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.created_at, u.points,
              up.bio, up.profile_picture
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ? AND u.status = 1`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        code: 404,
        message: '用户不存在' 
      });
    }

    const user = users[0];
    
    // 获取关注统计
    const followStats = await FollowService.getUserFollowStats(userId);
    
    // 获取用户发帖数
    const [postStats] = await pool.query(
      'SELECT COUNT(*) as count FROM community_posts WHERE user_id = ? AND status = 1',
      [userId]
    );
    
    // 检查当前用户是否已关注该用户
    let isFollowed = false;
    if (currentUserId && currentUserId != userId) {
      isFollowed = await FollowService.checkIsFollowed(currentUserId, userId);
    }
    
    // 获取用户身份，包含详细信息
    const [identities] = await pool.query(
      `SELECT * FROM user_identities 
       WHERE user_id = ? AND status = 1 
       AND (expiration_time IS NULL OR expiration_time > NOW())`,
      [userId]
    );
    
    // 加载身份类型信息
    const { getIdentityTypeInfo } = require('../config/identityTypes');
    const identitiesWithInfo = identities.map(identity => ({
      ...identity,
      typeInfo: getIdentityTypeInfo(identity.identity_type)
    }));
    
    res.json({
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        profile_picture: user.profile_picture || '/uploads/avatars/default-avatar.jpg',
        bio: user.bio || '',
        created_at: user.created_at,
        post_count: postStats[0].count,
        follower_count: followStats.follower_count,
        following_count: followStats.following_count,
        followers_count: followStats.follower_count,
        followings_count: followStats.following_count,
        is_followed: isFollowed,
        identities: identitiesWithInfo,
        points: user.points
      }
    });
  } catch (error) {
    logger.error('获取用户资料失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器错误' 
    });
  }
};

// 新增：关注用户
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.userData.userId;
    
    const result = await FollowService.followUser(followerId, userId);
    
    // 如果已经关注过，返回特殊状态码但仍然是成功
    if (result.already_followed) {
      return res.json({
        code: 200,
        already_followed: true,
        message: result.message || '已经关注过该用户'
      });
    }
    
    res.json({
      code: 200,
      message: '关注成功'
    });
  } catch (error) {
    if (error instanceof BusinessError) {
      return res.status(400).json({ 
        code: 400,
        message: error.message 
      });
    }
    
    logger.error('关注用户失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器错误' 
    });
  }
};

// 新增：取消关注用户
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.userData.userId;
    
    const result = await FollowService.unfollowUser(followerId, userId);
    
    res.json({
      code: 200,
      message: '取消关注成功'
    });
  } catch (error) {
    if (error instanceof BusinessError) {
      return res.status(400).json({ 
        code: 400,
        message: error.message 
      });
    }
    
    logger.error('取消关注用户失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器错误' 
    });
  }
};

// 新增：获取用户关注列表
exports.getFollowingList = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.userData ? req.userData.userId : null;
    
    // 检查用户是否存在
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND status = 1',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        code: 404,
        message: '用户不存在' 
      });
    }
    
    const followList = await FollowService.getFollowingList(userId, currentUserId, page, limit);
    
    res.json({
      code: 200,
      data: followList
    });
  } catch (error) {
    logger.error('获取用户关注列表失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器错误' 
    });
  }
};

// 新增：获取用户粉丝列表
exports.getFollowersList = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.userData ? req.userData.userId : null;
    
    // 检查用户是否存在
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND status = 1',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        code: 404,
        message: '用户不存在' 
      });
    }
    
    const followerList = await FollowService.getFollowersList(userId, currentUserId, page, limit);
    
    res.json({
      code: 200,
      data: followerList
    });
  } catch (error) {
    logger.error('获取用户粉丝列表失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器错误' 
    });
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

/**
 * 验证邮箱
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // 验证令牌
    const userId = await tokenService.verifyEmailToken(token);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: '验证链接无效或已过期' 
      });
    }
    
    // 更新用户的邮箱验证状态
    await pool.query(
      'UPDATE users SET email_verified = 1 WHERE id = ?',
      [userId]
    );
    
    // 删除已使用的令牌
    await tokenService.deleteEmailToken(token);
    
    return res.status(200).json({ 
      success: true, 
      message: '邮箱验证成功' 
    });
  } catch (error) {
    console.error('邮箱验证错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

/**
 * 重新发送验证邮件
 */
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 检查邮箱是否存在
    const [users] = await pool.query(
      'SELECT id, username, email_verified FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      // 为了安全，即使邮箱不存在也返回成功
      return res.status(200).json({ 
        success: true, 
        message: '如果邮箱存在，验证邮件已发送' 
      });
    }
    
    const user = users[0];
    
    // 如果邮箱已验证，则不需要再发送
    if (user.email_verified === 1) {
      return res.status(400).json({ 
        success: false, 
        message: '该邮箱已验证' 
      });
    }
    
    // 生成新的验证令牌
    const verificationToken = await tokenService.generateEmailVerificationToken(user.id);
    
    // 构建验证链接
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    // 发送验证邮件
    await emailService.sendVerificationEmail(email, user.username, verificationLink);
    
    return res.status(200).json({ 
      success: true, 
      message: '验证邮件已重新发送' 
    });
  } catch (error) {
    console.error('重新发送验证邮件错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

/**
 * 忘记密码，发送重置邮件
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 验证邮箱格式
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供有效的邮箱地址' 
      });
    }
    
    // 检查用户是否存在
    const [users] = await pool.query(
      'SELECT id, username FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      // 为安全起见，即使用户不存在也返回成功
      return res.status(200).json({ 
        success: true, 
        message: '如果邮箱地址与账户关联，您将收到重置密码的邮件' 
      });
    }
    
    const { id: userId, username } = users[0];
    
    // 生成密码重置令牌
    const resetToken = await tokenService.generatePasswordResetToken(userId);
    
    // 构建重置链接
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    // 发送重置密码邮件
    await emailService.sendPasswordResetEmail(email, username, resetLink);
    
    return res.status(200).json({ 
      success: true, 
      message: '重置密码邮件已发送' 
    });
  } catch (error) {
    console.error('忘记密码错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

/**
 * 验证重置密码令牌
 */
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // 验证令牌
    const userId = await tokenService.verifyPasswordResetToken(token);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: '重置链接无效或已过期' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: '令牌有效',
      userId
    });
  } catch (error) {
    console.error('验证重置令牌错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

/**
 * 重置密码
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // 验证令牌
    const userId = await tokenService.verifyPasswordResetToken(token);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: '重置链接无效或已过期' 
      });
    }
    
    // 验证密码长度
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: '密码必须至少6个字符' 
      });
    }
    
    // 加密新密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 更新用户密码
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    // 删除已使用的令牌
    await tokenService.deletePasswordResetToken(token);
    
    return res.status(200).json({ 
      success: true, 
      message: '密码已成功重置' 
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

/**
 * 发送邮箱验证码
 */
exports.sendEmailVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 验证邮箱格式
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供有效的邮箱地址' 
      });
    }
    
    // 检查邮箱是否已存在
    const [existingEmails] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '邮箱已被注册' 
      });
    }
    
    // 生成验证码
    const verificationCode = verificationCodeService.generateCode();
    console.log(`生成的验证码: ${email} - ${verificationCode}`);
    
    try {
      // 存储验证码
      await verificationCodeService.createEmailVerificationCode(email, verificationCode);
      console.log(`已存储验证码到数据库: ${email}`);
    } catch (dbError) {
      console.error('存储验证码到数据库失败:', dbError);
      return res.status(500).json({ 
        success: false, 
        message: '验证码存储失败，请稍后重试' 
      });
    }
    
    try {
      // 发送包含验证码的邮件
      const emailResult = await emailService.sendVerificationCodeEmail(email, '用户', verificationCode);
      console.log('邮件发送结果:', emailResult);
      if (!emailResult.success) {
        return res.status(500).json({ 
          success: false, 
          message: '邮件发送失败，请检查邮箱地址或稍后重试' 
        });
      }
    } catch (emailError) {
      console.error('发送验证码邮件失败:', emailError);
      return res.status(500).json({ 
        success: false, 
        message: '邮件发送失败，请稍后重试' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: '验证码已发送至您的邮箱' 
    });
  } catch (error) {
    console.error('发送邮箱验证码失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

/**
 * 发送密码重置验证码
 */
exports.sendPasswordResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 验证邮箱格式
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供有效的邮箱地址' 
      });
    }
    
    // 检查用户是否存在
    const [users] = await pool.query(
      'SELECT id, username FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      // 为安全起见，即使用户不存在也返回成功
      return res.status(200).json({ 
        success: true, 
        message: '如果邮箱地址与账户关联，您将收到验证码' 
      });
    }
    
    const { username } = users[0];
    
    // 生成验证码
    const verificationCode = verificationCodeService.generateCode();
    
    // 存储验证码
    await verificationCodeService.createEmailVerificationCode(email, verificationCode);
    
    // 发送包含验证码的邮件
    await emailService.sendVerificationCodeEmail(email, username, verificationCode);
    
    return res.status(200).json({ 
      success: true, 
      message: '验证码已发送至您的邮箱' 
    });
  } catch (error) {
    console.error('发送密码重置验证码失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

/**
 * 重置密码（使用验证码）
 */
exports.resetPasswordWithCode = async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body;
    
    // 验证参数
    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '邮箱、验证码和新密码都不能为空' 
      });
    }
    
    // 验证密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: '新密码至少需要6个字符' 
      });
    }
    
    // 验证邮箱验证码
    const isCodeValid = await verificationCodeService.verifyEmailCode(email, verificationCode);
    if (!isCodeValid) {
      return res.status(400).json({ 
        success: false, 
        message: '验证码无效或已过期' 
      });
    }
    
    // 检查用户是否存在
    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '该邮箱未注册' 
      });
    }
    
    const userId = users[0].id;
    
    // 加密新密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // 更新用户密码
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    // 删除已使用的验证码
    await verificationCodeService.deleteEmailCode(email);
    
    return res.status(200).json({ 
      success: true, 
      message: '密码已成功重置' 
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

/**
 * 临时函数 - 查看验证码（仅用于调试）
 */
exports.debug_checkCode = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: '请提供邮箱地址' });
    }
    
    const [codes] = await pool.query(
      'SELECT * FROM email_verification_codes WHERE email = ?',
      [email]
    );
    
    if (codes.length === 0) {
      return res.status(404).json({ message: '未找到该邮箱的验证码' });
    }
    
    return res.status(200).json({
      success: true,
      data: codes[0]
    });
  } catch (error) {
    console.error('查询验证码错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 