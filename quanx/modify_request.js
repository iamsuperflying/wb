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
        
        // 修改 preAdInterval 参数为 999
        if (params.has('preAdInterval')) {
            params.set('preAdInterval', '999');
            console.log('Modified preAdInterval to 999');
        } else {
            // 如果参数不存在，添加它
            params.append('preAdInterval', '999');
            console.log('Added preAdInterval=999');
        }

        // 修改 preMarkInterval 参数为 999
        if (params.has('preMarkInterval')) {
            params.set('preMarkInterval', '999');
            console.log('Modified preMarkInterval to 999');
        } else {
            // 如果参数不存在，添加它
            params.append('preMarkInterval', '999');
            console.log('Added preMarkInterval=999');
        }

        // feedDynamicEnable 参数
        if (params.has('feedDynamicEnable')) {
            params.set('feedDynamicEnable', '0');
            console.log('Modified feedDynamicEnable to 0');
        } else {
            // 如果参数不存在，添加它
            params.append('feedDynamicEnable', '0');
            console.log('Added feedDynamicEnable=0');
        }

        // enable_flow_stagger
        if (params.has('enable_flow_stagger')) {
            params.set('enable_flow_stagger', '0');
            console.log('Modified enable_flow_stagger to 0');
        } else {
            // 如果参数不存在，添加它
            params.append('enable_flow_stagger', '0');
            console.log('Added enable_flow_stagger=0');
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