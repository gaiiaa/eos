import { useEffect, useRef, useState } from "react";
import { render, useInput, useApp, Box, Text, useStdin, Spacer } from "ink";
import { ScrollContainer } from "./ScrollContainer.js";
import { Screen, awaitableProcess, runCommand, useForceRefresh, useScreenSize } from "./tools.js";
import { create } from "zustand";
import { Eos } from "../config.js";
import { match } from "../tools.js";
import * as cmd from "child_process";
import { appendFile } from "fs/promises";

/*
	Home: depending on existance of eos project, give option to create a new project or run other commands
	Create (project): Project creation wizard
	Create (component): Component creation wizard
	Dev: Start dev server
	Build: Build project
	Build Summary: Summary of build
	Preview: Preview project
\
*/
enum Routes {
	Home,
	Dev,
	Build,
	PostBuild,
	ProjectStats,
	Preview,
	CreateProject,
	CreateComponent,
}

const useStore = create<{
	route: Routes;
	projectName?: string;
	branch?: string;
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
		case Routes.CreateComponent:
		default:
			return <Box />;
	}
}

function Home() {
	return <Text>Home</Text>;
}

function Dev() {
	const lines = useRef<React.ReactNode[]>([]);
	const store = useStore();
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
						∃os
						</Text>
						<Text> · </Text>
						<Text color="cyanBright" bold>
							Dev
						</Text>
						<Text> · </Text>
						<Text>{store.projectName}</Text>
						<Text> · </Text>
						<Text>⎇ {store.branch?.trim()}</Text>
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
								<Box>
									<Text>b</Text>
									<Text dimColor>uild</Text>
								</Box>
								<Box>
									<Text>c</Text>
									<Text dimColor>reate</Text>
								</Box>
								<Box>
									<Text>p</Text>
									<Text dimColor>review</Text>
								</Box>
								<Box>
									<Text>s</Text>
									<Text dimColor>tats</Text>
								</Box>
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
							<Text bold color="cyanBright">
								Info
							</Text>
						</Box>
					)}
				</Box>
			</Box>
		</Screen>
	);
}

export default async function entry(eos: Eos, command?: string) {
	const route =
		match(
			command,
			["dev", Routes.Dev],
			["build", Routes.Build],
			["create", Routes.CreateProject]
		) ?? Routes.Home;
	const projectName = process.cwd();
	let branch = await runCommand("git branch --show-current");
	useStore.setState({ route, projectName, branch});
	render(<App />);
}
