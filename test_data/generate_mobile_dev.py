import logging
import json
import os
import time
import urllib.request

logger = logging.getLogger(__name__)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")
POST_SERVICE_URL = os.getenv("POST_SERVICE_URL", "http://localhost:8002")

AUTHORS = [
    {"login": "ios_dev_alex", "password": "MobileDev1!", "description": "iOS-разработчик, SwiftUI энтузиаст"},
    {"login": "android_kate", "password": "MobileDev1!", "description": "Android-разработчик, Kotlin GDE"},
    {"login": "flutter_mike", "password": "MobileDev1!", "description": "Flutter-разработчик, кроссплатформа"},
    {"login": "rn_developer", "password": "MobileDev1!", "description": "React Native разработчик, TypeScript"},
    {"login": "mobile_architect", "password": "MobileDev1!", "description": "Архитектор мобильных приложений"},
    {"login": "ui_ux_mobile", "password": "MobileDev1!", "description": "UI/UX дизайнер мобильных приложений"},
    {"login": "mobile_qa", "password": "MobileDev1!", "description": "QA-инженер мобильного тестирования"},
    {"login": "xamarin_dev", "password": "MobileDev1!", "description": "Xamarin/.NET MAUI разработчик"},
    {"login": "mobile_security", "password": "MobileDev1!", "description": "Специалист по безопасности мобильных приложений"},
    {"login": "perf_optimizer", "password": "MobileDev1!", "description": "Оптимизатор производительности"},
]

POSTS = {
    'ios_dev_alex': [
        "SwiftUI — это хорошо, но для сложных навигационных переходов всё ещё приходится использовать UIKit. UINavigationController + UIHostingController — мой хак на 2024 год.",
        "CoreData vs SwiftData: второй только начинает зреть. Миграции с CoreData на SwiftData — тот ещё квест, особенно с iCloud Sync. Подожду ещё года.",
        "Оптимизация iOS-приложения: избавился от лишних вызовов `reloadData()` в UITableView и получил +15 fps. Инструменты Instruments — огонь.",
        "Combine я так и не полюбил. Для простых async/await хватает, для сложных стримов проще взять RxSwift, он понятнее команде.",
        "Провёл эксперимент: переписал модуль на SwiftUI + Observation framework (iOS 17+). Кода стало на 30% меньше, багов на релизе — на 50%. Но поддержка iOS 16 убивает.",
        "Забавный кейс: на iOS 15.4 срабатывал `onAppear` после каждого перехода обратно, хотя вьюха не пересоздавалась. Пришлось заменить на `task(id:)` с проверкой.",
        "Push-уведомления на iOS: не забывайте про `didReceiveRemoteNotification:fetchCompletionHandler`. Если не вызвать completionHandler, система убьёт приложение в фоне.",
        "Почему я до сих пор не люблю SwiftUI для больших форм? Анимация клавиатуры съезжает, `@FocusState` иногда зависает. UIKit в этом плане надёжнее.",
        "WWDC23 принёс `StoreKit 2`, и это глоток свежего воздуха. Наконец-то транзакции не приходится парсить из сырого JSON.",
        "Совет: всегда подписывайте билды для TestFlight с распределённым сертификатом. Иначе при увольнении коллеги приложение падает."
    ],
    'android_kate': [
        "Jetpack Compose — лучший друг, но не для списков с частыми обновлениями. `derivedStateOf` и `remember` спасают от перерисовок всего подряд.",
        "Однажды я забыл отменить корутину при выходе из фрагмента. Ждал 10 секунд GC — приложение подвисало. `viewModelScope` + `Dispatchers.IO` правильно использовать.",
        "Room с Flow — отлично, но для сложных запросов с несколькими таблицами лучше делать `@Transaction` и возвращать обычные списки, а не Flow.",
        "Билд-таймы в Android Studio? Используйте модули по фичам и `build.gradle` с `isSeparate = true`. Мои сборки ускорились с 3 минут до 45 секунд.",
        "Тёмная тема не только дизайн. На AMOLED-экранах экономия батареи до 30%. Только следите, чтобы контрастность текста была > 4.5:1.",
        "WorkManager — крутая штука, но периодические задачи с интервалом менее 15 минут могут быть отложены системой. Doze mode решает.",
        "Когда я перешёл с Java на Kotlin, сразу влюбился в `sealed class` для состояний экрана. Никаких больше `if (response is Success) ...`.",
        "SharedPreferences устарели. DataStore с протоколами буфера — быстрее и типобезопаснее. Но миграцию с Preferences нужно делать вручную.",
        "Тестируйте `onSaveInstanceState`! Однажды потерял состояние формы при повороте экрана. `rememberSaveable` в Compose спасает.",
        "Гугл выпустил Baseline Profiles для ускорения холодного старта. Использовал — запуск стал на 40% быстрее на старых устройствах."
    ],
    'flutter_mike': [
        "Flutter — круто, но горячая перезагрузка иногда врёт. Если меняете глобальные переменные или статические поля — ждите сюрпризов.",
        "Перешёл с BLoC на Riverpod после года мучений. Кода стало меньше, а тестировать проще. Provider — прошлый век.",
        "Оптимизация Flutter: используйте `RepaintBoundary` для сложных анимаций. И избегайте `Opacity` в слоях — замените на `FadeTransition`.",
        "Мой опыт: flutter_localizations под iOS весит 2 МБ, но без него правильное плюральное правило для русского языка не работает. Стоит того.",
        "Гибридные навигационные стеки (GoRouter + нативные экраны) — боль. Пришлось писать платформенные каналы для передачи событий жизненного цикла.",
        "Flame для игр? Пока хобби-проекты, но для production лучше брать Unity или Godot. Хотя производительность Flame приятно удивила.",
        "Билд-варнинг: `use_deferred_image_loading` в iOS иногда ломает отображение картинок из памяти. Отключил — полетело.",
        "На Flutter Web пока что плавающие позиции `Stack` работают нестабильно. Для сложной вёрстки лучше рендерить CanvasKit, а не HTML.",
        "Адаптивные приложения на Flutter — это магия. MediaQuery и LayoutBuilder в связке с custom size classes заменяют UIKit-подход.",
        "Пакет `flutter_bloc` хорош, но для простых экранов даже `setState` — нормально. Не усложняйте там, где не надо."
    ],
    'rn_developer': [
        "React Native: заменил старый Metro на Re.Pack (Webpack) — холодная перезагрузка стала на 60% быстрее. Особенно круто для крупных проектов.",
        "Hermes — мастхэв для RN 0.70+. Уменьшает размер бинарника на 20% и ускоряет старт. Только проверьте совместимость с `Intl`.",
        "Однажды на релизе поймал баг: `useEffect` срабатывал дважды из-за React.StrictMode. Оказалось, не очищал подписки. Мурашки по коже.",
        "Мосты (bridges) в RN — узкое место. Для частых обновлений (видео, анимации) лучше использовать Fabric TurboModules. Разница в fps колоссальная.",
        "Навигация: React Navigation 6 стала стабильной, но навигация глубоких ссылок (deeplinks) до сих пор требует магии с `linking.config`.",
        "Redux Toolkit + RTK Query убили столько боли. Никаких санок, автоматическое кеширование и инвалидация — рай для API.",
        "Плагин `react-native-permissions` — незаменим. Только не забудьте добавить использование в `Info.plist` и `AndroidManifest`, иначе крэш.",
        "Проверяйте `InteractionManager.runAfterInteractions` перед тяжёлыми расчётами. Иначе анимация перехода будет дёргаться.",
        "Экран загрузки (splash screen) на iOS — подводный камень. Используйте библиотеку `react-native-bootsplash`, она генерит нативные экраны.",
        "Ошибка: нельзя хранить большие изображения в состоянии. При скролле галереи память взлетала до 500 МБ. Решил `FlatList` с пропсом `removeClippedSubviews`."
    ],
    'mobile_architect': [
        "Чистая архитектура в мобилках: не всегда нужно разделение на data/domain/presentation для каждого экрана. Начните с двух слоёв, усложняйте по мере роста.",
        "Модуляризация через feature-модули. Gradle-кеширование для каждого фичи отдельно ускорило сборку на CI на 40%.",
        "Внедрял MVI (Model-View-Intent) на проекте с 20 экранами. Пришлось отказаться — слишком много бойлерплейта. MVVM с LiveData/StateFlow проще.",
        "Зависимости: Dagger Hilt — стандарт для Android, но для iOS лучше использовать чистые синглтоны и фабрики. Контейнеры ввода излишни.",
        "Кэширование данных: Room + SQLite + Retrofit + offline-first. Синхронизация при восстановлении сети — самый частый источник багов.",
        "Выбор между WebView и нативом для сложных форм. Мы пошли на WebView и пожалели: проблемы с сенсорным вводом и памятью.",
        "Clean Architecture с use cases даёт преимущество при тестировании. Но количество интерфейсов растёт экспоненциально.",
        "Мониторинг ошибок: не только Crashlytics, но и Firebase Performance. Нашли узкое место в сериализации — время сократили вдвое.",
        "Гибридная навигация: нативные экраны перемежаются с WebView. Пришлось писать свой координатор для синхронизации стека.",
        "Оценка времени разработки: на проектирование архитектуры закладывайте 20% времени, иначе переписывать полгода."
    ],
    'ui_ux_mobile': [
        "iOS HIG и Material Design не конфликтуют, но сочетать их нужно аккуратно. Кнопки должны выглядеть как кнопки на обеих платформах.",
        "Глубина навигации: более трёх уровней — пользователь теряется. Используйте нижнее меню для важных разделов, кнопку «Назад» — для остальных.",
        "Жесты свайпа (swipe back) на iOS естественны, на Android — тоже, но есть модели с жестом «домой». Проверяйте на реальных устройствах.",
        "Анимация перехода между экранами не должна длиться дольше 300 мс. Иначе кажется, что приложение тормозит.",
        "Доступность: кнопки должны быть не меньше 44x44 pt (48x48 dp). Добавьте `accessibilityLabel` для иконок, иначе VoiceOver будет читать «кнопка».",
        "Скелетон вместо спиннера при загрузке улучшает восприятие. Пользователь видит структуру, не раздражается.",
        "Вариант шрифтов: для iOS лучше использовать системный San Francisco, для Android — Roboto. Не заставляйте пользователя привыкать к чужому.",
        "Формы ввода: показывайте ошибку сразу после потери фокуса, а не после отправки. Поле с паролем должно иметь кнопку показать/скрыть.",
        "Динамический тип шрифта: поддерживайте увеличение размера шрифта в настройках системы. Иначе пожилые пользователи бросят приложение.",
        "Тёмная тема должна быть не просто инверсией цветов. Используйте разные оттенки серого для иерархии."
    ],
    'mobile_qa': [
        "Автотесты на iOS: XCUITest умеет записывать действия, но генерирует нечитаемый код. Пишите самописные Page Object на Swift.",
        "Android: Espresso + Idling Resources — ждать появления элементов. Без них тесты падают из-за асинхронности.",
        "Сниппет для эмуляции плохого интернета на реальном устройстве: Charles Proxy или Network Link Conditioner. Отлавливает баги с таймаутами.",
        "Инструмент для регрессии: screenshot testing с помощью Paparazzi (Android) или SnapshotTesting (iOS). Ловили баги в вёрстке, которые глазом не видно.",
        "Крэшлитикс + Firebase Test Lab: запуск тестов на сотнях устройств в облаке. Выявили проблемы на Samsung Galaxy J5, которые на пикселе не воспроизводились.",
        "При ручном тестировании составляйте чек-лист сценариев: офлайн-режим, переворот экрана, фоновый режим, push-уведомления в разных состояниях.",
        "Баги с памятью: используйте Xcode Memory Graph или Android Studio Memory Profiler. Один retain cycle — и приложение падает через час.",
        "Тестирование конфигураций: разные языки, разные версии ОС, разные разрешения экрана. Автоматизируйте на CI с помощью матрицы параметров.",
        "Не забывайте про тестирование обновлений с предыдущей версии. Миграции баз данных — частая причина крэшей после апдейта.",
        "Проверка прав доступа: при первом запуске запрашивайте только критичные. Иначе пользователь уходит."
    ],
    'xamarin_dev': [
        ".NET MAUI наконец-то стал стабильным в .NET 8. Но для новых проектов всё ещё рассматриваю Flutter — горячая перезагрузка быстрее.",
        "Xamarin.Forms был болью. MAUI с обработчиками (handlers) дал прирост производительности на 30% за счёт отказа от рендереров.",
        "Использование Community Toolkit MVVM ускоряет разработку. `[ObservableProperty]` — лучшее, что случилось с XAML.",
        "Платформенный код: используйте условную компиляцию `#if IOS` вместо диспетчера зависимостей. Проще и быстрее.",
        "Библиотека SkiaSharp позволяет рисовать кастомные элементы без платформенных отличий. Экономия времени на 50%.",
        "Встроенный Dependency Injection в MAUI — плохо. Лучше использовать сторонний контейнер вроде Autofac, он гибче.",
        "Сборка под iOS из Windows — тот ещё квест. Требуется Mac с открытым SSH и правильными сертификатами.",
        "Hot Restart в VS Windows для iOS — пока сыро. После 5-го билда эмулятор падает. Пользуюсь только для последнего теста.",
        "Ошибка: не забывайте вызывать `base.OnBackButtonPressed()` в Android, иначе кнопка «Назад» не работает.",
        "Полезный совет: используйте `CommunityToolkit.Maui.Storage` для безопасного доступа к файловой системе. Обёртка над нативными API."
    ],
    'mobile_security': [
        "Хранение токенов: SharedPreferences — небезопасно. На Android используйте EncryptedSharedPreferences, на iOS — Keychain.",
        "Certificate pinning — мастхэв для финансовых приложений. Но обновлять сертификаты нужно через механизм обновления приложения, иначе блокировка.",
        "Обфускация: ProGuard/R8 для Android, для iOS — коммерческие решения типа DexGuard. Останавливает только новичков.",
        "Проверка root/jailbreak: не полагайтесь на один флаг. Используйте комбинацию: проверка наличия Cydia, Magisk, недоступности системных файлов.",
        "Сниффинг трафика: включайте NSAppTransportSecurity (iOS) и `android:usesCleartextTraffic="false"`. Иначе данные текут в открытую.",
        "Локальная БД: шифруйте SQLite с помощью SQLCipher. Пароль храните в Keychain/Keystore, иначе ключ в коде найдут дизассемблером.",
        "Валидация ввода: даже на клиенте. SQL-инъекции через локальные запросы — реальность, если используете сырые строки.",
        "DeepLink-фишинг: проверяйте, что ссылка пришла из доверенного источника. Иначе поддельный URL запустит ваше приложение с вредоносными параметрами.",
        "Clang sanitizers для C++ кода в нативных библиотеках. Один переполнение буфера — и уязвимость.",
        "Регулярно сканируйте зависимости на известные уязвимости (OWASP Dependency Check). Библиотеки часто устаревают."
    ],
    'perf_optimizer': [
        "Измеряйте холодный старт приложения. На Android: `adb shell am start -W`, на iOS: Instruments -> App Launch. Цель — меньше 1 секунды.",
        "Размер изображений: используйте WebP или HEIC, сжимайте до 80% качества. Экономия трафика до 50%.",
        "Лишние перерисовки: включите в Android Show GPU Overdraw. Сильное закрашивание красным — убивайте прозрачные слои.",
        "ListView/RecyclerView: ViewHolder паттерн — обязательно. Не делайте findViewById в `onBindViewHolder`.",
        "Сборка мусора в Unity на iOS — проблема. Старайтесь создавать объекты в пуле, а не динамически.",
        "Оптимизация батареи: не используйте GPS в фоне без крайней необходимости. Используйте значимые изменения местоположения.",
        "Размер APK: анализируйте с помощью Android Studio APK Analyzer. Удалите дублирующиеся библиотеки и неиспользуемые ресурсы.",
        "Ленивая загрузка: загружайте модули и фичи по требованию. Google Play Dynamic Delivery помогает.",
        "Профилирование: Systrace (Android) и os_signpost (iOS). Ищите долгие операции на UI-потоке.",
        "Кэширование сетевых ответов: используйте OkHttp cache с контрольными суммами. Уменьшает количество запросов."
    ]
}

def seed_database():
    logger.info("Starting database seeding via services...")

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
                logger.info(f"Register {author['login']}: {result}")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            logger.warning(f"Register {author['login']}: {e.code} {body}")
        except Exception as e:
            logger.warning(f"Register {author['login']} failed: {e}")

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
                logger.info(f"Login {login}: {'OK' if token else 'No token'}")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            logger.warning(f"Login {login}: {e.code} {body}")
            continue
        except Exception as e:
            logger.warning(f"Login {login} failed: {e}")
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
                    tags = result.get("tags", [])
                    logger.info(f"Post {i+1}/{len(posts)} by {login}: id={post_id}")
                time.sleep(1)
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", errors="replace")
                logger.warning(f"Post {i+1} by {login}: {e.code}")
            except Exception as e:
                logger.warning(f"Post {i+1} by {login} failed: {e}")

    logger.info("Database seeding complete!")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_database()