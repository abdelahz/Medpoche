'use client'

import { useState } from 'react'
import { Sparkles, Save, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateAiInstructions } from '@/app/actions/settings'
import { Card, SectionTitle } from './primitives'
import { Button } from './button'

export function AiInstructionsEditor({
  initial,
  defaultValue,
}: {
  initial: string
  defaultValue: string
}) {
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)

  const dirty = value !== initial
  const isDefault = value.trim() === defaultValue.trim()

  async function save() {
    setSaving(true)
    const res = await updateAiInstructions(value)
    setSaving(false)
    if (res.success) {
      toast.success('Instructions enregistrées. Elles s’appliquent aux prochaines réponses.')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Card>
      <SectionTitle
        right={
          <span className="inline-flex items-center" style={{ gap: 6, color: 'var(--primary-500)' }}>
            <Sparkles size={16} />
          </span>
        }
      >
        Instructions de l’assistant IA
      </SectionTitle>

      <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: -6, marginBottom: 14, lineHeight: 1.5 }}>
        Définis la personnalité, le ton et les règles du tuteur. Le programme (matières et chapitres)
        est ajouté automatiquement — pas besoin de le réécrire ici. Les changements s’appliquent aux
        prochaines réponses.
      </p>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 340,
          resize: 'vertical',
          padding: '12px 14px',
          border: '0.5px solid var(--gray-200)',
          borderRadius: 10,
          fontSize: 13,
          lineHeight: 1.55,
          color: 'var(--gray-900)',
          background: 'var(--gray-50)',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />

      <div className="flex items-center" style={{ gap: 10, marginTop: 14 }}>
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 size={14} className="mp-spin" /> : <Save size={14} />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setValue(defaultValue)}
          disabled={saving || isDefault}
        >
          <RotateCcw size={14} />
          Réinitialiser par défaut
        </Button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)' }}>
          {value.length} caractères
        </span>
      </div>
    </Card>
  )
}
