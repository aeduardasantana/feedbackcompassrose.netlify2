import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Asterisk,
  Check,
  ChevronRight,
  CircleDot,
  Eye,
  Fingerprint,
  Layers3,
  LockKeyhole,
  Menu,
  MoveUpRight,
  Orbit,
  Quote,
  Sparkles,
  Target,
  X,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: 'Feedback Compass Rose | Avaliação 360º de Liderança',
      },
      {
        name: 'description',
        content:
          'Avaliação 360º especializada em revelar como uma liderança é percebida por diferentes perspectivas e oferecer uma visão estruturada do seu contexto atual.',
      },
    ],
  }),
  component: LandingPage,
})

const navigation = [
  { label: 'A Avaliação', href: '#a-avaliacao' },
  { label: 'Por que 360º', href: '#por-que-360' },
  { label: 'O que observamos', href: '#o-que-observamos' },
  { label: 'Resultado', href: '#resultado' },
  { label: 'Contato', href: '#contato' },
]

const contextMoments = [
  'ciclos contínuos de desenvolvimento',
  'novas responsabilidades',
  'mudanças de equipe',
  'transições profissionais',
  'preparação para novos desafios',
  'revisões periódicas da atuação',
  'momentos de ampliação da consciência sobre a própria liderança',
]

const perspectives = [
  'pontos de convergência',
  'diferenças de percepção',
  'padrões recorrentes',
  'forças reconhecidas',
  'aspectos que merecem maior atenção',
]

const foundations = [
  {
    number: '01',
    title: 'Perspectivas qualificadas',
    text: 'A qualidade da leitura começa por considerar pessoas que realmente vivenciam aquela liderança.',
    icon: Eye,
  },
  {
    number: '02',
    title: 'Observação estruturada',
    text: 'As percepções são orientadas por critérios consistentes, evitando uma coleção de opiniões soltas.',
    icon: Target,
  },
  {
    number: '03',
    title: 'Confidencialidade',
    text: 'O desenho da aplicação favorece contribuições autênticas e protege a natureza confidencial do feedback.',
    icon: LockKeyhole,
  },
  {
    number: '04',
    title: 'Leitura integrada',
    text: 'O valor surge quando diferentes perspectivas são observadas em conjunto, não em respostas isoladas.',
    icon: Layers3,
  },
]

const territories = [
  {
    title: 'Direção e execução',
    text: 'Como transforma intenção em ação, estabelece prioridades e conduz responsabilidades.',
  },
  {
    title: 'Relação com pessoas',
    text: 'Como influencia, comunica, desenvolve relações e exerce sua presença como líder.',
  },
  {
    title: 'Comprometimento',
    text: 'Como responde a responsabilidades, adversidades e exigências do contexto.',
  },
  {
    title: 'Confiança e coerência',
    text: 'Como atitudes, decisões e relações contribuem para a percepção de credibilidade.',
  },
]

const journey = [
  {
    step: 'Contextualizar',
    text: 'Definir a liderança que será observada e as relações relevantes para aquela avaliação.',
  },
  {
    step: 'Ouvir',
    text: 'Reunir percepções individuais de forma estruturada e confidencial.',
  },
  {
    step: 'Integrar',
    text: 'Organizar diferentes perspectivas para identificar padrões e diferenças relevantes.',
  },
  {
    step: 'Compreender',
    text: 'Transformar o conjunto das percepções em uma leitura estruturada da liderança.',
  },
]

const reflectionQuestions = [
  'O líder se percebe da mesma maneira que é percebido?',
  'Quais características de sua liderança são reconhecidas de forma consistente?',
  'Onde existem diferenças relevantes entre intenção e impacto percebido?',
  'Existem aspectos percebidos de maneira diferente conforme a relação profissional?',
  'Quais comportamentos parecem mais consolidados?',
  'Quais pontos merecem uma observação mais cuidadosa?',
  'O que o conjunto revela que dificilmente seria percebido isoladamente?',
]

const resultItems = [
  'como o líder se percebe',
  'como é percebido por outras pessoas',
  'onde existem convergências',
  'onde surgem diferenças relevantes',
  'quais forças são reconhecidas',
  'quais aspectos merecem atenção',
  'quais temas aparecem de forma recorrente',
]

function CompassMark({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 120 120"
      fill="none"
    >
      <circle cx="60" cy="60" r="54" stroke="currentColor" strokeOpacity=".28" />
      <circle cx="60" cy="60" r="37" stroke="currentColor" strokeOpacity=".18" />
      <path d="M60 7 69 51 113 60 69 69 60 113 51 69 7 60 51 51 60 7Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="m60 18 6 36-6 6-6-6 6-36Z" fill="currentColor" />
      <path d="m102 60-36 6-6-6 6-6 36 6Z" fill="currentColor" fillOpacity=".5" />
      <path d="m60 102-6-36 6-6 6 6-6 36Z" fill="currentColor" fillOpacity=".28" />
      <path d="m18 60 36-6 6 6-6 6-36-6Z" fill="currentColor" fillOpacity=".14" />
      <circle cx="60" cy="60" r="6" fill="#F8F3EA" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9b5534]">
      <span className="h-px w-8 bg-[#b7683f]" />
      {children}
    </div>
  )
}

function EditorialQuote({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative border-l border-[#b7683f] py-2 pl-7 sm:pl-9">
      <Quote className="absolute -left-3 -top-4 size-6 bg-[#f4efe6] p-1 text-[#b7683f]" />
      <p className="font-serif text-2xl leading-snug text-[#132a32] sm:text-3xl">
        {children}
      </p>
    </div>
  )
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4efe6] text-[#18323a]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0b252d]/95 text-white shadow-[0_10px_40px_rgba(4,20,25,0.14)] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#inicio" className="group flex items-center gap-3" aria-label="Compass Rose Systems — início">
            <CompassMark className="size-10 text-[#d49367] transition-transform duration-500 group-hover:rotate-12" />
            <div className="leading-none">
              <span className="block font-serif text-[17px] tracking-wide">Compass Rose</span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.32em] text-white/48">Systems</span>
            </div>
          </a>

          <nav className="hidden items-center gap-7 xl:flex" aria-label="Navegação principal">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[12px] font-medium tracking-wide text-white/68 transition-colors hover:text-[#e1a176]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/80 transition-all hover:border-[#d49367]/70 hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              <LockKeyhole className="size-3.5" />
              Acesso ao Sistema
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-10 place-items-center rounded-full border border-white/15 text-white xl:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0b252d] px-5 pb-6 pt-4 xl:hidden">
            <nav className="mx-auto grid max-w-[1440px] gap-1" aria-label="Navegação mobile">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center justify-between border-b border-white/8 py-3 text-sm text-white/78"
                >
                  {item.label}
                  <ChevronRight className="size-4 text-[#d49367]" />
                </a>
              ))}
              <Link
                to="/login"
                onClick={closeMenu}
                className="mt-4 flex items-center justify-center gap-2 rounded-full border border-[#d49367]/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white"
              >
                <LockKeyhole className="size-3.5" />
                Acesso ao Sistema
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section id="inicio" className="relative min-h-[900px] overflow-hidden bg-[#0b252d] pt-[76px] text-white lg:min-h-screen">
          <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute -right-[19rem] top-20 size-[760px] rounded-full border border-[#d49367]/20 lg:-right-28" />
          <div className="absolute -right-[13rem] top-44 size-[560px] rounded-full border border-white/10 lg:right-12" />
          <div className="absolute right-[18%] top-[24%] hidden size-2 rounded-full bg-[#d49367] shadow-[0_0_28px_8px_rgba(212,147,103,.34)] lg:block" />

          <div className="relative mx-auto grid min-h-[824px] max-w-[1440px] items-center px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:py-24">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-9 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#e1a176]">
                <span className="h-px w-10 bg-[#d49367]" />
                Feedback Compass Rose
              </div>
              <h1 className="max-w-[860px] font-serif text-[clamp(3.55rem,7.7vw,7.8rem)] leading-[0.88] tracking-[-0.045em] text-[#fffaf2]">
                Veja a liderança por todos os <span className="italic text-[#d49367]">ângulos.</span>
              </h1>
              <div className="mt-10 grid max-w-2xl gap-7 border-l border-[#d49367]/55 pl-6 sm:pl-9">
                <p className="text-lg leading-relaxed text-white/82 sm:text-xl">
                  Uma Avaliação 360º especializada em transformar diferentes percepções sobre uma liderança em uma visão estruturada do seu contexto atual.
                </p>
                <p className="max-w-xl text-sm leading-7 text-white/52 sm:text-base">
                  Porque compreender uma liderança exige mais do que conhecer suas intenções ou observar seus resultados. É preciso entender como ela é percebida nas relações em que acontece.
                </p>
              </div>
              <div className="mt-11 flex flex-wrap items-center gap-5">
                <a
                  href="#a-avaliacao"
                  className="group inline-flex items-center gap-4 rounded-full bg-[#c7794d] px-7 py-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(183,104,63,.25)] transition-all hover:-translate-y-0.5 hover:bg-[#d1875a]"
                >
                  Conheça o Feedback Compass Rose
                  <ArrowDown className="size-4 transition-transform group-hover:translate-y-1" />
                </a>
                <span className="text-xs uppercase tracking-[0.2em] text-white/35">Avaliação 360º de Liderança</span>
              </div>
            </div>

            <div className="relative mt-12 flex min-h-[420px] items-center justify-center lg:mt-0 lg:min-h-[680px]">
              <div className="absolute size-[min(78vw,600px)] rounded-full border border-white/10" />
              <div className="absolute size-[min(58vw,430px)] rounded-full border border-[#d49367]/20" />
              <CompassMark className="relative z-10 size-[min(70vw,520px)] text-[#d49367] drop-shadow-[0_30px_80px_rgba(0,0,0,.22)] [animation:compass-drift_14s_ease-in-out_infinite]" />
              <div className="absolute left-[8%] top-[18%] hidden w-44 border-t border-white/20 pt-3 text-[10px] uppercase tracking-[0.24em] text-white/40 sm:block">
                Intenção
              </div>
              <div className="absolute bottom-[20%] right-[3%] hidden w-44 border-t border-[#d49367]/40 pt-3 text-right text-[10px] uppercase tracking-[0.24em] text-[#d49367]/70 sm:block">
                Impacto percebido
              </div>
            </div>
          </div>
        </section>

        <section id="a-avaliacao" className="relative px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="mx-auto grid max-w-[1280px] gap-16 lg:grid-cols-[.85fr_1.15fr] lg:gap-24">
            <div>
              <SectionLabel>Uma liderança, mais de uma verdade percebida</SectionLabel>
              <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#102a32] sm:text-5xl lg:text-6xl">
                A liderança acontece na relação com outras pessoas.
              </h2>
            </div>
            <div className="grid content-start gap-7 text-base leading-8 text-[#40565c] sm:text-lg">
              <p>O líder conhece suas próprias intenções, decisões, dificuldades e prioridades.</p>
              <p>As pessoas ao seu redor experimentam outra dimensão: seus comportamentos, sua comunicação, sua presença, sua forma de conduzir situações e o impacto que gera nas relações profissionais.</p>
              <p>Essas percepções podem confirmar aquilo que o líder já reconhece. Também podem revelar diferenças que passariam despercebidas em uma análise unilateral.</p>
              <div className="mt-5">
                <EditorialQuote>A riqueza da Avaliação 360º está justamente em ampliar o campo de visão.</EditorialQuote>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#d9d1c3] px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="absolute -right-28 -top-28 size-96 rounded-full border border-[#17323a]/10" />
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-14 lg:grid-cols-[1.15fr_.85fr] lg:gap-24">
              <div>
                <SectionLabel>O contexto muda. A leitura também.</SectionLabel>
                <h2 className="max-w-3xl font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#102a32] sm:text-5xl lg:text-7xl">
                  Liderança não é uma fotografia permanente.
                </h2>
              </div>
              <div className="space-y-6 text-base leading-8 text-[#40565c] sm:text-lg">
                <p>Uma liderança pode ser altamente efetiva em determinado contexto e encontrar novos desafios diante de outra equipe, outra organização, novas responsabilidades ou mudanças nas relações ao redor.</p>
                <p>Por isso, compreender a liderança exige observar o momento atual. O Feedback Compass Rose cria uma leitura contextual da forma como essa liderança está sendo percebida agora.</p>
              </div>
            </div>

            <div className="mt-20 grid border-y border-[#17323a]/15 sm:grid-cols-2 lg:grid-cols-4">
              {contextMoments.map((moment, index) => (
                <div
                  key={moment}
                  className={`flex min-h-32 items-start gap-4 border-[#17323a]/15 py-7 sm:px-6 ${index % 2 === 0 ? 'sm:border-r' : ''} ${index < 4 ? 'lg:border-r' : ''}`}
                >
                  <span className="mt-1 font-serif text-sm italic text-[#a45d39]">0{index + 1}</span>
                  <p className="text-sm leading-6 text-[#29434a]">{moment}</p>
                </div>
              ))}
              <div className="flex min-h-32 items-center bg-[#17323a] px-7 py-6 text-[#f8f3ea] lg:col-span-1">
                <p className="font-serif text-xl leading-snug italic">O momento atual também é parte da liderança.</p>
              </div>
            </div>

            <p className="mt-14 max-w-4xl font-serif text-2xl leading-snug text-[#102a32] sm:text-3xl">
              Não importa apenas onde o líder esteve. Importa compreender como sua liderança está sendo vivida hoje.
            </p>
          </div>
        </section>

        <section id="por-que-360" className="bg-[#102a32] px-5 py-28 text-white sm:px-8 lg:px-12 lg:py-40">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid items-start gap-14 lg:grid-cols-[.85fr_1.15fr] lg:gap-24">
              <div className="relative hidden min-h-[520px] lg:block">
                <div className="absolute left-0 top-10 size-72 rounded-full border border-white/15" />
                <div className="absolute left-36 top-36 size-72 rounded-full border border-[#d49367]/45" />
                <div className="absolute left-16 top-64 size-72 rounded-full border border-white/10" />
                <div className="absolute left-[13.5rem] top-[13.5rem] size-8 rounded-full border border-[#d49367] [animation:compass-pulse_4s_ease-in-out_infinite]" />
                <span className="absolute left-8 top-3 text-[10px] uppercase tracking-[0.26em] text-white/40">Autopercepção</span>
                <span className="absolute left-[23rem] top-32 text-[10px] uppercase tracking-[0.26em] text-[#d49367]/80">Outras perspectivas</span>
                <span className="absolute left-24 top-[36rem] text-[10px] uppercase tracking-[0.26em] text-white/40">Contexto</span>
              </div>
              <div>
                <SectionLabel>Por que 360º?</SectionLabel>
                <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#fffaf2] sm:text-5xl lg:text-6xl">
                  Uma única perspectiva não é suficiente para compreender uma liderança.
                </h2>
                <div className="mt-10 space-y-6 text-base leading-8 text-white/62 sm:text-lg">
                  <p>A autopercepção é necessária, mas não revela sozinha o impacto da liderança. Da mesma forma, a percepção de uma única pessoa representa apenas um recorte.</p>
                  <p>O Feedback Compass Rose amplia essa visão ao reunir percepções de pessoas que convivem com a liderança a partir de relações profissionais distintas.</p>
                </div>
                <div className="mt-10 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {perspectives.map((item) => (
                    <div key={item} className="flex items-center gap-3 border-b border-white/10 py-3 text-sm text-white/78">
                      <CircleDot className="size-3.5 text-[#d49367]" />
                      {item}
                    </div>
                  ))}
                </div>
                <p className="mt-11 border-l border-[#d49367] pl-6 font-serif text-2xl leading-snug text-[#fffaf2] sm:text-3xl">
                  O objetivo não é determinar quem tem razão. É compreender o que o conjunto das percepções revela.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-24">
              <div>
                <SectionLabel>Qualidade da aplicação</SectionLabel>
                <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#102a32] sm:text-5xl lg:text-6xl">
                  Avaliação 360º não é simplesmente perguntar o que as pessoas pensam.
                </h2>
              </div>
              <div className="space-y-5 text-base leading-8 text-[#40565c] sm:text-lg">
                <p>Uma aplicação de qualidade exige método. As perspectivas e as perguntas precisam ser relevantes. As pessoas precisam ter segurança para responder.</p>
                <p>E as respostas precisam ser consolidadas para que diferentes opiniões se transformem em uma leitura útil, sem transformar o processo em exposição individual.</p>
              </div>
            </div>

            <div className="mt-20 border-t border-[#17323a]/15">
              {foundations.map((foundation) => (
                <div key={foundation.number} className="group grid gap-5 border-b border-[#17323a]/15 py-8 transition-colors hover:bg-white/35 sm:grid-cols-[80px_1fr_1fr_48px] sm:items-center sm:px-5 lg:py-10">
                  <span className="font-serif text-sm italic text-[#a45d39]">{foundation.number}</span>
                  <h3 className="font-serif text-2xl text-[#102a32] sm:text-3xl">{foundation.title}</h3>
                  <p className="max-w-lg text-sm leading-7 text-[#52666b]">{foundation.text}</p>
                  <foundation.icon className="size-6 text-[#b7683f] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
                </div>
              ))}
            </div>

            <div className="mt-16 flex justify-end">
              <EditorialQuote>Uma boa Avaliação 360º não acumula opiniões. Ela transforma percepções em clareza.</EditorialQuote>
            </div>
          </div>
        </section>

        <section id="o-que-observamos" className="relative overflow-hidden bg-[#e7dfd2] px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <CompassMark className="absolute -right-28 top-10 size-[500px] text-[#17323a]/[0.04]" />
          <div className="relative mx-auto max-w-[1280px]">
            <div className="max-w-4xl">
              <SectionLabel>O que a avaliação busca compreender</SectionLabel>
              <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#102a32] sm:text-5xl lg:text-7xl">
                Uma visão ampla sobre a forma como a liderança é exercida e percebida.
              </h2>
              <p className="mt-8 max-w-2xl text-base leading-8 text-[#52666b] sm:text-lg">O Feedback Compass Rose observa diferentes aspectos que, em conjunto, ajudam a compreender a atuação do líder.</p>
            </div>

            <div className="mt-20 grid gap-px overflow-hidden border border-[#17323a]/15 bg-[#17323a]/15 md:grid-cols-2">
              {territories.map((territory, index) => (
                <div key={territory.title} className="relative min-h-64 bg-[#e7dfd2] p-8 sm:p-10 lg:p-12">
                  <span className="absolute right-8 top-7 font-serif text-6xl text-[#17323a]/[0.06]">0{index + 1}</span>
                  <Asterisk className="mb-12 size-5 text-[#b7683f]" />
                  <h3 className="font-serif text-3xl text-[#102a32]">{territory.title}</h3>
                  <p className="mt-4 max-w-md text-sm leading-7 text-[#52666b]">{territory.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-14 max-w-4xl font-serif text-2xl leading-snug text-[#102a32] sm:text-3xl">A proposta não é reduzir uma liderança a uma nota. É criar diferentes pontos de observação sobre aquilo que ela representa no contexto atual.</p>
          </div>
        </section>

        <section className="bg-[#f8f4ec] px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-24">
              <div>
                <SectionLabel>Como a avaliação acontece</SectionLabel>
                <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#102a32] sm:text-5xl lg:text-6xl">Uma experiência simples para quem participa. Uma leitura profunda no resultado.</h2>
              </div>
              <div className="lg:pt-10">
                {journey.map((item, index) => (
                  <div key={item.step} className="relative grid grid-cols-[54px_1fr] gap-5 pb-10 last:pb-0">
                    {index < journey.length - 1 && <span className="absolute bottom-0 left-[26px] top-12 w-px bg-[#b7683f]/25" />}
                    <div className="relative z-10 grid size-[54px] place-items-center rounded-full border border-[#b7683f]/35 bg-[#f8f4ec] font-serif text-sm italic text-[#a45d39]">0{index + 1}</div>
                    <div className="pt-1">
                      <h3 className="font-serif text-2xl text-[#102a32] sm:text-3xl">{item.step}</h3>
                      <p className="mt-3 max-w-lg text-sm leading-7 text-[#52666b]">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#b7683f] px-5 py-28 text-white sm:px-8 lg:px-12 lg:py-36">
          <div className="mx-auto grid max-w-[1280px] gap-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-24">
            <div>
              <div className="mb-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65"><span className="h-px w-8 bg-white/60" />Percepção objetiva e profundidade qualitativa</div>
              <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">Números ajudam a comparar. Percepções ajudam a compreender.</h2>
              <p className="mt-8 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">A avaliação combina formas estruturadas de observação com espaço para percepções que ajudam a contextualizar aquilo que os números sozinhos não explicam. Essa combinação permite identificar tendências sem perder a riqueza das experiências reais vividas ao redor da liderança.</p>
            </div>
            <div className="relative min-h-[390px]">
              <div className="absolute inset-0 rounded-full border border-white/20" />
              <div className="absolute inset-[13%] rounded-full border border-white/20" />
              <div className="absolute inset-[27%] rounded-full border border-white/20" />
              <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
              <div className="absolute left-0 top-1/2 h-px w-full bg-white/20" />
              <div className="absolute left-[67%] top-[31%] size-4 rounded-full bg-white shadow-[0_0_30px_10px_rgba(255,255,255,.24)]" />
              <div className="absolute bottom-[15%] left-[22%] size-2 rounded-full bg-[#17323a]" />
              <p className="absolute inset-x-[12%] top-1/2 -translate-y-1/2 bg-[#b7683f] px-6 py-5 text-center font-serif text-2xl leading-snug sm:text-3xl">O resultado ganha valor quando oferece contexto para compreender as diferenças.</p>
            </div>
          </div>
        </section>

        <section className="bg-[#102a32] px-5 py-28 text-white sm:px-8 lg:px-12 lg:py-40">
          <div className="mx-auto max-w-[1280px]">
            <div className="max-w-4xl">
              <SectionLabel>O que pode se tornar visível</SectionLabel>
              <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#fffaf2] sm:text-5xl lg:text-7xl">Algumas respostas aparecem apenas quando diferentes perspectivas são colocadas lado a lado.</h2>
            </div>
            <div className="mt-20 grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2">
              {reflectionQuestions.map((question, index) => (
                <div key={question} className={`group flex min-h-52 flex-col justify-between bg-[#102a32] p-7 transition-colors hover:bg-[#173941] sm:p-9 ${index === reflectionQuestions.length - 1 ? 'md:col-span-2' : ''}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d49367]">Pergunta 0{index + 1}</span>
                  <div className="flex items-end justify-between gap-6">
                    <p className="max-w-2xl font-serif text-2xl leading-snug text-white/88 sm:text-3xl">{question}</p>
                    <MoveUpRight className="size-5 shrink-0 text-white/20 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#d49367]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="resultado" className="relative overflow-hidden bg-[#f4efe6] px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="mx-auto grid max-w-[1280px] gap-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-24">
            <div>
              <SectionLabel>Resultado</SectionLabel>
              <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#102a32] sm:text-5xl lg:text-7xl">Mais do que resultados. Uma leitura da liderança.</h2>
              <p className="mt-8 text-base leading-8 text-[#52666b] sm:text-lg">Ao final da aplicação, diferentes perspectivas deixam de ser respostas isoladas e passam a compor uma visão estruturada do contexto atual da liderança.</p>
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {resultItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-6 text-[#40565c]"><Check className="mt-1 size-4 shrink-0 text-[#b7683f]" />{item}</div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[570px] rounded-[2px] bg-[#e5ded2] p-5 shadow-[0_35px_90px_rgba(23,50,58,.14)] sm:p-8">
              <div className="absolute -right-8 -top-8 hidden size-28 border-r border-t border-[#b7683f] sm:block" />
              <div className="h-full min-h-[510px] border border-[#17323a]/10 bg-[#f8f4ec] p-6 sm:p-9">
                <div className="flex items-center justify-between border-b border-[#17323a]/10 pb-6">
                  <div><p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a45d39]">Síntese analítica</p><p className="mt-2 font-serif text-2xl text-[#102a32]">Contexto atual da liderança</p></div>
                  <CompassMark className="size-14 text-[#b7683f]" />
                </div>
                <div className="mt-8 grid gap-7 sm:grid-cols-[.95fr_1.05fr]">
                  <div className="relative aspect-square rounded-full border border-[#17323a]/15">
                    <div className="absolute inset-[15%] rounded-full border border-[#17323a]/10" />
                    <div className="absolute inset-[31%] rounded-full border border-[#17323a]/10" />
                    <div className="absolute left-1/2 top-0 h-full w-px bg-[#17323a]/10" />
                    <div className="absolute left-0 top-1/2 h-px w-full bg-[#17323a]/10" />
                    <svg className="absolute inset-[8%] size-[84%]" viewBox="0 0 100 100" fill="none"><path d="M50 8 83 32 75 75 43 90 17 66 23 28 50 8Z" fill="#b7683f" fillOpacity=".16" stroke="#b7683f" strokeWidth="1.5" /><path d="M50 22 72 38 67 66 45 76 29 61 34 36 50 22Z" fill="#17323a" fillOpacity=".1" stroke="#17323a" strokeOpacity=".45" /></svg>
                    <div className="absolute left-[78%] top-[25%] size-2 rounded-full bg-[#b7683f]" />
                  </div>
                  <div className="space-y-5">
                    {[72, 88, 61, 79].map((value, index) => (
                      <div key={value}>
                        <div className="mb-2 flex justify-between text-[9px] uppercase tracking-[0.18em] text-[#52666b]"><span>Perspectiva 0{index + 1}</span><span>{value}</span></div>
                        <div className="h-1.5 bg-[#17323a]/8"><div className="h-full bg-[#b7683f]" style={{ width: `${value}%` }} /></div>
                      </div>
                    ))}
                    <div className="mt-7 border-l border-[#b7683f] pl-4"><p className="text-xs leading-6 text-[#52666b]">Convergências, contrastes e recorrências organizados para orientar uma leitura contextual.</p></div>
                  </div>
                </div>
                <div className="mt-9 grid grid-cols-3 gap-3">
                  {['Convergências', 'Diferenças', 'Recorrências'].map((label) => <div key={label} className="border-t border-[#17323a]/15 pt-3 text-[9px] uppercase tracking-[0.13em] text-[#52666b]">{label}</div>)}
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-20 max-w-[1280px] border-t border-[#17323a]/15 pt-12">
            <p className="max-w-5xl font-serif text-3xl leading-snug text-[#102a32] sm:text-4xl">O Feedback Compass Rose não define quem o líder é. Revela como sua liderança está sendo percebida naquele contexto e naquele momento.</p>
          </div>
        </section>

        <section className="bg-[#e2d9ca] px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-14 lg:grid-cols-[1.15fr_.85fr] lg:gap-24">
              <div>
                <SectionLabel>Especialização</SectionLabel>
                <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#102a32] sm:text-5xl lg:text-7xl">Criado para fazer Avaliação 360º. E fazer isso muito bem.</h2>
              </div>
              <div className="space-y-6 text-base leading-8 text-[#40565c] sm:text-lg">
                <p>Existem plataformas desenvolvidas para administrar dezenas de processos diferentes. O Feedback Compass Rose nasceu de outra escolha.</p>
                <p className="font-serif text-2xl leading-snug text-[#102a32] sm:text-3xl">Concentrar tecnologia, método e experiência em uma única finalidade: Avaliação 360º de Liderança.</p>
                <p>Isso permite uma experiência mais direta, sem obrigar quem precisa compreender uma liderança a carregar a complexidade de sistemas criados para muitas outras funções.</p>
              </div>
            </div>
            <div className="mt-20 grid items-center border border-[#17323a]/15 lg:grid-cols-[1fr_auto]">
              <p className="p-8 font-serif text-2xl leading-snug text-[#102a32] sm:p-12 sm:text-3xl">Quando uma solução se concentra em uma única finalidade, cada parte dela pode existir para servir melhor a essa finalidade.</p>
              <div className="grid size-40 place-items-center border-t border-[#17323a]/15 bg-[#17323a] text-[#d49367] lg:border-l lg:border-t-0"><Fingerprint className="size-14" /></div>
            </div>
          </div>
        </section>

        <section className="bg-[#f8f4ec] px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-4xl text-center">
              <SectionLabel>Profundidade sem complexidade desnecessária</SectionLabel>
              <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#102a32] sm:text-5xl lg:text-7xl">Rigor naquilo que importa. Simplicidade naquilo que não precisa ser complicado.</h2>
              <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-[#52666b] sm:text-lg">O Feedback Compass Rose foi concebido para proporcionar uma experiência organizada e consistente, mantendo a atenção no verdadeiro objetivo da aplicação: compreender a liderança.</p>
            </div>
            <div className="mt-20 grid gap-8 lg:grid-cols-2">
              <div className="relative overflow-hidden border border-[#17323a]/15 p-8 sm:p-12">
                <Sparkles className="mb-16 size-7 text-[#b7683f]" />
                <span className="absolute right-8 top-5 font-serif text-8xl text-[#17323a]/[0.04]">E</span>
                <h3 className="font-serif text-4xl text-[#102a32]">Eficácia</h3>
                <p className="mt-5 max-w-lg text-base leading-8 text-[#52666b]">Produzir uma leitura relevante, contextualizada e capaz de ampliar a compreensão sobre a liderança.</p>
              </div>
              <div className="relative overflow-hidden bg-[#17323a] p-8 text-white sm:p-12">
                <Orbit className="mb-16 size-7 text-[#d49367]" />
                <span className="absolute right-8 top-5 font-serif text-8xl text-white/[0.04]">E</span>
                <h3 className="font-serif text-4xl text-[#fffaf2]">Eficiência</h3>
                <p className="mt-5 max-w-lg text-base leading-8 text-white/60">Conduzir a avaliação de forma estruturada, reduzindo complexidade operacional sem sacrificar a qualidade da análise.</p>
              </div>
            </div>
            <p className="mt-14 text-center font-serif text-3xl text-[#102a32]">Menos distração. Mais foco naquilo que a Avaliação 360º precisa revelar.</p>
          </div>
        </section>

        <section className="border-y border-[#17323a]/10 bg-[#f4efe6] px-5 py-28 sm:px-8 lg:px-12 lg:py-36">
          <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[.65fr_1.35fr] lg:items-center lg:gap-24">
            <div className="flex items-center gap-6"><div className="grid size-24 shrink-0 place-items-center rounded-full border border-[#b7683f]/30"><LockKeyhole className="size-8 text-[#b7683f]" /></div><span className="h-px flex-1 bg-[#b7683f]/30" /></div>
            <div>
              <SectionLabel>Confidencialidade</SectionLabel>
              <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.03em] text-[#102a32] sm:text-5xl lg:text-6xl">Feedback de qualidade exige confiança.</h2>
              <p className="mt-8 max-w-3xl text-base leading-8 text-[#52666b] sm:text-lg">A experiência foi estruturada para favorecer contribuições sinceras e preservar a natureza confidencial das percepções compartilhadas. Os resultados são tratados de maneira consolidada, privilegiando padrões e leitura coletiva em vez da exposição individual.</p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#102a32] px-5 py-28 text-white sm:px-8 lg:px-12 lg:py-40">
          <CompassMark className="absolute -bottom-48 -right-28 size-[650px] text-white/[0.035]" />
          <div className="relative mx-auto max-w-[1280px]">
            <SectionLabel>O valor de uma fotografia bem feita</SectionLabel>
            <div className="grid gap-14 lg:grid-cols-[1.15fr_.85fr] lg:gap-24">
              <h2 className="font-serif text-5xl leading-[.98] tracking-[-0.035em] text-[#fffaf2] sm:text-6xl lg:text-8xl">Avaliar não é concluir. É enxergar melhor.</h2>
              <div className="space-y-8 text-base leading-8 text-white/62 sm:text-lg">
                <p>O papel do Feedback Compass Rose termina onde uma boa decisão começa.</p>
                <p>A ferramenta não determina o que o líder deve fazer. Ela oferece uma leitura mais ampla para que reflexões, conversas e decisões posteriores possam partir de uma compreensão melhor do contexto atual.</p>
                <p className="border-l border-[#d49367] pl-6 font-serif text-3xl text-[#fffaf2]">Primeiro, enxergar. Depois, decidir.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="contato" className="relative overflow-hidden bg-[#c7794d] px-5 py-28 text-white sm:px-8 lg:px-12 lg:py-40">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="relative mx-auto grid max-w-[1280px] items-end gap-14 lg:grid-cols-[1.2fr_.8fr] lg:gap-24">
            <div>
              <p className="mb-7 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">Feedback Compass Rose</p>
              <h2 className="font-serif text-5xl leading-[.96] tracking-[-0.035em] text-white sm:text-6xl lg:text-8xl">Veja a liderança por todos os ângulos.</h2>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/74">Conheça uma Avaliação 360º especializada em revelar como uma liderança está sendo percebida hoje.</p>
            </div>
            <div className="lg:justify-self-end">
              <a href="mailto:contato@compassrosesystems.com.br" className="group inline-flex items-center gap-5 rounded-full bg-[#102a32] px-7 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(16,42,50,.2)] transition-transform hover:-translate-y-1">Conhecer o Feedback Compass Rose<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></a>
              <div className="mt-8 space-y-2 text-sm text-white/75"><a href="tel:+551121105473" className="block transition-colors hover:text-white">(11) 2110-5473</a><a href="mailto:contato@compassrosesystems.com.br" className="block transition-colors hover:text-white">contato@compassrosesystems.com.br</a></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#071d24] px-5 pb-10 pt-16 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-12 border-b border-white/10 pb-14 md:grid-cols-[1fr_auto_auto] md:gap-16">
            <div className="flex items-start gap-4"><CompassMark className="size-14 text-[#d49367]" /><div><p className="font-serif text-2xl">Compass Rose Systems</p><p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/38">Feedback Compass Rose</p></div></div>
            <div><p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Comercial</p><a href="mailto:contato@compassrosesystems.com.br" className="block text-sm text-white/68 hover:text-white">contato@compassrosesystems.com.br</a><a href="tel:+551121105473" className="mt-2 block text-sm text-white/68 hover:text-white">(11) 2110-5473</a></div>
            <div><p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Suporte</p><a href="mailto:suporte@compassrosesystems.com.br" className="block text-sm text-white/68 hover:text-white">suporte@compassrosesystems.com.br</a><Link to="/login" className="mt-2 inline-flex items-center gap-2 text-sm text-white/68 hover:text-white">Acesso ao Sistema<ArrowRight className="size-3.5" /></Link></div>
          </div>
          <div className="flex flex-col gap-4 pt-8 text-[11px] uppercase tracking-[0.16em] text-white/28 sm:flex-row sm:items-center sm:justify-between"><p>© Compass Rose Systems. Todos os direitos reservados.</p><a href="#inicio" className="inline-flex items-center gap-2 transition-colors hover:text-white/60">Voltar ao topo<ArrowDown className="size-3 rotate-180" /></a></div>
        </div>
      </footer>
    </div>
  )
}
