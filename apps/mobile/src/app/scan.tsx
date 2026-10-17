import { useCameraPermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { paperInk } from '@6pm/theme';

import {
  scanCamera,
  ScanCameraView,
  type PickedImage,
  type ReceiptSighting,
  type ScanCameraHandle,
} from '../../modules/scan-camera';
import { useCompanionToast } from '../features/companion/use-companion-toast';
import { ProppedHint, ProppedTop } from '../features/duo/propped-scan';
import { ForeignAlert } from '../features/scan/foreign-alert';
import { ReceiptCard } from '../features/scan/receipt-card';
import {
  MIN_SHARE,
  nextSteadiness,
  quadOnView,
  quadShare,
  readyToTake,
  STEADY_MS,
  unsteady,
} from '../features/scan/receipt-outline';
import { ScanAlert } from '../features/scan/scan-card';
import { scanColours } from '../features/scan/scan-colours';
import { ScanHandoff, ScanReturn } from '../features/scan/scan-handoff';
import { restingQuad } from '../features/scan/scan-outline';
import { ScanPreview } from '../features/scan/scan-preview';
import { FRAME, ScanViewfinder, type Seeing } from '../features/scan/scan-viewfinder';
import { useReceiptScan } from '../features/scan/use-receipt-scan';
import { useScan, type ScanPhase } from '../features/scan/use-scan';
import { useSwipeBack } from '../features/scan/use-swipe-back';
import { useI18n } from '../i18n/i18n';
import { useHomeCurrency } from '../money/use-money-format';
import { haptics } from '../ui/haptics';
import { useDesignInsets } from '../ui/layout/design-insets';
import { useFold, useFoldForm } from '../ui/layout/fold';
import { useToast } from '../ui/toast/toast-host';

/** How long the seller's green receipt stays up after the payment is marked paid. */
const PAID_HOLD_MS = 1500;
/** In a sheet the close button's row sits under the grabber. */
const SHEET_TOP = 18;
/** The corners follow the paper between sightings, a tenth of a second apart. */
const follow = { duration: 130, easing: Easing.linear };
const settle = { duration: 260, easing: Easing.bezier(0.2, 0.9, 0.2, 1) };

const QR_HINTS: Record<ScanPhase['kind'], 'camera' | 'blurry' | 'got' | null> = {
  camera: 'camera',
  unreadable: 'blurry',
  foreign: 'got',
  preview: 'got',
  handoff: null,
  return: null,
};

/**
 * Scan: point at a VietQR to pay it from a bank app, or at a receipt to log it. A QR is read the
 * moment it is seen; a receipt is outlined as it is found and taken once held still (or with the
 * shutter), cut out, read on this iPhone, and shown on a card to check and save. A picture from
 * Photos is read the same way. It is a sheet, pulled down to close; where it fills the screen (the
 * iPhone Duo) it is swiped right to close.
 */
export default function Scan() {
  const router = useRouter();
  const { t } = useI18n();
  const say = useCompanionToast();
  const toast = useToast();
  const scan = useScan();
  const receipt = useReceiptScan();
  const home = useHomeCurrency();
  const { phase } = scan;
  const [permission, requestPermission] = useCameraPermissions();
  // Simulator runs have no camera: a payload or a picture can be handed in to drive the flow.
  const { qr, photo } = useLocalSearchParams<{ qr?: string; photo?: string }>();
  // One answer per return card: a second tap while the first is saving is ignored.
  const answering = useRef(false);
  // The iPhone Duo standing on a counter: the inner camera on the top half, the rest below.
  const form = useFoldForm();
  const stand = form.kind === 'stand' ? form : null;
  // A phone with a hinge shows Scan full screen (see the root layout); every other, in a sheet.
  const inSheet = useFold().snapshot.hinge === 'unknown';
  const insets = useSafeAreaInsets();
  const design = useDesignInsets();
  const top = inSheet ? SHEET_TOP : design.top(60);
  const [paidShown, setPaidShown] = useState(false);
  const [torch, setTorch] = useState(false);
  const [running, setRunning] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const camera = useRef<ScanCameraHandle>(null);

  // The frame's corners, where the receipt is, and how long it has been held still.
  const rest = restingQuad(size.width, top + 152, FRAME);
  const quad = useSharedValue<number[]>(rest);
  const seen = useSharedValue(0);
  const steady = useSharedValue(0);
  const flash = useSharedValue(0);
  const steadiness = useRef(unsteady);
  const lastCorners = useRef<readonly number[] | null>(null);
  // A receipt in view: close enough to read, or too far.
  const [inView, setInView] = useState<'near' | 'far' | null>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);
  useEffect(() => {
    if (__DEV__ && qr) scan.read(qr);
    // Only the payload the screen opened with.
  }, [qr]);

  const receiptIdle = receipt.phase.kind === 'idle';
  const cameraOff = permission !== null && !permission.granted && !permission.canAskAgain;
  const looking = phase.kind === 'camera' && receiptIdle && !cameraOff;
  const busy = phase.kind === 'handoff' || phase.kind === 'return';
  const typeIt = () => router.replace('/quick-add');

  /** Puts the corners back on the square frame. */
  const letGo = useCallback(() => {
    steadiness.current = unsteady;
    lastCorners.current = null;
    quad.set(withTiming(rest, settle));
    seen.set(withTiming(0, settle));
    steady.set(withTiming(0, settle));
    setInView(null);
    // `rest` changes only with the layout.
  }, [quad, seen, steady, rest[0], rest[1]]);

  useEffect(() => {
    // The frame moves with the layout until a receipt is in view.
    if (steadiness.current.quad === null) quad.set(rest);
  }, [quad, rest[0], rest[1]]);

  const shoot = useCallback(() => {
    const handle = camera.current;
    if (!handle) return;
    haptics.tap();
    flash.set(withSequence(withTiming(0.85, { duration: 60 }), withTiming(0, { duration: 340 })));
    steady.set(withTiming(1, { duration: 120 }));
    const seenAt = lastCorners.current;
    void receipt.take(() => handle.capture(seenAt));
  }, [receipt, flash, steady]);

  const onReceipt = useCallback(
    ({ corners, aspect }: ReceiptSighting) => {
      if (!looking || size.width === 0) return;
      const before = steadiness.current;
      const now = Date.now();
      const onView =
        corners.length === 8 ? quadOnView(corners, aspect, size.width, size.height) : null;
      const next = nextSteadiness(before, onView, now);
      if (next.quad === null) {
        if (before.quad !== null) letGo();
        return;
      }
      steadiness.current = next;
      // A stray sighting leaves the outline and the countdown where they are.
      if (onView === null || next.strays > 0) return;
      lastCorners.current = corners;
      quad.set(withTiming([...onView], before.quad === null ? settle : follow));
      if (before.quad === null) {
        seen.set(withTiming(1, settle));
        haptics.tick();
      }
      setInView(quadShare(onView, size.width, size.height) >= MIN_SHARE ? 'near' : 'far');
      if (next.since !== before.since) {
        steady.set(0);
        steady.set(withTiming(1, { duration: STEADY_MS, easing: Easing.linear }));
      }
      if (readyToTake(next, now, size.width, size.height)) shoot();
    },
    [looking, size, letGo, quad, seen, steady, shoot],
  );

  // Leaving the camera (a code read, a card up) puts the corners back for the next look.
  useEffect(() => {
    if (!looking && receipt.phase.kind !== 'reading' && steadiness.current.quad !== null) letGo();
  }, [looking, receipt.phase.kind, letGo]);

  const openPicked = useCallback(
    (picked: PickedImage | null) => {
      if (picked === null) return;
      if (picked.kind === 'code') scan.read(picked.data);
      else if (picked.lines.length === 0 && !picked.cut) toast(t('scan.photo.none'));
      else void receipt.show(picked);
    },
    [scan, receipt, toast, t],
  );

  useEffect(() => {
    if (!__DEV__ || !photo || !scanCamera) return;
    scanCamera
      .readImage(photo)
      .then(openPicked)
      .catch(() => toast(t('scan.photo.none')));
    // Only the picture the screen opened with.
  }, [photo]);

  const pickPhoto = () => {
    if (!scanCamera) return;
    scanCamera
      .pickImage()
      .then(openPicked)
      .catch(() => toast(t('scan.photo.none')));
  };

  const swipeBack = useSwipeBack({
    width: size.width,
    enabled: !inSheet && !busy,
    onDismissed: () => router.back(),
  });
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));

  const seeing: Seeing =
    inView || !receiptIdle
      ? 'receipt'
      : phase.kind === 'preview' || phase.kind === 'foreign'
        ? 'code'
        : null;
  const hint = cameraOff
    ? ''
    : receipt.phase.kind === 'reading'
      ? t('scan.hint.reading')
      : inView
        ? t(inView === 'near' ? 'scan.hint.receipt' : 'scan.hint.closer')
        : QR_HINTS[phase.kind] === null || !receiptIdle
          ? ''
          : t(`scan.hint.${QR_HINTS[phase.kind] ?? 'camera'}`);

  const cameraView =
    permission?.granted && ScanCameraView ? (
      <ScanCameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        active={!busy && receipt.phase.kind !== 'card'}
        facing={stand ? 'front' : 'back'}
        torch={torch && !stand}
        receipts={!stand && looking}
        onCode={(e) => {
          if (looking) scan.read(e.nativeEvent.data);
        }}
        onReceipt={(e) => onReceipt(e.nativeEvent)}
        onRunning={(e) => setRunning(e.nativeEvent.running)}
      />
    ) : null;

  const sheets = (
    <>
      {cameraOff && phase.kind === 'camera' && receiptIdle ? (
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
      {receipt.phase.kind === 'failed' ? (
        <ScanAlert
          icon="receipt_long"
          title={t('scan.receipt.failed.title')}
          body={t('scan.receipt.failed.body')}
          secondary={{ label: t('scan.typeIt'), onPress: typeIt }}
          primary={{ label: t('scan.tryAgain'), onPress: receipt.retake }}
        />
      ) : null}
      {receipt.phase.kind === 'card' ? (
        <ReceiptCard
          top={top}
          receipt={receipt.phase.receipt}
          card={receipt.phase.card}
          looking={receipt.phase.looking}
          onRetake={receipt.retake}
          onSave={(edits) => {
            if (answering.current) return;
            answering.current = true;
            receipt
              .save(edits)
              .then((outcome) => {
                if (outcome === 'empty') return;
                if (outcome === 'saved') {
                  haptics.success();
                  say('capture');
                } else {
                  toast(t('scan.receipt.already'));
                }
                router.back();
              })
              .catch(() => toast(t('scan.error.save')))
              .finally(() => {
                answering.current = false;
              });
          }}
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
        <ScanHandoff payment={phase.payment} handoff={phase.handoff} onBack={scan.back} />
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
              .finally(() => {
                // Standing, the seller sees the green receipt for a moment before it closes.
                if (stand && answer === 'paid') {
                  setPaidShown(true);
                  setTimeout(() => router.back(), PAID_HOLD_MS);
                } else router.back();
              });
          }}
        />
      ) : null}
    </>
  );

  // A payment under way is answered before Scan can be pulled away.
  const options = <Stack.Screen options={{ gestureEnabled: !busy }} />;

  if (stand) {
    return (
      <View style={{ flex: 1, backgroundColor: scanColours.page }}>
        {options}
        <StatusBar style="light" animated />
        <ProppedTop
          half={stand.top}
          camera={cameraView}
          looking={looking}
          payment={phase.kind === 'handoff' || phase.kind === 'return' ? phase.payment : null}
          paid={paidShown}
          closeLabel={t('scan.close')}
          onClose={() => router.back()}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: stand.bottom.y,
            height: stand.bottom.height,
            backgroundColor: paperInk.sheet,
          }}
        >
          {looking ? <ProppedHint typeLabel={t('scan.typeInstead')} onType={typeIt} /> : null}
          {sheets}
        </View>
      </View>
    );
  }

  return (
    <GestureDetector gesture={swipeBack.swipe}>
      <Animated.View
        style={[{ flex: 1, backgroundColor: scanColours.page }, swipeBack.style]}
        onLayout={(e: LayoutChangeEvent) => {
          const { width, height } = e.nativeEvent.layout;
          setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
        }}
      >
        {options}
        <StatusBar style="light" animated />
        {cameraView}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: scanColours.onGlass }, flashStyle]}
        />
        {receipt.phase.kind === 'card' ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: scanColours.handoffVeil }]}
          />
        ) : null}
        <ScanViewfinder
          top={top}
          bottom={insets.bottom}
          looking={looking}
          seeing={seeing}
          hint={hint}
          caption={home.code === 'VND' && looking ? t('scan.badge') : null}
          labels={{
            close: t('scan.close'),
            qr: t('scan.mode.qr'),
            receipt: t('scan.mode.receipt'),
            light: t('scan.light'),
            photos: t('scan.photos'),
            shutter: t('scan.shutter'),
            type: t('scan.typeInstead'),
          }}
          quad={quad}
          seen={seen}
          steady={steady}
          torch={torch}
          canShoot={running && looking}
          onClose={() => router.back()}
          onTorch={() => {
            haptics.tick();
            setTorch((on) => !on);
          }}
          onPhotos={pickPhoto}
          onShutter={shoot}
          onType={typeIt}
          grabber={inSheet}
          frame={looking || receipt.phase.kind === 'reading'}
        />
        {sheets}
      </Animated.View>
    </GestureDetector>
  );
}
