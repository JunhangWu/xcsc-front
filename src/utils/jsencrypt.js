import JSEncrypt from 'jsencrypt/bin/jsencrypt.min'

// 密钥对生成 http://web.chacuo.net/netrsakeypair

const publicKey = '-----BEGIN PUBLIC KEY-----\n' +
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApJn6onqTP5P7ifRHyhZe\n' +
  'ZEAvUw5tayO2sHb5XEeOjVPtBYrowjKibIkaTi8RjzPsDXinTN/z4843R6L+NbZZ\n' +
  'vElDwruP1W9T3idZe9DfCpnTG8lFevSmEQoaHo2VaJlWQBk5Vah2d5bKzCUdJHVP\n' +
  'G5zvru3iUMbQCubkXEEudh620J8yjcd7dpBX4p7lmEPtGbuWCShWpzp8kxkZpbsW\n' +
  'X2tY/j2/nn1+fBNpAOZsOM5hfyTMHika8eHPPDLFJjsBKySrkAQSlZZPZieRGm40\n' +
  '/ElB7RIGvKMuEQy6o+HKpOr+4f+oDZ+pHN5O4GKsQAqv5CD7sdCo/XKjDXQfSc/E\n' +
  'HwIDAQAB\n' +
  '-----END PUBLIC KEY-----\n'

const privateKey = '-----BEGIN PRIVATE KEY-----\n' +
  'MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCkmfqiepM/k/uJ\n' +
  '9EfKFl5kQC9TDm1rI7awdvlcR46NU+0FiujCMqJsiRpOLxGPM+wNeKdM3/PjzjdH\n' +
  'ov41tlm8SUPCu4/Vb1PeJ1l70N8KmdMbyUV69KYRChoejZVomVZAGTlVqHZ3lsrM\n' +
  'JR0kdU8bnO+u7eJQxtAK5uRcQS52HrbQnzKNx3t2kFfinuWYQ+0Zu5YJKFanOnyT\n' +
  'GRmluxZfa1j+Pb+efX58E2kA5mw4zmF/JMweKRrx4c88MsUmOwErJKuQBBKVlk9m\n' +
  'J5EabjT8SUHtEga8oy4RDLqj4cqk6v7h/6gNn6kc3k7gYqxACq/kIPux0Kj9cqMN\n' +
  'dB9Jz8QfAgMBAAECggEAe7FeoHTebJunHh9dR2cR3eJB7fdckHPRGMD/WLJJVLkp\n' +
  '181wZmcomclZ5EEIwAVzsRfnGST+oUVZU1MQF4sF2jFwY0kRqIG1k68cVqg6xDue\n' +
  'YjYZKXHpzco6oJUjHuyD3T1XUaB8DhhaI5kMUlZ5cTW5BEqtlKgitN6X4x/0azwq\n' +
  '/CuGYXleTO8JmJ4Snw/hP4NOZkED+jDyNfG94Mhg7mWdOHkVX9ZIiF5vlAV2WsU6\n' +
  'jPyCsZUR3jVbeu3C3slIO5dZDNpEZtFx56ibk1NhfBBg/jlLW8dSabGRyqTWvKIX\n' +
  'K4zRDIYQ1a7zJX4SKnnkhKzDCeuP5DKm3BviyuVP6QKBgQDOxpjeSfrK4dC0nzCq\n' +
  '7Vzg324wCwU9QqHsvHtspsY8c31TQEx1GEwob+mNXDp6uGOpeVp51cc9vfbM6lgp\n' +
  '0afIWEho1k+3qpA3Hy1YMnzMU2u8kZmMiVELD0VZJdqfHSHkRi+PHKoda+o3xJep\n' +
  'B7+NBEmPB3uxTaBcVZBrF4e/9QKBgQDLyS5onYUHwE6DtSqLNggXHvEmDFyxUjtG\n' +
  'boOqX5UGtu68jsyz4RKLxtDvTiDx4+kCdTtFpU87WVElzOF2zPeHdKMWwPxA7Ase\n' +
  'G+Sjf4OPE4fQlKndzjxMc3yf8jD55uVIol93tfXdt9jlEyXB1Jlsqc5ZobSGVBPm\n' +
  '0f2F80ULQwKBgBjs36iMCmtCZUIgnmE8U6HXzRSFf5Au5A4Bem9Sezr2QPk0GwNS\n' +
  'dnu5YdHkeDgq2fin5DwjhOzwZTu2VAJWf38rBS9+BgYBzXiXjYPAMkL/G1GTy4qh\n' +
  'Ut+ea6Gfaocbn+ZAf6MktWzugUFPtWhuwqxhA+z13fc1gEshFVOTdo2xAoGAbk8J\n' +
  'OwHBJ8/18B9Z1x85Q+Kw4Eqixi1f/qEFzmyMy6SsGA8oSVpU4qqNIGxnMuiOkZEJ\n' +
  's4pnGBYh8dc0WE1c08rUGRX/tdjPr82jdskoWoNU6hf+1xyy0SNWW3ILBsrwY9/Y\n' +
  '04EAhLLmyiESOBivr/0+wI/imy/Z0gDrPd3QCucCgYAHPSys4gS+/mbh/D9CbkH3\n' +
  'AVSyd8FCvB3YeqArj227a8a+PFnrndCqaEK5kdPcbjEP1jwp66gb4UXi/9Dm9BXf\n' +
  'NHysEzZqYaA/w35M70kBuNR/Ayhnb3sL4G/REgWKXcohoLrRNEN0R6PlBuEyAMKH\n' +
  '07qL1mx3jblKdvUoGn5OTg==\n' +
  '-----END PRIVATE KEY-----\n'

// 加密
export function encrypt(txt) {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey) // 设置公钥
  return encryptor.encrypt(txt) // 对数据进行加密
}

// 解密
export function decrypt(txt) {
  const encryptor = new JSEncrypt()
  encryptor.setPrivateKey(privateKey) // 设置私钥
  return encryptor.decrypt(txt) // 对数据进行解密
}

