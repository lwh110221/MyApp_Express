const pool = require('../../config/database');
const ResponseUtil = require('../../utils/responseUtil');
const sanitizeHtml = require('sanitize-html');
const path = require('path');
const fs = require('fs').promises;
const upload = require('../../config/multer');

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
            return ResponseUtil.success(res, categories);
        } catch (error) {
            console.error('Get news categories error:', error);
            return ResponseUtil.error(res, '获取新闻分类失败');
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
            return ResponseUtil.success(res, { id: result.insertId }, '新闻分类创建成功');
        } catch (error) {
            console.error('Create news category error:', error);
            return ResponseUtil.error(res, '创建新闻分类失败');
        }
    }

    // 更新新闻分类
    async updateCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const { name, code, sort_order, status } = req.body;
            const [result] = await pool.query(
                'UPDATE news_categories SET name = ?, code = ?, sort_order = ?, status = ? WHERE id = ?',
                [name, code, sort_order, status, categoryId]
            );
            if (result.affectedRows === 0) {
                return ResponseUtil.error(res, '新闻分类不存在', 404);
            }
            return ResponseUtil.success(res, null, '新闻分类更新成功');
        } catch (error) {
            console.error('Update news category error:', error);
            return ResponseUtil.error(res, '更新新闻分类失败');
        }
    }

    // 删除新闻分类
    async deleteCategory(req, res) {
        try {
            const { categoryId } = req.params;
            // 检查是否有关联的文章
            const [articles] = await pool.query(
                'SELECT COUNT(*) as count FROM news_articles WHERE category_id = ?',
                [categoryId]
            );
            if (articles[0].count > 0) {
                return ResponseUtil.error(res, '该分类下还有文章，无法删除');
            }
            const [result] = await pool.query(
                'DELETE FROM news_categories WHERE id = ?',
                [categoryId]
            );
            if (result.affectedRows === 0) {
                return ResponseUtil.error(res, '新闻分类不存在', 404);
            }
            return ResponseUtil.success(res, null, '新闻分类删除成功');
        } catch (error) {
            console.error('Delete news category error:', error);
            return ResponseUtil.error(res, '删除新闻分类失败');
        }
    }

    // 获取新闻文章列表
    async getArticleList(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                category_id, 
                keyword, 
                status,
                is_published,
                is_featured 
            } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (category_id) {
                whereClause += ' AND a.category_id = ?';
                params.push(category_id);
            }
            if (keyword) {
                whereClause += ' AND (a.title LIKE ? OR a.summary LIKE ?)';
                params.push(`%${keyword}%`, `%${keyword}%`);
            }
            if (status !== undefined) {
                whereClause += ' AND a.status = ?';
                params.push(status);
            }
            if (is_published !== undefined) {
                whereClause += ' AND a.is_published = ?';
                params.push(parseInt(is_published));
            }
            if (is_featured !== undefined) {
                whereClause += ' AND a.is_featured = ?';
                params.push(parseInt(is_featured));
            }

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM news_articles a ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取文章列表
            const [articles] = await pool.query(
                `SELECT 
                    a.id, 
                    a.category_id, 
                    a.title, 
                    a.summary,
                    a.cover_image,
                    a.author,
                    a.source,
                    a.view_count,
                    a.is_featured,
                    a.is_published,
                    a.status,
                    a.publish_time,
                    a.created_by,
                    a.updated_by,
                    a.created_at,
                    a.updated_at,
                    c.name as category_name
                FROM news_articles a
                LEFT JOIN news_categories c ON a.category_id = c.id
                ${whereClause}
                ORDER BY a.created_at DESC
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

    // 获取新闻文章详情
    async getArticleDetail(req, res) {
        try {
            const { articleId } = req.params;
            const [articles] = await pool.query(
                `SELECT a.*, c.name as category_name
                FROM news_articles a
                LEFT JOIN news_categories c ON a.category_id = c.id
                WHERE a.id = ?`,
                [articleId]
            );

            if (articles.length === 0) {
                return ResponseUtil.error(res, '文章不存在', 404);
            }

            return ResponseUtil.success(res, articles[0]);
        } catch (error) {
            console.error('Get news article detail error:', error);
            return ResponseUtil.error(res, '获取新闻详情失败');
        }
    }

    // 上传图片
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return ResponseUtil.error(res, '请选择要上传的图片');
            }
            const imageUrl = `/uploads/news/${req.file.filename}`;
            return ResponseUtil.success(res, { url: imageUrl });
        } catch (error) {
            console.error('Upload image error:', error);
            return ResponseUtil.error(res, '图片上传失败');
        }
    }

    // 创建新闻文章
    async createArticle(req, res) {
        try {
            const {
                category_id,
                title,
                content,
                summary,
                cover_image,
                author,
                source,
                is_featured = 0,
                is_published = 0,
                publish_time = null
            } = req.body;

            // 处理 Quill 内容
            let processedContent = content;
            if (typeof content === 'object' && content.ops) {
                // 如果是 Delta 格式，转换为 HTML
                processedContent = this.deltaToHtml(content);
            }

            // 处理内容中的图片
            processedContent = await this.processContentImages(processedContent);

            // 清理和验证富文本内容
            const sanitizedContent = sanitizeHtml(processedContent, sanitizeOptions);

            // 如果没有提供摘要，自动生成
            const finalSummary = summary || this.generateSummary(sanitizedContent);

            const [result] = await pool.query(
                `INSERT INTO news_articles (
                    category_id, title, content, summary, cover_image,
                    author, source, is_featured, is_published,
                    publish_time, created_at, updated_at, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
                [
                    category_id, title, sanitizedContent, finalSummary, cover_image,
                    author, source, is_featured, is_published,
                    publish_time || new Date(), req.admin.id
                ]
            );

            return ResponseUtil.success(res, { id: result.insertId }, '新闻文章创建成功');
        } catch (error) {
            console.error('Create news article error:', error);
            return ResponseUtil.error(res, '创建新闻文章失败');
        }
    }

    // 更新新闻文章
    async updateArticle(req, res) {
        try {
            const { articleId } = req.params;
            const {
                category_id,
                title,
                content,
                summary,
                cover_image,
                author,
                source,
                is_featured,
                is_published,
                publish_time,
                status
            } = req.body;

            // 获取原文章内容
            const [oldArticle] = await pool.query(
                'SELECT content FROM news_articles WHERE id = ?',
                [articleId]
            );

            if (oldArticle.length === 0) {
                return ResponseUtil.error(res, '文章不存在', 404);
            }

            // 处理 Quill 内容
            let processedContent = content;
            if (content) {
                if (typeof content === 'object' && content.ops) {
                    // 如果是 Delta 格式，转换为 HTML
                    processedContent = this.deltaToHtml(content);
                }
                // 处理内容中的图片
                processedContent = await this.processContentImages(processedContent);
                // 清理和验证富文本内容
                processedContent = sanitizeHtml(processedContent, sanitizeOptions);
                // 清理不再使用的图片
                await this.cleanupUnusedImages(oldArticle[0].content, processedContent);
            }

            // 如果没有提供摘要，且内容已更新，则重新生成摘要
            const finalSummary = summary || (content ? this.generateSummary(processedContent) : undefined);

            // 构建更新字段
            const updates = [];
            const params = [];
            
            if (category_id !== undefined) {
                updates.push('category_id = ?');
                params.push(category_id);
            }
            if (title !== undefined) {
                updates.push('title = ?');
                params.push(title);
            }
            if (content !== undefined) {
                updates.push('content = ?');
                params.push(processedContent);
            }
            if (finalSummary !== undefined) {
                updates.push('summary = ?');
                params.push(finalSummary);
            }
            if (cover_image !== undefined) {
                updates.push('cover_image = ?');
                params.push(cover_image);
            }
            if (author !== undefined) {
                updates.push('author = ?');
                params.push(author);
            }
            if (source !== undefined) {
                updates.push('source = ?');
                params.push(source);
            }
            if (is_featured !== undefined) {
                updates.push('is_featured = ?');
                params.push(is_featured);
            }
            if (is_published !== undefined) {
                updates.push('is_published = ?');
                params.push(is_published);
                if (is_published === 1) {
                    updates.push('publish_time = NOW()');
                }
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (publish_time !== undefined) {
                updates.push('publish_time = ?');
                params.push(publish_time);
            }

            // 添加更新时间和更新人
            updates.push('updated_at = NOW()');
            updates.push('updated_by = ?');
            params.push(req.admin.id);

            // 添加文章ID
            params.push(articleId);

            const [result] = await pool.query(
                `UPDATE news_articles SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            if (result.affectedRows === 0) {
                return ResponseUtil.error(res, '文章不存在', 404);
            }

            return ResponseUtil.success(res, null, '新闻文章更新成功');
        } catch (error) {
            console.error('Update news article error:', error);
            return ResponseUtil.error(res, '更新新闻文章失败');
        }
    }

    // 删除新闻文章
    async deleteArticle(req, res) {
        const connection = await pool.getConnection();
        try {
            const { articleId } = req.params;

            await connection.beginTransaction();

            // 获取文章内容以删除相关图片
            const [article] = await connection.query(
                'SELECT content, cover_image FROM news_articles WHERE id = ?',
                [articleId]
            );

            if (article.length === 0) {
                await connection.rollback();
                return ResponseUtil.error(res, '文章不存在', 404);
            }

            // 删除文章
            const [result] = await connection.query(
                'DELETE FROM news_articles WHERE id = ?',
                [articleId]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return ResponseUtil.error(res, '文章不存在', 404);
            }

            // 删除文章内容中的图片
            const content = article[0].content;
            if (content) {
                const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
                let match;
                while ((match = imageRegex.exec(content)) !== null) {
                    const imageUrl = match[1];
                    if (imageUrl.startsWith('/uploads/news/')) {
                        try {
                            const filePath = path.join('public', imageUrl);
                            await fs.unlink(filePath);
                        } catch (error) {
                            console.error('Delete content image error:', error);
                        }
                    }
                }
            }

            // 删除封面图片
            if (article[0].cover_image && article[0].cover_image.startsWith('/uploads/news/')) {
                try {
                    const coverPath = path.join('public', article[0].cover_image);
                    await fs.unlink(coverPath);
                } catch (error) {
                    console.error('Delete cover image error:', error);
                }
            }

            await connection.commit();
            return ResponseUtil.success(res, null, '文章删除成功');
        } catch (error) {
            await connection.rollback();
            console.error('Delete article error:', error);
            return ResponseUtil.error(res, '删除文章失败');
        } finally {
            connection.release();
        }
    }

    // 更新文章发布状态
    async updateArticlePublishStatus(req, res) {
        try {
            const { articleId } = req.params;
            const { is_published } = req.body;

            const [result] = await pool.query(
                `UPDATE news_articles SET 
                is_published = ?,
                publish_time = ?,
                updated_at = NOW()
                WHERE id = ?`,
                [
                    is_published,
                    is_published ? new Date() : null,
                    articleId
                ]
            );

            if (result.affectedRows === 0) {
                return ResponseUtil.error(res, '文章不存在', 404);
            }

            return ResponseUtil.success(res, null, `文章${is_published ? '发布' : '下线'}成功`);
        } catch (error) {
            console.error('Update article publish status error:', error);
            return ResponseUtil.error(res, '更新文章发布状态失败');
        }
    }

    // 更新文章推荐状态
    async updateArticleFeaturedStatus(req, res) {
        try {
            const { articleId } = req.params;
            const { is_featured } = req.body;

            const [result] = await pool.query(
                'UPDATE news_articles SET is_featured = ?, updated_at = NOW() WHERE id = ?',
                [is_featured, articleId]
            );

            if (result.affectedRows === 0) {
                return ResponseUtil.error(res, '文章不存在', 404);
            }

            return ResponseUtil.success(res, null, `文章${is_featured ? '设为' : '取消'}推荐成功`);
        } catch (error) {
            console.error('Update article featured status error:', error);
            return ResponseUtil.error(res, '更新文章推荐状态失败');
        }
    }

    // 生成文章摘要
    generateSummary(content, maxLength = 200) {
        // 移除HTML标签
        const text = content.replace(/<[^>]+>/g, '');
        // 移除多余空格
        const cleanText = text.replace(/\s+/g, ' ').trim();
        // 截取指定长度
        return cleanText.length > maxLength
            ? cleanText.substring(0, maxLength) + '...'
            : cleanText;
    }

    // 处理文章内容中的图片
    async processContentImages(content) {
        const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        let processedContent = content;

        while ((match = imageRegex.exec(content)) !== null) {
            const imageUrl = match[1];
            // 如果是base64图片，需要保存为文件
            if (imageUrl.startsWith('data:image')) {
                try {
                    const base64Data = imageUrl.split(',')[1];
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    const filename = `news-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
                    const uploadDir = 'public/uploads/news';
                    await fs.mkdir(uploadDir, { recursive: true });
                    await fs.writeFile(`${uploadDir}/${filename}`, imageBuffer);
                    const newImageUrl = `/uploads/news/${filename}`;
                    processedContent = processedContent.replace(imageUrl, newImageUrl);
                } catch (error) {
                    console.error('Process image error:', error);
                }
            }
        }
        return processedContent;
    }

    // 清理不再使用的图片
    async cleanupUnusedImages(oldContent, newContent) {
        const extractImageUrls = (content) => {
            const urls = [];
            const regex = /<img[^>]+src="([^"]+)"[^>]*>/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                if (match[1].startsWith('/uploads/news/')) {
                    urls.push(match[1]);
                }
            }
            return urls;
        };

        const oldUrls = extractImageUrls(oldContent);
        const newUrls = extractImageUrls(newContent);

        // 找出不再使用的图片URL
        const unusedUrls = oldUrls.filter(url => !newUrls.includes(url));

        // 删除不再使用的图片文件
        for (const url of unusedUrls) {
            try {
                const filePath = path.join('public', url);
                await fs.unlink(filePath);
            } catch (error) {
                console.error('Delete unused image error:', error);
            }
        }
    }

    // 将 Quill Delta 格式转换为 HTML
    deltaToHtml(delta) {
        if (!delta || !delta.ops) {
            return '';
        }

        let html = '';
        let inList = false;
        let listType = null;
        let listItems = [];

        delta.ops.forEach((op, index) => {
            if (typeof op.insert === 'string') {
                let text = op.insert.replace(/\n/g, ''); // 移除换行符
                if (!text && op.insert === '\n') {
                    if (inList && (index === delta.ops.length - 1 || delta.ops[index + 1]?.attributes?.list !== listType)) {
                        // 结束当前列表
                        html += `<${listType === 'ordered' ? 'ol' : 'ul'}>${listItems.join('')}</${listType === 'ordered' ? 'ol' : 'ul'}>`;
                        inList = false;
                        listItems = [];
                        listType = null;
                    } else if (!inList) {
                        html += '<br>';
                    }
                    return;
                }

                if (op.attributes) {
                    // 处理文本样式
                    if (op.attributes.bold) text = `<strong>${text}</strong>`;
                    if (op.attributes.italic) text = `<em>${text}</em>`;
                    if (op.attributes.underline) text = `<u>${text}</u>`;
                    if (op.attributes.strike) text = `<s>${text}</s>`;
                    if (op.attributes.script === 'super') text = `<sup>${text}</sup>`;
                    if (op.attributes.script === 'sub') text = `<sub>${text}</sub>`;
                    if (op.attributes.link) text = `<a href="${op.attributes.link}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                    
                    // 处理块级样式
                    if (op.attributes.header) {
                        text = `<h${op.attributes.header}>${text}</h${op.attributes.header}>`;
                    } else if (op.attributes.list) {
                        if (!inList || listType !== op.attributes.list) {
                            if (inList) {
                                // 结束前一个列表
                                html += `<${listType === 'ordered' ? 'ol' : 'ul'}>${listItems.join('')}</${listType === 'ordered' ? 'ol' : 'ul'}>`;
                                listItems = [];
                            }
                            inList = true;
                            listType = op.attributes.list;
                        }
                        listItems.push(`<li>${text}</li>`);
                        return;
                    } else if (op.attributes.blockquote) {
                        text = `<blockquote>${text}</blockquote>`;
                    } else if (op.attributes.code) {
                        text = `<pre><code>${text}</code></pre>`;
                    } else if (!inList) {
                        text = `<p>${text}</p>`;
                    }
                } else if (!inList) {
                    text = `<p>${text}</p>`;
                }

                if (!inList) {
                    html += text;
                }
            } else if (op.insert && typeof op.insert === 'object') {
                // 处理图片等嵌入内容
                if (op.insert.image) {
                    const imageHtml = `<img src="${op.insert.image}" alt="图片"${
                        op.attributes ? this.getImageAttributes(op.attributes) : ''
                    }>`;
                    html += imageHtml;
                }
            }
        });

        // 处理最后一个列表（如果有）
        if (inList) {
            html += `<${listType === 'ordered' ? 'ol' : 'ul'}>${listItems.join('')}</${listType === 'ordered' ? 'ol' : 'ul'}>`;
        }

        return html;
    }

    // 获取图片属性
    getImageAttributes(attributes) {
        const attrs = [];
        if (attributes.width) attrs.push(`width="${attributes.width}"`);
        if (attributes.height) attrs.push(`height="${attributes.height}"`);
        if (attributes.style) {
            const styles = [];
            for (const [key, value] of Object.entries(attributes.style)) {
                styles.push(`${key}: ${value}`);
            }
            if (styles.length > 0) {
                attrs.push(`style="${styles.join('; ')}"`);
            }
        }
        return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    }
}

module.exports = {
    newsController: new NewsController(),
    upload
}; 