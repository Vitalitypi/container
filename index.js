const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql2/promise');
const rp = require('request-promise');
const CryptoJS = require('crypto-js');
const PORT = process.env.PORT || 80
// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;
const [host_mysql, port_mysql] = MYSQL_ADDRESS.split(":");
const app = express()

app.use(bodyParser.raw())
app.use(bodyParser.json({}))
app.use(bodyParser.urlencoded({ extended: true }))

app.all('/', async (req, res) => {
  try {
    // 创建mysql连接
    const connection = await mysql.createConnection({ 
      host: host_mysql,
      port: port_mysql,
      user: MYSQL_USERNAME, 
      password: MYSQL_PASSWORD, 
      database: 'nodejs_demo' 
    });
    const [rows, fields] = await connection.execute('SELECT * FROM test');
    console.log(rows)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  console.log('消息推送', req.body)
  const { ToUserName, FromUserName, MsgType, Content, CreateTime } = req.body
  if (MsgType === 'text') {
    let ans = await yiso({FromUserName:FromUserName,ToUserName:ToUserName},Content,1,0)
    console.log(ans)
    res.send(ans.json)
  } else {
    res.send('success')
  }
})

app.listen(PORT, function () {
  console.log(`运行成功，端口：${PORT}`)
})

async function yiso(event, keyword, page, pan, channel){
  let json = {
      token:'2cb5a1da-05c5-458b-834c-e31fd606dae5',
      JSESSIONID:'9D47FDAD4BCC3FCF864CCD82ACC1D8D4'
  }
  const url = 'https://yiso.fun/api/search?name='
  let uri = url+encodeURI(keyword)+'&pageNo='+page
  var options = {
      method: 'GET',
      uri: uri,
      headers: {
        'authority': 'yiso.fun',
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'no-cache',
        'cookie': '__51vcke__JkIGvjjs25ETn0wz=c1bc85b3-c9c6-59c9-a555-8b23626d612d; __51vuft__JkIGvjjs25ETn0wz=1682834089502; satoken='+json.token+'; __51uvsct__JkIGvjjs25ETn0wz=17; JSESSIONID='+json.JSESSIONID+'; __vtins__JkIGvjjs25ETn0wz={"sid": "b5c1cd5d-4864-5863-b766-bd0d091696c4", "vd": 15, "stt": 66015, "dr": 3771, "expires": 1683971393801, "ct": 1683969593801}',
        'pragma': 'no-cache',
        'referer': 'https://yiso.fun/info?searchKey=%E9%98%BF%E5%87%A1%E8%BE%BE',
        'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
      }
  };
  const key = '4OToScUFOaeVTrHE';
  const iv = '9CLGao1vHKqm17Oz';
  let types = {
    0:['全部'],
    1:['阿里','ali'],
    2:['百度','baidu'],
    3:['夸克','quark'],
    4:['迅雷','xunlei']
  }
  console.log(json)
  let next = page+1
  let nextWord = keyword+'|_|'
  if(pan>0){
    uri = uri + '&from=' + types[pan][1]
  }
  console.log(uri)
  // 定义更换网盘搜索的消息
  let panmsg = ''
  for(let i=0;i<5;i++){
    if(i==pan){
      continue
    }
    panmsg += '<a href="weixin://bizmsgmenu?msgmenucontent='+nextWord+1+'|_|'+i+'&msgmenuid=1">'+types[i][0]+'</a>、'
  }
  let msg = ''
  return await rp(options).then(res=>{
    let ans = null
    try {
      ans = JSON.parse(res)
    }catch(exception){
      //出现错误
        console.log(exception.message);
        return {
          json:{
            ToUserName: event.FromUserName,
            FromUserName: event.ToUserName,
            CreateTime: Date.parse(new Date())/1000,
            MsgType: 'text',
            Content: msg+"抱歉，服务器暂时出现故障，正在全速抢修！\n\n点击这里"+'<a data-miniprogram-appid="wx3848b063dfdee61c" data-miniprogram-path="pages/search/index">跳转至小程序</a>获取资源~'
          },
          code:-1
        }
    }
    if(ans['code']==200&&ans['msg']=='SUCCESS'&&ans.data.total>0){
      var infos = ans.data
      let cnt = 0
      msg+="以下是检索结果(共有"+infos.total+"条)：\n"
      for (let i = 0; i < infos.list.length; i++) {
        cnt++
        let info = infos.list[i];
        let ciphertext = info.url
        // 通过 CryptoJS 加密库进行解密
        let decrypted = CryptoJS.AES.decrypt(
          {
            ciphertext: CryptoJS.enc.Base64.parse(ciphertext)
          },
          CryptoJS.enc.Utf8.parse(key),
          {
            iv: CryptoJS.enc.Utf8.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          }
        );
        let url_ = decrypted.toString(CryptoJS.enc.Utf8)
        msg+=(i+1)+".来源："+info.from+"\n链接：" + url_ + '\n' //'<a href="' + url_ + '">点我</a>'
        for (let j = 0; info.fileCount > 0 && j < info.fileInfos.length && j < 1; j++) {
          const file = info.fileInfos[j];
          msg+="——"+(j+1)+"."+file.fileName+"...\n"
        }
        if(i == infos.list.length-1){
          if(infos.total<=page*10){
            next = 1
          }
          end = '\n<a href="http://jg.doghun.com/fast/visitor?lg=12508920&s=26182&id=241&client=3&ly=tg">点我玩休闲小游戏</a>'
          end += '\n<a href="http://www.sogohosting.com">点我免费在线观看影视</a>\n'
          end += "由于限制，单次只能回复500个字\n"
          end += '当前页数:' + page + '\n当前搜索的网盘类型为：'+types[pan][0] + '\n您可以点击以下类型指定搜索:\n' + panmsg + '\n'
          end += '\n<a href="weixin://bizmsgmenu?msgmenucontent='+nextWord+next+'|_|'+pan+'&msgmenuid=1">点我获取下一页</a>\n求求朋友们不要取消关注呀！'
          msg = msg.substring(0,1100-end.length-1) + '... ...\n' + end
          break
        }
      }
      return {
        json:{
          ToUserName: event.FromUserName,
          FromUserName: event.ToUserName,
          CreateTime: Date.parse(new Date())/1000,
          MsgType: 'text',
          Content: msg
        },
        code:cnt
      }
    }else{
      return {
        json:{
          ToUserName: event.FromUserName,
          FromUserName: event.ToUserName,
          CreateTime: Date.parse(new Date())/1000,
          MsgType: 'text',
          Content: msg+"抱歉，服务器暂时出现故障，正在全速抢修！\n\n点击这里"+'<a data-miniprogram-appid="wx3848b063dfdee61c" data-miniprogram-path="pages/search/index">跳转至小程序</a>获取资源~'
        },
        code:0
      }
    }
  })
}