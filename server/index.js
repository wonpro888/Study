import mongoose from "mongoose";
import { app } from "./app.js";

const port = process.env.PORT || 3001;
const dbAddress = process.env.DB_CONNECT;
if (!dbAddress) {
  console.error("server/.env에 DB_CONNECT를 설정해 주세요.");
  process.exit(1);
}

try {
  await mongoose.connect(dbAddress);
  app.listen(port, () => console.log(`판다마켓 서버를 시작했습니다. 포트 ${port}`));
} catch {
  console.error("MongoDB에 연결할 수 없습니다. 주소와 데이터베이스 실행 상태를 확인해 주세요.");
  process.exit(1);
}
