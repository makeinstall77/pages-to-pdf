# pages-to-pdf

Сборка Markdown-страниц и Cursor Canvas (`.canvas.tsx`) в один PDF. Диаграммы Mermaid рисуются как картинки, canvas рендерится через HTML-runtime примитивов `cursor/canvas`.

Нужны Node.js 18+ и Google Chrome или Microsoft Edge.

```bash
npm install
```

## Markdown-папка

```bash
node src/build-pdf.js --src "C:\path\to\markdown-folder"
```

По умолчанию PDF пишется рядом с исходниками: `<папка>/<имя-папки>.pdf`.

## Один canvas

```bash
node src/build-pdf.js --src "C:\path\to\report.canvas.tsx"
```

PDF рядом с файлом: `report.pdf`. Для одного canvas обложка не добавляется (у canvas уже есть `H1`). Принудительно: `--cover`.

## Папка со смешанными главами

В корне (без рекурсии) берутся `*.md` и `*.canvas.tsx`:

1. `README.md`
2. файлы, имя которых начинается с цифры
3. остальные по алфавиту

```bash
node src/build-pdf.js --src "C:\path\to\pages" --title "Отчёт" --kicker "Проект" --lead "Кратко"
```

## Обложка и тема

```bash
node src/build-pdf.js --src "<папка-или-файл>" --out "<файл.pdf>" --title "…" --kicker "…" --lead "…" --footer "…" --theme light
```

`--theme dark` — тёмная тема canvas (для бумаги лучше `light`, это значение по умолчанию).  
`--no-cover` / `--cover` — выключить или включить обложку с содержанием.

Пресет:

```bash
node src/build-pdf.js --config presets/onboarding.json
```

## Повторный запуск

При первом запуске в `vendor/` скачивается `mermaid.min.js` (в git не кладётся). Дальше сборка идёт офлайн, пока файл на месте.
