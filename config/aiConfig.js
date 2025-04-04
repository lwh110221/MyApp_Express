// AI模型配置
module.exports = {
  // 星火大模型配置
  spark: {
    appId: process.env.SPARK_APP_ID || '',
    apiKey: process.env.SPARK_API_KEY || '',
    apiSecret: process.env.SPARK_API_SECRET || '',
    domain: '4.0Ultra',
    sparkUrl: 'wss://spark-api.xf-yun.com/v4.0/chat'
  }
}; 