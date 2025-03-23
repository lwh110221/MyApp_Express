const BaseController = require('./baseController');
const pool = require('../config/database');
const { BusinessError } = require('../utils/errors');
const logger = require('../utils/logger');
const FileCleanup = require('../utils/fileCleanup');
const path = require('path');
const PointService = require('../services/pointService');
const TagService = require('../services/tagService');

class CommunityController extends BaseController {
    // 发布帖子
    async createPost(req, res) {
        const connection = await pool.getConnection();
        try {
            const { title, content, images, tags } = req.body;
            const userId = req.userData.userId;

            await connection.beginTransaction();

            // 处理标签
            const tagIds = await TagService.getOrCreateTags(connection, tags);

            // 插入帖子
            const [result] = await connection.query(
                `INSERT INTO community_posts 
                (user_id, title, content, images, tags) 
                VALUES (?, ?, ?, ?, ?)`,
                [userId, title, content, JSON.stringify(images || []), JSON.stringify(tagIds)]
            );

            // 添加标签与帖子的关联
            if (tagIds.length > 0) {
                await TagService.updatePostTags(connection, result.insertId, tagIds);
            }

            // 添加积分记录
            await PointService.addPoints(
                connection, 
                userId, 
                PointService.POINT_TYPES.POST_CREATE, 
                result.insertId
            );

            await connection.commit();
            this.success(res, { id: result.insertId }, '发布成功');
        } catch (error) {
            await connection.rollback();
            logger.error('发布社区帖子错误:', error);
            this.error(res, '发布帖子失败');
        } finally {
            connection.release();
        }
    }

    // 获取帖子列表
    async getPostList(req, res) {
        try {
            const { page = 1, limit = 10, keyword, tag, sort = 'latest' } = req.query;
            const offset = (page - 1) * limit;

            let baseQuery = `
                SELECT 
                    p.*,
                    u.username as author_name
                FROM community_posts p
                LEFT JOIN users u ON p.user_id = u.id`;
            
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM community_posts p`;

            let whereClause = ' WHERE p.status = 1';
            const params = [];

            // 标签筛选
            if (tag) {
                baseQuery += ` 
                JOIN community_post_tags pt ON p.id = pt.post_id
                JOIN community_tags t ON pt.tag_id = t.id`;
                
                countQuery += ` 
                JOIN community_post_tags pt ON p.id = pt.post_id
                JOIN community_tags t ON pt.tag_id = t.id`;
                
                whereClause += ' AND t.name = ?';
                params.push(tag);
            }

            // 关键词搜索
            if (keyword) {
                whereClause += ' AND (p.title LIKE ? OR p.content LIKE ?)';
                params.push(`%${keyword}%`, `%${keyword}%`);
            }

            baseQuery += whereClause;
            countQuery += whereClause;

            // 获取总数
            const [countResult] = await pool.query(countQuery, params);
            const total = countResult[0].total;

            // 排序方式
            let orderClause = '';
            if (sort === 'popular') {
                orderClause = ' ORDER BY p.view_count DESC, p.like_count DESC, p.comment_count DESC, p.created_at DESC';
            } else if (sort === 'hot') {
                orderClause = ' ORDER BY p.like_count DESC, p.comment_count DESC, p.created_at DESC';
            } else {
                // 默认按最新排序
                orderClause = ' ORDER BY p.created_at DESC';
            }

            baseQuery += orderClause + ' LIMIT ? OFFSET ?';
            
            // 获取帖子列表
            const [posts] = await pool.query(
                baseQuery,
                [...params, parseInt(limit), offset]
            );

            // 获取每个帖子的标签
            const connection = await pool.getConnection();
            try {
                for (const post of posts) {
                    // 解析图片数据
                    try {
                        post.images = typeof post.images === 'string' ? 
                            JSON.parse(post.images) : 
                            (Array.isArray(post.images) ? post.images : []);
                    } catch (err) {
                        logger.error('解析帖子图片数据错误:', err);
                        post.images = [];
                    }

                    // 获取标签
                    const tags = await TagService.getPostTags(connection, post.id);
                    post.tags = tags.map(tag => tag.name);
                }
            } finally {
                connection.release();
            }

            this.success(res, {
                items: posts,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('获取社区帖子列表错误:', error);
            this.error(res, '获取帖子列表失败');
        }
    }

    // 获取帖子详情
    async getPostDetail(req, res) {
        const connection = await pool.getConnection();
        try {
            const { postId } = req.params;

            await connection.beginTransaction();

            // 更新浏览次数
            await connection.query(
                'UPDATE community_posts SET view_count = view_count + 1 WHERE id = ? AND status = 1',
                [postId]
            );

            // 获取帖子详情
            const [posts] = await connection.query(
                `SELECT 
                    p.*,
                    u.username as author_name
                FROM community_posts p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.id = ? AND p.status = 1`,
                [postId]
            );

            if (posts.length === 0) {
                await connection.rollback();
                return this.error(res, '帖子不存在或已删除', 404);
            }

            const post = posts[0];
            
            // 解析图片数据
            try {
                post.images = typeof post.images === 'string' ? 
                    JSON.parse(post.images) : 
                    (Array.isArray(post.images) ? post.images : []);
            } catch (err) {
                logger.error('解析帖子图片数据错误:', err);
                post.images = [];
            }

            // 获取标签
            const tags = await TagService.getPostTags(connection, post.id);
            post.tags = tags.map(tag => tag.name);

            await connection.commit();
            this.success(res, post);
        } catch (error) {
            await connection.rollback();
            logger.error('获取社区帖子详情错误:', error);
            this.error(res, '获取帖子详情失败');
        } finally {
            connection.release();
        }
    }

    // 更新帖子
    async updatePost(req, res) {
        const connection = await pool.getConnection();
        try {
            const { postId } = req.params;
            const { title, content, images, tags } = req.body;
            const userId = req.userData.userId;

            // 检查帖子是否存在且属于当前用户
            const [posts] = await connection.query(
                'SELECT * FROM community_posts WHERE id = ? AND user_id = ? AND status = 1',
                [postId, userId]
            );

            if (posts.length === 0) {
                return this.error(res, '帖子不存在或无权修改', 403);
            }

            await connection.beginTransaction();

            // 更新参数集合
            const updateParams = [];
            const updateFields = [];

            if (title !== undefined) {
                updateFields.push('title = ?');
                updateParams.push(title);
            }

            if (content !== undefined) {
                updateFields.push('content = ?');
                updateParams.push(content);
            }

            if (images !== undefined) {
                updateFields.push('images = ?');
                updateParams.push(JSON.stringify(images || []));
            }

            // 处理标签
            if (tags !== undefined) {
                const tagIds = await TagService.getOrCreateTags(connection, tags);
                updateFields.push('tags = ?');
                updateParams.push(JSON.stringify(tagIds));
                
                // 更新帖子-标签关联
                await TagService.updatePostTags(connection, postId, tagIds);
            }

            if (updateFields.length > 0) {
                // 执行更新
                await connection.query(
                    `UPDATE community_posts SET ${updateFields.join(', ')} WHERE id = ?`,
                    [...updateParams, postId]
                );
            }

            await connection.commit();
            this.success(res, null, '更新成功');
        } catch (error) {
            await connection.rollback();
            logger.error('更新社区帖子错误:', error);
            this.error(res, '更新帖子失败');
        } finally {
            connection.release();
        }
    }

    // 删除帖子
    async deletePost(req, res) {
        const connection = await pool.getConnection();
        try {
            const { postId } = req.params;
            const userId = req.userData.userId;

            await connection.beginTransaction();

            // 检查是否是帖子作者
            const [posts] = await connection.query(
                'SELECT user_id, images FROM community_posts WHERE id = ? AND status = 1',
                [postId]
            );

            if (posts.length === 0) {
                await connection.rollback();
                return this.error(res, '帖子不存在或已删除', 404);
            }

            if (posts[0].user_id !== userId) {
                await connection.rollback();
                return this.error(res, '无权操作此帖子', 403);
            }

            // 逻辑删除帖子
            await connection.query(
                'UPDATE community_posts SET status = 0 WHERE id = ?',
                [postId]
            );

            // 扣除积分
            await PointService.addPoints(
                connection, 
                userId, 
                PointService.POINT_TYPES.POST_DELETE, 
                postId
            );

            await connection.commit();
            this.success(res, null, '删除成功');
        } catch (error) {
            await connection.rollback();
            logger.error('删除社区帖子错误:', error);
            this.error(res, '删除帖子失败');
        } finally {
            connection.release();
        }
    }

    // 上传图片
    async uploadImages(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return this.error(res, '请选择要上传的图片', 400);
            }

            const imageUrls = req.files.map(file => ({
                url: `/uploads/community/${path.basename(file.path)}`,
                name: file.originalname
            }));

            this.success(res, imageUrls, '上传成功');
        } catch (error) {
            logger.error('上传社区图片错误:', error);
            this.error(res, '上传图片失败');
        }
    }

    // 发表评论
    async createComment(req, res) {
        const connection = await pool.getConnection();
        try {
            const { postId } = req.params;
            const { content, parent_id, images } = req.body;
            const userId = req.userData.userId;

            await connection.beginTransaction();

            // 检查帖子是否存在
            const [posts] = await connection.query(
                'SELECT id FROM community_posts WHERE id = ? AND status = 1',
                [postId]
            );

            if (posts.length === 0) {
                await connection.rollback();
                return this.error(res, '帖子不存在或已删除', 404);
            }

            // 如果是回复评论，检查父评论是否存在
            if (parent_id) {
                const [parentComments] = await connection.query(
                    'SELECT id FROM community_comments WHERE id = ? AND status = 1',
                    [parent_id]
                );

                if (parentComments.length === 0) {
                    await connection.rollback();
                    return this.error(res, '回复的评论不存在或已删除', 404);
                }
            }

            // 添加评论
            const [result] = await connection.query(
                `INSERT INTO community_comments 
                (post_id, user_id, parent_id, content, images) 
                VALUES (?, ?, ?, ?, ?)`,
                [postId, userId, parent_id || null, content, JSON.stringify(images || [])]
            );

            // 更新帖子评论数
            await connection.query(
                'UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = ?',
                [postId]
            );

            // 添加积分
            await PointService.addPoints(
                connection, 
                userId, 
                PointService.POINT_TYPES.COMMENT_CREATE, 
                result.insertId
            );

            await connection.commit();
            this.success(res, { id: result.insertId }, '评论成功');
        } catch (error) {
            await connection.rollback();
            logger.error('发表社区评论错误:', error);
            this.error(res, '发表评论失败');
        } finally {
            connection.release();
        }
    }

    // 获取评论列表
    async getCommentList(req, res) {
        try {
            const { postId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            // 检查帖子是否存在
            const [posts] = await pool.query(
                'SELECT id FROM community_posts WHERE id = ? AND status = 1',
                [postId]
            );

            if (posts.length === 0) {
                return this.error(res, '帖子不存在或已删除', 404);
            }

            // 获取总数
            const [countResult] = await pool.query(
                'SELECT COUNT(*) as total FROM community_comments WHERE post_id = ? AND status = 1',
                [postId]
            );
            const total = countResult[0].total;

            // 获取评论列表
            const [comments] = await pool.query(
                `SELECT 
                    c.*,
                    u.username as author_name
                FROM community_comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ? AND c.status = 1
                ORDER BY c.created_at DESC
                LIMIT ? OFFSET ?`,
                [postId, parseInt(limit), offset]
            );

            this.success(res, {
                items: comments.map(comment => {
                    try {
                        // 解析图片数据
                        comment.images = typeof comment.images === 'string' ? 
                            JSON.parse(comment.images) : 
                            (Array.isArray(comment.images) ? comment.images : []);
                        return comment;
                    } catch (err) {
                        logger.error('解析评论图片数据错误:', err);
                        comment.images = [];
                        return comment;
                    }
                }),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('获取社区评论列表错误:', error);
            this.error(res, '获取评论列表失败');
        }
    }

    // 删除评论
    async deleteComment(req, res) {
        const connection = await pool.getConnection();
        try {
            const { commentId } = req.params;
            const userId = req.userData.userId;

            await connection.beginTransaction();

            // 获取评论信息
            const [comments] = await connection.query(
                `SELECT c.*, p.user_id as post_user_id 
                FROM community_comments c
                JOIN community_posts p ON c.post_id = p.id
                WHERE c.id = ? AND c.status = 1`,
                [commentId]
            );

            if (comments.length === 0) {
                await connection.rollback();
                return this.error(res, '评论不存在或已删除', 404);
            }

            const comment = comments[0];

            // 检查权限（评论作者或帖子作者可删除）
            if (comment.user_id !== userId && comment.post_user_id !== userId) {
                await connection.rollback();
                return this.error(res, '无权操作此评论', 403);
            }

            // 逻辑删除评论
            await connection.query(
                'UPDATE community_comments SET status = 0 WHERE id = ?',
                [commentId]
            );

            // 更新帖子评论数
            await connection.query(
                'UPDATE community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?',
                [comment.post_id]
            );

            // 如果是评论作者删除自己的评论，扣除积分
            if (comment.user_id === userId) {
                await PointService.addPoints(
                    connection, 
                    userId, 
                    PointService.POINT_TYPES.COMMENT_DELETE, 
                    commentId
                );
            }

            await connection.commit();
            this.success(res, null, '删除成功');
        } catch (error) {
            await connection.rollback();
            logger.error('删除社区评论错误:', error);
            this.error(res, '删除评论失败');
        } finally {
            connection.release();
        }
    }

    // 点赞帖子
    async togglePostLike(req, res) {
        const connection = await pool.getConnection();
        try {
            const { postId } = req.params;
            const userId = req.userData.userId;
            const { action } = req.body; // 'like' 或 'unlike'

            await connection.beginTransaction();

            // 检查帖子是否存在
            const [posts] = await connection.query(
                'SELECT id, user_id FROM community_posts WHERE id = ? AND status = 1',
                [postId]
            );

            if (posts.length === 0) {
                await connection.rollback();
                return this.error(res, '帖子不存在或已删除', 404);
            }

            const post = posts[0];
            const targetType = 1; // 1表示帖子

            if (action === 'like') {
                // 检查是否已点赞
                const [existingLikes] = await connection.query(
                    'SELECT id FROM community_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
                    [userId, postId, targetType]
                );

                if (existingLikes.length === 0) {
                    // 添加点赞
                    await connection.query(
                        'INSERT INTO community_likes (user_id, target_id, target_type) VALUES (?, ?, ?)',
                        [userId, postId, targetType]
                    );
                    
                    // 更新帖子点赞数
                    await connection.query(
                        'UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?',
                        [postId]
                    );

                    // 如果不是自己的帖子，给帖子作者加积分
                    if (post.user_id !== userId) {
                        await PointService.addPoints(
                            connection, 
                            post.user_id, 
                            PointService.POINT_TYPES.POST_LIKE, 
                            postId
                        );
                    }
                    
                    await connection.commit();
                    this.success(res, { liked: true }, '点赞成功');
                } else {
                    await connection.rollback();
                    this.success(res, { liked: true }, '已经点赞过');
                }
            } else if (action === 'unlike') {
                // 删除点赞
                const [result] = await connection.query(
                    'DELETE FROM community_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
                    [userId, postId, targetType]
                );
                
                if (result.affectedRows > 0) {
                    // 更新帖子点赞数
                    await connection.query(
                        'UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
                        [postId]
                    );
                }
                
                await connection.commit();
                this.success(res, { liked: false }, '取消点赞成功');
            } else {
                await connection.rollback();
                this.error(res, '无效的操作', 400);
            }
        } catch (error) {
            await connection.rollback();
            logger.error('处理帖子点赞错误:', error);
            this.error(res, '处理点赞失败');
        } finally {
            connection.release();
        }
    }

    // 点赞评论
    async toggleCommentLike(req, res) {
        const connection = await pool.getConnection();
        try {
            const { commentId } = req.params;
            const userId = req.userData.userId;
            const { action } = req.body; // 'like' 或 'unlike'

            await connection.beginTransaction();

            // 检查评论是否存在
            const [comments] = await connection.query(
                'SELECT id, user_id FROM community_comments WHERE id = ? AND status = 1',
                [commentId]
            );

            if (comments.length === 0) {
                await connection.rollback();
                return this.error(res, '评论不存在或已删除', 404);
            }

            const comment = comments[0];
            const targetType = 2; // 2表示评论

            if (action === 'like') {
                // 检查是否已点赞
                const [existingLikes] = await connection.query(
                    'SELECT id FROM community_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
                    [userId, commentId, targetType]
                );

                if (existingLikes.length === 0) {
                    // 添加点赞
                    await connection.query(
                        'INSERT INTO community_likes (user_id, target_id, target_type) VALUES (?, ?, ?)',
                        [userId, commentId, targetType]
                    );
                    
                    // 更新评论点赞数
                    await connection.query(
                        'UPDATE community_comments SET like_count = like_count + 1 WHERE id = ?',
                        [commentId]
                    );

                    // 如果不是自己的评论，给评论作者加积分
                    if (comment.user_id !== userId) {
                        await PointService.addPoints(
                            connection, 
                            comment.user_id, 
                            PointService.POINT_TYPES.COMMENT_LIKE, 
                            commentId
                        );
                    }
                    
                    await connection.commit();
                    this.success(res, { liked: true }, '点赞成功');
                } else {
                    await connection.rollback();
                    this.success(res, { liked: true }, '已经点赞过');
                }
            } else if (action === 'unlike') {
                // 删除点赞
                const [result] = await connection.query(
                    'DELETE FROM community_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
                    [userId, commentId, targetType]
                );
                
                if (result.affectedRows > 0) {
                    // 更新评论点赞数
                    await connection.query(
                        'UPDATE community_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
                        [commentId]
                    );
                }
                
                await connection.commit();
                this.success(res, { liked: false }, '取消点赞成功');
            } else {
                await connection.rollback();
                this.error(res, '无效的操作', 400);
            }
        } catch (error) {
            await connection.rollback();
            logger.error('处理评论点赞错误:', error);
            this.error(res, '处理点赞失败');
        } finally {
            connection.release();
        }
    }

    // 检查用户是否已点赞
    async checkUserLike(req, res) {
        try {
            const { targetId, targetType } = req.query;
            const userId = req.userData.userId;

            if (!targetId || !targetType) {
                return this.error(res, '参数不完整', 400);
            }

            // 检查是否已点赞
            const [likes] = await pool.query(
                'SELECT id FROM community_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
                [userId, targetId, targetType]
            );

            this.success(res, {
                liked: likes.length > 0
            });
        } catch (error) {
            logger.error('检查点赞状态错误:', error);
            this.error(res, '检查点赞状态失败');
        }
    }

    // 获取热门标签
    async getHotTags(req, res) {
        try {
            const { limit = 10 } = req.query;
            const tags = await TagService.getHotTags(parseInt(limit));
            this.success(res, { tags });
        } catch (error) {
            logger.error('获取热门标签错误:', error);
            this.error(res, '获取热门标签失败');
        }
    }

    // 通过标签获取帖子
    async getPostsByTag(req, res) {
        try {
            const { tagName } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(DISTINCT p.id) as total 
                FROM community_posts p
                JOIN community_post_tags pt ON p.id = pt.post_id
                JOIN community_tags t ON pt.tag_id = t.id
                WHERE p.status = 1 AND t.name = ?`,
                [tagName]
            );
            const total = countResult[0].total;

            // 获取帖子列表
            const [posts] = await pool.query(
                `SELECT 
                    p.*,
                    u.username as author_name
                FROM community_posts p
                JOIN community_post_tags pt ON p.id = pt.post_id
                JOIN community_tags t ON pt.tag_id = t.id
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.status = 1 AND t.name = ?
                GROUP BY p.id
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?`,
                [tagName, parseInt(limit), offset]
            );

            // 获取每个帖子的标签
            const connection = await pool.getConnection();
            try {
                for (const post of posts) {
                    // 解析图片数据
                    try {
                        post.images = typeof post.images === 'string' ? 
                            JSON.parse(post.images) : 
                            (Array.isArray(post.images) ? post.images : []);
                    } catch (err) {
                        logger.error('解析帖子图片数据错误:', err);
                        post.images = [];
                    }

                    // 获取标签
                    const tags = await TagService.getPostTags(connection, post.id);
                    post.tags = tags.map(tag => tag.name);
                }
            } finally {
                connection.release();
            }

            this.success(res, {
                items: posts,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('通过标签获取帖子错误:', error);
            this.error(res, '获取帖子列表失败');
        }
    }

    // 搜索帖子
    async searchPosts(req, res) {
        try {
            const { keyword, tags, sort = 'latest', page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            let baseQuery = `
                SELECT 
                    p.*,
                    u.username as author_name
                FROM community_posts p
                LEFT JOIN users u ON p.user_id = u.id`;
            
            let countQuery = `
                SELECT COUNT(DISTINCT p.id) as total 
                FROM community_posts p`;
            
            let whereClause = ' WHERE p.status = 1';
            const params = [];

            // 标签筛选
            if (tags) {
                const tagArray = Array.isArray(tags) ? tags : (typeof tags === 'string' ? [tags] : []);
                
                if (tagArray.length > 0) {
                    baseQuery += ` 
                    JOIN community_post_tags pt ON p.id = pt.post_id
                    JOIN community_tags t ON pt.tag_id = t.id`;
                    
                    countQuery += ` 
                    JOIN community_post_tags pt ON p.id = pt.post_id
                    JOIN community_tags t ON pt.tag_id = t.id`;
                    
                    whereClause += ' AND t.name IN (?)';
                    params.push(tagArray);
                }
            }

            // 关键词搜索
            if (keyword) {
                whereClause += ' AND (p.title LIKE ? OR p.content LIKE ?)';
                params.push(`%${keyword}%`, `%${keyword}%`);
            }

            baseQuery += whereClause;
            countQuery += whereClause;

            // 获取总数
            const [countResult] = await pool.query(countQuery, params);
            const total = countResult[0].total;

            // 排序方式
            let orderClause = '';
            if (sort === 'popular') {
                orderClause = ' ORDER BY p.view_count DESC, p.like_count DESC, p.comment_count DESC, p.created_at DESC';
            } else if (sort === 'hot') {
                orderClause = ' ORDER BY p.like_count DESC, p.comment_count DESC, p.created_at DESC';
            } else {
                // 默认按最新排序
                orderClause = ' ORDER BY p.created_at DESC';
            }

            baseQuery += ` GROUP BY p.id ${orderClause} LIMIT ? OFFSET ?`;
            
            // 获取帖子列表
            const [posts] = await pool.query(
                baseQuery,
                [...params, parseInt(limit), offset]
            );

            // 获取每个帖子的标签
            const connection = await pool.getConnection();
            try {
                for (const post of posts) {
                    // 解析图片数据
                    try {
                        post.images = typeof post.images === 'string' ? 
                            JSON.parse(post.images) : 
                            (Array.isArray(post.images) ? post.images : []);
                    } catch (err) {
                        logger.error('解析帖子图片数据错误:', err);
                        post.images = [];
                    }

                    // 获取标签
                    const tags = await TagService.getPostTags(connection, post.id);
                    post.tags = tags.map(tag => tag.name);
                }
            } finally {
                connection.release();
            }

            this.success(res, {
                items: posts,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('搜索帖子错误:', error);
            this.error(res, '搜索帖子失败');
        }
    }
}

module.exports = new CommunityController(); 