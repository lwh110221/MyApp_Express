const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * 发送电子邮件
   * @param {string} to - 收件人地址
   * @param {string} subject - 邮件主题
   * @param {string} html - 邮件HTML内容
   * @returns {Promise<object>} - 发送结果
   */
  async sendEmail(to, subject, html) {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('发送邮件失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 发送邮箱验证码邮件
   * @param {string} to - 收件人地址
   * @param {string} username - 用户名
   * @param {string} verificationCode - 验证码
   * @returns {Promise<object>} - 发送结果
   */
  async sendVerificationCodeEmail(to, username, verificationCode) {
    try {
      // 读取邮件模板
      const templatePath = path.join(__dirname, '../templates/emailVerificationCode.html');
      const template = await fs.readFile(templatePath, 'utf8');
      
      // 编译模板
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate({
        username,
        verificationCode
      });

      // 发送邮件
      return await this.sendEmail(to, '邮箱验证码', html);
    } catch (error) {
      console.error('发送邮箱验证码邮件失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService(); 