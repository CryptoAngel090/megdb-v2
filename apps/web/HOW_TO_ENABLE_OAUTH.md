# 🚀 Как включить вход через Google и GitHub

## Текущее состояние

✅ Кнопки Google и GitHub работают  
⚠️ Но перенаправляют на `/login` потому что OAuth не настроен  
✅ Файл `.env.local` создан с секретным ключом  

## Быстрая настройка (10 минут)

### Вариант 1: Настроить Google OAuth (5 минут)

1. **Откройте Google Cloud Console**
   - Перейдите: https://console.cloud.google.com/

2. **Создайте проект**
   - Нажмите "Select a project" → "New Project"
   - Название: "MegDB" (или любое)
   - Нажмите "Create"

3. **Включите Google+ API**
   - В меню слева: "APIs & Services" → "Library"
   - Найдите "Google+ API"
   - Нажмите "Enable"

4. **Создайте OAuth credentials**
   - "APIs & Services" → "Credentials"
   - "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "MegDB Web"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Нажмите "Create"

5. **Скопируйте credentials**
   - Скопируйте "Client ID" и "Client secret"
   - Откройте `apps/web/.env.local`
   - Вставьте:
     ```
     GOOGLE_CLIENT_ID=ваш_client_id
     GOOGLE_CLIENT_SECRET=ваш_client_secret
     ```

6. **Перезапустите сервер**
   ```bash
   # Остановите сервер (Ctrl+C)
   pnpm dev
   ```

7. **Готово!** Теперь кнопка Google работает! 🎉

---

### Вариант 2: Настроить GitHub OAuth (3 минуты)

1. **Откройте GitHub Settings**
   - Перейдите: https://github.com/settings/developers

2. **Создайте OAuth App**
   - Нажмите "New OAuth App"
   - Application name: "MegDB"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Нажмите "Register application"

3. **Скопируйте credentials**
   - Скопируйте "Client ID"
   - Нажмите "Generate a new client secret"
   - Скопируйте "Client secret"
   - Откройте `apps/web/.env.local`
   - Вставьте:
     ```
     GITHUB_CLIENT_ID=ваш_client_id
     GITHUB_CLIENT_SECRET=ваш_client_secret
     ```

4. **Перезапустите сервер**
   ```bash
   # Остановите сервер (Ctrl+C)
   pnpm dev
   ```

5. **Готово!** Теперь кнопка GitHub работает! 🎉

---

## Вариант 3: Работать без OAuth (сейчас)

Если не хотите настраивать OAuth прямо сейчас:

✅ **Обычная регистрация работает!**
- Заполните форму (имя, email, дата, страна, пароль)
- Нажмите "Sign Up"
- Данные отправятся на ваш backend

❌ **Кнопки Google/GitHub будут перенаправлять на `/login`**
- Это нормально без настройки OAuth
- Можно настроить позже

---

## Проверка что OAuth работает

После настройки:

1. Откройте: http://localhost:3000/register
2. Нажмите кнопку "Google" или "GitHub"
3. Вы должны увидеть страницу входа Google/GitHub
4. После входа вернетесь на `/profile`

---

## Troubleshooting

### "Redirect URI mismatch"
- Проверьте что в настройках OAuth указан точный URL:
  - Google: `http://localhost:3000/api/auth/callback/google`
  - GitHub: `http://localhost:3000/api/auth/callback/github`

### "Invalid client"
- Проверьте что Client ID и Secret скопированы правильно
- Убедитесь что нет лишних пробелов в `.env.local`

### Кнопка ничего не делает
- Перезапустите dev сервер после изменения `.env.local`
- Проверьте консоль браузера на ошибки

---

## Production

Для production нужно:

1. Обновить redirect URIs на ваш домен:
   - `https://yourdomain.com/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/github`

2. Обновить `.env`:
   ```
   NEXTAUTH_URL=https://yourdomain.com
   ```

3. Использовать другие OAuth приложения (не dev)

---

## Нужна помощь?

📖 Полная документация: `OAUTH_SETUP.md`  
🚀 Быстрый старт: `QUICK_START.md`
