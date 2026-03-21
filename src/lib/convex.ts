import { ConvexReactClient } from "convex/react";
import { env } from "@/config/env";

export const convex = env.convexUrl ? new ConvexReactClient(env.convexUrl) : null;
