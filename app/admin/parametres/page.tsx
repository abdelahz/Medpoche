import { getAiInstructions, getPrelaunchMode } from '@/app/actions/settings'
import { DEFAULT_TUTOR_INSTRUCTIONS } from '@/lib/gemini'
import { AiInstructionsEditor } from '@/components/admin/ai-instructions-editor'
import { PrelaunchToggle } from '@/components/admin/prelaunch-toggle'

export default async function ParametresPage() {
  const [instructions, prelaunch] = await Promise.all([getAiInstructions(), getPrelaunchMode()])

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <PrelaunchToggle initial={prelaunch} />
      <AiInstructionsEditor initial={instructions} defaultValue={DEFAULT_TUTOR_INSTRUCTIONS} />
    </div>
  )
}
