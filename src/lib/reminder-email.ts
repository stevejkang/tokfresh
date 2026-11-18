// Used when Anthropic does not return refresh_token_expires_in with the grant.
export const DEFAULT_LOGIN_LIFETIME_DAYS = 28;
export const REMINDER_LEAD_DAYS = 3;

export type ReminderLocale = "en" | "ko";

function setupUrl(locale: ReminderLocale): string {
  return `https://tokfresh.com/${locale}/setup?utm_source=resend&utm_medium=email&utm_campaign=reauth-reminder`;
}
const GITHUB_URL = "https://github.com/stevejkang/tokfresh";

const RESET_TABLE_STYLE =
  "margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0";
const P_GREETING = "margin:0 0 20px 0;padding:0;font-size:15px;line-height:1.6;color:#27272a";
const P_HEADING = "margin:0 0 8px 0;padding:0;font-size:15px;line-height:1.6;color:#27272a;font-weight:600";
const P_BODY = "margin:0 0 24px 0;padding:0;font-size:14px;line-height:1.6;color:#52525b";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function formatDate(date: Date, locale: string, timeZone: string): string {
  const options: Intl.DateTimeFormatOptions = { dateStyle: "long", timeStyle: "short", timeZone };
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return `${new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date)} UTC`;
  }
}

function link(href: string, label: string): string {
  return `<a
  href="${href}"
  rel="noopener noreferrer nofollow"
  style="color:#2563eb;text-decoration-line:none;text-decoration:underline"
  target="_blank"
  ><u>${label}</u></a
>`;
}

function button(href: string, label: string): string {
  return `<table
  border="0"
  cellpadding="0"
  cellspacing="0"
  role="presentation"
  style="margin-top:0;margin-right:0;margin-bottom:20px;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"
>
  <tbody>
    <tr style="margin:0;padding:0">
      <td
        align="center"
        data-id="__react-email-column"
        style="margin:0;padding:0;background-color:#18181b;border-radius:6px"
      >
        <p style="margin:0;padding:0">
          <a
            href="${href}"
            rel="noopener noreferrer nofollow"
            style="color:#ffffff;text-decoration-line:none;text-decoration:none;display:inline-block;padding:10px 24px;font-size:14px;font-weight:600"
            target="_blank"
            >${label}</a
          >
        </p>
      </td>
    </tr>
  </tbody>
</table>`;
}

// HTML-bearing fields expect already-escaped `account`/`date` values.
const COPY = {
  ko: {
    dateLocale: "ko-KR",
    subject: "[TokFresh] Claude 재연결이 필요합니다",
    preheader: "Claude 로그인이 곧 만료됩니다. 셋업을 한 번 다시 실행해 주세요.",
    greeting: "안녕하세요,",
    expiry: (account: string, date: string) =>
      `<code>${account}</code> 계정의 Claude 로그인이 <strong>${date}</strong>에 만료됩니다. 만료되면 토큰을 더 이상 갱신할 수 없어 TokFresh 워커가 멈춥니다.`,
    heading: "해 주셔야 할 것",
    action:
      "TokFresh 셋업을 한 번 다시 실행해 Claude를 재연결해 주세요. 같은 Claude 계정으로 배포하면 기존 워커가 그대로 교체됩니다. TokFresh는 로그인 정보를 보관하지 않기 때문에 대신 연장해 드릴 수 없습니다.",
    button: "셋업 다시 실행하기",
    share: `TokFresh가 도움이 되셨다면 주변 동료나 지인분들에게도 소개해 주세요. 모든 코드는 ${link(GITHUB_URL, "GitHub에 공개")}되어 있습니다. 시간 되실 때 ★ 한 번 눌러주시면 큰 힘이 됩니다.`,
    footer: "셋업 중 재로그인 알림을 신청하셔서 1회 발송되는 메일입니다.",
    textExpiry: (account: string, date: string) => `${account} 계정의 Claude 로그인이 ${date}에 만료됩니다.`,
    textAction: (url: string) => `TokFresh 셋업을 한 번 다시 실행해 Claude를 재연결해 주세요: ${url}`,
  },
  en: {
    dateLocale: "en-US",
    subject: "[TokFresh] Reconnect Claude to keep TokFresh running",
    preheader: "Your Claude login for TokFresh expires soon.",
    greeting: "Hi there,",
    expiry: (account: string, date: string) =>
      `The Claude login for <code>${account}</code> expires on <strong>${date}</strong>. After that, the token can no longer be refreshed and your TokFresh worker will stop.`,
    heading: "What you need to do",
    action:
      "Re-run the TokFresh setup once to reconnect Claude. Deploying with the same Claude account replaces your existing worker. TokFresh never stores your login, so we can&#x27;t extend it for you.",
    button: "Re-run Setup",
    share: `If you find TokFresh useful, share it with your colleagues. All code is ${link(GITHUB_URL, "open source")} — a star on the repo would mean a lot.`,
    footer: "You&#x27;re receiving this one-time email because you requested a re-login reminder during setup.",
    textExpiry: (account: string, date: string) => `The Claude login for ${account} expires on ${date}.`,
    textAction: (url: string) => `Re-run the TokFresh setup once to reconnect Claude: ${url}`,
  },
} as const;

export function buildReminderEmail(params: {
  claudeEmail: string;
  expiresAt: Date;
  timeZone: string;
  locale: ReminderLocale;
}): { subject: string; html: string; text: string } {
  const c = COPY[params.locale];
  const account = escapeHtml(params.claudeEmail);
  const dateRaw = formatDate(params.expiresAt, c.dateLocale, params.timeZone);
  const date = escapeHtml(dateRaw);
  const urlText = setupUrl(params.locale);
  const urlHtml = escapeHtml(urlText);

  const subject = c.subject;

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="${params.locale}">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
  </head>
  <body style="background-color:#ffffff">
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td style="background-color:#ffffff">
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="max-width:100%;align:center;width:100%;color:#000000;background-color:#ffffff;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;border-radius:0px;border-color:#000000"
            >
              <tbody>
                <tr style="width:100%">
                  <td>
                    <p style="margin:0;padding:0">
                      <span style="color:transparent"
                        ><span
                          style="color:transparent;display:none;height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;visibility:hidden;width:0"
                          >${c.preheader}</span
                        ></span
                      >
                    </p>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="${RESET_TABLE_STYLE};background-color:#f4f4f5"
                    >
                      <tbody>
                        <tr style="margin:0;padding:0">
                          <td align="center" data-id="__react-email-column" style="margin:0;padding:40px 16px">
                            <table
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="${RESET_TABLE_STYLE};max-width:560px;background-color:#ffffff;border-radius:8px;border-style:solid;border-width:1px;border-color:#e4e4e7"
                            >
                              <tbody>
                                <tr style="margin:0;padding:0">
                                  <td data-id="__react-email-column" style="margin:0;padding:32px 32px 0 32px">
                                    <table
                                      width="100%"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="${RESET_TABLE_STYLE}"
                                    >
                                      <tbody>
                                        <tr style="margin:0;padding:0">
                                          <td
                                            data-id="__react-email-column"
                                            style="margin:0;padding:0;font-size:20px;font-weight:700;color:#18181b;letter-spacing:-0.02em"
                                          >
                                            <p style="margin:0;padding:0">TokFresh - Claude Token Reset Automation</p>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                                <tr style="margin:0;padding:0">
                                  <td data-id="__react-email-column" style="margin:0;padding:24px 32px">
                                    <p style="${P_GREETING}">${c.greeting}</p>
                                    <p style="${P_GREETING}">${c.expiry(account, date)}</p>
                                    <p style="${P_HEADING}">${c.heading}</p>
                                    <p style="${P_BODY}">${c.action}</p>
                                    ${button(urlHtml, c.button)}
                                    <p style="margin:0;padding:0;font-size:14px;line-height:1.6;color:#71717a">${c.share}</p>
                                  </td>
                                </tr>
                                <tr style="margin:0;padding:0">
                                  <td data-id="__react-email-column" style="margin:0;padding:0 32px 32px 32px">
                                    <table
                                      width="100%"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="${RESET_TABLE_STYLE};border-top:1px solid #e4e4e7"
                                    >
                                      <tbody>
                                        <tr style="margin:0;padding:0">
                                          <td
                                            data-id="__react-email-column"
                                            style="margin:0;padding:0;padding-top:20px;font-size:12px;line-height:1.5;color:#a1a1aa"
                                          >
                                            <p style="margin:0;padding:0">${c.footer}</p>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="margin:0;padding:0"><br /></p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;

  const text = [
    c.greeting,
    "",
    c.textExpiry(params.claudeEmail, dateRaw),
    c.textAction(urlText),
  ].join("\n");

  return { subject, html, text };
}
