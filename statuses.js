const version = "0.0.26";
const proxy_name = "Weibo Ad Block";
console.log(`${proxy_name}: ${version}`);

let body = $response.body;
let url = $request.url;

// 新的首页时间线
const containerTimeline = /\/statuses\/container_timeline/.test(url);
// 推荐
const recommend = /\/statuses\/container_timeline_hot/.test(url);
// 新的评论
const comment = /\/statuses\/container_detail_comment/.test(url);
// 新的详情
const detail = /\/statuses\/container_detail/.test(url);

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

function promiseStatuses(data) {
  return new Promise((resolve, reject) => {
    if (data && data.statuses) {
      resolve(data.statuses);
    } else {
      reject("data is null");
    }
  });
}

/**
 * @description: 区分不同的 url
 */
function diffUrl() {
  if (comment) {
    return rwTrendAd;
  } else if (detail) {
    return rwDetailAd;
  } else {
    return noop;
  }
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

/**
 * @description: 移除评论
 * @param {*} items
 */
function rwComments(data) {
  if (!data || !data.datas) return data;

  data.lack = 1;
  data.max_id = 0;
  data.max_id_str = "0";

  // 001OutQmly1h8eswmmhe1j60zo0qy46i02

  // data.status?.source_type = 1;
  if (data.status) {
    data.status.source_type = 1;
    delete data.status.ad_state;

    if (data.status.pic_infos) {
      let { pic_infos } = data.status;
      Object.keys(pic_infos).forEach((key) => {
        pic_infos[key].pic_status = 0;
      });

      data.status.pic_infos = pic_infos;
    }
  }
  // delete data.tip_msg,
  data.datas = data.datas.filter((item) => {
    const { type, commentAdSubType, commentAdType, adType } = item;
    const isAd =
      type === 1 ||
      commentAdSubType === 1 ||
      commentAdType === 1 ||
      isAdFlag(adType);
    // 相关内容
    const is5 = type === 5 || commentAdType === 5 || adType === "相关内容";
    // 空评论
    const is6 = type === 6;
    return !isAd && !is5 && !is6;
  });
  return data;
}

function rwDetailAd(data) {
  // 移除主要的广告相关字段
  if (data.detailInfo && data.detailInfo.status) {
    const status = data.detailInfo.status;

    status.text = 'Hello Weibo';
    data.detailInfo.status.text = 'Hello Weibo';
    
    // 移除推广信息
    status.extend_info = {}
    delete status.extend_info;
    data.detailInfo.status.extend_info = {};
    
    // 移除语义品牌参数
    status.semantic_brand_params = {}
    delete status.semantic_brand_params;
    
    // 移除通用结构中的广告
    status.common_struct = [];
    data.detailInfo.status.common_struct = [];
    // delete status.common_struct;

    // 移除小店
    status.tag_struct = [];
    delete status.tag_struct;

  
  }
  
  // 移除底部的广告卡片
  if (data.detailInfo && data.detailInfo.cards) {
    data.detailInfo.cards = data.detailInfo.cards.filter(card => {
      // 过滤掉广告卡片
      if (card.card_group) {
        card.card_group = card.card_group.filter(item => 
          item.category !== 'wboxcard' && 
          !item.wboxParam
        );
      }
      return card.card_group && card.card_group.length > 0;
    });
  }

  data.detailInfo.extend = {}

  // 商业化
  if (data.pageHeader.data.items && data.pageHeader.data.items.length > 0) {
    // data.pageHeader.data.items = [data.pageHeader.data.items[0]];
    data.pageHeader.data.items = [
      {
        "type": "status",
        "category": "detail"
      },
      {
        "type": "span",
        "category": "cell",
        "style": {
          "background": {
            "type": "color",
            "color": "#f0f0f0",
            "colorKey": "CommonBackground"
          },
          "height": 10
        }
      }]
  }
  
  return data;
}

function isAd(item) {
  return (
    item.mblogtypename === '广告' ||
    item.readtimetype === 'adMblog' ||
    item.ad_actionlogs !== undefined ||
    item.is_ad === 1 ||
    (item.mblogtype === 1 && item.ad_state === 1) ||
    item.promotion !== undefined ||
    item.recommend === "广告" ||
    item.adtype === "1" ||
    item.ad_type !== undefined ||
    item.ad_object !== undefined
  );
}

     /**
       ### 综合判定逻辑
确定为广告的条件（满足任一即可）：

1. 1.
   mblogtype == 1 且 ad_state == 1
2. 2.
   存在 promotion 字段
3. 3.
   recommend == "广告"
4. 4.
   存在 adtype 字段
5. 5.
   存在 ad_type 字段
### 广告类型分类
- ad_type: 0 - 基础广告类型
- ad_type: 1 - 注释广告类型
- ad_type: 2 - 推广广告类型
- ad_type: 5 - 特殊广告类型
- ad_type: 6 - 高级广告类型
       */
function rwTimelineAd(data) {
  if (data.items && data.items.length > 0) {
    data.items = data.items.map(item => {
      if (item.category && item.category === 'feed') {
        // item.data.text = 'Hello Weibo';
        return item;
      }
      return item;
    }).filter(item => !isAd(item.data));
  }
  return data;
}

/**
 * @description: 移除 feed 中的 trend ad
 * @param {Array} items
 * @returns {Array}
 */
const rwTrendAd = (items) => {
  if (!items || !Array.isArray(items)) return items;
  return items.filter((item) => {
    const isTrendAd = item.type === "trend" && item.data?.blog?.mblogtype === 1;
    if (isTrendAd) {
      console.log(`移除 trend ad`);
    }
    return !isTrendAd;
  });
};

if (body) {
  let data = JSON.parse(body);

  try {

    // 移除评论区的广告
    if (comment) {
      data = rwComments(data);
    } else if (detail) {
      data = rwDetailAd(data);
    } else if (containerTimeline) {
      data = rwTimelineAd(data);
    }

  } catch (error) {
    console.log("[ error ] >", error);
  }

  promiseItems(data)
    .then((items) => {
      const rw = diffUrl();
      data.items = rw(items);
      $done({ body: JSON.stringify(data) });
    })
    .catch((_error) => {
      $done({ body: JSON.stringify(data) });
    });

//   promiseStatuses(data)
//     .then((statuses) => {
//       const rw = diffUrl();
//       data.statuses = rw(statuses);
//       $done({ body: JSON.stringify(data) });
//     })
//     .catch((_error) => {
//       $done({ body: JSON.stringify(data) });
//     });
} else {
  $done({});
}
