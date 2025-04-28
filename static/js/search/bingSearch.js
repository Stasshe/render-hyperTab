/*
 * カスタム検索機能
 * 検索クエリをBingで検索して結果をカスタム表示
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

// BareServerを使用してBingの検索結果を取得して表示する処理
async function fetchAndDisplayBingResults(query, targetFrame) {
  const bingUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
  
  try {
    // BareServerを使用してbingの検索結果を取得
    const bareClient = new BareClient(__uv$config.bare);
    const response = await bareClient.fetch(bingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error('検索結果の取得に失敗しました');
      return false;
    }
    
    const html = await response.text();
    
    // 検索結果をパースしてiframeに表示
    if (targetFrame) {
      const doc = targetFrame.document;
      doc.open();
      doc.write(html);
      
      // スタイルを調整するスクリプトを追加
      doc.write(`
        <style>
          body {
            font-family: Arial, sans-serif;
          }
          .b_searchboxForm {
            display: none !important;
          }
        </style>
      `);
      
      doc.close();
      
      // リンクをクリック時に現在のタブ内で開くように処理
      const links = doc.querySelectorAll('a');
      links.forEach(link => {
        if (link.href && !link.href.startsWith('javascript:')) {
          link.setAttribute('target', '_self');
          const originalHref = link.href;
          
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = originalHref;
            // URLをフォーマットしてタブ内で表示
            if (isValidURL(url)) {
              targetFrame.location.href = __uv$config.prefix + xor.encode(url);
            }
            return false;
          });
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('検索結果の取得中にエラーが発生しました:', error);
    console.log(error);
    
    // エラー時はフォールバックとして標準的なUVpを使用
    if (targetFrame) {
      const encodedUrl = __uv$config.prefix + xor.encode(bingUrl);
      targetFrame.location.href = encodedUrl;
    }
    return false;
  }
}

// 検索処理実行
async function performBingSearch(query, targetFrame) {
  try {
    // BareServerを使用してDOM解析して表示
    return await fetchAndDisplayBingResults(query, targetFrame);
  } catch (error) {
    console.error('検索処理中にエラーが発生しました:', error);
    // エラー時はフォールバックとして標準的なUVpを使用
    if (targetFrame) {
      const bingUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
      const encodedUrl = __uv$config.prefix + xor.encode(bingUrl);
      targetFrame.location.href = encodedUrl;
    }
    return false;
  }
}

// URLバーの入力処理
function processUrlBarInput(inputValue) {
  const result = handleSearch(inputValue);
  
  if (result.isUrl) {
    // URL処理
    return `${__uv$config.prefix}${xor.encode(result.url)}`;
  } else {
    // 検索クエリ処理
    return result.bingUrl;
  }
}

// エクスポート
window.BingSearchHandler = {
  handleSearch,
  performBingSearch,
  fetchAndDisplayBingResults,
  processUrlBarInput,
  isValidURL
};