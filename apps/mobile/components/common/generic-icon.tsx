import { type LucideProps, icons } from 'lucide-react-native'
import type { FC } from 'react'

/**
* TODO: Only export the icons that are used to reduce the bundle size
*/

const GenericIcon: FC<
  LucideProps & {
    name: keyof typeof icons
  }
> = ({ name, ...props }) => {
  const LucideIcon = icons[name]

  return <LucideIcon {...props} />
}

export default GenericIcon
