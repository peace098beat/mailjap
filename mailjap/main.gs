// エントリーポイント。時間トリガーから呼び出す（1時間ごと）
function run() {
  const mails = getUnprocessedMails();
  log('取得件数: ' + mails.length);

  mails.forEach(function(mail) {
    try {
      const src = matchSource(mail.from);
      log('処理開始: ' + src.name + ' / ' + mail.subject);
      processMail(src, mail);
    } catch (e) {
      log('メール処理エラー [' + mail.subject + ']: ' + e.message);
    }
  });
}

function processMail(src, mail) {
  const bodyText = extractText(mail.body);

  let translatedText = bodyText;
  if (src.translate) {
    translatedText = translate(bodyText);
  }

  const result = {
    subject: mail.subject,
    date: mail.date,
    url: mail.url,
    original: bodyText,
    translated: translatedText,
  };

  notify(src, result);
  markDone(mail.thread);
  log('完了: ' + mail.subject);
}
