// GASエディタで runTests() を実行してテスト結果を確認する
function runTests() {
  const results = [];

  results.push(...test_extractText());
  results.push(...test_extractFirstUrl());
  results.push(...test_matchSource());
  results.push(...test_resolveSource());
  results.push(...test_buildSlackText());
  results.push(...test_buildGmailBody());

  const passed = results.filter(function(r) { return r.ok; }).length;
  const failed = results.filter(function(r) { return !r.ok; }).length;

  results.forEach(function(r) {
    if (r.ok) {
      console.log('✅ ' + r.name);
    } else {
      console.log('❌ ' + r.name + '\n   期待値: ' + r.expected + '\n   実際値: ' + r.actual);
    }
  });

  console.log('\n結果: ' + passed + ' passed / ' + failed + ' failed');
}

// ─── アサーションヘルパー ───────────────────────────────────────

function assert(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  return { name: name, ok: ok, actual: JSON.stringify(actual), expected: JSON.stringify(expected) };
}

function assertContains(name, actual, substring) {
  const ok = typeof actual === 'string' && actual.indexOf(substring) >= 0;
  return { name: name, ok: ok, actual: actual, expected: '含む: ' + substring };
}

function assertNotEmpty(name, actual) {
  const ok = actual !== null && actual !== undefined && actual !== '';
  return { name: name, ok: ok, actual: actual, expected: '空でない値' };
}

// ─── extractText ───────────────────────────────────────────────

function test_extractText() {
  return [
    assert(
      'extractText: 基本的なHTMLタグを除去する',
      extractText('<p>Hello <b>World</b></p>'),
      'Hello World'
    ),
    assert(
      'extractText: <br> を改行に変換する',
      extractText('line1<br>line2'),
      'line1\nline2'
    ),
    assert(
      'extractText: <style> ブロックを除去する',
      extractText('<style>.foo{color:red}</style>本文'),
      '本文'
    ),
    assert(
      'extractText: HTMLエンティティをデコードする',
      extractText('&amp; &lt; &gt; &nbsp;'),
      '& < >  '
    ),
    assert(
      'extractText: 空文字列を返す（null入力）',
      extractText(null),
      ''
    ),
    assert(
      'extractText: 連続改行を2行以内に圧縮する',
      extractText('a\n\n\n\nb'),
      'a\n\nb'
    ),
  ];
}

// ─── extractFirstUrl ──────────────────────────────────────────

function test_extractFirstUrl() {
  return [
    assert(
      'extractFirstUrl: 最初のURLを取得する',
      extractFirstUrl('詳細は https://example.com/article を参照'),
      'https://example.com/article'
    ),
    assert(
      'extractFirstUrl: URLがない場合は空文字列を返す',
      extractFirstUrl('URLなしのテキスト'),
      ''
    ),
    assert(
      'extractFirstUrl: 複数URLがある場合は最初のものを返す',
      extractFirstUrl('https://first.com and https://second.com'),
      'https://first.com'
    ),
    assert(
      'extractFirstUrl: null入力は空文字列を返す',
      extractFirstUrl(null),
      ''
    ),
  ];
}

// ─── matchSource ─────────────────────────────────────────────

function test_matchSource() {
  return [
    assert(
      'matchSource: 既知の送信元にマッチする',
      matchSource('Python Weekly <newsletter@pythonweekly.com>').name,
      'Python Weekly'
    ),
    assert(
      'matchSource: 大文字小文字を無視してマッチする',
      matchSource('NEWSLETTER@PYTHONWEEKLY.COM').name,
      'Python Weekly'
    ),
    assert(
      'matchSource: マッチしない場合は Unknown を返す',
      matchSource('unknown@example.com').name,
      'Unknown'
    ),
    assert(
      'matchSource: 空文字列は Unknown を返す',
      matchSource('').name,
      'Unknown'
    ),
  ];
}

// ─── resolveSource ────────────────────────────────────────────

function test_resolveSource() {
  return [
    assert(
      'resolveSource: defaults がマージされる',
      resolveSource({ name: 'Test', notify: ['slack'] }).forwardTo,
      CONFIG.defaults.forwardTo
    ),
    assert(
      'resolveSource: source の値が defaults を上書きする',
      resolveSource({ name: 'Test', slackChannel: '#custom' }).slackChannel,
      '#custom'
    ),
  ];
}

// ─── buildSlackText ───────────────────────────────────────────

function test_buildSlackText() {
  const result = {
    subject: 'Python Weekly #999',
    date: '2026-04-25',
    translated: '今週のPythonニュース',
    url: 'https://example.com',
  };

  return [
    assertContains(
      'buildSlackText: 件名が含まれる',
      buildSlackText(result),
      'Python Weekly #999'
    ),
    assertContains(
      'buildSlackText: 日付が含まれる',
      buildSlackText(result),
      '2026-04-25'
    ),
    assertContains(
      'buildSlackText: 翻訳テキストが含まれる',
      buildSlackText(result),
      '今週のPythonニュース'
    ),
    assertContains(
      'buildSlackText: URLが含まれる',
      buildSlackText(result),
      'https://example.com'
    ),
    assert(
      'buildSlackText: URLなしの場合はリンク行を含まない',
      buildSlackText(Object.assign({}, result, { url: '' })).indexOf('🔗') < 0,
      true
    ),
  ];
}

// ─── buildGmailBody ───────────────────────────────────────────

function test_buildGmailBody() {
  const result = {
    subject: 'Python Weekly #999',
    date: '2026-04-25',
    translated: '翻訳テキスト',
    original: 'Original text',
  };

  return [
    assertContains(
      'buildGmailBody: 件名が含まれる',
      buildGmailBody(result),
      'Python Weekly #999'
    ),
    assertContains(
      'buildGmailBody: 翻訳テキストが含まれる',
      buildGmailBody(result),
      '翻訳テキスト'
    ),
    assertContains(
      'buildGmailBody: 原文が含まれる',
      buildGmailBody(result),
      'Original text'
    ),
  ];
}
