const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql2/promise');
const rp = require('request-promise');
const CryptoJS = require('crypto-js');
const axios = require('axios')
const btoa = require('btoa');
const PORT = process.env.PORT || 80
// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;
const [host_mysql, port_mysql] = MYSQL_ADDRESS.split(":");
const app = express()

app.use(bodyParser.raw())
app.use(bodyParser.json({}))
app.use(bodyParser.urlencoded({ extended: true }))

app.all('/', async (req, res) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  let token = "", JSESSIONID = ""
  try {
    // 创建mysql连接
    const connection = await mysql.createConnection({ 
      host: host_mysql,
      port: port_mysql,
      user: MYSQL_USERNAME, 
      password: MYSQL_PASSWORD, 
      database: 'nodejs_demo'
    });
    const [rows, fields] = await connection.execute('SELECT * FROM yiso');
    console.log(rows[0])
    token = rows[0]['token']
    JSESSIONID = rows[0]['JSESSIONID']
    if(Math.abs(dayOfWeek-rows[0]['day'])>3){
      // 获取新的yiso token
      let login = await yisoLogin()
      token = login['token']
      JSESSIONID = login['JSESSIONID']
      // 写入数据库
      await connection.execute('INSERT INTO yiso (day,token,JSESSIONID) VALUES (?,?,?)',[dayOfWeek,token,JSESSIONID]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  console.log('消息推送', req.body)
  const { ToUserName, FromUserName, MsgType, Content, CreateTime } = req.body
  if (MsgType === 'text') {
    let ans = await yiso({FromUserName:FromUserName,ToUserName:ToUserName},Content,1,0,token,JSESSIONID)
    console.log(ans)
    res.send(ans.json)
  } else {
    res.send('success')
  }
})

app.listen(PORT, function () {
  console.log(`运行成功，端口：${PORT}`)
})

async function yiso(event, keyword, page, pan, channel,token,JSESSIONID){
  let json = {
      token: token,
      JSESSIONID: JSESSIONID
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

// 云函数入口函数
async function yisoLogin() {
  //尝试15次
  let token = ""
  let JSESSIONID = ""
  for (let i = 0; i < 15; i++) {
    // 获取验证码图片以及JSESSIONID
    let ans2 = await getBase64Img()
    if (ans2.code == 404) {
      console.log(404)
      return {
        code: 404
      }
    }
    //获取验证码
    let ans3 = await getCode(ans2.base64)
    if (ans3.data == -1) {
      continue
    }
    //进行登录
    let res = await Login(ans2.JSESSIONID, ans3.data)
    if (res.code == 1) {
      //登陆成功
      token = res.token
      JSESSIONID = ans2.JSESSIONID
      break
    }
  }
  console.log("更新数据：",{
    token: token,
    JSESSIONID: JSESSIONID,
    time: new Date(),
  })
  return {
    token: token,
    JSESSIONID: JSESSIONID,
    time: new Date(),
  }
}

//返回JSESSIONID、Base64
async function getBase64Img() {
  return await axios.get('https://yiso.fun/api/user/login/captcha?t=1690017708879', {
    responseType: 'arraybuffer', headers: {
      "Cookie": '__vtins__JkIGvjjs25ETn0wz=%7B%22sid%22%3A%20%22272ecdb0-a2ae-5358-9bc9-b6b1d4fb6b0c%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201690019374032%2C%20%22ct%22%3A%201690017574032%7D; __51uvsct__JkIGvjjs25ETn0wz=4; __51vcke__JkIGvjjs25ETn0wz=105c946b-8095-5c9b-9a40-1f541389079f; __51vuft__JkIGvjjs25ETn0wz=1690017574036'
    }
  }).then(res => {
    // console.log("begin:",res.headers)
    let data = btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))
    let jsessionid = ''
    try {
      jsessionid = res.headers['set-cookie'][0].substring(11, 43)
      return {
        code: 200,
        base64: data,
        JSESSIONID: jsessionid
      }
    } catch (error) {
      console.log(error.name + "：" + error.message)
      console.log(res.headers)
      return {
        code: 404
      }
    }

  })

}
// 进行ocr识别获取验证码
async function getCode(baseImg) {
  var options = {
    'method': 'POST',
    'uri': 'http://api.jfbym.com/api/YmServer/customApi',
    'headers': {
    },
    formData: {
      'image': baseImg,
      'token': 'y1Y-MH4cSKbT-gh1AStrpkODA1XCWFlnQKD8l8Yf6GY',
      'type': '10110'
    }
  };
  return await rp(options).then(res => {
    let json = JSON.parse(res)
    if (json.data.code == 0) {
      return {
        code: 0,
        data: json.data.data
      }
    }
    return {
      code: -1,
      data: 'xxxx'
    }
  })
}
//进行登录操作
async function Login(JSESSIONID, code) {
  console.log(code)
  var options = {
    'method': 'POST',
    'url': 'https://yiso.fun/api/user/login',
    headers: {
      'authority': 'yiso.fun',
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'cookie': '__51uvsct__JkIGvjjs25ETn0wz=1; __51vcke__JkIGvjjs25ETn0wz=9d90a4a2-0504-57d9-8468-214639305dc1; __51vuft__JkIGvjjs25ETn0wz=1681393485262; _tcnyl=1; JSESSIONID=3460CA74A51B633E1DBBA756BD62C35F; satoken=d5811251-ccf5-4c16-bb92-d2f7a41fdf0e; __vtins__JkIGvjjs25ETn0wz=%7B%22sid%22%3A%20%223d908813-ae49-54b0-8cae-5f021270751d%22%2C%20%22vd%22%3A%208%2C%20%22stt%22%3A%202313742%2C%20%22dr%22%3A%207205%2C%20%22expires%22%3A%201681397599000%2C%20%22ct%22%3A%201681395799000%7D; JSESSIONID=' + JSESSIONID,
      'origin': 'https://yiso.fun',
      'pragma': 'no-cache',
      'referer': 'https://yiso.fun/login',
      'sec-ch-ua': '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({
      "userName": "vitality",
      "password": "ABCDef.123",
      "code": code
    }),
    resolveWithFullResponse: true
  };
  return await rp(options).then(res => {
    let arr = res.headers['set-cookie']
    if (arr == undefined || arr.length == 0) {
      return {
        code: -1
      }
    }
    return {
      code: 1,
      token: arr[0].substring(8, 44)
    }
  })
}