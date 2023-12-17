import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, useInput, useStdout } from "ink";

export const useScreenSize = () => {
  const { stdout } = useStdout();
  const getSize = useCallback(
    () => ({
      height: stdout.rows,
      width: stdout.columns,
    }),
    [stdout],
  );
  const [size, setSize] = useState(getSize);

  useEffect(() => {
    const onResize = () => setSize(getSize());
    stdout.on("resize", onResize);
    return () => void stdout.off("resize", onResize);
  }, [stdout, getSize]);

  return size;
};

export const Screen = ({ children }: {children: React.ReactNode}) => {
  const { height, width } = useScreenSize();
  const { stdout } = useStdout();

  useMemo(() => stdout.write("\x1b[?1049h"), [stdout]);
  useEffect(() => () => void stdout.write("\x1b[?1049l"), [stdout]);
  useInput(() => {});

  return <Box height={height} width={width}>{children}</Box>;
};

export const useForceRefresh = () => {
  const [, update] = useState(0);
  return () => update((n) => n + 1);
}
