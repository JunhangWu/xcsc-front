const PDF_EXTENSION = 'pdf'

function normalizeUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `${window.location.protocol}${url}`
  try {
    return new URL(url, window.location.origin).href
  } catch (error) {
    return url
  }
}

function getFileExtension(url) {
  if (!url) return ''
  const cleanUrl = url.split('?')[0].split('#')[0]
  const dotIndex = cleanUrl.lastIndexOf('.')
  if (dotIndex < 0) return ''
  return cleanUrl.slice(dotIndex + 1).toLowerCase()
}

export function isPreviewablePdf(url) {
  const ext = getFileExtension(url)
  return ext === PDF_EXTENSION
}

export function openPdfPreview(url) {
  if (!url) return false
  const normalizedUrl = normalizeUrl(url)
  const ext = getFileExtension(normalizedUrl)
  let previewUrl = ''

  if (ext === PDF_EXTENSION) {
    previewUrl = normalizedUrl
  } else {
    return false
  }

  window.open(previewUrl, '_blank', 'noopener,noreferrer')
  return true
}
