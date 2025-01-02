const pool = require('../config/database');
const ResponseUtil = require('../utils/responseUtil');

class NewsController {
    // 获取新闻分类列表
    async getCategoryList(req, res) {
        try {
            const [categories] = await pool.query(
                'SELECT id, name, code FROM news_categories WHERE status = 1 ORDER BY sort_order ASC'
            );
            return ResponseUtil.success(res, categories);
        } catch (error) {
            console.error('Get news categories error:', error);
            return ResponseUtil.error(res, '获取新闻分类失败');
        }
    }

    // 获取新闻列表
    async getArticleList(req, res) {
        try {
            const { page = 1, limit = 10, category_id, keyword } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE a.is_published = 1 AND a.status = 1';
            const params = [];

            if (category_id) {
                whereClause += ' AND a.category_id = ?';
                params.push(category_id);
            }
            if (keyword) {
                whereClause += ' AND (a.title LIKE ? OR a.summary LIKE ?)';
                params.push(`%${keyword}%`, `%${keyword}%`);
            }

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM news_articles a ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取文章列表
            const [articles] = await pool.query(
                `SELECT a.id, a.category_id, c.name as category_name, 
                a.title, a.summary, a.cover_image, a.author, 
                a.view_count, a.is_featured, a.publish_time
                FROM news_articles a
                LEFT JOIN news_categories c ON a.category_id = c.id
                ${whereClause}
                ORDER BY a.publish_time DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            return ResponseUtil.success(res, {
                items: articles,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get news articles error:', error);
            return ResponseUtil.error(res, '获取新闻列表失败');
        }
    }

    // 获取新闻详情
    async getArticleDetail(req, res) {
        try {
            const { articleId } = req.params;

            // 开启事务
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // 更新浏览次数
                await connection.query(
                    'UPDATE news_articles SET view_count = view_count + 1 WHERE id = ? AND is_published = 1',
                    [articleId]
                );

                // 获取文章详情
                const [articles] = await connection.query(
                    `SELECT a.*, c.name as category_name
                    FROM news_articles a
                    LEFT JOIN news_categories c ON a.category_id = c.id
                    WHERE a.id = ? AND a.is_published = 1 AND a.status = 1`,
                    [articleId]
                );

                if (articles.length === 0) {
                    await connection.rollback();
                    return ResponseUtil.error(res, '文章不存在或未发布', 404);
                }

                await connection.commit();
                return ResponseUtil.success(res, articles[0]);
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Get news article detail error:', error);
            return ResponseUtil.error(res, '获取新闻详情失败');
        }
    }

    // 获取热门新闻
    async getFeaturedArticles(req, res) {
        try {
            const { limit = 5 } = req.query;

            // 先获取设置为热门的文章
            const [featuredArticles] = await pool.query(
                `SELECT a.id, a.title, a.summary, a.cover_image, 
                a.view_count, a.publish_time, c.name as category_name
                FROM news_articles a
                LEFT JOIN news_categories c ON a.category_id = c.id
                WHERE a.is_published = 1 AND a.status = 1 AND a.is_featured = 1
                ORDER BY a.publish_time DESC
                LIMIT ?`,
                [parseInt(limit)]
            );

            // 如果热门文章不足，补充高浏览量文章
            if (featuredArticles.length < parseInt(limit)) {
                const remainingLimit = parseInt(limit) - featuredArticles.length;
                const [popularArticles] = await pool.query(
                    `SELECT a.id, a.title, a.summary, a.cover_image, 
                    a.view_count, a.publish_time, c.name as category_name
                    FROM news_articles a
                    LEFT JOIN news_categories c ON a.category_id = c.id
                    WHERE a.is_published = 1 AND a.status = 1 
                    AND a.is_featured = 0 AND a.view_count >= 100
                    AND a.id NOT IN (${featuredArticles.map(a => a.id).join(',') || 0})
                    ORDER BY a.view_count DESC, a.publish_time DESC
                    LIMIT ?`,
                    [remainingLimit]
                );
                
                return ResponseUtil.success(res, [...featuredArticles, ...popularArticles]);
            }

            return ResponseUtil.success(res, featuredArticles);
        } catch (error) {
            console.error('Get featured articles error:', error);
            return ResponseUtil.error(res, '获取热门新闻失败');
        }
    }

    // 获取相关新闻推荐
    async getRelatedArticles(req, res) {
        try {
            const { articleId } = req.params;
            const { limit = 5 } = req.query;

            // 先获取当前文章的信息（分类和发布时间）
            const [currentArticle] = await pool.query(
                'SELECT category_id, publish_time FROM news_articles WHERE id = ? AND is_published = 1',
                [articleId]
            );

            if (currentArticle.length === 0) {
                return ResponseUtil.error(res, '文章不存在或未发布', 404);
            }

            // 获取同分类的相关文章，优先返回接近发布时间的文章
            const [articles] = await pool.query(
                `SELECT a.id, a.title, a.summary, a.cover_image, 
                a.view_count, a.publish_time, c.name as category_name
                FROM news_articles a
                LEFT JOIN news_categories c ON a.category_id = c.id
                WHERE a.is_published = 1 AND a.status = 1
                AND a.category_id = ? AND a.id != ?
                ORDER BY 
                    ABS(TIMESTAMPDIFF(SECOND, a.publish_time, ?)) ASC,
                    a.view_count DESC
                LIMIT ?`,
                [
                    currentArticle[0].category_id,
                    articleId,
                    currentArticle[0].publish_time,
                    parseInt(limit)
                ]
            );

            // 如果同分类文章不足，补充其他分类的热门文章
            if (articles.length < parseInt(limit)) {
                const remainingLimit = parseInt(limit) - articles.length;
                const [otherArticles] = await pool.query(
                    `SELECT a.id, a.title, a.summary, a.cover_image, 
                    a.view_count, a.publish_time, c.name as category_name
                    FROM news_articles a
                    LEFT JOIN news_categories c ON a.category_id = c.id
                    WHERE a.is_published = 1 AND a.status = 1
                    AND a.category_id != ? AND a.id != ?
                    AND (a.is_featured = 1 OR a.view_count >= 100)
                    ORDER BY a.view_count DESC
                    LIMIT ?`,
                    [currentArticle[0].category_id, articleId, remainingLimit]
                );
                
                return ResponseUtil.success(res, [...articles, ...otherArticles]);
            }

            return ResponseUtil.success(res, articles);
        } catch (error) {
            console.error('Get related articles error:', error);
            return ResponseUtil.error(res, '获取相关新闻失败');
        }
    }
}

module.exports = new NewsController(); 