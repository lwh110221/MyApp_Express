const svgCaptcha = require('svg-captcha');

// 生成验证码
exports.generateCaptcha = (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4, // 验证码长度
    noise: 2, // 干扰线条数
    color: true, // 验证码字符颜色
    background: '#cee8ff' // 背景色
  });
  
  // 将验证码存入 session
  req.session.captcha = captcha.text.toLowerCase();
  
  res.type('svg');
  res.status(200).send(captcha.data);
};

// 验证验证码
exports.verifyCaptcha = (req, res, next) => {
  const { captcha } = req.body;
  
  if (!captcha || !req.session.captcha) {
    return res.status(400).json({ message: '验证码已过期' });
  }

  if (captcha.toLowerCase() !== req.session.captcha) {
    return res.status(400).json({ message: '验证码错误' });
  }

  // 验证通过后清除session中的验证码
  req.session.captcha = null;
  next();
}; 