const WebSocket = require('ws');
const crypto = require('crypto');
const aiConfig = require('../config/aiConfig');

class SparkService {
  constructor() {
    this.config = aiConfig.spark;
  }

  getWebsocketUrl() {
    return new Promise((resolve, reject) => {
      try {
        const apiKey = this.config.apiKey;
        const apiSecret = this.config.apiSecret;
        const url = this.config.sparkUrl;
        
        const date = new Date().toGMTString();
        const algorithm = 'hmac-sha256';
        const headers = 'host date request-line';
        const host = 'spark-api.xf-yun.com';
        
        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v4.0/chat HTTP/1.1`;
        
        const signature = crypto.createHmac('sha256', apiSecret)
          .update(signatureOrigin)
          .digest('base64');
        
        const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
        const authorization = Buffer.from(authorizationOrigin).toString('base64');
        
        const wsUrl = `${url}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;
        
        resolve(wsUrl);
      } catch (error) {
        reject(error);
      }
    });
  }

  async streamChat(messages, onData, onError, onEnd) {
    try {
      const wsUrl = await this.getWebsocketUrl();
      
      // 创建WebSocket连接
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log('WebSocket连接已建立');
        
        // 检查是否为农业知识助手的对话
        const isAgriChat = true; // 未来可能会根据不同的聊天类型设置不同的标志
        
        // 准备消息列表
        let formattedMessages = [];
        
        // 如果是农业知识助手对话，添加系统提示作为第一条消息
        if (isAgriChat && this.config.agriAssistantPrompt) {
          // 只有当用户的第一条消息不是系统提示时，才添加系统提示
          if (!(messages.length > 0 && messages[0].role === 'system')) {
            formattedMessages.push({
              role: 'system',
              content: this.config.agriAssistantPrompt
            });
          }
        }
        
        // 添加用户的消息
        formattedMessages = formattedMessages.concat(messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })));
        
        const data = {
          header: {
            app_id: this.config.appId,
            uid: "user_" + Date.now()
          },
          parameter: {
            chat: {
              domain: this.config.domain,
              temperature: 0.7,
              max_tokens: 4096
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