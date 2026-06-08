// ===== 설정 =====
// Google Sheets ID를 아래에 입력하세요 (시트 URL의 /d/와 /edit 사이 문자열)
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
var SHEET_NAME = '주문내역';

// ===== 웹앱 진입점 =====
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('옥수주조 손님발주 시스템')
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
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // 헤더 행 생성
    var headers = [
      '주문번호', '주문일시', '주문자명', '연락처',
      '배송지', '상세주소', '우편번호',
      '상품내역', '총수량(병)', '상품금액', '배송료', '최종금액',
      '입금자명', '성인인증', '비고'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#2d4a2d')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // 상품내역 문자열 생성
  var itemsText = data.items.map(function(item) {
    return item.name + ' x' + item.qty + '병';
  }).join(', ');

  var now = new Date();
  var timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

  var row = [
    data.orderNumber,
    timestamp,
    data.customerName,
    data.phone,
    data.address,
    data.addressDetail,
    data.zipCode,
    itemsText,
    data.totalQty,
    data.subtotal,
    data.shippingFee,
    data.totalAmount,
    data.depositorName,
    data.adultVerified ? '확인' : '미확인',
    data.note || ''
  ];

  sheet.appendRow(row);

  // 마지막 행 스타일 적용
  var lastRow = sheet.getLastRow();
  var rowRange = sheet.getRange(lastRow, 1, 1, row.length);
  if (lastRow % 2 === 0) {
    rowRange.setBackground('#f0f4f0');
  }

  return { success: true, orderNumber: data.orderNumber };
}

// ===== 주문번호 생성 (클라이언트 호출용) =====
function generateOrderNumber() {
  var now = new Date();
  var yy = Utilities.formatDate(now, 'Asia/Seoul', 'yyMMdd');
  var seq = Math.floor(Math.random() * 9000) + 1000;
  return '#' + yy + '-' + seq;
}
