# News Backend API – Dự án nhóm 2 người (chạy trên 1 máy)

Backend website tin tức dùng **Node.js 20+ / Express**, dữ liệu lưu ở `data/*.json` để dễ chạy trên **một máy tính**, không cần cài MongoDB. Hỗ trợ đăng ký, đăng nhập JWT, public đọc tin, private CRUD/tìm kiếm/sắp xếp tin và upload/xóa file.

## 1. Khởi chạy trên Windows (PowerShell)

1. Cài **Node.js bản LTS**.
2. Mở thư mục dự án bằng VS Code và mở Terminal:

```powershell
npm install
Copy-Item .env.example .env
```

3. Mở `.env`, thay `JWT_SECRET` bằng chuỗi ngẫu nhiên **tối thiểu 32 ký tự** (không dùng giá trị mẫu). Có thể tạo bằng:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Chạy:

```powershell
npm run dev
```

5. Mở `http://127.0.0.1:3000/` để kiểm tra. Dừng bằng `Ctrl+C`.

> Hai thành viên làm chung trên máy này, dùng **một project + một server**. Không cần chạy hai server. Mỗi thành viên đăng ký **tài khoản riêng**; dữ liệu tin của ai người đó quản lý. Hai người có thể lần lượt dùng VS Code/Postman trên một máy. Nếu cần 2 máy cùng truy cập qua mạng LAN, cấu hình `HOST=0.0.0.0`, kiểm tra firewall và bảo vệ mạng; đó là chế độ khác.

## 2. Cấu trúc thư mục

```text
news-backend/
├─ src/
│  ├─ app.js                 # Máy chủ, middleware, routing, error handler
│  ├─ config/index.js        # Biến môi trường + cấu hình dùng chung (read-only)
│  ├─ middleware/auth.js     # Xác thực JWT
│  ├─ routes/auth.js         # Đăng ký / đăng nhập / profile
│  ├─ routes/news.js         # API public & private tin tức
│  ├─ routes/files.js        # Upload / xóa file
│  └─ utils/
│     ├─ store.js            # Đọc/ghi JSON
│     └─ respond.js          # Response chuẩn
├─ data/                     # File JSON phát sinh khi chạy (không commit)
├─ uploads/                  # File tải lên (không commit)
├─ .env.example              # Mẫu biến môi trường
├─ .gitignore
├─ package.json
└─ README.md
```

### Biến môi trường và biến toàn cục

- `PORT`: cổng HTTP, mặc định 3000.
- `HOST`: IP server, mặc định `127.0.0.1` (chỉ máy này).
- `JWT_SECRET`: khóa ký token, bắt buộc thay thế.
- `JWT_EXPIRES_IN`: thời gian token tồn tại.
- `CORS_ORIGIN`: domain giao diện cho phép gọi API, có thể phân tách bằng dấu phẩy.
- `MAX_UPLOAD_MB`: giới hạn file tải lên.
- `src/config/index.js` xuất `config` bằng `Object.freeze()`, được sử dụng xuyên module như cấu hình toàn cục; tránh gán biến tùy ý lên `global`.

## 3. Request / Response chuẩn

Request JSON: header `Content-Type: application/json`; API private thêm `Authorization: Bearer <TOKEN>`.

Thành công:
```json
{"success":true,"message":"Thành công","data":{}}
```
Lỗi:
```json
{"success":false,"message":"Thông báo lỗi","data":null}
```
HTTP status: `200` thành công, `201` tạo mới, `400` dữ liệu lỗi, `401` thiếu/sai token, `404` không tồn tại, `409` trùng username, `500` lỗi máy chủ.

## 4. Danh sách API

| Phương thức | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Đăng ký `username`, `password` |
| POST | `/api/auth/login` | Public | Đăng nhập, lấy token |
| GET | `/api/auth/me` | Private | Xem tài khoản |
| GET | `/api/news/public` | Public | Đọc, tìm kiếm, sắp xếp, phân trang |
| GET | `/api/news/public/:id` | Public | Đọc chi tiết |
| GET | `/api/news` | Private | Danh sách tin của mình; tìm/sắp xếp/phân trang |
| GET | `/api/news/:id` | Private | Chi tiết tin của mình |
| POST | `/api/news` | Private | Thêm tin |
| PUT | `/api/news/:id` | Private | Sửa tin |
| DELETE | `/api/news/:id` | Private | Xóa tin |
| POST | `/api/files/upload` | Private | Upload file multipart/form-data, key `file` |
| DELETE | `/api/files/:filename` | Private | Xóa file |
| GET | `/uploads/:filename` | Public | Xem file đã upload |

Query list: `?q=kinh%20te&sortBy=createdAt&order=desc&page=1&limit=10`. `sortBy`: `createdAt`, `updatedAt`, `title`. `order`: `asc`/`desc`. Tối đa 100 bản ghi/trang.

### Ví dụ thao tác trong PowerShell

**Đăng ký**:
```powershell
$base = 'http://127.0.0.1:3000'
Invoke-RestMethod "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body '{"username":"member1","password":"Password123!"}'
```

**Đăng nhập**:
```powershell
$login = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body '{"username":"member1","password":"Password123!"}'
$headers = @{ Authorization = "Bearer $($login.data.token)" }
```

**Thêm tin**:
```powershell
$body = @{ title = 'Tin tức đầu tiên'; content = 'Nội dung tin mẫu' } | ConvertTo-Json
Invoke-RestMethod "$base/api/news" -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

**Đọc tin public**:
```powershell
Invoke-RestMethod "$base/api/news/public?q=tin&sortBy=title&order=asc"
```

**Upload file** (PowerShell 7 hỗ trợ `-Form`; trên PowerShell 5.1 nên dùng Postman hoặc curl.exe):
```powershell
curl.exe -X POST "$base/api/files/upload" -H "Authorization: Bearer $($login.data.token)" -F "file=@C:\duong-dan\anh.png"
```

**Xóa file**:
```powershell
Invoke-RestMethod "$base/api/files/TEN_FILE_TRA_VE" -Method Delete -Headers $headers
```

## 5. Phân công nhóm 2 người – cùng 1 máy

- **Thành viên 1:** dựng Express, `.env`, config, chuẩn response, `auth.js` (đăng ký/đăng nhập/JWT).
- **Thành viên 2:** `news.js` (public/private CRUD, search/sort) và `files.js` (upload/delete), README, thử API.
- Cả hai kiểm thử tích hợp trên 1 máy, mỗi người có tài khoản riêng. Để ghi nhận đóng góp, có thể tạo Git branch/commit riêng khi lần lượt sử dụng máy; không bắt buộc phải có 2 máy.

## 6. Checklist kiểm thử để chụp màn hình nộp bài

1. Đăng ký `member1`; thử đăng ký trùng, nhận 409.
2. Đăng nhập đúng nhận JWT; sai mật khẩu nhận 401.
3. Thêm 2-3 tin bằng token, lấy danh sách public.
4. Tìm kiếm với `q`, sắp xếp theo `title`, thay `asc`/`desc`.
5. Sửa và xóa một tin với `id` thực tế.
6. Không có token gọi private nhận 401.
7. Tạo `member2`, thử sửa tin `member1` nhận 404.
8. Upload ảnh PNG/JPG, copy URL, thử xóa file.

## 7. Giới hạn bản demo

- Lưu file JSON đồng bộ phù hợp **demo một tiến trình trên một máy**, không phù hợp nhiều server hay lưu trữ lớn. Dùng PostgreSQL/MySQL/MongoDB cho production.
- Bài tin được xuất bản ngay khi tạo; chưa có trạng thái nháp/duyệt.
- Người đăng nhập có thể xóa **bất kỳ file nào** được upload lên thư mục chung: demo chưa lưu chủ sở hữu file. Không dùng cho môi trường thật nếu chưa thêm ownership/permission.
- Upload kiểm tra MIME và chữ ký đầu file, nhưng chưa virus scan; chỉ dùng file tin cậy cho demo.
- `.env`, dữ liệu đăng ký và file upload không được đưa lên GitHub.
