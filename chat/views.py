import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services import send_message_to_gemini

def index(request):
    """Render main chat interface."""
    return render(request, 'chat/index.html')

@csrf_exempt
def api_chat(request):
    """AJAX Endpoint for sending chat messages to Gemini AI."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Chỉ chấp nhận phương thức POST'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
        message = data.get('message', '').strip()
        custom_api_key = data.get('api_key', '').strip()
        model_name = data.get('model', 'gemini-2.0-flash').strip()

        if not message:
            return JsonResponse({'success': False, 'error': 'Nội dung tin nhắn không được để trống'}, status=400)

        # Get existing chat history from Django session
        history = request.session.get('chat_history', [])

        # Send request to Gemini API
        result = send_message_to_gemini(
            prompt=message,
            history=history,
            api_key=custom_api_key,
            model_name=model_name
        )

        if result['success']:
            # Append conversation turn to session history
            history.append({'role': 'user', 'content': message})
            history.append({'role': 'model', 'content': result['reply']})
            request.session['chat_history'] = history
            request.session.modified = True

            return JsonResponse({
                'success': True,
                'reply': result['reply'],
                'history_count': len(history) // 2
            })
        else:
            return JsonResponse({
                'success': False,
                'error': result['error']
            }, status=400)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Dữ liệu JSON không hợp lệ'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Lỗi hệ thống: {str(e)}'}, status=500)

@csrf_exempt
def api_clear(request):
    """AJAX Endpoint to clear session chat history."""
    if request.method == 'POST':
        request.session['chat_history'] = []
        request.session.modified = True
        return JsonResponse({'success': True, 'message': 'Đã xóa lịch sử trò chuyện'})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)
