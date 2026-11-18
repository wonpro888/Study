import mongoose from "mongoose";

const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });

function hasValidLength(text, min, max) {
  let count = 0;
  for (const _ of segmenter.segment(text)) {
    count += 1;
    if (count > max) return false;
  }
  return count >= min;
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, validate: (value) => hasValidLength(value, 1, 10) },
    description: { type: String, required: true, trim: true, validate: (value) => hasValidLength(value, 10, 100) },
    price: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    tags: {
      type: [String],
      required: true,
      validate: (tags) => tags.length > 0 && tags.every((tag) => hasValidLength(tag, 1, 5)),
    },
  },
  { timestamps: true, versionKey: false },
);

export const Product = mongoose.model("Product", productSchema);
export class InputError extends Error {}

export function productDetails(product) {
  const { id, name, description, price, tags, createdAt } = product;
  return { id, name, description, price, tags, createdAt };
}

// 요청에서 상품 정보만 골라 받고, 스키마 검증 전에 입력 자료형을 확인한다.
export function readProduct(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new InputError("상품 정보를 JSON 객체로 보내 주세요.");
  }
  const product = {};
  for (const key of ["name", "description"]) {
    if (Object.hasOwn(body, key)) {
      if (typeof body[key] !== "string") throw new InputError("상품명과 설명은 글자로 입력해 주세요.");
      product[key] = body[key].trim();
    }
  }
  if (Object.hasOwn(body, "price")) {
    if (typeof body.price === "number") product.price = body.price;
    else if (typeof body.price === "string" && /^\d+$/.test(body.price)) product.price = Number(body.price);
    else throw new InputError("가격은 0 이상의 정수로 입력해 주세요.");
  }
  if (Object.hasOwn(body, "tags")) {
    if (!Array.isArray(body.tags) || !body.tags.every((tag) => typeof tag === "string")) {
      throw new InputError("태그는 문자열 배열로 보내 주세요.");
    }
    product.tags = body.tags.map((tag) => tag.trim());
  }
  if (Object.keys(product).length === 0) throw new InputError("입력할 상품 정보가 없습니다.");
  return product;
}
