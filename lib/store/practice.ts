import { create } from 'zustand'
import type { PracticeMode, PracticeQuestion } from '@/types'

interface PracticeState {
  mode: PracticeMode
  questions: PracticeQuestion[]
  index: number
  answers: Record<number, string> // mcqId -> selected letter
  revealed: boolean // current question's feedback shown (apprentissage)
  finished: boolean
  timed: boolean // année / examen blanc → show the count-up stopwatch

  start: (mode: PracticeMode, questions: PracticeQuestion[], timed?: boolean) => void
  setAnswer: (letter: string) => void
  reveal: () => void
  next: () => void
  reset: () => void
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  mode: 'apprentissage',
  questions: [],
  index: 0,
  answers: {},
  revealed: false,
  finished: false,
  timed: false,

  start: (mode, questions, timed = false) =>
    set({ mode, questions, index: 0, answers: {}, revealed: false, finished: false, timed }),

  setAnswer: (letter) => {
    const { questions, index, answers } = get()
    const q = questions[index]
    if (!q) return
    set({ answers: { ...answers, [q.id]: letter } })
  },

  reveal: () => set({ revealed: true }),

  next: () => {
    const { index, questions } = get()
    if (index < questions.length - 1) set({ index: index + 1, revealed: false })
    else set({ finished: true })
  },

  reset: () =>
    set({ questions: [], index: 0, answers: {}, revealed: false, finished: false, timed: false }),
}))
