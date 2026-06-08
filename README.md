# 🍶 옥수주조 손님발주 시스템

옥수주조 주류 온라인 발주 시스템 (Google Apps Script 기반)

---

## 주요 기능

- ✅ 성인인증 체크박스 (만 19세 이상 확인)
- 🛒 상품·수량 선택 → 자동 금액·배송료 계산
- ⚠️ 최소 3병 주문 검증
- 🔖 주문번호 자동 생성 (`#YYMMDD-XXXX`)
- 💳 계좌번호 표시 + 한 번 클릭 복사
- 📊 주문 데이터 → Google Sheets 자동 저장
- 📱 모바일 반응형 UI

---

## 상품 목록

| 상품 | 가격 |
|------|------|
| 옥주 9도 (오리지널·새콤·옥수수·고구마·바나나·패션후르츠·망고·블러드오렌지·말차·토마토·블루베리) | 7,000원/병 |
| 이밤에취해 | 25,000원/병 |

- 배송료: 4,000원 (60,000원 이상 구매 시 무료)
- 최소 주문: 3병

---

## 설치 및 배포 가이드

### 1단계: Google Sheets 준비

1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트 생성
2. URL에서 Spreadsheet ID 복사
   ```
   https://docs.google.com/spreadsheets/d/[★이 부분★]/edit
   ```

### 2단계: Google Apps Script 프로젝트 생성

1. [script.google.com](https://script.google.com) 접속
2. **새 프로젝트** 클릭
3. 프로젝트 이름: `옥수주조-손님발주`
4. 파일 추가 및 코드 붙여넣기:

| GAS 파일명 | 이 저장소 파일 |
|-----------|-------------|
| `코드.gs` (기본 파일) | `Code.gs` |
| `index` (HTML 파일 추가) | `index.html` |

5. `appsscript.json` 내용도 동일하게 적용
   - 메뉴 → **프로젝트 설정** → **"appsscript.json" 매니페스트 파일 표시** 체크

### 3단계: Spreadsheet ID 설정

`Code.gs` 상단에서 아래 줄을 수정합니다:

```javascript
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
// ↓ 변경
var SPREADSHEET_ID = '복사한_스프레드시트_ID';
```

### 4단계: 계좌번호 확인

`index.html`에서 실제 계좌번호로 교체합니다 (2곳):

```html
<!-- 표시용 -->
<div class="account-number" id="accountNumber">3333-25-0000000</div>

<!-- 성공 모달 -->
입금 계좌: <strong>카카오뱅크 3333-25-0000000</strong>
```

### 5단계: 웹앱 배포

1. GAS 에디터 → **배포** → **새 배포**
2. 유형: **웹 앱**
3. 설정:
   - 다음 사용자로 실행: **나(배포자)**
   - 액세스 권한: **모든 사용자(익명 포함)**
4. **배포** 클릭 → 웹앱 URL 복사
5. 브라우저에서 URL 열어 확인

---

## clasp를 이용한 로컬 개발 (선택)

```bash
npm install -g @google/clasp
clasp login
clasp clone <SCRIPT_ID>   # GAS 프로젝트 ID
clasp push                # 로컬 → GAS 업로드
clasp open                # 브라우저에서 GAS 에디터 열기
```

---

## Google Sheets 컬럼 구조

| 컬럼 | 내용 |
|------|------|
| A | 주문번호 |
| B | 주문일시 |
| C | 주문자명 |
| D | 연락처 |
| E | 배송지 |
| F | 상세주소 |
| G | 우편번호 |
| H | 상품내역 |
| I | 총수량(병) |
| J | 상품금액 |
| K | 배송료 |
| L | 최종금액 |
| M | 입금자명 |
| N | 성인인증 |
| O | 비고 |

---

## 라이선스

MIT License — 옥수주조 내부 사용 목적
