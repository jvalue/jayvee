import { registerMetaInformation } from '../meta-information/meta-inf-registry';

import { BlacklistConstraintMetaInformation } from './blacklist-constraint-meta-inf';
import { LengthConstraintMetaInformation } from './length-constraint-meta-inf';
import { RangeConstraintMetaInformation } from './range-constraint-meta-inf';
import { RegexConstraintMetaInformation } from './regex-constraint-meta-inf';
import { WhitelistConstraintMetaInformation } from './whitelist-constraint-meta-inf';

export function registerConstraints() {
  registerMetaInformation(WhitelistConstraintMetaInformation);
  registerMetaInformation(BlacklistConstraintMetaInformation);
  registerMetaInformation(RegexConstraintMetaInformation);
  registerMetaInformation(LengthConstraintMetaInformation);
  registerMetaInformation(RangeConstraintMetaInformation);
}
