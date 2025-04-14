```sql
CREATE TABLE User (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户唯一标识',
    username VARCHAR(255) COMMENT '用户名',
    password VARCHAR(255) COMMENT '用户密码',
    email VARCHAR(255) COMMENT '用户邮箱',
    points INT COMMENT '用户积分',
    status TINYINT COMMENT '用户状态：1-正常，0-禁用',
    email_verified TINYINT(1) COMMENT '邮箱是否已验证',
    created_at TIMESTAMP COMMENT '用户账号创建时间'
) COMMENT '用户表';

CREATE TABLE Admin (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员唯一标识',
    username VARCHAR(255) COMMENT '管理员用户名',
    password VARCHAR(255) COMMENT '管理员密码',
    email VARCHAR(255) COMMENT '管理员邮箱',
    status TINYINT COMMENT '状态：0-禁用，1-启用',
    last_login TIMESTAMP COMMENT '最后登录时间',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间'
) COMMENT '管理员表';

CREATE TABLE Role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    name VARCHAR(50) COMMENT '角色名称',
    code VARCHAR(50) COMMENT '角色编码',
    description VARCHAR(200) COMMENT '角色描述',
    status TINYINT(1) COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间'
) COMMENT '角色表';

CREATE TABLE Permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    name VARCHAR(50) COMMENT '权限名称',
    code VARCHAR(50) COMMENT '权限编码',
    description VARCHAR(200) COMMENT '权限描述',
    status TINYINT(1) COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间'
) COMMENT '权限表';

CREATE TABLE NewsCategory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
    name VARCHAR(50) COMMENT '分类名称',
    code VARCHAR(50) COMMENT '分类编码',
    sort_order INT COMMENT '排序顺序',
    status TINYINT COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间'
) COMMENT '新闻分类表';

CREATE TABLE HelpCategory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
    name VARCHAR(50) COMMENT '分类名称',
    description VARCHAR(200) COMMENT '分类描述',
    sort_order INT COMMENT '排序',
    status TINYINT COMMENT '状态：0-禁用，1-启用'
) COMMENT '求助分类表';

CREATE TABLE CommunityTag (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
    name VARCHAR(50) COMMENT '标签名称',
    status TINYINT COMMENT '状态：0-禁用，1-启用',
    used_count INT COMMENT '使用次数',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间'
) COMMENT '社区标签表';

CREATE TABLE EmailVerificationCode (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '验证码ID',
  email VARCHAR(255) COMMENT '邮箱',
  code VARCHAR(10) COMMENT '验证码',
  expires_at DATETIME COMMENT '过期时间',
  created_at TIMESTAMP COMMENT '创建时间'
) COMMENT '邮箱验证码表';

CREATE TABLE UserProfile (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户资料唯一标识',
    user_id BIGINT COMMENT '关联的用户标识',
    bio TEXT COMMENT '用户简介',
    profile_picture VARCHAR(255) COMMENT '用户头像图片的链接地址',
    FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '属于'
) COMMENT '用户资料表';

CREATE TABLE UserMoment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '动态唯一标识',
    user_id BIGINT COMMENT '发布动态的用户ID',
    content TEXT COMMENT '动态文字内容',
    created_at TIMESTAMP COMMENT '发布时间',
    FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '发布'
) COMMENT '用户动态表';

CREATE TABLE AdminRole (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    admin_id BIGINT COMMENT '管理员ID',
    role_id BIGINT COMMENT '角色ID',
    created_at TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (admin_id) REFERENCES Admin(id) COMMENT '拥有',
    FOREIGN KEY (role_id) REFERENCES Role(id) COMMENT '分配给'
) COMMENT '管理员角色关联表';

CREATE TABLE RolePermission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    role_id BIGINT COMMENT '角色ID',
    permission_id BIGINT COMMENT '权限ID',
    created_at TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (role_id) REFERENCES Role(id) COMMENT '包含',
    FOREIGN KEY (permission_id) REFERENCES Permission(id) COMMENT '授予'
) COMMENT '角色权限关联表';

CREATE TABLE AdminOperationLog (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    admin_id BIGINT COMMENT '管理员ID',
    operation_type VARCHAR(50) COMMENT '操作类型',
    operation_desc TEXT COMMENT '操作描述',
    ip_address VARCHAR(50) COMMENT '操作IP',
    request_data TEXT COMMENT '请求数据',
    response_data TEXT COMMENT '响应数据',
    status_code INT COMMENT 'HTTP状态码',
    created_at TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (admin_id) REFERENCES Admin(id) COMMENT '生成'
) COMMENT '管理员操作日志表';

CREATE TABLE NewsArticle (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '文章ID',
    category_id BIGINT COMMENT '分类ID',
    title VARCHAR(255) COMMENT '文章标题',
    summary VARCHAR(500) COMMENT '文章摘要',
    content LONGTEXT COMMENT '文章内容（富文本格式）',
    cover_image VARCHAR(255) COMMENT '封面图片URL',
    author VARCHAR(50) COMMENT '作者',
    source VARCHAR(100) COMMENT '来源',
    view_count INT COMMENT '浏览次数',
    is_featured TINYINT COMMENT '是否热门：0-否，1-是',
    is_published TINYINT COMMENT '是否发布：0-否，1-是',
    publish_time TIMESTAMP COMMENT '发布时间',
    status TINYINT COMMENT '状态：0-禁用，1-启用',
    created_by BIGINT COMMENT '创建人ID',
    updated_by BIGINT COMMENT '更新人ID',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (category_id) REFERENCES NewsCategory(id) COMMENT '属于',
    FOREIGN KEY (created_by) REFERENCES Admin(id) COMMENT '创建',
    FOREIGN KEY (updated_by) REFERENCES Admin(id) COMMENT '更新'
) COMMENT '新闻文章表';

CREATE TABLE UserIdentity (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '身份ID',
  user_id BIGINT COMMENT '用户ID',
  identity_type VARCHAR(50) COMMENT '身份类型编码',
  status TINYINT COMMENT '状态：0-无效 1-有效',
  certification_time DATETIME COMMENT '认证时间',
  expiration_time DATETIME COMMENT '过期时间',
  meta_data JSON COMMENT '身份扩展信息',
  created_at DATETIME COMMENT '创建时间',
  updated_at DATETIME COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '拥有'
) COMMENT '用户身份表';

CREATE TABLE IdentityCertification (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '认证记录ID',
  user_id BIGINT COMMENT '用户ID',
  identity_type VARCHAR(50) COMMENT '身份类型编码',
  status TINYINT COMMENT '状态：0-待审核 1-通过 2-拒绝',
  certification_data JSON COMMENT '认证资料',
  review_comment TEXT COMMENT '审核意见',
  reviewer_id BIGINT COMMENT '审核人ID',
  review_time DATETIME COMMENT '审核时间',
  created_at DATETIME COMMENT '创建时间',
  updated_at DATETIME COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '申请',
  FOREIGN KEY (reviewer_id) REFERENCES Admin(id) COMMENT '审核'
) COMMENT '身份认证记录表';

CREATE TABLE HelpPost (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '帖子ID',
    user_id BIGINT COMMENT '发帖用户ID',
    title VARCHAR(200) COMMENT '标题',
    content TEXT COMMENT '求助内容',
    images JSON COMMENT '图片列表',
    category_id BIGINT COMMENT '分类ID',
    status TINYINT COMMENT '状态：0-关闭，1-开放，2-已解决',
    view_count INT COMMENT '浏览次数',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '发布',
    FOREIGN KEY (category_id) REFERENCES HelpCategory(id) COMMENT '属于'
) COMMENT '求助帖子表';

CREATE TABLE PointRecord (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '积分记录ID',
  user_id BIGINT COMMENT '用户ID',
  points INT COMMENT '积分变动值',
  type VARCHAR(20) COMMENT '类型：post_create/post_like/comment_create/comment_like/post_delete/comment_delete',
  related_id BIGINT COMMENT '关联ID（帖子ID或评论ID）',
  description VARCHAR(255) COMMENT '积分变动描述',
  created_at TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '拥有'
) COMMENT '积分记录表';

CREATE TABLE UserFollow (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关注记录ID',
  follower_id BIGINT COMMENT '关注者ID',
  followed_id BIGINT COMMENT '被关注者ID',
  created_at TIMESTAMP COMMENT '关注时间',
  FOREIGN KEY (follower_id) REFERENCES User(id) COMMENT '关注',
  FOREIGN KEY (followed_id) REFERENCES User(id) COMMENT '被关注'
) COMMENT '用户关注表';

CREATE TABLE CommunityPost (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '帖子ID',
    user_id BIGINT COMMENT '发帖用户ID',
    title VARCHAR(200) COMMENT '标题',
    content TEXT COMMENT '内容',
    images JSON COMMENT '图片列表',
    tags JSON COMMENT '标签ID数组',
    view_count INT COMMENT '浏览次数',
    like_count INT COMMENT '点赞数',
    comment_count INT COMMENT '评论数',
    status TINYINT COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '发布'
) COMMENT '社区帖子表';

CREATE TABLE ProductCategory (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '类别ID',
  name VARCHAR(50) COMMENT '类别名称',
  description VARCHAR(200) COMMENT '类别描述',
  icon VARCHAR(255) COMMENT '类别图标',
  parent_id BIGINT COMMENT '父类别ID，用于多级分类',
  sort_order INT COMMENT '排序顺序',
  status TINYINT COMMENT '状态：0-禁用，1-启用',
  created_at TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (parent_id) REFERENCES ProductCategory(id) COMMENT '子类别'
) COMMENT '农产品类别表';

CREATE TABLE MomentImage (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '图片唯一标识',
    moment_id BIGINT COMMENT '关联的动态ID',
    image_url VARCHAR(255) COMMENT '图片URL',
    created_at TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (moment_id) REFERENCES UserMoment(id) COMMENT '属于'
) COMMENT '动态图片表';

CREATE TABLE HelpAnswer (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '回答ID',
    post_id BIGINT COMMENT '帖子ID',
    expert_id BIGINT COMMENT '专家用户ID',
    content TEXT COMMENT '回答内容',
    images JSON COMMENT '图片列表',
    is_accepted TINYINT COMMENT '是否被采纳：0-否，1-是',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (post_id) REFERENCES HelpPost(id) COMMENT '回答',
    FOREIGN KEY (expert_id) REFERENCES User(id) COMMENT '提供'
) COMMENT '专家回答表';

CREATE TABLE CommunityComment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评论ID',
    post_id BIGINT COMMENT '帖子ID',
    user_id BIGINT COMMENT '评论用户ID',
    content TEXT COMMENT '评论内容',
    parent_id BIGINT COMMENT '父评论ID，用于回复其他评论',
    status TINYINT COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (post_id) REFERENCES CommunityPost(id) COMMENT '评论',
    FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '发表',
    FOREIGN KEY (parent_id) REFERENCES CommunityComment(id) COMMENT '回复'
) COMMENT '社区评论表';

CREATE TABLE CommunityPostTag (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    post_id BIGINT COMMENT '帖子ID',
    tag_id BIGINT COMMENT '标签ID',
    created_at TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (post_id) REFERENCES CommunityPost(id) COMMENT '使用',
    FOREIGN KEY (tag_id) REFERENCES CommunityTag(id) COMMENT '标记'
) COMMENT '帖子-标签关联表';

CREATE TABLE Product (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '产品ID',
  user_id BIGINT COMMENT '发布用户ID（农户）',
  category_id BIGINT COMMENT '产品类别ID',
  title VARCHAR(100) COMMENT '产品名称',
  description TEXT COMMENT '产品描述',
  price DECIMAL(10,2) COMMENT '产品价格',
  original_price DECIMAL(10,2) COMMENT '原价',
  stock INT COMMENT '库存数量',
  unit VARCHAR(20) COMMENT '计量单位（如：公斤、袋、箱）',
  location VARCHAR(100) COMMENT '产地',
  images JSON COMMENT '产品图片列表',
  attributes JSON COMMENT '产品属性（如：品种、等级、保质期等）',
  is_bulk TINYINT COMMENT '是否批量订购：0-否，1-是',
  min_order_quantity INT COMMENT '最低起订数量',
  status TINYINT COMMENT '状态：0-下架，1-上架',
  is_featured TINYINT COMMENT '是否推荐：0-否，1-是',
  view_count INT COMMENT '浏览次数',
  sales_count INT COMMENT '销售数量',
  created_at TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '发布',
  FOREIGN KEY (category_id) REFERENCES ProductCategory(id) COMMENT '属于'
) COMMENT '农产品信息表';

CREATE TABLE Cart (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '购物车ID',
  user_id BIGINT COMMENT '用户ID',
  created_at TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '拥有'
) COMMENT '购物车表';

CREATE TABLE Order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订单ID',
  order_no VARCHAR(50) COMMENT '订单编号',
  user_id BIGINT COMMENT '用户ID',
  total_amount DECIMAL(10,2) COMMENT '订单总金额',
  status TINYINT COMMENT '订单状态：0-待付款，1-已付款待发货，2-已发货，3-已完成，4-已取消，5-已退款',
  contact_name VARCHAR(50) COMMENT '联系人姓名',
  contact_phone VARCHAR(20) COMMENT '联系人电话',
  address VARCHAR(255) COMMENT '收货地址',
  note VARCHAR(255) COMMENT '订单备注',
  payment_method TINYINT COMMENT '支付方式：1-微信，2-支付宝，3-银行卡',
  payment_time TIMESTAMP COMMENT '支付时间',
  shipping_time TIMESTAMP COMMENT '发货时间',
  tracking_number VARCHAR(50) COMMENT '物流单号',
  shipping_company VARCHAR(50) COMMENT '物流公司',
  completion_time TIMESTAMP COMMENT '完成时间',
  created_at TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '下单'
) COMMENT '订单表';

CREATE TABLE ChatSession (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
  user1_id BIGINT COMMENT '用户1 ID',
  user2_id BIGINT COMMENT '用户2 ID',
  last_message VARCHAR(255) COMMENT '最后一条消息内容',
  last_time TIMESTAMP COMMENT '最后消息时间',
  created_at TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user1_id) REFERENCES User(id) COMMENT '参与',
  FOREIGN KEY (user2_id) REFERENCES User(id) COMMENT '参与'
) COMMENT '聊天会话表';

CREATE TABLE CartItem (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '购物车项ID',
  cart_id BIGINT COMMENT '购物车ID',
  product_id BIGINT COMMENT '产品ID',
  quantity INT COMMENT '数量',
  selected TINYINT COMMENT '是否选中：0-未选中，1-已选中',
  created_at TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (cart_id) REFERENCES Cart(id) COMMENT '包含',
  FOREIGN KEY (product_id) REFERENCES Product(id) COMMENT '选购'
) COMMENT '购物车项表';

CREATE TABLE OrderItem (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订单项ID',
  order_id BIGINT COMMENT '订单ID',
  product_id BIGINT COMMENT '产品ID',
  product_title VARCHAR(100) COMMENT '产品名称（冗余存储，防止产品修改）',
  product_image VARCHAR(255) COMMENT '产品图片',
  price DECIMAL(10,2) COMMENT '购买单价',
  quantity INT COMMENT '购买数量',
  total_amount DECIMAL(10,2) COMMENT '总金额',
  created_at TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (order_id) REFERENCES Order(id) COMMENT '包含',
  FOREIGN KEY (product_id) REFERENCES Product(id) COMMENT '购买'
) COMMENT '订单项表';

CREATE TABLE ChatMessage (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
  session_id BIGINT COMMENT '会话ID',
  sender_id BIGINT COMMENT '发送者ID',
  receiver_id BIGINT COMMENT '接收者ID',
  content TEXT COMMENT '消息内容',
  is_read TINYINT COMMENT '是否已读：0-未读，1-已读',
  content_type TINYINT COMMENT '内容类型：0-文本，1-图片，2-语音，3-视频，4-文件',
  media_url VARCHAR(255) COMMENT '媒体文件URL',
  send_time TIMESTAMP COMMENT '发送时间',
  read_time TIMESTAMP COMMENT '已读时间',
  FOREIGN KEY (session_id) REFERENCES ChatSession(id) COMMENT '属于',
  FOREIGN KEY (sender_id) REFERENCES User(id) COMMENT '发送',
  FOREIGN KEY (receiver_id) REFERENCES User(id) COMMENT '接收'
) COMMENT '聊天消息表';

CREATE TABLE ChatUnreadCount (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
  user_id BIGINT COMMENT '用户ID',
  session_id BIGINT COMMENT '会话ID',
  unread_count INT COMMENT '未读消息数量',
  last_read_time TIMESTAMP COMMENT '上次阅读时间',
  updated_at TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES User(id) COMMENT '拥有',
  FOREIGN KEY (session_id) REFERENCES ChatSession(id) COMMENT '关联'
) COMMENT '未读消息统计表';
```