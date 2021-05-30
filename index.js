var request = require('request');
var fs = require('fs');
var path = require('path');
var http = require('http');
var url = require('url');
var downloading = {};

const mimeType = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.eot': 'application/vnd.ms-fontobject',
    '.ttf': 'application/x-font-ttf',
};
 //res.writeHead(301, {'Location': './index.html?id='+id});
 //res.end();
http.createServer(function(req, res) {
    const parsedUrl = url.parse(req.url);
    //console.log(parsedUrl);
    if (parsedUrl.pathname == '/api') {
        var args = getGETArray(parsedUrl.query);
        if(args['s']){
            searchId(args['s']).then(function(id){
                console.log(id);
                if(id){
                     res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({id: id}));
                }
            })
            return;
        }

        if (args['id']) {
            if (args['sid']) {
            	if (args['pwd']) {
                    if (args['progress']) { // 进度条请求
		                	if( downloading[args['id'] + '-' + args['sid']] != undefined){
		                		 res.writeHead(200, { 'Content-Type': 'application/json' });
		                    return res.end(JSON.stringify({ progress: downloading[args['id'] + '-' + args['sid']] }));
		                	}
		                }else{
	                  	getDownloadLink(args['id'], args['sid'], args['pwd']); // 首次请求
		                }
                }
                return;
            }
            // 查询信息
            getMangaDetail(args['id']).then(function(ret) {
                if (ret) {
                   console.log(ret);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(ret));
                }
            });
        }
        return;
    }

    // 提取路径  
    const sPath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
    let pathname = path.join(__dirname, sPath);
    //判断路径是否存在  
    fs.exists(pathname, function(exist) {
        if (!exist) {
            //如果路径不存在，则返回404  
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
        }

        // 如果路径是目录，则将路径替换为目录下的 index.html  
        if (fs.statSync(pathname).isDirectory()) {
            pathname += '/index.html';
        }

        // 根据路径读取文件，此处调用fs模块方法  
        fs.readFile(pathname, function(err, data) {
            if (err) {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            } else {
                // 获取路径后缀名  
                const ext = path.parse(pathname).ext;
                // 根据后缀名获取响应的content-type; 这里的minType定义见上面的代码块  
                res.setHeader('Content-type', mimeType[ext] || 'text/plain');
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                //通过end方法来结束response  
                res.end(data);
            }
        });
    });
    //提供http端口监听  
}).listen(8080);

console.log('Server running at http://127.0.0.1:8080/');

var httpOption = {
    method: "GET",
    headers: {
        'service-media-id': 2,
        'appid': 'jp.co.hps.comic.portal',
        'appver': 276,
        'lang': 'zh_CN',
        'osver': 29,
        'uuid': '829136d8-90c7-4af7-a987-ff5e3555ad46',
        'devicetype': 'Redmi Note 7',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 10; Redmi Note 7 MIUI/V12.0.3.0.QFGCNXM)',
    },
}
//searchId('https://dokuha.jp/comicweb/contents/comic/bokugakimowokaeru');
function searchId(s){
    var promise = new Promise(function(resolve, reject) {
        if(s.indexOf('https://dokuha.jp/comicweb/contents/comic/') == 0){
            var opt = httpOption;
            httpOption.url = s;
            request(opt, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(getString(body, 'comic="', '"'));
                }
            });
        }
    });
    return promise;
}
function getString(str, s, e){
        var i_start = str.indexOf(s);
        if(i_start != -1){
            i_start += s.length;
            var i_end = str.indexOf(e, i_start);
            if(i_end != -1){
                return str.substr(i_start, i_end - i_start);
            }
        }
        return '';
    }

    // getMangaDetail(5097);
function getMangaDetail(id) {
    var promise = new Promise(function(resolve, reject) {
    	 var opt = httpOption;
         opt["content-type"] = "application/json";
         opt["json"] = true;
        httpOption.url = 'https://api.dokuha.jp/comic-masters/' + id;
        request(opt, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res = {
                    id: body['comic_master_id'],
                    name: body['comic_name'],
                    author: body['copyright'],
                    cover: body['thumbnail_url'],
                    date: body['release_date'],
                    desc: body['description'],
                    attr: {
                        password: body['password'],
                    },
                    list: [],
                }
                for (var cap of body['comicVolumes']) {
                    res['list'].push({
                        sid: cap['comic_id'],
                        name: cap['volume_name'],
                        size: cap['zip_size'],
                        date: cap['release_date'],
                        //url: '127.0.0.1/manga?id=' + cap['comic_master_id'] + '&sid=' + cap['comic_id'] + '&pwd=' + body['password'],
                    });
                }
                resolve(res);
            }
        });
    });
    return promise;
}
//id=5097&sid=36370&pwd=7ECGIOwk
// https://api.dokuha.jp/comic-lists/26298/download?old_comic_master_id=3729
/*var id = 5097;
var sid = 36370;
var pwd = '7ECGIOwk';
getDownloadLink(id, sid, pwd).then(function(res) {
    console.log(res);
})
*/
function downloadFile(req, targetPath) {
      var received_bytes = 0;
      var total_bytes = 0;
      var out = fs.createWriteStream(targetPath);
      req.pipe(out);
      req.on('response', function(data) {
          total_bytes = parseInt(data.headers['content-length']);
      });
      req.on('data', function(chunk) {
      	received_bytes+=chunk.length;
      	var key = req.attr_id + '-' + req.attr_sid;
      	var pos = parseInt(received_bytes / total_bytes * 100);
      	if(downloading[key] != pos){
          downloading[key] = pos;
      		console.log(downloading[key]);
      	}
      });
      req.on('error', function(err){
      	console.log(err);
      });
      req.on('end', function() {

      });
}

function getDownloadLink(id, sid, pwd) {
	console.log(id, sid, pwd);
    var promise = new Promise(function(resolve, reject) {
        var dir = './download/' + id + '/';
        if (mkdirsSync(dir)) {
            var file = dir + sid + '.zip';
            if (fs.existsSync(file) && fs.statSync(file).size > 1024 * 10) {
            	downloading[id + '-' + sid] = 100;
                resolve({ file: file, pwd: pwd });
            } else {
            	var opt = httpOption;
                opt.url = 'https://api.dokuha.jp/comic-lists/' + sid + '/download?old_comic_master_id=' + id;
                var req = request(opt);
                req.attr_id = id;
                req.attr_sid = sid;
                downloadFile(req, file);
            }
        }
    });
    return promise;
}

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

function getGETArray(href) {
    var a_result = [];
    if (typeof(href) == 'string') {
        var a_exp;
        var a_params = href.split('&');
        for (var k in a_params) {
            a_exp = a_params[k].split('=');
            if (a_exp.length > 1) {
                a_result[a_exp[0]] = decodeURIComponent(a_exp[1]);
            }
        }
    }
    return a_result;
}