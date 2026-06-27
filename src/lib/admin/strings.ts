import type { OrderStatus } from '@/lib/db';
import type { OrderSort } from '@/lib/admin/orders';

export const adminStrings = {
  brand: 'Print 8',
  admin: 'Админ',
  dashboard: 'Контролна табла',
  orders: 'Нарачки',
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
    notes: 'Белешки',
    details: 'Детали',
    payment: 'Плаќање',
    locale: 'Јазик',
    total: 'Вкупно',
    advancedInfo: 'Напредни информации',
    printReadySvg: 'SVG за печатење',
    printReadySvgHint: 'Преземете ги овие SVG датотеки и печатете ги директно — исти се како што ги прилагодил клиентот.',
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
) {
  return new Intl.DateTimeFormat('mk-MK', {
    dateStyle: style === 'long' ? 'full' : 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getOrderStatusLabel(status: OrderStatus) {
  return adminStrings.status[status];
}

export function getSortLabel(sort: OrderSort) {
  return adminStrings.sort[sort];
}
