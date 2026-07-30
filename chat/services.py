import os
import google.generativeai as genai

def send_message_to_gemini(prompt, history=None, api_key=None, model_name="gemini-1.5-flash"):
    """
    Sends prompt to Google Gemini API using google.generativeai SDK.
    Supports chat history context with fallback to single prompt.
    """
    effective_api_key = api_key or os.getenv("GEMINI_API_KEY")
    
    if not effective_api_key:
        return {
            "success": False,
            "error": "Vui lòng nhập Google Gemini API Key trong phần Cài đặt hoặc trong file .env để tiếp tục."
        }

    try:
        genai.configure(api_key=effective_api_key)
        
        target_model = model_name or "gemini-1.5-flash"
        if "2.5" in target_model or "2.0" in target_model:
            target_model = "gemini-1.5-flash"

        model = genai.GenerativeModel(target_model)

        # Build chat session with history context
        if history and len(history) > 0:
            try:
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
                return {"success": True, "reply": response.text}
            except Exception:
                # Fallback to direct prompt generation if session chat fails
                pass
        
        # Direct prompt generation
        response = model.generate_content(prompt)
        return {"success": True, "reply": response.text}

    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "ResourceExhausted" in error_msg or "Quota" in error_msg:
            return {
                "success": False,
                "error": "API Key của bạn tạm thời chạm giới hạn tốc độ lượt gọi (Rate Limit - 429). Vui lòng đợi khoảng 10-15 giây rồi gửi lại!"
            }
        elif "API_KEY_INVALID" in error_msg or ("400" in error_msg and "API key" in error_msg):
            return {
                "success": False,
                "error": "API Key không hợp lệ. Vui lòng nhấn vào 'Cấu hình API Key' để kiểm tra và dán lại Google Gemini API Key."
            }
        else:
            return {
                "success": False,
                "error": f"Lỗi phản hồi từ Gemini API: {error_msg}"
            }
