const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql2');
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
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database');
});
const app = express()

app.use(bodyParser.raw())
app.use(bodyParser.json({}))
app.use(bodyParser.urlencoded({ extended: true }))

app.all('/', async (req, res) => {
  const json = await getMysql()
  console.log(json)
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

async function getMysql(){
  return connection.query('SELECT * FROM test', (error, results, fields) => {
    if (error) {
      console.error('Error querying database: ' + error.stack);
      return {
        code: -1
      }
    }
    return {
      code:0,
      data:results
    }
  });
}