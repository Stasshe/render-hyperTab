/*
 * カスタムBing検索ハンドラ
 * 検索クエリをBingで検索し、結果をカスタム表示する
 */

// URLかどうかを判定する関数
function isValidURL(string) {
  try {
    // スキームがない場合は処理
    if (!string.match(/^[a-zA-Z]+:\/\//)) {
      // 一般的なドメイン形式をチェック (.com, .net, .org, .jpなど)
      if (string.match(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)*/)) {
        return true;
      }
      // IPアドレスチェック
      if (string.match(/^(\d{1,3}\.){3}\d{1,3}(:.+)?(\/.*)*$/)) {
        return true;
      }
      return false;
    }
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// 検索クエリかURLかを判断して適切にハンドリングする
function handleSearch(query) {
  // 空の場合は何もしない
  if (!query || query.trim() === '') return;
  
  // 特殊なHTプロトコルの場合は通常通り処理
  if (query.startsWith('ht://')) {
    return {
      isUrl: true,
      url: query
    };
  }
  
  // URLかどうかをチェック
  if (isValidURL(query)) {
    // URLの場合、https://がない場合は追加
    if (!query.match(/^[a-zA-Z]+:\/\//)) {
      query = 'https://' + query;
    }
    return {
      isUrl: true,
      url: query
    };
  } else {
    // 検索クエリの場合
    return {
      isUrl: false,
      searchQuery: query,
      bingUrl: 'https://www.bing.com/search?q=' + encodeURIComponent(query)
    };
  }
}

// Bingから検索結果を取得して表示
async function performBingSearch(query, targetFrame) {
  const bingUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
  
  try {
    // フレームをBingの検索結果にリダイレクト (直接アクセス)
    if (targetFrame) {
      targetFrame.location.href = bingUrl;
    }
    return true;
  } catch (error) {
    console.error('Bing検索中にエラーが発生しました:', error);
    return false;
  }
}

// URLバーの入力処理
function processUrlBarInput(inputValue) {
  const result = handleSearch(inputValue);
  
  if (result.isUrl) {
    // URLの場合はUVプロキシを使用
    return `${__uv$config.prefix}${xor.encode(result.url)}`;
  } else {
    // 検索クエリの場合は直接Bingを使用
    return result.bingUrl;
  }
}

// エクスポート
window.BingSearchHandler = {
  handleSearch,
  performBingSearch,
  processUrlBarInput,
  isValidURL
};