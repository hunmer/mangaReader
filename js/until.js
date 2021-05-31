var _GET = getGETArray();
var api = 'https://mangareader.glitch.me/.';
//var api = '.';

var g_localKey = 'manga_';
// 本地储存前缀
var g_config;
initConfig();
function initConfig(){
    g_config = local_readJson('config', {
        index: -1,
        history: {},
    });
}

var g_manga = local_readJson('manga', {});

function local_saveJson(key, data) {
    if (window.localStorage) {
        key = g_localKey + key;
        data = JSON.stringify(data);
        if (data == undefined) data = '[]';
        return localStorage.setItem(key, data);
    }
    return false;
}

function local_readJson(key, defaul = '') {
    if (!window.localStorage) return defaul;
    key = g_localKey + key;
    var r = JSON.parse(localStorage.getItem(key));
    return r === null ? defaul : r;
}

function getGETArray() {
    var a_result = [], a_exp;
    var a_params = window.location.search.slice(1).split('&');
    for (var k in a_params) {
        a_exp = a_params[k].split('=');
        if (a_exp.length > 1) {
            a_result[a_exp[0]] = decodeURIComponent(a_exp[1]);
        }
    }
    return a_result;
}