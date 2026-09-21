# Пример Markdown-главы

Короткий фрагмент, чтобы проверить, что MD и canvas собираются одним конвейером.

```mermaid
flowchart LR
  md[Markdown] --> html[HTML]
  canvas[Canvas TSX] --> ssr[React SSR]
  html --> pdf[PDF]
  ssr --> pdf
```

| Источник | Как попадает в PDF |
|---|---|
| `.md` | marked + mermaid |
| `.canvas.tsx` | esbuild + runtime `cursor/canvas` |
