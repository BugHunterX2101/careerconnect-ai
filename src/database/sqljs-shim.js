/**
 * sql.js shim implementing the sqlite3 npm package callback API.
 * Sequelize's sqlite dialect calls: new Database(path, mode, cb), .run(), .all(), .get(), .each(), .close()
 * This shim wraps sql.js (pure WASM SQLite — no native bindings needed).
 */
'use strict';

const fs = require('fs');
const path = require('path');

// OPEN_ flags matching sqlite3 package constants
const OPEN_READONLY  = 1;
const OPEN_READWRITE = 2;
const OPEN_CREATE    = 4;

let _sqlJsPromise = null;

function getSqlJs() {
  if (!_sqlJsPromise) {
    _sqlJsPromise = require('sql.js')();
  }
  return _sqlJsPromise;
}

class Statement {
  constructor(db, sql) {
    this._db = db;
    this._sql = sql;
  }

  run(...args) {
    const [params, callback] = parseArgs(args);
    try {
      this._db._db.run(this._sql, params);
      if (callback) callback.call({ changes: this._db._db.getRowsModified(), lastID: 0 }, null);
    } catch (err) {
      if (callback) callback.call({}, err);
    }
    return this;
  }

  finalize(cb) {
    if (cb) cb(null);
  }
}

function parseArgs(args) {
  if (args.length === 0) return [{}, null];
  const last = args[args.length - 1];
  if (typeof last === 'function') {
    return [args.length > 1 ? normalizeParams(args[0]) : {}, last];
  }
  return [normalizeParams(args[0]) || {}, null];
}

function normalizeParams(p) {
  if (!p) return {};
  if (Array.isArray(p)) return p;
  if (typeof p === 'object') return p;
  return {};
}

class Database {
  constructor(storagePath, mode, callback) {
    // Handle overloads: (path, cb) or (path, mode, cb)
    if (typeof mode === 'function') { callback = mode; mode = OPEN_READWRITE | OPEN_CREATE; }
    this.filename = storagePath;
    this._db = null;
    this._ready = false;

    getSqlJs().then(SQL => {
      try {
        let data = null;
        if (storagePath !== ':memory:' && fs.existsSync(storagePath)) {
          data = fs.readFileSync(storagePath);
        }
        this._db = new SQL.Database(data || null);
        this._db.run('PRAGMA journal_mode=WAL;');
        this._db.run('PRAGMA foreign_keys=ON;');
        this._ready = true;
        this._persistPath = storagePath !== ':memory:' ? storagePath : null;
        if (callback) callback.call(this, null);
      } catch (err) {
        if (callback) callback.call(this, err);
      }
    }).catch(err => {
      if (callback) callback.call(this, err);
    });
  }

  _persist() {
    if (this._persistPath && this._db) {
      try {
        const data = this._db.export();
        const buf = Buffer.from(data);
        fs.mkdirSync(path.dirname(this._persistPath), { recursive: true });
        fs.writeFileSync(this._persistPath, buf);
      } catch (_) { /* best-effort */ }
    }
  }

  run(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = {}; }
    params = normalizeParams(params) || {};
    try {
      this._db.run(sql, params);
      const changes = this._db.getRowsModified();
      // Get last inserted row id for INSERT statements
      let lastID = 0;
      if (/^\s*INSERT/i.test(sql)) {
        try {
          const res = this._db.exec('SELECT last_insert_rowid() AS lid');
          if (res && res[0] && res[0].values && res[0].values[0]) {
            lastID = res[0].values[0][0] || 0;
          }
        } catch (_) { /* ignore */ }
      }
      // Persist on writes
      if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql)) this._persist();
      if (callback) callback.call({ changes, lastID, sql }, null);
    } catch (err) {
      if (callback) callback.call({ sql }, err);
    }
    return this;
  }

  get(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = {}; }
    params = normalizeParams(params) || {};
    try {
      const stmt = this._db.prepare(sql);
      stmt.bind(params);
      let row = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      if (callback) callback.call(this, null, row);
    } catch (err) {
      if (callback) callback.call(this, err);
    }
    return this;
  }

  all(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = {}; }
    params = normalizeParams(params) || {};
    try {
      const results = [];
      const stmt = this._db.prepare(sql);
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      if (callback) callback.call(this, null, results);
    } catch (err) {
      if (callback) callback.call(this, err);
    }
    return this;
  }

  each(sql, params, rowCallback, doneCallback) {
    if (typeof params === 'function') {
      doneCallback = rowCallback;
      rowCallback = params;
      params = {};
    }
    params = normalizeParams(params) || {};
    try {
      const stmt = this._db.prepare(sql);
      stmt.bind(params);
      let count = 0;
      while (stmt.step()) {
        rowCallback(null, stmt.getAsObject());
        count++;
      }
      stmt.free();
      if (doneCallback) doneCallback(null, count);
    } catch (err) {
      if (doneCallback) doneCallback(err);
    }
    return this;
  }

  prepare(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = {}; }
    const stmt = new Statement(this, sql);
    if (callback) callback.call(this, null, stmt);
    return stmt;
  }

  exec(sql, callback) {
    try {
      this._db.exec(sql);
      this._persist();
      if (callback) callback.call(this, null);
    } catch (err) {
      if (callback) callback.call(this, err);
    }
    return this;
  }

  close(callback) {
    try {
      this._persist();
      if (this._db) {
        this._db.close();
        this._db = null;
      }
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }

  serialize(callback) { if (callback) callback(); }
  parallelize(callback) { if (callback) callback(); }
}

// Replicate the sqlite3 module's top-level exports
module.exports = {
  Database,
  Statement,
  OPEN_READONLY,
  OPEN_READWRITE,
  OPEN_CREATE,
  // verbose() returns the same module (sqlite3 API)
  verbose() { return module.exports; }
};
