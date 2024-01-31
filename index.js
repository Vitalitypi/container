const express = require('express')
const bodyParser = require('body-parser')

const PORT = process.env.PORT || 80

const app = express()

app.use(bodyParser.raw())
app.use(bodyParser.json({}))
app.use(bodyParser.urlencoded({ extended: true }))

app.all('/', async (req, res) => {
  console.log('消息推送', req.body)
  const { ToUserName, FromUserName, MsgType, Content, CreateTime } = req.body
  if (MsgType === 'text') {
    if (Content === '回复文字') {
      res.send({
        ToUserName: FromUserName,
        FromUserName: ToUserName,
        CreateTime: CreateTime,
        MsgType: 'text',
        Content: '这是回复的消息'
      })
    } else if (Content === '回复图片') {
      res.send({
        ToUserName: FromUserName,
        FromUserName: ToUserName,
        CreateTime: CreateTime,
        MsgType: 'image',
        Image: {
          MediaId: 'P-hoCzCgrhBsrvBZIZT3jx1M08WeCCHf-th05M4nac9TQO8XmJc5uc0VloZF7XKI'
        }
      })
    } else if (Content === '回复语音') {
      res.send({
        ToUserName: FromUserName,
        FromUserName: ToUserName,
        CreateTime: CreateTime,
        MsgType: 'voice',
        Voice: {
          MediaId: '06JVovlqL4v3DJSQTwas1QPIS-nlBlnEFF-rdu03k0dA9a_z6hqel3SCvoYrPZzp'
        }
      })
    } else if (Content === '回复视频') {
      res.send({
        ToUserName: FromUserName,
        FromUserName: ToUserName,
        CreateTime: CreateTime,
        MsgType: 'video',
        Video: {
          MediaId: 'XrfwjfAMf820PzHu9s5GYsvb3etWmR6sC6tTH2H1b3VPRDedW-4igtt6jqYSBxJ2',
          Title: '微信云托管官方教程',
          Description: '微信官方团队打造，贴近业务场景的实战教学'
        }
      })
    } else if (Content === '回复音乐') {
      res.send({
        ToUserName: FromUserName,
        FromUserName: ToUserName,
        CreateTime: CreateTime,
        MsgType: 'music',
        Music: {
          Title: 'Relax｜今日推荐音乐',
          Description: '每日推荐一个好听的音乐，感谢收听～',
          MusicUrl: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U',
          HQMusicUrl: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U',
          ThumbMediaId: 'XrfwjfAMf820PzHu9s5GYgOJbfbnoUucToD7A5HFbBM6_nU6TzR4EGkCFTTHLo0t'
        }
      })
    } else if (Content === '回复图文') {
      res.send({
        ToUserName: FromUserName,
        FromUserName: ToUserName,
        CreateTime: CreateTime,
        MsgType: 'news',
        ArticleCount: 1,
        Articles: [{
          Title: 'Relax｜今日推荐音乐',
          Description: '每日推荐一个好听的音乐，感谢收听～',
          PicUrl: 'https://y.qq.com/music/photo_new/T002R300x300M000004NEn9X0y2W3u_1.jpg?max_age=2592000',
          Url: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U'
        }]
      })
    } else {
      res.send('success')
    }
  } else {
    res.send('success')
  }
})

app.listen(PORT, function () {
  console.log(`运行成功，端口：${PORT}`)
})