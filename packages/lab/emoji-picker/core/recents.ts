export function addRecent(recents: Array<string>, hexcode: string, limit: number) {
	return [hexcode, ...recents.filter((recent) => recent !== hexcode)].slice(0, limit);
}
