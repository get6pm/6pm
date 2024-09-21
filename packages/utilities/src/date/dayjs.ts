import dayjsExtended from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjsExtended.extend(isoWeek)

export { dayjsExtended }
