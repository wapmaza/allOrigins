const httpClient = require('./http-client')
const iconv = require('iconv-lite')

module.exports = getPage

function getPage({ url, format, requestMethod, charset, device }) {
  if (format === 'info' || requestMethod === 'HEAD') {
    return getPageInfo(url, device)
  } else if (format === 'raw') {
    return getRawPage(url, requestMethod, charset, device)
  }

  return getPageContents(url, requestMethod, charset, device)
}

async function getPageInfo(url, device) {
  const { response, error } = await request(url, 'HEAD', false, null, device)
  if (error) return processError(error)

  return {
    url: url,
    content_type: response.headers['content-type'],
    content_length: +response.headers['content-length'] || -1,
    http_code: response.statusCode,
  }
}

async function getRawPage(url, requestMethod, charset, device) {
  const { content, response, error } = await request(
    url,
    requestMethod,
    true,
    charset,
    device
  )
  if (error) return processError(error)

  const contentLength = Buffer.byteLength(content)
  return {
    content,
    contentType: response.headers['content-type'],
    contentLength,
  }
}

async function getPageContents(url, requestMethod, charset, device) {
  const { content, response, error } = await request(
    url,
    requestMethod,
    false,
    charset,
    device
  )
  if (error) return processError(error)

  const contentLength = Buffer.byteLength(content)
  return {
    contents: content.toString(),
    status: {
      url: url,
      content_type: response.headers['content-type'],
      content_length: contentLength,
      http_code: response.statusCode,
    },
  }
}

async function request(url, requestMethod, raw = false, charset = null, device = null) {
  try {
    const options = {
      method: requestMethod,
      decompress: !raw,
    }

    // create a got instance for the requested device (e.g. 'mobile') if available
    let http = httpClient && httpClient.got
    if (httpClient && httpClient.createGotInstance) {
      http = httpClient.createGotInstance(device).got
    }

    const response = await http(url, options)
    if (options.method === 'HEAD') return { response }

    return processContent(response, charset)
  } catch (error) {
    return { error }
  }
}

async function processContent(response, charset) {
  const res = { response: response, content: response.body }
  if (charset && iconv.encodingExists(charset)) {
    res.content = iconv.decode(res.content, charset)
  }
  return res
}

async function processError(e) {
  const { response } = e
  if (!response) return { contents: null, status: { error: e } }

  const { url, statusCode: http_code, headers, body } = response
  const contentLength = Buffer.byteLength(body)

  return {
    contents: body.toString(),
    status: {
      url,
      http_code,
      content_type: headers['content-type'],
      content_length: contentLength,
    },
  }
}
