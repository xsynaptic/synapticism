import KeyvSqlite from '@keyv/sqlite';
import Keyv from 'keyv';
import path from 'node:path';

export { hash } from 'ohash';

export function getSqliteCacheInstance(cachePath: string, namespace: string): Keyv {
	return new Keyv({
		namespace,
		store: new KeyvSqlite({
			busyTimeout: 10_000,
			table: 'cache',
			uri: `sqlite://${path.join(cachePath, `${namespace}.sqlite`)}`,
		}),
	});
}
