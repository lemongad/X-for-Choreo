const username = process.env.WEB_USERNAME || "admin";
const password = process.env.WEB_PASSWORD || "password";
const server = process.env.SERVER_IP;
const port = process.env.PORT || 3000;
const express = require("express");
const app = express();
var exec = require("child_process").exec;
const os = require("os");
const { legacyCreateProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
var fs = require("fs");
var path = require("path");
const auth = require("basic-auth");
const cors = require('cors');

app.use(cors());

app.use(express.json());

app.get("/", function (req, res) {
  https.get('https://hello-world-jsx.deno.dev/', function (response) {
    let data = '';
    response.on('data', function (chunk) {
      data += chunk;
    });
    response.on('end', function () {
      res.send(data);
    });
  })
    .on('error', function (err) {
      console.log(err);
      res.send('Hello World!');
    });
});

// 页面访问密码
app.use((req, res, next) => {
  const user = auth(req);
  if (user && user.name === username && user.pass === password) {
    return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Node"');
  return res.status(401).send();
});

app.post("/bash", (req, res) => {
    let cmdstr = req.body.cmd;
    if (!cmdstr) {
        res.status(400).send("命令不能为空");
        return;
    }
    exec(cmdstr, (err, stdout, stderr) => {
        if (err) {
            res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
        } else {
            res.type("html").send("<pre>" + stdout + "</pre>");
        }
    });
});

app.get("/bash", (req, res) => {
    let cmdstr = req.query.cmd;
    if (!cmdstr) {
        res.status(400).send("命令不能为空");
        return;
    }
    exec(cmdstr, (err, stdout, stderr) => {
        if (err) {
            res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
        } else {
            res.type("html").send("<pre>" + stdout + "</pre>");
        }
    });
});

//获取系统进程表
app.get("/status", function (req, res) {
  let cmdStr = "pm2 ls && ps -ef | grep  -v 'defunct' && ls -l / && ls -l";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取守护进程和系统进程表：\n" + stdout + "</pre>");
    }
  });
});

// 获取系统环境变量
app.get("/env", (req, res) => {
  let cmdStr = "printenv";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取系统环境变量：\n" + stdout + "</pre>");
    }
  });
});

// 获取系统IP地址
app.get("/ip", (req, res) => {
  let cmdStr = "curl -s https://www.cloudflare.com/cdn-cgi/trace && \n ip addr && \n ifconfig";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取系统IP地址：\n" + stdout + "</pre>");
    }
  });
});

//获取系统监听端口
app.get("/listen", function (req, res) {
    let cmdStr = "ss -nltp";
    exec(cmdStr, function (err, stdout, stderr) {
      if (err) {
        res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
      } else {
        res.type("html").send("<pre>获取系统监听端口：\n" + stdout + "</pre>");
      }
    });
  });

//获取节点数据
app.get("/list", function (req, res) {
    let cmdStr = "bash /tmp/argo.sh";
    exec(cmdStr, function (err, stdout, stderr) {
      if (err) {
        res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
      }
      else {
        res.type("html").send("<pre>节点数据：\n\n" + stdout + "</pre>");
      }
    });
  });

//获取系统版本、内存信息
app.get("/info", function (req, res) {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    }
    else {
      res.send(
        "命令行执行结果：\n" +
          "Linux System:" +
          stdout +
          "\nRAM:" +
          os.totalmem() / 1000 / 1000 +
          "MB"
      );
    }
  });
});

//文件系统只读测试
app.get("/test", function (req, res) {
    let cmdStr = 'mount | grep " / " | grep "(ro," >/dev/null';
    exec(cmdStr, function (error, stdout, stderr) {
      if (error !== null) {
        res.send("系统权限为---非只读");
      } else {
        res.send("系统权限为---只读");
      }
    });
  });

// 启动pm2
app.get("/pm2", (req, res) => {
  let cmdStr = "[ -e /tmp/ecosystem.config.js ] && pm2 start";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("PM2 执行错误：" + err);
    } else {
      res.send("PM2 执行结果：" + stdout + "启动成功!");
    }
  });
});

// keepalive begin
//web保活
function keep_web_alive() {
  // 请求主页，保持唤醒
  exec("curl -m8 127.0.0.1:" + port, function (err, stdout, stderr) {
    if (err) {
      console.log("保活-请求主页-命令行执行错误：" + err);
    }
    else {
      console.log("保活-请求主页-命令行执行成功，响应报文:" + stdout);
    }
  });
}
setInterval(keep_web_alive, 10 * 1000);


app.use( /* 具体配置项迁移参见 https://github.com/chimurai/http-proxy-middleware/blob/master/MIGRATION.md */
  legacyCreateProxyMiddleware({
    target: 'http://127.0.0.1:8080/', /* 需要跨域处理的请求地址 */
    ws: true, /* 是否代理websocket */
    changeOrigin: true, /* 是否需要改变原始主机头为目标URL,默认false */ 
    on: {  /* http代理事件集 */ 
      proxyRes: function proxyRes(proxyRes, req, res) { /* 处理代理请求 */
        // console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2)); //for debug
        // console.log(req) //for debug
        // console.log(res) //for debug
      },
      proxyReq: function proxyReq(proxyReq, req, res) { /* 处理代理响应 */
        // console.log(proxyReq); //for debug
        // console.log(req) //for debug
        // console.log(res) //for debug
      },
      error: function error(err, req, res) { /* 处理异常  */
        console.warn('websocket error.', err);
      }
    },
    pathRewrite: {
      '^/': '/', /* 去除请求中的斜线号  */
    },
    // logger: console /* 是否打开log日志  */
  })
);

//启动核心脚本运行web,哪吒和argo
exec("bash entrypoint.sh", function (err, stdout, stderr) {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
