import { renderToFile } from '@react-pdf/renderer'
import { FeedbackReportPdf } from '../src/components/report/FeedbackReportPdf.tsx'
import { tabularFeedback360, type AvaliacaoTabulacaoEntrada } from '../src/lib/tabulacao.ts'
import type { CategoriaMatrizRelacional } from '../src/types/index.ts'

const relations: CategoriaMatrizRelacional[] = [
  'autoavaliacao', 'superior', 'liderado', 'liderado', 'par', 'par', 'outro', 'outro',
]

const evaluations: AvaliacaoTabulacaoEntrada[] = relations.map((relation, evaluationIndex) => ({
  id: `teste-${evaluationIndex + 1}`,
  relacao: relation,
  respondida: true,
  respostas: [
    ...Array.from({ length: 32 }, (_, questionIndex) => ({
      numeroPergunta: questionIndex + 1,
      valorNumerico: 6 + ((questionIndex * 3 + evaluationIndex * 2) % 5),
      valorTexto: null,
    })),
    { numeroPergunta: 33, valorNumerico: null, valorTexto: `Comentário de ponto forte ${evaluationIndex + 1}, preservado individualmente.` },
    { numeroPergunta: 34, valorNumerico: null, valorTexto: `Comentário de desenvolvimento ${evaluationIndex + 1}, sem identificação do avaliador.` },
  ],
}))

const questionTexts = Object.fromEntries(Array.from({ length: 32 }, (_, index) => [
  index + 1,
  `Questão ${index + 1}: demonstra comportamento observável de liderança e consistência na prática profissional.`,
]))

await renderToFile(
  <FeedbackReportPdf
    metadata={{
      avaliado: 'Marina Albuquerque',
      empresa: 'Horizonte Desenvolvimento Organizacional',
      processo: 'Ciclo de Liderança 2026',
      codigoMatriz: 'MTR-2026-0187',
      periodo: '01/08/2026 a 31/08/2026',
      geradoEm: '23/09/2026 14:30',
      consultor: 'Renata Vasconcelos',
    }}
    tabulacao={tabularFeedback360(evaluations)}
    questionTexts={questionTexts}
    participation={[
      { group: 'autoavaliacao', planned: 1, answered: 1 },
      { group: 'superior', planned: 2, answered: 1 },
      { group: 'liderado', planned: 3, answered: 2 },
      { group: 'par', planned: 2, answered: 2 },
      { group: 'outro', planned: 3, answered: 2 },
    ]}
  />,
  '.netlify/Feedback Compass Rose - Marina Albuquerque - 31-08-2026.pdf',
)
