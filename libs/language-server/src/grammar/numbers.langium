import 'terminals'

SignedInteger returns number:
  ('+'|'-')? INTEGER;

SignedDecimal returns number:
  ('+'|'-')? DECIMAL;

SignedNumber returns number:
  SignedInteger | SignedDecimal;