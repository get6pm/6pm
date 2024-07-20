import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Text } from '../ui/text'

type UserAvatarProps = {
  user: {
    id: string
    fullName?: string | null
    imageUrl?: string
  }
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({
  user,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const shortName = user.fullName?.split(' ')[0].slice(0, 2)
  return (
    <Avatar
      alt={`${user.fullName}'s avatar`}
      className={cn('bg-muted border-2 border-card h-12 w-12', className)}
    >
      <AvatarImage
        source={{
          uri: '', // TODO: get user image
        }}
      />
      <AvatarFallback className={fallbackClassName}>
        <Text className="font-semibold uppercase leading-tight">
          {shortName}
        </Text>
      </AvatarFallback>
    </Avatar>
  )
}
