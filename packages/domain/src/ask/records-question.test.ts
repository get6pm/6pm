import { describe, expect, it } from 'vitest';

import { asksTheirRecords } from './records-question';

describe('asksTheirRecords', () => {
  it.each([
    'How much did I spend last weekend?',
    'Average I spend per visit at Circle K?',
    'Am I over on shopping?',
    'How much goes to coffee per month on average?',
    'Did I spend less in September than August?',
    'Is my spending going up?',
    'What day of the week do I spend the most?',
    'Do I spend more late at night?',
    "When's payday?",
    'How much do I have left until I get paid?',
    'How much did I earn last month?',
    'How much do I pay in subscriptions each month?',
    'Which subscriptions am I paying for?',
    'How much do I owe on BNPL?',
    "Why does it say I'm over?",
    'What if I stopped ordering delivery?',
    'What if I spend 500k less on shopping?',
    'Where did my money go this week?',
    'tháng này mình tiêu bao nhiêu cho cà phê',
    'mình còn bao nhiêu tiền',
    'khi nào nhận lương',
    'nếu mình bỏ trà sữa thì sao',
    'sao mình tiêu nhiều vậy',
    'mình đang nợ bao nhiêu',
    'cuối tuần rồi tiêu bn',
    'mua sắm có vượt không',
    'còn mấy ngày nữa có lương',
    'lương tháng này về chưa',
    'mình đang đăng ký mấy cái app trả phí',
    'netflix spotify youtube cộng lại bao nhiêu',
    'sao tổng tháng này sai vậy',
  ])('keeps "%s" on the phone', (question) => {
    expect(asksTheirRecords(question)).toBe(true);
  });

  it.each([
    "What's the 50/30/20 rule?",
    'What is compound interest?',
    "What's the difference between a savings account and a term deposit?",
    'How do I get out of credit card debt?',
    'Should I pay off my credit card first or save?',
    'What does a 0% instalment really cost?',
    'How do I stop spending so much on food?',
    'Tips to save more this month?',
    'How big should my emergency fund be?',
    'Is buy now pay later a good idea?',
    'Is it better to rent or buy?',
    'How does a credit score work?',
    'How do I save for a holiday?',
    'lãi kép là gì',
    'quỹ khẩn cấp nên có bao nhiêu',
    'gửi tiết kiệm 100tr 12 tháng lãi 5% thì được bao nhiêu',
    'làm sao để tiết kiệm hơn khi lương 12tr',
    'trả góp 0% có thật sự miễn phí không',
    'lạm phát là gì',
    'thẻ tín dụng trả tối thiểu có sao không',
    'có nên mua iphone trả góp 0% không',
  ])('lets the model explain "%s"', (question) => {
    expect(asksTheirRecords(question)).toBe(false);
  });
});
