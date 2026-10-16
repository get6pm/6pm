import {
  billQuestion,
  REPAYMENT,
  type CloseEvent,
  type CloseState,
  type SpendRow,
} from '@6pm/domain';

import { useBillPayments } from '../../data/bill-payments';
import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { WorkQuestionStep } from './close-work-question';

/**
 * "Is this your {bill}?", or "Paying off a card or loan?" when no bill matches: the close's
 * question card about a spend that looks like a bill's payment. Yes marks the bill paid this cycle
 * and keeps the spend out of the daily number; no keeps it as spending and the bill is not asked
 * about again this cycle.
 */
export function BillQuestionStep({
  state,
  queue,
  dispatch,
  run,
}: {
  readonly state: CloseState;
  readonly queue: readonly SpendRow[];
  readonly dispatch: (event: CloseEvent) => void;
  readonly run: (task: () => Promise<unknown>) => Promise<boolean>;
}) {
  const snap = useMoney();
  const { t, language } = useI18n();
  const payments = useBillPayments();
  const card = billQuestion(state);
  const spend = card ? queue.find((s) => s.id === card.id) : undefined;
  if (!card || !spend || card.askBill === undefined) return null;
  const bill =
    card.askBill === REPAYMENT ? undefined : snap.bills.find((b) => b.id === card.askBill);
  const time = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(spend.at));
  const persona = snap.plan?.persona ?? 'soft';

  const answer = (paid: boolean) => {
    haptics.tap();
    if (paid) void run(() => payments.setPaysBill(spend.id, bill ? bill.id : REPAYMENT));
    else if (bill) void run(() => payments.billAsked(bill.id));
    dispatch({ type: 'answerBill', id: card.id, paid });
  };

  return (
    <WorkQuestionStep
      key={card.id}
      line={
        snap.plan?.serious
          ? null
          : t(`companion.billQuestion.${persona}` as 'companion.billQuestion.soft')
      }
      receiptLine={{ time, name: spend.merchant, amount: spend.amount }}
      title={bill ? t('close.bill.title', { bill: bill.name }) : t('close.repayment.title')}
      sub={
        bill
          ? t(bill.kind === 'card' ? 'close.bill.subCard' : 'close.bill.sub')
          : t('close.repayment.sub')
      }
      yes={
        bill
          ? t(bill.kind === 'card' ? 'close.bill.yesCard' : 'close.bill.yes')
          : t('close.repayment.yes')
      }
      no={t('close.bill.no')}
      onAnswer={answer}
    />
  );
}
