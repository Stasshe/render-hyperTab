/*
 * ブラウザナビゲーションツール
 * ユーザー入力をウェブナビゲーションと検索に分類
 */

// アドレス検証機能
function validateAddress(input) {
  try {
    // プロトコルがない場合の処理
    if (!input.match(/^[a-zA-Z]+:\/\//)) {
      // ドメインパターン検証
      if (input.match(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)*/)) {
        return true;
      }
      // IP形式検証
      if (input.match(/^(\d{1,3}\.){3}\d{1,3}(:.+)?(\/.*)*$/)) {
        return true;
      }
      return false;
    }
    new URL(input);
    return true;
  } catch (_) {
    return false;
  }
}

// 入力処理
function processInput(query) {
  // 空の場合は何もしない
  if (!query || query.trim() === '') return;
  
  // 特殊プロトコル処理
  if (query.startsWith('ht://')) {
    return {
      type: 'address',
      url: query
    };
  }
  
  // ウェブアドレス判定
  if (validateAddress(query)) {
    // プロトコル追加
    if (!query.match(/^[a-zA-Z]+:\/\//)) {
      query = 'https://' + query;
    }
    return {
      type: 'address',
      url: query
    };
  } else {
    // 検索クエリの場合
    const encodedQuery = encodeURIComponent(query);
    return {
      type: 'search',
      query: query,
      searchUrl: 'https://search.example.com/results?q=' + encodedQuery
    };
  }
}

// 検索インターフェース生成
function createSearchInterface(query, targetFrame) {
  if (!targetFrame) return false;
  
  const searchUrl1 = 'https://search.example.com/results?q=' + encodeURIComponent(query);
  const searchUrl2 = 'https://search.alternative.com/search?q=' + encodeURIComponent(query);
  
  // カスタム検索ページ表示
  const doc = targetFrame.document;
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${query} - 検索</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #fff;
          }
          .container {
            max-width: 850px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
          }
          .input-box {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 24px;
            font-size: 16px;
            width: 100%;
          }
          .options {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .options h3 {
            margin-top: 0;
          }
          .btn {
            background-color: #fff;
            border: 1px solid #dadce0;
            border-radius: 4px;
            color: #1a73e8;
            font-size: 14px;
            margin: 5px;
            padding: 8px 16px;
            cursor: pointer;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #70757a;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 24px; font-weight: bold; color: #4285f4;">検索</div>
            <input type="text" class="input-box" value="${query}" id="searchInput">
          </div>
          
          <div class="options">
            <h3>検索オプション</h3>
            <p>「${query}」の検索結果を表示します：</p>
            <button class="btn" id="searchBtn1">検索エンジン1</button>
            <button class="btn" id="searchBtn2">検索エンジン2</button>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()}</p>
            <p>プライバシー・利用規約</p>
          </div>
        </div>
        
        <script>
          // Enterキー処理
          document.getElementById('searchInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              const newQuery = encodeURIComponent(this.value);
              window.location.href = '${__uv$config.prefix}${xor.encode(searchUrl1.replace(encodeURIComponent(query), newQuery))}';
            }
          });
          
          // 検索ボタン処理
          document.getElementById('searchBtn1').addEventListener('click', function() {
            window.location.href = '${__uv$config.prefix}${xor.encode(searchUrl1)}';
          });
          
          document.getElementById('searchBtn2').addEventListener('click', function() {
            window.location.href = '${__uv$config.prefix}${xor.encode(searchUrl2)}';
          });
        </script>
      </body>
    </html>
  `);
  doc.close();
  
  return true;
}

// 検索処理実行
function executeSearch(query, targetFrame) {
  try {
    // 検索インターフェース表示
    return createSearchInterface(query, targetFrame);
  } catch (error) {
    console.error('実行中にエラーが発生しました:', error);
    // エラー時の代替処理
    if (targetFrame) {
      const searchUrl = 'https://search.example.com/results?q=' + encodeURIComponent(query);
      targetFrame.location.href = __uv$config.prefix + xor.encode(searchUrl);
    }
    return false;
  }
}

// 入力処理
function formatNavigation(inputValue) {
  const result = processInput(inputValue);
  
  if (!result) return '';
  
  if (result.type === 'address') {
    // アドレス処理
    return `${__uv$config.prefix}${xor.encode(result.url)}`;
  } else {
    // 検索クエリ処理
    return result.searchUrl;
  }
}

// エクスポート
window.WebNavigation = {
  handleSearch: processInput,
  performSearch: executeSearch,
  processUrlBarInput: formatNavigation,
  isValidURL: validateAddress
};