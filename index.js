const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql2/promise');
const PORT = process.env.PORT || 80
// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;
const [host_mysql, port_mysql] = MYSQL_ADDRESS.split(":");
// 创建mysql连接
const connection = mysql.createConnection({ 
  host: host_mysql,
  port: port_mysql,
  user: MYSQL_USERNAME, 
  password: MYSQL_PASSWORD, 
  database: 'nodejs_demo' 
});
const app = express()

app.use(bodyParser.raw())
app.use(bodyParser.json({}))
app.use(bodyParser.urlencoded({ extended: true }))

app.all('/', async (req, res) => {
  try { 
    const [rows, fields] = await connection.execute('SELECT * FROM test');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  console.log(rows,fields)
  console.log('消息推送', req.body)
  const { ToUserName, FromUserName, MsgType, Content, CreateTime } = req.body
  if (MsgType === 'text') {
    res.send({
      ToUserName: FromUserName,
      FromUserName: ToUserName,
      CreateTime: CreateTime,
      MsgType: 'text',
      Content: '这是回复的消息'
    })
  } else {
    res.send('success')
  }
})

app.listen(PORT, function () {
  console.log(`运行成功，端口：${PORT}`)
})
