# Product RESTful API

Ứng dụng CRUD Product sử dụng Node.js, Express, Mongoose và MongoDB. API và MongoDB có thể chạy đồng bộ bằng Docker Compose.

## 1. Yêu cầu

- Docker Engine hoặc Docker Desktop
- Docker Compose

Chỉ cần Node.js 18 trở lên nếu muốn chạy API trực tiếp trên máy host.

## 2. Chạy bằng Docker Compose

Tạo file `.env` từ file mẫu nếu project chưa có:

```bash
cp .env.example .env
```

Build image và khởi động API cùng MongoDB:

```bash
docker compose up --build -d
```

Kiểm tra trạng thái các service:

```bash
docker compose ps
```

Xem log API:

```bash
docker compose logs -f product-api
```

API mặc định được truy cập tại `http://localhost:3000`. MongoDB chỉ được truy cập trong Docker network qua hostname `mongodb`, không publish cổng database ra máy host.

Kiểm tra API:

```bash
curl http://localhost:3000/api/health
```

Dừng và xóa container/network (dữ liệu MongoDB vẫn được giữ trong volume):

```bash
docker compose down
```

Để xóa cả dữ liệu MongoDB, dùng lệnh sau. **Lưu ý: thao tác này không thể khôi phục dữ liệu trong volume.**

```bash
docker compose down -v
```

## 3. Cách hoạt động trong Docker

- Service `product-api` được build từ `Dockerfile` và chạy bằng Node.js production.
- Service `mongodb` sử dụng image `mongo:7` và lưu dữ liệu trong named volume `mongodb_data`.
- API kết nối database bằng URI `mongodb://mongodb:27017/product_db`.
- Compose đợi MongoDB healthy rồi mới khởi động API.
- Cả hai service đều có healthcheck và chính sách tự khởi động lại khi gặp sự cố.

## 4. Chạy API trực tiếp trên máy host (tùy chọn)

File `.env` không được commit lên Git. Cấu hình dùng khi Node.js chạy trực tiếp từ VS Code:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/product_db
```

Khi API chạy trên máy host, MongoDB phải có thể truy cập tại `127.0.0.1:27017`. Khi chạy bằng Compose, cấu hình này được ghi đè tự động bằng hostname service `mongodb`.

### Cài đặt và chạy

Các lệnh dưới đây do người dùng tự chạy trong terminal của VS Code:

```bash
npm install
npm run dev
```

Hoặc chạy chế độ thông thường:

```bash
npm start
```

API mặc định: `http://localhost:3000`.

## 5. Danh sách API

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| `GET` | `/api/health` | Kiểm tra API |
| `POST` | `/api/products` | Tạo Product |
| `GET` | `/api/products` | Lấy danh sách Product |
| `GET` | `/api/products/:pid` | Lấy Product theo `pid` |
| `PUT` | `/api/products/:pid` | Cập nhật Product |
| `DELETE` | `/api/products/:pid` | Xóa Product |

## 6. Kiểm thử bằng curl

### Kiểm tra API

```bash
curl http://localhost:3000/api/health
```

### Tạo Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"pid":"P001","pname":"Laptop","price":15000000,"quantity":10}'
```

### Lấy tất cả Product

```bash
curl http://localhost:3000/api/products
```

### Lấy Product theo pid

```bash
curl http://localhost:3000/api/products/P001
```

### Cập nhật Product

```bash
curl -X PUT http://localhost:3000/api/products/P001 \
  -H 'Content-Type: application/json' \
  -d '{"pname":"Laptop Gaming","price":18000000,"quantity":8}'
```

### Xóa Product

```bash
curl -X DELETE http://localhost:3000/api/products/P001
```

## 7. Cấu trúc Product

| Thuộc tính | Kiểu | Quy tắc |
| --- | --- | --- |
| `pid` | String | Bắt buộc, duy nhất |
| `pname` | String | Bắt buộc |
| `price` | Number | Bắt buộc, lớn hơn hoặc bằng 0 |
| `quantity` | Number | Bắt buộc, là số nguyên lớn hơn hoặc bằng 0 |

MongoDB tự tạo `_id`. Mongoose tự quản lý thêm `createdAt` và `updatedAt`.
