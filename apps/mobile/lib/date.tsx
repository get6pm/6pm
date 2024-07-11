import { t } from '@lingui/macro'
import { format } from 'date-fns/format'
import { isSameYear } from 'date-fns/isSameYear'
import { isToday } from 'date-fns/isToday'
import { isTomorrow } from 'date-fns/isTomorrow'
import { isYesterday } from 'date-fns/isYesterday'

export function formatDateShort(date: Date) {
  if (isToday(date)) {
    return t`Today`
  }

  if (isYesterday(date)) {
    return t`Yesterday`
  }

  if (isTomorrow(date)) {
    return t`Tomorrow`
  }

  if (isSameYear(date, new Date())) {
    return format(date, 'MMM d')
  }

  return format(date, 'P')
}
