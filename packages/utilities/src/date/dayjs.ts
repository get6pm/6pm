import dayjsExtended from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

dayjsExtended.extend(quarterOfYear)

export { dayjsExtended }
