const router = require('koa-router')()
const webpush = require('web-push')
const http = require('http')
const request = require('request')

router.prefix('/sw')

const vapidKeys = {
  publicKey: 'BOEQSjdhorIf8M0XFNlwohK3sTzO9iJwvbYU-fuXRF0tvRpPPMGO6d_gJC_pUQwBT7wD8rKutpNTFHOHN3VqJ0A',
  privateKey: 'TVe_nJlciDOn130gFyFYP8UiGxxWd3QdH6C5axXpSgM'
}
webpush.setVapidDetails(
  'mailto:mrrs878@foxmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

function pushMessage(subscription, data) {
  webpush.sendNotification(subscription, data).then(data => {
  }).catch(err => {
      console.log('push error', err);
  })
}

function fetch(options) {
  return new Promise(resolve => {
    request(options, (error, response, data) => {
      if (error || response.statusCode !== 200) resolve({ code: -1, msg: '出错了' })
      else resolve(data)
    })
  })
}

router.post('/sub', async ctx => {
  const { endpoint, expirationTime, keys } = ctx.request.body
  const body = { endpoint, expirationTime, ...keys }
  const headers = { Authorization: ctx.request.headers.authorization }
  const res = await fetch({ url: 'https://api.p18c.top/sw/sub', method: 'POST', json: true, body, headers })
  ctx.body = res
});
router.post('/push', async ctx => {
  const headers = { Authorization: ctx.request.headers.authorization }
  const res = await fetch({ url: 'https://api.p18c.top/sw/push', method: 'POST', json: true, body: ctx.request.body, headers })
  if (res.code !== 0) {
    ctx.body = res
    return
  }
  const subs = res.data.map(item => ({ endpoint: item.endpoint, keys: { auth: item.auth, p256dh: item.applicationServerKey } }))
  subs.forEach(item => pushMessage(item, JSON.stringify(ctx.request.body)))
  ctx.body = { code: res.code, msg: res.msg }
});

module.exports = router