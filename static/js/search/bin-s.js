/*
 * 検索支援ツール
 * 入力をWebブラウズまたは検索に振り分ける
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

// 検索結果ページを生成・表示
function generateSearchResults(query, targetFrame) {
  if (!targetFrame) return false;
  
  const bingUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
  const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(query);
  
  // カスタム検索結果ページを表示
  const doc = targetFrame.document;
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${query} - 検索結果</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #fff;
          }
          .search-container {
            max-width: 850px;
            margin: 0 auto;
          }
          .search-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
          }
          .search-logo {
            width: 120px;
            margin-right: 20px;
          }
          .search-box {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 24px;
            font-size: 16px;
            width: 100%;
          }
          .search-buttons {
            margin-top: 15px;
            display: flex;
            gap: 10px;
          }
          .search-btn {
            background-color: #f8f9fa;
            border: 1px solid #dadce0;
            border-radius: 4px;
            color: #3c4043;
            font-size: 14px;
            padding: 8px 16px;
            cursor: pointer;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #70757a;
            font-size: 14px;
          }
          .search-options {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .search-options h3 {
            margin-top: 0;
          }
          .option-btn {
            background-color: #fff;
            border: 1px solid #dadce0;
            border-radius: 4px;
            color: #1a73e8;
            font-size: 14px;
            margin: 5px;
            padding: 8px 16px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="search-container">
          <div class="search-header">
            <div style="font-size: 24px; font-weight: bold; color: #4285f4;">検索</div>
            <input type="text" class="search-box" value="${query}" id="searchInput">
          </div>
          
          <div class="search-options">
            <h3>検索オプション</h3>
            <p>選択した検索エンジンで「${query}」を検索します：</p>
            <button class="option-btn" id="bingBtn">Bingで検索</button>
            <button class="option-btn" id="googleBtn">Googleで検索</button>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()}</p>
            <p>プライバシーポリシー・利用規約</p>
          </div>
        </div>
        
        <script>
          // 検索ボックスでEnterキーを押した時の処理
          document.getElementById('searchInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              window.location.href = '${__uv$config.prefix}${xor.encode(bingUrl)}';
            }
          });
          
          // 検索ボタンのイベント処理
          document.getElementById('bingBtn').addEventListener('click', function() {
            window.location.href = '${__uv$config.prefix}${xor.encode(bingUrl)}';
          });
          
          document.getElementById('googleBtn').addEventListener('click', function() {
            window.location.href = '${__uv$config.prefix}${xor.encode(googleUrl)}';
          });
        </script>
      </body>
    </html>
  `);
  doc.close();
  
  return true;
}

// 検索処理実行
function performBingSearch(query, targetFrame) {
  try {
    // カスタム検索結果ページを表示
    return generateSearchResults(query, targetFrame);
  } catch (error) {
    console.error('検索処理中にエラーが発生しました:', error);
    // エラー時はフォールバック
    if (targetFrame) {
      const bingUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
      targetFrame.location.href = __uv$config.prefix + xor.encode(bingUrl);
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
  processUrlBarInput,
  isValidURL
};