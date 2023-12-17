import { loadEosConfig } from "../config.js";
import { LOG } from "../log.js";
const commands = ["dev", "build", "create", "serve"];
const flags = ["--raw", "-R"];

async function entry(args: string[]) {
	const command = args[0]?.startsWith("-") ? undefined : args[0];
  /*
  * TODO: Detect if running in CI and enable raw automatically.
  */
	const raw = args.includes("--raw") || args.includes("-R");
  
  const eos = await loadEosConfig();
	if (!command && raw) {
		LOG.error("Invalid command.", "Raw mode specified, but no command given.");
    LOG.info("Valid commands with raw enabled are:", commands.join(", "));
		return;
	}
  if(!raw) {
    import("./cli.js").then((cli) => cli.default(eos.config!, command));
    return;
  }
  if(command && commands.includes(command) && raw) {
    LOG.fatal(command.toUpperCase(), "RAW, NOT IMPLEMENTED");
    return;
	}
  LOG.error("Invalid command", command);
  LOG.info("Valid commands are: " + commands.join(", "));
  return;
}

entry(process.argv.slice(2));
