const sqlite3 = require("sqlite3").verbose();

// const DBSOURCE = process.env.DB_NAME;
const DBSOURCE = "db.sqlite3";

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  }
});

// run query
function executeRunSQL(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      }
      resolve({
        changes: this.changes,
        lastID: this.lastID,
      });
    });
  });
}

// return all row
function executeAllSQL(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// return one row only
function executeGetSQL(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = {
  executeRunSQL,
  executeAllSQL,
  executeGetSQL,
};
