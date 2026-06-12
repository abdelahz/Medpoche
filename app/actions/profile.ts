'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { FILIERES } from '@/types'

type Result = { success: true } | { success: false; error: string }

/** Update the signed-in student's personal information. */
export async function updateStudentProfile(input: {
  prenom: string
  nom: string
  filiere: string | null
  phone: string | null
}): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié.' }

  const prenom = input.prenom.trim()
  const nom = input.nom.trim()
  if (!prenom || !nom) return { success: false, error: 'Le prénom et le nom sont requis.' }

  const filiere =
    input.filiere && (FILIERES as readonly string[]).includes(input.filiere) ? input.filiere : null
  const phone = input.phone?.trim() || null
  // Keep full_name in sync so the greeting/avatar/initials keep working everywhere.
  const full_name = `${prenom} ${nom}`.trim()

  const { error } = await supabase
    .from('profiles')
    .update({ prenom, nom, filiere, phone, full_name })
    .eq('id', user.id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/student/profil')
  return { success: true }
}
