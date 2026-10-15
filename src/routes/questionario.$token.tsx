import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Loader2,
  LockKeyhole,
  ShieldX,
  X,
} from 'lucide-react'

export const Route = createFileRoute('/questionario/$token')({
  head: () => ({
    meta: [
      { title: 'Avaliação 360º de Liderança — Feedback Compass Rose' },
      { name: 'robots', content: 'noindex, nofollow, noarchive' },
      { name: 'referrer', content: 'no-referrer' },
    ],
  }),
  component: QuestionarioPublico,
})

type PublicQuestion = {
  id: string
  numero: number
  texto: string
  tipo: 'quantitativa' | 'qualitativa'
}

type PublicCompetency = {
  nome: string
  ordem: number
  perguntas: PublicQuestion[]
}

type PublicPillar = {
  nome: string
  ordem: number
  competencias: PublicCompetency[]
}

type PublicQuestionnaire = {
  codigo: string
  versao: number
  pilares: PublicPillar[]
  percepcoes: PublicQuestion[]
}

type PublicIdentification = {
  avaliado: string
  avaliador: string
  relacao: string
}

type PublicLicense = {
  consultor: string
}

type PublicAssessmentResponse = {
  valid: true
  completed: boolean
  identification: PublicIdentification
  license: PublicLicense
  questionnaire?: PublicQuestionnaire
  respostas?: PublicSavedAnswer[]
}

type PublicSavedAnswer = {
  perguntaId: string
  valorNumerico: number | null
  valorTexto: string | null
}

type LoadStatus =
  | { state: 'loading' }
  | { state: 'ready'; data: PublicAssessmentResponse & { questionnaire: PublicQuestionnaire } }
  | { state: 'completed'; identification: PublicIdentification; license: PublicLicense }
  | { state: 'success'; identification: PublicIdentification; license: PublicLicense }
  | { state: 'error' }

type QuantitativeAnswers = Record<number, number>
type QualitativeAnswers = Record<number, string>
type SaveFeedback = 'idle' | 'saving' | 'saved' | 'error'
type SavePayload = { valorNumerico: number } | { valorTexto: string }
type QueuedSave = { question: PublicQuestion; payload: SavePayload }
type QuestionSaveQueue = { inFlight: boolean; queued?: QueuedSave }
type PendingTextSave = { timer: number; question: PublicQuestion; value: string }

const INVALID_LINK_MESSAGE = 'Este link de avaliação é inválido ou não está mais disponível.'
const SCALE_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function QuestionarioPublico() {
  const { token } = Route.useParams()
  const [status, setStatus] = useState<LoadStatus>({ state: 'loading' })
  const consultantName = status.state === 'ready'
    ? status.data.license.consultor
    : status.state === 'completed' || status.state === 'success'
      ? status.license.consultor
      : null

  useEffect(() => {
    const controller = new AbortController()

    async function loadQuestionnaire() {
      setStatus({ state: 'loading' })

      try {
        const response = await fetch(`/api/acesso/questionario/${encodeURIComponent(token)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })

        if (!response.ok) {
          setStatus({ state: 'error' })
          return
        }

        const data = (await response.json()) as PublicAssessmentResponse
        if (!data.valid) {
          setStatus({ state: 'error' })
          return
        }

        if (data.completed) {
          setStatus({ state: 'completed', identification: data.identification, license: data.license })
          return
        }

        if (!data.questionnaire) {
          setStatus({ state: 'error' })
          return
        }

        setStatus({ state: 'ready', data: { ...data, questionnaire: data.questionnaire } })
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setStatus({ state: 'error' })
        }
      }
    }

    void loadQuestionnaire()
    return () => controller.abort()
  }, [token])

  return (
    <div className="min-h-screen bg-[#f5f3ec] text-[#173f3a]">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {status.state === 'loading' && <LoadingState />}
        {status.state === 'error' && <MessageState kind="error" />}
        {status.state === 'completed' && (
          <MessageState kind="completed" identification={status.identification} />
        )}
        {status.state === 'success' && (
          <MessageState kind="success" identification={status.identification} />
        )}
        {status.state === 'ready' && (
          <QuestionnaireFlow
            data={status.data}
            token={token}
            onCompleted={() => setStatus({
              state: 'success',
              identification: status.data.identification,
              license: status.data.license,
            })}
          />
        )}
      </main>
      {status.state !== 'success' && status.state !== 'completed' && (
        <footer className="mx-auto w-full max-w-5xl px-4 pb-8 text-center text-xs text-[#60736f] sm:px-6">
          {consultantName
            ? `Feedback Compass Rose · Ferramenta licenciada para uso de: ${consultantName}`
            : 'Ambiente confidencial de avaliação • Feedback Compass Rose'}
        </footer>
      )}
    </div>
  )
}

function PublicHeader() {
  return (
    <header className="border-b border-[#173f3a]/10 bg-[#fffdf8]">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid size-10 place-items-center rounded-full bg-[#173f3a] text-[#f4c96b]">
          <Compass className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold tracking-[-0.02em] text-[#173f3a]">Feedback Compass Rose</p>
          <p className="text-xs text-[#60736f]">Avaliação 360º de Liderança</p>
        </div>
      </div>
    </header>
  )
}

function LoadingState() {
  return (
    <section className="mx-auto max-w-3xl" aria-live="polite" aria-busy="true">
      <div className="rounded-3xl border border-[#173f3a]/10 bg-[#fffdf8] p-6 sm:p-10">
        <div className="mb-8 flex items-center gap-3 text-sm font-medium text-[#60736f]">
          <Loader2 className="size-5 animate-spin text-[#b47b27]" aria-hidden="true" />
          Carregando sua avaliação com segurança...
        </div>
        <div className="space-y-4">
          <div className="h-3 w-32 animate-pulse rounded-full bg-[#173f3a]/10" />
          <div className="h-7 w-3/4 animate-pulse rounded-full bg-[#173f3a]/10" />
          <div className="h-24 animate-pulse rounded-2xl bg-[#173f3a]/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-[#173f3a]/5" />
        </div>
      </div>
    </section>
  )
}

function MessageState({
  kind,
  identification,
}: {
  kind: 'error' | 'completed' | 'success'
  identification?: PublicIdentification
}) {
  const positive = kind !== 'error'
  const success = kind === 'success'
  const Icon = positive ? CheckCircle2 : ShieldX

  return (
    <section
      className="mx-auto max-w-2xl rounded-3xl border border-[#173f3a]/10 bg-[#fffdf8] p-7 text-center sm:p-12"
      role={positive ? 'status' : 'alert'}
    >
      <div
        className={`mx-auto mb-5 grid size-14 place-items-center rounded-full ${
          positive ? 'bg-[#e3eee8] text-[#246555]' : 'bg-[#f8e6df] text-[#9a4935]'
        }`}
      >
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <h1 className="text-balance text-2xl font-semibold tracking-[-0.03em] text-[#173f3a]">
        {success
          ? 'Obrigado pela sua participação.'
          : kind === 'completed'
            ? 'Esta avaliação já foi concluída.'
            : INVALID_LINK_MESSAGE}
      </h1>
      {positive && identification && (
        <p className={`${success ? 'sr-only' : 'mt-4 text-sm text-[#60736f]'}`}>
          Avaliado(a): <strong className="font-semibold text-[#173f3a]">{identification.avaliado}</strong>
        </p>
      )}
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#60736f]">
        {success
          ? 'Sua avaliação foi registrada com sucesso.'
          : kind === 'completed'
            ? 'As respostas já foram registradas e este link não permite novas alterações.'
          : 'Confira se o endereço foi copiado integralmente ou solicite um novo acesso ao responsável pela avaliação.'}
      </p>
    </section>
  )
}

function QuestionnaireFlow({
  data,
  token,
  onCompleted,
}: {
  data: PublicAssessmentResponse & { questionnaire: PublicQuestionnaire }
  token: string
  onCompleted: () => void
}) {
  const questionsById = useMemo(() => {
    const questions = [
      ...data.questionnaire.pilares.flatMap((pillar) =>
        pillar.competencias.flatMap((competency) => competency.perguntas),
      ),
      ...data.questionnaire.percepcoes,
    ]
    return new Map(questions.map((question) => [question.id, question]))
  }, [data.questionnaire])
  const initialQuantitativeAnswers = useMemo(() => {
    const answers: QuantitativeAnswers = {}
    for (const savedAnswer of data.respostas ?? []) {
      const question = questionsById.get(savedAnswer.perguntaId)
      if (
        question?.tipo === 'quantitativa' &&
        typeof savedAnswer.valorNumerico === 'number' &&
        Number.isInteger(savedAnswer.valorNumerico) &&
        savedAnswer.valorNumerico >= 0 &&
        savedAnswer.valorNumerico <= 10
      ) {
        answers[question.numero] = savedAnswer.valorNumerico
      }
    }
    return answers
  }, [data.respostas, questionsById])
  const initialQualitativeAnswers = useMemo(() => {
    const answers: QualitativeAnswers = {}
    for (const savedAnswer of data.respostas ?? []) {
      const question = questionsById.get(savedAnswer.perguntaId)
      if (question?.tipo === 'qualitativa' && typeof savedAnswer.valorTexto === 'string') {
        answers[question.numero] = savedAnswer.valorTexto
      }
    }
    return answers
  }, [data.respostas, questionsById])
  const [quantitativeAnswers, setQuantitativeAnswers] = useState<QuantitativeAnswers>(initialQuantitativeAnswers)
  const [qualitativeAnswers, setQualitativeAnswers] = useState<QualitativeAnswers>(initialQualitativeAnswers)
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>('saved')
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completionError, setCompletionError] = useState<string | null>(null)
  const pendingTextSaves = useRef(new Map<string, PendingTextSave>())
  const saveQueues = useRef(new Map<string, QuestionSaveQueue>())
  const failedQuestions = useRef(new Set<string>())
  const submittingRef = useRef(false)

  useEffect(() => {
    const pendingSaves = pendingTextSaves.current
    return () => pendingSaves.forEach(({ timer }) => window.clearTimeout(timer))
  }, [])

  const quantitativeQuestions = useMemo(
    () => data.questionnaire.pilares.flatMap((pillar) =>
      pillar.competencias.flatMap((competency) => competency.perguntas),
    ),
    [data.questionnaire.pilares],
  )
  const answeredQuantitativeCount = quantitativeQuestions.filter((question) =>
    Object.prototype.hasOwnProperty.call(quantitativeAnswers, question.numero),
  ).length
  const answeredQualitativeCount = data.questionnaire.percepcoes.filter((question) =>
    Boolean(qualitativeAnswers[question.numero]?.trim()),
  ).length
  const totalQuestions = quantitativeQuestions.length + data.questionnaire.percepcoes.length
  const answeredCount = answeredQuantitativeCount + answeredQualitativeCount
  const unansweredCount = totalQuestions - answeredCount
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
  const canFinalize = saveFeedback === 'saved' && !submitting

  function refreshSaveFeedback() {
    const hasPendingText = pendingTextSaves.current.size > 0
    const hasQueuedRequest = [...saveQueues.current.values()].some(
      (queue) => queue.inFlight || Boolean(queue.queued),
    )

    if (hasPendingText || hasQueuedRequest) {
      setSaveFeedback('saving')
    } else if (failedQuestions.current.size > 0) {
      setSaveFeedback('error')
    } else {
      setSaveFeedback('saved')
    }
  }

  async function persistAnswer(questionId: string) {
    const queue = saveQueues.current.get(questionId)
    if (!queue || queue.inFlight || !queue.queued) return

    const save = queue.queued
    queue.queued = undefined
    queue.inFlight = true
    refreshSaveFeedback()

    let saved = false
    try {
      const response = await fetch(`/api/questionario/resposta/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        keepalive: true,
        body: JSON.stringify({ perguntaId: save.question.id, ...save.payload }),
      })
      const result = (await response.json()) as { saved?: boolean }

      if (!response.ok || !result.saved) throw new Error('save_failed')
      saved = true
    } catch {
      saved = false
    } finally {
      queue.inFlight = false

      if (!queue.queued) {
        if (saved) {
          failedQuestions.current.delete(questionId)
        } else {
          failedQuestions.current.add(questionId)
        }
        saveQueues.current.delete(questionId)
      }

      if (queue.queued) {
        void persistAnswer(questionId)
      } else {
        refreshSaveFeedback()
      }
    }
  }

  function queueAnswer(question: PublicQuestion, payload: SavePayload) {
    failedQuestions.current.delete(question.id)
    const queue = saveQueues.current.get(question.id) ?? { inFlight: false }
    queue.queued = { question, payload }
    saveQueues.current.set(question.id, queue)
    refreshSaveFeedback()
    void persistAnswer(question.id)
  }

  function saveQuantitativeAnswer(question: PublicQuestion, value: number) {
    setQuantitativeAnswers((answers) => ({ ...answers, [question.numero]: value }))
    queueAnswer(question, { valorNumerico: value })
  }

  function saveQualitativeAnswer(question: PublicQuestion, value: string) {
    setQualitativeAnswers((answers) => ({ ...answers, [question.numero]: value }))
    failedQuestions.current.delete(question.id)

    const pendingSave = pendingTextSaves.current.get(question.id)
    if (pendingSave) window.clearTimeout(pendingSave.timer)

    const timer = window.setTimeout(() => {
      pendingTextSaves.current.delete(question.id)
      queueAnswer(question, { valorTexto: value })
    }, 500)
    pendingTextSaves.current.set(question.id, { timer, question, value })
    refreshSaveFeedback()
  }

  function flushPendingTextSaves() {
    const pendingSaves = [...pendingTextSaves.current.values()]
    pendingTextSaves.current.clear()

    for (const pendingSave of pendingSaves) {
      window.clearTimeout(pendingSave.timer)
      queueAnswer(pendingSave.question, { valorTexto: pendingSave.value })
    }
  }

  async function finalizeAssessment() {
    if (!canFinalize || submittingRef.current) return

    submittingRef.current = true
    setSubmitting(true)
    setCompletionError(null)

    try {
      const response = await fetch(`/api/questionario/finalizar/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      const result = (await response.json()) as { completed?: boolean; error?: string }

      if (!response.ok || !result.completed) {
        throw new Error(result.error || 'Não foi possível finalizar a avaliação.')
      }

      onCompleted()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setCompletionError(
        error instanceof Error ? error.message : 'Não foi possível finalizar a avaliação.',
      )
      setConfirmationOpen(false)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AssessmentIntroduction identification={data.identification} />
      <ProgressHeader
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        progress={progress}
      />

      <section className="border-y border-[#173f3a]/10 bg-[#fffdf8]">
        {quantitativeQuestions.map((question) => (
          <QuantitativeQuestion
            key={question.id}
            question={question}
            selectedValue={quantitativeAnswers[question.numero]}
            onAnswer={saveQuantitativeAnswer}
          />
        ))}
      </section>

      <PerceptionsStep
        questions={data.questionnaire.percepcoes}
        answers={qualitativeAnswers}
        onAnswer={saveQualitativeAnswer}
      />

      <SaveStatus feedback={saveFeedback} />

      <div className="mt-6 border-t border-[#173f3a]/10 pt-6 text-center">
        <button
          type="button"
          onClick={() => {
            flushPendingTextSaves()
            setCompletionError(null)
            setConfirmationOpen(true)
          }}
          disabled={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#173f3a] px-7 text-sm font-bold tracking-[0.08em] text-white transition hover:bg-[#23534d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b27] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#9da9a6] sm:w-auto"
        >
          FINALIZAR AVALIAÇÃO
        </button>
        {completionError && <p className="mt-4 text-sm text-[#9a4935]" role="alert">{completionError}</p>}
      </div>

      {confirmationOpen && (
        <CompletionDialog
          unansweredCount={unansweredCount}
          saveFeedback={saveFeedback}
          submitting={submitting}
          onClose={() => setConfirmationOpen(false)}
          onFinalize={() => void finalizeAssessment()}
        />
      )}
    </div>
  )
}

function AssessmentIntroduction({ identification }: { identification: PublicIdentification }) {
  const isSelfAssessment = identification.relacao === 'Autoavaliação'

  return (
    <section className="mb-7 border-b border-[#173f3a]/10 pb-7">
      <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#173f3a] sm:text-3xl">
        Olá, {isSelfAssessment ? identification.avaliado : identification.avaliador}.
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[#4f6561] sm:text-lg">
        {isSelfAssessment ? (
          'Esta é a sua autoavaliação. Reflita sobre sua própria atuação e responda de acordo com a sua percepção.'
        ) : (
          <>
            Sua percepção contribuirá para o desenvolvimento de{' '}
            <strong className="font-semibold text-[#173f3a]">{identification.avaliado}</strong>.
          </>
        )}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#71817e]">Este link é individual e intransferível.</p>
      <p className="mt-5 text-sm leading-6 text-[#4f6561]">
        Para cada afirmação, selecione uma nota de 1 a 10 ou N/A quando não se aplicar.
      </p>
      <p className="mt-3 text-xs leading-5 text-[#71817e]">
        Suas respostas serão tratadas conforme as regras de confidencialidade da avaliação.
      </p>
    </section>
  )
}

function SaveStatus({ feedback }: { feedback: SaveFeedback }) {
  return (
    <div className="mt-3 min-h-5 text-right text-xs font-medium" aria-live="polite">
      {feedback === 'saving' && <span className="text-[#60736f]">Salvando...</span>}
      {feedback === 'saved' && <span className="text-[#246555]">Salvo</span>}
      {feedback === 'error' && (
        <span className="text-[#9a4935]">Não foi possível salvar. Verifique sua conexão antes de sair.</span>
      )}
    </div>
  )
}

function ProgressHeader({
  answeredCount,
  totalQuestions,
  progress,
}: {
  answeredCount: number
  totalQuestions: number
  progress: number
}) {
  return (
    <section className="sticky top-0 z-10 -mx-4 mb-2 border-y border-[#173f3a]/10 bg-[#f5f3ec]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-4">
      <p className="text-xs font-semibold tabular-nums text-[#4f6561]">
        {answeredCount} de {totalQuestions} respondidas
      </p>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-[#173f3a]/10"
        role="progressbar"
        aria-label="Progresso do questionário"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="h-full rounded-full bg-[#b47b27] transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${progress - 100}%)` }}
        />
      </div>
    </section>
  )
}

export function PillarStep({
  pillar,
  answers,
  onAnswer,
}: {
  pillar: PublicPillar
  answers: QuantitativeAnswers
  onAnswer: (question: PublicQuestion, value: number) => void
}) {
  return (
    <section className="rounded-3xl border border-[#173f3a]/10 bg-[#fffdf8] p-5 sm:p-8">
      <div className="border-b border-[#173f3a]/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b47b27]">Pilar</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#173f3a] sm:text-4xl">
          {pillar.nome}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#60736f]">
          Avalie cada afirmação de acordo com sua percepção.
        </p>
        <div className="mt-4 rounded-2xl bg-[#f5f3ec] px-4 py-3 text-sm leading-6 text-[#4f6561]">
          <strong className="font-semibold text-[#173f3a]">Escala: N/A | 1 a 10.</strong>{' '}
          N/A significa “não se aplica” e corresponde ao valor 0. Essa opção não será considerada no cálculo das médias.
        </div>
      </div>

      <div className="mt-7 space-y-10">
        {pillar.competencias.map((competency) => (
          <section key={`${pillar.ordem}-${competency.ordem}-${competency.nome}`}>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-6 bg-[#b47b27]" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4f6561]">
                {competency.nome}
              </h2>
            </div>
            <div className="space-y-4">
              {competency.perguntas.map((question) => (
                <QuantitativeQuestion
                  key={question.numero}
                  question={question}
                  selectedValue={answers[question.numero]}
                  onAnswer={onAnswer}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

function QuantitativeQuestion({
  question,
  selectedValue,
  onAnswer,
}: {
  question: PublicQuestion
  selectedValue?: number
  onAnswer: (question: PublicQuestion, value: number) => void
}) {
  return (
    <fieldset className="border-b border-[#173f3a]/10 px-1 py-5 last:border-b-0 sm:px-4 sm:py-6">
      <legend className="w-full px-0 text-left">
        <span className="mr-3 inline-block w-6 text-xs font-bold tabular-nums text-[#b47b27]">
          {String(question.numero).padStart(2, '0')}
        </span>
        <span className="text-[15px] font-medium leading-6 text-[#203f3b]">
          {question.texto}
        </span>
      </legend>
      <div className="mt-4 grid grid-cols-4 gap-1.5 min-[420px]:grid-cols-6 sm:ml-9 sm:grid-cols-11 sm:gap-2" aria-label={`Escala da pergunta ${question.numero}`}>
        {SCALE_VALUES.map((value) => {
          const selected = selectedValue === value
          const label = value === 0 ? 'N/A' : String(value)
          return (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name={`pergunta-${question.numero}`}
                value={value}
                checked={selected}
                onChange={() => onAnswer(question, value)}
                className="peer sr-only"
                aria-label={`Pergunta ${question.numero}: ${value === 0 ? 'não se aplica' : value}`}
              />
              <span
                className={`flex min-h-10 items-center justify-center rounded-lg border px-1 text-sm font-semibold tabular-nums transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#b47b27] peer-focus-visible:ring-offset-2 ${
                  selected
                    ? 'border-[#173f3a] bg-[#173f3a] text-white shadow-[inset_0_0_0_2px_#f4c96b]'
                    : 'border-[#173f3a]/20 bg-[#fffdf8] text-[#385550] hover:border-[#173f3a]/50 hover:bg-[#f5f3ec]'
                }`}
              >
                {selected && <Check className="mr-0.5 size-3.5" strokeWidth={3} aria-hidden="true" />}
                {label}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function PerceptionsStep({
  questions,
  answers,
  onAnswer,
}: {
  questions: PublicQuestion[]
  answers: QualitativeAnswers
  onAnswer: (question: PublicQuestion, value: string) => void
}) {
  return (
    <section className="mt-8 border-t border-[#173f3a]/10 pt-7">
      <div className="space-y-7">
        {questions.map((question) => (
          <div key={question.numero}>
            <label htmlFor={`percepcao-${question.numero}`} className="block text-base font-semibold leading-6 text-[#203f3b]">
              {question.numero === 33 ? 'Pontos fortes' : 'Pontos de melhoria'}
              <span className="ml-2 text-xs font-medium text-[#71817e]">Q{question.numero} · opcional</span>
            </label>
            <p className="mt-1 text-sm leading-6 text-[#60736f]">{question.texto}</p>
            <textarea
              id={`percepcao-${question.numero}`}
              value={answers[question.numero] ?? ''}
              onChange={(event) => onAnswer(question, event.target.value)}
              rows={5}
              className="mt-3 w-full resize-y rounded-lg border border-[#173f3a]/20 bg-white px-4 py-3 text-base leading-6 text-[#203f3b] outline-none transition placeholder:text-[#879692] focus:border-[#b47b27] focus:ring-2 focus:ring-[#b47b27]/25"
              placeholder="Escreva sua percepção"
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function CompletionDialog({
  unansweredCount,
  saveFeedback,
  submitting,
  onClose,
  onFinalize,
}: {
  unansweredCount: number
  saveFeedback: SaveFeedback
  submitting: boolean
  onClose: () => void
  onFinalize: () => void
}) {
  const hasUnansweredQuestions = unansweredCount > 0
  const canFinalize = saveFeedback === 'saved' && !submitting

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#102d29]/65 px-4 py-8 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#fffdf8] p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-finalizacao-titulo"
      >
        <div className="flex items-start justify-between gap-5">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e3eee8] text-[#246555]">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid size-10 place-items-center rounded-full text-[#60736f] transition hover:bg-[#173f3a]/5 hover:text-[#173f3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b27] disabled:opacity-40"
            aria-label="Fechar confirmação"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <h2 id="confirmar-finalizacao-titulo" className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#173f3a]">
          {hasUnansweredQuestions ? 'Finalizar com respostas em branco?' : 'Confirmar finalização?'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#60736f]">
          {hasUnansweredQuestions
            ? `Há ${unansweredCount} pergunta(s) sem resposta. Deseja finalizar mesmo assim?`
            : 'Após concluir, as respostas serão registradas definitivamente e este link não permitirá novas alterações.'}
        </p>
        {saveFeedback !== 'saved' && (
          <p className={`mt-4 text-xs leading-5 ${saveFeedback === 'error' ? 'text-[#9a4935]' : 'text-[#60736f]'}`}>
            {saveFeedback === 'error'
              ? 'Não foi possível salvar uma ou mais respostas. Verifique sua conexão antes de finalizar.'
              : 'Aguardando o salvamento automático das respostas...'}
          </p>
        )}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#173f3a]/20 px-5 text-sm font-semibold text-[#173f3a] transition hover:bg-[#173f3a]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b27] disabled:opacity-40"
          >
            Voltar e revisar
          </button>
          <button
            type="button"
            onClick={onFinalize}
            disabled={!canFinalize}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#173f3a] px-5 text-sm font-semibold text-white transition hover:bg-[#23534d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b27] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#9da9a6]"
          >
            {submitting ? (
              <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Finalizando...</>
            ) : hasUnansweredQuestions ? 'Finalizar mesmo assim' : 'Finalizar avaliação'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ReviewScreen({
  questionnaire,
  identification,
  license,
  quantitativeAnswers,
  qualitativeAnswers,
  saveFeedback,
  token,
  onCompleted,
  onBack,
}: {
  questionnaire: PublicQuestionnaire
  identification: PublicIdentification
  license: PublicLicense
  quantitativeAnswers: QuantitativeAnswers
  qualitativeAnswers: QualitativeAnswers
  saveFeedback: SaveFeedback
  token: string
  onCompleted: () => void
  onBack: () => void
}) {
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completionError, setCompletionError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const quantitativeQuestions = questionnaire.pilares.flatMap((pillar) =>
    pillar.competencias.flatMap((competency) => competency.perguntas),
  )
  const answeredCount = quantitativeQuestions.filter((question) =>
    Object.prototype.hasOwnProperty.call(quantitativeAnswers, question.numero),
  ).length
  const answeredQualitativeCount = questionnaire.percepcoes.filter((question) =>
    Object.prototype.hasOwnProperty.call(qualitativeAnswers, question.numero),
  ).length
  const unansweredCount =
    quantitativeQuestions.length + questionnaire.percepcoes.length - answeredCount - answeredQualitativeCount
  const hasUnansweredQuestions = unansweredCount > 0
  const canFinalize = saveFeedback === 'saved' && !submitting

  async function finalizeAssessment() {
    if (!canFinalize || submittingRef.current) return

    submittingRef.current = true
    setSubmitting(true)
    setCompletionError(null)

    try {
      const response = await fetch(`/api/questionario/finalizar/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      const result = (await response.json()) as { completed?: boolean; error?: string }

      if (!response.ok || !result.completed) {
        throw new Error(result.error || 'Não foi possível finalizar a avaliação.')
      }

      onCompleted()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setCompletionError(
        error instanceof Error ? error.message : 'Não foi possível finalizar a avaliação.',
      )
      setConfirmationOpen(false)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-[#173f3a]/10 bg-[#fffdf8] p-5 sm:p-9">
      <div className="flex flex-col gap-5 border-b border-[#173f3a]/10 pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b47b27]">Revisão local</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#173f3a]">Revise antes de finalizar</h1>
          <p className="mt-3 text-sm text-[#60736f]">
            Avaliado(a): <strong className="font-semibold text-[#173f3a]">{identification.avaliado}</strong> • {identification.relacao}
          </p>
        </div>
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e3eee8] text-[#246555]">
          <ClipboardCheck className="size-6" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-7 space-y-3">
        {questionnaire.pilares.map((pillar) => {
          const questions = pillar.competencias.flatMap((competency) => competency.perguntas)
          const answered = questions.filter((question) =>
            Object.prototype.hasOwnProperty.call(quantitativeAnswers, question.numero),
          ).length
          return (
            <div key={pillar.ordem} className="flex items-center justify-between gap-4 rounded-2xl border border-[#173f3a]/10 bg-white px-4 py-3.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-[#246555]" aria-hidden="true" />
                <span className="font-medium text-[#203f3b]">{pillar.nome}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-[#60736f]">{answered}/{questions.length}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#e3eee8] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#246555]">Questões quantitativas</p>
          <p className="mt-2 text-lg font-semibold text-[#173f3a]">{answeredCount} de {quantitativeQuestions.length} respondidas</p>
        </div>
        <div className="rounded-2xl bg-[#f5f3ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#60736f]">Questões qualitativas</p>
          <p className="mt-2 text-lg font-semibold text-[#173f3a]">{answeredQualitativeCount} de {questionnaire.percepcoes.length} respondidas</p>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-[#b47b27]/25 bg-[#fff8e8] p-4 text-sm leading-6 text-[#76561f]">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>Suas respostas ficam salvas automaticamente enquanto você preenche a avaliação.</p>
        </div>
      </div>

      <SaveStatus feedback={saveFeedback} />

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#173f3a]/20 px-5 text-sm font-semibold text-[#173f3a] transition hover:bg-[#173f3a]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b27]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar e revisar
        </button>
        <div className="sm:text-right">
          <button
            type="button"
            onClick={() => {
              setCompletionError(null)
              setConfirmationOpen(true)
            }}
            disabled={!canFinalize}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173f3a] px-6 text-sm font-semibold text-white transition hover:bg-[#23534d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b27] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#9da9a6] sm:w-auto"
          >
            Finalizar avaliação
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </button>
          {saveFeedback === 'saving' && (
            <p className="mt-2 max-w-xs text-xs leading-5 text-[#60736f]">
              Aguarde o término do salvamento automático.
            </p>
          )}
          {saveFeedback === 'error' && (
            <p className="mt-2 max-w-xs text-xs leading-5 text-[#9a4935]">
              Corrija o erro de salvamento antes de finalizar.
            </p>
          )}
        </div>
      </div>
      {completionError && (
        <p className="mt-5 rounded-2xl border border-[#9a4935]/20 bg-[#f8e6df] px-4 py-3 text-sm text-[#8a3e2c]" role="alert">
          {completionError}
        </p>
      )}
      <p className="mt-7 border-t border-[#173f3a]/10 pt-5 text-center text-xs text-[#60736f]">
        Feedback Compass Rose · Ferramenta licenciada para uso de: {license.consultor}
      </p>

      {confirmationOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#102d29]/65 px-4 py-8 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#fffdf8] p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-finalizacao-titulo"
          >
            <div className="flex items-start justify-between gap-5">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e3eee8] text-[#246555]">
                <LockKeyhole className="size-6" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setConfirmationOpen(false)}
                disabled={submitting}
                className="grid size-10 place-items-center rounded-full text-[#60736f] transition hover:bg-[#173f3a]/5 hover:text-[#173f3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b27] disabled:opacity-40"
                aria-label="Fechar confirmação"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <h2 id="confirmar-finalizacao-titulo" className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#173f3a]">
              {hasUnansweredQuestions ? 'Finalizar com respostas em branco?' : 'Confirmar finalização?'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#60736f]">
              {hasUnansweredQuestions
                ? `Há ${unansweredCount} pergunta(s) sem resposta. Todas as questões contribuem para a qualidade da avaliação. Deseja finalizar mesmo assim?`
                : 'Após concluir, as respostas serão registradas definitivamente e este link não permitirá novas alterações.'}
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmationOpen(false)}
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#173f3a]/20 px-5 text-sm font-semibold text-[#173f3a] transition hover:bg-[#173f3a]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b27] disabled:opacity-40"
              >
                {hasUnansweredQuestions ? 'Voltar e revisar' : 'Continuar revisando'}
              </button>
              <button
                type="button"
                onClick={() => void finalizeAssessment()}
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#173f3a] px-5 text-sm font-semibold text-white transition hover:bg-[#23534d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b47b27] focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-[#60736f]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {hasUnansweredQuestions ? 'Finalizar mesmo assim' : 'Sim, finalizar avaliação'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
