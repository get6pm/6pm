import dayjsExtended from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import 'dayjs/locale/vi'

dayjsExtended.extend(isoWeek)
dayjsExtended.extend(quarterOfYear)

export { dayjsExtended }
