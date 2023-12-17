import * as c12 from "c12"


export interface Eos {
  mode: "dev" | "prod"
}

export function loadEosConfig(){
  return c12.loadConfig<Eos>({
    configFile: "eos.config",
    defaultConfig: {
      mode: "dev",
    }
  })
}