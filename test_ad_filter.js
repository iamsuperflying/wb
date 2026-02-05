#!/usr/bin/env node

/**
 * 测试广告过滤效果
 * 验证 loon.js 中的广告过滤逻辑是否完整
 */

const fs = require('fs');
const path = require('path');

// 加载测试数据
const testDataPath = path.join(__dirname, 'datas', 'response_body 4.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

// 导入常量 (从 loon.js 复制)
const CELL = "cell";
const CARD = "card";
const FEED = "feed";
const GROUP = "group";

// 广告检测统计
const adStats = {
  total: 0,
  filtered: 0,
  missed: 0,
  types: {}
};

/**
 * 检测 CARD 中的广告
 */
function detectCardAd(item) {
  if (!item || item.category !== CARD || !item.data) return null;

  const ads = [];
  const { data } = item;

  // 检测 card_type 广告
  const AD_CARD_TYPES = /^(10|42|43|118|200|203|209)$/;
  if (AD_CARD_TYPES.test("" + data.card_type)) {
    ads.push({ type: 'card_type', value: data.card_type });
  }

  // 检测 group 中的广告
  if (data.group) {
    data.group.forEach((groupItem, idx) => {
      if (groupItem.promotion?.monitor_url?.length > 0) {
        ads.push({ type: 'group.promotion', index: idx, title: groupItem.title_sub });
      }
      if (/(ads_word|adid:\d+)/.test(groupItem.action_log?.ext || "")) {
        ads.push({ type: 'group.adid', index: idx, title: groupItem.title_sub });
      }
    });
  }

  // 检测 items 中的广告
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((subItem, idx) => {
      if (subItem && subItem.sub_item) {
        if (subItem.sub_item.ad_videoinfo) {
          ads.push({ type: 'items.sub_item.ad_videoinfo', index: idx });
        }
        if (subItem.sub_item.promotion) {
          ads.push({ type: 'items.sub_item.promotion', index: idx });
        }
      }
    });
  }

  return ads.length > 0 ? ads : null;
}

/**
 * 检测 FEED 中的广告
 */
function detectFeedAd(item) {
  if (!item || item.category !== FEED || !item.data) return null;

  const ads = [];
  const { data } = item;

  if (data.is_id === 1 || data.ad_state === 1) {
    ads.push({ type: 'feed.is_id/ad_state' });
  }
  if (data.mblogtypename) {
    ads.push({ type: 'feed.mblogtypename', value: data.mblogtypename });
  }
  if (data.content_auth_info) {
    ads.push({ type: 'feed.content_auth_info' });
  }
  if (data.ad_actionlogs) {
    ads.push({ type: 'feed.ad_actionlogs' });
  }
  if (data.promotion_info) {
    ads.push({ type: 'feed.promotion_info' });
  }
  if (data.readtimetype === "adMblog") {
    ads.push({ type: 'feed.readtimetype' });
  }
  if (data.timestamp_text === "推荐内容") {
    ads.push({ type: 'feed.timestamp_text' });
  }

  return ads.length > 0 ? ads : null;
}

/**
 * 递归扫描所有 items
 */
function scanItems(items, path = 'root') {
  if (!items || !Array.isArray(items)) return;

  items.forEach((item, idx) => {
    const currentPath = `${path}[${idx}]`;

    if (item.category === CARD) {
      const ads = detectCardAd(item);
      if (ads) {
        adStats.total++;
        console.log(`\n❌ 发现广告: ${currentPath}`);
        console.log(`   卡片类型: card_type=${item.data?.card_type}`);
        ads.forEach(ad => {
          console.log(`   - ${ad.type}${ad.index !== undefined ? `[${ad.index}]` : ''}: ${JSON.stringify(ad.value || ad.title || 'detected')}`);
          adStats.types[ad.type] = (adStats.types[ad.type] || 0) + 1;
        });
      }

      // 递归检查 data.items
      if (item.data?.items) {
        scanItems(item.data.items, `${currentPath}.data.items`);
      }
    }

    if (item.category === FEED) {
      const ads = detectFeedAd(item);
      if (ads) {
        adStats.total++;
        console.log(`\n❌ 发现广告: ${currentPath}`);
        ads.forEach(ad => {
          console.log(`   - ${ad.type}: ${JSON.stringify(ad.value || 'detected')}`);
          adStats.types[ad.type] = (adStats.types[ad.type] || 0) + 1;
        });
      }
    }

    if (item.category === GROUP && item.items) {
      scanItems(item.items, `${currentPath}.items`);
    }
  });
}

// 执行扫描
console.log('========================================');
console.log('开始扫描广告...');
console.log('========================================');

scanItems(testData.items);

// 输出统计结果
console.log('\n========================================');
console.log('扫描结果统计');
console.log('========================================');
console.log(`总计发现广告: ${adStats.total} 个`);
console.log('\n广告类型分布:');
Object.entries(adStats.types).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count} 个`);
});

console.log('\n========================================');
console.log('结论');
console.log('========================================');
if (adStats.total === 0) {
  console.log('✅ 未检测到任何广告,过滤效果完美!');
} else {
  console.log(`⚠️  仍有 ${adStats.total} 个广告未被过滤`);
  console.log('需要进一步增强过滤逻辑');
}
