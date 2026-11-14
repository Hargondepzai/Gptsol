# AI Chat — bản Vercel

Web chat + tạo ảnh bằng key của bạn. Key Xingchi (mặc định) / OpenAI đều dùng được.
Trang gọi qua `/api/*` trên Vercel — máy chủ Vercel gọi hộ tới nhà cung cấp,
nên trình duyệt không bị chặn CORS như khi gọi thẳng.

## Cấu trúc
- `index.html` — giao diện 1 đoạn chat với 5 chế độ: Chat, Tạo file, Tài liệu, Tạo ảnh, Tạo video;
  có thanh token 🧮 trên trần 1.000.000 token (số liệu từ usage nhà cung cấp, thiếu thì ước tính theo độ dài chữ)
- `api/chat.js` — proxy chat: Responses API (Xingchi, `gpt-6.1-sol`) hoặc Chat Completions, trả về cả `usage`
- `api/image.js` — proxy tạo ảnh (`/images/generations`)
- `api/video.js` — proxy tạo video (`/videos`, kiểu Sora — nhà cung cấp không có model video thì báo lỗi rõ, không giả video)
- `api/test.js` — kiểm tra key + Base URL bằng `GET /models`
- `vercel.json`, `package.json`

## Cách deploy lên Vercel (miễn phí)
Cách dễ nhất — dùng GitHub:
1. Tạo repo mới trên GitHub, up toàn bộ thư mục này lên (kéo thả trên github.com cũng được).
2. Vào https://vercel.com/new → Import repo đó → bấm **Deploy** (không cần nhập biến môi trường nào).
3. Xong, Vercel cho bạn link dạng `https://ai-chat-xxx.vercel.app`.

Cách khác — Vercel CLI (trên máy tính):
```bash
npm i -g vercel
cd ai-chat-vercel
vercel
```
Làm theo hướng dẫn trên màn hình, chọn project mới, deploy xong lấy link.

## Cách dùng sau khi deploy
1. Mở link Vercel của bạn.
2. Ở phần Cài đặt: chọn **Xingchi** (đã điền sẵn Base URL `https://api.xingchiapi.com/v1`,
   kiểu Responses, model `gpt-6.1-sol`).
3. Dán **key MỚI** của bạn vào ô API key — key cũ đã lộ thì xóa đi tạo key mới,
   đừng dán key cũ. Bấm **Lưu cài đặt** rồi **Kiểm tra kết nối**.
4. Chat ở tab Chat, tạo ảnh ở tab Tạo ảnh.

## Bảo mật
- Không nhúng key vào code. Key chỉ nằm trong trình duyệt của bạn (localStorage),
  mỗi lần gọi API nó được gửi kèm theo request tới máy chủ Vercel của chính bạn,
  máy chủ chỉ chuyển tiếp sang Xingchi/OpenAI, không lưu key vào đâu cả.
- Đừng chia sẻ link có kèm key, đừng chụp ảnh màn hình có hiện key.
