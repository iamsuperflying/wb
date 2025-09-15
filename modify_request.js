const version = "1.0.0";
const script_name = "Weibo Request Modifier";
console.log(`${script_name}: ${version}`);

const url = $request.url;
let body = $request.body;

console.log(`Original URL: ${url}`);
console.log(`Original Body: ${body}`);

// 检查是否是目标 API
if (url.includes('/statuses/container_timeline')) {
    if (body) {
        // 解析 URL 编码的请求体
        const params = new URLSearchParams(body);
        
        // 修改 preAdInterval 参数为 0
        if (params.has('preAdInterval')) {
            params.set('preAdInterval', '0');
            console.log('Modified preAdInterval to 0');
        } else {
            // 如果参数不存在，添加它
            params.append('preAdInterval', '0');
            console.log('Added preAdInterval=0');
        }
        
        // 重新构建请求体
        body = params.toString();
        console.log(`Modified Body: ${body}`);
    }
}

// 返回修改后的请求
$done({
    url: url,
    headers: $request.headers,
    body: body
});