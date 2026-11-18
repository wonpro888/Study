# 판다마켓 미션 5

랜딩 화면에서 **구경하러 가기**를 누르면 중고마켓으로 이동합니다. 상품명이나 소개에 들어간 단어로 검색할 수 있고, 등록한 상품은 목록 맨 앞에 보입니다.

## 내 PC에서 실행

Node.js 22.12 이상과 MongoDB가 필요합니다. 아래 명령은 프로젝트 최상위 폴더에서 실행합니다.

1. `npm run setup`으로 필요한 패키지를 설치합니다.
2. `server/.env.example`을 `server/.env`로 복사합니다. 내 PC에서 MongoDB를 실행하면 예시에 있는 주소를 그대로 쓸 수 있습니다.
3. `npm run build`로 React 화면을 만든 뒤 `npm start`로 서버를 켭니다.
4. 브라우저에서 [판다마켓](http://localhost:3001)을 엽니다.

화면을 수정하면서 바로 확인하려면 서버를 켜 둔 상태에서 새 터미널에 `npm --prefix client run dev`를 입력합니다.

## 코드 살펴보기

- 화면 주소는 `/`(홈), `/items`(목록), `/registration`(등록)입니다. 등록에 성공하면 `/items/상품ID`로 이동합니다. 이번 과제의 상세 화면은 빈 페이지입니다.
- `client/src/useProductForm.js`에서 상품명·소개·가격·태그를 검사합니다. 태그를 입력한 뒤 Enter를 누르면 칩으로 추가됩니다.
- `server/app.js`에서 `/products`의 목록 조회·등록과 `/products/:id`의 상세 조회·수정·삭제를 처리합니다. 데이터 형식은 `server/product.js`에 있습니다.
- 목록은 최신순입니다. `GET /products?offset=0&limit=10&orderBy=recent&keyword=책`처럼 조회하면 상품 목록과 검색 결과 개수를 함께 받습니다.

## Render에 올릴 때

1. MongoDB Atlas에 데이터베이스를 준비합니다.
2. Render의 Web Service에 `server` 폴더를 연결합니다. 빌드 명령은 `npm ci`, 시작 명령은 `npm start`입니다. 환경 변수 `DB_CONNECT`에 Atlas 연결 주소를 넣습니다. 배포 후 `/health`에서 데이터베이스 연결을 확인합니다.
3. Static Site에 `client` 폴더를 연결합니다. `VITE_API_URL`에 방금 배포한 서버 주소를 넣고 빌드합니다. 서버의 `CLIENT_ORIGIN`에는 이 사이트 주소를 넣습니다.

두 서비스 모두 `sprint-mission-5` 브랜치를 사용합니다. 빌드 명령과 새로고침에 필요한 경로 설정은 `render.yaml`에 있습니다. Atlas 연결 주소는 Render 환경 변수 또는 로컬 `server/.env`에만 입력합니다.
