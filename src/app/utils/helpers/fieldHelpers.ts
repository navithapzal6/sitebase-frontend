 
import { Option } from "@/app/utils/helpers/fieldTypes";

export const normalizeOptions = (
  options?: Option[] | string[]
): Option[] => {
  if (!options) return [];

  // string[] support
  if (typeof options[0] === "string") {
    return (options as string[]).map((item) => ({
      label: item,
      value: item,
    }));
  }

  // Option[] support
  return options as Option[];
};
 
