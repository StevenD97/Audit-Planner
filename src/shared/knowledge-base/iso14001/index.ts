import { context14001 } from './context'
import { leadership14001 } from './leadership'
import { planning14001 } from './planning'
import { support14001 } from './support'
import { operation14001 } from './operation'
import { performance14001 } from './performance'
import { improvement14001 } from './improvement'
import type { Clause } from '../../types'

export const iso14001Clauses: Clause[] = [
  ...context14001,
  ...leadership14001,
  ...planning14001,
  ...support14001,
  ...operation14001,
  ...performance14001,
  ...improvement14001
]
