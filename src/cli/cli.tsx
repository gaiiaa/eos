import { useEffect, useRef, useState } from "react";
import { render, useInput, useApp, Box, Text, useStdin, Spacer } from "ink";
import { ScrollContainer } from "./ScrollContainer.js";
import { Screen, useForceRefresh, useScreenSize } from "./tools.js";
import { create } from "zustand";
import { Eos } from "../config.js";
import { match } from "../tools.js";
import * as cmd from "child_process";
import { appendFile } from "fs/promises";
import { error } from "console";

enum Routes {
	Home = "home",
	Dev = "dev",
	Build = "build",
	Create = "create",
}

const useStore = create<{
	route: Routes;
	setRoute: (route: Routes) => void;
}>((set) => ({
	route: Routes.Home,
	setRoute: (route) => set({ route }),
}));

function App() {
	const store = useStore();
	const { exit } = useApp();

	useInput((input, key) => {
		if (input === "q") {
			exit();
		}
	});

	switch (store.route) {
		case Routes.Home:
			return <Home />;
		case Routes.Dev:
			return <Dev />;
		case Routes.Build:
		case Routes.Create:
		default:
			return <Box />;
	}
}

function Home() {
	return <Text>Home</Text>;
}

function Dev() {
	const lines = useRef<React.ReactNode[]>([]);
	const stream = useStdin();
	const refresh = useForceRefresh();
	const screen = useScreenSize();
	const [showCommands, setShowCommands] = useState(false);
	const errorMessage = useRef<string | null>(null);
	const isInErrorState =
		// @ts-expect-error
		lines.current[lines.current.length - 1]?.props?.color === "red";
	const showSidebar = screen.width > 80;

	useInput((input, key) => {
		if (input === "?" || input === "h") {
			setShowCommands(!showCommands);
		}
	});

	useEffect(() => {
		const process = cmd.spawn("pnpm", ["run", "browser"]);
		const addLog = (data: string) => {
			if (errorMessage.current) errorMessage.current = null;
			lines.current.push(<Text>{data.toString()}</Text>);
			refresh();
		};
		const addErrLog = (data: string) => {
			if (!errorMessage.current)
				errorMessage.current = data
					.toString()
					.substring(0, data.toString().indexOf("\n"));

			lines.current.push(<Text color="red">{data.toString()}</Text>);
			refresh();
		};
		process.stdout.on("data", addLog);
		process.stdout.on("error", addErrLog);
		process.stderr.on("data", addErrLog);
		process.stderr.on("error", addErrLog);
		return () =>
			void (process.kill(),
			process.stdout.off("data", addLog),
			process.stderr.off("data", addErrLog),
			process.stderr.off("error", addErrLog),
			process.stdout.off("error", addErrLog));
	}, []);

	return (
		<Screen>
			<Box height="100%" width="100%" flexDirection="column" paddingTop={1}>
				<Box paddingX={2} flexDirection="row" justifyContent="space-between">
					<Box flexDirection="row">
						<Text color="green" bold>
							Eos
						</Text>
						<Text> : </Text>
						<Text color="cyanBright" bold>
							Dev
						</Text>
						<Text> : </Text>
						<Text>my-project-name</Text>
					</Box>
					{!showSidebar && <Text>Lint: Passing</Text>}
				</Box>
				<Box flexDirection="row">
					<Box
						height="100%"
						width="100%"
						borderColor={isInErrorState ? "red" : "green"}
						borderStyle={"round"}
						flexDirection="column"
						justifyContent="flex-end"
						alignItems="flex-start"
						paddingX={1}
					>
						{errorMessage.current && (
							<Box borderStyle={"classic"} borderColor={"red"}>
								<Text color="red" bold>
									{errorMessage.current}
								</Text>
							</Box>
						)}
						<ScrollContainer>
							{lines.current.map((line, i) => (
								<>{line}</>
							))}
						</ScrollContainer>
						{!!showCommands && (
							<Box
								width="100%"
								flexDirection="row"
								justifyContent="space-around"
							>
								<Text dimColor>{"c - create"}</Text>
								<Text dimColor>{"b - build"}</Text>
								<Text dimColor>{"p - preview"}</Text>
							</Box>
						)}
					</Box>
					{!!showSidebar && (
						<Box
							width={35}
							paddingX={1}
							borderColor="green"
							borderStyle={"round"}
						>
							<Text italic bold color="cyanBright">
								Info
							</Text>
						</Box>
					)}
				</Box>
			</Box>
		</Screen>
	);
}

export default function entry(eos: Eos, command?: string) {
	const route =
		match(
			command,
			["dev", Routes.Dev],
			["build", Routes.Build],
			["create", Routes.Create]
		) ?? Routes.Home;
	useStore.setState({ route });
	render(<App />);
}
