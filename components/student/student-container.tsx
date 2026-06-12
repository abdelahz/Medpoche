/**
 * Adaptive width wrapper for student pages. Full-width on mobile; on laptop,
 * either a comfortable reading column (chat, practice) or a wide area for
 * grid-based overviews (accueil, library, progress).
 */
export function StudentContainer({
  children,
  wide = false,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={`w-full lg:mx-auto ${wide ? 'lg:max-w-[1040px]' : 'lg:max-w-[760px]'}`}>
      {children}
    </div>
  )
}
