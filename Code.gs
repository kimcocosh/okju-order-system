// ===== 헤더 초기 세팅 (최초 1회 GAS 에디터에서 직접 실행) =====
function setupHeaders() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { sheet = ss.insertSheet(SHEET_NAME); }

  var headers = [
    '주문번호', '주문일시', '주문자명', '연락처',
    '배송지', '상세주소', '우편번호',
    '상품내역', '총수량(병)', '상품금액', '배송료', '최종금액',
    '입금자명', '성인인증', '비고'
  ];

  // 1행에 헤더 삽입 (기존 데이터가 있으면 위로 밀림)
  sheet.insertRowBefore(1);
  var hRange = sheet.getRange(1, 1, 1, headers.length);
  hRange.setValues([headers]);
  hRange.setBackground('#2d4a2d').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);

  // 컬럼 너비 정리
  sheet.setColumnWidth(1, 100);  // 주문번호
  sheet.setColumnWidth(2, 150);  // 주문일시
  sheet.setColumnWidth(3, 80);   // 주문자명
  sheet.setColumnWidth(4, 120);  // 연락처
  sheet.setColumnWidth(5, 220);  // 배송지
  sheet.setColumnWidth(6, 120);  // 상세주소
  sheet.setColumnWidth(7, 70);   // 우편번호
  sheet.setColumnWidth(8, 250);  // 상품내역
  sheet.setColumnWidth(9, 80);   // 총수량
  sheet.setColumnWidth(10, 80);  // 상품금액
  sheet.setColumnWidth(11, 70);  // 배송료
  sheet.setColumnWidth(12, 80);  // 최종금액
  sheet.setColumnWidth(13, 80);  // 입금자명
  sheet.setColumnWidth(14, 70);  // 성인인증
  sheet.setColumnWidth(15, 150); // 비고

  SpreadsheetApp.getUi().alert('헤더 설정 완료!');
}

// ===== 설정 =====
var SPREADSHEET_ID = '1jAd4-or1HkisOs3p9MrNT9gvP9USL_S9K302RBsVT80';
var SHEET_NAME     = '주문내역';
var CJ_SHEET_NAME  = 'cj택배';

var NOTIFY_EMAILS  = ['kimcocosh@gmail.com', 'pakkom10@gmail.com'];

var SHIPPING_FEE           = 3000;
var FREE_SHIPPING_THRESHOLD = 50000;

// ===== 웹앱 진입점 =====
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('옥수주조 주문하기')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var result = saveOrder(data);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== 주문 저장 =====
function saveOrder(data) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getOrCreateOrderSheet(ss);
  var cjSheet = getOrCreateCJSheet(ss);

  var now       = new Date();
  var timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  var itemsText = data.items.map(function(i) { return i.name + ' x' + i.qty + '병'; }).join(', ');

  // ── 주문내역 시트에 저장 ──
  var orderRow = [
    data.orderNumber, timestamp,
    data.customerName, data.phone,
    data.address, data.addressDetail, data.zipCode,
    itemsText, data.totalQty,
    data.subtotal, data.shippingFee, data.totalAmount,
    data.depositorName,
    data.adultVerified ? '확인' : '미확인',
    data.note || ''
  ];
  sheet.appendRow(orderRow);

  var lastRow = sheet.getLastRow();
  if (lastRow % 2 === 0) {
    sheet.getRange(lastRow, 1, 1, orderRow.length).setBackground('#f0f4f0');
  }

  // ── CJ택배양식 시트에 저장 ──
  var fullAddress = data.address + (data.addressDetail ? ' ' + data.addressDetail : '');
  var boxes = data.totalQty <= 14 ? 1 : data.totalQty <= 28 ? 2 : 3;
  var itemDetail = data.items.map(function(i) { return i.name + i.qty + '개'; }).join(', ');

  var cjRow = [
    data.customerName,      // 받는분성명
    data.phone,             // 받는분전화번호
    fullAddress,            // 받는분주소
    '신선식품(냉장)',        // 품목명
    boxes,                  // 박스
    '신용',                 // 운임구분
    '극소',                 // 박스타입
    itemDetail,             // 내품명
    data.note || ''         // 배송메세지1
  ];
  cjSheet.appendRow(cjRow);

  // ── 이메일 알림 ──
  sendOrderNotification(data, timestamp);

  return { success: true, orderNumber: data.orderNumber };
}

// ===== 시트 초기화 =====
function getOrCreateOrderSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = [
      '주문번호', '주문일시', '주문자명', '연락처',
      '배송지', '상세주소', '우편번호',
      '상품내역', '총수량(병)', '상품금액', '배송료', '최종금액',
      '입금자명', '성인인증', '비고'
    ];
    var hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setValues([headers]);
    hRange.setBackground('#2d4a2d').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateCJSheet(ss) {
  var sheet = ss.getSheetByName(CJ_SHEET_NAME);
  if (!sheet) {
    throw new Error('시트를 찾을 수 없습니다: ' + CJ_SHEET_NAME);
  }
  return sheet;
}

// ===== 이메일 알림 =====
function sendOrderNotification(data, timestamp) {
  var subject = '[옥주 신규주문] ' + data.orderNumber + ' ㅣ ' + data.customerName + ' (' + data.totalQty + '병)';

  var itemRows = data.items.map(function(i) {
    return '<tr><td style="padding:6px 12px;">' + i.name + '</td>'
         + '<td style="padding:6px 12px; text-align:center;">' + i.qty + '병</td>'
         + '<td style="padding:6px 12px; text-align:right;">' + (i.price * i.qty).toLocaleString() + '원</td></tr>';
  }).join('');

  var boxes = data.totalQty <= 14 ? 1 : data.totalQty <= 28 ? 2 : 3;

  var html = '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #ddd;border-radius:10px;overflow:hidden;">'

    + '<div style="background:#2d5a2d;color:#fff;padding:16px 20px;">'
    + '<h2 style="margin:0;font-size:18px;">🍶 옥수주조 신규 주문</h2>'
    + '<p style="margin:4px 0 0;font-size:13px;opacity:0.8;">' + timestamp + '</p>'
    + '</div>'

    + '<div style="padding:16px 20px;">'

    + '<table style="width:100%;border-collapse:collapse;margin-bottom:14px;">'
    + '<tr><td style="color:#666;padding:4px 0;width:90px;">주문번호</td>'
    + '<td style="font-weight:bold;color:#c9a84c;">' + data.orderNumber + '</td></tr>'
    + '<tr><td style="color:#666;padding:4px 0;">주문자</td>'
    + '<td>' + data.customerName + ' (' + data.phone + ')</td></tr>'
    + '<tr><td style="color:#666;padding:4px 0;">배송지</td>'
    + '<td>' + data.address + (data.addressDetail ? ' ' + data.addressDetail : '') + '</td></tr>'
    + '<tr><td style="color:#666;padding:4px 0;">입금자명</td>'
    + '<td>' + data.depositorName + '</td></tr>'
    + (data.note ? '<tr><td style="color:#666;padding:4px 0;">메모</td><td>' + data.note + '</td></tr>' : '')
    + '</table>'

    + '<table style="width:100%;border-collapse:collapse;background:#f8f8f8;border-radius:6px;margin-bottom:14px;">'
    + '<thead><tr style="background:#e0e8e0;">'
    + '<th style="padding:8px 12px;text-align:left;">상품</th>'
    + '<th style="padding:8px 12px;">수량</th>'
    + '<th style="padding:8px 12px;text-align:right;">금액</th>'
    + '</tr></thead>'
    + '<tbody>' + itemRows + '</tbody>'
    + '</table>'

    + '<table style="width:100%;border-collapse:collapse;">'
    + '<tr><td style="color:#666;padding:4px 0;">상품금액</td>'
    + '<td style="text-align:right;">' + data.subtotal.toLocaleString() + '원</td></tr>'
    + '<tr><td style="color:#666;padding:4px 0;">배송료</td>'
    + '<td style="text-align:right;">' + (data.shippingFee === 0 ? '무료' : data.shippingFee.toLocaleString() + '원') + '</td></tr>'
    + '<tr style="font-size:16px;font-weight:bold;border-top:2px solid #2d5a2d;">'
    + '<td style="padding:8px 0;color:#2d5a2d;">최종 금액</td>'
    + '<td style="text-align:right;color:#2d5a2d;">' + data.totalAmount.toLocaleString() + '원</td></tr>'
    + '</table>'

    + '<div style="background:#e8f0ff;border-radius:6px;padding:10px 12px;margin-top:14px;font-size:13px;">'
    + '📦 CJ택배 박스: <strong>' + boxes + '개</strong>'
    + ' &nbsp;|&nbsp; 운임: 신용 &nbsp;|&nbsp; 박스타입: 극소'
    + '</div>'

    + '</div>'
    + '</div>';

  NOTIFY_EMAILS.forEach(function(email) {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: html
    });
  });
}
