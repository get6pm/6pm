import { createContext, useContext, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import type { LucideIcon } from 'lucide-react-native'
import { cn } from '../lib/utils'

interface TabsContextProps {
  activeTab: string
  setActiveTab: (id: string) => void
}
const TabsContext = createContext<TabsContextProps>({
  activeTab: '',
  // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
  setActiveTab: () => { },
})

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  onChange?: (value: string) => void
}
function Tabs({ defaultValue, children, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  const handleChange = (value: string) => {
    setActiveTab(value)
    onChange?.(value)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      {children}
    </TabsContext.Provider>
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn('flex flex-row justify-center p-1 border border-border rounded-lg', className)}
      {...props}
    />
  )
}

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
  value: string
  title: string
  textClasses?: string
  icon?: LucideIcon
}
function TabsTrigger({
  value,
  title,
  className,
  textClasses,
  icon: Icon,
  ...props
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext)

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={cn('px-3 py-2.5 flex-row gap-2 items-center justify-center rounded-md flex-1', {
        'bg-foreground': activeTab === value,
        className,
      })}
      onPress={() => setActiveTab(value)}
      {...props}
    >
      {Icon && <Icon className={cn(
        'w-5 h-5 text-muted-foreground',
        { 'text-background': activeTab === value },
        textClasses,
      )} />}
      <Text
        className={cn(
          'font-medium font-sans text-center text-muted-foreground',
          { 'text-background': activeTab === value },
          textClasses,
        )}
      >
        {title}
      </Text>
    </TouchableOpacity>
  )
}

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  value: string
}
function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { activeTab } = useContext(TabsContext)

  if (value === activeTab) {
    return (
      <View
        className={cn(
          'border border-border mt-2 px-4 py-4 rounded-xl',
          className,
        )}
        {...props}
      />
    )
  }

  return null
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
