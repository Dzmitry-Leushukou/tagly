# -*- coding: utf-8 -*-
import logging
import urllib.request
import json
import os
import time

logger = logging.getLogger(__name__)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")
POST_SERVICE_URL = os.getenv("POST_SERVICE_URL", "http://localhost:8002")

AUTHORS = [
    {"login": "layout_crafter", "password": "FrontendPass123!", "description": "Frontend-разработчик, вёрстка, адаптив"},
    {"login": "react_insider", "password": "FrontendPass123!", "description": "React-инженер, хуки, компоненты"},
    {"login": "perf_wizard", "password": "FrontendPass123!", "description": "Производительность веб-приложений"},
    {"login": "ux_stylist", "password": "FrontendPass123!", "description": "Дизайн интерфейсов и UX"},
    {"login": "accessibility_maven", "password": "FrontendPass123!", "description": "Эксперт по a11y и доступности"},
    {"login": "build_keeper", "password": "FrontendPass123!", "description": "Сборка, webpack, vite"},
    {"login": "frontend_architect", "password": "FrontendPass123!", "description": "Архитектура фронтенда, сложные UI"},
    {"login": "testing_guardian", "password": "FrontendPass123!", "description": "Тестирование, Jest, Playwright"},
    {"login": "seo_scholar", "password": "FrontendPass123!", "description": "SEO, оптимизация видимости"},
    {"login": "devtools_sage", "password": "FrontendPass123!", "description": "DevTools, отладка, профилирование"},
]

POSTS = {
    'layout_crafter': [
        "Grid-контейнер с display: grid не даёт автоматического отступа между ячейками. Используйте gap: 16px или margin у дочерних элементов.",
        "Адаптивные шрифты: clamp(16px, 4vw, 24px) — лучший способ. Медиазапросы для шрифтов уже не нужны.",
        "Псевдокласс :has() работает во всех современных браузерах. Можно стилизовать родителя по наличию потомка: .card:has(img) — отличный трюк.",
        "Верстка письма для почтовиков — ад. Используйте таблицы, inline-стили, не доверяйте flexbox и grid. Даже в 2025.",
        "Сброс стилей: лучше не * { margin: 0; padding: 0 }, а нормалайз или сброс через :where(), чтобы сохранить специфичность.",
        "Свойство content-visibility: auto ускоряет рендеринг длинных списков. Браузер пропускает отрисовку элементов вне вьюпорта.",
        "Самый частый баг с position: sticky — забывают задать top, left или bottom. Без них элемент не прилипнет.",
        "SVG-спрайты через <use> до сих пор работают быстрее, чем иконочные шрифты. И доступнее.",
        "Плавный скролл: scroll-behavior: smooth. Но пользователи с vestibular disorders могут страдать — учитывайте в медиа prefers-reduced-motion.",
        "Инспектировать сетку в Firefox — лучший инструмент. Показывает имена линий, области, зазоры. Chrome догоняет, но медленно."
    ],
    'react_insider': [
        "useEffect с пустыми зависимостями выполняет колбэк после монтирования. Не для всех операций подходит — read layout effect.",
        "Ключи в списках должны быть стабильными и уникальными. Индекс массива — плохо при переупорядочивании, фильтрации.",
        "React.memo бесполезен, если компонент принимает children, которые пересоздаются при рендере родителя.",
        "Контекст в React: если значение меняется часто, перерендериваются все потребители. Используйте библиотеки (zustand, jotai) для часто меняющихся данных.",
        "Правило: поднимайте состояние как можно ниже. Если состояние нужно только в одном компоненте — не кладите в глобальный стор.",
        "React 18 и concurrent features: useTransition для маркировки не срочных обновлений. Интерфейс остаётся отзывчивым при фильтрации больших списков.",
        "Серверные компоненты (RSC) не имеют состояния и хуков. Идеальны для статических частей и запросов к базе.",
        "Хук useCallback нужен не всегда. Мемоизируйте только если функция передаётся в мемоизированный дочерний компонент или в useEffect.",
        "Ошибка: мутация state напрямую (state.count++). Всегда используйте setState с новым объектом.",
        "Next.js 14: App Router с параллельными маршрутами и перехватом роутов. Но документация всё ещё запутанная."
    ],
    'perf_wizard': [
        "Lighthouse в CI: настройте бюджет производительности (LCP < 2.5с, CLS < 0.1). Прогоняйте на каждом PR.",
        "Изображения: используйте srcset для разных разрешений, формат WebP (или AVIF), lazy-loading для оффскрина.",
        "Размер main thread: сократите длинные задачи (>50ms) разбиением на микро-задачи через setTimeout или scheduler.yield().",
        "Анализируйте бандл: webpack-bundle-analyzer, vite-bundle-visualizer. Ищите дублированные библиотеки (например, lodash в двух версиях).",
        "Core Web Vitals: оптимизация LCP — ускорить загрузку самого большого элемента (обычно картинка или блок текста). Preload для критических ресурсов.",
        "CLS (сдвиг макета): резервируйте место под изображения (width/height), не вставляйте контент динамически выше существующего.",
        "Минификация CSS: purgecss удаляет неиспользуемые стили. В больших проектах экономит до 70% объёма.",
        "Шрифты: используйте font-display: swap, предзагружайте шрифты через preload, но не злоупотребляйте — лишние preload вредят.",
        "Service Worker для кеширования статики и стратегии stale-while-revalidate. PWA — не только оффлайн, но и скорость повторных визитов.",
        "Профилируйте в DevTools: вкладка Performance, запись загрузки страницы. Ищите долгие скрипты и пересчёты стилей."
    ],
    'ux_stylist': [
        "Кнопка «Наверх» появляется через 500px скролла — исследование NNGroup показало, что пользователи ждут её не раньше.",
        "Цветовая контрастность: для основного текста минимум 4.5:1, для крупного (18pt+) — 3:1. Проверяйте в WebAIM Contrast Checker.",
        "Интерактивные элементы (кнопки, ссылки) должны быть не меньше 44x44 пикселей для тач-экранов. Apple и Google рекомендуют.",
        "Скелетон (skeleton screen) лучше спиннера. Показывает структуру, снижает воспринимаемое время загрузки. Используйте псевдоэлементы с анимацией shimmer.",
        "Карточки товаров должны содержать: изображение, название, цену, рейтинг. Кнопка «Купить» — только при наведении на десктопе, на мобиле всегда видна.",
        "Стилизация фокуса: не удаляйте outline, замените на более заметный стиль (box-shadow: 0 0 0 3px rgba(66,153,225,0.5)).",
        "Хлебные крошки полезны для глубоких сайтов (>3 уровня). Для плоских (до 2 уровней) достаточно ссылки «Назад».",
        "Модальные окна: при открытии фокус должен переходить внутрь модалки, а при закрытии — возвращаться на кнопку открытия.",
        "Пустые состояния (empty states) важны: показывайте иллюстрацию и подсказку, как заполнить контент. Не просто «Ничего нет».",
        "Анимация уведомлений: не дольше 300ms, с ease-out. Для пользователей с vestibular disorders отключайте через prefers-reduced-motion."
    ],
    'accessibility_maven': [
        "Семантическая вёрстка: <button> вместо <div> с кликом. Скринридеры не поймут див, даже с role='button'.",
        "Атрибут aria-label нужен только когда текст визуально скрыт. Иначе скринридер прочитает дважды.",
        "Для скрытого контента: .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; }",
        "Проверка клавиатурной навигации: Tab, Shift+Tab, Enter, Space. Фокус должен быть видимым и логичным.",
        "ARIA live regions: role='status' или 'alert' для динамического контента. Скринридер прочитает изменения.",
        "Цвет не должен быть единственным индикатором ошибки. Добавляйте иконки или текст (например, «Поле обязательно»).",
        "Изображения с пустым alt (alt='') — декоративные. Если изображение информативное, alt должен описывать содержание.",
        "Пропорции текста: пользователь может увеличить шрифт до 200% без поломки макета. Проверяйте зум в браузере.",
        "Заголовки: h1 — главный, один на странице. h2-h6 — иерархия, нельзя пропускать уровни (с h2 на h4).",
        "Тестируйте a11y с axe DevTools, Lighthouse, и на реальном скринридере (NVDA, VoiceOver)."
    ],
    'build_keeper': [
        "Webpack 5: module federation позволяет загружать модули из удалённых сборок. Микрофронтенд без iframe.",
        "Vite быстрее webpack в dev-режиме благодаря нативным ES модулям. Для сборки использует Rollup.",
        "ESBuild на Go — самый быстрый бандлер. Используется в Vite для предварительной сборки зависимостей.",
        "Babel всё ещё нужен для поддержки старых браузеров, но можно ограничиться browserslist и core-js.",
        "CSS-модули с postcss — автопрефиксер, минификация, импорты. Не надо CSS-in-JS.",
        "TypeScript: строгая настройка strict: true. noImplicitAny ловит много ошибок. Incremental сборка ускоряет повторные компиляции.",
        "Tree shaking работает с ES модулями. Не используйте CommonJS в библиотеках, если хотите удалить мёртвый код.",
        "Настройка path aliases в tsconfig (paths) и в сборщике. Упрощает импорты: @/components вместо '../../components'.",
        "Среда разработки: Docker с hot-reload, volumes для node_modules. Избегайте проблем с версиями на разных ОС.",
        "Source maps в production: используйте 'hidden-source-map' для отслеживания ошибок без полного исходника в браузере."
    ],
    'frontend_architect': [
        "Feature-Sliced Design (FSD) — методология для крупных проектов. Слои: app, processes, pages, features, entities, shared.",
        "Атомный дизайн: атомы (кнопки), молекулы (форма), организмы (карточка), шаблоны, страницы. Помогает переиспользовать.",
        "Стейт-менеджмент: zustand для простых приложений, redux-toolkit для сложных. MobX — для реактивности, но осторожно с обёртками.",
        "Монорепозиторий: npm workspaces, yarn workspaces, Turborepo. Общий код между проектами без дублирования.",
        "Адаптивный дизайн: mobile-first подход, точки перелома через медиазапросы. Избегайте фиксированных ширин.",
        "Design tokens: переменные для цвета, шрифта, отступов. Единый источник правды для всех компонентов.",
        "Интернационализация (i18n): react-i18next, ключи в JSON. Плюс подгрузка языков по требованию.",
        "Обработка ошибок: ErrorBoundary в React, глобальный обработчик unhandledrejection, fallback UI.",
        "Гибридные приложения: WebView с мостом для нативных вызовов. Осторожно с производительностью анимаций.",
        "CI/CD для фронтенда: линтинг, тесты, сборка, деплой на S3/Netlify/Vercel. Preview деплой для каждого PR."
    ],
    'testing_guardian': [
        "Jest + React Testing Library: тестируйте поведение, а не детали реализации. Не используйте snapshot для больших компонентов.",
        "Playwright лучше Puppeteer: автовейты, трассировка, тестирование в разных браузерах (Chromium, Firefox, WebKit).",
        "Unit тесты для утилит и хуков, интеграционные для компонентов, E2E для критических путей.",
        "Тестирование accessibility: jest-axe, axe-playwright. Находит нарушения ARIA, контрастности.",
        "Mock fetch: jest.spyOn(global, 'fetch'). Создайте утилиту для моков с разными сценариями (успех, ошибка).",
        "CI: запускайте тесты параллельно, используйте --shard для больших наборов. Кэшируйте node_modules.",
        "Тесты на производительность: Lighthouse CI, измерение времени рендеринга в Playwright.",
        "Снапшоты полезны только для статичных строк (например, сообщения об ошибках). Для UI — хрупкие.",
        "Покрытие кода не должно быть самоцелью. 80% покрытия достаточно, если покрыты критичные сценарии.",
        "Тест-дабл: stubs для возврата фиксированных значений, mocks для проверки вызовов."
    ],
    'seo_scholar': [
        "Структурированные данные JSON-LD для товаров, статей, хлебных крошек. Гугл любит. Проверяйте в Rich Results Test.",
        "Канонические ссылки (rel='canonical') для страниц с дублирующимся контентом. Указывайте абсолютный URL.",
        "Динамический рендеринг для SPA: используйте prerender.io или серверный рендеринг (Next.js) для SEO.",
        "Мета-теги: title (50-60 символов), description (120-160). Уникальные для каждой страницы.",
        "Файл robots.txt: запрещайте индексацию служебных путей (/admin, /api). Но не блокируйте CSS/JS — они нужны для рендеринга.",
        "Карта сайта sitemap.xml, с приоритетами и частотой обновления. Отправляйте в Search Console.",
        "Open Graph и Twitter Cards для соцсетей: og:image, og:title, og:description. Улучшают шаринг.",
        "Скорость загрузки влияет на ранжирование. Оптимизируйте LCP, FID, CLS.",
        "Для Next.js: getStaticProps для статики, getServerSideProps для динамики. ISR (incremental static regeneration) — золотая середина.",
        "Мобильная версия: адаптивный дизайн, viewport meta, отсутствие горизонтального скролла на 320px."
    ],
    'devtools_sage': [
        "Вкладка Performance: запись, выделение долгих задач (жёлтые и красные блоки). Ищите пересчёт стилей (Recalculate Style).",
        "Network: имитируйте медленные сети (3G, offline). Блокировка запросов, просмотр размера и времени загрузки.",
        "Вкладка Coverage: показывает, какой процент CSS/JS использован. Удаляйте неиспользуемый код.",
        "Сохранение логов: вкладка Console, настройка «Preserve log». Не теряются при навигации.",
        "Отладка React: расширение React DevTools. Профилирование рендеров, поиск компонентов, хуков.",
        "Вкладка Elements: инспекция стилей, добавление классов на лету, изменение псевдоклассов (:hover).",
        "Локальное переопределение (Overrides): изменяйте файлы прямо в DevTools, сохраняйте изменения для локальной отладки.",
        "JavaScript дебаггер: точки останова (breakpoints), условные breakpoints, логпойнты (console.log без изменения кода).",
        "Анализ памяти: вкладка Memory, снимки кучи (heap snapshot). Ищите утечки — увеличивающиеся объекты.",
        "Симуляция устройств: режим эмуляции мобильных устройств, сенсорных событий, геолокации, ориентации."
    ]
}

# Ключевые слова для валидации (оставлены из оригинального кода)
THEME_KEYWORDS = [
    "frontend", "html", "css", "javascript", "web", "browser", "ui", "ux",
    "layout", "responsive", "accessibility", "a11y", "bundle", "webpack", "vite",
    "performance", "design-system", "api", "component", "state", "dom", "render",
    "grid", "flex", "flexbox", "semantic", "react", "router", "seo", "pwa",
    "testing", "devtools", "loading", "image", "font", "theme", "access", "aria",
    "shadow", "margin", "padding", "border", "box", "button", "label", "form",
    "input", "transition", "animation", "mobile-first", "adaptive", "skeleton",
    "storybook", "json-ld", "lighthouse", "source maps", "страница", "сайт",
    "интерфейс", "контент", "адаптив", "мобиль", "макет", "шрифт", "кноп",
    "карточ", "список", "форма", "модал", "навигац", "отступ", "цвет", "текст",
    "сетка", "импорт", "компонент", "рендер", "событие", "яндекс"
]

def validate_posts():
    author_logins = {author["login"] for author in AUTHORS}
    if not (10 <= len(AUTHORS) <= 25):
        raise AssertionError(f"Ожидается 10-25 авторов, найдено {len(AUTHORS)}")

    if set(POSTS.keys()) != author_logins:
        missing = author_logins - set(POSTS.keys())
        extra = set(POSTS.keys()) - author_logins
        raise AssertionError(f"Несоответствие авторов. Пропущены: {missing}, лишние: {extra}")

    total_posts = sum(len(posts) for posts in POSTS.values())
    if total_posts != 100:
        raise AssertionError(f"Ожидается 100 постов, найдено {total_posts}")

    for login, posts in POSTS.items():
        if len(posts) != 10:
            raise AssertionError(f"У автора {login} должно быть 10 постов, найдено {len(posts)}")
        for index, post in enumerate(posts, start=1):
            if not isinstance(post, str) or not post.strip():
                raise AssertionError(f"Пост #{index} автора {login} пуст")

    all_posts = [post.strip() for posts in POSTS.values() for post in posts]
    if len(all_posts) != len(set(all_posts)):
        raise AssertionError("Найдены дублирующиеся посты")

    for post in all_posts:
        text = post.lower()
        if not any(keyword in text for keyword in THEME_KEYWORDS):
            raise AssertionError(f"Пост не соответствует теме frontend: {post[:80]}...")

    logger.info("Валидация пройдена: %d авторов, %d постов", len(AUTHORS), total_posts)

def seed_database():
    logger.info("Запуск заполнения базы данных...")

    auth_url = os.getenv("AUTH_SERVICE_URL", AUTH_SERVICE_URL)
    post_url = os.getenv("POST_SERVICE_URL", POST_SERVICE_URL)

    for author in AUTHORS:
        try:
            req = urllib.request.Request(
                f"{auth_url}/register",
                data=json.dumps({"login": author["login"], "password": author["password"]}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                logger.info(f"Регистрация {author['login']}: {result}")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            logger.warning(f"Регистрация {author['login']}: {e.code} {body}")
        except Exception as e:
            logger.warning(f"Регистрация {author['login']} не удалась: {e}")

    for author in AUTHORS:
        login = author["login"]
        password = author["password"]
        posts = POSTS.get(login, [])

        token = None
        try:
            req = urllib.request.Request(
                f"{auth_url}/auth",
                data=json.dumps({"login": login, "password": password}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                token = data.get("access_token")
                logger.info(f"Логин {login}: {'OK' if token else 'Нет токена'}")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            logger.warning(f"Логин {login}: {e.code} {body}")
            continue
        except Exception as e:
            logger.warning(f"Логин {login} не удался: {e}")
            continue

        if not token:
            continue

        for i, content in enumerate(posts):
            try:
                req = urllib.request.Request(
                    f"{post_url}/post",
                    data=json.dumps({"content": content}).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {token}",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=60) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
                    post_id = result.get("post_id", "?")
                    logger.info(f"Пост {i+1}/10 от {login}: id={post_id}")
                time.sleep(1)
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", errors="replace")
                logger.warning(f"Пост {i+1} от {login}: {e.code}")
            except Exception as e:
                logger.warning(f"Пост {i+1} от {login} не удался: {e}")

    logger.info("Заполнение базы данных завершено!")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    # validate_posts()
    seed_database()