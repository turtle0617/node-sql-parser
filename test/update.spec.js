const { expect } = require('chai');
const Parser = require('../src/parser').default

describe('update', () => {
    const parser = new Parser();

    it('should parse baisc usage', () => {
      const { tableList, columnList, ast } = parser.parse('UPDATE a set id = 1');
      expect(tableList).to.eql(["update::null::a"]);
      expect(columnList).to.eql(["update::null::id"]);
      expect(ast.type).to.be.eql('update');
      expect(ast.table).to.be.eql([{
        "db": null,
        "table": "a",
        "as": null
     }]);
      expect(ast.set).to.eql([{
        column: 'id',
        table: null,
        value: {
          type: 'number',
          value: 1
        }
      }]);
      expect(ast.where).to.be.null;
    });

    it('should parse baisc usage', () => {
      const { tableList, columnList, ast } = parser.parse('UPDATE a set a.id = 1');
      expect(tableList).to.eql(["update::null::a"]);
      expect(columnList).to.eql(["update::a::id"]);
      expect(ast.type).to.be.eql('update');
      expect(ast.table).to.be.eql([{
        "db": null,
        "table": "a",
        "as": null
     }]);
      expect(ast.set).to.eql([{
        column: 'id',
        table: 'a',
        value: {
          type: 'number',
          value: 1
        }
      }]);
      expect(ast.where).to.be.null;
    });

    it('should parse function expression', () => {
      const { tableList, columnList, ast } = parser.parse("UPDATE t SET col1 = concat(name, '名字')");
      expect(tableList).to.eql(["update::null::t"]);
      expect(columnList).to.eql(["select::null::name", "update::null::col1"]);
      expect(ast.type).to.be.eql('update');
      expect(ast.table).to.be.eql([
        {
          "db": null,
          "table": "t",
          "as": null
       }
      ]);
      expect(ast.set).to.eql([
        {
          column: "col1",
          table: null,
          value: {
            type: "function",
            name: "concat",
            args: {
              type: "expr_list",
              value: [
                {
                  type: "column_ref",
                  table: null,
                  column: "name"
                },
                {
                  type: "string",
                  value: "名字"
                }
              ]
            }
          }
        }
     ]);
    expect(ast.where).to.be.null;
    });

    it('should parser set is null', () => {
      const set =  [
        {
          "column": "id",
          "table": null
        }
      ]
      const value = {
        "type": "number",
        "value": 1
      }
      const ast = {
        "type": "update",
        "table": [
          {
            "db": null,
            "table": "a",
            "as": null
          }
        ],
        "where": null
      }
      expect(parser.sqlify(ast)).to.be.equal('UPDATE `a`')
      ast.set = []
      expect(parser.sqlify(ast)).to.be.equal('UPDATE `a` SET ')
      ast.set = set
      expect(parser.sqlify(ast)).to.be.equal('UPDATE `a` SET `id`')
      set[0].value = value
      expect(parser.sqlify(ast)).to.be.equal('UPDATE `a` SET `id` = 1')
    })

    it('should parse cross-table update', () => {
      const { tableList, columnList, ast } = parser.parse("UPDATE Reservations r JOIN Train t ON (r.Train = t.TrainID) SET t.Capacity = t.Capacity + r.NoSeats WHERE r.ReservationID = 12");
      expect(tableList).to.eql([
        "update::null::Reservations",
        "update::null::Train"
     ]);
      expect(columnList).to.eql([
        "select::Reservations::Train",
        "select::Train::TrainID",
        "select::Train::Capacity",
        "select::Reservations::NoSeats",
        "select::Reservations::ReservationID",
        "update::Train::Capacity"
     ]);
      expect(ast.type).to.be.eql('update');
      expect(ast.table).to.be.eql([
        {
           "db": null,
           "table": "Reservations",
           "as": "r"
        },
        {
           "db": null,
           "table": "Train",
           "as": "t",
           "join": "INNER JOIN",
           "on": {
              "type": "binary_expr",
              "operator": "=",
              "left": {
                 "type": "column_ref",
                 "table": "r",
                 "column": "Train"
              },
              "right": {
                 "type": "column_ref",
                 "table": "t",
                 "column": "TrainID"
              },
              "parentheses": true
           }
        }
     ]);
      expect(ast.set).to.eql([
        {
           "column": "Capacity",
           "value": {
              "type": "binary_expr",
              "operator": "+",
              "left": {
                 "type": "column_ref",
                 "table": "t",
                 "column": "Capacity"
              },
              "right": {
                 "type": "column_ref",
                 "table": "r",
                 "column": "NoSeats"
              }
           },
           "table": "t"
        }
     ]);
    expect(ast.where).to.be.eql({
      "type": "binary_expr",
      "operator": "=",
      "left": {
        "type": "column_ref",
        "table": "r",
        "column": "ReservationID"
      },
      "right": {
        "type": "number",
        "value": 12
      }
    });
  })
});
