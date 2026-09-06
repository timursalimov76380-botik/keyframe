/**
 * Словарь сайта. Русский — основной язык, английский — вторая версия
 * для площадок, где заказчик не читает по-русски.
 *
 * Значения-массивы используются только в калькуляторе (списки того, что входит в тариф).
 */
export const dict = {
  ru: {
    'meta.title': 'Keyframe — студия веб-разработки',
    'meta.description':
      'Keyframe — студия веб-разработки. Лендинги, многостраничные сайты и чат-боты на коде: 3D, анимация, интеграции с Telegram и CRM. Публикуем от двух рабочих дней.',

    'nav.skip': 'К содержимому',
    'nav.work': 'Работы',
    'nav.capabilities': 'Возможности',
    'nav.process': 'Процесс',
    'nav.contact': 'Контакты',
    'nav.cta': 'Обсудить проект',
    'nav.menu': 'Меню',

    'hero.eyebrow': 'Студия веб-разработки',
    'hero.lede':
      'Сайты и чат-боты на коде, а не на конструкторе: <strong>лендинги, многостраничники, боты, 3D и анимация</strong>. Собираем от текста и дизайна до публикации — одной командой.',
    'hero.ctaPrimary': 'Смотреть работы',
    'hero.ctaSecondary': 'Написать в Telegram',
    'hero.meta1': 'Четыре сайта в проде',
    'hero.meta2': 'От 2 рабочих дней',
    'hero.meta3': 'Код без конструкторов',
    'hero.scroll': 'Листайте',

    'work.label': 'Работы',
    'work.title': 'Четыре сайта, четыре разные задачи',
    'work.lede':
      'Все четыре работают в проде — ссылки открываются, формы отправляют, цены настоящие. Ниже — не список функций, а то, какую задачу решал каждый.',
    'work.open': 'Открыть сайт',
    'work.card3.kind': 'Каталог с админкой',
    'work.card3.text':
      'Доставка еды с меню на пятьдесят с лишним позиций. Главная сложность была не в витрине, а в том, чтобы владелец менял состав и цены сам: каталог, корзина и админка на Next.js, где блюдо правится за полминуты и без разработчика.',
    'work.card3.tag': 'Админка',
    'work.card3.alt': 'Главный экран сайта доставки Маки-Маки',
    // Dark Glass и Boss Volos латиницей в обеих версиях — переводить нечего.
    // У Маки-Маки бренд-имя кириллическое, поэтому единственное нужно явно
    // переключать между языками (используется и в карточке работ, и в чипе
    // калькулятора ботов — src/modules/bot-calculator.js)
    'brand.makiMaki': 'Маки-Маки',
    'work.card1.kind': 'Премиальный детейлинг',
    'work.card1.text':
      'В детейлинге цену обычно не называют до осмотра, и это отпугивает. Здесь наоборот: шесть услуг с вилками по размеру кузова прямо на странице — клиент считает бюджет заранее и приходит уже решившим.',
    'work.card2.kind': 'Сайт-визитка барбера',
    'work.card2.text':
      'Один мастер против сетевых барбершопов. Выигрывать прайсом бессмысленно, поэтому ставка на голос: страница написана так, как мастер говорит в кресле, а цены зафиксированы заранее — без допродаж по ходу стрижки.',
    'work.card2.tag': 'Анимация',
    'work.card4.kind': 'Продающий вебинар',
    'work.card4.text':
      'Продающий лендинг вебинара психолога, где вся суть — довести от «хочу» до оплаты за один экран. Оплата через Robokassa с собственной интеграцией, доступ к видео с DRM-защитой открывается сразу после оплаты, а платежи и доступы ведутся в отдельной админке на Supabase.',
    'work.card4.alt': 'Главный экран продающего вебинара Nagaichenko',

    'cap.label': 'Возможности',
    'cap.title': 'Не список технологий, а что они дают',
    'cap.lede':
      'Посчитайте смету прямо здесь и посмотрите, как выглядит панель, через которую владелец правит сайт сам. Оба блока — рабочие, а не картинки.',

    'calc.badge': 'Живой виджет',
    'calc.title': 'Смета за минуту',
    'calc.kindLabel': 'Что нужно',
    'calc.kind.landing': 'Лендинг под ключ',
    'calc.kind.multipage': 'Многостраничный сайт',
    'calc.kind.design': 'Только дизайн-макет',
    'calc.kind.shop': 'Интернет-магазин под ключ',
    'calc.tierLabel': 'Тариф',
    'calc.tier.base': 'Базовый',
    'calc.tier.standard': 'Стандарт',
    'calc.tier.premium': 'Премиум',
    'calc.extrasLabel': 'Дополнительно',
    'calc.cms': 'Панель для самостоятельного редактирования',
    'calc.cmsNote': 'Тексты и фото меняете сами, без разработчика',
    'calc.cmsNoteOff': 'Для дизайн-макета не применяется — сайт ещё не разработан',
    'calc.cmsNoteIncluded': 'Простая CMS уже входит в любой тариф магазина',
    'calc.exclLabel': 'Не входит по умолчанию',
    'calc.from': 'от',
    'calc.days': 'рабочих дней',
    'calc.disclaimer':
      'Стартовые цены для первых проектов — ниже среднерыночных за счёт быстрого процесса. Точная сумма считается после брифа.',

    'calc.inc.landing.base': [
      'До 5 блоков на странице',
      'Адаптив под телефон, планшет и десктоп',
      'Форма заявки с валидацией',
      'Один круг правок после сдачи',
    ],
    'calc.inc.landing.standard': [
      'До 8 блоков на странице',
      'Плавные анимации при скролле',
      'Форма заявки и уведомление в Telegram',
      'Яндекс.Метрика или Google Analytics',
      'Базовая SEO-настройка',
      'Два круга правок после сдачи',
    ],
    'calc.inc.landing.premium': [
      'До 12 блоков, кастомная структура',
      'Кастомные анимации и микро-интерактив',
      'Интеграция с CRM и Telegram',
      'Аналитика с настройкой целей',
      'Расширенная SEO-настройка',
      'Три круга правок после сдачи',
    ],
    'calc.inc.multipage.base': [
      '3–4 раздела: главная, о компании, услуги, контакты',
      'Единая навигация между разделами',
      'Форма заявки с валидацией',
      'Один круг правок после сдачи',
    ],
    'calc.inc.multipage.standard': [
      '5–7 разделов плюс портфолио или блог',
      'Плавные анимации при скролле',
      'Форма заявки и уведомление в Telegram',
      'Аналитика и базовое SEO по всем страницам',
      'Два круга правок после сдачи',
    ],
    'calc.inc.multipage.premium': [
      '8–12 разделов, кастомная структура',
      'Кастомные анимации и микро-интерактив',
      'Интеграция с CRM и Telegram',
      'Цели аналитики по каждому разделу',
      'Расширенное SEO и карта сайта',
      'Три круга правок после сдачи',
    ],
    'calc.inc.design.base': [
      'Один ключевой экран — концепция',
      'Десктопная версия',
      'HTML-прототип и PNG',
      'Один круг правок',
    ],
    'calc.inc.design.standard': [
      'Полный дизайн лендинга, все блоки',
      'Десктоп и мобильная версия',
      'Дизайн-система: цвета, шрифты, компоненты',
      'HTML-прототип и PDF-презентация',
      'Два круга правок',
    ],
    'calc.inc.design.premium': [
      'До 5 уникальных страниц',
      'Десктоп, мобильная и планшетная версии',
      'Два варианта ключевого экрана на выбор',
      'Расширенная дизайн-система',
      'Три круга правок',
    ],
    'calc.inc.shop.base': [
      'До 50 товаров, без сложной фильтрации',
      'Каталог, корзина и оформление заказа',
      'Один способ оплаты на сайте',
      'Простая CMS для товаров — уже входит',
      'Личный кабинет с историей заказов',
      'Один круг правок после сдачи',
    ],
    'calc.inc.shop.standard': [
      'До 300 товаров: категории, фильтры и поиск',
      'Варианты товара — размер, цвет',
      'Избранное и промокоды',
      'Оплата картой и через СБП',
      'Статусы заказов и уведомления в Telegram',
      'Аналитика и базовое SEO',
      'Два круга правок после сдачи',
    ],
    'calc.inc.shop.premium': [
      'Каталог без ограничений, с пагинацией',
      'Несколько способов оплаты, варианты доставки при заказе',
      'Расширенный личный кабинет и расширенная CMS',
      'Интеграция с CRM, статистика продаж',
      'Расширенная SEO-настройка',
      'Три круга правок после сдачи',
    ],
    'calc.excl.shop': [
      'Синхронизация остатков и цен с Ozon/WB или другими источниками',
      'Интеграция служб доставки (СДЭК, Boxberry и т. п.)',
      'Нагрузочное тестирование и выделенный сервер под высокий трафик',
    ],
    'calc.inc.cms': 'Панель редактирования на Decap CMS',

    'admin.badge': 'Как это выглядит у клиента',
    'admin.title': 'Админка, а не звонок разработчику',
    'admin.colName': 'Позиция',
    'admin.colPrice': 'Цена',
    'admin.colState': 'Показ',
    'admin.pinPrice': 'Цена правится в строке',
    'admin.pinState': 'Снять с витрины — один тумблер',
    'admin.text':
      'Так устроена панель Маки-Маки. Сезонное блюдо убирается с витрины тумблером, цена меняется прямо в строке — правки не копятся до вечера и не стоят отдельных денег.',

    'stack.badge': 'Стек',
    'stack.title': 'На чём собираем',
    'stack.text':
      'Стек выбирается под задачу, а не наоборот. Этот сайт, например, собран без фреймворка — одностраничнику не нужен роутинг, а лишний слой только замедлил бы загрузку.',

    'int.badge': 'Интеграции',
    'int.title': 'Куда уходит заявка',
    'int.telegram': 'Заявка падает в чат за секунду после отправки',
    'int.crm': 'Передача сделок по API — токен даёте вы, настройку делаем мы',
    'int.analytics': 'Счётчик и цели на кнопках и формах, а не «просто установлен»',

    'bots.label': 'Боты',
    'bot.title': 'Во сколько обойдётся бот',
    'bots.lede':
      'Второй живой калькулятор на этой странице — не просто демонстрация: похожий модуль можно встроить и в ваш сайт.',
    'bot.messengerLabel': 'Мессенджер',
    'bot.messenger.telegram': 'Telegram',
    'bot.messenger.max': 'MAX',
    'bot.messenger.both': 'Telegram + MAX',
    'bot.disclaimerSurcharge': 'Плюс 20% к цене при выборе Telegram и MAX сразу.',
    'bot.disclaimerBrief': 'Точная стоимость — после брифа.',
    'bot.tier.base.forWhom':
      'Консультации и запись без истории диалога — например, студия детейлинга, как у Dark Glass, или барбершоп с одним мастером, как у Boss Volos, а также услуги, которые считаются «на глаз».',
    'bot.tier.standard.forWhom':
      'Запись с выбором мастера, временем и напоминаниями — для барбершопа с несколькими мастерами, либо мини-магазин в чате с корзиной, как у Маки-Маки.',
    'bot.tier.premium.forWhom':
      'Бот сам ведёт диалог — квалифицирует лида для B2B и передаёт заявку менеджеру (в этом духе работает Groq Assistant), либо берёт на себя внутреннюю рутину вроде черновиков контента на согласование.',
    'bot.proofLabel': 'Уже работает:',
    'bot.proofOpen': 'открыть в Telegram',

    'process.label': 'Процесс',
    'process.title': 'Четыре шага от брифа до публикации',
    'process.lede':
      'Отсчёт срока идёт с момента, когда получены бриф и материалы. Оплата — половина до старта, половина после сдачи; для интернет-магазина — тремя этапами (30/40/30%) из-за большего объёма работ.',
    'process.s1.title': 'Бриф и структура',
    'process.s1.text':
      'Разбираем цель, продукт и аудиторию, смотрим двух-трёх конкурентов. Собираем схему блоков и согласуем логику страницы до того, как рисовать.',
    'process.s2.title': 'Дизайн ключевых экранов',
    'process.s2.text':
      'Отрисовываем один-два главных экрана и утверждаем стиль. Остальные блоки оформляются в той же системе — шрифты и компоненты переиспользуются.',
    'process.s3.title': 'Вёрстка и интеграции',
    'process.s3.text':
      'Верстаем на коде, адаптируем под телефон и планшет, подключаем анимации, форму заявки, уведомления в Telegram и аналитику.',
    'process.s4.title': 'Публикация и правки',
    'process.s4.text':
      'Проверяем на реальных устройствах, публикуем, привязываем домен. Дальше — согласованные круги правок и помощь с мелочами первые две недели.',

    'contact.label': 'Контакты',
    'contact.title': 'Расскажите, что нужно сделать',
    'contact.text':
      'Напишите в Telegram пару строк о задаче — отвечаем сами, без ботов и анкет на двадцать полей. Если по срокам или бюджету не сойдёмся, скажем сразу.',
    'contact.cta': 'Написать в Telegram',

    'footer.note': 'Студия веб-разработки. Ключевой кадр — тот, с которого начинается движение.',
    'footer.privacy': 'Политика конфиденциальности',
    'footer.oferta': 'Публичная оферта',
  },

  en: {
    'meta.title': 'Keyframe — web development studio',
    'meta.description':
      'Keyframe is a web development studio. Hand-coded landing pages, multi-page sites and chat bots: 3D, animation, Telegram and CRM integrations. Live in two working days.',

    'nav.skip': 'Skip to content',
    'nav.work': 'Work',
    'nav.capabilities': 'Capabilities',
    'nav.process': 'Process',
    'nav.contact': 'Contact',
    'nav.cta': 'Start a project',
    'nav.menu': 'Menu',

    'hero.eyebrow': 'Web development studio',
    'hero.lede':
      'Hand-coded sites and chat bots, not page builders: <strong>landing pages, multi-page sites, bots, 3D and motion</strong>. Copy, design and build — one team, start to launch.',
    'hero.ctaPrimary': 'See the work',
    'hero.ctaSecondary': 'Message on Telegram',
    'hero.meta1': 'Four sites in production',
    'hero.meta2': 'From 2 working days',
    'hero.meta3': 'Code, not page builders',
    'hero.scroll': 'Scroll',

    'work.label': 'Work',
    'work.title': 'Four sites, four different problems',
    'work.lede':
      'All four are live — the links open, the forms send, the prices are real. What follows is the problem each one solved, not a feature list.',
    'work.open': 'Open the site',
    'work.card3.kind': 'Catalogue with admin panel',
    'work.card3.text':
      'A food delivery menu of fifty-plus items. The hard part was not the storefront but letting the owner change prices and dishes without us: a Next.js catalogue, cart and admin panel where an item is edited in half a minute.',
    'work.card3.tag': 'Admin panel',
    'work.card3.alt': 'Home screen of the Maki-Maki delivery site',
    'brand.makiMaki': 'Maki-Maki',
    'work.card1.kind': 'Premium car detailing',
    'work.card1.text':
      'Detailing studios usually hide prices until an inspection, and that costs them bookings. This one does the opposite: six services with ranges by body size, right on the page — the client budgets in advance and arrives already decided.',
    'work.card2.kind': "Barber's one-page site",
    'work.card2.text':
      'One barber against the chains. Competing on price makes no sense, so the site competes on voice: it reads the way she talks in the chair, and every price is fixed up front — no upselling mid-haircut.',
    'work.card2.tag': 'Motion',
    'work.card4.kind': 'Webinar checkout page',
    'work.card4.text':
      "A one-page checkout for a psychologist's paid webinar, built to take a visitor from curious to paid in a single screen. Payment runs through Robokassa with a custom integration, DRM-protected video unlocks right after payment, and orders live in a separate Supabase-backed admin panel.",
    'work.card4.alt': 'Home screen of the Nagaichenko webinar checkout page',

    'cap.label': 'Capabilities',
    'cap.title': 'What the stack actually gives you',
    'cap.lede':
      'Price a project right here, then look at the panel the owner uses to edit their own site. Both blocks work — neither is a screenshot.',

    'calc.badge': 'Live widget',
    'calc.title': 'A quote in a minute',
    'calc.kindLabel': 'What you need',
    'calc.kind.landing': 'Landing page, turnkey',
    'calc.kind.multipage': 'Multi-page website',
    'calc.kind.design': 'Design mockup only',
    'calc.kind.shop': 'Online store, turnkey',
    'calc.tierLabel': 'Tier',
    'calc.tier.base': 'Base',
    'calc.tier.standard': 'Standard',
    'calc.tier.premium': 'Premium',
    'calc.extrasLabel': 'Add-ons',
    'calc.cms': 'Panel for editing the site yourself',
    'calc.cmsNote': 'Change text and photos without a developer',
    'calc.cmsNoteOff': 'Not applicable to a mockup — the site is not built yet',
    'calc.cmsNoteIncluded': 'A simple CMS is already included in every store tier',
    'calc.exclLabel': 'Not included by default',
    'calc.from': 'from',
    'calc.days': 'working days',
    'calc.disclaimer':
      'Starting rates for our first projects — below market because the process is fast. The exact figure is set after the brief.',

    'calc.inc.landing.base': [
      'Up to 5 blocks on the page',
      'Responsive on phone, tablet and desktop',
      'Enquiry form with validation',
      'One round of revisions after handover',
    ],
    'calc.inc.landing.standard': [
      'Up to 8 blocks on the page',
      'Smooth scroll-triggered animation',
      'Enquiry form with Telegram notifications',
      'Yandex.Metrica or Google Analytics',
      'Basic SEO setup',
      'Two rounds of revisions after handover',
    ],
    'calc.inc.landing.premium': [
      'Up to 12 blocks, custom structure',
      'Custom animation and micro-interactions',
      'CRM and Telegram integration',
      'Analytics with goal tracking',
      'Extended SEO setup',
      'Three rounds of revisions after handover',
    ],
    'calc.inc.multipage.base': [
      '3–4 sections: home, about, services, contact',
      'Shared navigation across sections',
      'Enquiry form with validation',
      'One round of revisions after handover',
    ],
    'calc.inc.multipage.standard': [
      '5–7 sections plus portfolio or blog',
      'Smooth scroll-triggered animation',
      'Enquiry form with Telegram notifications',
      'Analytics and basic SEO on every page',
      'Two rounds of revisions after handover',
    ],
    'calc.inc.multipage.premium': [
      '8–12 sections, custom structure',
      'Custom animation and micro-interactions',
      'CRM and Telegram integration',
      'Analytics goals per section',
      'Extended SEO and a sitemap',
      'Three rounds of revisions after handover',
    ],
    'calc.inc.design.base': [
      'One key screen — the concept',
      'Desktop version',
      'HTML prototype and PNG',
      'One round of revisions',
    ],
    'calc.inc.design.standard': [
      'Full landing page design, every block',
      'Desktop and mobile versions',
      'Design system: colour, type, components',
      'HTML prototype and PDF deck',
      'Two rounds of revisions',
    ],
    'calc.inc.design.premium': [
      'Up to 5 unique pages',
      'Desktop, mobile and tablet versions',
      'Two options for the key screen',
      'Extended design system',
      'Three rounds of revisions',
    ],
    'calc.inc.shop.base': [
      'Up to 50 products, no complex filtering',
      'Catalogue, cart and checkout',
      'One payment method on the site',
      'Simple CMS for products — already included',
      'Customer account with order history',
      'One round of revisions after handover',
    ],
    'calc.inc.shop.standard': [
      'Up to 300 products: categories, filters and search',
      'Product variants — size, colour',
      'Wishlist and promo codes',
      'Card payment and SBP',
      'Order statuses and Telegram notifications',
      'Analytics and basic SEO',
      'Two rounds of revisions after handover',
    ],
    'calc.inc.shop.premium': [
      'Unlimited catalogue, with pagination',
      'Multiple payment methods, delivery options at checkout',
      'Extended customer account and extended CMS',
      'CRM integration, sales statistics',
      'Extended SEO setup',
      'Three rounds of revisions after handover',
    ],
    'calc.excl.shop': [
      'Syncing stock and prices with Ozon/WB or other sources',
      'Delivery service integration (CDEK, Boxberry, etc.)',
      'Load testing and a dedicated server for high traffic',
    ],
    'calc.inc.cms': 'Decap CMS editing panel',

    'admin.badge': 'What the client sees',
    'admin.title': 'An admin panel, not a call to the developer',
    'admin.colName': 'Item',
    'admin.colPrice': 'Price',
    'admin.colState': 'Live',
    'admin.pinPrice': 'Price edits inline',
    'admin.pinState': 'One toggle pulls it off the menu',
    'admin.text':
      "This is Maki-Maki's panel. A seasonal dish comes off the menu with a toggle and the price changes inline — edits don't pile up until evening and don't cost extra.",

    'stack.badge': 'Stack',
    'stack.title': 'What we build with',
    'stack.text':
      'The stack follows the problem, not the other way round. This site, for instance, runs without a framework — a one-pager needs no routing, and the extra layer would only slow it down.',

    'int.badge': 'Integrations',
    'int.title': 'Where the enquiry lands',
    'int.telegram': 'The enquiry hits your chat a second after it is sent',
    'int.crm': 'Deals passed over the API — you supply the token, we do the setup',
    'int.analytics': 'Counter plus goals on buttons and forms, not just "installed"',

    'bots.label': 'Bots',
    'bot.title': 'What a bot would cost',
    'bots.lede':
      "The second live calculator on this page isn't just a demo — a similar module can be built into your site too.",
    'bot.messengerLabel': 'Messenger',
    'bot.messenger.telegram': 'Telegram',
    'bot.messenger.max': 'MAX',
    'bot.messenger.both': 'Telegram + MAX',
    // MAX/«оба» недоступны в EN — надбавке взяться неоткуда, поэтому пояснение о ней тут пустое
    'bot.disclaimerSurcharge': '',
    'bot.disclaimerBrief': 'The exact figure is set after the brief.',
    'bot.tier.base.forWhom':
      'Consultations and bookings with no dialogue history — a detailing studio like Dark Glass, or a one-barber shop like Boss Volos, plus services usually quoted by eye.',
    'bot.tier.standard.forWhom':
      'Booking with a choice of stylist, time slot and reminders — for a multi-chair barbershop, or an in-chat cart like Maki-Maki\'s delivery menu.',
    'bot.tier.premium.forWhom':
      'The bot runs the conversation itself — qualifying a B2B lead and handing it to a manager (roughly how Groq Assistant works), or taking over internal routine work like drafting content for approval.',
    'bot.proofLabel': 'Already live:',
    'bot.proofOpen': 'open on Telegram',

    'process.label': 'Process',
    'process.title': 'Four steps from brief to launch',
    'process.lede':
      'The clock starts when the brief and materials arrive. Payment is half up front, half on handover — for an online store, it splits into three stages (30/40/30%) to match the larger scope.',
    'process.s1.title': 'Brief and structure',
    'process.s1.text':
      'We go through the goal, the product and the audience, and look at two or three competitors. Then we map the blocks and agree the page logic before anything is drawn.',
    'process.s2.title': 'Key screens designed',
    'process.s2.text':
      'We design one or two main screens and lock the style. The rest is built in the same system — type and components get reused.',
    'process.s3.title': 'Build and integrations',
    'process.s3.text':
      'We hand-code it, adapt it for phone and tablet, then wire up the animation, the enquiry form, Telegram notifications and analytics.',
    'process.s4.title': 'Launch and revisions',
    'process.s4.text':
      'We test on real devices, publish, and connect the domain. After that: the agreed rounds of revisions, plus help with small things for the first two weeks.',

    'contact.label': 'Contact',
    'contact.title': 'Tell us what needs building',
    'contact.text':
      'Send a couple of lines about the project on Telegram — you get a person, not a bot or a twenty-field form. If the timeline or budget does not work, we say so straight away.',
    'contact.cta': 'Message on Telegram',

    'footer.note': 'Web development studio. A keyframe is where the movement starts.',
    // Сами документы остаются только на русском — это юридический текст под
    // конкретную юрисдикцию (152-ФЗ, самозанятость), переводить нечего;
    // переведена только подпись ссылки, чтобы EN-посетитель понимал, куда идёт
    'footer.privacy': 'Privacy Policy',
    'footer.oferta': 'Public Offer',
  },
};
