const _pg_ = require('pg');
const _http_ = require('http');
const _url_ = require('url');

// 引用参数处理库和文件路径库支持
const _formidable = require('formidable');
const _fs = require('fs');
const path = require('path');

// 定义常量，用于相关参数配置
const tb_issue = 'tb_issue';
const tb_classify = 'tb_classify';
const tb_user = 'tb_user';


/**
 * 定义一个Server工具，用于进行处理
 * @type {{}}
 */
const App = {
    /**
     * 服务资源
     */
    actions: new Map(),
    /** 缓存池，需要根据一个key来存储 */
    cachePool: new Map(),
    /**
     * 启动服务器
     * @param port 服务启动端口
     * @param callback 启动后的回调
     */
    start(port, callback) {
        const host = 'localhost';
        port = port ? port : '8888';
        const __S = this;

        console.log(this.actions);
        // 创建服务
        _http_.createServer((req, res) => { })
            .listen(port, host, () => console.log(`Server running at http://${host}:${port}/`))
            .on('request', (request, response) => {
                //必须监听error并处理，否则错误会中断node服务器运行，从而结束服务
                request.on('error', (err) => console.error(err.stack));

                // 关于Options的不通过的原因是请求头不识别，或者没有权限
                if (request.method === 'OPTIONS') {
                    console.log("dealwith OPTIONS request");
                    response.setHeader("Access-Control-Allow-Origin", "*");
                    response.setHeader("Access-Control-Allow-Methods", "OPTIONS");
                    response.setHeader("Access-Control-Allow-Headers", "content-type,x-requested-with");
                    response.statusCode = '204';
                    response.end();
                    return;
                }

                // 正常的请求的处理
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'PUT,POST');
                // response.setHeader('Access-Control-Allow-Credentials', 'true');

                // 不缓存
                response.setHeader("cache-control", "no-cache");
                // 设置返回的内容的格式
                response.setHeader("content-type", "application/json; charset=utf-8");
                let time = new Date().getTime();
                response.setHeader("etag", "" + time);

                //请求头参数名必须小写
                const { headers } = request;
                const userAgent = headers['user-agent'];
                response.setHeader("User-Agent", "" + userAgent);

                /** 此处是打印一下请求的信息，好方便于检测 */
                console.log("/***************************************************************");
                console.log(` * Method:${request.method}`);
                console.log(` * URL:${request.url}`);
                console.log(` * UserAgent:${userAgent}`);
                console.log(` * ContentType:${headers['content-type']}`);
                console.log(" ***************************************************************/");


                // 从request中取方法和url
                const { method, url } = request;

                if (url === "/favicon.ico") {
                    response.statusCode = 200;
                    response.end("not supply!");
                    return;
                }

                // 执行解码，不知为何，非要这样回调一次才可以正常解析，这个不要修改
                let execPost = callback => {
                    let body = [];
                    request.on('data', (chunk) => {
                        body.push(chunk);
                    }).on('end', () => {
                        body = Buffer.concat(body).toString();
                        callback(JSON.parse(body));
                    });
                };

                /**
                 * 404 响应
                 * @param res
                 */
                let notFoundResponse = res => {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ message: 'Not Found', status: 404 }));
                };

                /**
                 * 成功响应，但内容为空，浏览器自动丢弃返回的任何信息，减少浏览器资源使用
                 * @param res
                 */
                let successEmptyContent = res => {
                    response.statusCode = 204;
                    response.end();
                };

                const p = _url_.parse(request.url, true);

                // 支持GET和POST请求
                if (method === "GET") {
                    let func = App.actions.get(p.pathname);
                    if (func) func(request, response, p.query);
                    else notFoundResponse(response);
                } else if (method === "POST") {
                   
                    //const p = _url_.parse(request.url, false);
                    //execPost((data) => {
                    //    let func = App.actions.get(p.pathname);
                    //    if (func) func(request, response, data);
                    //    else notFoundResponse(response);
                    //});

                    // 更换成解析库来做
                    const form = new _formidable.IncomingForm();
                    // 扩展属性，用于存放多文件上传的时候的文件数据
                    form.___files = [];
                    form.___filesInfos = [];
                    form.___filedName = undefined;
                    form.encoding = 'utf-8';
                    // 注意，此处的指定的目录必须存在，否则会报错的！由form中间件来实现文件的上传，我们需要配置上传的目录
                    // 此处注意，因为__dirname是当前js的文件所在的目录，所以下面的目录就是当前js所在目录的同级下创建imgs目录
                    form.uploadDir = path.join(__dirname, 'issue_pic');

                    // 处理请求中的文件
                    form.on('file', function (name, file) {
                        // console.log(file);
                        // 上传的文件存放起来
                        form.___files.push(file);
                        // 上传字段名称（key）
                        form.___filedName = name;
                        const info = {
                            key: name,
                            size: file.size,
                            name: file.name,
                            type: file.type,
                            lastModifiedDate: file.lastModifiedDate
                        }

                        // 对于jpeg的转换成jpg存储
                        info.type = info.type.replace(/(jpeg)/ig,'jpg');

                        let fileType = info.type.split(/\//);

                        info.bType = fileType[0];
                        info.sType = fileType[1];
                        info.suffix = '.' + fileType[1];

                        _fs.rename(file.path, path.join(path.dirname(file.path), file.lastModifiedDate.getTime() + info.suffix), (err) => {
                            if (err) console.error(err);
                        });
                        
                        info.fileName = file.lastModifiedDate.getTime() + info.suffix;

                        // 最后记录文件的信息，不含原始文件，原始文件请在request的扩展属性中去取即可；
                        form.___filesInfos.push(info);
                    });
                    
                    // 转换解析请求
                    form.parse(request, function (err, fields, files) {
                        // 将上传的文件，用文件组的方式传递到下一级，注意，我这里是
                        request.extpars = {};
                        request.extpars[form.___filedName] = form.___files;
                        // 将文件信息组放在参数中向后传递
                        fields[form.___filedName] = form.___filesInfos;
                        // 将第一个文件的信息提出来，这个是方便于经常的只有一个上传文件的时候，方便于直接取用
                        fields['firstFile'] = form.___filesInfos.length > 0 ? form.___filesInfos[0] : {};
                        // 调用路由配对的执行任务
                        let func = App.actions.get(p.pathname);
                
                        if (func) {
                            func(request, response, fields);
                        } else {
                            responseNotFound(response);
                        }
                    });
                } else {
                    successEmptyContent(response);
                }
            });

        callback();
    },
    /**
     * 添加路由规则
     * @param url
     * @param callback function (req,res,params)
     */
    route(url, callback) {
        this.actions.set(url, callback);
    },
    /**
     * 添加缓存
     * @param key
     * @param value
     */
    cacheAdd(key, value) {
        console.log('add cache of key[' + key + ']');
        this.cachePool.set("" + key, value);
    },
    /**
     * 从缓存中获取数据
     * @param key
     * @returns {any}
     */
    cacheGet(key) {
        console.log('load cache of key[' + key + ']');
        return this.cachePool.get("" + key);
    },
    /**
     * 从缓存中移除
     * @param key
     */
    cacheRemove(key) {
        if (this.cachePool.has("" + key)) {
            console.log('remove cache of key[' + key + ']');
            this.cachePool.delete("" + key);
        }
    },
    /**
     * 检查是否已经存在缓存
     * @param key
     */
    cacheContain(key) {
        return this.cachePool.has("" + key);
    }
};

/**
 * Postgresql 数据库连接配置根对象
 * @type {{tcpUrl: string, client, connectTest(): void}}
 */
const PG = {
    port: 5432,
    host: 'localhost',
    db: 'postgres',
    tcpUrl: undefined,
    client: undefined,
    /**
     * 做基本校验，传入需要校验的字段
     * @param fileds
     * @return Boolean
     */
    validate(fileds) {
        let pass = true;
        fileds.forEach(o => {
            pass &= !!o
        });
        return pass;
    },
    /**
     * 处理一下返回的结果，提取出需要的数据，返回单个对象
     * @param rel
     * @returns {*}
     */
    formatRelGetOne(rel) {
        return rel.rows.length > 0 ? rel.rows[0].j : {}
    },
    /**
     * 处理一下返回的结果，提取出需要的数据，返回列表
     * @param rel
     * @returns {*}
     */
    formatRelGetList(rel) {
        return rel.rows.length > 0 ? rel.rows : []
    },
    /**
     * 初始化数据源，连接数据库
     */
    init() {
        this.tcpUrl = `tcp://postgres:root@${this.host}:${this.port}/${this.db}`;
        this.client = new _pg_.Client(this.tcpUrl);
        this.client.connect(function (error, results) {
            // 判别连接是否成功
            if (error) {
                console.log('Client Connection Ready Error:' + error.message);
                this.client.end();
                return;
            }
            console.log('Postgres Connection Ready!');
        });
    },
    /**
     * 创建id并返回
     * @returns {string}
     */
    getId() {
        return new Date().getTime().toString().substr(2, 8);
    },
    /**
     * 用户登录
     * @param requestData
     * @param callback
     */
    login(requestData, callback) {
        let S = this;
        let sql = `select * from ${tb_user} j where j->>'username'='${requestData.username}' 
        and j->>'password'='${requestData.password}'`;
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetOne(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    },
    /**
     * 注册用户
     * @param reqData
     * @param callback
     */
    regist(reqData, callback) {
        let S = this;
        // 添加id字段
        reqData.id = this.getId();

        let sql = `insert into ${tb_user} values('${JSON.stringify(reqData)}')`;

        // 执行查询
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetOne(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    },
    /**
     * 统计所有分类的issues的数量
     * @param reqData 无需传参
     * @param callback 返回查结果
     */
    countClassifyIssues(reqData, callback) {
        let S = this;
        let sql = `select j->>'id' as id,j->>'pid' as pid,j->>'name' as name, j->>'has' as has, a.cc as total from ${tb_classify} left join
              (
                select b.j->>'classify_id' as cid, count(1) as cc from ${tb_issue} b group by b.j->>'classify_id'
                ) as a on a.cid = j->>'id' order by j->>'name'`;
        //console.log(sql);
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetList(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    },
    /**
     * 根据cid获取相关的issue列表
     * - 由于是用于初始化菜单中的issue列表的，所以，我们不用返回content字段的，提高响应速度
     * @param reqData [cid]
     * @param callback
     */
    listIssueByCid(reqData, callback) {
        let S = this;
        let sql = `select j->>'id' as id, j->>'title' as title, j->>'classify_id' as cid 
              from ${tb_issue} where j->>'classify_id'='${reqData.id}' order by j->>'title'`;
        //console.log(sql);
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetList(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    },
    /**
     * 根据id查询issue
     * @param requestData
     * @param callback
     */
    findIssue(requestData, callback) {
        let S = this;
        let sql = `select * from ${tb_issue} j where j->>'id'='${requestData.id}'`;
        //console.log(sql);
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetOne(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    },
    /**
     * 插入一条Issue记录
     * @param requestData
     * @param callback
     */
    insertIssue(requestData, callback) {
        let S = this;
        if (!requestData.id) {
            requestData.id = S.getId();
        }

        let sql = `insert into ${tb_issue}(j) values('${JSON.stringify(requestData)}')`;
        //console.log(sql);
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetOne(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    },
    /**
     * 插入一条Classify记录
     * @param requestData
     * @param callback
     */
    insertClassify(requestData, callback) {
        let S = this;
        if (!requestData.id) {
            // 如果没有指定id则创建新id
            requestData.id = S.getId();
        }

        let sql = `insert into ${tb_classify}(j) values('${JSON.stringify(requestData)}')`;
        //console.log(sql);
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetOne(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    },
    /**
     * 删除issue记录
     * @param requestData
     * @param callback
     */
    deleteIssue(requestData, callback) {
        let S = this;
        let sql = `delete from ${tb_issue} where j->>'id'='${requestData.id}'`;
        //console.log(sql);
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetOne(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    },
    /**
     * 删除分类记录
     * @param requestData
     * @param callback
     */
    deleteClassify(requestData, callback) {
        let S = this;
        let sql = `delete from ${tb_classify} where j->>'id'='${requestData.id}'`;
        //console.log(sql);
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetOne(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    },
    /**
     * 更新issue记录
     * @param requestData
     * @param callback
     */
    updateIssue(requestData, callback) {
        // 先删除
        this.deleteIssue(requestData, () => { });
        // 后插入
        this.insertIssue(requestData, callback);
    },
    /**
     * 更新分类记录
     * @param requestData
     * @param callback
     */
    updateClassify(requestData, callback) {
        // 先删除
        this.deleteClassify(requestData, () => { });
        // 后插入
        this.insertClassify(requestData, callback);
    },
    /**
     * 根据父id查询分类列表
     * @param requestData
     * @param callback
     */
    listClassifyByPid(requestData, callback) {
        let S = this;
        let sql = `select j->>'id' as id,j->>'pid' as pid,j->>'name' as name, j->>'has' as has 
                  from ${tb_classify} where j->>'pid'='${requestData.pid}'`;
        //console.log(sql);
        S.client.query(
            sql,
            (err, rel) => {
                rel = rel ? S.formatRelGetList(rel) : {};
                if (err) {
                    console.warn('waring', err);
                    rel = {};
                }
                callback(rel);
            }
        );
    }
};

/** 登陆 */
App.route("/user/login.do", (req, res, params) => {
    PG.login(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 注册 */
App.route("/user/regist.do", (req, res, params) => {
    PG.regist(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 添加分类 */
App.route("/classify/add.do", (req, res, params) => {

    PG.insertClassify(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 更新分类 */
App.route("/classify/update.do", (req, res, params) => {

    PG.updateClassify(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 删除分类 */
App.route("/classify/delete.do", (req, res, params) => {
    PG.deleteClassify(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 根据分类的父id查询子分类列表 */
App.route("/classify/fpid.do", (req, res, params) => {
    PG.listClassifyByPid(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 根据分类id查询issue列表 */
App.route("/issue/listByCid.do", (req, res, params) => {
    PG.listIssueByCid(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 获取issue记录 */
App.route("/issue/get.do", (req, res, params) => {
    // 如果已经缓存则直接走缓存
    if (App.cacheContain(params.id)) {
        let rel = App.cacheGet(params.id);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
        return;
    }

    // 首次或缓存中没有时从数据库查询
    PG.findIssue(params, result => {
        let rel = JSON.stringify(result);
        App.cacheAdd(params.id, rel);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    })
});

/** 添加issue记录 */
App.route("/issue/add.do", (req, res, params) => {
    PG.insertIssue(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 更新issue记录 */
App.route("/issue/update.do", (req, res, params) => {
    App.cacheRemove(params.id);
    PG.updateIssue(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 删除issue记录 */
App.route("/issue/delete.do", (req, res, params) => {
    App.cacheRemove(params.id);
    PG.deleteIssue(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

/** 统计不同的分类下面的issue的数量 */
App.route("/issue/count.do", (req, res, params) => {
    PG.countClassifyIssues(params, result => {
        let rel = JSON.stringify(result);
        res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
        res.end(rel);
    });
});

App.route("/upload.do", (req, res, params) => {
    // 需要url属性，目前现不修改别的这里进行必要的修改即可
    params.url = params.firstFile.fileName;
    let rel = JSON.stringify(params);
    res.writeHead(200, { 'content-length': Buffer.byteLength(rel) });
    res.end(rel);
})

/** 启动服务 */
App.start(8888, () => {
    PG.init();
});

