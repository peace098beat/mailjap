// エントリーポイント。時間トリガーから呼び出す（1時間ごと）
function run() {
  CONFIG.sources.forEach(function(source) {
    const src = resolveSource(source);
    log('処理開始: ' + src.name);

    try {
      const mails = getUnprocessedMails(src.gmailLabel);
      log(src.name + ': ' + mails.length + ' 件取得');

      mails.forEach(function(mail) {
        try {
          processMail(src, mail);
        } catch (e) {
          log('メール処理エラー [' + mail.subject + ']: ' + e.message);
        }
      });
    } catch (e) {
      log('ソース処理エラー [' + src.name + ']: ' + e.message);
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
