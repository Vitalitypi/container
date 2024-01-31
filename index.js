const express = require('express')
const bodyParser = require('body-parser')
const { init: initDB, Namer } = require("./db");
const PORT = process.env.PORT || 80

const app = express()

app.use(bodyParser.raw())
app.use(bodyParser.json({}))
app.use(bodyParser.urlencoded({ extended: true }))

app.all('/', async (req, res) => {
  console.log('消息推送', req.body)
  const { ToUserName, FromUserName, MsgType, Content, CreateTime } = req.body
  if (MsgType === 'text') {
    res.send({
      ToUserName: FromUserName,
      FromUserName: ToUserName,
      CreateTime: CreateTime,
      MsgType: 'text',
      Content: await Namer.name()
    })
  } else {
    res.send('success')
  }
})

app.listen(PORT, function () {
  console.log(`运行成功，端口：${PORT}`)
})