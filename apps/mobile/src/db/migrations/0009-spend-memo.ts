/**
 * A captured spend keeps the transfer's own words its bank printed ("Nội dung: Thanh toan the tin
 * dung"), apart from the user's note: the close reads them to ask whether it paid a bill.
 */
export const sql = `
  ALTER TABLE spends ADD COLUMN memo TEXT;
`;
