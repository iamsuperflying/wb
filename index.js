var body = $response.body;
var url = $request.url;

/**
 * @description: 解析 items
 */
function parseItems(items) {
  if (!items) {
    return;
  }

  // "card_type": 118, // 118: 轮播图
  // "card_type": 19, // 19: 热聊/找人/热议/直播/本地......
  return items.filter((item) => {
    return item.card_type !== 118 || item.card_type !== 19;
  });
}

if (body) {
  var obj = JSON.parse($response.body);
  obj.items = parseItems(obj.items);
  $done({ body: JSON.stringify(obj) });
} else {
  $done({});
}