import { context45001 } from './context'
import { leadership45001 } from './leadership'
import { planning45001 } from './planning'
import { support45001 } from './support'
import { operation45001 } from './operation'
import { performance45001 } from './performance'
import { improvement45001 } from './improvement'
import type { Clause } from '../../types'

export const iso45001Clauses: Clause[] = [
  ...context45001,
  ...leadership45001,
  ...planning45001,
  ...support45001,
  ...operation45001,
  ...performance45001,
  ...improvement45001
]
