(() => {
  const { headers } = $request
  // 如果是来自 Scriptable 的请求
  if (!$response && /iPhone OS 16_2/.test(headers['User-Agent'])) {
    if (!headers.Authorization) {
      const token = $persistentStore.read('$10010hb.token')
      if (token) {
        headers.Authorization = token
      }
    }
    $done({ headers })
    return
  }

  if (!$response) {
    $done({})
    return
  }

  const { status } = $response
  if (status !== 200) $done({})

  let { body } = $response
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch (e) {
      $done({})
      return
    }
    if (body.success) {
      const { headers } = $request
      const token = headers.Authorization
      if (token) {
        $persistentStore.write(token, '$10010hb.token')
        $notification.post('Scriptore', '10010hb', token)
      }
    }
  }
  $done({})
})()
