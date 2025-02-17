import { exprToSQL, getExprListSQL } from './expr'
import { columnsToSQL } from './column'
import { withToSql } from './with'
import { tablesToSQL } from './tables'
import { hasVal, commonOptionConnector, connector } from './util'

/**
 * @param {Object}      stmt
 * @param {?Array}      stmt.with
 * @param {?Array}      stmt.options
 * @param {?string}     stmt.distinct
 * @param {?Array|string}   stmt.columns
 * @param {?Array}      stmt.from
 * @param {?Object}     stmt.where
 * @param {?Array}      stmt.groupby
 * @param {?Object}     stmt.having
 * @param {?Array}      stmt.orderby
 * @param {?Array}      stmt.limit
 * @return {string}
 */

function selectToSQL(stmt) {
  const { with: withInfo, options, distinct, columns, from, where, groupby, having, orderby, limit } = stmt
  const clauses = [withToSql(withInfo), 'SELECT']
  if (Array.isArray(options)) clauses.push(options.join(' '))
  clauses.push(distinct, columnsToSQL(columns, from))
  // FROM + joins
  clauses.push(commonOptionConnector('FROM', tablesToSQL, from))
  clauses.push(commonOptionConnector('WHERE', exprToSQL, where))
  clauses.push(connector('GROUP BY', getExprListSQL(groupby).join(', ')))
  clauses.push(commonOptionConnector('HAVING', exprToSQL, having))
  if (Array.isArray(orderby)) {
    const orderExpressions = orderby.map(expr => `${exprToSQL(expr.expr)} ${expr.type}`)
    clauses.push(connector('ORDER BY', orderExpressions.join(', ')))
  }
  if (Array.isArray(limit)) clauses.push(connector('LIMIT', limit.map(exprToSQL)))
  return clauses.filter(hasVal).join(' ')
}

export {
  selectToSQL,
}
