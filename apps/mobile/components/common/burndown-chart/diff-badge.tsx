import { nFormatter } from '@6pm/currency'
import { t } from '@lingui/macro'
import { RoundedRect, Text, useFont } from '@shopify/react-native-skia'
import { useMemo } from 'react'

const BADGE_OFFSET = 10

type DiffBadgeProps = {
  anchorDay: number
  diffAmount: number
  point: { x: number; y: number }
}

export function DiffBadge({ anchorDay, diffAmount, point }: DiffBadgeProps) {
  const badgeFont = useFont(
    require('../../../assets/fonts/Haskoy-SemiBold.ttf'),
    16,
  )

  function getDiffText(diffAmount: number) {
    if (diffAmount > 0) {
      return t`${nFormatter(Math.abs(diffAmount), 0)} less`
    }
    return t`${nFormatter(Math.abs(diffAmount), 0)} over`
  }

  const diffTextWidth =
    badgeFont
      ?.getGlyphWidths?.(badgeFont.getGlyphIDs(getDiffText(diffAmount)))
      .reduce((sum, value) => sum + value, 0) || 0

  const activeBadgeX = useMemo(() => {
    if (anchorDay < 8) {
      return anchorDay
    }
    if (anchorDay > 26) {
      return point.x - diffTextWidth
    }
    return point.x - diffTextWidth / 2
  }, [anchorDay, diffTextWidth, point.x])

  const activeBadgeY = useMemo(() => {
    if (anchorDay < 8) {
      return point.y - 40
    }
    if (anchorDay > 26) {
      return point.y + BADGE_OFFSET
    }
    return point.y + BADGE_OFFSET
  }, [anchorDay, point.y])

  return (
    <>
      <RoundedRect
        x={activeBadgeX}
        y={activeBadgeY}
        width={diffTextWidth + 12}
        height={28}
        r={8}
        color={diffAmount > 0 ? '#16a34a' : '#ef4444'}
        opacity={0.8}
      />
      <Text
        x={activeBadgeX + 6}
        y={activeBadgeY + 20}
        font={badgeFont}
        text={getDiffText(diffAmount)}
        color="white"
      />
    </>
  )
}
