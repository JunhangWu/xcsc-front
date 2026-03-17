import JSEncrypt from 'jsencrypt/bin/jsencrypt.min'

// 密钥对生成 http://web.chacuo.net/netrsakeypair

const publicKey = '-----BEGIN PUBLIC KEY-----\n' +
'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq0xrcEVTHnGLX2dWFS19\n' +
'9lLlY8wNPnpLP7MjdoDA0unQrdt+Hz9l6SRhoNESDOY22eM3fVKkoxxghnk2rz89\n' +
'AgpU8Km6I7CzX1tKtle2FyqsPjGtXBvj8y27gDcZiZg3pV/Ym2Z2zSHZ+pCjvpag\n' +
'kiTBIJpaO9V7D/is6bMWLm9L8mymCiwDQsZ1nitqL8TlgAAIpurKkRZdvS0GNgHm\n' +
'oC3MwT9KS15SbZOQsVVhgPswvhrCFH9az/bkCD0iWbml7xMeDlbgZrVdVE6n+nDW\n' +
'RYNmXzCJRnHMWkWoyT7KEBSgTr/4s6RaJnX+yzGEgkhMIGXx06c8hbx0TKnLw1KR\n' +
'hQIDAQAB\n' +
'-----END PUBLIC KEY-----\n';

// 加密
export function encrypt(txt) {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey) // 设置公钥
  return encryptor.encrypt(txt) // 对数据进行加密
}
