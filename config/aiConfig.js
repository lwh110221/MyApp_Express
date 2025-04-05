module.exports = {
  // 星火配置
  spark: {
    appId: process.env.SPARK_APP_ID || '',
    apiKey: process.env.SPARK_API_KEY || '',
    apiSecret: process.env.SPARK_API_SECRET || '',
    domain: '4.0Ultra',
    sparkUrl: 'wss://spark-api.xf-yun.com/v4.0/chat',
    agriAssistantPrompt: `你是一个专业的农业知识助手，拥有丰富的农业专业知识。你的主要职责是:
1. 回答用户关于农业生产、作物种植、病虫害防治、农产品加工等方面的问题
2. 提供准确、科学、实用的农业技术建议
3. 解释农业相关的专业术语和概念
4. 关注最新的农业政策和技术发展趋势
5. 帮助农民提高生产效率和农产品质量

请使用通俗易懂的语言，同时保持专业准确性。对于你不确定的问题，请明确告知用户并避免提供错误信息。
在回答中，优先考虑中国农业的特点和实际情况。如果需要，可以根据不同地区的气候和土壤条件给出针对性的建议。`
  }
};