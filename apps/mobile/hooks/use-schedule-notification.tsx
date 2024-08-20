import { useUserSettingsStore } from '@/stores/user-settings/store'
import { useUser } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useCallback, useEffect } from 'react'

export function useScheduleNotification() {
  const { i18n } = useLingui()

  async function scheduleReminderNotification() {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: t(i18n)`Daily reminder`,
        body: t(i18n)`Time to enter your expenses!`,
        data: {
          url: '/transaction/new-record',
        },
      },
      trigger: {
        // everyday at 6pm
        hour: 18,
        minute: 0,
        repeats: true,
      },
    })
  }

  async function cancelAllScheduledNotifications() {
    return Notifications.cancelAllScheduledNotificationsAsync()
  }

  return {
    scheduleReminderNotification,
    cancelAllScheduledNotifications,
  }
}

export function useScheduleNotificationTrigger() {
  const { isSignedIn, isLoaded } = useUser()
  const { enabledPushNotifications } = useUserSettingsStore()
  const { scheduleReminderNotification, cancelAllScheduledNotifications } =
    useScheduleNotification()

  const triggerScheduleNotification = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync()
    if (status === 'granted') {
      await cancelAllScheduledNotifications()
      await scheduleReminderNotification()
    }
  }, [scheduleReminderNotification, cancelAllScheduledNotifications])

  useEffect(() => {
    if (!isLoaded) {
      return
    }
    if (isSignedIn && enabledPushNotifications) {
      triggerScheduleNotification()
    } else {
      cancelAllScheduledNotifications()
    }
  }, [
    isSignedIn,
    isLoaded,
    enabledPushNotifications,
    triggerScheduleNotification,
    cancelAllScheduledNotifications,
  ])
}

export function useNotificationObserver() {
  useEffect(() => {
    let isMounted = true

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url
      if (url) {
        router.push(url)
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return
      }
      redirect(response?.notification)
    })

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification)
      },
    )

    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [])
}
