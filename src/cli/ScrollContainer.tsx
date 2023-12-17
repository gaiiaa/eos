import { useInput, Box, measureElement, useStdin } from "ink";
import React, { ReactNode } from "react";

export function ScrollContainer(props: {
	height?: number;
	children: React.ReactNode;
}) {
	const [scroll, setScroll] = React.useState(0);

	const outerRef = React.useRef<ReactNode>(null);
	const innerRef = React.useRef<ReactNode>(null);



	useInput((_input, key) => {
		const innerHeight = measureElement(innerRef.current).height;
		const outerHeight = props.height ?? measureElement(outerRef.current).height;
		if (key.downArrow) {
			setScroll(Math.max(0, scroll - 1));
		}
		if (key.upArrow) {
			setScroll(Math.min(Math.max(0, innerHeight - outerHeight), scroll + 1));
		}
	});

	return (
		<Box
			flexDirection="column"
			height={props.height ?? "100%"}
			overflow="hidden"
			justifyContent="flex-end"
			ref={outerRef}
		>
			<Box
				flexDirection="column"
				ref={innerRef}
				flexShrink={0}
				marginBottom={-scroll}
			>
				{props.children}
			</Box>
		</Box>
	);
}
