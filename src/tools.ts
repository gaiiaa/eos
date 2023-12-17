export const match = <T, R>(
	value: T,
	...matchers: Array<[unknown, R]>
): R | undefined => {
	for (const matcher of matchers) {
		const result =
			typeof matcher[0] === "function"
				? matcher[0](value)
				: matcher[0] === value;
		if (result) {
			return matcher[1];
		}
	}
	return undefined;
};
