import type { OrderStatus } from '@/lib/db';
import type { OrderSort } from '@/lib/admin/orders';

export const adminStrings = {
  brand: 'Print 8',
  admin: 'Админ',
  dashboard: 'Контролна табла',
  orders: 'Нарачки',
  designs: 'Печат дизајни',
  productDesigns: 'Дизајни за производи',
  ordering: {
    nav: 'Редослед',
    title: 'Редослед на приказ',
    subtitle:
      'Поставете кој производ или дизајн се прикажува прв во каталогот. Потребни миграции: add-display-order.sql и add-print-design-display-order.sql.',
    tabProducts: 'Производи',
    tabMerchDesigns: 'Дизајни за производи',
    tabPrintDesigns: 'Печатени дизајни',
    productsHelp:
      'Редоследот важи за листи на производи (категории, прилагодување, типови). Пребарајте и поставете прв, или влечете редови. Потоа Зачувај.',
    merchDesignsHelp:
      'Редоследот важи за готови дизајни на маици, дуксери и сл. (архиви, колекции). Филтрирајте по колекција, пребарајте и поставете прв, или влечете редови.',
    printDesignsHelp:
      'Редоследот важи за печатени дизајни (визитници, свадби, менија, родендени). Филтрирајте по категорија, пребарајте и поставете прв, или влечете редови.',
    collectionFilter: 'Колекција',
    allCollections: 'Сите колекции',
    categoryFilter: 'Категорија',
    allCategories: 'Сите категории',
    searchLabel: 'Пребарај и постави прв',
    searchPlaceholder: 'ID или име…',
    searchNoResults: 'Нема резултати.',
    setFirst: 'Постави прв',
    setFirstDone: (title: string) =>
      `„${title}“ е поставен како #1. Зачувајте за да се примени.`,
    alreadyFirst: 'Веќе е прв.',
    dragHint: 'Влечете го рачката за преуредување.',
    visibleCount: (n: number) =>
      n === 1 ? 'Прикажан 1 дизајн' : `Прикажани ${n} дизајни`,
    empty: 'Нема ставки за овој филтер.',
    moveUp: 'Горе',
    moveDown: 'Долу',
    dragHandle: 'Влечи за преуредување',
    saveProducts: 'Зачувај редослед на производи',
    saveMerchDesigns: 'Зачувај редослед на дизајни за производи',
    savePrintDesigns: 'Зачувај редослед на печатени дизајни',
    saving: 'Се зачувува…',
    productsSaved: 'Редоследот на производи е зачуван.',
    merchDesignsSaved: 'Редоследот на дизајни за производи е зачуван.',
    printDesignsSaved: 'Редоследот на печатени дизајни е зачуван.',
    saveError: 'Неуспешно зачувување на редоследот.',
  },
  content: 'Содржина',
  messages: 'Пораки',
  newsletter: {
    nav: 'Билтен',
    title: 'Билтен',
    subtitle:
      'Изберете готов шаблон, уредете ја пораката и испратете до претплатниците.',
    activeCount: 'Активни претплатници',
    unsubscribedCount: 'Откажани',
    composeTitle: 'Нова порака',
    template: 'Готови шаблони',
    templateCustom: 'Празна порака',
    templateHelp:
      'Кликнете шаблон за да се пополни МК и EN. Потоа уредете што сакате — секој претплатник ја добива верзијата според својот јазик.',
    previewTitle: 'Преглед (МК)',
    previewEmpty: 'Изберете шаблон или внесете наслов за преглед.',
    localeMk: 'Македонски (примарно)',
    localeEn: 'English (за EN претплатници)',
    subject: 'Наслов (subject)',
    headline: 'Наслов во е-маилот',
    emailSubtitle: 'Поднаслов',
    body: 'Содржина',
    bodyPlaceholder: 'Напишете ја пораката. Празна линија = нов пасус.',
    bodyEnPlaceholder: 'Optional English body. Falls back to MK if empty.',
    ctaLabel: 'CTA копче (MK)',
    ctaLabelEn: 'CTA button (EN)',
    ctaPath: 'CTA патека (пр. /products)',
    send: 'Испрати до сите',
    confirmSend: 'Испрати до {count} претплатници?',
    sendSuccess: 'Испратено: {sent}. Неуспешни: {failed}.',
    sendError: 'Неуспешно испраќање на билтенот.',
    loadError:
      'Не може да се вчитаат претплатниците. Проверете дали е извршена миграцијата add-newsletter-subscribers.sql.',
    listTitle: 'Претплатници',
    loading: 'Се вчитува…',
    empty: 'Нема претплатници.',
    statusActive: 'Активен',
    statusUnsubscribed: 'Откажан',
  },
  coupons: {
    nav: 'Купони',
    title: 'Купони',
    subtitle:
      'Јавни кодови за сајтот и награди по нарачка (пр. 3000+ МКД → 500 МКД купон). Потребна е миграцијата add-coupons.sql.',
    createTitle: 'Нов јавен купон',
    code: 'Код',
    discount: 'Попуст (МКД)',
    minOrder: 'Минимална нарачка (МКД)',
    maxPerDay: 'Макс. по ден',
    maxTotal: 'Макс. вкупно',
    endsAt: 'Важи до',
    unlimited: 'Без лимит',
    create: 'Креирај купон',
    created: 'Купонот е креиран.',
    listTitle: 'Сите купони',
    loading: 'Се вчитува…',
    empty: 'Нема купони.',
    usedToday: 'Денес',
    usedTotal: 'Вкупно',
    activate: 'Активирај',
    deactivate: 'Деактивирај',
    inactive: 'Неактивен',
    rewardKind: 'Награда',
    delete: 'Избриши',
    tiersTitle: 'Награди по потрошувачка',
    tiersHelp:
      'После нарачка над прагот, клиентот добива уникатен еднократен купон на е-пошта.',
    tierMinSpend: 'Минимална потрошувачка',
    tierReward: 'Награда (МКД)',
    tierRewardMin: 'Мин. за користење на наградата',
    tierDays: 'Важност (денови)',
    saveTier: 'Зачувај праг',
    tierSaved: 'Прагот е зачуван.',
    tierLine: 'Над {spend} МКД → купон {reward} МКД ({days} дена)',
    confirmDeleteTier: 'Избриши го овој праг?',
    loadError:
      'Не може да се вчитаат купоните. Проверете дали е извршена миграцијата add-coupons.sql.',
    saveError: 'Неуспешно зачувување.',
    spinsTitle: 'Тркало на награди — последни игри',
    spinsHelp:
      'Една игра по е-пошта. Кодовите се генерираат автоматски (P8W-…). Потребна е миграцијата add-spin-wheel.sql.',
    spinsEmpty: 'Нема игри сè уште.',
    spinsEmail: 'Е-пошта',
    spinsPrize: 'Награда',
    spinsCode: 'Код',
    spinsDate: 'Датум',
    spinsTryAgain: 'Обиди се',
    spinsLoadError: 'Не може да се вчитаат игрите (проверете add-spin-wheel.sql).',
  },
  viewWebsite: 'Види го сајтот',
  logout: 'Одјава',
  login: {
    title: 'Најава за админ',
    subtitle: 'Најавете се за да управувате со нарачки и метрики.',
    username: 'Корисничко име',
    password: 'Лозинка',
    submit: 'Најави се',
    submitting: 'Се најавува…',
    notConfigured:
      'Админ податоците не се конфигурирани. Поставете ADMIN_USERNAME, ADMIN_PASSWORD и ADMIN_SESSION_SECRET во .env.local.',
    loading: 'Се вчитува…',
    failed: 'Најавата не успеа.',
    serverError: 'Не може да се поврзе со серверот. Обидете се повторно.',
  },
  dashboardPage: {
    title: 'Контролна табла',
    subtitle: 'Нарачки, приход и собраќај на сајтот.',
    allOrders: 'Сите нарачки →',
    trafficSection: 'Собраќај на сајтот',
    ordersSection: 'Нарачки и приход',
    pageViewsToday: 'Прегледи денес',
    pageViewsWeek: 'Прегледи (7 дена)',
    pageViewsMonth: 'Прегледи (30 дена)',
    pageViewsAll: 'Сите прегледи',
    uniqueVisitors: (n: number) => `${n} уникатни посетители`,
    topPages: 'Најпосетувани страници (7 дена)',
    showAllPages: (n: number) => `Прикажи ги сите (+${n})`,
    showLessPages: 'Прикажи помалку',
    noTraffic:
      'Сè уште нема забележан собраќај. Прегледите се појавуваат кога посетителите ја користат страницата.',
    trafficByLocale: 'Собраќај по јазик',
    other: 'Друго',
    totalOrders: 'Вкупно нарачки',
    revenue: 'Приход (без откажани)',
    thisMonth: 'Овој месец',
    averageOrder: 'Просечна нарачка',
    ordersCount: (n: number) => `${n} нарачки`,
    ordersByStatus: 'Нарачки по статус',
    ordersToday: 'Нарачки денес',
    ordersWeek: 'Нарачки (7 дена)',
    ordersByLocale: 'Нарачки по јазик',
    recentOrders: 'Последни нарачки',
    activeOrders: (n: number) => `${n} активни`,
    noOrders: 'Сè уште нема нарачки.',
  },
  ordersPage: {
    title: 'Нарачки',
    shown: (n: number) =>
      n === 1 ? 'Прикажана 1 нарачка' : `Прикажани ${n} нарачки`,
    loading: 'Се вчитуваат нарачките…',
  },
  contactMessages: {
    title: 'Пораки од контакт',
    subtitle: 'Пораки испратени преку контакт-формата на сајтот.',
    empty: 'Нема пораки за овој филтер.',
    loadError:
      'Не може да се вчитаат пораките. Проверете дали е извршена миграцијата add-contact-messages-and-fulfillment.sql во Supabase.',
    allStatuses: 'Сите',
    statusNew: 'Нови',
    statusRead: 'Прочитани',
    statusArchived: 'Архива',
    markRead: 'Означи прочитана',
    markNew: 'Означи како нова',
    archive: 'Архивирај',
    status: {
      new: 'Нова',
      read: 'Прочитана',
      archived: 'Архивирана',
    },
  },
  ordersTable: {
    search: 'Пребарај',
    searchPlaceholder: 'Број, име, телефон, е-пошта, град…',
    status: 'Статус',
    allStatuses: 'Сите статуси',
    sortBy: 'Подреди по',
    apply: 'Примени',
    order: 'Нарачка',
    customer: 'Клиент',
    items: 'Артикли',
    total: 'Вкупно',
    date: 'Датум',
    empty: 'Нема нарачки што одговараат на филтрите.',
    itemCount: (n: number) => (n === 1 ? '1 артикл' : `${n} артикли`),
  },
  orderDetail: {
    back: '← Назад кон нарачки',
    placed: 'Направена',
    items: 'Артикли',
    frontPreview: 'Преден преглед',
    backPreview: 'Заден преглед',
    leftPreview: 'Лев преглед',
    rightPreview: 'Десен преглед',
    uploadedFiles: 'Прикачени датотеки',
    customer: 'Клиент',
    name: 'Име',
    phone: 'Телефон',
    email: 'Е-пошта',
    city: 'Град',
    address: 'Адреса',
    fulfillment: 'Начин на преземање',
    fulfillmentCargo: 'Испорака по карго',
    fulfillmentPickup: 'Подигнување во салон',
    notes: 'Белешки',
    details: 'Детали',
    payment: 'Плаќање',
    locale: 'Јазик',
    total: 'Вкупно',
    advancedInfo: 'Напредни информации',
    printReadySvg: 'SVG за печатење',
    printReadySvgHint: 'Преземете ги овие SVG датотеки и печатете ги директно — исти се како што ги прилагодил клиентот.',
    printReadyPngLabel: 'PNG за печатење',
    printReadyPngHint: 'Производни PNG датотеки — само дизајнот (без мајка), исечен на печатната зона.',
    premadeMasterLabel: 'Оригинален дизајн',
    premadeMasterHint:
      'Оригинална датотека од cloud складиштето. За печатење ја користите оваа датотека, а големина и позиција ги одредувате според прегледот на маицата погоре. Текстот (ако има) додајте го рачно според прегледот.',
    premadeMasterOriginalOnly:
      'Само поместување / големина — оригиналот е доволен за печат',
    premadeMasterProductionNote:
      'Печатење од оригинал + преглед на маицата (без автоматски PNG)',
    previewMockupSuffix: 'преглед',
    textLayersTitle: 'Текст на дизајнот',
    textLayerLabel: 'Текст {index}',
    textLayerFont: 'Фонт',
    textLayerColor: 'Боја',
    textLayerSize: 'Големина',
    textLayerPosition: 'Позиција',
    designAssetsTitle: 'Дизајн за печатење',
    itemPosition: 'Артикл {current} / {total}',
    downloadPreview: 'Преземи',
    downloadFrontSvg: 'Преземи предна страна (.svg)',
    downloadBackSvg: 'Преземи задна страна (.svg)',
    statusTitle: 'Статус на нарачка',
    saveStatus: 'Зачувај статус',
    saving: 'Се зачувува…',
    markDelivered: 'Означи испорачана',
    cancelOrder: 'Откажи нарачка',
    statusUpdated: 'Статусот е ажуриран.',
    statusFailed: 'Неуспешно ажурирање на статусот.',
    statusError: 'Не може да се ажурира статусот.',
  },
  sort: {
    newest: 'Најнови прво',
    oldest: 'Најстари прво',
    amount_high: 'Највисок износ',
    amount_low: 'Најнизок износ',
  } satisfies Record<OrderSort, string>,
  status: {
    pending: 'На чекање',
    confirmed: 'Потврдена',
    printing: 'Печати се',
    ready: 'Подготвена',
    delivered: 'Испорачана',
    cancelled: 'Откажана',
  } satisfies Record<OrderStatus, string>,
  itemType: {
    service: 'услуга',
    design: 'дизајн',
    product: 'производ',
  },
} as const;

export function formatAdminDate(
  value: string,
  style: 'short' | 'long' = 'short',
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  // Manual pattern — Node SSR and browsers format mk-MK differently (hydration mismatch).
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (style === 'long') {
    return `${day}.${month}.${year}. г., ${hours}:${minutes}:${seconds}`;
  }

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function getOrderStatusLabel(status: OrderStatus) {
  return adminStrings.status[status];
}

export function getSortLabel(sort: OrderSort) {
  return adminStrings.sort[sort];
}
