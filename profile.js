const version = "0.0.27";
const proxy_name = "Weibo Ad Block";
console.log(`${proxy_name}: ${version}`);

let body = $response.body;
let url = $request.url;

// 新的首页时间线
const containerTimeline = /\/profile\/container_timeline/.test(url);

const noop = (items) => items;

// 是否是广告标识
const IS_AD_FLAGS = /广告|热推/;
// card_type === 118 为图片轮播广告
// card_type === 207 为各种赛程比分广告
// card_type === 19 为小图标广告
// card_type === 22 为图片广告
// card_type === 208 为热聊
const AD_CARD_TYPES = /19|22|118|207|208/;
// 卡片标识
const CARD = "card";
// 信息流标识
const FEED = "feed";
// 热搜标识
const GROUP = "group";


// 某项是否有广告标识
const isAdFlag = IS_AD_FLAGS.test.bind(IS_AD_FLAGS);

const isString = (item) => item && typeof item === "string";

const safeIncludes = (source, target) => {
  if (!isString(source) || !isString(target)) return false;
  return target.indexOf(source) !== -1;
};

function isNormalFeedTopic(category, item) {
  const feed = category === FEED;
  return feed ? isNormalTopic(item) : !feed;
}

function promiseItems(data) {
  return new Promise((resolve, reject) => {
    if (data && data.items) {
      resolve(data.items);
    } else {
      reject("data is null");
    }
  });
}

/**
 * 是否是正常的帖子
 * @param {Object} item 帖子, 包含 data 或者 item 属性
 * @returns  {Boolean} true: 正常帖子, false: 广告帖子
 */
const isNormalTopic = (item) => {
  const topic = item.data || item;
  // item.data.mblogtypename === '广告'
  // item.data.content_auth_info.content_auth_title === '广告' | '热推'
  // item.data.promotion.recommend === '广告' | '热推
  const { mblogtypename, content_auth_info, promotion } = topic;
  if (mblogtypename) {
    return !isAdFlag(mblogtypename);
  } else if (content_auth_info) {
    return !isAdFlag(content_auth_info.content_auth_title);
    // return (
    //   content_auth_info.content_auth_title !== "广告" &&
    //   content_auth_info.content_auth_title !== "热推"
    // );
  } else if (promotion) {
    return !isAdFlag(promotion.recommend) && promotion.type !== "ad";
    // return promotion.recommend !== "广告" && promotion.recommend !== "热推";
  } else {
    return true;
  }
};


function rwTimelineAd(data) {
  if (data.items && data.items.length > 0) {
    const originalCount = data.items.length;
    data.items = data.items.filter(item => {
      // 过滤 feed 类型的广告
      if (item.category === FEED) {
        return isNormalTopic(item);
      }
      return true;
    });
    const filteredCount = originalCount - data.items.length;
    if (filteredCount > 0) {
      console.log(`[profile] 过滤了 ${filteredCount} 条广告`);
    }
  }
  return data;
}

if (body) {
  let data = JSON.parse(body);

  try {

    if (containerTimeline) {
      data = rwTimelineAd(data);
    }

    $done({ body: JSON.stringify(data) });
  } catch (error) {
    console.log("[ error ] >", error);
    $done({});
  }
} else {
  $done({});
}
