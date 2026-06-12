/** Shimmer block using the global mp-skeleton pulse. */
export function Skeleton({
  width,
  height = 14,
  radius = 6,
  style,
}: {
  width?: number | string
  height?: number
  radius?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      className="mp-skeleton"
      style={{ width: width ?? '100%', height, borderRadius: radius, ...style }}
    />
  )
}
