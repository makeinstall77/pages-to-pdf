import {
  BarChart,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  Grid,
  H1,
  H2,
  PieChart,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
} from "cursor/canvas";

export default function SampleReport() {
  return (
    <Stack gap={16}>
      <Stack gap={6}>
        <H1>Пример canvas для PDF</H1>
        <Text tone="secondary">
          Проверка рендера примитивов <Code>cursor/canvas</Code> в печатный документ.
        </Text>
      </Stack>

      <Callout tone="info" title="Зачем этот файл">
        Фикстура конвертера pages-to-pdf: карточки, таблица, графики и метрики должны
        попасть в A4 без интерактивного хоста Cursor.
      </Callout>

      <Grid columns={3} gap={12}>
        <Stat value="12" label="Критично" tone="danger" />
        <Stat value="5" label="Высокий" tone="warning" />
        <Stat value="9" label="Закрыто" tone="success" />
      </Grid>

      <Row gap={8} wrap>
        <Pill active>Все 26</Pill>
        <Pill>Критично 12</Pill>
        <Pill>Высокий 5</Pill>
      </Row>

      <Card>
        <CardHeader trailing={<Pill active>ok</Pill>}>
          src/runtime/index.js
        </CardHeader>
        <CardBody>
          <Text>
            Runtime подменяет импорт <Code>cursor/canvas</Code> при сборке esbuild
            и рисует светлую печатную тему.
          </Text>
        </CardBody>
      </Card>

      <H2>Распределение находок</H2>
      <Grid columns={2} gap={16}>
        <BarChart
          height={180}
          categories={["Auth", "ACL", "UI", "Data"]}
          series={[{ name: "Находки", data: [8, 4, 3, 7] }]}
          showValues
        />
        <PieChart
          donut
          data={[
            { label: "Критично", value: 12, tone: "danger" },
            { label: "Высокий", value: 5, tone: "warning" },
            { label: "Закрыто", value: 9, tone: "success" },
          ]}
        />
      </Grid>

      <Table
        headers={["ID", "Серьёзность", "Суть"]}
        striped
        rowTone={["danger", "warning", "success"]}
        rows={[
          ["S1", "Критично", "Canvas рендерится без IDE-хоста"],
          ["S2", "Высокий", "Графики печатаются как SVG"],
          ["S3", "Ок", "Markdown-главы по-прежнему в том же PDF"],
        ]}
      />
    </Stack>
  );
}
