import { requireNativeView, requireOptionalNativeModule } from 'expo';
import type { ComponentType, Ref } from 'react';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

/**
 * One recognised line of a receipt, as Vision read it (box origin bottom left, normalised); Android
 * hands ML Kit's lines over in the same convention.
 */
export interface ScannedLine {
  readonly text: string;
  readonly box?: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  readonly confidence?: number;
}

/** A receipt read on this iPhone: the paper cut out and squared up, its lines, a copy to send. */
export interface ScannedReceipt {
  readonly kind: 'receipt';
  /** The cut-out receipt, a `file://` JPEG in the caches. */
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  /** Whether the paper's edges were found; else the whole photo was read. */
  readonly cut: boolean;
  readonly lines: readonly ScannedLine[];
  /** A JPEG for the server's closer look, base64; null when none fits its limit. */
  readonly photo: string | null;
}

/** What a picture from Photos turned out to be. */
export type PickedImage = ScannedReceipt | { readonly kind: 'code'; readonly data: string };

/**
 * Where the live view sees the receipt: four corners `[x0, y0, …, x3, y3]` (top left, top right,
 * bottom right, bottom left), normalised in the upright frame with the origin top left; empty when
 * it is gone. `aspect` is the frame's width over its height.
 */
export interface ReceiptSighting {
  readonly corners: readonly number[];
  readonly aspect: number;
}

export interface ScanCameraHandle {
  /** Takes the photo and reads the receipt in it; `seen` is where the live view last saw it. */
  capture(seen: readonly number[] | null): Promise<ScannedReceipt>;
}

export interface ScanCameraViewProps extends ViewProps {
  readonly ref?: Ref<ScanCameraHandle>;
  readonly active: boolean;
  readonly facing: 'back' | 'front';
  readonly torch: boolean;
  /** Look for receipts as well as QR codes. */
  readonly receipts: boolean;
  readonly onCode: (event: NativeSyntheticEvent<{ readonly data: string }>) => void;
  readonly onReceipt: (event: NativeSyntheticEvent<ReceiptSighting>) => void;
  readonly onRunning?: (event: NativeSyntheticEvent<{ readonly running: boolean }>) => void;
}

interface ScanCameraNative {
  readImage(uri: string): Promise<PickedImage>;
  pickImage(): Promise<PickedImage | null>;
}

/**
 * Scan's reader (`modules/scan-camera/ios` and `android`): a picture read as a QR code or a
 * receipt, or null where it is not built in: tests, and the web.
 */
export const scanCamera = requireOptionalNativeModule<ScanCameraNative>('ScanCamera');

/** The live camera that finds QR codes and receipts, or null where it is not built in. */
export const ScanCameraView: ComponentType<ScanCameraViewProps> | null = scanCamera
  ? requireNativeView<ScanCameraViewProps>('ScanCamera')
  : null;
