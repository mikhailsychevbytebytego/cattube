import type { Route } from "next";

export function adminPath(path: string): Route {
  return path as Route;
}
