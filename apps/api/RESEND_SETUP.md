# Resend Email Setup

## Получение API ключа

1. Зайди на https://resend.com
2. Зарегистрируйся или войди
3. Перейди в **API Keys**: https://resend.com/api-keys
4. Нажми **Create API Key**
5. Скопируй ключ (начинается с `re_`)

## Настройка

1. Открой `apps/api/.env`
2. Замени `RESEND_API_KEY=re_123456789_your_api_key_here` на свой ключ
3. Перезапусти API сервер: `pnpm dev`

## Верификация домена (для production)

Для отправки с кастомного домена (например `@megdb.com`):

1. Перейди в **Domains**: https://resend.com/domains
2. Добавь свой домен
3. Настрой DNS записи (SPF, DKIM, DMARC)
4. Дождись верификации

## Для тестирования (без домена)

Resend позволяет отправлять на **любой email** даже без верификации домена в режиме разработки!

Просто используй:
- `from: 'onboarding@resend.dev'` (тестовый домен Resend)
- Или любой email если домен верифицирован

## Что отправляется

### 1. Приветственное письмо пользователю
- **Кому**: email пользователя при регистрации
- **От**: `MegDB <onboarding@megdb.com>`
- **Тема**: "🎬 Welcome to MegDB — Your Movie Journey Starts Here!"
- **Содержание**: Красивое HTML письмо с приветствием и фичами

### 2. Уведомление админу
- **Кому**: `vkkoder@gmail.com`
- **От**: `MegDB Notifications <notifications@megdb.com>`
- **Тема**: "🎉 New User Registration: {username}"
- **Содержание**: Детали новой регистрации (username, email, дата)

## Проверка

После настройки API ключа:

1. Зарегистрируй тестового пользователя на http://localhost:3000/register
2. Проверь почту пользователя — должно прийти приветственное письмо
3. Проверь `vkkoder@gmail.com` — должно прийти уведомление о регистрации

## Troubleshooting

Если письма не приходят:

1. Проверь логи API сервера на ошибки
2. Убедись что `RESEND_API_KEY` правильный
3. Проверь спам папку
4. Проверь лимиты на https://resend.com/overview (бесплатно 100 писем/день)

## Лимиты бесплатного плана

- **100 emails/день**
- **1 домен**
- **Unlimited API keys**
- Отправка на любые email адреса

Для production рекомендую платный план: https://resend.com/pricing
