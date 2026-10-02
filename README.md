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

Khi Product API hoạt động và MongoDB đã kết nối, API trả về mã `200`:

```json
{
  "status": "healthy",
  "services": {
    "api": "healthy",
    "mongodb": "healthy"
  }
}
```

Nếu MongoDB chưa kết nối hoặc bị mất kết nối, trạng thái chung và MongoDB là
`unhealthy`; Product API vẫn là `healthy` vì còn phản hồi được request. Endpoint
trả về mã `503`:

```json
{
  "status": "unhealthy",
  "services": {
    "api": "healthy",
    "mongodb": "unhealthy"
  }
}
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
| `GET` | `/api/health` | Kiểm tra trạng thái Product API và MongoDB |
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

## 8. CI/CD với Docker Hub

Workflow `.github/workflows/cd-dockerhub.yml` tự động chạy khi có code được push
lên nhánh `main` hoặc khi được chạy thủ công bằng `workflow_dispatch`.

Pipeline gồm ba job chạy tuần tự:

```text
healthcheck -> push-image -> deploy-local
```

- `healthcheck`: build ứng dụng bằng Docker Compose, chờ API và MongoDB healthy,
  sau đó gọi `/api/health`.
- `push-image`: build image cho `linux/amd64` và `linux/arm64`, rồi push lên
  Docker Hub.
- `deploy-local`: chạy trên self-hosted runner của máy Mac, pull đúng image vừa
  được push và cập nhật các container trên Local Docker Engine.

Job sau chỉ chạy khi job trước thành công. Các lần `deploy-local` được xếp hàng
để hai lần deploy không thay đổi cùng một Docker Compose project đồng thời.

### Chuẩn bị Docker Hub và GitHub Secrets

Tạo repository tên `product-api` trên Docker Hub. Repository có thể public hoặc
private vì workflow đăng nhập Docker Hub ở cả job push và job deploy.

Trong GitHub repository, mở **Settings > Secrets and variables > Actions > New
repository secret**, sau đó tạo:

- `DOCKERHUB_USERNAME`: tên tài khoản Docker Hub.
- `DOCKERHUB_TOKEN`: Docker Hub access token có quyền đọc và ghi repository.

Khi workflow thành công, hai image tag được push lên Docker Hub:

```text
<dockerhub-username>/product-api:latest
<dockerhub-username>/product-api:<git-commit-sha>
```

## 9. Chạy image từ Docker Hub trên local

Các lệnh trong phần này được chạy trên máy có Docker Engine. Đặt tên tài khoản
Docker Hub và tag muốn chạy; `latest` là bản mới nhất:

```bash
export DOCKERHUB_USERNAME=nhuytran15
export PRODUCT_API_TAG=latest
export PORT=3001
```

Đăng nhập nếu repository Docker Hub là private:

```bash
docker login --username "$DOCKERHUB_USERNAME"
```

Kiểm tra cấu hình và pull image:

```bash
docker compose -f docker-compose-prod.yaml config --quiet
docker compose -f docker-compose-prod.yaml pull
```

Khởi động MongoDB và Product API, đồng thời chờ cả hai service healthy:

```bash
docker compose -f docker-compose-prod.yaml up -d --wait
```

Kiểm tra trạng thái container và endpoint healthcheck:

```bash
docker compose -f docker-compose-prod.yaml ps
curl --fail --show-error http://localhost:${PORT}/api/health
```

Dừng các container nhưng giữ lại dữ liệu MongoDB:

```bash
docker compose -f docker-compose-prod.yaml down
```

Để chạy một phiên bản cụ thể, thay `YOUR_GIT_COMMIT_SHA` bằng SHA xuất hiện trong
tag trên Docker Hub:

```bash
export PRODUCT_API_TAG=YOUR_GIT_COMMIT_SHA
docker compose -f docker-compose-prod.yaml pull
docker compose -f docker-compose-prod.yaml up -d --wait
```

## 10. Tự động deploy về local Docker Engine

### Đăng ký self-hosted runner

Trên GitHub repository, mở **Settings > Actions > Runners > New self-hosted
runner**, chọn **macOS** và đúng kiến trúc của máy (**ARM64** đối với Mac Apple
Silicon). Chạy lần lượt các lệnh GitHub hiển thị để tải và đăng ký runner.

Sau khi đăng ký, runner phải có đủ ba label mà workflow yêu cầu:

```text
self-hosted, macOS, ARM64
```

Nếu máy Mac dùng CPU Intel, đổi `ARM64` thành `X64` trong
`.github/workflows/cd-dockerhub.yml`.

Mở Docker Desktop và kiểm tra Docker Engine:

```bash
docker info
```

Từ thư mục cài self-hosted runner, có thể bật runner trực tiếp để kiểm tra lần
đầu:

```bash
./run.sh
```

Sau khi kiểm tra runner kết nối thành công, nhấn `Ctrl+C` và cài runner dưới dạng
service để runner tự khởi động cùng macOS:

```bash
./svc.sh install
./svc.sh start
./svc.sh status
```

Docker Desktop vẫn phải hoạt động để runner truy cập được Docker Engine. Không
đặt self-hosted runner của repository public ở chế độ nhận workflow từ mã không
được tin cậy.

### Kích hoạt pipeline

Commit ba file của câu 14 và push lên `main`:

```bash
git status
git add .github/workflows/cd-dockerhub.yml docker-compose-prod.yaml README.md
git commit -m "feat: automate CD to local Docker Engine"
git push origin main
```

Theo dõi workflow **CI and CD Docker Hub** trong tab **Actions** của GitHub.
Sau khi `push-image` thành công, runner local nhận job `deploy-local`, pull tag
đúng bằng `${{ github.sha }}` và deploy API trên cổng `3001`.

Kiểm tra kết quả deploy tự động:

```bash
export DOCKERHUB_USERNAME=nhuytran15
export PRODUCT_API_TAG=YOUR_GIT_COMMIT_SHA
export PORT=3001
docker compose -f docker-compose-prod.yaml ps
curl --fail --show-error http://localhost:${PORT}/api/health
```

Nếu cần quay lại phiên bản trước, lấy SHA của lần deploy tốt gần nhất trong
Docker Hub hoặc GitHub Actions rồi chạy trên máy local:

```bash
export DOCKERHUB_USERNAME=nhuytran15
export PRODUCT_API_TAG=PREVIOUS_GIT_COMMIT_SHA
export PORT=3001
docker compose -f docker-compose-prod.yaml pull product-api
docker compose -f docker-compose-prod.yaml up -d --wait --remove-orphans
curl --fail --show-error http://localhost:${PORT}/api/health
```

Không dùng `docker compose down -v` trong quá trình deploy hoặc rollback vì tùy
chọn `-v` sẽ xóa volume dữ liệu MongoDB.

Dừng deployment thủ công khi không còn sử dụng:

```bash
docker compose -f docker-compose-prod.yaml down
```
