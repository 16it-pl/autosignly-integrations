import { isNonEmptyString } from '@sniptt/guards';

import { type AppVariable } from 'src/front-components/types/application-variable.type';

export const shouldDisplayApplicationVariable = (
  variable: AppVariable,
): boolean => !variable.isDeprecated || isNonEmptyString(variable.value);
