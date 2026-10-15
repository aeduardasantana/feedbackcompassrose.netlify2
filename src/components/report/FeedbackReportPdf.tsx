import {
  Circle,
  Document,
  Line,
  Page,
  Polygon,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'
import { createContext, Fragment, useContext, type ReactNode } from 'react'
import type { GrupoTabulacao, ResultadoPilar, ResultadoTabulacao } from '@/lib/tabulacao'

export interface ReportPdfMetadata {
  avaliado: string
  empresa: string
  processo: string
  codigoMatriz: string
  periodo: string
  geradoEm: string
  consultor: string
}

export interface ReportParticipation {
  group: Exclude<GrupoTabulacao, 'stakeholders'>
  planned: number
  answered: number
}

export interface FeedbackReportPdfProps {
  metadata: ReportPdfMetadata
  tabulacao: ResultadoTabulacao
  questionTexts: Record<number, string>
  participation: ReportParticipation[]
}

const colors = {
  ink: '#17312e',
  muted: '#5f6f6d',
  paper: '#ffffff',
  soft: '#f4f1e9',
  line: '#d8dfdc',
  teal: '#0f766e',
  green: '#2f6a58',
  blue: '#2563eb',
  yellow: '#d5a719',
  orange: '#dd6b20',
  cyan: '#0891b2',
  red: '#b54c45',
  slate: '#52779d',
}

const groupNames: Record<GrupoTabulacao, string> = {
  autoavaliacao: 'Autoavaliação', stakeholders: 'Stakeholders', superior: 'Superior',
  liderado: 'Liderado', par: 'Par', outro: 'Outros',
}
const groupColors: Record<GrupoTabulacao, string> = {
  autoavaliacao: colors.blue, stakeholders: colors.teal, superior: colors.yellow,
  liderado: '#16a34a', par: colors.orange, outro: colors.cyan,
}
const classifications: Record<string, readonly { letter: string; name: string; questions: readonly number[] }[]> = {
  estrategia: [
    { letter: 'A', name: 'Planejamento', questions: [1, 2] }, { letter: 'B', name: 'Execução', questions: [3, 4] },
    { letter: 'C', name: 'Conhecimento', questions: [5, 6] }, { letter: 'D', name: 'Objetivos e Metas', questions: [7, 8] },
  ],
  comprometimento: [
    { letter: 'E', name: 'Dedicação', questions: [9, 10] }, { letter: 'F', name: 'Paixão', questions: [11, 12] },
    { letter: 'G', name: 'Sacrifício', questions: [13, 14] }, { letter: 'H', name: 'Resiliência', questions: [15, 16] },
  ],
  gestao: [
    { letter: 'I', name: 'Motivar', questions: [17, 18] }, { letter: 'J', name: 'Desenvolver', questions: [19, 20] },
    { letter: 'K', name: 'Reconhecer', questions: [21, 22] }, { letter: 'L', name: 'Inspirar', questions: [23, 24] },
  ],
  credibilidade: [
    { letter: 'M', name: 'Valores', questions: [25, 26] }, { letter: 'N', name: 'Justiça', questions: [27, 28] },
    { letter: 'O', name: 'Integridade', questions: [29, 30] }, { letter: 'P', name: 'Congruência', questions: [31, 32] },
  ],
}
const pillarDescriptions: Record<string, string> = {
  estrategia: 'Na Estratégia, é possível identificar como você elabora e executa planos, levando em consideração seus conhecimentos técnicos, habilidade de aprendizado, bem como sua objetividade na definição de metas.',
  comprometimento: 'No Comprometimento, observamos o grau de dedicação, paixão, sacrifício ou cumprimento de obrigações, demonstrando seu envolvimento. Também avaliamos sua capacidade de resiliência, aproveitando ao máximo aspectos positivos em diversas situações.',
  gestao: 'Na Gestão, avaliamos suas capacidades de motivar, inspirar, promover o desenvolvimento e reconhecer colaboradores e equipes.',
  credibilidade: 'Na Credibilidade, observamos seus princípios, sua equidade, integridade em momentos difíceis e consistência.',
}

const introductionParagraphs = [
  'É com grande satisfação que apresentamos o sistema Feedback Compass Rose, uma iniciativa que visa proporcionar uma avaliação abrangente e profunda de suas habilidades de liderança.',
  'Nosso sistema é fundamentado de forma personalizada às necessidades do cliente. Nesta aplicação há quatro pilares essenciais da liderança: Estratégia, Comprometimento, Gestão e Credibilidade.',
  'Através do Feedback Compass Rose, você terá a oportunidade de obter uma visão abrangente e aprofundada sobre sua liderança. Nossa abordagem envolve a coleta de feedback não apenas de seus gestores e liderados, mas também de outros colaboradores da organização, proporcionando uma análise holística de suas competências e habilidades.',
  'Nosso processo de avaliação 360º é uma ferramenta poderosa para identificar seus pontos fortes e áreas de melhoria como líder. Com base nas informações obtidas, você será capaz de desenvolver planos de ação concretos para aprimorar sua liderança e alcançar um desempenho ainda mais eficaz.',
  'Ao receber sua análise de avaliação, você terá em mãos um valioso recurso para orientar seu crescimento profissional e liderança. Esteja aberto(a) para receber feedbacks construtivos e aproveite a oportunidade para explorar todo o seu potencial como líder.',
  'Conte conosco para apoiá-lo nessa jornada de desenvolvimento e crescimento contínuo.',
]

const pillarsMethodology = 'A Liderança é composta por quatro pilares e 16 competências. Na esfera da liderança, quanto mais abrangente ela se apresentar, mais próxima estará da excelência e mais terá a contribuir para o desenvolvimento de seus liderados e para a relação com seus superiores. Quanto mais uniforme for sua atuação, mais coerente será sua liderança. Quanto mais sólidos forem os fundamentos, maiores serão os resultados alcançados e mais facilmente conquistará novos feitos como líder.'
const privacyParagraphs = [
  'Para preservar o anonimato dos participantes, o Feedback Compass Rose aplica uma regra de agrupamento às categorias Liderado, Par e Outros. Essas relações somente são apresentadas individualmente quando possuem, no mínimo, duas avaliações concluídas.',
  'Quando uma dessas categorias não atinge esse quantitativo, suas respostas são agrupadas a outra categoria elegível, conforme as regras metodológicas do sistema. Dessa forma, evita-se que uma avaliação isolada possa ser associada a uma pessoa específica.',
  'Quando Liderado, Par e Outros não atingem simultaneamente o número mínimo necessário para apresentação individual, essas avaliações permanecem consideradas exclusivamente no resultado consolidado de Stakeholders, sem identificação da relação de origem.',
  'A categoria Superior é tratada de forma independente e permanece sempre separada, não recebendo nem sendo incorporada a outros agrupamentos.',
  'O resultado de Stakeholders reúne todas as avaliações de terceiros — Superior, Liderado, Par e Outros — e é calculado diretamente a partir das respostas válidas individuais, independentemente dos agrupamentos utilizados para apresentação das categorias.',
  'Nas respostas abertas, a mesma lógica de confidencialidade é aplicada: os comentários são apresentados segundo a categoria permitida pela regra de agrupamento, sem identificação do avaliador. As respostas qualitativas da Autoavaliação não são exibidas no relatório.',
]

const styles = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 48, paddingHorizontal: 42, backgroundColor: colors.paper, color: colors.ink, fontFamily: 'Helvetica', fontSize: 10.2, lineHeight: 1.5 },
  cover: { padding: 0, backgroundColor: colors.ink, color: '#ffffff' },
  coverAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 18, backgroundColor: colors.orange },
  coverBody: { height: '100%', padding: '78 62 62 72', justifyContent: 'space-between' },
  coverBrand: { fontSize: 12, letterSpacing: 2.4, color: '#98d9cb', textTransform: 'uppercase' },
  coverTitle: { marginTop: 26, fontSize: 40, lineHeight: 1.05, fontFamily: 'Helvetica-Bold', maxWidth: 430 },
  coverSubtitle: { marginTop: 14, fontSize: 16, color: '#d2e8e3' },
  coverName: { fontSize: 25, fontFamily: 'Helvetica-Bold' },
  coverMeta: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#55736e', flexDirection: 'row', gap: 24 },
  coverMetaItem: { width: 145 }, label: { fontSize: 7.5, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
  coverLabel: { color: '#9fc3bc' }, value: { marginTop: 4, fontSize: 10.5, fontFamily: 'Helvetica-Bold' },
  kicker: { fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.teal, fontFamily: 'Helvetica-Bold' },
  title: { marginTop: 6, marginBottom: 16, fontSize: 22, lineHeight: 1.15, fontFamily: 'Helvetica-Bold' },
  subtitle: { marginTop: -9, marginBottom: 18, color: colors.muted, fontSize: 10.2, lineHeight: 1.45 },
  h3: { marginBottom: 8, fontSize: 12, fontFamily: 'Helvetica-Bold' },
  paragraph: { marginBottom: 10, color: '#3f504e', fontSize: 10.8, lineHeight: 1.55 },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 12, backgroundColor: '#ffffff' },
  softCard: { borderWidth: 1, borderColor: '#dce6e1', borderRadius: 5, padding: 12, backgroundColor: '#f5faf8' },
  row: { flexDirection: 'row', gap: 10 },
  metric: { flexGrow: 1, padding: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 4 },
  metricValue: { marginTop: 5, fontSize: 18, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 20, left: 42, right: 42, paddingTop: 7, borderTopWidth: 0.6, borderTopColor: colors.line, fontSize: 8.2, color: colors.muted, textAlign: 'center' },
  indexRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: colors.line },
  indexNo: { width: 28, color: colors.teal, fontFamily: 'Helvetica-Bold' },
  indexText: { flexGrow: 1 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, fontSize: 8 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  chartTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  chartNote: { color: colors.muted, fontSize: 8, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.ink, color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 7.1, alignItems: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.line, minHeight: 31, alignItems: 'center' },
  tableCell: { padding: 5 },
  comment: { marginTop: 7, paddingLeft: 8, borderLeftWidth: 2, color: '#3f504e', fontSize: 10.2, lineHeight: 1.5 },
  strategyItem: { marginBottom: 11, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 5, flexDirection: 'row', gap: 10 },
  strategyNo: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, color: '#fff', textAlign: 'center', paddingTop: 4, fontFamily: 'Helvetica-Bold' },
  summaryHeader: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, backgroundColor: colors.ink, color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  summaryRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: colors.line },
  summaryCategory: { width: 205 },
  summaryNumber: { width: 98, textAlign: 'center' },
})

function fmt(value: number | null | undefined) {
  return value == null ? '—' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function groupColumns(t: ResultadoTabulacao) {
  return ['autoavaliacao', 'stakeholders', ...t.confidencialidade.relacoesExibidasSeparadamente.filter((g) => g !== 'autoavaliacao')] as GrupoTabulacao[]
}
function getGroup(t: ResultadoTabulacao, group: GrupoTabulacao) {
  return group === 'stakeholders' ? t.stakeholders : t.grupos[group]
}
const EvaluatedNameContext = createContext('Avaliado')

function ReportPage({ children, pageNumber }: { children: ReactNode; pageNumber: number }) {
  const evaluatedName = useContext(EvaluatedNameContext)
  return <Page size="A4" style={styles.page} wrap>{children}<Text style={styles.footer} fixed>{`Feedback Compass Rose · Relatório confidencial de ${evaluatedName} · Página ${pageNumber}`}</Text></Page>
}
function Heading({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return <View><Text style={styles.kicker}>{kicker}</Text><Text style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>
}

function Cover({ metadata }: { metadata: ReportPdfMetadata }) {
  return <Page size="A4" style={styles.cover}><View style={styles.coverAccent} /><View style={styles.coverBody}>
    <View><Text style={styles.coverBrand}>Feedback Compass Rose</Text><Text style={styles.coverTitle}>Avaliação 360º</Text><Text style={styles.coverSubtitle}>Uma leitura integral das percepções sobre sua liderança.</Text><View style={{ marginTop: 28, width: 86, borderTopWidth: 3, borderTopColor: colors.orange }} /></View>
    <View><Text style={styles.coverName}>{metadata.avaliado}</Text><View style={styles.coverMeta}>
      <View style={styles.coverMetaItem}><Text style={[styles.label, styles.coverLabel]}>Empresa</Text><Text style={styles.value}>{metadata.empresa}</Text></View>
      <View style={styles.coverMetaItem}><Text style={[styles.label, styles.coverLabel]}>Período</Text><Text style={styles.value}>{metadata.periodo}</Text></View>
      <View style={styles.coverMetaItem}><Text style={[styles.label, styles.coverLabel]}>Processo</Text><Text style={styles.value}>{metadata.processo}</Text></View>
    </View></View>
    <Text style={{ marginTop: 12, fontSize: 8.5, color: '#b7d0cb' }}>Consultor responsável: {metadata.consultor}</Text>
  </View></Page>
}

function RadarChart({ tabulacao }: { tabulacao: ResultadoTabulacao }) {
  const comps = tabulacao.stakeholders.competencias
  const auto = tabulacao.grupos.autoavaliacao?.competencias ?? []
  const cx = 260, cy = 225, radius = 148
  const point = (index: number, value: number) => { const a = -Math.PI / 2 + index * Math.PI * 2 / comps.length; const r = radius * value / 10; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const }
  const polygon = (values: Array<number | null>) => values.map((v, i) => point(i, v ?? 0).join(',')).join(' ')
  return <View style={styles.card} wrap={false}><Text style={styles.chartTitle}>Comparativo Autoavaliação × Stakeholders</Text><Svg width={520} height={455} viewBox="0 0 520 455">
    {[2, 4, 6, 8, 10].map((tick) => <Polygon key={tick} points={comps.map((_, i) => point(i, tick).join(',')).join(' ')} fill="none" stroke={colors.line} strokeWidth={0.7} />)}
    {comps.map((comp, i) => { const [x, y] = point(i, 10); const [lx, ly] = point(i, 12.25); return <Fragment key={comp.id}><Line x1={cx} y1={cy} x2={x} y2={y} stroke={colors.line} strokeWidth={0.5} /><Text x={lx} y={ly} style={{ fontSize: 6.6, textAnchor: 'middle' }}>{comp.nome}</Text></Fragment> })}
    <Polygon points={polygon(comps.map((c) => c.media))} fill={colors.teal} fillOpacity={0.1} stroke={colors.teal} strokeWidth={1.8} />
    <Polygon points={polygon(comps.map((c) => auto.find((a) => a.id === c.id)?.media ?? null))} fill={colors.blue} fillOpacity={0.08} stroke={colors.blue} strokeWidth={1.8} />
    {comps.flatMap((comp, i) => { const autoValue = auto.find((a) => a.id === comp.id)?.media ?? null; const ap = point(i, autoValue ?? 0); const sp = point(i, comp.media ?? 0); return [<Circle key={`a${comp.id}`} cx={ap[0]} cy={ap[1]} r={2.6} fill={colors.blue} />, <Circle key={`s${comp.id}`} cx={sp[0]} cy={sp[1]} r={2.6} fill={colors.teal} />, <Text key={`av${comp.id}`} x={ap[0] + 4} y={ap[1] - 4} style={{ fontSize: 6.4, fill: colors.blue }}>{fmt(autoValue)}</Text>, <Text key={`sv${comp.id}`} x={sp[0] + 4} y={sp[1] + 9} style={{ fontSize: 6.4, fill: colors.teal }}>{fmt(comp.media)}</Text>] })}
  </Svg><View style={styles.legend}><Legend color={colors.blue} label="Autoavaliação" /><Legend color={colors.teal} label="Stakeholders" /></View></View>
}
function Legend({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem} wrap={false}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text wrap={false}>{label}</Text></View> }

function RankingChart({ title, items, questionTexts, color }: { title: string; items: ResultadoTabulacao['maioresMediasStakeholders']; questionTexts: Record<number, string>; color: string }) {
  return <View style={[styles.card, { width: '100%', marginBottom: 14, padding: 14 }]} wrap={false}><Text style={styles.chartTitle}>{title}</Text>{items.map((item) => <View key={item.numeroPergunta} style={{ marginTop: 8 }}><Text style={{ fontSize: 7.8, marginBottom: 3 }}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Q{item.numeroPergunta}</Text> · {questionTexts[item.numeroPergunta] || `Questão ${item.numeroPergunta}`}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ height: 8, width: `${Math.max(item.media * 8.8, 2)}%`, backgroundColor: color, borderRadius: 2 }} /><Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{fmt(item.media)}</Text></View></View>)}</View>
}

function PillarComparison({ pillar, auto }: { pillar: ResultadoPilar; auto?: ResultadoPilar }) {
  const av = auto?.media ?? null, sv = pillar.media
  const baseline = 205, top = 25, scale = 17
  const ay = baseline - (av ?? 0) * scale, sy = baseline - (sv ?? 0) * scale
  const upper = Math.min(ay, sy)
  return <View style={[styles.card, { width: '100%', height: 300, marginBottom: 16 }]} wrap={false}><Text style={styles.chartTitle}>{pillar.nome}</Text><Svg width={500} height={245} viewBox="0 0 500 245">
    {[0, 2, 4, 6, 8, 10].map((tick) => { const y = baseline - tick * scale; return <Fragment key={tick}><Line x1={42} y1={y} x2={465} y2={y} stroke={colors.line} strokeWidth={0.6} /><Text x={24} y={y + 3} style={{ fontSize: 7, fill: colors.muted }}>{tick}</Text></Fragment> })}
    <Rect x={142} y={ay} width={58} height={baseline - ay} fill={colors.blue} />
    <Rect x={300} y={sy} width={58} height={baseline - sy} fill={colors.teal} />
    <Text x={171} y={ay + 14} style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', textAnchor: 'middle', fill: '#ffffff' }}>{fmt(av)}</Text>
    <Text x={329} y={sy + 14} style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', textAnchor: 'middle', fill: '#ffffff' }}>{fmt(sv)}</Text>
    <Text x={171} y={224} style={{ fontSize: 8, textAnchor: 'middle' }}>Autoavaliação</Text><Text x={329} y={224} style={{ fontSize: 8, textAnchor: 'middle' }}>Stakeholders</Text>
    {av != null && sv != null && <Fragment><Line x1={112} y1={ay} x2={388} y2={ay} stroke="#1f2937" strokeWidth={1.8} /><Line x1={112} y1={sy} x2={388} y2={sy} stroke="#1f2937" strokeWidth={1.8} /><Line x1={250} y1={ay} x2={250} y2={sy} stroke="#1f2937" strokeWidth={2.2} /><Text x={250} y={Math.max(upper - 10, top)} style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', textAnchor: 'middle', fill: '#111827' }}>{fmt(Math.abs(sv - av))}</Text></Fragment>}
  </Svg></View>
}

function PillarBanner({ pillar }: { pillar: ResultadoPilar }) {
  const labels: Record<string, string> = { estrategia: 'Direção e escolhas', comprometimento: 'Energia e constância', gestao: 'Pessoas e resultados', credibilidade: 'Coerência e confiança' }
  return <View style={{ height: 72, marginBottom: 12, borderRadius: 5, backgroundColor: colors.ink, color: '#ffffff', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 }} wrap={false}>
    <View style={{ width: 310 }}><Text style={{ fontSize: 7.5, letterSpacing: 1.3, textTransform: 'uppercase', color: '#96d3c7' }}>Bússola da liderança</Text><Text style={{ marginTop: 6, fontSize: 15, fontFamily: 'Helvetica-Bold' }}>{labels[pillar.id] ?? pillar.nome}</Text></View>
    <Svg width={165} height={60} viewBox="0 0 165 60"><Circle cx={116} cy={30} r={25} fill="none" stroke="#77a99f" strokeWidth={1} /><Circle cx={116} cy={30} r={16} fill="none" stroke="#77a99f" strokeWidth={0.6} /><Line x1={88} y1={30} x2={144} y2={30} stroke="#b7683f" strokeWidth={2} /><Line x1={116} y1={5} x2={116} y2={55} stroke="#77a99f" strokeWidth={0.8} /><Polygon points="144,30 136,26 136,34" fill="#b7683f" /><Circle cx={116} cy={30} r={3} fill="#ffffff" /></Svg>
  </View>
}

function CompetencyChart({ pillar }: { pillar: ResultadoPilar }) {
  const ordered = pillar.competencias.map((comp, index) => ({ comp, index })).sort((a, b) => (a.comp.media ?? Infinity) - (b.comp.media ?? Infinity) || a.index - b.index).map(({ comp }) => comp)
  return <View style={[styles.card, { height: 390, padding: 14 }]} wrap={false}><Text style={styles.chartTitle}>Competências de {pillar.nome}</Text><Text style={styles.chartNote}>Ordem crescente de média · escala de 0 a 10</Text><View style={{ height: 325, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', borderBottomWidth: 0.7, borderBottomColor: colors.line, paddingHorizontal: 18 }}>
    {ordered.map((comp) => <View key={comp.id} style={{ alignItems: 'center', width: 100 }}><Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>{fmt(comp.media)}</Text><View style={{ width: 58, height: Math.max((comp.media ?? 0) * 22, 1), backgroundColor: colors.slate, borderRadius: 2 }} /><Text style={{ marginTop: 7, fontSize: 8.5, textAlign: 'center' }}>{comp.nome}</Text></View>)}
  </View></View>
}

function QuestionChart({ pillar, columns, tabulacao }: { pillar: ResultadoPilar; columns: GrupoTabulacao[]; tabulacao: ResultadoTabulacao }) {
  const width = 350, questionLabelWidth = 28
  const renderQuestion = (questionNo: number) => <View key={questionNo} style={{ flexDirection: 'row', alignItems: 'center', minHeight: Math.max(columns.length * 8.5 + 4, 25) }}><Text style={{ width: questionLabelWidth, fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Q{questionNo}</Text><View style={{ width }}>
    {columns.map((g) => { const value = getGroup(tabulacao, g)?.questoes.find((q) => q.numeroPergunta === questionNo)?.media ?? null; return <View key={g} style={{ height: 8.5, flexDirection: 'row', alignItems: 'center' }}><View style={{ width: `${Math.max((value ?? 0) * 8.65, 12)}%`, height: 8, backgroundColor: groupColors[g], alignItems: 'flex-end', paddingRight: 2, paddingTop: 1.2 }}><Text style={{ color: '#ffffff', fontSize: 5, lineHeight: 1, fontFamily: 'Helvetica-Bold' }}>{fmt(value)}</Text></View></View> })}
  </View></View>
  return <View style={[styles.card, { height: 595, padding: 12 }]} wrap={false}><Text style={styles.chartTitle}>Perguntas de {pillar.nome}</Text><View style={[styles.legend, { marginTop: 4, marginBottom: 7, gap: 12 }]}>{columns.map((g) => <Legend key={g} color={groupColors[g]} label={groupNames[g]} />)}</View>
    <View style={{ flexDirection: 'row', marginBottom: 4 }}><View style={{ width: 50 }} /><View style={{ width, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 19 }}>{[0, 2, 4, 6, 8, 10].map((tick) => <Text key={tick} style={{ width: 18, fontSize: 6.2, color: colors.muted, textAlign: 'center' }}>{tick}</Text>)}</View></View>
    {(classifications[pillar.id] ?? []).map((classification) => <View key={classification.letter} style={{ flexDirection: 'row' }} wrap={false}>
      <View style={{ width: 22, position: 'relative', alignItems: 'center', justifyContent: 'center', borderRightWidth: 1.2, borderRightColor: colors.teal, marginRight: 6 }}><View style={{ position: 'absolute', right: 0, top: 1, width: 6, borderTopWidth: 1.2, borderTopColor: colors.teal }} /><View style={{ position: 'absolute', right: 0, bottom: 1, width: 6, borderBottomWidth: 1.2, borderBottomColor: colors.teal }} /><View style={{ width: 17, height: 17, borderRadius: 9, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffffff', fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>{classification.letter}</Text></View></View>
      <View>{classification.questions.map(renderQuestion)}</View>
    </View>)}
    <View style={{ marginTop: 7, padding: 8, backgroundColor: colors.soft, borderRadius: 3, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{(classifications[pillar.id] ?? []).map((c) => <Text key={c.letter} wrap={false} style={{ width: 113, fontSize: 6.8 }}><Text style={{ color: colors.teal, fontFamily: 'Helvetica-Bold' }}>{c.letter}</Text> · {c.name} (Q{c.questions[0]}–Q{c.questions[1]})</Text>)}</View>
  </View>
}

function EvaluationTablePage({ columns, tabulacao, questionTexts, pageNumber }: { columns: GrupoTabulacao[]; tabulacao: ResultadoTabulacao; questionTexts: Record<number, string>; pageNumber: number }) {
  const numbers = Array.from({ length: 32 }, (_, index) => index + 1)
  const relationWidths = columns.map((group) => group === 'autoavaliacao' ? 50 : group === 'stakeholders' ? 47 : 36)
  const qNumberWidth = 34
  const qWidth = 500 - qNumberWidth - relationWidths.reduce((total, width) => total + width, 0)
  return <ReportPage pageNumber={pageNumber}><Heading kicker="08 · Avaliação Geral" title="Avaliação Geral" subtitle="Questões Q1–Q32 e relações liberadas pela política de confidencialidade." />
    <View style={[styles.tableHeader, { minHeight: 16 }]}><Text style={[styles.tableCell, { width: qNumberWidth, padding: 2, fontSize: 6.2 }]}>#</Text><Text style={[styles.tableCell, { width: qWidth, padding: 2, fontSize: 6.2 }]}>Questão</Text>{columns.map((g, index) => <Text key={g} wrap={false} style={[styles.tableCell, { width: relationWidths[index], textAlign: 'center', fontSize: 5.4, padding: 1 }]}>{groupNames[g]}</Text>)}</View>
    {numbers.map((n) => <View key={n} style={[styles.tableRow, { height: 18, minHeight: 18 }]} wrap={false}><Text style={[styles.tableCell, { width: qNumberWidth, padding: 1, fontSize: 5.8, lineHeight: 1, fontFamily: 'Helvetica-Bold' }]}>Q{n}</Text><Text style={[styles.tableCell, { width: qWidth, padding: 2, fontSize: 6.1, lineHeight: 1.02 }]}>{questionTexts[n] || `Questão ${n}`}</Text>{columns.map((g, index) => <Text key={g} style={[styles.tableCell, { width: relationWidths[index], padding: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 6.1 }]}>{fmt(getGroup(tabulacao, g)?.questoes.find((q) => q.numeroPergunta === n)?.media)}</Text>)}</View>)}
  </ReportPage>
}

const strategicQuestions = [
  { title: 'Após a análise da sua avaliação 360º, reflita sobre suas descobertas.', questions: ['O que mais chamou sua atenção durante a análise da avaliação?', 'Como essas descobertas podem impactar sua prática como líder?', 'Quais são os insights mais importantes que você obteve?'] },
  { title: 'Defina seu estado desejado e estabeleça metas claras para alcançá-lo.', questions: ['Quais são os objetivos específicos que você deseja alcançar como líder?', 'Quais passos práticos você pode dar para avançar em direção a esses objetivos?', 'Quais recursos e oportunidades estão disponíveis para ajudá-lo a atingir seus objetivos?'] },
  { title: 'Elabore um plano de ação detalhado para concretizar suas metas.', questions: ['Quais são as principais ações que você precisa realizar para alcançar seus objetivos?', 'Como você planeja distribuir essas ações ao longo do tempo?', 'Quais são os passos específicos que você precisa seguir para implementar cada uma dessas ações?'] },
  { title: 'Execute seu plano de ação de maneira eficaz.', questions: ['Quais são os primeiros passos que você tomará para colocar seu plano em prática?', 'Como você garantirá que todas as ações sejam realizadas conforme planejado?', 'Quais obstáculos você antecipa encontrar durante a implementação do plano e como planeja superá-los?'] },
  { title: 'Estabeleça critérios claros para avaliar o progresso e o alcance de seus objetivos.', questions: ['Como você saberá se está progredindo em direção aos seus objetivos?', 'Que indicadores ou métricas você usará para medir seu progresso ao longo do tempo?', 'Que ajustes você pode precisar fazer no plano de ação com base em sua avaliação contínua?'] },
]

export function FeedbackReportPdf({ metadata, tabulacao, questionTexts, participation }: FeedbackReportPdfProps) {
  const columns = groupColumns(tabulacao)
  const qualitativeGroups = columns.filter((g) => g !== 'autoavaliacao' && tabulacao.percepcoesQualitativas[g])
  const index = [
    ['Resumo da Avaliação', 3], ['Introdução', 4], ['Os Pilares da Liderança', 6], ['Comparativo Autoavaliação × Stakeholders', 7],
    ['Média Stakeholders', 8], ['Comparativo de Percepções', 9], ['Pilares e Perguntas de Estratégia', 11],
    ['Pilares e Perguntas de Comprometimento', 13], ['Pilares e Perguntas de Gestão', 15], ['Pilares e Perguntas de Credibilidade', 17],
    ['Avaliação Geral', 19], ['Percepções', 20], ['Perguntas Estratégicas', 22],
  ] as const
  const totalPlanned = participation.reduce((sum, item) => sum + item.planned, 0)
  const totalAnswered = participation.reduce((sum, item) => sum + item.answered, 0)
  return <Document title={`Feedback Compass Rose — ${metadata.avaliado}`} author="Feedback Compass Rose" subject="Avaliação 360º de Liderança">
    <EvaluatedNameContext.Provider value={metadata.avaliado}>
    <Cover metadata={metadata} />
    <ReportPage pageNumber={2}><Heading kicker="Documento confidencial" title="Índice" subtitle={`Avaliação de ${metadata.avaliado}`} />{index.map(([item, page], i) => <View key={item} style={styles.indexRow}><Text style={styles.indexNo}>{String(i + 1).padStart(2, '0')}</Text><Text style={styles.indexText}>{item}</Text><Text style={{ flexGrow: 1, borderBottomWidth: 0.5, borderBottomColor: colors.line, marginHorizontal: 8, marginBottom: 3 }} /><Text style={{ width: 22, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>{page}</Text></View>)}</ReportPage>
    <ReportPage pageNumber={3}><Heading kicker="01 · Contexto" title="Resumo da Avaliação" subtitle="Participação prevista, respondida e não respondida por categoria." />
      <View style={styles.summaryHeader}><Text style={styles.summaryCategory}>Categoria</Text><Text style={styles.summaryNumber}>Previstas</Text><Text style={styles.summaryNumber}>Respondidas</Text><Text style={styles.summaryNumber}>Não respondidas</Text></View>
      {participation.map((item) => <View key={item.group} style={styles.summaryRow}><Text style={[styles.summaryCategory, { fontFamily: 'Helvetica-Bold' }]}>{groupNames[item.group]}</Text><Text style={styles.summaryNumber}>{item.planned}</Text><Text style={styles.summaryNumber}>{item.answered}</Text><Text style={styles.summaryNumber}>{Math.max(item.planned - item.answered, 0)}</Text></View>)}
      <View style={[styles.summaryRow, { backgroundColor: colors.soft, fontFamily: 'Helvetica-Bold' }]}><Text style={styles.summaryCategory}>Total</Text><Text style={styles.summaryNumber}>{totalPlanned}</Text><Text style={styles.summaryNumber}>{totalAnswered}</Text><Text style={styles.summaryNumber}>{Math.max(totalPlanned - totalAnswered, 0)}</Text></View>
      <View style={[styles.softCard, { marginTop: 18 }]}><Text style={styles.h3}>Identificação do relatório</Text><Text style={styles.paragraph}>Pessoa avaliada: {metadata.avaliado}</Text><Text style={styles.paragraph}>Empresa: {metadata.empresa}</Text><Text style={styles.paragraph}>Processo: {metadata.processo}</Text><Text style={styles.paragraph}>Matriz: {metadata.codigoMatriz}</Text><Text style={styles.paragraph}>Período: {metadata.periodo}</Text><Text>Consultor: {metadata.consultor}</Text></View>
    </ReportPage>
    <ReportPage pageNumber={4}><Heading kicker="02 · Introdução" title="Sobre a Avaliação 360º" /><View style={[styles.softCard, { marginBottom: 16, padding: 14, borderLeftWidth: 4, borderLeftColor: colors.teal }]}><Text style={{ fontSize: 14, lineHeight: 1.35, fontFamily: 'Helvetica-Bold', color: colors.ink }}>Diferentes perspectivas transformam feedback em consciência, escolha e desenvolvimento.</Text></View>{introductionParagraphs.map((p) => <Text key={p} style={[styles.paragraph, { fontSize: 11.2 }]}>{p}</Text>)}</ReportPage>
    <ReportPage pageNumber={5}><Heading kicker="02 · Introdução" title="Confidencialidade e regra de agrupamento" subtitle="Proteção das pessoas, integridade dos dados e segurança para o diálogo." /><View style={[styles.softCard, { marginBottom: 15, padding: 12 }]}><Text style={{ fontSize: 10.2, lineHeight: 1.55 }}><Text style={{ fontFamily: 'Helvetica-Bold', color: colors.teal }}>Anonimato</Text> · mínimo de duas avaliações nas categorias protegidas · <Text style={{ fontFamily: 'Helvetica-Bold', color: colors.teal }}>Superior permanece independente</Text> · <Text style={{ fontFamily: 'Helvetica-Bold', color: colors.teal }}>Stakeholders reúne todas as avaliações de terceiros</Text>.</Text></View>{privacyParagraphs.map((p) => <Text key={p} style={[styles.paragraph, { fontSize: 10.4 }]}>{p}</Text>)}</ReportPage>
    <ReportPage pageNumber={6}><Heading kicker="03 · Estrutura" title="Os Pilares da Liderança" subtitle="Quatro pilares e 16 competências compõem a leitura metodológica." /><Text style={[styles.paragraph, { marginBottom: 16, fontSize: 11 }]}>{pillarsMethodology}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{tabulacao.stakeholders.pilares.map((p, index) => <View key={p.id} style={[styles.card, { width: 245, minHeight: 95, padding: 13, borderTopWidth: 4, borderTopColor: index % 2 === 0 ? colors.teal : colors.orange }]} wrap={false}><Text style={[styles.h3, { fontSize: 14 }]}>{p.nome}</Text><Text style={{ fontSize: 10, lineHeight: 1.5 }}>{p.competencias.map((c) => c.nome).join(' · ')}</Text></View>)}</View></ReportPage>
    <ReportPage pageNumber={7}><Heading kicker="04 · Comparativo" title="Autoavaliação × Stakeholders" subtitle="Somente as duas séries metodológicas, com as 16 competências e valores em escala de 0 a 10." /><RadarChart tabulacao={tabulacao} /></ReportPage>
    <ReportPage pageNumber={8}><Heading kicker="05 · Destaques" title="Média Stakeholders" subtitle="Cinco menores e cinco maiores médias por questão." /><RankingChart title="5 menores médias" items={tabulacao.menoresMediasStakeholders} questionTexts={questionTexts} color={colors.orange} /><RankingChart title="5 maiores médias" items={tabulacao.maioresMediasStakeholders} questionTexts={questionTexts} color={colors.green} /></ReportPage>
    {[tabulacao.stakeholders.pilares.slice(0, 2), tabulacao.stakeholders.pilares.slice(2, 4)].map((pillars, pageIndex) => <ReportPage key={`comparison-${pageIndex}`} pageNumber={9 + pageIndex}><Heading kicker="06 · Comparativo de Percepções" title={pageIndex === 0 ? 'Autoavaliação × Stakeholders por Pilar' : 'Comparativo de Percepções · continuação'} subtitle="Dois comparativos por página, com diferença absoluta e régua de leitura." />{pillars.map((p) => <PillarComparison key={p.id} pillar={p} auto={tabulacao.grupos.autoavaliacao?.pilares.find((a) => a.id === p.id)} />)}</ReportPage>)}
    {tabulacao.stakeholders.pilares.flatMap((p, i) => [
      <ReportPage key={`${p.id}-competencias`} pageNumber={11 + i * 2}><Heading kicker={`07.${i + 1} · Pilares de ${p.nome}`} title={p.nome} /><PillarBanner pillar={p} /><Text style={[styles.paragraph, { marginBottom: 12 }]}>{pillarDescriptions[p.id]}</Text><CompetencyChart pillar={p} /></ReportPage>,
      <ReportPage key={`${p.id}-perguntas`} pageNumber={12 + i * 2}><Heading kicker={`07.${i + 1} · Perguntas de ${p.nome}`} title={`Perguntas de ${p.nome}`} subtitle="Comparação por relação liberada, preservando as chaves metodológicas e os valores exatos." /><QuestionChart pillar={p} columns={columns} tabulacao={tabulacao} /></ReportPage>,
    ])}
    <EvaluationTablePage columns={columns} tabulacao={tabulacao} questionTexts={questionTexts} pageNumber={19} />
    {([33, 34] as const).map((number, perceptionIndex) => <ReportPage key={number} pageNumber={20 + perceptionIndex}><Heading kicker="09 · Percepções" title={number === 33 ? 'Pontos Fortes' : 'Pontos de Melhoria'} subtitle="Percepções anônimas apresentadas conforme a política de confidencialidade." /><Text style={[styles.paragraph, { marginBottom: 14 }]}>Nesta seção são apresentadas as percepções registradas pelos avaliadores sobre os pontos fortes e as oportunidades de desenvolvimento observadas. As respostas são apresentadas de forma anônima e de acordo com as regras de confidencialidade da avaliação.</Text>{qualitativeGroups.map((group) => { const responses = tabulacao.percepcoesQualitativas[group]?.questoes.find((q) => q.numeroPergunta === number)?.respostas ?? []; return responses.length ? <View key={group} style={[styles.card, { marginBottom: 10, padding: 10 }]} wrap={false}><Text style={{ color: groupColors[group], fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>{groupNames[group]}</Text>{responses.map((r, i) => <Text key={`${group}-${i}`} style={[styles.comment, { borderLeftColor: groupColors[group], marginTop: 4 }]}>{r}</Text>)}</View> : null })}{number === 34 && <View style={[styles.softCard, { marginTop: 8 }]}><Text style={styles.h3}>Da percepção ao Plano de Ação</Text><Text style={styles.paragraph}>Os pontos mencionados refletem diferentes perspectivas sobre sua liderança. Analise cada comentário em conjunto com os resultados anteriores, reconheça padrões e escolha as prioridades que orientarão seu desenvolvimento contínuo.</Text><Text>Na próxima seção, transforme essa reflexão em objetivos, ações e critérios de acompanhamento.</Text></View>}</ReportPage>)}
    <ReportPage pageNumber={22}><Heading kicker="10 · Desenvolvimento" title="Perguntas Estratégicas" subtitle="Cinco etapas para transformar a leitura do relatório em desenvolvimento e ação." />{strategicQuestions.map((item, i) => <View key={item.title} style={[styles.strategyItem, { padding: 11, marginBottom: 9 }]} wrap={false}><Text style={styles.strategyNo}>{i + 1}</Text><View style={{ flexGrow: 1 }}><Text style={[styles.h3, { marginBottom: 5, fontSize: 12.5 }]}>{item.title}</Text>{item.questions.map((question) => <Text key={question} style={{ color: colors.muted, fontSize: 10.1, lineHeight: 1.35, marginBottom: 3 }}>• {question}</Text>)}</View></View>)}</ReportPage>
    </EvaluatedNameContext.Provider>
  </Document>
}
