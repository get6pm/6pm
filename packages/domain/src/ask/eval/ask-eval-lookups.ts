import type { EvalCase } from './ask-eval-score';

/** Lookups, merchants, categories, comparisons, trends, affordability, status, payday, bills. */

const lastWeekend = { from: '2026-10-10', to: '2026-10-11' } as const;

export const LOOKUP_CASES: readonly EvalCase[] = [
  // A. Spending lookups
  {
    group: 'A',
    question: 'hôm nay mình tiêu bao nhiêu rồi',
    want: { kind: 'spend', range: { preset: 'today' } },
  },
  {
    group: 'A',
    question: 'tuan nay xai het bao nhieu',
    want: { kind: 'spend', range: { preset: 'thisWeek' } },
  },
  {
    group: 'A',
    question: 'tháng này đốt hết mấy củ rồi',
    want: { kind: 'spend', range: { preset: 'thisMonth' } },
  },
  {
    group: 'A',
    question: 'hqua tiêu gì mà nhiều vậy',
    want: [
      { kind: 'list', range: { preset: 'yesterday' } },
      { kind: 'breakdown', range: { preset: 'yesterday' } },
    ],
  },
  { group: 'A', question: 'cuối tuần rồi tiêu bn', want: { kind: 'spend', range: lastWeekend } },
  {
    group: 'A',
    question: 'từ đầu kỳ lương tới giờ hết bao nhiêu',
    want: { kind: 'spend', range: { preset: 'thisCycle' } },
  },
  {
    group: 'A',
    question: 'How much have I spent today?',
    want: { kind: 'spend', range: { preset: 'today' } },
  },
  {
    group: 'A',
    question: 'What did I spend money on yesterday?',
    want: [
      { kind: 'list', range: { preset: 'yesterday' } },
      { kind: 'breakdown', range: { preset: 'yesterday' } },
    ],
  },
  {
    group: 'A',
    question: 'Total spending this month so far?',
    want: { kind: 'spend', range: { preset: 'thisMonth' } },
  },
  {
    group: 'A',
    question: 'How much did I spend last weekend?',
    want: { kind: 'spend', range: lastWeekend },
  },
  {
    group: 'A',
    question: 'Show me everything over 500k this week.',
    want: { kind: 'list', range: { preset: 'thisWeek' }, minAmount: 500_000 },
  },
  {
    group: 'A',
    question: 'What was my biggest purchase this month?',
    want: { kind: 'list', range: { preset: 'thisMonth' }, sort: 'amount' },
  },
  // B. Merchants
  {
    group: 'B',
    question: 'tháng này mua highland mấy lần rồi',
    want: [
      { kind: 'list', range: { preset: 'thisMonth' }, merchant: 'Highlands' },
      { kind: 'spend', range: { preset: 'thisMonth' }, merchant: 'Highlands' },
    ],
  },
  {
    group: 'B',
    question: 'grab hết bao nhiêu tiền tháng này',
    want: { kind: 'spend', range: { preset: 'thisMonth' }, merchant: 'Grab' },
  },
  {
    group: 'B',
    question: 'shopee tháng này bao nhiu',
    want: { kind: 'spend', range: { preset: 'thisMonth' }, merchant: 'Shopee' },
  },
  {
    group: 'B',
    question: 'lần cuối mua winmart là khi nào',
    want: { kind: 'list', merchant: 'WinMart' },
  },
  { group: 'B', question: 'quán nào mình hay ăn nhất', want: { kind: 'breakdown' } },
  {
    group: 'B',
    question: 'How much have I spent at Starbucks this month?',
    want: { kind: 'spend', range: { preset: 'thisMonth' }, merchant: 'Starbucks' },
  },
  { group: 'B', question: 'Which shop do I spend the most at?', want: { kind: 'breakdown' } },
  {
    group: 'B',
    question: 'How many Grab rides this week?',
    want: { kind: 'list', range: { preset: 'thisWeek' }, merchant: 'Grab' },
  },
  {
    group: 'B',
    question: 'When did I last buy from Shopee?',
    want: { kind: 'list', merchant: 'Shopee' },
  },
  {
    group: 'B',
    question: 'Average I spend per visit at Circle K?',
    want: 'gap',
  },
  // C. Categories
  {
    group: 'C',
    question: 'ăn uống tháng này hết bao nhiêu',
    want: { kind: 'spend', range: { preset: 'thisMonth' }, category: 'Ăn uống' },
  },
  {
    group: 'C',
    question: 'tien di lai thang nay',
    want: { kind: 'spend', range: { preset: 'thisMonth' }, category: 'Đi lại' },
  },
  {
    group: 'C',
    question: 'trà sữa tháng này tốn mấy lít rồi',
    want: { kind: 'spend', range: { preset: 'thisMonth' }, category: 'Trà sữa' },
  },
  { group: 'C', question: 'mua sắm có vượt không', want: 'gap' },
  { group: 'C', question: 'danh mục nào tiêu nhiều nhất', want: { kind: 'breakdown' } },
  {
    group: 'C',
    question: 'How much on food this week?',
    want: { kind: 'spend', range: { preset: 'thisWeek' }, category: 'Food' },
  },
  {
    group: 'C',
    question: "What's my biggest category this month?",
    want: { kind: 'breakdown', range: { preset: 'thisMonth' } },
  },
  { group: 'C', question: 'Am I over on shopping?', want: 'gap' },
  { group: 'C', question: 'How much goes to coffee per month on average?', want: 'gap' },
  {
    group: 'C',
    question: 'What share of my money goes to eating out?',
    want: { kind: 'breakdown' },
  },
  // D. Comparisons
  {
    group: 'D',
    question: 'tháng này so với tháng trước tiêu nhiều hơn k',
    want: { kind: 'compare', range: { preset: 'thisMonth' }, against: { preset: 'lastMonth' } },
  },
  {
    group: 'D',
    question: 'tuần này có tiết kiệm hơn tuần trước ko',
    want: { kind: 'compare', range: { preset: 'thisWeek' }, against: { preset: 'lastWeek' } },
  },
  {
    group: 'D',
    question: 'ăn ngoài tháng này vs tháng trước',
    want: {
      kind: 'compare',
      range: { preset: 'thisMonth' },
      against: { preset: 'lastMonth' },
      category: 'Ăn ngoài',
    },
  },
  {
    group: 'D',
    question: 'kỳ lương này có đỡ hơn kỳ trước không',
    want: { kind: 'compare', range: { preset: 'thisCycle' }, against: { preset: 'lastCycle' } },
  },
  {
    group: 'D',
    question: 'Am I spending more than last month?',
    want: { kind: 'compare', range: { preset: 'thisMonth' }, against: { preset: 'lastMonth' } },
  },
  {
    group: 'D',
    question: 'Compare this week with last week.',
    want: { kind: 'compare', range: { preset: 'thisWeek' }, against: { preset: 'lastWeek' } },
  },
  {
    group: 'D',
    question: 'Food this cycle vs last cycle?',
    want: {
      kind: 'compare',
      range: { preset: 'thisCycle' },
      against: { preset: 'lastCycle' },
      category: 'Food',
    },
  },
  {
    group: 'D',
    question: 'Did I spend less in September than August?',
    want: {
      kind: 'compare',
      range: { from: '2026-09-01', to: '2026-09-30' },
      against: { from: '2026-08-01', to: '2026-08-31' },
    },
  },
  // E. Trends and patterns
  { group: 'E', question: 'mình hay tiêu nhiều vào ngày nào trong tuần', want: 'gap' },
  { group: 'E', question: 'cuối tuần có tiêu nhiều hơn ngày thường k', want: 'gap' },
  { group: 'E', question: 'sao dạo này tiêu nhiều thế', want: { kind: 'breakdown' } },
  { group: 'E', question: 'chi tiêu 3 tháng gần đây tăng hay giảm', want: 'gap' },
  { group: 'E', question: 'Is my spending going up?', want: 'gap' },
  { group: 'E', question: 'What day of the week do I spend the most?', want: 'gap' },
  { group: 'E', question: 'Do I spend more late at night?', want: 'gap' },
  {
    group: 'E',
    question: 'Why was this week so expensive?',
    want: { kind: 'breakdown', range: { preset: 'thisWeek' } },
  },
  // F. Affordability
  {
    group: 'F',
    question: 'mua con iphone 30 củ được không',
    want: { kind: 'afford', amount: 30_000_000 },
  },
  {
    group: 'F',
    question: 'tối nay đi nhậu 500k có sao không',
    want: { kind: 'afford', amount: 500_000 },
  },
  { group: 'F', question: 'mai còn tiêu được bao nhiêu', want: { kind: 'today' } },
  { group: 'F', question: 'mình có đủ tiền đi đà lạt cuối tuần ko', want: { kind: 'weekend' } },
  {
    group: 'F',
    question: 'mua đôi giày 2tr thì đến lương còn sống nổi k',
    want: { kind: 'afford', amount: 2_000_000 },
  },
  {
    group: 'F',
    question: 'Can I afford a 1.5m dinner tonight?',
    want: { kind: 'afford', amount: 1_500_000 },
  },
  { group: 'F', question: 'How much can I spend today?', want: { kind: 'today' } },
  {
    group: 'F',
    question: 'If I buy this 8m laptop, what happens to my month?',
    want: { kind: 'afford', amount: 8_000_000 },
  },
  { group: 'F', question: 'Can I still go out this weekend?', want: { kind: 'weekend' } },
  {
    group: 'F',
    question: 'Is it okay to buy concert tickets for 3m?',
    want: { kind: 'afford', amount: 3_000_000 },
  },
  // G. How am I doing
  { group: 'G', question: 'tình hình tài chính của mình sao rồi', want: { kind: 'howAmIDoing' } },
  { group: 'G', question: 'tháng này ổn không', want: { kind: 'howAmIDoing' } },
  { group: 'G', question: 'mình đang on track không', want: { kind: 'howAmIDoing' } },
  { group: 'G', question: 'How am I doing this month?', want: { kind: 'howAmIDoing' } },
  { group: 'G', question: 'Am I on track?', want: { kind: 'howAmIDoing' } },
  {
    group: 'G',
    question: 'Give me a quick summary of this week.',
    want: [{ kind: 'howAmIDoing' }, { kind: 'breakdown', range: { preset: 'thisWeek' } }],
  },
  {
    group: 'G',
    question: 'Am I going to make it to payday?',
    want: [{ kind: 'howAmIDoing' }, { kind: 'today' }],
  },
  // H. Income and payday
  { group: 'H', question: 'còn mấy ngày nữa có lương', want: 'gap' },
  { group: 'H', question: 'tới lương còn bao nhiêu tiền', want: 'gap' },
  { group: 'H', question: 'lương tháng này về chưa', want: 'gap' },
  { group: 'H', question: "When's payday?", want: 'gap' },
  { group: 'H', question: 'How much do I have left until I get paid?', want: 'gap' },
  { group: 'H', question: 'How much did I earn last month?', want: 'gap' },
  // I. Bills and subscriptions
  { group: 'I', question: 'tháng này còn hoá đơn nào chưa trả', want: { kind: 'bills' } },
  { group: 'I', question: 'tiền điện tháng này bao nhiêu', want: { kind: 'bills' } },
  { group: 'I', question: 'mình đang đăng ký mấy cái app trả phí', want: 'gap' },
  { group: 'I', question: 'netflix spotify youtube cộng lại bao nhiêu', want: 'gap' },
  { group: 'I', question: 'tiền nhà hạn ngày mấy', want: { kind: 'bills' } },
  { group: 'I', question: 'What bills are due this week?', want: { kind: 'bills' } },
  { group: 'I', question: 'How much do I pay in subscriptions each month?', want: 'gap' },
  { group: 'I', question: 'Which subscriptions am I paying for?', want: 'gap' },
  { group: 'I', question: 'When is rent due?', want: { kind: 'bills' } },
];
