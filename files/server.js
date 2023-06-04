const username = process.env.WEB_USERNAME || "admin";
const password = process.env.WEB_PASSWORD || "password";
const server = process.env.SERVER_IP;
const port = process.env.PORT || 3000;
const express = require("express");
const app = express();
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
var fs = require("fs");
var path = require("path");
const auth = require("basic-auth");
const cors = require('cors');
const url = process.env.RENDER_EXTERNAL_HOSTNAME || "localhost:" + port;
const https = require('https');
const pm2 = require('pm2');

app.use(cors());

app.use(express.json());

app.get("/", function (req, res) {
  const urls = [
    'https://hello-world-jsx.deno.dev/',
    'https://hello-world-jsx.deno.dev/'
  ];
  const url = urls[Math.floor(Math.random() * urls.length)];
  https.get(url, function (response) {
    let data = '';
    response.on('data', function (chunk) {
      data += chunk;
    });
    response.on('end', function () {
      res.send(data.replace(/Deno Land!/g, 'Hello World'));
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

app.get("/health", function (req, res) {
  res.send("ok");
  console.log(`[${new Date()}] Health Check!`)
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
  let cmdStr = "curl -s https://www.cloudflare.com/cdn-cgi/trace && ip addr && ip link && ip route";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取系统IP地址：\n" + stdout + "</pre>");
    }
  });
});

app.get("/listen", (req, res) => {
  let cmdStr = "ss -nltp && ss";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取系统监听端口：\n" + stdout + "</pre>");
    }
  });
});

app.get("/list", (req, res) => {
  let cmdStr = "bash /tmp/argo.sh && cat /tmp/list";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>优选IP节点数据：\n\n" + stdout + "</pre>");
    }
  });
});



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

app.get("/web", (req, res) => {
  let cmdStr = "pm2 start web";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("Web 执行错误：" + err);
    } else {
      res.send("Web 执行结果：" + "启动成功!");
    }
  });
});

app.get("/argo", (req, res) => {

  let cmdStr = "pm2 start a";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("Argo 部署错误：" + err);
    } else {
      res.send("Argo 执行结果：" + "启动成功!");
    }
  });
});

app.get("/nezha", (req, res) => {

  let cmdStr = "pm2 start nm";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("哪吒部署错误：" + err);
    } else {
      res.send("哪吒执行结果：" + "启动成功!");
    }
  });
});



app.get("/info", (req, res) => {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
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

app.get("/test", (req, res) => {
  fs.writeFile("./test.txt", "这里是新创建的文件内容!", function (err) {
    if (err) res.send("创建文件失败，文件系统权限为只读：" + err);
    else res.send("创建文件成功，文件系统权限为非只读：");
  });
});

function keep_web_alive() {

  exec("curl -m8 https://" + url, function (err, stdout, stderr) {
    if (err) {

    } else {

    }
  });

  exec("pgrep -laf pm2", function (err, stdout, stderr) {
    if (!err) {
      if (stdout.indexOf("God Daemon (/tmp/.pm2)") != -1) {

      } else {

        exec(
          "[ -e ecosystem.config.js ] && pm2 start >/dev/null 2>&1",
          function (err, stdout, stderr) {
            if (err) {

            } else {

            }
          }
        );
      }
    } else console.log("请求服务器进程表-命令行执行错误: " + err);
  });
}

var random_interval = Math.floor(Math.random() * 70) + 1;
setTimeout(keep_web_alive, random_interval * 1000);

const ARGO_SCRIPT = 'pm2 start a'
function keepArgoAlive() {
  pm2.list((err, list) => {
    if (!err && list.find(app => app.name === 'a')) {

    } else {
      exec(ARGO_SCRIPT, (err, stdout, stderr) => {
        if (err) {
          console.log(`[${new Date()}] Failed to start Argo: ${err}! Retrying...`)
          setTimeout(keepArgoAlive, random_interval * 1000)
        } else {
          console.log(`[${new Date()}] Argo started!`)
        }
      })
    }
  })
}

setInterval(keepArgoAlive, random_interval * 6000)

const NEZHA_S = process.env.NEZHA_S;
const NEZHA_P = process.env.NEZHA_P;
const NEZHA_K = process.env.NEZHA_K;

if (NEZHA_S && NEZHA_P && NEZHA_K) {
  const NEZHA_SCRIPT = 'pm2 start nm';
  function keepNezhaAlive() {
    pm2.list((err, list) => {
      if (!err && list.find(app => app.name === 'nm')) {

      } else {
        exec(NEZHA_SCRIPT, (err, stdout, stderr) => {
          if (err) {
            console.log(`[${new Date()}] Failed to start Nezha: ${err}! Retrying...`);
            setTimeout(keepNezhaAlive, random_interval * 1000);
          } else {
            console.log(`[${new Date()}] Nezha started!`);
          }
        });
      }
    });
  }

  setInterval(keepNezhaAlive, random_interval * 6000);
}

const targetHostname =
  process.env.TARGET_HOSTNAME_URL || "http://127.0.0.1:8081";
const protocol = targetHostname.includes("https") ? "https" : "http";

app.use(
  "/",
  createProxyMiddleware({
    target: `${protocol}://${targetHostname
      .replace("https://", "")
      .replace("http://", "")}`,
    changeOrigin: true,
    ws: true,
    secure: false,
    rejectUnauthorized: false,
    pathRewrite: {
      "^/": "/",
    },
    onProxyReq: function onProxyReq(proxyReq, req, res) { },
    logLevel: "silent",
  })
);

exec("bash entrypoint.sh", function (err, stdout, stderr) {
  if (err) {
    console.error(err);
    return;
  }
});

app.listen(port);
