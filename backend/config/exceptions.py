from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        response.data = {
            'success': False,
            'error': {
                'status_code': response.status_code,
                'message': get_error_message(response),
                'details': response.data
            }
        }
    else:
        response = Response(
            {
                'success': False,
                'error': {
                    'status_code': 500,
                    'message': 'خطای سرور رخ داده است. لطفاً دوباره تلاش کنید.',
                    'details': str(exc)
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return response


def get_error_message(response):
    status_messages = {
        400: 'درخواست نامعتبر است.',
        401: 'احراز هویت نشده‌اید. لطفاً وارد شوید.',
        403: 'شما دسترسی لازم برای این عملیات را ندارید.',
        404: 'مورد مورد نظر یافت نشد.',
        405: 'متد مجاز نیست.',
        409: 'تداخل در درخواست رخ داده است.',
        429: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.',
        500: 'خطای سرور رخ داده است.',
    }
    
    if isinstance(response.data, dict) and 'detail' in response.data:
        return response.data['detail']
    
    return status_messages.get(response.status_code, 'خطایی رخ داده است.')
