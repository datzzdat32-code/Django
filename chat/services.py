import os
import logging
from dotenv import load_dotenv

load_dotenv()

# System prompt for training/guiding Gemini AI Assistant
SYSTEM_INSTRUCTION = (
    "Bạn là Gemini AI Assistant - một trợ lý Trí tuệ Nhân tạo đa năng, chuyên nghiệp, lịch sự và cực kỳ thông minh. "
    "Nhiệm vụ của bạn là giải đáp chính xác, đầy đủ, dễ hiểu và chuyên sâu cho TẤT CẢ mọi câu hỏi được người dùng đưa ra. "
    "Hỗ trợ tốt nhất cho các chủ đề: Lập trình (Django, Python, JavaScript, HTML/CSS, SQL...), Cấu trúc dữ liệu & Giải thuật, "
    "Khoa học máy tính, Trí tuệ nhân tạo (AI/ML/DL), Viết lách, Tóm tắt nội dung, Dịch thuật và Kiến thức tổng hợp. "
    "Luôn trả lời bằng tiếng Việt tự nhiên, chuẩn xác và sử dụng định dạng Markdown (kèm các khối code có syntax highlighting) khi trình bày bài viết hoặc mã nguồn."
)

def sanitize_proxy_env():
    """Remove or fix unsupported socks4 system proxy environment variables that crash httpx/requests."""
    proxy_keys = ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]
    for key in proxy_keys:
        val = os.environ.get(key, "")
        if "socks4" in val.lower():
            os.environ.pop(key, None)

def send_message_to_gemini(prompt, history=None, api_key=None, model_name="gemini-1.5-flash"):
    """
    Sends prompt to Google Gemini API using google-genai or google.generativeai.
    Features model fallback candidates and System Prompt instruction.
    """
    sanitize_proxy_env()
    effective_api_key = api_key or os.getenv("GEMINI_API_KEY")

    
    if not effective_api_key:
        return {
            "success": False,
            "error": "Chưa phát hiện API Key. Vui lòng bấm vào 'Cấu hình API Key' để nhập Google Gemini API Key (miễn phí tại Google AI Studio) hoặc cấu hình file .env."
        }

    # Candidate models to try sequentially if one fails with 404 or unsupported
    candidate_models = []
    if model_name:
        candidate_models.append(model_name)
    
    # Add popular reliable fallback model names
    fallbacks = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-1.5-flash"]
    for fb in fallbacks:
        if fb not in candidate_models:
            candidate_models.append(fb)

    last_error = ""

    # Method 1: Try new google-genai SDK
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=effective_api_key)

        for model_id in candidate_models:
            try:
                # Format conversation history
                contents = []
                if history:
                    for turn in history:
                        role = "user" if turn.get("role") == "user" else "model"
                        content_text = turn.get("content", "")
                        if content_text:
                            contents.append(types.Content(
                                role=role,
                                parts=[types.Part.from_text(text=content_text)]
                            ))
                
                # Append current prompt
                contents.append(types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)]
                ))

                config = types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.7,
                )

                response = client.models.generate_content(
                    model=model_id,
                    contents=contents,
                    config=config
                )

                if response and response.text:
                    return {"success": True, "reply": response.text, "model_used": model_id}

            except Exception as model_err:
                last_error = str(model_err)
                continue # Try next candidate model if 404 or unsupported

    except ImportError:
        pass # Fallback to google.generativeai if google.genai is not imported

    # Method 2: Fallback to google.generativeai SDK
    try:
        import google.generativeai as genai
        genai.configure(api_key=effective_api_key)

        for model_id in candidate_models:
            try:
                model = genai.GenerativeModel(
                    model_name=model_id,
                    system_instruction=SYSTEM_INSTRUCTION
                )

                if history and len(history) > 0:
                    formatted_history = []
                    for item in history:
                        role = "user" if item.get("role") == "user" else "model"
                        content = item.get("content", "")
                        if content:
                            formatted_history.append({
                                "role": role,
                                "parts": [content]
                            })
                    chat = model.start_chat(history=formatted_history)
                    response = chat.send_message(prompt)
                else:
                    response = model.generate_content(prompt)

                if response and response.text:
                    return {"success": True, "reply": response.text, "model_used": model_id}

            except Exception as model_err:
                last_error = str(model_err)
                continue

    except Exception as legacy_err:
        last_error = str(legacy_err)

    # Format human-friendly error messages if all candidate models failed
    if "429" in last_error or "ResourceExhausted" in last_error or "Quota" in last_error:
        return {
            "success": False,
            "error": "API Key của bạn tạm thời chạm giới hạn tốc độ gọi (Rate Limit - 429). Vui lòng đợi 10-15 giây rồi bấm gửi lại!"
        }
    elif "API_KEY_INVALID" in last_error or "API key not valid" in last_error or ("400" in last_error and "API key" in last_error):
        return {
            "success": False,
            "error": "API Key không hợp lệ. Vui lòng bấm góc dưới bên trái nút 'Cấu hình API Key' để dán Gemini API Key mới của bạn (Lấy miễn phí tại aistudio.google.com/app/apikey)."
        }
    else:
        return {
            "success": False,
            "error": f"Lỗi kết nối Gemini API: {last_error}"
        }
