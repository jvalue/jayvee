import { registerConstraintMetaInformation } from '../meta-information/meta-inf-util';

import { BlacklistConstraintMetaInformation } from './blacklist-constraint-meta-inf';
import { LengthConstraintMetaInformation } from './length-constraint-meta-inf';
import { RangeConstraintMetaInformation } from './range-constraint-meta-inf';
import { RegexConstraintMetaInformation } from './regex-constraint-meta-inf';
import { WhitelistConstraintMetaInformation } from './whitelist-constraint-meta-inf';

export function registerConstraints() {
  registerConstraintMetaInformation(new WhitelistConstraintMetaInformation());
  registerConstraintMetaInformation(new BlacklistConstraintMetaInformation());
  registerConstraintMetaInformation(new RegexConstraintMetaInformation());
  registerConstraintMetaInformation(new LengthConstraintMetaInformation());
  registerConstraintMetaInformation(new RangeConstraintMetaInformation());
}
