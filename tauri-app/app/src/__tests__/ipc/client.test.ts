import { describe,it,expect } from "vitest";
import { RpcClientError } from "../../ipc/client";
describe("ipc client",()=>{it("has structured errors",()=>{expect(new RpcClientError({code:-32603,message:"x"}).message).toBe("x");});});
