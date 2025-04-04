const WebSocket = require('ws');
const crypto = require('crypto');
const aiConfig = require('../config/aiConfig');

class SparkService {
  constructor() {
    this.config = aiConfig.spark;
  }

  // 根据官方示例生成WebSocket URL和鉴权参数
  getWebsocketUrl() {
    return new Promise((resolve, reject) => {
      try {
        const apiKey = this.config.apiKey;
        const apiSecret = this.config.apiSecret;
        const url = this.config.sparkUrl;
        
        // 在服务端使用当前时间
        const date = new Date().toGMTString();
        const algorithm = 'hmac-sha256';
        const headers = 'host date request-line';
        const host = 'spark-api.xf-yun.com';
        
        // 根据官方示例构建签名原文
        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v4.0/chat HTTP/1.1`;
        
        // 使用HMAC-SHA256计算签名
        const signature = crypto.createHmac('sha256', apiSecret)
          .update(signatureOrigin)
          .digest('base64');
        
        // 构建授权内容
        const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
        // Base64编码
        const authorization = Buffer.from(authorizationOrigin).toString('base64');
        
        // 构建最终的WebSocket URL
        const wsUrl = `${url}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;
        
        resolve(wsUrl);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 流式调用星火API
  async streamChat(messages, onData, onError, onEnd) {
    try {
      // 获取WebSocket URL
      const wsUrl = await this.getWebsocketUrl();
      
      // 创建WebSocket连接
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log('WebSocket连接已建立');
        
        // 处理历史消息格式
        const formattedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // 构建请求数据，参考官方示例格式
        const data = {
          header: {
            app_id: this.config.appId,
            uid: "user_" + Date.now() // 用户会话id，随机生成
          },
          parameter: {
            chat: {
              domain: this.config.domain,
              temperature: 0.7,
              max_tokens: 2048
            }
          },
          payload: {
            message: {
              text: formattedMessages
            }
          }
        };
        
        // 发送数据
        ws.send(JSON.stringify(data));
      });
      
      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data);
          
          // 处理返回结果
          if (response.header.code !== 0) {
            onError(new Error(`调用出错: ${response.header.message}, 错误码: ${response.header.code}`));
            ws.close();
            return;
          }
          
          // 获取返回的文本内容
          const content = response.payload.choices.text[0].content;
          onData(content);
          
          // 检查是否结束
          if (response.header.status === 2) {
            ws.close();
            onEnd();
          }
        } catch (err) {
          onError(err);
          ws.close();
        }
      });
      
      ws.on('error', (err) => {
        console.error('WebSocket错误:', err);
        onError(err);
      });
      
      ws.on('close', () => {
        console.log('WebSocket连接已关闭');
      });
      
    } catch (err) {
      console.error('创建WebSocket连接失败:', err);
      onError(err);
    }
  }
}

module.exports = new SparkService(); 