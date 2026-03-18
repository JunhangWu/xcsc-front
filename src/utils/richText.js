/**
 * 将传入地址转换为可直接访问的绝对地址。
 * 处理场景：绝对地址、协议相对地址、特殊协议、根路径和相对路径。
 *
 * @param {string} url 原始地址
 * @returns {string} 归一化后的地址
 */
function toAbsoluteUrl(url) {
  if (!url) return ''
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `${window.location.protocol}${url}`
  if (/^(data:|blob:|javascript:|mailto:|tel:)/i.test(url)) return url

  const baseApi = (import.meta.env.VITE_APP_BASE_API || '').replace(/\/$/, '')
  const originWithBaseApi = `${window.location.origin}${baseApi}`

  if (url.startsWith('/')) {
    if (baseApi && (url === baseApi || url.startsWith(`${baseApi}/`))) {
      return `${window.location.origin}${url}`
    }
    return `${originWithBaseApi}${url}`
  }

  try {
    return new URL(url, `${originWithBaseApi}/`).href
  } catch (error) {
    return url
  }
}

/**
 * 将富文本 HTML 中所有 img 的 src 统一转换为绝对地址。
 * 解析失败时返回原始 HTML，确保编辑器渲染不受影响。
 *
 * @param {string} html 富文本 HTML 字符串
 * @returns {string} 处理后的 HTML 字符串
 */
export function normalizeEditorHtmlImageSrcToAbsolute(html) {
  if (!html || typeof html !== 'string') return html || ''

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const images = doc.querySelectorAll('img[src]')

    images.forEach((img) => {
      const src = img.getAttribute('src') || ''
      const absoluteSrc = toAbsoluteUrl(src)
      if (absoluteSrc) {
        img.setAttribute('src', absoluteSrc)
      }
    })

    return doc.body.innerHTML
  } catch (error) {
    return html
  }
}
