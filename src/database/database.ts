import { createConnection } from "mongoose";
import { knex } from "knex";
import type { Knex } from "knex";
import type { Connection } from "mongoose";

interface DataBaseOptions {
  db: string;
  connection: {
    host: string;
    port: number;
    user?: string;
    password?: string;
    database: string;
  }
  pool?: { min: number, max: number },
  acquireConnectionTimeout?: number
}

type DataBaseClient = Knex | Connection | null;

/**
 * 连接数据库
 * @description
 * 现已支持的数据库: MySQL, PostgreSQL, MongoDB
 * 
 * `DataBase` 结合了 Knex 和 Mongoose，更多详细的文档可参考：
 * {@link https://knexjs.org/|Knex 官网}、{@link https://mongoosejs.com/|Mongoose 官网}
 * 
 * @example
 * ```ts
 * const db = new DataBase({
 *  db: "pg",
 *  connection: {
 *     host: "localhost",
 *     user: "root",
 *     password: "password",
 *     port: 3306,
 *     database: "myapp_test"
 *  }
 * });
 * 
 * await db.connect();
 * 
 * const dbClient = db.getClient();
 * dbClient('users').where('id', 1).first();
 * ```
 */
export class DataBase {
  private _db: 'mongodb' | 'mysql' | 'pg';
  private _client: DataBaseClient = null;
  private _config: DataBaseOptions;

  constructor(options: DataBaseOptions) {
    const { db } = options;

    if (!["mysql", "pg", "mongodb"].includes(db)) {
      throw new Error(`Unsupported database type: ${db}`);
    }

    this._config = {
      db,
      // connection: options.connection,
      connection: {
        host: options.connection.host,
        port: options.connection.port,
        user: options.connection.user || '',
        password: options.connection.password || '',
        database: options.connection.database,
      },
      pool: options?.pool || { min: 2, max: 10 },
      acquireConnectionTimeout: options.acquireConnectionTimeout || 10000,
    };

    this._db = db as 'mongodb' | 'mysql' | 'pg';
  }

  /**
   * Connect to the database
   */
  public async connect() {
    switch (this._db) {
      case 'mysql':
        this._client = knex({
          client: 'mysql2',
          connection: {
            host: this._config.connection.host,
            port: this._config.connection.port,
            user: this._config.connection.user,
            password: this._config.connection.password,
            database: this._config.connection.database,
          },
          pool: {
            min: this._config.pool?.min,
            max: this._config.pool?.max,
          },
          acquireConnectionTimeout: this._config.acquireConnectionTimeout,
        });
        console.log('Connected to MySQL');
        break;

      case 'pg':
        this._client = knex({
          client: 'pg',
          connection: {
            host: this._config.connection.host,
            port: this._config.connection.port,
            user: this._config.connection.user,
            password: this._config.connection.password,
            database: this._config.connection.database,
          },
          pool: {
            min: this._config.pool?.min,
            max: this._config.pool?.max,
          },
          acquireConnectionTimeout: this._config.acquireConnectionTimeout,
        });
        console.log('Connected to PostgreSQL');
        break;

      case 'mongodb':
        const uri = `mongodb://${this._config.connection.host}:${this._config.connection.port}/${this._config.connection.database}`;
        try {
          const connection = createConnection(uri);
          this._client = connection;
          console.log("Connected to MongoDB");
        } catch (error) {
          console.error("Failed to connect to MongoDB", error);
          throw error;
        }
        break;

      default:
        throw new Error(`Unsupported database type: ${this._db}`);
    }
  }

  get db() {
    return this._db;
  }

  get client(): DataBaseClient {
    return this._client;
  }
}