import type { AuthPayload, UserDocument } from "../types";

export type GraphQLContext = {
  user: UserDocument | null;
  payload: AuthPayload | null;
};
