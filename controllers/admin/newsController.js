const pool = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/responseUtil');
const sanitizeHtml = require('sanitize-html');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// 配置图片上传
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = 'public/uploads/news';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('只支持图片文件!'));
        }
    }
});

// 配置允许的HTML标签和属性，完全支持Quill编辑器
const sanitizeOptions = {
    allowedTags: [
        // Quill默认格式
        'p', 'strong', 'em', 'u', 's', 'blockquote', 'ol', 'ul', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        // Quill链接和图片
        'a', 'img',
        // Quill代码块和格式化
        'pre', 'code',
        // 基础HTML标签
        'div', 'span', 'br', 'sub', 'sup',
        // 表格支持
        'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    allowedAttributes: {
        // Quill类和样式
        '*': ['class', 'style'],
        // 链接属性
        'a': ['href', 'target', 'rel'],
        // 图片属性
        'img': ['src', 'alt', 'width', 'height', 'style', 'class'],
        // 列表属性
        'ol': ['start'],
        // 表格属性
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan']
    },
    allowedStyles: {
        '*': {
            // 文本对齐
            'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
            // 文本颜色和背景色
            'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
            'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
            // 字体大小
            'font-size': [/^\d+(?:px|em|%)$/],
            // 行高
            'line-height': [/^[\d.]+$/],
            // 缩进
            'padding-left': [/^\d+(?:px|em|%)$/],
            'margin-left': [/^\d+(?:px|em|%)$/],
            // 图片样式
            'width': [/^\d+(?:px|%)$/],
            'height': [/^\d+(?:px|%)$/],
            'max-width': [/^\d+(?:px|%)$/],
            'max-height': [/^\d+(?:px|%)$/]
        }
    },
    // 允许空标签
    allowEmptyTags: ['br', 'p', 'div'],
    // 保留重要的Quill类名
    allowedClasses: {
        '*': ['ql-*'],
        'pre': ['ql-syntax'],
        'span': ['ql-*']
    }
};

class NewsController {
    // 获取新闻分类列表
    async getCategoryList(req, res) {
        try {
            const [categories] = await pool.query(
                'SELECT * FROM news_categories ORDER BY sort_order ASC'
            );
            return successResponse(res, categories);
        } catch (error) {
            console.error('Get news categories error:', error);
            return errorResponse(res, '获取新闻分类失败');
        }
    }

    // 创建新闻分类
    async createCategory(req, res) {
        try {
            const { name, code, sort_order = 0 } = req.body;
            const [result] = await pool.query(
                'INSERT INTO news_categories (name, code, sort_order) VALUES (?, ?, ?)',
                [name, code, sort_order]
            );
            return successResponse(res, { id: result.insertId }, '新闻分类创建成功');
        } catch (error) {
            console.error('Create news category error:', error);
            return errorResponse(res, '创建新闻分类失败');
        }
    }

    // 更新新闻分类
    async updateCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const { name, sort_order, status } = req.body;
            await pool.query(
                'UPDATE news_categories SET name = ?, sort_order = ?, status = ? WHERE id = ?',
                [name, sort_order, status, categoryId]
            );
            return successResponse(res, null, '新闻分类更新成功');
        } catch (error) {
            console.error('Update news category error:', error);
            return errorResponse(res, '更新新闻分类失败');
        }
    }

    // 删除新闻分类
    async deleteCategory(req, res) {
        try {
            const { categoryId } = req.params;
            // 检查分类下是否有文章
            const [articles] = await pool.query(
                'SELECT COUNT(*) as count FROM news_articles WHERE category_id = ?',
                [categoryId]
            );
            if (articles[0].count > 0) {
                return errorResponse(res, '该分类下存在文章，无法删除');
            }
            await pool.query('DELETE FROM news_categories WHERE id = ?', [categoryId]);
            return successResponse(res, null, '新闻分类删除成功');
        } catch (error) {
            console.error('Delete news category error:', error);
            return errorResponse(res, '删除新闻分类失败');
        }
    }

    // 获取新闻文章列表
    async getArticleList(req, res) {
        try {
            const { page = 1, limit = 10, category_id, is_published, keyword } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (category_id) {
                whereClause += ' AND a.category_id = ?';
                params.push(category_id);
            }
            if (is_published !== undefined) {
                whereClause += ' AND a.is_published = ?';
                params.push(is_published);
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
                `SELECT a.*, c.name as category_name, 
                admin.username as creator_name
                FROM news_articles a
                LEFT JOIN news_categories c ON a.category_id = c.id
                LEFT JOIN admins admin ON a.created_by = admin.id
                ${whereClause}
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            return successResponse(res, {
                items: articles,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get news articles error:', error);
            return errorResponse(res, '获取新闻文章列表失败');
        }
    }

    // 获取新闻文章详情
    async getArticleDetail(req, res) {
        try {
            const { articleId } = req.params;
            const [articles] = await pool.query(
                `SELECT a.*, c.name as category_name,
                admin.username as creator_name
                FROM news_articles a
                LEFT JOIN news_categories c ON a.category_id = c.id
                LEFT JOIN admins admin ON a.created_by = admin.id
                WHERE a.id = ?`,
                [articleId]
            );

            if (articles.length === 0) {
                return errorResponse(res, '新闻文章不存在', 404);
            }

            return successResponse(res, articles[0]);
        } catch (error) {
            console.error('Get news article detail error:', error);
            return errorResponse(res, '获取新闻文章详情失败');
        }
    }

    // 上传图片
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return errorResponse(res, '请选择要上传的图片');
            }

            const imageUrl = `/uploads/news/${req.file.filename}`;
            return successResponse(res, { url: imageUrl }, '图片上传成功');
        } catch (error) {
            console.error('Upload image error:', error);
            return errorResponse(res, '图片上传失败');
        }
    }

    // 创建新闻文章
    async createArticle(req, res) {
        try {
            const {
                category_id,
                title,
                summary,
                content,
                cover_image,
                author,
                source,
                is_featured = 0,
                is_published = 0
            } = req.body;

            // 处理Quill内容
            let processedContent = content;
            if (typeof content === 'object' && content.ops) {
                // 如果收到Delta格式，转换为HTML
                processedContent = this.deltaToHtml(content);
            }

            // 处理内容中的临时图片URL
            processedContent = await this.processContentImages(processedContent);

            // 清理和验证富文本内容
            const sanitizedContent = sanitizeHtml(processedContent, sanitizeOptions);
            
            // 提取文章摘要（如果未提供）
            const autoSummary = summary || this.generateSummary(sanitizedContent);

            const admin_id = req.admin.id;

            const [result] = await pool.query(
                `INSERT INTO news_articles (
                    category_id, title, summary, content, cover_image,
                    author, source, is_featured, is_published,
                    created_by, updated_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    category_id, title, autoSummary, sanitizedContent, cover_image,
                    author, source, is_featured, is_published,
                    admin_id, admin_id
                ]
            );

            return successResponse(res, { id: result.insertId }, '新闻文章创建成功');
        } catch (error) {
            console.error('Create news article error:', error);
            return errorResponse(res, '创建新闻文章失败');
        }
    }

    // 更新新闻文章
    async updateArticle(req, res) {
        try {
            const { articleId } = req.params;
            const {
                category_id,
                title,
                summary,
                content,
                cover_image,
                author,
                source,
                is_featured,
                is_published
            } = req.body;

            // 处理Quill内容
            let processedContent = content;
            if (typeof content === 'object' && content.ops) {
                processedContent = this.deltaToHtml(content);
            }

            // 处理内容中的临时图片URL
            processedContent = await this.processContentImages(processedContent);

            // 清理和验证富文本内容
            const sanitizedContent = sanitizeHtml(processedContent, sanitizeOptions);
            
            // 提取文章摘要（如果未提供）
            const autoSummary = summary || this.generateSummary(sanitizedContent);

            const admin_id = req.admin.id;

            // 获取原文章内容以处理不再使用的图片
            const [oldArticle] = await pool.query(
                'SELECT content FROM news_articles WHERE id = ?',
                [articleId]
            );

            if (oldArticle[0]) {
                await this.cleanupUnusedImages(oldArticle[0].content, sanitizedContent);
            }

            await pool.query(
                `UPDATE news_articles SET
                category_id = ?, title = ?, summary = ?, content = ?,
                cover_image = ?, author = ?, source = ?,
                is_featured = ?, is_published = ?,
                updated_by = ?, publish_time = ?
                WHERE id = ?`,
                [
                    category_id, title, autoSummary, sanitizedContent,
                    cover_image, author, source,
                    is_featured, is_published,
                    admin_id, is_published ? new Date() : null,
                    articleId
                ]
            );

            return successResponse(res, null, '新闻文章更新成功');
        } catch (error) {
            console.error('Update news article error:', error);
            return errorResponse(res, '更新新闻文章失败');
        }
    }

    // 删除新闻文章
    async deleteArticle(req, res) {
        try {
            const { articleId } = req.params;
            await pool.query('DELETE FROM news_articles WHERE id = ?', [articleId]);
            return successResponse(res, null, '新闻文章删除成功');
        } catch (error) {
            console.error('Delete news article error:', error);
            return errorResponse(res, '删除新闻文章失败');
        }
    }

    // 更新文章发布状态
    async updateArticlePublishStatus(req, res) {
        try {
            const { articleId } = req.params;
            const { is_published } = req.body;
            const admin_id = req.admin.id;

            await pool.query(
                `UPDATE news_articles SET
                is_published = ?,
                publish_time = ?,
                updated_by = ?
                WHERE id = ?`,
                [is_published, is_published ? new Date() : null, admin_id, articleId]
            );

            return successResponse(res, null, is_published ? '文章已发布' : '文章已下线');
        } catch (error) {
            console.error('Update article publish status error:', error);
            return errorResponse(res, '更新文章发布状态失败');
        }
    }

    // 更新文章热门状态
    async updateArticleFeaturedStatus(req, res) {
        try {
            const { articleId } = req.params;
            const { is_featured } = req.body;
            const admin_id = req.admin.id;

            await pool.query(
                `UPDATE news_articles SET
                is_featured = ?,
                updated_by = ?
                WHERE id = ?`,
                [is_featured, admin_id, articleId]
            );

            return successResponse(res, null, is_featured ? '文章已设为热门' : '文章已取消热门');
        } catch (error) {
            console.error('Update article featured status error:', error);
            return errorResponse(res, '更新文章热门状态失败');
        }
    }

    // 生成文章摘要
    generateSummary(content, maxLength = 200) {
        // 移除HTML标签
        const plainText = content.replace(/<[^>]+>/g, '');
        // 移除多余空白字符
        const trimmedText = plainText.replace(/\s+/g, ' ').trim();
        // 截取指定长度
        return trimmedText.length > maxLength 
            ? trimmedText.substring(0, maxLength) + '...'
            : trimmedText;
    }

    // 处理Quill Delta格式
    deltaToHtml(delta) {
        if (!delta || !delta.ops) {
            return '';
        }

        let html = '';
        delta.ops.forEach(op => {
            if (typeof op.insert === 'string') {
                let text = op.insert;
                if (op.attributes) {
                    if (op.attributes.bold) text = `<strong>${text}</strong>`;
                    if (op.attributes.italic) text = `<em>${text}</em>`;
                    if (op.attributes.underline) text = `<u>${text}</u>`;
                    if (op.attributes.strike) text = `<s>${text}</s>`;
                    if (op.attributes.link) text = `<a href="${op.attributes.link}">${text}</a>`;
                    if (op.attributes.header) text = `<h${op.attributes.header}>${text}</h${op.attributes.header}>`;
                    if (op.attributes.list === 'ordered') text = `<li>${text}</li>`;
                    if (op.attributes.list === 'bullet') text = `<li>${text}</li>`;
                    if (op.attributes.blockquote) text = `<blockquote>${text}</blockquote>`;
                    if (op.attributes.code) text = `<pre><code>${text}</code></pre>`;
                }
                html += text;
            } else if (op.insert && typeof op.insert === 'object') {
                // 处理图片等嵌入内容
                if (op.insert.image) {
                    html += `<img src="${op.insert.image}" alt="图片">`;
                }
            }
        });

        return html;
    }

    // 处理内容中的图片
    async processContentImages(content) {
        const tempImagePattern = /<img[^>]+src="(data:image\/[^"]+)"[^>]*>/g;
        let match;
        let processedContent = content;

        while ((match = tempImagePattern.exec(content)) !== null) {
            const base64Data = match[1].split(',')[1];
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.png';
            const imagePath = path.join('public/uploads/news', filename);
            
            await fs.writeFile(imagePath, imageBuffer);
            
            const imageUrl = `/uploads/news/${filename}`;
            processedContent = processedContent.replace(match[1], imageUrl);
        }

        return processedContent;
    }

    // 清理不再使用的图片
    async cleanupUnusedImages(oldContent, newContent) {
        const extractImageUrls = (content) => {
            const urls = new Set();
            const pattern = /<img[^>]+src="([^"]+)"[^>]*>/g;
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1].startsWith('/uploads/news/')) {
                    urls.add(match[1]);
                }
            }
            return urls;
        };

        const oldUrls = extractImageUrls(oldContent);
        const newUrls = extractImageUrls(newContent);

        // 找出不再使用的图片URL
        const unusedUrls = [...oldUrls].filter(url => !newUrls.has(url));

        // 删除不再使用的图片文件
        for (const url of unusedUrls) {
            const imagePath = path.join('public', url);
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.error('Delete unused image error:', error);
            }
        }
    }
}

module.exports = {
    newsController: new NewsController(),
    upload: upload
}; 