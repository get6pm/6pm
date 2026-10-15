import type { ImageSourcePropType } from 'react-native';

import abb from '../../../assets/banks/abb.png';
import acb from '../../../assets/banks/acb.png';
import bab from '../../../assets/banks/bab.png';
import bidv from '../../../assets/banks/bidv.png';
import bvb from '../../../assets/banks/bvb.png';
import cake from '../../../assets/banks/cake.png';
import cbb from '../../../assets/banks/cbb.png';
import cimb from '../../../assets/banks/cimb.png';
import citibank from '../../../assets/banks/citibank.png';
import coopbank from '../../../assets/banks/coopbank.png';
import dbs from '../../../assets/banks/dbs.png';
import eib from '../../../assets/banks/eib.png';
import gpb from '../../../assets/banks/gpb.png';
import hdb from '../../../assets/banks/hdb.png';
import hlbvn from '../../../assets/banks/hlbvn.png';
import hsbc from '../../../assets/banks/hsbc.png';
import ibkHcm from '../../../assets/banks/ibk-hcm.png';
import ibkHn from '../../../assets/banks/ibk-hn.png';
import icb from '../../../assets/banks/icb.png';
import ivb from '../../../assets/banks/ivb.png';
import kbank from '../../../assets/banks/kbank.png';
import klb from '../../../assets/banks/klb.png';
import lpb from '../../../assets/banks/lpb.png';
import mafc from '../../../assets/banks/mafc.png';
import mb from '../../../assets/banks/mb.png';
import mbv from '../../../assets/banks/mbv.png';
import momo from '../../../assets/banks/momo.png';
import msb from '../../../assets/banks/msb.png';
import nab from '../../../assets/banks/nab.png';
import ncb from '../../../assets/banks/ncb.png';
import ocb from '../../../assets/banks/ocb.png';
import pbvn from '../../../assets/banks/pbvn.png';
import pgb from '../../../assets/banks/pgb.png';
import pvcb from '../../../assets/banks/pvcb.png';
import pvdb from '../../../assets/banks/pvdb.png';
import scb from '../../../assets/banks/scb.png';
import scvn from '../../../assets/banks/scvn.png';
import seab from '../../../assets/banks/seab.png';
import sgicb from '../../../assets/banks/sgicb.png';
import shb from '../../../assets/banks/shb.png';
import shbvn from '../../../assets/banks/shbvn.png';
import stb from '../../../assets/banks/stb.png';
import tcb from '../../../assets/banks/tcb.png';
import timo from '../../../assets/banks/timo.png';
import tpb from '../../../assets/banks/tpb.png';
import ubank from '../../../assets/banks/ubank.png';
import uob from '../../../assets/banks/uob.png';
import vab from '../../../assets/banks/vab.png';
import vba from '../../../assets/banks/vba.png';
import vbsp from '../../../assets/banks/vbsp.png';
import vcb from '../../../assets/banks/vcb.png';
import vccb from '../../../assets/banks/vccb.png';
import vib from '../../../assets/banks/vib.png';
import vietbank from '../../../assets/banks/vietbank.png';
import vikki from '../../../assets/banks/vikki.png';
import vnptmoney from '../../../assets/banks/vnptmoney.png';
import vpb from '../../../assets/banks/vpb.png';
import vrb from '../../../assets/banks/vrb.png';
import vtlmoney from '../../../assets/banks/vtlmoney.png';
import wvn from '../../../assets/banks/wvn.png';
import zalopay from '../../../assets/banks/zalopay.png';

/**
 * Each bank and wallet's logo, keyed by its VietQR code, bundled with the app. Most are the
 * App Store icon of the bank's own app (the picture people know from their home screen); banks
 * with no app 6pm could match use their logo from VietQR's bank list, fitted on white. Banks with
 * neither, or whose logo is a long wordmark that cannot be read this small, draw a monogram.
 * 120 px squares, colour-quantised; fetched 2026-10-14.
 */
export const BANK_LOGOS: Readonly<Record<string, ImageSourcePropType>> = {
  ABB: abb,
  ACB: acb,
  BAB: bab,
  BIDV: bidv,
  BVB: bvb,
  CAKE: cake,
  CBB: cbb,
  CIMB: cimb,
  CITIBANK: citibank,
  COOPBANK: coopbank,
  DBS: dbs,
  EIB: eib,
  GPB: gpb,
  HDB: hdb,
  HLBVN: hlbvn,
  HSBC: hsbc,
  'IBK-HCM': ibkHcm,
  'IBK-HN': ibkHn,
  ICB: icb,
  IVB: ivb,
  KBANK: kbank,
  KLB: klb,
  LPB: lpb,
  MAFC: mafc,
  MB: mb,
  MBV: mbv,
  MOMO: momo,
  MSB: msb,
  NAB: nab,
  NCB: ncb,
  OCB: ocb,
  PBVN: pbvn,
  PGB: pgb,
  PVCB: pvcb,
  PVDB: pvdb,
  SCB: scb,
  SCVN: scvn,
  SEAB: seab,
  SGICB: sgicb,
  SHB: shb,
  SHBVN: shbvn,
  STB: stb,
  TCB: tcb,
  TIMO: timo,
  TPB: tpb,
  UBANK: ubank,
  UOB: uob,
  VAB: vab,
  VBA: vba,
  VBSP: vbsp,
  VCB: vcb,
  VCCB: vccb,
  VIB: vib,
  VIETBANK: vietbank,
  VIKKI: vikki,
  VNPTMONEY: vnptmoney,
  VPB: vpb,
  VRB: vrb,
  VTLMONEY: vtlmoney,
  WVN: wvn,
  ZALOPAY: zalopay,
};
