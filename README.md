# issue_mb
issue umeditor old version

# 用于termux下的手机端记录工具；
  因为是老版本，所以，维护较少，已经是作为个人的笔记系统而存在，考虑到数据容易丢失，在此备份；

- 支持图片剪切板粘贴上传；
- 支持分类和记录编辑；
- 采用umeditor，注意，这个是精简版的百度富文本编辑器；
- 数据库为postgresql，需要在手机端安装；
- 需要nginx或其他的服务器做代理；

目前已经更新图片上传方式为js文件上传。一改之前的php脚本上传；

```txt
# nginx.conf 中添加此配置
-------------------------------------------------
    location ~ \.do {
      proxy_pass http://127.0.0.1:8888;
    }

    # proxy png img jump
    # 8081 is php upload imgs position
    location ~ ^/issue_pic/(\d+)\.png$ {
      root $issueDir;
    }
```

运行方法： 当前主目录下执行 `node server.js` 即可。
如果报错，请先执行 npm install 或者 cnpm install ，因为已经上传 `package.json`,所以直接install一下
即可安装好库；

另外，issue_pic目录必须创建，用于存储剪切板上传的图片。

如果你喜欢尝试，可以试试；

# 数据库

添加默认用户数据，账号密码就是 root/root
```json
{"id": 282784, "phone": "13100651990", "password": "63a9f0ea7bb98050796b649e85481845", "username": "root"}
```

表有三张：
```sql

CREATE TABLE "public"."tb_issue" (
"j" jsonb
)

CREATE TABLE "public"."tb_classify" (
"j" jsonb
)

CREATE TABLE "public"."tb_user" (
"j" jsonb
)
```

数据存储采用jsonb格式，不懂得百度jsonb即可。
