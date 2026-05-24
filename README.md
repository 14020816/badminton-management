# B15 Badminton Management

Web app quản lý chi phí chơi cầu lông nhóm B15, thay thế file Excel gốc.

## Yêu cầu

- Node.js 20+
- pnpm 10+
- PostgreSQL

## Cài đặt

1. Copy env:

```bash
cp .env.example .env
```

2. Cập nhật `.env`:

```
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret"
AUTH_URL="http://localhost:3000"
```

3. Cài dependencies:

```bash
pnpm install
```

4. Export Excel sang JSON, push schema, và seed DB:

```bash
pnpm data:export   # Excel → data/*.json
pnpm db:push       # sync schema
pnpm db:seed       # JSON → PostgreSQL
```

5. Chạy dev:

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@b15.local | admin123 |
| Member | hang@b15.local | member123 |

## Modules

- **Tổng quan** — dashboard quỹ, phân loại chi, sổ cái lông thủ
- **Buổi đánh** — ghi buổi chơi, chia tiền
- **Giao dịch** — thu/chi
- **Giải đấu** — phân bảng, quỹ giải, chi phí giải
- **Liên hoan** — chia bill, thua kèo
- **Cài đặt** — giá cầu, tồn kho

## Scripts

| Script | Mô tả |
|--------|-------|
| `pnpm dev` | Chạy development server |
| `pnpm build` | Build production |
| `pnpm data:export` | Extract Excel → `data/*.json` |
| `pnpm db:push` | Push schema lên PostgreSQL |
| `pnpm db:seed` | Import dữ liệu từ `data/*.json` |
| `pnpm db:studio` | Mở Prisma Studio |

## Tài liệu

- [REQUIREMENTS.md](./REQUIREMENTS.md) — yêu cầu nghiệp vụ
- [excel-format.json](./excel-format.json) — cấu trúc Excel cho seed
