# FOUNDATIONS AUDIT

Источник: COMETAL 2.0  
Figma: https://www.figma.com/design/wt7rhRt3u2xq4t2ajUZ90R/COMETAL--2.0-18.06

Область анализа: только foundations — цвета, типографика, отступы, радиусы, тени, иконки.

Не анализировались: бизнес-процессы, доменная архитектура, смысл экранов, пользовательские сценарии.

## Методика

Через Figma MCP были проверены:

- список страниц файла;
- фактическое использование визуальных свойств на крупных страницах:
  - `КОМПОНЕНТЫ КОНТУР` — 11 861 узел;
  - `✅ Навигационное меню` — 11 432 узла;
  - `Канбан оплат` — 9 000 узлов, sampling cap reached;
  - `Карточка компании` — 9 000 узлов, sampling cap reached.

Попытка прочитать весь файл и локальные variables/styles целиком через `use_figma` завершилась timeout на стороне MCP. Поэтому частоты ниже — это **usage-аудит по фактическим значениям**, а не полный список Figma Variables.

## Summary

| Foundation | Статус | Ключевой вывод |
|---|---|---|
| Colors | Есть фактическая палитра, но требуется нормализация | Часто используются `#292929`, `#7A8694`, `#FFFFFF`, `#0041A0`, `#F3F6FB`, `#D6DEE7`, `#9FA8B3`. Есть дубли и близкие оттенки. |
| Typography | Есть устойчивая типографическая база | Основной шрифт — `Grtsk Peta`; вспомогательно используются `Golos Text`, `Inter`, `Plus Jakarta Sans`, `Roboto`, `Arial`. |
| Spacing | Есть повторяемая шкала | Основные значения: `4`, `8`, `10`, `12`, `16`, `20`, `24`. Есть шумовые значения: `7`, `17`, `18`, `29`, `38`, `94`, `100`, `197`, `208`. |
| Radius | Есть повторяемые радиусы, но много дублей pill-значений | Основные: `4`, `8`, `12`, `16`, `20`, `24`; pill представлен как `99`, `999`, `9999`, `5000`. |
| Shadows | Есть набор теней, но нет единой elevation шкалы | Тени используют разные цвета и параметры: `#000000`, `#28303C`, blur `2`, `4`, `8`, `16`, `20`. |
| Icons | Иконки активно используются, но naming не нормализован | Есть `icons/action/*`, `icons/arrows/*`, `icons/documents/*`, `icons/segment/*`, но много raw `Vector`, `Path`, `Shape`. |

## Colors

### Найденные значения

Наиболее частые fill colors по MCP sampling:

| Цвет | Частота в сэмпле | Роль-кандидат |
|---|---:|---|
| `#292929` | 4 821 | `text/primary` |
| `#7A8694` | 3 064 | `text/secondary`, `icon/secondary` |
| `#FFFFFF` | 2 721 | `surface/default`, `text/inverse` |
| `#0041A0` | 1 843 | `brand/primary`, `action/primary` |
| `#9FA8B3` | 1 042 | `text/tertiary`, `icon/muted`, `border/secondary` |
| `#F3F6FB` | 580 | `surface/subtle`, `background/subtle` |
| `#002F6C` | 354+ | `brand/dark`, `action/active` |
| `#D6DEE7` | 177+ fills / 1 135+ strokes | `border/default` |
| `#DEDEDE` | 288+ fills / 261+ strokes | `border/neutral`, duplicate candidate |
| `#111111` | 304+ | `text/strong`, duplicate candidate of `#292929` |
| `#27AE60` | 203+ | `status/success` |
| `#08823B` | 157+ | `status/success/strong` |
| `#BF1D26` | 140+ | `status/danger` |
| `#E11111` | 40+ fills / 31+ strokes | `status/danger`, duplicate candidate |
| `#FF0000` | 685+ | Debug/error/attention, likely not normalized |
| `#E79600` | 35+ | `status/warning` |
| `#FFDCBF` | 34+ | `status/warning/subtle` |
| `#DCF4DD` | 112+ | `status/success/subtle` |
| `#CDE3FF` | 86+ | `brand/subtle`, `info/subtle` |
| `#E3E8EF` | 248+ strokes | `border/subtle` |

### Частота использования

Главная цветовая ось:

- `#292929` — доминирующий темный текст.
- `#7A8694` — доминирующий secondary/muted.
- `#FFFFFF` — доминирующая surface.
- `#0041A0` — основной brand/action blue.
- `#D6DEE7`, `#E3E8EF`, `#DEDEDE` — border family.

### Дубли

| Группа | Дублирующиеся / близкие значения | Рекомендация |
|---|---|---|
| Dark text | `#292929`, `#111111`, `#000000` | Оставить `text/primary = #292929`, `text/strong = #111111`, `black` использовать только технически. |
| Muted text/icon | `#7A8694`, `#9FA8B3`, `#6F7172`, `#434A56` | Развести на `text/secondary`, `text/tertiary`, `icon/default`, `icon/muted`. |
| Borders | `#D6DEE7`, `#E3E8EF`, `#DEDEDE`, `#EFF2F7`, `#F0F0F0` | Свести к 3 уровням: `border/default`, `border/subtle`, `border/strong`. |
| Brand blue | `#0041A0`, `#002F6C`, `#005BD1`, `#2A64FB`, `#368DFF` | Создать шкалу `brand/blue/700`, `600`, `500`, `400`. |
| Danger | `#BF1D26`, `#E11111`, `#DC3737`, `#FF0000` | `#FF0000` убрать из production tokens или оставить как debug. |
| Success | `#27AE60`, `#1DBF61`, `#08823B`, `#13B81A` | Свести к `success/default`, `success/strong`, `success/subtle`. |

### Отсутствующие tokens

- `background/page`
- `surface/default`
- `surface/subtle`
- `surface/raised`
- `text/primary`
- `text/secondary`
- `text/tertiary`
- `text/inverse`
- `border/default`
- `border/subtle`
- `border/focus`
- `brand/primary`
- `brand/hover`
- `brand/active`
- `status/success/default`
- `status/warning/default`
- `status/danger/default`
- `status/info/default`

### Рекомендации по нормализации

1. Создать semantic layer поверх raw colors.
2. Разделить tokens на `primitive` и `semantic`.
3. Убрать прямое использование `#FF0000` из production UI.
4. Нормализовать border colors до 3-4 уровней.
5. Привязать status colors к единой модели статусов.

## Typography

### Найденные значения

Основные font families / weights:

| Шрифт | Частота в сэмпле | Комментарий |
|---|---:|---|
| `Grtsk Peta Regular` | 5 620 | Основной текстовый стиль. |
| `Grtsk Peta Medium` | 1 651 | Акценты, labels, controls. |
| `Grtsk Peta Semibold` | 680 | Заголовки/акцентные элементы. |
| `Golos Text Regular` | 316 | Вторичный или legacy шрифт. |
| `Grtsk Peta Bold` | 40+ | Редкий акцент. |
| `Inter Regular` | 25+ | Legacy / imported fragments. |
| `Plus Jakarta Sans Medium/SemiBold` | 43+ | Legacy / imported fragments. |
| `Roboto`, `Arial` | 10+ | Вероятно, legacy/imported fragments. |

Font sizes:

| Size | Частота в сэмпле | Роль-кандидат |
|---|---:|---|
| `14` | 2 680 | `body/md`, table text |
| `12` | 2 494 | `caption`, compact controls |
| `13` | 1 844 | `body/sm`, dense UI |
| `11` | 486 | helper / microcopy |
| `16` | 420 | body/lg / section text |
| `10` | 261 | micro labels |
| `20` | 51+ | title/sm |
| `24` | 7+ | title/md |

Line heights:

| Line height | Частота в сэмпле | Роль-кандидат |
|---|---:|---|
| `20px` | 2 789 | body/md |
| `16px` | 2 220 | compact body / caption |
| `18px` | 1 308 | body/sm |
| `13px` | 443 | dense labels |
| `14px` | 294+ | compact text |
| `24px` | 218+ | body/lg / title-sm |
| `AUTO` | 206+ | Not normalized |
| `140%`, `150%`, `103%`, `100%` | Low/fragmented | Mixed legacy behavior |

### Частота использования

Типографика фактически строится вокруг `Grtsk Peta` с размерами `12`, `13`, `14`, `16` и line-height `16`, `18`, `20`, `24`.

### Дубли

| Группа | Дубли | Рекомендация |
|---|---|---|
| Body small | `12`, `13`, `14` | Явно развести: `caption`, `body/sm`, `body/md`. |
| Imported fonts | `Inter`, `Plus Jakarta Sans`, `Roboto`, `Arial` | Проверить источник; если нет причины, заменить на `Grtsk Peta`. |
| Line height | `AUTO`, `%`, px values mixed | Зафиксировать px-based text styles или строго заданные percentages. |
| Weight naming | Regular / Medium / Semibold / Bold | Создать named styles, не использовать raw font weight напрямую. |

### Отсутствующие tokens

- `font/family/base`
- `font/family/legacy`
- `text/body/sm`
- `text/body/md`
- `text/body/lg`
- `text/caption`
- `text/helper`
- `text/table`
- `text/control`
- `text/title/sm`
- `text/title/md`
- `text/section`

### Рекомендации по нормализации

1. Назначить `Grtsk Peta` основным системным шрифтом.
2. Оставить `Golos Text` только если у него есть явная роль.
3. Удалить/заменить случайные `Inter`, `Roboto`, `Arial`, `Plus Jakarta Sans`.
4. Собрать text styles:
   - `caption/11-16`
   - `body/sm/12-16`
   - `body/md/14-20`
   - `body/lg/16-24`
   - `title/sm/20-24`
   - `title/md/24-28`
5. Убрать `AUTO` line-height из production styles.

## Spacing

### Найденные значения

Item spacing:

| Spacing | Частота в сэмпле | Роль-кандидат |
|---|---:|---|
| `0` | 11 503 | No gap / reset |
| `8` | 3 885 | `space/8`, базовый gap |
| `4` | 2 988 | `space/4`, compact gap |
| `10` | 2 549 | Duplicate candidate |
| `6` | 490 | Duplicate candidate |
| `12` | 357 | `space/12` |
| `16` | 282 | `space/16` |
| `20` | 242 | `space/20` |
| `24` | 66+ | `space/24` |

Padding:

| Padding | Частота в сэмпле | Роль-кандидат |
|---|---:|---|
| `0` | 75 940 | No padding / reset |
| `8` | 5 318 | `space/8` |
| `12` | 2 915 | `space/12` |
| `16` | 2 223 | `space/16` |
| `4` | 1 564 | `space/4` |
| `10` | 1 207 | Duplicate candidate |
| `20` | 652 | `space/20` |
| `24` | 158 | `space/24` |
| `2` | 1 093 | `space/2`, micro spacing |
| `6` | 812 | Duplicate candidate |

### Частота использования

Фактическая spacing-шкала уже есть: `2`, `4`, `8`, `12`, `16`, `20`, `24`.

Но значения `6`, `10`, `7`, `17`, `18`, `29`, `38`, `94`, `100`, `197`, `208` выглядят как локальные или layout-specific exceptions.

### Дубли

| Группа | Дубли | Рекомендация |
|---|---|---|
| Compact spacing | `4`, `5`, `6`, `7` | Оставить `4` и `8`; `6` разрешить только для control internals, если нужно. |
| Medium spacing | `8`, `10`, `12` | Основной шаг `8`; `10` заменить на `8` или `12`. |
| Section spacing | `16`, `20`, `24` | Оставить все три, но задать назначение. |
| Large/local values | `94`, `100`, `197`, `208` | Не делать foundation tokens; оставить как layout-specific. |

### Отсутствующие tokens

- `space/0`
- `space/2`
- `space/4`
- `space/8`
- `space/12`
- `space/16`
- `space/20`
- `space/24`
- `space/32`
- `space/40`
- `gap/control`
- `gap/list`
- `gap/card`
- `padding/control`
- `padding/card`
- `padding/page`

### Рекомендации по нормализации

1. Базовую шкалу сделать кратной 4: `0`, `2`, `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`.
2. `10` заменить на semantic token только если это системная высота/внутренний gap controls.
3. Значения `94`, `100`, `197`, `208` не включать в foundations.
4. Разделить tokens для `gap` и `padding`, даже если primitive values общие.

## Radius

### Найденные значения

| Radius | Частота в сэмпле | Роль-кандидат |
|---|---:|---|
| `0` | 26 945 | No radius |
| `9999` | 1 498 | Pill / fully rounded |
| `8` | 1 116 | `radius/md`, основной radius карточек/controls |
| `99` | 585 | Pill duplicate |
| `4` | 465 | `radius/sm` |
| `12` | 306 | `radius/lg` |
| `20` | 156 | `radius/xl` |
| `999` | 66+ | Pill duplicate |
| `24` | 59 | `radius/2xl` or modal/card large |
| `16` | 38 | `radius/xl` duplicate candidate |
| `5000` | 10 | Pill duplicate |

### Частота использования

Основные production radii:

- `4`
- `8`
- `12`
- `16`
- `20`
- `24`
- pill radius

### Дубли

| Группа | Дубли | Рекомендация |
|---|---|---|
| Pill | `99`, `999`, `9999`, `5000` | Оставить один semantic token: `radius/pill = 9999`. |
| Medium radius | `7`, `8` | Оставить `8`. |
| Large radius | `16`, `20`, `24` | Развести назначения или сократить до `16` и `24`. |
| Local odd values | `44`, `58`, `81`, `100` | Не включать в foundation; проверить, не являются ли артефактами SVG/legacy. |

### Отсутствующие tokens

- `radius/none = 0`
- `radius/xs = 2`
- `radius/sm = 4`
- `radius/md = 8`
- `radius/lg = 12`
- `radius/xl = 16`
- `radius/2xl = 24`
- `radius/pill = 9999`

### Рекомендации по нормализации

1. Унифицировать pill radius.
2. Назначить `8` базовым radius для cards/controls.
3. Использовать `4` для compact controls и inner elements.
4. Использовать `12/16/24` только для крупных containers/modals.
5. Исключить случайные значения из foundations.

## Shadows

### Найденные значения

| Shadow | Частота в сэмпле | Роль-кандидат |
|---|---:|---|
| `DROP_SHADOW 0,4,8 #000000/0.14` | 8+ | `shadow/md` |
| `DROP_SHADOW 0,4,2 #000000/0.12` | 8+ | Duplicate / not ideal |
| `DROP_SHADOW 0,0,2 #000000/0.12` | 9 | `shadow/xs` |
| `DROP_SHADOW 0,8,16 #000000/0.14` | 6 | `shadow/lg` |
| `DROP_SHADOW 0,1,2 #000000/0.14` | 3 | `shadow/sm` |
| `DROP_SHADOW 0,1,2 -1 #28303C/0.1` | 6 | `shadow/sm` alternative |
| `DROP_SHADOW 0,1,4 1 #28303C/0.1` | 6 | `shadow/md` alternative |
| `DROP_SHADOW 0,0,20 #000000/0.15` | 4 | Overlay / modal |
| `DROP_SHADOW 0,0,8 #000000/0.25` | 2 | Strong overlay / legacy |

### Частота использования

Тени используются заметно реже, чем цвета, типографика, spacing и radius. Встречаются две цветовые базы:

- `#000000` с opacity `0.10-0.25`;
- `#28303C` с opacity `0.04-0.10`.

### Дубли

| Группа | Дубли | Рекомендация |
|---|---|---|
| Small shadow | `0,1,2 #000/0.14`, `0,1,2 -1 #28303C/0.1` | Выбрать одну базу цвета и одну геометрию. |
| Medium shadow | `0,4,8 #000/0.14`, `0,1,4 #28303C/0.1` | Развести по elevation levels. |
| Overlay shadow | `0,0,20 #000/0.15`, `0,0,8 #000/0.25` | Оставить один modal/popover shadow. |
| Odd blur/spread | `0,4,2`, `1,2,2` | Проверить, вероятно legacy/manual shadows. |

### Отсутствующие tokens

- `shadow/none`
- `shadow/xs`
- `shadow/sm`
- `shadow/md`
- `shadow/lg`
- `shadow/overlay`
- `shadow/focus`

### Рекомендации по нормализации

1. Создать 5-level elevation scale.
2. Выбрать единый shadow color: лучше `#28303C` как semantic neutral shadow.
3. Отделить focus ring от elevation shadow.
4. Удалить odd shadows вроде `0,4,2`, если нет продуктовой причины.

## Icons

### Найденные значения

Наиболее частые icon-like nodes/components:

| Icon / node | Частота в сэмпле | Комментарий |
|---|---:|---|
| `Vector` | 4 486+ | Raw vector usage; нужно заменить на named icon components. |
| `Path` | 2 055+ | Raw vector/path usage; не является нормализованной иконкой. |
| `icons/action/check` | 629+ | Нормализованное имя. |
| `Icon / 16px / chevron-right-min` | 549 | Нормализовано частично, другой naming convention. |
| `icons / 16 / info` | 382 | Нормализовано частично, другой naming convention. |
| `icons/arrows/chevron-full` | 210 | Нормализованное имя. |
| `icons/action/search` | 129 | Нормализованное имя. |
| `<IconButton>` | 245+ | Компонент кнопки с иконкой. |
| `icons/action/calendar` | 110 | Нормализованное имя. |
| `icons/arrows/chevron-down` | 184+ | Нормализованное имя. |
| `icons/action/plus` | 105 | Нормализованное имя. |
| `icons/action/x` | 238+ | Нормализованное имя. |
| `icons/arrows/arrow-narrow-right` | 180+ | Нормализованное имя. |
| `icons/arrows/arrow-narrow-left` | 158+ | Нормализованное имя. |
| `icons/action/trash` | 58+ | Нормализованное имя. |
| `icons/documents/document` | 130 | Нормализованное имя. |
| `icons/documents/report-money-ruble` | 83 | Нормализованное имя. |
| `icons/segment/mtrading` | 22 | Domain/segment icon. |

### Частота использования

Иконки используются активно, особенно:

- actions: `check`, `x`, `plus`, `search`, `calendar`, `trash`;
- arrows: `chevron`, `arrow-narrow-left/right`;
- documents;
- segment/navigation icons.

### Дубли

| Группа | Дубли | Рекомендация |
|---|---|---|
| Raw vectors | `Vector`, `Path`, `Shape`, `Subtract` | Заменить на named icon components. |
| Chevron naming | `Icon / 16px / chevron-right-min`, `icons/arrows/chevron-*` | Привести к одному namespace. |
| Info icon | `icons / 16 / info`, `icons/alert/info-circle` | Развести semantic usage или объединить. |
| Navigation icons | `icons/Все заявки`, `icons/Мои заявки`, русские names | Перевести в стабильный technical naming. |
| Icon button | `<IconButton>`, standalone icons | Зафиксировать правило: action icons внутри IconButton. |

### Отсутствующие tokens / rules

- `icon/size/16`
- `icon/size/20`
- `icon/size/24`
- `icon/color/default`
- `icon/color/muted`
- `icon/color/active`
- `icon/color/danger`
- `icon/stroke/regular`
- `icon/stroke/bold`
- `icon/button/sm`
- `icon/button/md`
- единый namespace: `icons/<category>/<name>`

### Рекомендации по нормализации

1. Принять один naming convention: `icons/action/check`, `icons/arrows/chevron-down`, `icons/documents/document`.
2. Убрать raw `Vector` / `Path` как самостоятельные reusable элементы.
3. Разделить icon categories:
   - `action`
   - `arrows`
   - `documents`
   - `status`
   - `navigation`
   - `segment`
   - `user`
4. Зафиксировать sizes: `16`, `20`, `24`.
5. Цвет иконок брать из semantic color tokens, не из локальных fills.

## Foundation-токены: что уже есть

Подтверждено как фактическая foundation-база по использованию:

| Foundation | Уже есть фактически |
|---|---|
| Colors | Brand blue, neutral text, muted text/icon, white surface, borders, success/warning/danger colors. |
| Typography | Основной набор на `Grtsk Peta`, размеры `12/13/14/16`, line-height `16/18/20/24`. |
| Spacing | Повторяемая шкала `2/4/8/12/16/20/24`. |
| Radius | Повторяемые `4/8/12/16/20/24` и pill. |
| Shadows | Несколько elevation-like теней, но без единой шкалы. |
| Icons | Библиотека `icons/*` существует, но смешана с raw vectors. |

Не подтверждено из-за MCP timeout:

- полный список Figma Variables;
- полный список Local Paint Styles;
- полный список Local Text Styles;
- полный список Local Effect Styles.

## Что отсутствует как системный слой

| Foundation | Чего не хватает |
|---|---|
| Colors | Semantic layer и четкое разделение primitive/semantic. |
| Typography | Полная text-style шкала с назначениями. |
| Spacing | Официальная spacing scale и правила исключений. |
| Radius | Единая radius scale и один pill token. |
| Shadows | Elevation scale. |
| Icons | Единый namespace, sizes, color rules, замена raw vectors. |

## Priority normalization plan

| Приоритет | Что нормализовать | Почему |
|---:|---|---|
| 1 | Colors | Больше всего дублей и прямых значений; влияет на все UI. |
| 2 | Typography | `Grtsk Peta` уже доминирует, можно быстро стабилизировать styles. |
| 3 | Spacing | Шкала почти сложилась, нужно убрать шумовые значения. |
| 4 | Radius | Нужно унифицировать pill и базовые radii. |
| 5 | Icons | Много raw vectors, нужен clean icon library. |
| 6 | Shadows | Используются реже, но нужны для overlay/elevation consistency. |
