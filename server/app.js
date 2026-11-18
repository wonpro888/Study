import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { InputError, Product, productDetails, readProduct } from "./product.js";

dotenv.config({ path: fileURLToPath(new URL(".env", import.meta.url)) });
export const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.CLIENT_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean),
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ connected });
});

function readInteger(value, defaultValue, minimum, label) {
  if (value === undefined) return defaultValue;
  const number = Number(value);
  if (typeof value !== "string" || !/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < minimum) {
    throw new InputError(`${label}은 ${minimum} 이상의 정수여야 합니다.`);
  }
  return number;
}

app.get("/products", async (req, res) => {
  const offset = readInteger(req.query.offset, 0, 0, "offset");
  const limit = readInteger(req.query.limit, 10, 1, "limit");
  const { keyword = "", orderBy = "recent" } = req.query;
  if (typeof keyword !== "string") throw new InputError("검색어는 글자로 입력해 주세요.");
  if (orderBy !== "recent") throw new InputError("정렬 방식은 recent를 사용해 주세요.");

  const filter = {};
  if (keyword) {
    // 검색에 입력한 기호도 일반 글자처럼 찾는다.
    const literal = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const contains = new RegExp(literal, "i");
    filter.$or = [{ name: contains }, { description: contains }];
  }
  const [products, totalCount] = await Promise.all([
    Product.find(filter).select("name price createdAt").sort({ createdAt: -1, _id: -1 }).skip(offset).limit(limit),
    Product.countDocuments(filter),
  ]);
  const list = products.map(({ id, name, price, createdAt }) => ({ id, name, price, createdAt }));
  res.json({ list, totalCount });
});

app.post("/products", async (req, res) => {
  const product = await Product.create(readProduct(req.body));
  res.status(201).json(productDetails(product));
});

app.param("id", (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) return next(new InputError("올바른 상품 ID를 입력해 주세요."));
  next();
});

function sendProduct(res, product) {
  if (!product) return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
  res.json(productDetails(product));
}

app.get("/products/:id", async (req, res) => {
  sendProduct(res, await Product.findById(req.params.id));
});

app.patch("/products/:id", async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, readProduct(req.body), {
    new: true,
    runValidators: true,
  });
  sendProduct(res, product);
});

app.delete("/products/:id", async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
  res.status(204).end();
});

// 로컬에서 빌드한 React 화면도 같은 주소로 열 수 있다.
const clientDir = fileURLToPath(new URL("../client/dist/", import.meta.url));
app.use(express.static(clientDir));
app.get(["/", "/items", "/registration", "/items/:productId"], (req, res) => {
  res.sendFile("index.html", { root: clientDir });
});
app.use((req, res) => res.status(404).json({ message: "요청한 주소를 찾을 수 없습니다." }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof InputError) return res.status(400).json({ message: error.message });
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: "상품명, 설명, 가격 또는 태그 입력 조건을 확인해 주세요." });
  }
  if (error.type === "entity.parse.failed") return res.status(400).json({ message: "JSON 형식이 올바르지 않습니다." });
  if (error.status === 413) return res.status(413).json({ message: "요청 데이터가 너무 큽니다." });
  if (error.status === 404) return res.status(404).json({ message: "요청한 파일을 찾을 수 없습니다." });
  res.status(500).json({ message: "서버에서 요청을 처리할 수 없습니다." });
});
