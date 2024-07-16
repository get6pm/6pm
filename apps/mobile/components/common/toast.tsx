import { Toasts, toast as rntoast } from '@backpackapp-io/react-native-toast'

export function ToastRoot() {
  return (
    <Toasts
      extraInsets={{ top: -12 }}
      defaultStyle={{
        text: {
          fontFamily: 'Be Vietnam Pro',
        },
      }}
    />
  )
}

export const toast = rntoast
