# 🤖 Django AI Chat Web Application (Google Gemini API Integration)

Hệ thống Web Chat AI xây dựng bằng framework **Django (Python)** tích hợp **Google Gemini AI API**, đáp ứng 100% yêu cầu bài tập với giao diện hiện đại, mượt mà và trực quan.

---

## 🌟 Tính Năng Nổi Bật

1. **Giao diện Modern Dark Mode & Glassmorphism**:
   - Thiết kế UI chuẩn cao cấp, responsive trên cả máy tính và điện thoại.
   - Hiệu ứng phím tắt, gợi ý câu hỏi nhanh (Quick Prompts).
   - Hiển thị Markdown mượt mà, phân tách thẻ Code với nút **Sao chép Code** 1-click.

2. **Tích hợp Google Gemini AI**:
   - Sử dụng thư viện chính thức `google-genai`.
   - Hỗ trợ đổi linh hoạt các model: `gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.5-pro`.
   - Lưu trữ lịch sử hội thoại liên tục theo Django Session.

3. **Cấu hình API Key Linh Hoạt**:
   - Cấu hình API Key trong file `.env` phía Server **hoặc**
   - Nhập trực tiếp API Key trên giao diện Web (Lưu an toàn trong `localStorage` trình duyệt).

4. **Công cụ tự động hỗ trợ nộp bài**:
   - File `generate_doc.py` tự động tạo file Word `.docx` đẹp mắt chứa link GitHub để nộp bài theo yêu cầu.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng Nhanh

### 1. Kích hoạt Môi trường ảo (Virtual Environment)
Môi trường ảo `.venv` đã được tạo sẵn trong dự án. Mở Terminal (PowerShell hoặc CMD) tại thư mục dự án và chạy:

- **Trên Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Hoặc Windows (Command Prompt):**
  ```cmd
  .\.venv\Scripts\activate.bat
  ```

*(Nếu chưa cài thư viện, chạy: `pip install -r requirements.txt`)*

### 2. Cấu hình Gemini API Key
Bạn có 2 cách để dùng API Key:
- **Cách 1 (Khuyên dùng):** Mở file `.env` trong thư mục gốc dự án và dán API Key của bạn:
  ```env
  GEMINI_API_KEY=AIzaSy...
  ```
  *(Lấy API Key miễn phí tại: [Google AI Studio](https://aistudio.google.com/app/apikey))*

- **Cách 2:** Chạy ứng dụng web, click vào nút **Cấu hình API Key** (góc dưới bên trái hoặc góc Cài đặt) và dán API Key vào.

### 3. Chạy Server Django
Trong Terminal, chạy lệnh:
```bash
python manage.py runserver
```

Truy cập đường dẫn trên trình duyệt:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 📤 Hướng Dẫn Upload Code Lên GitHub (Yêu cầu 1, 2, 3)

Mở Terminal tại thư mục dự án và thực hiện các bước sau:

### Bước 1: Khởi tạo Git & Commit Code
```bash
# 1. Khởi tạo Git repository
git init

# 2. Thêm tất cả file vào staging (file .env và .venv đã được .gitignore tự động bỏ qua để bảo mật)
git add .

# 3. Tạo commit đầu tiên
git commit -m "Initial commit: Django AI Chat Web App with Google Gemini API"
```

### Bước 2: Tạo Repository trên GitHub & Push Code
1. Truy cập [GitHub.com](https://github.com) -> Nhấn nút **New** (Tạo repo mới).
2. Đặt tên Repository (Ví dụ: `Chat-AI-Django`) và chọn **Public**.
3. Nhấn **Create repository**.
4. Copy đoạn lệnh GitHub cung cấp và dán vào Terminal:
```bash
git branch -M main
git remote add origin https://github.com/USERNAME/Chat-AI-Django.git
git push -u origin main
```
*(Thay `USERNAME/Chat-AI-Django` bằng đường dẫn GitHub thực tế của bạn).*

---

## 📝 Hướng Dẫn Nộp Bài Bằng File Word (Yêu cầu 4 & 5)

Theo yêu cầu bài tập: *Dán link github dự án vào file Word -> nộp file Word vào phần Nộp bài*.

Dự án đã tích hợp sẵn script tự động tạo file Word chuẩn form.

### Bước 1: Chạy lệnh tạo file Word
Mở Terminal và chạy lệnh sau (truyền link GitHub của bạn vào):
```bash
python generate_doc.py
```
*(Nếu muốn tùy chỉnh Tên, MSSV, Link GitHub trực tiếp qua lệnh Python):*
```python
from generate_doc import create_submission_doc

create_submission_doc(
    student_name="Nguyễn Văn A",
    student_id="20123456",
    class_name="Lập trình Web 01",
    github_url="https://github.com/USERNAME/Chat-AI-Django"
)
```

### Bước 2: Nộp bài
- File **`Nop_Bai_Chat_AI.docx`** sẽ xuất hiện ngay trong thư mục dự án.
- Mở file kiểm tra thông tin, sau đó tải file này lên hệ thống học tập ở phần **Nộp bài**.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
Chat AI/
├── .env                    # File chứa API Key (không push lên git)
├── .env.example            # Mẫu file .env
├── .gitignore              # Bỏ qua .venv, .env, db.sqlite3
├── generate_doc.py         # Script tự động tạo file Word nộp bài
├── Nop_Bai_Chat_AI.docx    # File Word báo cáo nộp bài
├── requirements.txt        # Thư viện sử dụng
├── manage.py
├── aichat_project/         # Thư mục cấu hình Django
│   ├── settings.py
│   └── urls.py
└── chat/                   # App chính
    ├── services.py         # Xử lý kết nối Google Gemini API
    ├── views.py            # Logic xử lý HTTP & AJAX API
    ├── urls.py             # Route URL
    ├── templates/chat/
    │   └── index.html      # Giao diện Web Chat
    └── static/
        ├── css/style.css   # Custom CSS Theme Dark Glassmorphism
        └── js/main.js      # Logic AJAX Chat, Markdown & UI
```
