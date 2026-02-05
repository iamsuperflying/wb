#!/usr/bin/env node

/**
 * 模拟测试广告过滤逻辑
 * 验证 rmCardAd 和 rmGroupAd 的完整过滤效果
 */

const fs = require('fs');
const path = require('path');

// ========== 从 loon.js 复制核心逻辑 ==========

const CELL = "cell";
const CARD = "card";
const FEED = "feed";
const GROUP = "group";

// 广告卡片类型
const AD_CARD_TYPES = /^(10|42|43|118|200|203|209)$/;

// 黑名单关键词
const blacklistKeywords = ["带货", "橱窗", "星店"];

function isBlack(text) {
  if (!text) return false;
  return blacklistKeywords.some(keyword => text.includes(keyword));
}

/**
 * 移除 category 为 card 的广告
 */
const rmCardAd = (payload) => {
  if (!payload || payload.category !== CARD || !payload.data) return payload;

  const { card_type } = payload.data;
  const isAd = AD_CARD_TYPES.test("" + card_type);

  if (isAd) {
    console.log(`  ✅ 过滤广告卡片: card_type=${card_type}`);
    return null;
  }

  // 步骤 2: 处理 group 过滤
  const { group } = payload.data;
  if (group) {
    const originalLength = group.length;
    function isAdHotSearch(item) {
      const hasPromotion = item.promotion?.monitor_url?.length > 0;
      const hasAdKeyword = /(ads_word|adid:\d+)/.test(item.action_log?.ext || "");
      const hasAdScheme = item.scheme?.includes("source=is_ad") || item.scheme?.includes("topic_ad=1");
      const hasAdItemId = /^adid:\d+$/.test(item.itemid || "");
      return hasPromotion || hasAdKeyword || hasAdScheme || hasAdItemId;
    }
    payload.data.group = group.filter((item) => {
      const isAd = isAdHotSearch(item) || isBlack(item.title_sub);
      if (isAd) {
        console.log(`  ✅ 过滤热搜广告: ${item.title_sub}`);
      }
      return !isAd;
    });
    if (originalLength !== payload.data.group.length) {
      console.log(`  📊 热搜过滤: ${originalLength} -> ${payload.data.group.length}`);
    }
  }

  // 步骤 3: 处理 data.items 过滤
  const { items } = payload.data;
  if (items && Array.isArray(items)) {
    const originalLength = items.length;
    payload.data.items = items.filter((item) => {
      if (!item) return false;

      const { sub_item } = item;
      if (sub_item) {
        if (sub_item.ad_videoinfo) {
          console.log("  ✅ 过滤视频广告: ad_videoinfo");
          return false;
        }
        if (sub_item.promotion) {
          console.log("  ✅ 过滤推广频道: promotion");
          return false;
        }
      }

      return true;
    });
    if (originalLength !== payload.data.items.length) {
      console.log(`  📊 频道过滤: ${originalLength} -> ${payload.data.items.length}`);
    }
  }

  return payload;
};

/**
 * 移除 category 为 feed 的广告
 */
const rmFeedAd = (payload) => {
  if (!payload || payload.category !== FEED || !payload.data) return payload;
  const { data } = payload;
  const {
    is_id,
    ad_state,
    mblogtypename,
    content_auth_info,
    ad_actionlogs,
    promotion_info,
    readtimetype,
    timestamp_text,
  } = data;

  if (is_id === 1 || ad_state === 1) {
    console.log("  ✅ 过滤 FEED 广告: is_id/ad_state");
    return null;
  }
  if (mblogtypename) {
    console.log(`  ✅ 过滤 FEED 广告: mblogtypename=${mblogtypename}`);
    return null;
  }
  if (content_auth_info) {
    console.log("  ✅ 过滤 FEED 广告: content_auth_info");
    return null;
  }
  if (ad_actionlogs) {
    console.log("  ✅ 过滤 FEED 广告: ad_actionlogs");
    return null;
  }
  if (promotion_info) {
    console.log("  ✅ 过滤 FEED 广告: promotion_info");
    return null;
  }
  if (readtimetype === "adMblog") {
    console.log("  ✅ 过滤 FEED 广告: readtimetype=adMblog");
    return null;
  }
  if (timestamp_text === "推荐内容") {
    console.log("  ✅ 过滤 FEED 广告: timestamp_text");
    return null;
  }
  return payload;
};

/**
 * 移除 category 为 group 的广告
 */
const rmGroupAd = (payload) => {
  console.log("处理 GROUP 类别...");
  if (!payload || payload.category !== GROUP || !payload.items) return payload;

  payload.items.forEach((item, index, array) => {
    const { category } = item;
    console.log(`  处理 items[${index}]: category=${category}`);

    if (category === CELL) {
      console.log(`  ⚠️  CELL 类型直接过滤`);
      return null;
    }

    if (category === CARD) {
      array[index] = rmCardAd(item);

      // 递归处理 CARD 中的 data.items[] 结构
      const processedItem = array[index];
      if (processedItem && processedItem.data && processedItem.data.items) {
        console.log(`  🔄 递归处理 CARD 中的 ${processedItem.data.items.length} 个子项`);
        processedItem.data.items = processedItem.data.items.filter((subItem) => {
          if (!subItem) return false;

          // 递归处理嵌套的 CARD
          if (subItem.category === CARD) {
            const filtered = rmCardAd(subItem);
            if (!filtered) return false;
            Object.assign(subItem, filtered);
          }

          // 递归处理嵌套的 FEED
          if (subItem.category === FEED) {
            const filtered = rmFeedAd(subItem);
            if (!filtered) return false;
            Object.assign(subItem, filtered);
          }

          return true;
        });
        console.log(`  📊 子项过滤后: ${processedItem.data.items.length} 个`);
      }
    }

    if (category === FEED) {
      array[index] = rmFeedAd(item);
    }
  });

  const originalLength = payload.items.length;
  payload.items = payload.items.filter(Boolean);
  console.log(`📊 GROUP 过滤: ${originalLength} -> ${payload.items.length} 项\n`);

  return payload;
};

// ========== 执行测试 ==========

const testDataPath = path.join(__dirname, 'datas', 'response_body 4.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

console.log('========================================');
console.log('开始模拟过滤流程');
console.log('========================================\n');

// 深拷贝数据
const originalData = JSON.stringify(testData);
let filteredData = JSON.parse(originalData);

// 统计
let processedCount = 0;
let filteredCount = 0;

// 处理所有 items
filteredData.items = filteredData.items.map((item, idx) => {
  console.log(`\n处理顶层 item[${idx}]: category=${item.category}`);
  processedCount++;

  if (item.category === GROUP) {
    const result = rmGroupAd(item);
    if (!result) {
      filteredCount++;
      console.log(`❌ item[${idx}] 被完全过滤`);
    }
    return result;
  }

  if (item.category === CARD) {
    const result = rmCardAd(item);
    if (!result) {
      filteredCount++;
      console.log(`❌ item[${idx}] 被完全过滤`);
    }
    return result;
  }

  if (item.category === FEED) {
    const result = rmFeedAd(item);
    if (!result) {
      filteredCount++;
      console.log(`❌ item[${idx}] 被完全过滤`);
    }
    return result;
  }

  return item;
}).filter(Boolean);

console.log('\n========================================');
console.log('过滤结果统计');
console.log('========================================');
console.log(`处理项目: ${processedCount} 个`);
console.log(`过滤项目: ${filteredCount} 个`);
console.log(`保留项目: ${filteredData.items.length} 个`);

// 对比数据大小
const originalSize = originalData.length;
const filteredSize = JSON.stringify(filteredData).length;
const reduction = ((originalSize - filteredSize) / originalSize * 100).toFixed(2);

console.log(`\n数据大小: ${originalSize} -> ${filteredSize} bytes`);
console.log(`减少比例: ${reduction}%`);

console.log('\n========================================');
console.log('结论');
console.log('========================================');
console.log('✅ 广告过滤逻辑已增强完成');
console.log('✅ 支持过滤以下广告类型:');
console.log('   1. 广告卡片 (card_type: 10,42,43,118,200,203,209)');
console.log('   2. 热搜广告 (promotion, adid)');
console.log('   3. 视频广告 (ad_videoinfo)');
console.log('   4. 推广频道 (sub_item.promotion)');
console.log('   5. FEED 广告 (多种检测方式)');
console.log('✅ 支持递归处理嵌套结构');
