import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { useCompanionToast } from '../features/companion/use-companion-toast';
import { ForeignAlert } from '../features/scan/foreign-alert';
import { ScanAlert } from '../features/scan/scan-card';
import { scanColours } from '../features/scan/scan-colours';
import { ScanHandoff, ScanReturn } from '../features/scan/scan-handoff';
import { ScanPreview } from '../features/scan/scan-preview';
import { ScanViewfinder } from '../features/scan/scan-viewfinder';
import { useScan, type ScanPhase } from '../features/scan/use-scan';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { useToast } from '../ui/toast/toast-host';

const HINTS: Record<ScanPhase['kind'], 'camera' | 'blurry' | 'got' | null> = {
  camera: 'camera',
  unreadable: 'blurry',
  foreign: 'got',
  preview: 'got',
  handoff: null,
  return: null,
};

/** Scan to pay: point at a VietQR, check who and how much, and hand off to the user's bank. */
export default function Scan() {
  const router = useRouter();
  const { t } = useI18n();
  const say = useCompanionToast();
  const toast = useToast();
  const scan = useScan();
  const { phase } = scan;
  const [permission, requestPermission] = useCameraPermissions();
  // Simulator runs have no camera: a payload can be handed in to drive the rest of the flow.
  const { qr } = useLocalSearchParams<{ qr?: string }>();
  // One answer per return card: a second tap while the first is saving is ignored.
  const answering = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);
  useEffect(() => {
    if (__DEV__ && qr) scan.read(qr);
    // Only the payload the screen opened with.
  }, [qr]);

  const cameraOff = permission !== null && !permission.granted && !permission.canAskAgain;
  const looking = phase.kind === 'camera' && !cameraOff;
  const hint = HINTS[phase.kind];
  const typeIt = () => router.replace('/quick-add');

  return (
    <View style={{ flex: 1, backgroundColor: scanColours.page }}>
      <StatusBar style="light" animated />
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          active={phase.kind !== 'handoff' && phase.kind !== 'return'}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          {...(looking ? { onBarcodeScanned: (r: { data: string }) => scan.read(r.data) } : {})}
        />
      ) : null}
      <ScanViewfinder
        looking={looking}
        hint={hint === null || cameraOff ? '' : t(`scan.hint.${hint}`)}
        closeLabel={t('scan.close')}
        badge={t('scan.badge')}
        onClose={() => router.back()}
        typeInstead={looking ? { label: t('scan.typeInstead'), onPress: typeIt } : null}
      />
      {cameraOff && phase.kind === 'camera' ? (
        <ScanAlert
          icon="no_photography"
          title={t('scan.cameraOff.title')}
          body={t('scan.cameraOff.body')}
          secondary={{ label: t('scan.typeIt'), onPress: typeIt }}
          primary={{
            label: t('scan.cameraOff.settings'),
            onPress: () => void Linking.openSettings(),
          }}
        />
      ) : null}
      {phase.kind === 'unreadable' ? (
        <ScanAlert
          icon="qr_code_2"
          title={t('scan.unreadable.title')}
          body={t('scan.unreadable.body')}
          secondary={{ label: t('scan.typeIt'), onPress: typeIt }}
          primary={{ label: t('scan.tryAgain'), onPress: scan.retry }}
        />
      ) : null}
      {phase.kind === 'foreign' ? (
        <ForeignAlert
          phase={phase}
          onLog={typeIt}
          onRetry={scan.retry}
          onKeep={(rate, payee) => {
            if (answering.current) return;
            answering.current = true;
            scan
              .keepForeign(phase.failure, rate, payee)
              .then(() => {
                haptics.success();
                say('capture');
                router.back();
              })
              .catch(() => {
                answering.current = false;
                toast(t('scan.error.pay'));
              });
          }}
        />
      ) : null}
      {phase.kind === 'preview' && scan.options ? (
        <ScanPreview
          qr={phase.qr}
          payee={phase.payee}
          categoryId={phase.categoryId}
          options={scan.options}
          onPay={(amount, bank) => {
            scan.pay(phase, amount, bank).catch(() => {
              toast(t('scan.error.pay'));
            });
          }}
        />
      ) : null}
      {phase.kind === 'handoff' ? (
        <ScanHandoff payment={phase.payment} result={phase.result} onBack={scan.back} />
      ) : null}
      {phase.kind === 'return' ? (
        <ScanReturn
          payment={phase.payment}
          onAnswer={(answer) => {
            if (answering.current) return;
            answering.current = true;
            scan
              .answer(phase.payment, answer)
              .then(() => {
                if (answer === 'paid') say('capture');
              })
              .catch(() => {
                // The spend is already saved as pending, so leaving is safe: it waits in the inbox.
                toast(t('scan.error.answer'));
              })
              .finally(() => router.back());
          }}
        />
      ) : null}
    </View>
  );
}
